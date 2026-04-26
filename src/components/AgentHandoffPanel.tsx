import { Clipboard, Send } from "lucide-react";
import type { TranslationKey } from "../types";

type AgentHandoffPanelProps = {
  prompt: string;
  onCopy: () => void;
  t: (key: TranslationKey) => string;
};

export function AgentHandoffPanel({ prompt, onCopy, t }: AgentHandoffPanelProps) {
  return (
    <section className="inspector-block handoff-block">
      <div className="block-title">
        <Send size={18} />
        <span>{t("agentHandoff")}</span>
      </div>

      {prompt ? (
        <>
          <textarea className="handoff-prompt" value={prompt} readOnly aria-label={t("agentHandoffPrompt")} />
          <button className="secondary-button stretch" onClick={onCopy}>
            <Clipboard size={17} />
            {t("agentHandoffCopy")}
          </button>
        </>
      ) : (
        <p className="muted">{t("agentHandoffEmpty")}</p>
      )}
    </section>
  );
}
