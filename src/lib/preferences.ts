import { aiProviders } from "../constants";
import type { AiProvider, HandoffTemplate, Locale, Theme } from "../types";
import type { HandoffHistoryItem } from "./agentHandoff";

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem("openspec-companion-theme");
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getInitialLocale(): Locale {
  const saved = localStorage.getItem("openspec-companion-locale");
  if (saved === "en" || saved === "ru") {
    return saved;
  }

  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function getInitialAiProvider(): AiProvider {
  const saved = localStorage.getItem("openspec-companion-ai-provider");
  return aiProviders.some((provider) => provider.id === saved) ? saved as AiProvider : "openai";
}

export function getInitialHandoffTemplate(): HandoffTemplate {
  const saved = localStorage.getItem("openspec-companion-handoff-template");
  return saved === "claude" || saved === "codex" ? saved : "codex";
}

export function getInitialIncludeReview() {
  return localStorage.getItem("openspec-companion-handoff-include-review") !== "false";
}

export function getInitialHandoffHistory(): HandoffHistoryItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem("openspec-companion-handoff-history") ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item?.id && item?.changeId && item?.prompt && (item?.template === "codex" || item?.template === "claude"))
      .slice(0, 8);
  } catch {
    return [];
  }
}
