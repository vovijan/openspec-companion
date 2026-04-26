import type { ProjectState, RecentProject } from "../types";

const recentDbName = "openspec-companion";
const recentStoreName = "recent-projects";

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

export async function getRecentProjects() {
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

export async function saveRecentProject(project: ProjectState) {
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

export async function deleteRecentProject(id: string) {
  const db = await openRecentDb();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(recentStoreName, "readwrite");
    transaction.objectStore(recentStoreName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}
