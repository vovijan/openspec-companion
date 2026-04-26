import { FolderOpen, GitBranch, Loader2, Moon, RefreshCw, Sun } from "lucide-react";
import type { Locale, OpenSpecStatus, Theme, TranslationKey } from "../types";
import { OpenSpecStatusIndicator } from "./OpenSpecStatusIndicator";

type TopbarProps = {
  busy: boolean;
  locale: Locale;
  openSpecStatus?: OpenSpecStatus;
  projectName: string;
  theme: Theme;
  onLocaleChange: (locale: Locale) => void;
  onRefreshProject: () => void;
  onSelectProject: () => void;
  onThemeChange: (theme: Theme) => void;
  t: (key: TranslationKey) => string;
};

export function Topbar({
  busy,
  locale,
  openSpecStatus,
  projectName,
  theme,
  onLocaleChange,
  onRefreshProject,
  onSelectProject,
  onThemeChange,
  t,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <GitBranch size={18} />
        </div>
        <div>
          <h1>OpenSpec Companion</h1>
          <div className="project-meta">
            <p>{projectName}</p>
            {openSpecStatus ? <OpenSpecStatusIndicator status={openSpecStatus} t={t} /> : null}
          </div>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="locale-switch" aria-label="Language">
          <button className={locale === "en" ? "active" : ""} onClick={() => onLocaleChange("en")}>
            EN
          </button>
          <button className={locale === "ru" ? "active" : ""} onClick={() => onLocaleChange("ru")}>
            RU
          </button>
        </div>
        <div className="theme-switch" aria-label="Theme">
          <button className={theme === "light" ? "active" : ""} title="Light theme" onClick={() => onThemeChange("light")}>
            <Sun size={15} />
          </button>
          <button className={theme === "dark" ? "active" : ""} title="Dark theme" onClick={() => onThemeChange("dark")}>
            <Moon size={15} />
          </button>
        </div>
        <button className="icon-button" title={t("refreshProject")} onClick={onRefreshProject} disabled={busy}>
          {busy ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
        </button>
        <button className="secondary-button" onClick={onSelectProject}>
          <FolderOpen size={17} />
          {t("selectProject")}
        </button>
      </div>
    </header>
  );
}
