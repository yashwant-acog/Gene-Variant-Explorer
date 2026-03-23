import React, { useState } from "react";
import { Variant } from "@/lib/types";
import Link from "next/link";

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

  // Ticks every 5 units from -20 to 20
  const ticks = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

  // Labels for legend display below the plot
  const rangeLabels = [
    { text: "Benign (≤ −10)", colorClass: "bg-emerald-500 text-white" },
    {
      text: "Likely Benign (−6 to −9)",
      colorClass: "bg-emerald-400 text-emerald-900",
    },
    {
      text: "VUS (−5 to +5)",
      colorClass: "bg-amber-400 text-amber-900",
    },
    {
      text: "Likely Pathogenic (6 to 9)",
      colorClass: "bg-orange-500 text-white",
    },
    { text: "Pathogenic (≥ 10)", colorClass: "bg-red-600 text-white" },
  ];

  return (
    <div className="space-y-4">
      {/* Compact info cards with horizontal layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Genomic ID
          </h3>
          <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate" title={variant.Genomic_ID}>
            {variant.Genomic_ID}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Mutation Type
          </h3>
          <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate" title={variant.Mutation_type}>
            {variant.Mutation_type}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Protein Change
          </h3>
          <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate" title={variant.proteinConsequence}>
            {variant.proteinConsequence}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            ACMG Score
          </h3>
          <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">
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
          {/* Classification Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Clinical Classifications
            </h3>
          </div>

          {/* Two-column layout for classifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column - ACMG Classification */}
            <div className="bg-white dark:bg-gray-800/70 px-5 py-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                ACMG Classification (Points-based)
              </h4>
              <div className="relative pt-14 pb-16">
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
                      className={`px-2 py-2.5 rounded-full text-white font-semibold text-[10px] ${colorClass} border-2 border-current whitespace-nowrap min-w-[100px] text-center`}
                    >
                      {classification} ({displayPoints})
                    </div>
                    <div
                      className="w-0 h-0 mt-1 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[8px]"
                      style={{
                        borderTopColor: colorClass
                          .split(" ")[0]
                          .replace("bg-", "#"),
                      }}
                    />
                  </div>
                </div>

                {/* Gradient track */}
                <div className="h-4 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 via-amber-400 via-orange-500 to-red-600 mt-10" />

                {/* Ticks & numeric labels */}
                <div className="relative h-10 mt-2">
                  {ticks.map((tick) => {
                    const pos = ((tick - MIN) / rangeWidth) * 100;
                    return (
                      <React.Fragment key={tick}>
                        <div
                          className="absolute top-0 w-px h-3 bg-gray-500 dark:bg-gray-400 transform -translate-x-1/2"
                          style={{ left: `${pos}%` }}
                        />
                        <div
                          className="absolute top-4 text-xs font-medium text-gray-700 dark:text-gray-300 transform -translate-x-1/2"
                          style={{ left: `${pos}%` }}
                        >
                          {tick}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Legend labels below the plot */}
                <div className="mt-20">
                  {rangeLabels.map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${label.colorClass}`} />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {label.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - ClinVar Classification */}
            {hasClinVarMatches && (
              <div className="bg-white dark:bg-gray-800/70 px-5 py-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                  ClinVar Classification
                </h4>

                {/* Variant Navigation Tabs */}
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {clinvarMatches.map((match, index) => (
                      <div>
                        <button
                          key={index}
                          onClick={() => setSelectedClinVarIndex(index)}
                          className={`cursor-pointer px-4 py-2 rounded-lg text-[10px] flex items-center font-medium whitespace-nowrap transition-all ${
                            index === selectedClinVarIndex
                              ? "bg-primary-600 text-white shadow-md"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {match.title}
                        </button>
                        <Link
                          href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${match.variationID}/`}
                          target="_blank"
                          className="flex items-center mt-2 text-blue-600"
                        >
                          <span className="text-[10px] underline ml-1 font-medium dark:text-gray-300">
                            Variation ID: {match.variationID}
                          </span>
                          <div className="h-4 w-4 ml-1 cursor-pointer">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
                            </svg>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ClinVar Classification Plot for Selected Variant */}
                <ClinVarClassificationPlot
                  match={clinvarMatches[selectedClinVarIndex]}
                />
              </div>
            )}
          </div>
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
    <div className="space-y-3">
      {/* Classification Visualization */}
      <div className="relative pt-12 pb-14">
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
              className={`py-2.5 px-2 rounded-full text-white font-semibold text-[10px] ${colorClass} border-2 border-current whitespace-nowrap min-w-[80px] text-center`}
            >
              {classification}
            </div>
            <div
              className="w-0 h-0 mt-1 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[6px]"
              style={{
                borderTopColor: colorClass.split(" ")[0].replace("bg-", "#"),
              }}
            />
          </div>
        </div>

        {/* Categorical gradient track */}
        <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 via-amber-400 via-orange-500 to-red-600 mt-8" />

        {/* Category labels below */}
        <div className="relative h-8 mt-2">
          {classifications.map((category, index) => {
            const pos = ((index + 0.5) / classifications.length) * 100;
            return (
              <div
                key={category}
                className="absolute text-[10px] font-medium text-gray-700 dark:text-gray-300 transform -translate-x-1/2"
                style={{ left: `${pos}%` }}
              >
                {category}
              </div>
            );
          })}
        </div>

        {/* Colored background segments */}
        <div className="relative h-6 mt-2 flex">
          <div className="flex-1 bg-emerald-500/20 border-r border-white/30" />
          <div className="flex-1 bg-emerald-400/20 border-r border-white/30" />
          <div className="flex-1 bg-amber-400/20 border-r border-white/30" />
          <div className="flex-1 bg-orange-500/20 border-r border-white/30" />
          <div className="flex-1 bg-red-600/20" />
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
        ClinVar germline classification sourced from NCBI ClinVar database.
      </p>
    </div>
  );
}
