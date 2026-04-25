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
  source?: "local" | "openai";
};

export type ProjectState = {
  name: string;
  handle?: FileSystemDirectoryHandle;
  changes: SpecChange[];
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
  | "aiPreviewGenerated"
  | "archive"
  | "archiveAction"
  | "archived"
  | "archivePreviewBlocked"
  | "archiveReserved"
  | "archiveUnavailable"
  | "applyPatch"
  | "applySelectedFiles"
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
  | "patchApplied"
  | "patchDiscarded"
  | "patchPreview"
  | "previewPrefix"
  | "projectMd"
  | "recentProjectsLoadFailed"
  | "readme"
  | "splitTasks"
  | "summarize"
  | "validate";
