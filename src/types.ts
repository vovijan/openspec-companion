export type DocName = "proposal.md" | "design.md" | "tasks.md";

export type ChangeStatus = "draft" | "ready" | "blocked";

export type SpecChange = {
  id: string;
  status: ChangeStatus;
  summary: string;
  updatedAt: string;
  docs: Record<DocName, string>;
  previousDocs?: Partial<Record<DocName, string>>;
  isPreview?: boolean;
  source?: "local" | AiProvider;
};

export type HealthTone = "good" | "warning" | "danger";

export type HealthCheck = {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  tone: HealthTone;
};

export type SpecHealth = {
  score: number;
  tone: HealthTone;
  checks: HealthCheck[];
  summary: string;
};

export type AiReviewIssue = {
  title: string;
  detail: string;
  severity: HealthTone;
};

export type AiReviewResult = {
  summary: string;
  issues: AiReviewIssue[];
  suggestions: string[];
  source: "local" | AiProvider;
  model?: string;
};

export type ProjectState = {
  name: string;
  handle?: FileSystemDirectoryHandle;
  changes: SpecChange[];
  openSpecStatus?: OpenSpecStatus;
};

export type OpenSpecStatusState = "demo" | "ready" | "partial" | "created" | "invalid";

export type OpenSpecStatus = {
  state: OpenSpecStatusState;
  projectMd: boolean;
  specsDir: boolean;
  changesDir: boolean;
  activeChanges: number;
};

export type RecentProject = {
  id: string;
  name: string;
  openedAt: number;
  changeCount: number;
  handle?: FileSystemDirectoryHandle;
};

export type Locale = "en" | "ru";
export type Theme = "light" | "dark";
export type AiProvider = "openai" | "openrouter" | "anthropic";
export type HandoffTemplate = "codex" | "claude";
export type ImproveAction = "improve-proposal" | "concrete-design" | "split-tasks" | "add-risks" | "summarize";
export type ContextKey = "projectMd" | "readme" | "existingChanges" | "existingSpecs" | "currentChange";

export type ContextOptions = Record<ContextKey, boolean>;
export type DiffLineKind = "same" | "added" | "removed";

export type DiffLine = {
  kind: DiffLineKind;
  oldLine?: number;
  newLine?: number;
  text: string;
};

export type TranslationKey =
  | "activeChange"
  | "aiApiFallback"
  | "aiDraft"
  | "aiProvider"
  | "aiPreviewGenerated"
  | "aiReview"
  | "aiReviewEmpty"
  | "aiReviewGenerated"
  | "aiReviewIssues"
  | "aiReviewRun"
  | "aiReviewSuggestions"
  | "archive"
  | "archiveAction"
  | "archived"
  | "archivePreviewBlocked"
  | "archiveReserved"
  | "archiveUnavailable"
  | "applyPatch"
  | "applySelectedFiles"
  | "agentHandoff"
  | "agentHandoffCopied"
  | "agentHandoffCopyClaude"
  | "agentHandoffCopyCodex"
  | "agentHandoffCopy"
  | "agentHandoffEmpty"
  | "agentHandoffHistory"
  | "agentHandoffHistoryEmpty"
  | "agentHandoffIncludeReview"
  | "agentHandoffPrompt"
  | "agentHandoffTemplate"
  | "agentHandoffTemplateClaude"
  | "agentHandoffTemplateCodex"
  | "contextCurrentChange"
  | "contextExistingChanges"
  | "contextExistingSpecs"
  | "contextPanel"
  | "changes"
  | "discardPatch"
  | "couldNotOpenRecent"
  | "couldNotWriteDraft"
  | "createdFile"
  | "demoMode"
  | "demoNoRefresh"
  | "designEmpty"
  | "diffPreview"
  | "diffLines"
  | "hideFile"
  | "showFile"
  | "aiImprove"
  | "addRisks"
  | "concreteDesign"
  | "draftSavedDemo"
  | "editsAreLocal"
  | "folderAccessUnsupported"
  | "folderPermissionDenied"
  | "generateDraft"
  | "generateOrSelect"
  | "ideaRequired"
  | "modelLabel"
  | "noChangesYet"
  | "noStoredHandle"
  | "projectLoaded"
  | "projectLoadedEmpty"
  | "projectSelectionCancelled"
  | "recentProjects"
  | "recentProjectsEmpty"
  | "recentProjectRemoved"
  | "refreshProject"
  | "removeFromRecent"
  | "requiredDraftPresent"
  | "save"
  | "saveDraft"
  | "saved"
  | "savedDraft"
  | "searchChanges"
  | "selectProject"
  | "updatedFile"
  | "selectedFiles"
  | "tasksMissing"
  | "proposalMissingWhy"
  | "openRecent"
  | "openedRecent"
  | "openSpecStatusActiveChanges"
  | "openSpecStatusChanges"
  | "openSpecStatusCreated"
  | "openSpecStatusDemo"
  | "openSpecStatusFound"
  | "openSpecStatusInvalid"
  | "openSpecStatusMissing"
  | "openSpecStatusPartial"
  | "openSpecStatusProjectMd"
  | "openSpecStatusReady"
  | "openSpecStatusSpecs"
  | "patchApplied"
  | "patchDiscarded"
  | "patchPreview"
  | "previewPrefix"
  | "providerConfigured"
  | "providerMissingKey"
  | "projectMd"
  | "recentProjectsLoadFailed"
  | "readme"
  | "splitTasks"
  | "summarize"
  | "specHealth"
  | "specHealthChecks"
  | "validate";
