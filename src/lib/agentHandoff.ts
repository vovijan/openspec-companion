import type { AiReviewResult, Locale, SpecChange, SpecHealth } from "../types";

type HandoffInput = {
  change: SpecChange | undefined;
  health: SpecHealth | undefined;
  locale: Locale;
  projectName: string;
  review: AiReviewResult | undefined;
};

export function buildAgentHandoffPrompt({ change, health, locale, projectName, review }: HandoffInput) {
  if (!change) {
    return "";
  }

  const branchName = `codex/${change.id}`;
  const healthSummary = health
    ? [
        `Score: ${health.score}%`,
        `Summary: ${health.summary}`,
        ...health.checks.map((check) => `- [${check.passed ? "x" : " "}] ${check.label}: ${check.detail}`),
      ].join("\n")
    : "Spec Health was not available.";
  const reviewSummary = review
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

  return [
    `# Implementation Handoff: ${change.id}`,
    "",
    "## Goal",
    change.summary,
    "",
    "## Project",
    `- Name: ${projectName}`,
    `- Suggested branch: ${branchName}`,
    "",
    "## Instructions For The Agent",
    "- Implement only the scope described in this OpenSpec change.",
    "- Prefer existing project patterns and keep edits focused.",
    "- Update tests or validation where the change affects behavior.",
    "- Do not archive the OpenSpec change unless explicitly asked.",
    "- Report what changed and which checks were run.",
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
