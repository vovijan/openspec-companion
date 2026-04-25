import { Activity, CheckCircle2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import type { AiReviewResult, SpecHealth, TranslationKey } from "../types";

type SpecHealthPanelProps = {
  busy: boolean;
  health: SpecHealth | undefined;
  review: AiReviewResult | undefined;
  onRunReview: () => void;
  t: (key: TranslationKey) => string;
};

export function SpecHealthPanel({ busy, health, review, onRunReview, t }: SpecHealthPanelProps) {
  if (!health) {
    return null;
  }

  return (
    <section className="inspector-block health-block">
      <div className="block-title">
        <Activity size={18} />
        <span>{t("specHealth")}</span>
      </div>

      <div className={`health-score ${health.tone}`}>
        <strong>{health.score}%</strong>
        <span>{health.summary}</span>
      </div>

      <div className="health-checks" aria-label={t("specHealthChecks")}>
        {health.checks.map((check) => (
          <div key={check.id} className={`health-check ${check.tone}`}>
            {check.passed ? <CheckCircle2 size={15} /> : <TriangleAlert size={15} />}
            <span>
              <strong>{check.label}</strong>
              <small>{check.detail}</small>
            </span>
          </div>
        ))}
      </div>

      <button className="secondary-button stretch review-button" onClick={onRunReview} disabled={busy}>
        {busy ? <Loader2 className="spin" size={17} /> : <Sparkles size={17} />}
        {t("aiReviewRun")}
      </button>

      {review ? (
        <div className="ai-review">
          <div>
            <strong>{t("aiReview")}</strong>
            <p>{review.summary}</p>
          </div>
          {review.issues.length ? (
            <div>
              <strong>{t("aiReviewIssues")}</strong>
              <ul>
                {review.issues.map((issue) => (
                  <li key={`${issue.title}-${issue.detail}`} className={issue.severity}>
                    <span>{issue.title}</span>
                    <small>{issue.detail}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="ok-message">{t("aiReviewEmpty")}</p>
          )}
          {review.suggestions.length ? (
            <div>
              <strong>{t("aiReviewSuggestions")}</strong>
              <ul>
                {review.suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <small>{suggestion}</small>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
