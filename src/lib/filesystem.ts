import { docNames } from "../constants";
import type { Locale, OpenSpecStatus, ProjectState, SpecChange } from "../types";
import { validateChange } from "./validation";

export async function readTextFile(directory: FileSystemDirectoryHandle, name: string) {
  try {
    const fileHandle = await directory.getFileHandle(name);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return "";
  }
}

export async function readOptionalFile(directory: FileSystemDirectoryHandle, path: string[]) {
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

export async function listSpecFiles(directory: FileSystemDirectoryHandle, prefix = ""): Promise<string[]> {
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

export async function writeTextFile(directory: FileSystemDirectoryHandle, name: string, content: string) {
  const fileHandle = await directory.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function getChangesDirectory(handle: FileSystemDirectoryHandle) {
  const openspec = await handle.getDirectoryHandle("openspec", { create: true });
  return openspec.getDirectoryHandle("changes", { create: true });
}

export async function archiveChangeInProject(project: ProjectState, change: SpecChange) {
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

export async function ensureProjectPermission(handle: FileSystemDirectoryHandle) {
  const descriptor = { mode: "readwrite" as const };
  const query = await handle.queryPermission?.(descriptor);
  if (query === "granted") {
    return true;
  }

  const request = await handle.requestPermission?.(descriptor);
  return request === "granted";
}

async function getExistingDirectory(parent: FileSystemDirectoryHandle, name: string) {
  try {
    return await parent.getDirectoryHandle(name);
  } catch {
    return undefined;
  }
}

async function hasFile(parent: FileSystemDirectoryHandle | undefined, name: string) {
  if (!parent) {
    return false;
  }

  try {
    await parent.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

async function inspectOpenSpecStatus(handle: FileSystemDirectoryHandle): Promise<{
  changesDir?: FileSystemDirectoryHandle;
  status: Omit<OpenSpecStatus, "activeChanges">;
}> {
  try {
    const openspec = await getExistingDirectory(handle, "openspec");
    const projectMd = await hasFile(openspec, "project.md");
    const specs = openspec ? await getExistingDirectory(openspec, "specs") : undefined;
    const changes = openspec ? await getExistingDirectory(openspec, "changes") : undefined;

    if (!openspec) {
      return {
        status: {
          state: "created",
          projectMd: false,
          specsDir: false,
          changesDir: false,
        },
      };
    }

    const state = projectMd && specs && changes ? "ready" : "partial";
    return {
      changesDir: changes,
      status: {
        state,
        projectMd,
        specsDir: Boolean(specs),
        changesDir: Boolean(changes),
      },
    };
  } catch {
    return {
      status: {
        state: "invalid",
        projectMd: false,
        specsDir: false,
        changesDir: false,
      },
    };
  }
}

export async function loadOpenSpecProject(handle: FileSystemDirectoryHandle, locale: Locale): Promise<ProjectState> {
  const inspected = await inspectOpenSpecStatus(handle);
  const openspec = await handle.getDirectoryHandle("openspec", { create: true });
  const changesDir = inspected.changesDir ?? await openspec.getDirectoryHandle("changes", { create: true });
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
    openSpecStatus: {
      ...inspected.status,
      changesDir: inspected.status.state === "invalid" ? inspected.status.changesDir : true,
      activeChanges: changes.length,
    },
  };
}
