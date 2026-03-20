import React, { useState } from "react";
import { Variant } from "@/lib/types";

interface OverviewTabProps {
  variant: Variant;
  clinvarMatches?: any[];
  isLoading?: boolean;
}

export default function OverviewTab({
  variant,
  clinvarMatches,
  isLoading = false,
}: OverviewTabProps) {
  const [showClinVarClassification, setShowClinVarClassification] =
    useState(false);
  const [selectedClinVarIndex, setSelectedClinVarIndex] = useState(0);
  const hasClinVarMatches = clinvarMatches && clinvarMatches.length > 0;
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
  const MAX = 20;
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
            Genomic ID
          </h3>
          <p className={`text-xl font-mono font-semibold`}>
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
            Protein Change
          </h3>
          <p className="text-xl font-mono font-semibold text-gray-900 dark:text-gray-100">
            {variant.proteinConsequence}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            ACMG score
          </h3>
          <p className="text-xl font-mono font-semibold text-gray-900 dark:text-gray-100">
            {variant.Points}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-gray-800/70 px-8 py-16 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Loading classification data...
            </p>
          </div>
        </div>
      )}

      {/* Classification Content */}
      {!isLoading && (
        <>
          {/* Classification Toggle Header */}
          {hasClinVarMatches && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {showClinVarClassification
                  ? "ClinVar Classification"
                  : "ACMG Classification (Points-based)"}
              </h3>
              <div className="flex bg-gray-100 dark:bg-scientific-border p-1 rounded-lg shrink-0">
                <button
                  onClick={() =>
                    setShowClinVarClassification(!showClinVarClassification)
                  }
                  className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    !showClinVarClassification
                      ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  Custom
                </button>
                <button
                  onClick={() =>
                    setShowClinVarClassification(!showClinVarClassification)
                  }
                  className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                    showClinVarClassification
                      ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  Clinvar
                </button>
              </div>
            </div>
          )}

          {/* ACMG Classification */}
          {!showClinVarClassification && (
        <div className="bg-white dark:bg-gray-800/70 px-8 py-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
                    borderTopColor: colorClass
                      .split(" ")[0]
                      .replace("bg-", "#"),
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

            <div className="relative h-16 mt-4">
              {rangeLabels.map((label, i) => (
                <div
                  key={i}
                  className={`absolute text-xs font-medium px-3 py-1.5 rounded-lg ${label.colorClass} shadow-sm origin-top whitespace-nowrap`}
                  style={{ left: `${label.pos - 5}%`, top: "0" }}
                >
                  {label.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

          {/* ClinVar Classification */}
          {showClinVarClassification && hasClinVarMatches && (
            <div className="bg-white dark:bg-gray-800/70 px-8 py-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              {/* Variant Navigation Tabs */}
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {clinvarMatches.map((match, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedClinVarIndex(index)}
                      className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        index === selectedClinVarIndex
                          ? "bg-primary-600 text-white shadow-md"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      Variation ID: {match.variationID}
                    </button>
                  ))}
                </div>
              </div>

              {/* ClinVar Classification Plot for Selected Variant */}
              <ClinVarClassificationPlot
                match={clinvarMatches[selectedClinVarIndex]}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ClinVar Classification Plot Component
interface ClinVarClassificationPlotProps {
  match: any;
}

function ClinVarClassificationPlot({ match }: ClinVarClassificationPlotProps) {
  // Map ClinVar classifications to positions on a categorical scale
  const classifications = [
    "Benign",
    "Likely Benign",
    "VUS",
    "Likely Pathogenic",
    "Pathogenic",
  ];

  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "benign":
        return "bg-emerald-500 text-white";
      case "likely benign":
        return "bg-emerald-400 text-emerald-900";
      case "vus":
      case "uncertain significance":
        return "bg-amber-400 text-amber-900";
      case "likely pathogenic":
        return "bg-orange-500 text-white";
      case "pathogenic":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  // Normalize the classification string
  const normalizeClassification = (rawClassification: string) => {
    const lower = rawClassification.toLowerCase();
    if (lower.includes("benign") && !lower.includes("likely")) return "Benign";
    if (lower.includes("likely benign")) return "Likely Benign";
    if (lower.includes("vus") || lower.includes("uncertain")) return "VUS";
    if (lower.includes("likely pathogenic")) return "Likely Pathogenic";
    if (lower.includes("pathogenic")) return "Pathogenic";
    return rawClassification;
  };

  const displayClassification = normalizeClassification(
    match.germlineClassification || "Unknown"
  );

  const positionIndex = classifications.findIndex(
    (c) => c.toLowerCase() === displayClassification.toLowerCase()
  );

  const validPosition = positionIndex >= 0 ? positionIndex : 2; // Default to VUS if not found
  const positionPercent =
    ((validPosition + 0.5) / classifications.length) * 100;

  const { label: classification, colorClass } = (() => {
    const normalized = normalizeClassification(
      match.germlineClassification || "Unknown"
    );
    return {
      label: normalized,
      colorClass: getClassificationColor(normalized),
    };
  })();

  return (
    <div className="space-y-4">
      {/* Classification Visualization */}
      <div className="relative pt-16 pb-16">
        {/* Floating badge */}
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
              {classification}
            </div>
            <div
              className="w-0 h-0 mt-1 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[12px]"
              style={{
                borderTopColor: colorClass.split(" ")[0].replace("bg-", "#"),
              }}
            />
          </div>
        </div>

        {/* Categorical gradient track */}
        <div className="h-5 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 via-amber-400 via-orange-500 to-red-600 mt-10" />

        {/* Category labels below */}
        <div className="relative h-12 mt-3">
          {classifications.map((category, index) => {
            const pos = ((index + 0.5) / classifications.length) * 100;
            return (
              <div
                key={category}
                className="absolute text-xs font-medium text-gray-700 dark:text-gray-300 transform -translate-x-1/2"
                style={{ left: `${pos}%` }}
              >
                {category}
              </div>
            );
          })}
        </div>

        {/* Colored background segments */}
        <div className="relative h-8 mt-2 flex">
          <div className="flex-1 bg-emerald-500/20 border-r border-white/30" />
          <div className="flex-1 bg-emerald-400/20 border-r border-white/30" />
          <div className="flex-1 bg-amber-400/20 border-r border-white/30" />
          <div className="flex-1 bg-orange-500/20 border-r border-white/30" />
          <div className="flex-1 bg-red-600/20" />
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
        ClinVar germline classification sourced from NCBI ClinVar database.
      </p>
    </div>
  );
}
