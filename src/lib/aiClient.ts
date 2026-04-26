import type { AiProvider, AiReviewIssue, AiReviewResult, ContextOptions, DocName, HealthTone, ImproveAction, ProjectState, SpecChange, SpecHealth } from "../types";
import { listSpecFiles, readOptionalFile } from "./filesystem";

export function normalizeChangeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function generateAiDraft(
  idea: string,
  project: ProjectState,
  provider: AiProvider,
): Promise<{ id: string; summary: string; docs: Record<DocName, string>; source: "local" | AiProvider; model?: string }> {
  const context = {
    projectName: project.name,
    projectMd: project.handle ? await readOptionalFile(project.handle, ["openspec", "project.md"]) : "",
    readme: project.handle ? await readOptionalFile(project.handle, ["README.md"]) : "",
    existingChanges: project.changes.map((change) => change.id),
  };

  try {
    const response = await fetch("/api/generate-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea, context, provider }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json();
    return {
      id: normalizeChangeId(data.id || idea),
      summary: String(data.summary || idea),
      docs: normalizeDocs(data.docs, idea),
      source: isAiProvider(data.source) ? data.source : provider,
      model: data.model,
    };
  } catch (error) {
    console.warn(error);
    return {
      id: normalizeChangeId(idea),
      summary: idea,
      docs: buildDraftDocs(idea),
      source: "local",
    };
  }
}

export async function improveChangeWithAi(
  action: ImproveAction,
  change: SpecChange,
  project: ProjectState,
  options: ContextOptions,
  provider: AiProvider,
): Promise<{ summary: string; docs: Record<DocName, string>; source: "local" | AiProvider; model?: string }> {
  const context = await buildAiContext(project, change, options);

  try {
    const response = await fetch("/api/improve-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, change, context, provider }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json();
    return {
      summary: String(data.summary || change.summary),
      docs: normalizeDocs(data.docs, change.summary),
      source: isAiProvider(data.source) ? data.source : provider,
      model: data.model,
    };
  } catch (error) {
    console.warn(error);
    return {
      summary: change.summary,
      docs: buildLocalImprovement(action, change),
      source: "local",
    };
  }
}

export async function reviewChangeWithAi(
  change: SpecChange,
  project: ProjectState,
  options: ContextOptions,
  provider: AiProvider,
  health: SpecHealth,
): Promise<AiReviewResult> {
  const context = await buildAiContext(project, change, options);

  try {
    const response = await fetch("/api/review-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change, context, health, provider }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json();
    return {
      summary: String(data.summary || "Review complete."),
      issues: normalizeReviewIssues(data.issues),
      suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String).slice(0, 6) : [],
      source: isAiProvider(data.source) ? data.source : provider,
      model: data.model,
    };
  } catch (error) {
    console.warn(error);
    return buildLocalReview(health);
  }
}

async function buildAiContext(project: ProjectState, selectedChange: SpecChange | undefined, options: ContextOptions) {
  let existingSpecs: string[] = [];

  if (project.handle && options.existingSpecs) {
    try {
      const specsDir = await project.handle.getDirectoryHandle("openspec").then((openspec) => openspec.getDirectoryHandle("specs"));
      existingSpecs = await listSpecFiles(specsDir);
    } catch {
      existingSpecs = [];
    }
  }

  return {
    projectName: project.name,
    projectMd: project.handle && options.projectMd ? await readOptionalFile(project.handle, ["openspec", "project.md"]) : "",
    readme: project.handle && options.readme ? await readOptionalFile(project.handle, ["README.md"]) : "",
    existingChanges: options.existingChanges ? project.changes.map((change) => change.id) : [],
    existingSpecs,
    currentChange: options.currentChange ? selectedChange : undefined,
  };
}

function buildDraftDocs(idea: string): Record<DocName, string> {
  const title = idea.trim() || "Describe the change";
  return {
    "proposal.md": `# Proposal\n\n## Why\n\n${title}\n\n## What Changes\n\n- Add the smallest useful workflow around this idea.\n- Keep the behavior local-first and reviewable.\n\n## Impact\n\nThis change should be easy to validate from the OpenSpec files and the running app.\n`,
    "design.md": `# Design\n\n## Approach\n\nImplement the change as a focused vertical slice. Prefer existing project conventions and keep file-system writes explicit.\n\n## States\n\n- Empty project\n- Existing OpenSpec project\n- Draft generated\n- Validation warning\n`,
    "tasks.md": `# Tasks\n\n- [ ] Confirm the intended behavior\n- [ ] Update the relevant implementation files\n- [ ] Add or adjust validation\n- [ ] Run the project checks\n`,
  };
}

function buildLocalReview(health: SpecHealth): AiReviewResult {
  const missing = health.checks.filter((check) => !check.passed).slice(0, 4);

  return {
    summary: health.summary,
    issues: missing.map((check) => ({
      title: check.label,
      detail: check.detail,
      severity: check.tone,
    })),
    suggestions: missing.map((check) => check.detail),
    source: "local",
  };
}

function normalizeReviewIssues(value: unknown): AiReviewIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 6).map((item) => {
    const issue = item as Partial<{ title: string; detail: string; severity: string }>;
    return {
      title: String(issue.title || "Review note"),
      detail: String(issue.detail || ""),
      severity: isHealthTone(issue.severity) ? issue.severity : "warning",
    };
  });
}

function isHealthTone(value: unknown): value is HealthTone {
  return value === "good" || value === "warning" || value === "danger";
}

function buildLocalImprovement(action: ImproveAction, change: SpecChange): Record<DocName, string> {
  const docs = { ...change.docs };

  if (action === "split-tasks") {
    docs["tasks.md"] = `${docs["tasks.md"].trim()}\n\n## Suggested Breakdown\n\n- [ ] Confirm acceptance criteria\n- [ ] Implement the smallest safe change\n- [ ] Update validation and edge cases\n- [ ] Run checks and document results\n`;
  }

  if (action === "add-risks") {
    docs["design.md"] = `${docs["design.md"].trim()}\n\n## Risks\n\n- The change may be broader than the current OpenSpec draft describes.\n- Existing behavior should be verified before implementation.\n\n## Mitigations\n\n- Keep the first implementation slice narrow.\n- Validate against existing changes and specs before archiving.\n`;
  }

  if (action === "concrete-design") {
    docs["design.md"] = `${docs["design.md"].trim()}\n\n## Implementation Notes\n\n- Identify the files and modules touched by this change.\n- Keep user-visible behavior behind explicit validation.\n- Prefer existing project patterns over new abstractions.\n`;
  }

  if (action === "improve-proposal") {
    docs["proposal.md"] = `${docs["proposal.md"].trim()}\n\n## Acceptance Criteria\n\n- The intended behavior is clear to reviewers.\n- The scope is small enough to implement and validate in one slice.\n- Risks or migration concerns are called out before implementation.\n`;
  }

  if (action === "summarize") {
    docs["proposal.md"] = `${docs["proposal.md"].trim()}\n\n## Summary\n\nThis change should clarify the desired outcome, implementation scope, and validation path before code changes begin.\n`;
  }

  return docs;
}

async function readApiError(response: Response) {
  try {
    const payload = await response.json();
    return payload.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

function normalizeDocs(value: unknown, idea: string): Record<DocName, string> {
  if (!value || typeof value !== "object") {
    return buildDraftDocs(idea);
  }

  const docs = value as Partial<Record<DocName, string>>;
  return {
    "proposal.md": typeof docs["proposal.md"] === "string" ? docs["proposal.md"] : buildDraftDocs(idea)["proposal.md"],
    "design.md": typeof docs["design.md"] === "string" ? docs["design.md"] : buildDraftDocs(idea)["design.md"],
    "tasks.md": typeof docs["tasks.md"] === "string" ? docs["tasks.md"] : buildDraftDocs(idea)["tasks.md"],
  };
}

function isAiProvider(value: unknown): value is AiProvider {
  return value === "openrouter" || value === "anthropic" || value === "openai";
}
