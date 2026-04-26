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
import { AgentHandoffPanel } from "./components/AgentHandoffPanel";
import { ChangeSidebar } from "./components/ChangeSidebar";
import { EditorPanel } from "./components/EditorPanel";
import { SpecHealthPanel } from "./components/SpecHealthPanel";
import { Topbar } from "./components/Topbar";
import { aiProviders, defaultContextOptions, docNames, improveActions } from "./constants";
import { demoChanges } from "./demoData";
import { useDiffPreviewControls } from "./hooks/useDiffPreviewControls";
import { usePersistentPreference } from "./hooks/usePersistentPreference";
import { translate } from "./i18n";
import { buildAgentHandoffPrompt, createHandoffHistoryItem, type HandoffHistoryItem } from "./lib/agentHandoff";
import { generateAiDraft, improveChangeWithAi, normalizeChangeId, reviewChangeWithAi } from "./lib/aiClient";
import { buildLineDiff, getDiffSummary } from "./lib/diff";
import { archiveChangeInProject, ensureProjectPermission, listSpecFiles, loadOpenSpecProject, readOptionalFile, writeTextFile } from "./lib/filesystem";
import { getInitialAiProvider, getInitialHandoffHistory, getInitialHandoffTemplate, getInitialIncludeReview, getInitialLocale, getInitialTheme } from "./lib/preferences";
import { deleteRecentProject, getRecentProjects, saveRecentProject } from "./lib/recentProjects";
import { getSpecHealth } from "./lib/specHealth";
import { validateChange } from "./lib/validation";
import type { AiProvider, AiReviewResult, ContextKey, ContextOptions, DocName, HandoffTemplate, ImproveAction, Locale, ProjectState, RecentProject, SpecChange, Theme, TranslationKey } from "./types";

type AiProviderInfo = {
  id: AiProvider;
  label: string;
  configured: boolean;
  model: string;
};

export default function App() {
  const [locale, setLocaleState] = usePersistentPreference<Locale>("openspec-companion-locale", getInitialLocale);
  const [theme, setTheme] = usePersistentPreference<Theme>("openspec-companion-theme", getInitialTheme);
  const [aiProvider, setAiProvider] = usePersistentPreference<AiProvider>("openspec-companion-ai-provider", getInitialAiProvider);
  const [handoffTemplate, setHandoffTemplateState] = usePersistentPreference<HandoffTemplate>("openspec-companion-handoff-template", getInitialHandoffTemplate);
  const [includeReviewInHandoff, setIncludeReviewInHandoffState] = useState(getInitialIncludeReview);
  const [project, setProject] = useState<ProjectState>({ name: "Demo Repository", changes: demoChanges });
  const [selectedId, setSelectedId] = useState(demoChanges[0].id);
  const [activeDoc, setActiveDoc] = useState<DocName>("proposal.md");
  const [idea, setIdea] = useState("Add an OpenSpec change browser with AI-assisted draft generation");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(() => translate(getInitialLocale(), "demoMode"));
  const [query, setQuery] = useState("");
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [handoffHistory, setHandoffHistory] = useState<HandoffHistoryItem[]>(getInitialHandoffHistory);
  const [aiProviderInfo, setAiProviderInfo] = useState<AiProviderInfo[]>([]);
  const [aiReview, setAiReview] = useState<AiReviewResult | undefined>();
  const [contextOptions, setContextOptions] = useState<ContextOptions>(defaultContextOptions);
  const [patchPreview, setPatchPreview] = useState<SpecChange | undefined>();
  const { expandedDiffFiles, resetDiffPreviewControls, selectedPatchFiles, toggleDiffFile, togglePatchFile } = useDiffPreviewControls();
  const t = (key: TranslationKey, values?: Record<string, string | number>) => translate(locale, key, values);

  function setLocale(nextLocale: Locale) {
    setLocaleState(nextLocale);
    setNotice(translate(nextLocale, "demoMode"));
  }

  function setIncludeReviewInHandoff(nextValue: boolean) {
    setIncludeReviewInHandoffState(nextValue);
    localStorage.setItem("openspec-companion-handoff-include-review", String(nextValue));
  }

  function saveHandoffHistory(nextHistory: HandoffHistoryItem[]) {
    setHandoffHistory(nextHistory);
    localStorage.setItem("openspec-companion-handoff-history", JSON.stringify(nextHistory));
  }

  useEffect(() => {
    getRecentProjects()
      .then(setRecentProjects)
      .catch(() => setNotice(t("recentProjectsLoadFailed")));
  }, [locale]);

  useEffect(() => {
    fetch("/api/ai-providers")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.providers)) {
          setAiProviderInfo(data.providers);
        }
      })
      .catch(() => setAiProviderInfo([]));
  }, []);

  useEffect(() => {
    setPatchPreview(undefined);
    setAiReview(undefined);
  }, [selectedId]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selectedChange = project.changes.find((change) => change.id === selectedId) ?? project.changes[0];
  const displayedChange = patchPreview && patchPreview.id === selectedChange?.id ? patchPreview : selectedChange;
  const warnings = displayedChange ? validateChange(displayedChange, locale) : [];
  const specHealth = useMemo(() => getSpecHealth(displayedChange, locale), [displayedChange, locale]);
  const diffSummary = getDiffSummary(patchPreview ?? displayedChange, locale);
  const diffChange = patchPreview ?? (displayedChange?.isPreview ? displayedChange : undefined);
  const selectedAiProvider = aiProviders.find((provider) => provider.id === aiProvider) ?? aiProviders[0];
  const selectedAiProviderInfo = aiProviderInfo.find((provider) => provider.id === aiProvider);
  const handoffPrompt = useMemo(
    () => buildAgentHandoffPrompt({
      change: displayedChange,
      health: specHealth,
      includeReview: includeReviewInHandoff,
      locale,
      projectName: project.name,
      review: aiReview,
      template: handoffTemplate,
    }),
    [aiReview, displayedChange, handoffTemplate, includeReviewInHandoff, locale, project.name, specHealth],
  );

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
    const draft = await generateAiDraft(idea, project, aiProvider);
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
      draft.source !== "local"
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
    const patch = await improveChangeWithAi(action, selectedChange, project, contextOptions, aiProvider);
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
      patch.source !== "local"
        ? patch.model
          ? `${t("aiPreviewGenerated")} (${patch.model})`
          : t("aiPreviewGenerated")
        : t("aiApiFallback"),
    );
    setBusy(false);
  }

  async function reviewSelectedChange() {
    if (!displayedChange || !specHealth) {
      return;
    }

    setBusy(true);
    const review = await reviewChangeWithAi(displayedChange, project, contextOptions, aiProvider, specHealth);
    setAiReview(review);
    setNotice(
      review.source !== "local"
        ? review.model
          ? `${t("aiReviewGenerated")} (${review.model})`
          : t("aiReviewGenerated")
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
    setAiReview(undefined);
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

  async function copyHandoffPrompt(template: HandoffTemplate) {
    if (!displayedChange) {
      return;
    }

    const prompt = buildAgentHandoffPrompt({
      change: displayedChange,
      health: specHealth,
      includeReview: includeReviewInHandoff,
      locale,
      projectName: project.name,
      review: aiReview,
      template,
    });
    if (!prompt) {
      return;
    }

    await navigator.clipboard.writeText(prompt);
    saveHandoffHistory([
      createHandoffHistoryItem(displayedChange.id, prompt, template),
      ...handoffHistory,
    ].slice(0, 8));
    setNotice(t("agentHandoffCopied"));
  }

  async function copyHandoffHistoryItem(item: HandoffHistoryItem) {
    await navigator.clipboard.writeText(item.prompt);
    setNotice(t("agentHandoffCopied"));
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
            <label className="field-label">
              <span>{t("aiProvider")}</span>
              <select value={aiProvider} onChange={(event) => setAiProvider(event.target.value as AiProvider)}>
                {aiProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted provider-model">
              {t("modelLabel")}: {selectedAiProviderInfo?.model ?? selectedAiProvider.defaultModel}
              <span className={selectedAiProviderInfo?.configured ? "provider-status configured" : "provider-status missing"}>
                {selectedAiProviderInfo?.configured ? t("providerConfigured") : t("providerMissingKey")}
              </span>
            </p>
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

          <SpecHealthPanel
            busy={busy}
            health={specHealth}
            review={aiReview}
            onRunReview={reviewSelectedChange}
            t={t}
          />

          <AgentHandoffPanel
            history={handoffHistory}
            includeReview={includeReviewInHandoff}
            prompt={handoffPrompt}
            selectedTemplate={handoffTemplate}
            onCopy={copyHandoffPrompt}
            onCopyHistory={copyHandoffHistoryItem}
            onIncludeReviewChange={setIncludeReviewInHandoff}
            onTemplateChange={setHandoffTemplateState}
            t={t}
          />

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
