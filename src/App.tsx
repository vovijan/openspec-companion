import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bot,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TriangleAlert,
  Wand2,
  X,
} from "lucide-react";
import { ChangeSidebar } from "./components/ChangeSidebar";
import { EditorPanel } from "./components/EditorPanel";
import { Topbar } from "./components/Topbar";
import { useDiffPreviewControls } from "./hooks/useDiffPreviewControls";
import { usePersistentPreference } from "./hooks/usePersistentPreference";
import type { ContextKey, ContextOptions, DiffLine, DocName, ImproveAction, Locale, ProjectState, RecentProject, SpecChange, Theme, TranslationKey } from "./types";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    activeChange: "Active Change",
    aiApiFallback: "OPENAI_API_KEY is missing or the API call failed. Generated a local template preview.",
    aiDraft: "AI Draft",
    aiPreviewGenerated: "AI preview generated. Review it, then save the draft.",
    archive: "Archive",
    archiveAction: "Archive Change",
    archived: "Archived {id} to {path}.",
    archivePreviewBlocked: "Save the preview draft before archiving it.",
    archiveReserved: "Move the selected change into openspec/changes/archive and remove it from the active list.",
    archiveUnavailable: "Select a real project before archiving changes.",
    applyPatch: "Apply Patch",
    applySelectedFiles: "Apply Selected Files",
    contextCurrentChange: "Current change",
    contextExistingChanges: "Existing changes",
    contextExistingSpecs: "Existing specs",
    contextPanel: "AI Context",
    changes: "Changes",
    discardPatch: "Discard",
    couldNotOpenRecent: "Could not open recent project.",
    couldNotWriteDraft: "Could not write draft files.",
    createdFile: "Create {doc}",
    demoMode: "Demo mode is active. Select a project folder to work with real files.",
    demoNoRefresh: "Demo mode does not need refresh. Select a real project first.",
    designEmpty: "design.md is empty.",
    diffPreview: "Diff Preview",
    diffLines: "lines",
    hideFile: "Hide file",
    showFile: "Show file",
    aiImprove: "AI Improve",
    addRisks: "Add Risks",
    concreteDesign: "Make Design Concrete",
    draftSavedDemo: "Saved demo draft {id}.",
    editsAreLocal: "Edits are local in demo mode. Select a project folder to save files.",
    folderAccessUnsupported: "This browser does not support folder access. Use Chrome or Edge for real project mode.",
    folderPermissionDenied: "Folder permission was not granted. Select the project folder again.",
    generateDraft: "Generate Draft",
    generateOrSelect: "Generate a draft or select a project that already contains OpenSpec changes.",
    ideaRequired: "Add a short idea before generating a draft.",
    noChangesYet: "No changes yet",
    noStoredHandle: "This recent project has no stored folder handle. Select the project folder again.",
    projectLoaded: "Project loaded from local filesystem.",
    projectLoadedEmpty: "Project loaded. No changes found yet.",
    projectSelectionCancelled: "Project selection was cancelled.",
    recentProjects: "Recent Projects",
    recentProjectsEmpty: "Selected projects will appear here for quick reopening.",
    recentProjectRemoved: "Recent project removed.",
    refreshProject: "Refresh project",
    removeFromRecent: "Remove from recent",
    requiredDraftPresent: "Required draft structure is present.",
    save: "Save",
    saveDraft: "Save Draft",
    saved: "Saved {id}/{doc}.",
    savedDraft: "Saved openspec/changes/{id}.",
    searchChanges: "Search changes",
    selectProject: "Select Project",
    selectedFiles: "Selected files",
    updatedFile: "Update {doc}",
    tasksMissing: "tasks.md should contain checkbox tasks.",
    proposalMissingWhy: "proposal.md should explain why the change exists.",
    openRecent: "Open recent project",
    openedRecent: "Opened {name} from recent projects.",
    patchApplied: "AI patch applied to the editor. Save files when ready.",
    patchDiscarded: "AI patch discarded.",
    patchPreview: "Patch Preview",
    previewPrefix: "Preview - ",
    projectMd: "project.md",
    recentProjectsLoadFailed: "Recent projects could not be loaded in this browser.",
    readme: "README.md",
    splitTasks: "Split Tasks",
    summarize: "Summarize",
    validate: "Validate",
  },
  ru: {
    activeChange: "Активное изменение",
    aiApiFallback: "OPENAI_API_KEY не настроен или API-запрос не прошел. Создан локальный шаблон для предпросмотра.",
    aiDraft: "AI-черновик",
    aiPreviewGenerated: "AI-черновик создан. Проверь его и сохрани.",
    archive: "Архив",
    archiveAction: "Архивировать",
    archived: "Изменение {id} перенесено в {path}.",
    archivePreviewBlocked: "Сначала сохрани preview-черновик, потом его можно архивировать.",
    archiveReserved: "Перемещает выбранное изменение в openspec/changes/archive и убирает его из активного списка.",
    archiveUnavailable: "Выбери реальный проект, чтобы архивировать изменения.",
    applyPatch: "Применить патч",
    applySelectedFiles: "Применить выбранные файлы",
    contextCurrentChange: "Текущее изменение",
    contextExistingChanges: "Существующие changes",
    contextExistingSpecs: "Существующие specs",
    contextPanel: "AI-контекст",
    changes: "Изменения",
    discardPatch: "Отменить",
    couldNotOpenRecent: "Не удалось открыть недавний проект.",
    couldNotWriteDraft: "Не удалось записать файлы черновика.",
    createdFile: "Создать {doc}",
    demoMode: "Активен демо-режим. Выбери папку проекта, чтобы работать с реальными файлами.",
    demoNoRefresh: "Демо-режим не нужно обновлять. Сначала выбери реальный проект.",
    designEmpty: "design.md пустой.",
    diffPreview: "Предпросмотр изменений",
    diffLines: "строк",
    hideFile: "Скрыть файл",
    showFile: "Показать файл",
    aiImprove: "AI-улучшение",
    addRisks: "Добавить риски",
    concreteDesign: "Уточнить дизайн",
    draftSavedDemo: "Демо-черновик {id} сохранен.",
    editsAreLocal: "В демо-режиме правки локальные. Выбери папку проекта, чтобы сохранять файлы.",
    folderAccessUnsupported: "Этот браузер не поддерживает доступ к папкам. Для режима реального проекта используй Chrome или Edge.",
    folderPermissionDenied: "Доступ к папке не выдан. Выбери папку проекта заново.",
    generateDraft: "Создать черновик",
    generateOrSelect: "Создай черновик или выбери проект, где уже есть OpenSpec changes.",
    ideaRequired: "Добавь короткое описание идеи перед генерацией.",
    noChangesYet: "Изменений пока нет",
    noStoredHandle: "У этого проекта нет сохраненного доступа к папке. Выбери папку проекта заново.",
    projectLoaded: "Проект загружен из локальной файловой системы.",
    projectLoadedEmpty: "Проект загружен. Изменения пока не найдены.",
    projectSelectionCancelled: "Выбор проекта отменен.",
    recentProjects: "Недавние проекты",
    recentProjectsEmpty: "Выбранные проекты появятся здесь для быстрого открытия.",
    recentProjectRemoved: "Проект удален из списка недавних.",
    refreshProject: "Обновить проект",
    removeFromRecent: "Удалить из недавних",
    requiredDraftPresent: "Базовая структура черновика заполнена.",
    save: "Сохранить",
    saveDraft: "Сохранить черновик",
    saved: "Сохранено: {id}/{doc}.",
    savedDraft: "Сохранено: openspec/changes/{id}.",
    searchChanges: "Поиск изменений",
    selectProject: "Выбрать проект",
    selectedFiles: "Выбранные файлы",
    updatedFile: "Обновить {doc}",
    tasksMissing: "tasks.md должен содержать задачи с чекбоксами.",
    proposalMissingWhy: "proposal.md должен объяснять, зачем нужно изменение.",
    openRecent: "Открыть недавний проект",
    openedRecent: "Открыт проект {name} из списка недавних.",
    patchApplied: "AI-патч применен в редакторе. Сохрани файлы, когда все будет готово.",
    patchDiscarded: "AI-патч отменен.",
    patchPreview: "Предпросмотр патча",
    previewPrefix: "Предпросмотр - ",
    projectMd: "project.md",
    recentProjectsLoadFailed: "Не удалось загрузить недавние проекты в этом браузере.",
    readme: "README.md",
    splitTasks: "Разбить задачи",
    summarize: "Сводка",
    validate: "Проверка",
  },
};

const docNames: DocName[] = ["proposal.md", "design.md", "tasks.md"];
const improveActions: Array<{ id: ImproveAction; label: TranslationKey }> = [
  { id: "improve-proposal", label: "aiImprove" },
  { id: "concrete-design", label: "concreteDesign" },
  { id: "split-tasks", label: "splitTasks" },
  { id: "add-risks", label: "addRisks" },
  { id: "summarize", label: "summarize" },
];
const defaultContextOptions: ContextOptions = {
  projectMd: true,
  readme: true,
  existingChanges: true,
  existingSpecs: true,
  currentChange: true,
};

function getInitialTheme(): Theme {
  const saved = localStorage.getItem("openspec-companion-theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
const recentDbName = "openspec-companion";
const recentStoreName = "recent-projects";

const demoChanges: SpecChange[] = [
  {
    id: "add-openspec-companion",
    status: "draft",
    summary: "Create a local companion app for OpenSpec changes.",
    updatedAt: "Today",
    docs: {
      "proposal.md":
        "# Proposal\n\nBuild a focused desktop-style interface for managing OpenSpec changes in local repositories.\n\n## Why\n\nOpenSpec work is durable, but editing files by hand can slow down quick iterations.\n\n## What Changes\n\n- Browse existing changes\n- Review proposal, design, and tasks in one workspace\n- Generate a first draft from a short idea\n- Validate missing sections before implementation\n",
      "design.md":
        "# Design\n\nThe app reads the selected repository through the browser File System Access API.\n\n## Flow\n\n1. Select a local project folder.\n2. Locate `openspec/changes`.\n3. Render each change as a navigable workspace.\n4. Write generated drafts back to the selected folder.\n",
      "tasks.md":
        "# Tasks\n\n- [x] Create project shell\n- [x] Read changes\n- [ ] Generate change draft\n- [ ] Validate required docs\n- [ ] Archive completed changes\n",
    },
  },
  {
    id: "improve-change-validation",
    status: "ready",
    summary: "Add stricter checks for empty docs and missing task checkboxes.",
    updatedAt: "Yesterday",
    docs: {
      "proposal.md": "# Proposal\n\nWarn when a change has no problem statement or impact description.\n",
      "design.md": "# Design\n\nValidation runs locally and reports actionable messages in the inspector.\n",
      "tasks.md": "# Tasks\n\n- [x] Define checks\n- [x] Show validation results\n",
    },
  },
];

function normalizeChangeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function buildDraftDocs(idea: string): Record<DocName, string> {
  const title = idea.trim() || "Describe the change";
  return {
    "proposal.md": `# Proposal\n\n## Why\n\n${title}\n\n## What Changes\n\n- Add the smallest useful workflow around this idea.\n- Keep the behavior local-first and reviewable.\n\n## Impact\n\nThis change should be easy to validate from the OpenSpec files and the running app.\n`,
    "design.md": `# Design\n\n## Approach\n\nImplement the change as a focused vertical slice. Prefer existing project conventions and keep file-system writes explicit.\n\n## States\n\n- Empty project\n- Existing OpenSpec project\n- Draft generated\n- Validation warning\n`,
    "tasks.md": `# Tasks\n\n- [ ] Confirm the intended behavior\n- [ ] Update the relevant implementation files\n- [ ] Add or adjust validation\n- [ ] Run the project checks\n`,
  };
}

function translate(locale: Locale, key: TranslationKey, values: Record<string, string | number> = {}) {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.replace(`{${name}}`, String(value)),
    translations[locale][key],
  );
}

function getInitialLocale(): Locale {
  const saved = localStorage.getItem("openspec-companion-locale");
  if (saved === "en" || saved === "ru") {
    return saved;
  }

  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function validateChange(change: SpecChange, locale: Locale) {
  const warnings: string[] = [];

  if (!change.docs["proposal.md"].includes("## Why")) {
    warnings.push(translate(locale, "proposalMissingWhy"));
  }

  if (!change.docs["design.md"].trim()) {
    warnings.push(translate(locale, "designEmpty"));
  }

  if (!change.docs["tasks.md"].includes("- [ ]") && !change.docs["tasks.md"].includes("- [x]")) {
    warnings.push(translate(locale, "tasksMissing"));
  }

  return warnings;
}

async function readTextFile(directory: FileSystemDirectoryHandle, name: string) {
  try {
    const fileHandle = await directory.getFileHandle(name);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return "";
  }
}

async function readOptionalFile(directory: FileSystemDirectoryHandle, path: string[]) {
  try {
    const fileName = path.at(-1);
    if (!fileName) {
      return "";
    }

    let current = directory;
    for (const segment of path.slice(0, -1)) {
      current = await current.getDirectoryHandle(segment);
    }

    return await readTextFile(current, fileName);
  } catch {
    return "";
  }
}

async function listSpecFiles(directory: FileSystemDirectoryHandle, prefix = ""): Promise<string[]> {
  const specs: string[] = [];

  try {
    for await (const entry of directory.values()) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === "file" && entry.name.endsWith(".md")) {
        specs.push(path);
      }

      if (entry.kind === "directory") {
        specs.push(...await listSpecFiles(entry as FileSystemDirectoryHandle, path));
      }
    }
  } catch {
    return specs;
  }

  return specs;
}

async function writeTextFile(directory: FileSystemDirectoryHandle, name: string, content: string) {
  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function getChangesDirectory(handle: FileSystemDirectoryHandle) {
  const openspec = await handle.getDirectoryHandle("openspec", { create: true });
  return openspec.getDirectoryHandle("changes", { create: true });
}

async function archiveChangeInProject(project: ProjectState, change: SpecChange) {
  if (!project.handle) {
    throw new Error("Project handle is required.");
  }

  const changesDir = await getChangesDirectory(project.handle);
  const archiveDir = await changesDir.getDirectoryHandle("archive", { create: true });
  const archiveId = `${new Date().toISOString().slice(0, 10)}-${change.id}`;
  const targetDir = await archiveDir.getDirectoryHandle(archiveId, { create: true });

  await Promise.all(docNames.map((name) => writeTextFile(targetDir, name, change.docs[name])));
  await changesDir.removeEntry(change.id, { recursive: true });

  return `openspec/changes/archive/${archiveId}`;
}

async function generateAiDraft(
  idea: string,
  project: ProjectState,
): Promise<{ id: string; summary: string; docs: Record<DocName, string>; source: "local" | "openai"; model?: string }> {
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
      body: JSON.stringify({ idea, context }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json();
    return {
      id: normalizeChangeId(data.id || idea),
      summary: String(data.summary || idea),
      docs: normalizeDocs(data.docs, idea),
      source: "openai",
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

async function improveChangeWithAi(
  action: ImproveAction,
  change: SpecChange,
  project: ProjectState,
  options: ContextOptions,
): Promise<{ summary: string; docs: Record<DocName, string>; source: "local" | "openai"; model?: string }> {
  const context = await buildAiContext(project, change, options);

  try {
    const response = await fetch("/api/improve-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, change, context }),
    });

    if (!response.ok) {
      throw new Error(await readApiError(response));
    }

    const data = await response.json();
    return {
      summary: String(data.summary || change.summary),
      docs: normalizeDocs(data.docs, change.summary),
      source: "openai",
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

function getDiffSummary(change: SpecChange | undefined, locale: Locale) {
  if (!change?.isPreview) {
    return [];
  }

  return docNames.map((name) => {
    const previous = change.previousDocs?.[name];
    const next = change.docs[name];
    const action = previous === undefined ? "createdFile" : "updatedFile";
    const previousLines = previous?.split("\n").length ?? 0;
    const nextLines = next.split("\n").length;
    const delta = nextLines - previousLines;

    return {
      name,
      action: translate(locale, action, { doc: name }),
      stats: `${delta >= 0 ? "+" : ""}${delta} ${translate(locale, "diffLines")}`,
    };
  });
}

function buildLineDiff(previousValue = "", nextValue = ""): DiffLine[] {
  const previousLines = previousValue.split("\n");
  const nextLines = nextValue.split("\n");
  const rows: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < previousLines.length || newIndex < nextLines.length) {
    const oldText = previousLines[oldIndex];
    const newText = nextLines[newIndex];

    if (oldIndex < previousLines.length && newIndex < nextLines.length && oldText === newText) {
      rows.push({
        kind: "same",
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        text: oldText,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    const nextOldMatch = oldIndex + 1 < previousLines.length && previousLines[oldIndex + 1] === newText;
    const nextNewMatch = newIndex + 1 < nextLines.length && oldText === nextLines[newIndex + 1];

    if (nextOldMatch) {
      rows.push({
        kind: "removed",
        oldLine: oldIndex + 1,
        text: oldText ?? "",
      });
      oldIndex += 1;
      continue;
    }

    if (nextNewMatch) {
      rows.push({
        kind: "added",
        newLine: newIndex + 1,
        text: newText ?? "",
      });
      newIndex += 1;
      continue;
    }

    if (oldIndex < previousLines.length) {
      rows.push({
        kind: "removed",
        oldLine: oldIndex + 1,
        text: oldText ?? "",
      });
      oldIndex += 1;
    }

    if (newIndex < nextLines.length) {
      rows.push({
        kind: "added",
        newLine: newIndex + 1,
        text: newText ?? "",
      });
      newIndex += 1;
    }
  }

  return rows;
}

function openRecentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(recentDbName, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(recentStoreName)) {
        db.createObjectStore(recentStoreName, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getRecentProjects() {
  const db = await openRecentDb();

  return new Promise<RecentProject[]>((resolve, reject) => {
    const transaction = db.transaction(recentStoreName, "readonly");
    const store = transaction.objectStore(recentStoreName);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = (request.result as RecentProject[]).sort((a, b) => b.openedAt - a.openedAt).slice(0, 8);
      resolve(projects);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function saveRecentProject(project: ProjectState) {
  if (!project.handle) {
    return;
  }

  const db = await openRecentDb();
  const recent: RecentProject = {
    id: project.handle.name,
    name: project.name,
    openedAt: Date.now(),
    changeCount: project.changes.length,
    handle: project.handle,
  };

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(recentStoreName, "readwrite");
    transaction.objectStore(recentStoreName).put(recent);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function deleteRecentProject(id: string) {
  const db = await openRecentDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(recentStoreName, "readwrite");
    transaction.objectStore(recentStoreName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function ensureProjectPermission(handle: FileSystemDirectoryHandle) {
  const descriptor = { mode: "readwrite" as const };
  const query = await handle.queryPermission?.(descriptor);
  if (query === "granted") {
    return true;
  }

  const request = await handle.requestPermission?.(descriptor);
  return request === "granted";
}

async function loadOpenSpecProject(handle: FileSystemDirectoryHandle, locale: Locale): Promise<ProjectState> {
  const openspec = await handle.getDirectoryHandle("openspec", { create: true });
  const changesDir = await openspec.getDirectoryHandle("changes", { create: true });
  const changes: SpecChange[] = [];

  for await (const entry of changesDir.values()) {
    if (entry.kind !== "directory" || entry.name === "archive") {
      continue;
    }

    const changeDir = entry as FileSystemDirectoryHandle;
    const docs = {
      "proposal.md": await readTextFile(changeDir, "proposal.md"),
      "design.md": await readTextFile(changeDir, "design.md"),
      "tasks.md": await readTextFile(changeDir, "tasks.md"),
    };
    const warnings = validateChange({
      id: entry.name,
      status: "draft",
      summary: "",
      updatedAt: "",
      docs,
    }, locale);

    changes.push({
      id: entry.name,
      status: warnings.length ? "blocked" : "ready",
      summary: docs["proposal.md"].split("\n").find((line) => line.trim() && !line.startsWith("#")) ?? "OpenSpec change",
      updatedAt: "Local",
      docs,
    });
  }

  return {
    name: handle.name,
    handle,
    changes: changes.length ? changes : [],
  };
}

export default function App() {
  const [locale, setLocaleState] = usePersistentPreference<Locale>("openspec-companion-locale", getInitialLocale);
  const [theme, setTheme] = usePersistentPreference<Theme>("openspec-companion-theme", getInitialTheme);
  const [project, setProject] = useState<ProjectState>({ name: "Demo Repository", changes: demoChanges });
  const [selectedId, setSelectedId] = useState(demoChanges[0].id);
  const [activeDoc, setActiveDoc] = useState<DocName>("proposal.md");
  const [idea, setIdea] = useState("Add an OpenSpec change browser with AI-assisted draft generation");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() => translate(getInitialLocale(), "demoMode"));
  const [query, setQuery] = useState("");
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [contextOptions, setContextOptions] = useState<ContextOptions>(defaultContextOptions);
  const [patchPreview, setPatchPreview] = useState<SpecChange | undefined>();
  const { expandedDiffFiles, resetDiffPreviewControls, selectedPatchFiles, toggleDiffFile, togglePatchFile } = useDiffPreviewControls();
  const t = (key: TranslationKey, values?: Record<string, string | number>) => translate(locale, key, values);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    setNotice(translate(nextLocale, "demoMode"));
  }

  useEffect(() => {
    getRecentProjects()
      .then(setRecentProjects)
      .catch(() => setNotice(t("recentProjectsLoadFailed")));
  }, [locale]);

  useEffect(() => {
    setPatchPreview(undefined);
  }, [selectedId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selectedChange = project.changes.find((change) => change.id === selectedId) ?? project.changes[0];
  const displayedChange = patchPreview && patchPreview.id === selectedChange?.id ? patchPreview : selectedChange;
  const warnings = displayedChange ? validateChange(displayedChange, locale) : [];
  const diffSummary = getDiffSummary(patchPreview ?? displayedChange, locale);
  const diffChange = patchPreview ?? (displayedChange?.isPreview ? displayedChange : undefined);

  const filteredChanges = useMemo(() => {
    return project.changes.filter((change) => {
      const haystack = `${change.id} ${change.summary}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [project.changes, query]);

  async function selectProject() {
    if (!window.showDirectoryPicker) {
      setNotice(t("folderAccessUnsupported"));
      return;
    }

    setBusy(true);
    try {
      const handle = await window.showDirectoryPicker();
      const nextProject = await loadOpenSpecProject(handle, locale);
      setProject(nextProject);
      setSelectedId(nextProject.changes[0]?.id ?? "");
      await saveRecentProject(nextProject);
      setRecentProjects(await getRecentProjects());
      setNotice(nextProject.changes.length ? t("projectLoaded") : t("projectLoadedEmpty"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("projectSelectionCancelled"));
    } finally {
      setBusy(false);
    }
  }

  async function refreshProject() {
    if (!project.handle) {
      setNotice(t("demoNoRefresh"));
      return;
    }

    setBusy(true);
    const nextProject = await loadOpenSpecProject(project.handle, locale);
    setProject(nextProject);
    setSelectedId((current) => nextProject.changes.some((change) => change.id === current) ? current : nextProject.changes[0]?.id ?? "");
    await saveRecentProject(nextProject);
    setRecentProjects(await getRecentProjects());
    setNotice(t("projectLoaded"));
    setBusy(false);
  }

  async function openRecentProject(recent: RecentProject) {
    if (!recent.handle) {
      setNotice(t("noStoredHandle"));
      return;
    }

    setBusy(true);
    try {
      const allowed = await ensureProjectPermission(recent.handle);
      if (!allowed) {
        setNotice(t("folderPermissionDenied"));
        return;
      }

      const nextProject = await loadOpenSpecProject(recent.handle, locale);
      setProject(nextProject);
      setSelectedId(nextProject.changes[0]?.id ?? "");
      await saveRecentProject(nextProject);
      setRecentProjects(await getRecentProjects());
      setNotice(t("openedRecent", { name: nextProject.name }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("couldNotOpenRecent"));
    } finally {
      setBusy(false);
    }
  }

  async function removeRecentProject(id: string) {
    await deleteRecentProject(id);
    setRecentProjects(await getRecentProjects());
    setNotice(t("recentProjectRemoved"));
  }

  async function createDraftPreview() {
    const id = normalizeChangeId(idea);
    if (!id) {
      setNotice(t("ideaRequired"));
      return;
    }

    setBusy(true);
    const draft = await generateAiDraft(idea, project);
    const existingChange = project.changes.find((change) => change.id === draft.id);
    const nextChange: SpecChange = {
      id: draft.id,
      status: "draft",
      summary: draft.summary,
      updatedAt: "Just now",
      docs: draft.docs,
      previousDocs: existingChange?.docs,
      isPreview: true,
      source: draft.source,
    };

    setProject((current) => ({
      ...current,
      changes: [nextChange, ...current.changes.filter((change) => change.id !== nextChange.id)],
    }));
    setSelectedId(nextChange.id);
    setActiveDoc("proposal.md");
    setNotice(
      draft.source === "openai"
        ? draft.model
          ? `${t("aiPreviewGenerated")} (${draft.model})`
          : t("aiPreviewGenerated")
        : t("aiApiFallback"),
    );
    setBusy(false);
  }

  async function improveSelectedChange(action: ImproveAction) {
    if (!selectedChange) {
      return;
    }

    setBusy(true);
    const patch = await improveChangeWithAi(action, selectedChange, project, contextOptions);
    const preview: SpecChange = {
      ...selectedChange,
      summary: patch.summary,
      docs: patch.docs,
      previousDocs: selectedChange.docs,
      isPreview: true,
      source: patch.source,
      updatedAt: "Just now",
    };

    setPatchPreview(preview);
    resetDiffPreviewControls();
    setActiveDoc("proposal.md");
    setNotice(
      patch.source === "openai"
        ? patch.model
          ? `${t("aiPreviewGenerated")} (${patch.model})`
          : t("aiPreviewGenerated")
        : t("aiApiFallback"),
    );
    setBusy(false);
  }

  function applyPatchPreview() {
    if (!patchPreview) {
      return;
    }

    const nextDocs = docNames.reduce<Record<DocName, string>>((docs, name) => {
      docs[name] = selectedPatchFiles[name]
        ? patchPreview.docs[name]
        : selectedChange?.docs[name] ?? patchPreview.docs[name];
      return docs;
    }, {} as Record<DocName, string>);
    const nextPatch = { ...patchPreview, docs: nextDocs };

    setProject((current) => ({
      ...current,
      changes: current.changes.map((change) =>
        change.id === patchPreview.id
          ? {
              ...change,
              summary: patchPreview.summary,
              docs: nextDocs,
              status: validateChange(nextPatch, locale).length ? "blocked" : "ready",
            }
          : change,
      ),
    }));
    setPatchPreview(undefined);
    setNotice(t("patchApplied"));
  }

  function discardPatchPreview() {
    setPatchPreview(undefined);
    setNotice(t("patchDiscarded"));
  }

  function toggleContextOption(key: ContextKey) {
    setContextOptions((current) => ({ ...current, [key]: !current[key] }));
  }

  async function saveDraftPreview() {
    if (!selectedChange) {
      return;
    }

    if (project.handle) {
      setBusy(true);
      try {
        const openspec = await project.handle.getDirectoryHandle("openspec", { create: true });
        const changesDir = await openspec.getDirectoryHandle("changes", { create: true });
        const changeDir = await changesDir.getDirectoryHandle(selectedChange.id, { create: true });
        await Promise.all(docNames.map((name) => writeTextFile(changeDir, name, selectedChange.docs[name])));
        const nextProject = await loadOpenSpecProject(project.handle, locale);
        setProject(nextProject);
        setSelectedId(selectedChange.id);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : t("couldNotWriteDraft"));
        setBusy(false);
        return;
      }
      setBusy(false);
    } else {
      setProject((current) => ({
        ...current,
        changes: current.changes.map((change) =>
          change.id === selectedChange.id ? { ...change, isPreview: false, updatedAt: "Demo" } : change,
        ),
      }));
    }

    setNotice(project.handle ? t("savedDraft", { id: selectedChange.id }) : t("draftSavedDemo", { id: selectedChange.id }));
  }

  async function archiveSelectedChange() {
    if (!selectedChange) {
      return;
    }

    if (selectedChange.isPreview) {
      setNotice(t("archivePreviewBlocked"));
      return;
    }

    if (!project.handle) {
      const changes = project.changes.filter((change) => change.id !== selectedChange.id);
      setProject((current) => ({ ...current, changes }));
      setSelectedId(changes[0]?.id ?? "");
      setNotice(t("archived", { id: selectedChange.id, path: "demo archive" }));
      return;
    }

    setBusy(true);
    try {
      const archivePath = await archiveChangeInProject(project, selectedChange);
      const nextProject = await loadOpenSpecProject(project.handle, locale);
      setProject(nextProject);
      setSelectedId(nextProject.changes[0]?.id ?? "");
      await saveRecentProject(nextProject);
      setRecentProjects(await getRecentProjects());
      setNotice(t("archived", { id: selectedChange.id, path: archivePath }));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("archiveUnavailable"));
    } finally {
      setBusy(false);
    }
  }

  function updateDoc(value: string) {
    if (!selectedChange) {
      return;
    }

    setProject((current) => ({
      ...current,
      changes: current.changes.map((change) =>
        change.id === selectedChange.id
          ? {
              ...change,
              docs: { ...change.docs, [activeDoc]: value },
              status: validateChange({ ...change, docs: { ...change.docs, [activeDoc]: value } }, locale).length ? "blocked" : "ready",
            }
          : change,
      ),
    }));
  }

  async function saveCurrentDoc() {
    if (!project.handle || !selectedChange) {
      setNotice(t("editsAreLocal"));
      return;
    }

    setBusy(true);
    const openspec = await project.handle.getDirectoryHandle("openspec", { create: true });
    const changesDir = await openspec.getDirectoryHandle("changes", { create: true });
    const changeDir = await changesDir.getDirectoryHandle(selectedChange.id, { create: true });
    await writeTextFile(changeDir, activeDoc, selectedChange.docs[activeDoc]);
    setNotice(t("saved", { id: selectedChange.id, doc: activeDoc }));
    setBusy(false);
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <Topbar
        busy={busy}
        locale={locale}
        projectName={project.name}
        theme={theme}
        onLocaleChange={setLocale}
        onRefreshProject={refreshProject}
        onSelectProject={selectProject}
        onThemeChange={setTheme}
        t={t}
      />

      <section className="workspace">
        <ChangeSidebar
          busy={busy}
          changes={filteredChanges}
          query={query}
          selectedId={selectedId}
          onCreateDraft={createDraftPreview}
          onQueryChange={setQuery}
          onSelectChange={setSelectedId}
          t={t}
        />

        <EditorPanel
          activeDoc={activeDoc}
          change={displayedChange}
          docNames={docNames}
          isPatchPreview={Boolean(patchPreview)}
          onActiveDocChange={setActiveDoc}
          onDocChange={updateDoc}
          t={t}
        />

        <aside className="inspector">
          <section className="inspector-block recent-block">
            <div className="block-title">
              <History size={18} />
              <span>{t("recentProjects")}</span>
            </div>
            {recentProjects.length ? (
              <div className="recent-list">
                {recentProjects.map((recent) => (
                  <div key={recent.id} className="recent-item">
                    <button
                      className="recent-open"
                      title={t("openRecent")}
                      onClick={() => openRecentProject(recent)}
                      disabled={busy}
                    >
                      <span>
                        <strong>{recent.name}</strong>
                        <small>{recent.changeCount} {t("changes").toLowerCase()}</small>
                      </span>
                    </button>
                    <button
                      className="recent-remove"
                      title={t("removeFromRecent")}
                      onClick={() => void removeRecentProject(recent.id)}
                      disabled={busy}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">{t("recentProjectsEmpty")}</p>
            )}
          </section>

          <section className="inspector-block draft-block">
            <div className="block-title">
              <Bot size={18} />
              <span>{t("aiDraft")}</span>
            </div>
            <textarea value={idea} onChange={(event) => setIdea(event.target.value)} />
            <button className="primary-button" onClick={createDraftPreview} disabled={busy}>
              {busy ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
              {t("generateDraft")}
            </button>
            {selectedChange?.isPreview ? (
              <button className="secondary-button stretch preview-save" onClick={saveDraftPreview} disabled={busy}>
                <Save size={17} />
                {t("saveDraft")}
              </button>
            ) : null}
          </section>

          <section className="inspector-block context-block">
            <div className="block-title">
              <SlidersHorizontal size={18} />
              <span>{t("contextPanel")}</span>
            </div>
            <div className="context-options">
              {[
                ["projectMd", "projectMd"],
                ["readme", "readme"],
                ["existingChanges", "contextExistingChanges"],
                ["existingSpecs", "contextExistingSpecs"],
                ["currentChange", "contextCurrentChange"],
              ].map(([key, label]) => (
                <label key={key} className="context-option">
                  <input
                    type="checkbox"
                    checked={contextOptions[key as ContextKey]}
                    onChange={() => toggleContextOption(key as ContextKey)}
                  />
                  <span>{t(label as TranslationKey)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="inspector-block improve-block">
            <div className="block-title">
              <Wand2 size={18} />
              <span>{t("aiImprove")}</span>
            </div>
            <div className="improve-actions">
              {improveActions.map((action) => (
                <button
                  key={action.id}
                  className="secondary-button compact-action"
                  onClick={() => improveSelectedChange(action.id)}
                  disabled={!selectedChange || busy}
                >
                  {t(action.label)}
                </button>
              ))}
            </div>
          </section>

          {diffChange ? (
            <section className="inspector-block diff-block">
              <div className="block-title">
                <FileText size={18} />
                <span>{patchPreview ? t("patchPreview") : t("diffPreview")}</span>
              </div>
              <div className="diff-list">
                {diffSummary.map((item) => {
                  const docName = item.name as DocName;
                  const previous = diffChange.previousDocs?.[docName] ?? "";
                  const next = diffChange.docs[docName];
                  const lines = buildLineDiff(previous, next);

                  return (
                    <div key={item.name} className="diff-file">
                      <div className="diff-file-header">
                        {patchPreview ? (
                          <label className="diff-file-select">
                            <input
                              type="checkbox"
                              checked={selectedPatchFiles[docName]}
                              onChange={() => togglePatchFile(docName)}
                            />
                            <span>{item.action}</span>
                          </label>
                        ) : (
                          <span>{item.action}</span>
                        )}
                        <button className="diff-toggle" onClick={() => toggleDiffFile(docName)}>
                          <strong>{item.stats}</strong>
                          {expandedDiffFiles[docName] ? t("hideFile") : t("showFile")}
                        </button>
                      </div>
                      {expandedDiffFiles[docName] ? (
                        <div className="diff-table" aria-label={`${item.name} diff`}>
                          {lines.map((line, index) => (
                            <div key={`${line.kind}-${index}-${line.oldLine ?? "x"}-${line.newLine ?? "x"}`} className={`diff-row ${line.kind}`}>
                              <span className="diff-gutter">{line.oldLine ?? ""}</span>
                              <span className="diff-gutter">{line.newLine ?? ""}</span>
                              <pre>{line.text || " "}</pre>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              {patchPreview ? (
                <div className="patch-actions">
                  <button className="primary-button" onClick={applyPatchPreview} disabled={busy}>
                    <CheckCircle2 size={17} />
                    {t("applySelectedFiles")}
                  </button>
                  <button className="secondary-button stretch" onClick={discardPatchPreview} disabled={busy}>
                    <X size={17} />
                    {t("discardPatch")}
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="inspector-block">
            <div className="block-title">
              {warnings.length ? <TriangleAlert size={18} /> : <CheckCircle2 size={18} />}
              <span>{t("validate")}</span>
            </div>
            {warnings.length ? (
              <ul className="warnings">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="ok-message">{t("requiredDraftPresent")}</p>
            )}
            <button className="secondary-button stretch" onClick={saveCurrentDoc} disabled={!selectedChange || busy}>
              <Save size={17} />
              {t("save")}
            </button>
          </section>

          <section className="inspector-block">
            <div className="block-title">
              <Archive size={18} />
              <span>{t("archive")}</span>
            </div>
            <p className="muted">{t("archiveReserved")}</p>
            <button className="secondary-button stretch archive-button" onClick={archiveSelectedChange} disabled={!selectedChange || busy}>
              <Archive size={17} />
              {t("archiveAction")}
            </button>
          </section>

          <p className="notice">{notice}</p>
        </aside>
      </section>
    </main>
  );
}
