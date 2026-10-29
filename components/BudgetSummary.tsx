import { formatMoney } from "@/lib/format";
import type { BudgetSummary as Summary } from "@/lib/itinerary/budget";

type Props = {
  summary: Summary;
  currency: string;
};

export default function BudgetSummary({ summary, currency }: Props) {
  const over = summary.remaining < 0;
  // The bar never draws past 100%; "over budget" is shown in words and color.
  const barWidth = Math.min(summary.usedPercent, 100);

  return (
    <section
      aria-labelledby="budget-heading"
      className="rounded-xl border border-line bg-surface p-4 sm:p-5"
    >
      <h3 id="budget-heading" className="font-semibold">
        Budget estimate
      </h3>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-ink-muted">Your budget</dt>
          <dd className="font-medium">{formatMoney(summary.budget, currency)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Plan estimate</dt>
          <dd className="font-medium">~{formatMoney(summary.estimatedTotal, currency)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">{over ? "Over by" : "Left over"}</dt>
          <dd
            className={
              "font-medium " +
              (over ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")
            }
          >
            ~{formatMoney(Math.abs(summary.remaining), currency)}
          </dd>
        </div>
      </dl>

      <div
        role="meter"
        aria-label="Share of budget used by the plan estimate"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={barWidth}
        aria-valuetext={`${summary.usedPercent}% of your budget`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className={"h-full rounded-full " + (over ? "bg-red-600" : "bg-emerald-600")}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1 text-xs text-ink-muted">
        <li>
          Estimates cover the activities and meals in this plan, for one person.
          Accommodation and transport aren&apos;t included.
        </li>
        {summary.unknownCount > 0 && (
          <li>
            {summary.unknownCount} {summary.unknownCount === 1 ? "stop has" : "stops have"} no
            cost estimate and {summary.unknownCount === 1 ? "isn't" : "aren't"} counted.
          </li>
        )}
      </ul>
    </section>
  );
}
