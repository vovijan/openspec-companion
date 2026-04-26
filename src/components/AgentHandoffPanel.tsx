import { Clipboard, Send } from "lucide-react";
import type { HandoffTemplate, TranslationKey } from "../types";
import type { HandoffHistoryItem } from "../lib/agentHandoff";

type AgentHandoffPanelProps = {
  history: HandoffHistoryItem[];
  includeReview: boolean;
  prompt: string;
  selectedTemplate: HandoffTemplate;
  onCopy: (template: HandoffTemplate) => void;
  onCopyHistory: (item: HandoffHistoryItem) => void;
  onIncludeReviewChange: (includeReview: boolean) => void;
  onTemplateChange: (template: HandoffTemplate) => void;
  t: (key: TranslationKey) => string;
};

export function AgentHandoffPanel({
  history,
  includeReview,
  prompt,
  selectedTemplate,
  onCopy,
  onCopyHistory,
  onIncludeReviewChange,
  onTemplateChange,
  t,
}: AgentHandoffPanelProps) {
  return (
    <section className="inspector-block handoff-block">
      <div className="block-title">
        <Send size={18} />
        <span>{t("agentHandoff")}</span>
      </div>

      {prompt ? (
        <>
          <label className="field-label">
            <span>{t("agentHandoffTemplate")}</span>
            <select value={selectedTemplate} onChange={(event) => onTemplateChange(event.target.value as HandoffTemplate)}>
              <option value="codex">{t("agentHandoffTemplateCodex")}</option>
              <option value="claude">{t("agentHandoffTemplateClaude")}</option>
            </select>
          </label>
          <label className="context-option handoff-review-toggle">
            <input type="checkbox" checked={includeReview} onChange={(event) => onIncludeReviewChange(event.target.checked)} />
            <span>{t("agentHandoffIncludeReview")}</span>
          </label>
          <textarea className="handoff-prompt" value={prompt} readOnly aria-label={t("agentHandoffPrompt")} />
          <div className="handoff-actions">
            <button className="secondary-button stretch" onClick={() => onCopy("codex")}>
              <Clipboard size={17} />
              {t("agentHandoffCopyCodex")}
            </button>
            <button className="secondary-button stretch" onClick={() => onCopy("claude")}>
              <Clipboard size={17} />
              {t("agentHandoffCopyClaude")}
            </button>
          </div>
          <div className="handoff-history">
            <strong>{t("agentHandoffHistory")}</strong>
            {history.length ? (
              <div className="handoff-history-list">
                {history.map((item) => (
                  <button key={item.id} className="handoff-history-item" onClick={() => onCopyHistory(item)}>
                    <span>{item.changeId}</span>
                    <small>{item.template === "claude" ? "Claude Code" : "Codex"} · {new Date(item.createdAt).toLocaleString()}</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="muted">{t("agentHandoffHistoryEmpty")}</p>
            )}
          </div>
        </>
      ) : (
        <p className="muted">{t("agentHandoffEmpty")}</p>
      )}
    </section>
  );
}
