import type { OpenSpecStatus, TranslationKey } from "../types";

type OpenSpecStatusIndicatorProps = {
  status: OpenSpecStatus;
  t: (key: TranslationKey) => string;
};

const statusLabelKeys: Record<OpenSpecStatus["state"], TranslationKey> = {
  created: "openSpecStatusCreated",
  demo: "openSpecStatusDemo",
  invalid: "openSpecStatusInvalid",
  partial: "openSpecStatusPartial",
  ready: "openSpecStatusReady",
};

function formatPresence(label: string, exists: boolean, t: (key: TranslationKey) => string) {
  return `${label}: ${exists ? t("openSpecStatusFound") : t("openSpecStatusMissing")}`;
}

export function OpenSpecStatusIndicator({ status, t }: OpenSpecStatusIndicatorProps) {
  const title = [
    formatPresence(t("openSpecStatusProjectMd"), status.projectMd, t),
    formatPresence(t("openSpecStatusSpecs"), status.specsDir, t),
    formatPresence(t("openSpecStatusChanges"), status.changesDir, t),
    `${t("openSpecStatusActiveChanges")}: ${status.activeChanges}`,
  ].join("\n");

  return (
    <span className={`openspec-status openspec-status-${status.state}`} title={title}>
      <span className="openspec-status-dot" aria-hidden="true" />
      {t(statusLabelKeys[status.state])}
    </span>
  );
}
