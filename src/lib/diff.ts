import { docNames } from "../constants";
import { translate } from "../i18n";
import type { DiffLine, DocName, Locale, SpecChange } from "../types";

export function getDiffSummary(change: SpecChange | undefined, locale: Locale) {
  if (!change?.isPreview) {
    return [];
  }

  return docNames.map((name) => {
    const previous = change.previousDocs?.[name];
    const next = change.docs[name];
    const action = previous === undefined ? "createdFile" : "updatedFile";
    const previousLines = previous?.split("\n").length ?? 0;
    const nextLines = next.split("\n").length;
    const delta = nextLines - previousLines;

    return {
      name,
      action: translate(locale, action, { doc: name }),
      stats: `${delta >= 0 ? "+" : ""}${delta} ${translate(locale, "diffLines")}`,
    };
  });
}

export function buildLineDiff(previousValue = "", nextValue = ""): DiffLine[] {
  const previousLines = previousValue.split("\n");
  const nextLines = nextValue.split("\n");
  const rows: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < previousLines.length || newIndex < nextLines.length) {
    const oldText = previousLines[oldIndex];
    const newText = nextLines[newIndex];

    if (oldIndex < previousLines.length && newIndex < nextLines.length && oldText === newText) {
      rows.push({
        kind: "same",
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        text: oldText,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    const nextOldMatch = oldIndex + 1 < previousLines.length && previousLines[oldIndex + 1] === newText;
    const nextNewMatch = newIndex + 1 < nextLines.length && oldText === nextLines[newIndex + 1];

    if (nextOldMatch) {
      rows.push({
        kind: "removed",
        oldLine: oldIndex + 1,
        text: oldText ?? "",
      });
      oldIndex += 1;
      continue;
    }

    if (nextNewMatch) {
      rows.push({
        kind: "added",
        newLine: newIndex + 1,
        text: newText ?? "",
      });
      newIndex += 1;
      continue;
    }

    if (oldIndex < previousLines.length) {
      rows.push({
        kind: "removed",
        oldLine: oldIndex + 1,
        text: oldText ?? "",
      });
      oldIndex += 1;
    }

    if (newIndex < nextLines.length) {
      rows.push({
        kind: "added",
        newLine: newIndex + 1,
        text: newText ?? "",
      });
      newIndex += 1;
    }
  }

  return rows;
}

export function isDocName(value: string): value is DocName {
  return docNames.includes(value as DocName);
}
