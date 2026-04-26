import type { AiReviewResult, HandoffTemplate, Locale, SpecChange, SpecHealth } from "../types";

export type HandoffHistoryItem = {
  id: string;
  changeId: string;
  createdAt: number;
  prompt: string;
  template: HandoffTemplate;
};

type HandoffInput = {
  change: SpecChange | undefined;
  health: SpecHealth | undefined;
  includeReview: boolean;
  locale: Locale;
  projectName: string;
  review: AiReviewResult | undefined;
  template: HandoffTemplate;
};

export function buildAgentHandoffPrompt({ change, health, includeReview, locale, projectName, review, template }: HandoffInput) {
  if (!change) {
    return "";
  }

  const branchName = `codex/${change.id}`;
  const templateLabel = template === "claude" ? "Claude Code" : "Codex";
  const healthSummary = health
    ? [
        `Score: ${health.score}%`,
        `Summary: ${health.summary}`,
        ...health.checks.map((check) => `- [${check.passed ? "x" : " "}] ${check.label}: ${check.detail}`),
      ].join("\n")
    : "Spec Health was not available.";
  const reviewSummary = !includeReview
    ? locale === "ru"
      ? "AI-ревью намеренно исключено из handoff. Работай строго по OpenSpec-документам и Spec Health."
      : "AI review was intentionally excluded from this handoff. Work from the OpenSpec docs and Spec Health only."
    : review
    ? [
        `Summary: ${review.summary}`,
        review.issues.length
          ? ["Issues:", ...review.issues.map((issue) => `- [${issue.severity}] ${issue.title}: ${issue.detail}`)].join("\n")
          : "Issues: none",
        review.suggestions.length
          ? ["Suggestions:", ...review.suggestions.map((suggestion) => `- ${suggestion}`)].join("\n")
          : "Suggestions: none",
      ].join("\n\n")
    : locale === "ru"
      ? "AI-ревью еще не запускалось. Используй Spec Health и документы ниже как основной контекст."
      : "AI review has not been run yet. Use Spec Health and the documents below as the main context.";
  const instructions = template === "claude"
    ? [
        "- Use this handoff as the implementation brief for Claude Code.",
        "- Inspect the repository before editing and follow existing conventions.",
        "- Implement only the scope described in this OpenSpec change.",
        "- Keep changes small, reviewable, and aligned with the tasks.",
        "- Run relevant checks and summarize results.",
        "- Do not archive the OpenSpec change unless explicitly asked.",
      ]
    : [
        "- Use this handoff as the implementation brief for Codex.",
        "- Read the relevant files before editing and preserve unrelated user changes.",
        "- Implement only the scope described in this OpenSpec change.",
        "- Prefer existing project patterns and keep edits focused.",
        "- Update tests or validation where the change affects behavior.",
        "- Report what changed and which checks were run.",
        "- Do not archive the OpenSpec change unless explicitly asked.",
      ];

  return [
    `# Implementation Handoff: ${change.id}`,
    "",
    "## Target Agent",
    templateLabel,
    "",
    "## Goal",
    change.summary,
    "",
    "## Project",
    `- Name: ${projectName}`,
    `- Suggested branch: ${branchName}`,
    "",
    "## Instructions For The Agent",
    ...instructions,
    "",
    "## Spec Health",
    healthSummary,
    "",
    "## AI Review",
    reviewSummary,
    "",
    "## proposal.md",
    "```markdown",
    change.docs["proposal.md"].trim(),
    "```",
    "",
    "## design.md",
    "```markdown",
    change.docs["design.md"].trim(),
    "```",
    "",
    "## tasks.md",
    "```markdown",
    change.docs["tasks.md"].trim(),
    "```",
  ].join("\n");
}

export function createHandoffHistoryItem(changeId: string, prompt: string, template: HandoffTemplate): HandoffHistoryItem {
  return {
    id: `${Date.now()}-${changeId}-${template}`,
    changeId,
    createdAt: Date.now(),
    prompt,
    template,
  };
}
