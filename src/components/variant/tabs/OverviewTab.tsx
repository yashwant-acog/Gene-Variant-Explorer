import React, { useState } from "react";
import { Variant } from "@/lib/types";
import Link from "next/link";

interface OverviewTabProps {
  variant: Variant;
  genomicID: string;
  clinvarMatches?: any[];
  isLoading?: boolean;
}

export default function OverviewTab({
  variant,
  genomicID,
  clinvarMatches,
  isLoading = false,
}: OverviewTabProps) {
  const [showClinVarClassification, setShowClinVarClassification] =
    useState(false);
  const [selectedClinVarIndex, setSelectedClinVarIndex] = useState(0);
  const hasClinVarMatches = clinvarMatches && clinvarMatches.length > 0;
  const pointsField = variant.ACMG || "0";
  const pts = parseFloat(pointsField);

  // Classification logic
  const getClassificationInfo = (p: number) => {
    if (isNaN(p))
      return {
        label: "Uncertain Significance",
        colorClass: "bg-amber-400 text-amber-900",
      };
    if (p >= 10)
      return { label: "Pathogenic", colorClass: "bg-red-600 text-white" };
    if (p >= 6)
      return {
        label: "Likely Pathogenic",
        colorClass: "bg-orange-500 text-white",
      };
    if (p >= -5)
      return {
        label: "Uncertain Significance",
        colorClass: "bg-amber-400 text-amber-900",
      };
    if (p >= -9)
      return {
        label: "Likely Benign",
        colorClass: "bg-emerald-400 text-emerald-900",
      };
    return { label: "Benign", colorClass: "bg-emerald-500 text-white" };
  };

  const isNotScored =
    !variant.ACMG || variant.ACMG === "NA" || variant.ACMG === "N/A";
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
      text: "Uncertain Significance (−5 to +5)",
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
          <p
            className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate"
            title={variant.Genomic_ID}
          >
            {genomicID || "NA"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Mutation Type
          </h3>
          <p
            className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate"
            title={variant.Mutation_type}
          >
            {variant.Mutation_type || "NA"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            Protein Change
          </h3>
          <p
            className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 truncate"
            title={variant.proteinConsequence}
          >
            {variant.proteinConsequence || "NA"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            ACMG Score
          </h3>
          <p className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">
            {isNotScored ? "Not scored" : variant.ACMG}
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
            <div className="bg-white dark:bg-gray-800/70 px-5 py-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full min-h-[400px]">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                ACMG Classification (Points-based)
              </h4>

              {isNotScored ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                    Not scored for this variant
                  </span>
                </div>
              ) : (
                <div className="relative pt-14 pb-16 mt-24">
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
                  <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-400 via-amber-400 via-orange-500 to-red-600 mt-8" />

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
                  <div className="mt-16">
                    <div className="bg-gray-100 h-[1px] mb-3"></div>
                    {rangeLabels.map((label, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded ${label.colorClass}`}
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {label.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - ClinVar Classification */}
            <div className="bg-white dark:bg-gray-800/70 px-5 py-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full min-h-[400px]">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                ClinVar Classification
              </h4>

              {!hasClinVarMatches ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                    ClinVar classification not present for this variant
                  </span>
                </div>
              ) : (
                <>
                  {/* Variant Navigation Tabs */}
                  <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {clinvarMatches.map((match, index) => (
                        <div key={index}>
                          <button
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
                            <span className="text-[10px] underline ml-1 font-medium dark:text-gray-300 text-ellipsis truncate max-w-[150px]">
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
                </>
              )}
            </div>
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
  const rawClassification = match.germlineClassification || "Unknown";
  const lower = rawClassification.toLowerCase();

  // Check for special cases where a plot doesn't make sense
  const isSpecialCase =
    lower.includes("conflicting") ||
    lower.includes("not provided") ||
    lower.includes("no classification for the single variant");

  // Map ClinVar classifications to positions on a categorical scale
  const classifications = [
    "Benign",
    "Likely Benign",
    "Uncertain Significance",
    "Likely Pathogenic",
    "Pathogenic",
  ];

  const getClassificationColor = (classification: string) => {
    switch (classification.toLowerCase()) {
      case "benign":
        return "bg-emerald-500 text-white";
      case "likely benign":
        return "bg-emerald-400 text-white";
      case "Uncertain Significance":
      case "uncertain significance":
        return "bg-amber-400 text-black";
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
    if (lower.includes("Uncertain Significance") || lower.includes("uncertain"))
      return "Uncertain Significance";
    if (lower.includes("likely pathogenic")) return "Likely Pathogenic";
    if (lower.includes("pathogenic")) return "Pathogenic";
    return rawClassification;
  };

  if (isSpecialCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
        <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-800/30 text-center max-w-sm">
          <svg
            className="w-10 h-10 text-amber-500 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h5 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 uppercase tracking-wide">
            {lower.includes("conflicting")
              ? "Conflicting Interpretations"
              : lower.includes("no classification for the single variant")
                ? "No Classification for the Single Variant"
                : "Data Not Provided"}
          </h5>
          <p className="text-xs text-amber-700 dark:text-amber-300 italic">
            This variant is flagged as:{" "}
            <span className="font-semibold block mt-1 not-italic">
              &quot;{rawClassification}&quot;
            </span>
          </p>
        </div>
        <p className="text-[10px] text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 w-full">
          ClinVar germline classification sourced from NCBI ClinVar database.
        </p>
      </div>
    );
  }

  const displayClassification = normalizeClassification(rawClassification);

  const positionIndex = classifications.findIndex(
    (c) => c.toLowerCase() === displayClassification.toLowerCase(),
  );

  const validPosition = positionIndex >= 0 ? positionIndex : 2; // Default to Uncertain Significance if not found
  const positionPercent =
    ((validPosition + 0.5) / classifications.length) * 100;

  const { label: classification, colorClass } = (() => {
    const normalized = normalizeClassification(rawClassification);
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
      </div>

      <p className="text-[10px] text-gray-400 mt-4 border-t border-gray-100 dark:border-gray-700 pt-3">
        ClinVar germline classification sourced from NCBI ClinVar database.
      </p>
    </div>
  );
}
