import { translate } from "../i18n";
import type { Locale, SpecChange } from "../types";

export function validateChange(change: SpecChange, locale: Locale) {
  const warnings: string[] = [];

  if (!change.docs["proposal.md"].includes("## Why")) {
    warnings.push(translate(locale, "proposalMissingWhy"));
  }

  if (!change.docs["design.md"].trim()) {
    warnings.push(translate(locale, "designEmpty"));
  }

  if (!change.docs["tasks.md"].includes("- [ ]") && !change.docs["tasks.md"].includes("- [x]")) {
    warnings.push(translate(locale, "tasksMissing"));
  }

  return warnings;
}
