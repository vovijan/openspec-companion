import type { AiProvider, ContextOptions, DocName, ImproveAction, TranslationKey } from "./types";

export const docNames: DocName[] = ["proposal.md", "design.md", "tasks.md"];

export const aiProviders: Array<{ id: AiProvider; label: string; defaultModel: string }> = [
  { id: "openai", label: "OpenAI", defaultModel: "gpt-5.4-mini" },
  { id: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-sonnet-4" },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-20250514" },
];

export const improveActions: Array<{ id: ImproveAction; label: TranslationKey }> = [
  { id: "improve-proposal", label: "aiImprove" },
  { id: "concrete-design", label: "concreteDesign" },
  { id: "split-tasks", label: "splitTasks" },
  { id: "add-risks", label: "addRisks" },
  { id: "summarize", label: "summarize" },
];

export const defaultContextOptions: ContextOptions = {
  projectMd: true,
  readme: true,
  existingChanges: true,
  existingSpecs: true,
  currentChange: true,
};
