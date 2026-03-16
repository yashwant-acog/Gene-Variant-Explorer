import React from "react";
import { Variant } from "@/lib/types";

interface OverviewTabProps {
  variant: Variant;
}

export default function OverviewTab({ variant }: OverviewTabProps) {
  const pointsField = variant.Points || "0";
  const pts = parseFloat(pointsField);

  // Classification logic
  const getClassificationInfo = (p: number) => {
    if (isNaN(p))
      return { label: "VUS", colorClass: "bg-amber-400 text-amber-900" };
    if (p >= 10)
      return { label: "Pathogenic", colorClass: "bg-red-600 text-white" };
    if (p >= 6)
      return {
        label: "Likely Pathogenic",
        colorClass: "bg-orange-500 text-white",
      };
    if (p >= -5)
      return { label: "VUS", colorClass: "bg-amber-400 text-amber-900" };
    if (p >= -9)
      return {
        label: "Likely Benign",
        colorClass: "bg-emerald-400 text-emerald-900",
      };
    return { label: "Benign", colorClass: "bg-emerald-500 text-white" };
  };

  const { label: classification, colorClass } = getClassificationInfo(pts);

  // Expanded scale to better handle values ≤ -10
  const MIN = -20;
  const MAX = 30;
  const rangeWidth = MAX - MIN;

  let positionPercent = ((pts - MIN) / rangeWidth) * 100;
  positionPercent = Math.max(0, Math.min(100, positionPercent)); // clamp

  const displayPoints = Number.isInteger(pts) ? pts.toString() : pts.toFixed(2);

  // Ticks every 5 units
  const ticks = [-20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];

  // Labels positioned below the ticks, slightly rotated downward
  const rangeLabels = [
    { text: "Benign ≤ −10", pos: 12, colorClass: "bg-emerald-500 text-white" },
    {
      text: "Likely Benign −6 to −9",
      pos: 28,
      colorClass: "bg-emerald-400 text-emerald-900 text-white",
    },
    {
      text: "VUS −5 to +5",
      pos: 50,
      colorClass: "bg-amber-400 text-amber-900 text-white",
    },
    {
      text: "Likely Pathogenic 6–9",
      pos: 70,
      colorClass: "bg-orange-500 text-white",
    },
    { text: "Pathogenic ≥ 10", pos: 90, colorClass: "bg-red-600 text-white" },
  ];

  return (
    <div className="space-y-8">
      {/* Info cards – unchanged */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Position / Alleles
          </h3>
          <p
            className={`text-xl font-mono font-semibold ${variant.cadd >= 20 ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.position.toLocaleString()} ({variant.reference} →{" "}
            {variant.alternate})
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Genomic ID
          </h3>
          <p
            className={`text-xl font-mono font-semibold`}
          >
            {variant.Genomic_ID}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Mutation Type
          </h3>
          <p className="text-xl font-mono font-semibold text-gray-900 dark:text-gray-100">
            {variant.Mutation_type}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            Score Point
          </h3>
          <p className="text-xl font-mono font-semibold text-gray-900 dark:text-gray-100">
            {variant.Points}
          </p>
        </div>
      </div>

      {/* ── Precise Linear Scale ── */}
      <div className="bg-white dark:bg-gray-800/70 px-8 py-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
          ACMG Classification (Points-based)
        </h3>

        <div className="relative pt-16 pb-24">
          {/* Floating badge – exactly at real points value */}
          <div
            className="absolute z-20"
            style={{
              left: `${positionPercent}%`,
              transform: "translateX(-50%)",
              top: "0",
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className={`px-6 py-3 rounded-full text-white font-semibold text-base shadow-lg ${colorClass} border-2 border-current whitespace-nowrap min-w-[170px] text-center`}
              >
                {classification} ({displayPoints})
              </div>
              <div
                className="w-0 h-0 mt-1 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[12px]"
                style={{
                  borderTopColor: colorClass.split(" ")[0].replace("bg-", "#"),
                }}
              />
            </div>
          </div>

          {/* Gradient track */}
          <div className="h-5 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 via-amber-400 via-orange-500 to-red-600 mt-10" />

          {/* Ticks & numeric labels */}
          <div className="relative h-12 mt-3">
            {ticks.map((tick) => {
              const pos = ((tick - MIN) / rangeWidth) * 100;
              return (
                <React.Fragment key={tick}>
                  <div
                    className="absolute top-0 w-px h-4 bg-gray-500 dark:bg-gray-400 transform -translate-x-1/2"
                    style={{ left: `${pos}%` }}
                  />
                  <div
                    className="absolute top-6 text-xs font-medium text-gray-700 dark:text-gray-300 transform -translate-x-1/2"
                    style={{ left: `${pos}%` }}
                  >
                    {tick}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Classification + range labels BELOW the ticks – slightly rotated downward */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
            Current variant score: <strong>{displayPoints}</strong> →{" "}
            {classification}
          </div>

          <div className="relative h-16 mt-8">
            {rangeLabels.map((label, i) => (
              <div
                key={i}
                className={`absolute text-xs font-medium px-3 py-1.5 rounded-lg ${label.colorClass} shadow-sm origin-top whitespace-nowrap`}
                style={{ left: `${label.pos}%`, top: "0" }}
              >
                {label.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
