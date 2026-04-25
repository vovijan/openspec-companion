import { ChevronRight, Plus, Search } from "lucide-react";
import type { SpecChange, TranslationKey } from "../types";

type ChangeSidebarProps = {
  busy: boolean;
  changes: SpecChange[];
  query: string;
  selectedId: string;
  onCreateDraft: () => void;
  onQueryChange: (query: string) => void;
  onSelectChange: (id: string) => void;
  t: (key: TranslationKey) => string;
};

export function ChangeSidebar({
  busy,
  changes,
  query,
  selectedId,
  onCreateDraft,
  onQueryChange,
  onSelectChange,
  t,
}: ChangeSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <span className="eyebrow">{t("changes")}</span>
          <strong>{changes.length}</strong>
        </div>
        <button className="icon-button compact" title={t("generateDraft")} onClick={onCreateDraft} disabled={busy}>
          <Plus size={17} />
        </button>
      </div>

      <label className="search">
        <Search size={16} />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t("searchChanges")} />
      </label>

      <div className="change-list">
        {changes.map((change) => (
          <button
            key={change.id}
            className={`change-item ${change.id === selectedId ? "active" : ""}`}
            onClick={() => onSelectChange(change.id)}
          >
            <span className={`status-dot ${change.status}`} />
            <span>
              <strong>{change.id}</strong>
              <small>
                {change.isPreview ? t("previewPrefix") : ""}
                {change.summary}
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </aside>
  );
}
