import type { Locale, SpecChange, SpecHealth } from "../types";

type Rule = {
  id: string;
  label: Record<Locale, string>;
  detail: Record<Locale, string>;
  weight: number;
  test: (change: SpecChange) => boolean;
};

const rules: Rule[] = [
  {
    id: "proposal-why",
    label: { en: "Problem is stated", ru: "Проблема описана" },
    detail: { en: "proposal.md should include a clear Why section.", ru: "proposal.md должен содержать понятный раздел Why." },
    weight: 18,
    test: (change) => hasHeading(change.docs["proposal.md"], "Why"),
  },
  {
    id: "proposal-what",
    label: { en: "Scope is visible", ru: "Область изменений видна" },
    detail: { en: "proposal.md should describe what changes.", ru: "proposal.md должен описывать, что именно меняется." },
    weight: 16,
    test: (change) => /##\s+(What Changes|What|Scope)/i.test(change.docs["proposal.md"]),
  },
  {
    id: "proposal-impact",
    label: { en: "Impact is covered", ru: "Влияние описано" },
    detail: { en: "proposal.md should mention impact, risks, or migration concerns.", ru: "proposal.md должен упоминать impact, риски или миграцию." },
    weight: 14,
    test: (change) => /##\s+(Impact|Risks?|Migration)/i.test(change.docs["proposal.md"]),
  },
  {
    id: "design-concrete",
    label: { en: "Design is concrete", ru: "Дизайн конкретный" },
    detail: { en: "design.md should contain enough implementation detail to guide work.", ru: "design.md должен содержать достаточно деталей для реализации." },
    weight: 18,
    test: (change) => words(change.docs["design.md"]) >= 35,
  },
  {
    id: "tasks-actionable",
    label: { en: "Tasks are actionable", ru: "Задачи пригодны к работе" },
    detail: { en: "tasks.md should include checkbox tasks.", ru: "tasks.md должен содержать задачи с чекбоксами." },
    weight: 18,
    test: (change) => /- \[[ x]\]\s+\S/i.test(change.docs["tasks.md"]),
  },
  {
    id: "tasks-open",
    label: { en: "Work remains visible", ru: "Оставшаяся работа видна" },
    detail: { en: "tasks.md should include at least one open task before implementation is complete.", ru: "tasks.md должен содержать хотя бы одну открытую задачу до завершения." },
    weight: 8,
    test: (change) => /- \[ \]\s+\S/i.test(change.docs["tasks.md"]),
  },
  {
    id: "change-id",
    label: { en: "Change id is clean", ru: "ID изменения корректный" },
    detail: { en: "Change id should be kebab-case and easy to use as a branch name.", ru: "ID изменения должен быть kebab-case и подходить для имени ветки." },
    weight: 8,
    test: (change) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change.id),
  },
];

export function getSpecHealth(change: SpecChange | undefined, locale: Locale): SpecHealth | undefined {
  if (!change) {
    return undefined;
  }

  const checks = rules.map((rule) => {
    const passed = rule.test(change);
    return {
      id: rule.id,
      label: rule.label[locale],
      detail: rule.detail[locale],
      passed,
      tone: passed ? "good" as const : rule.weight >= 16 ? "danger" as const : "warning" as const,
    };
  });
  const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
  const passedWeight = rules.reduce((sum, rule) => sum + (rule.test(change) ? rule.weight : 0), 0);
  const score = Math.round((passedWeight / totalWeight) * 100);
  const tone = score >= 80 ? "good" : score >= 55 ? "warning" : "danger";

  return {
    score,
    tone,
    checks,
    summary: getSummary(score, locale),
  };
}

function hasHeading(value: string, heading: string) {
  return new RegExp(`^##\\s+${heading}\\b`, "im").test(value);
}

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function getSummary(score: number, locale: Locale) {
  if (locale === "ru") {
    if (score >= 80) {
      return "Change выглядит готовым к реализации.";
    }
    if (score >= 55) {
      return "Change можно реализовывать, но перед этим стоит уточнить слабые места.";
    }
    return "Change пока сырой: лучше укрепить proposal, design или tasks.";
  }

  if (score >= 80) {
    return "This change looks ready for implementation.";
  }
  if (score >= 55) {
    return "This change is workable, but a few weak spots should be tightened first.";
  }
  return "This change is still rough; strengthen the proposal, design, or tasks before implementation.";
}
