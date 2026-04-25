import { ClipboardCheck, FileText } from "lucide-react";
import type { DocName, SpecChange, TranslationKey } from "../types";

type EditorPanelProps = {
  activeDoc: DocName;
  change: SpecChange | undefined;
  docNames: DocName[];
  isPatchPreview: boolean;
  onActiveDocChange: (doc: DocName) => void;
  onDocChange: (value: string) => void;
  t: (key: TranslationKey) => string;
};

export function EditorPanel({
  activeDoc,
  change,
  docNames,
  isPatchPreview,
  onActiveDocChange,
  onDocChange,
  t,
}: EditorPanelProps) {
  return (
    <section className="editor-panel">
      {change ? (
        <>
          <div className="editor-header">
            <div>
              <span className="eyebrow">{t("activeChange")}</span>
              <h2>{change.id}</h2>
            </div>
            <div className="doc-tabs">
              {docNames.map((name) => (
                <button key={name} className={activeDoc === name ? "selected" : ""} onClick={() => onActiveDocChange(name)}>
                  <FileText size={15} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="markdown-editor"
            value={change.docs[activeDoc]}
            onChange={(event) => onDocChange(event.target.value)}
            spellCheck={false}
            readOnly={isPatchPreview}
          />
        </>
      ) : (
        <div className="empty-state">
          <ClipboardCheck size={34} />
          <h2>{t("noChangesYet")}</h2>
          <p>{t("generateOrSelect")}</p>
        </div>
      )}
    </section>
  );
}
