import React, { useState, useEffect } from "react";
import { Variant } from "@/lib/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
  const [ncbiData, setNcbiData] = useState<any>(null);
  const [myVariantData, setMyVariantData] = useState<any>(null);
  const [clinvarLoading, setClinvarLoading] = useState(false);
  const searchParams = useSearchParams();
  const variationID = searchParams.get("variationID");
  const hgvsId = searchParams.get("hgvsId");

  useEffect(() => {
    async function fetchExternalData() {
      if (!variationID && !hgvsId) return;
      setClinvarLoading(true);

      try {
        if (variationID) {
          const res = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${variationID}&retmode=json`,
          );
          const data = await res.json();
          setNcbiData(data);
        }

        if (hgvsId) {
          const res = await fetch(
            `https://myvariant.info/v1/variant/${encodeURIComponent(hgvsId)}`,
          );
          const data = await res.json();
          setMyVariantData(data);
        }
      } catch (err) {
        console.error("Error fetching external variant data:", err);
      } finally {
        setClinvarLoading(false);
      }
    }

    fetchExternalData();
  }, [variationID, hgvsId]);

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

              {clinvarLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
              ) : !variationID && !hgvsId ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-sm italic text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-md border border-dashed border-gray-200 dark:border-gray-700 text-center">
                    No clinvar variant found
                  </span>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  {variationID && (
                    <div className="mb-2">
                      <Link
                        href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variationID}/`}
                        target="_blank"
                        className="flex items-center text-blue-600 hover:underline"
                      >
                        <span className="text-[10px] font-medium dark:text-gray-300">
                          Variation ID: {variationID}
                        </span>
                        <svg
                          className="h-3 w-3 ml-1"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
                        </svg>
                      </Link>
                    </div>
                  )}

                  <ClinVarClassificationPlot
                    ncbiData={ncbiData}
                    myVariantData={myVariantData}
                    variationID={variationID || ""}
                  />
                </div>
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
  ncbiData: any;
  myVariantData: any;
  variationID: string;
}

function ClinVarClassificationPlot({
  ncbiData,
  myVariantData,
  variationID,
}: ClinVarClassificationPlotProps) {
  const germlineClassification =
    ncbiData?.result?.[variationID]?.germline_classification?.description ||
    "Unknown";
  const lowerDesc = germlineClassification.toLowerCase();

  const classifications = [
    "Benign",
    "Likely Benign",
    "Uncertain Significance",
    "Likely Pathogenic",
    "Pathogenic",
  ];

  const getRank = (cls: string) => {
    const l = cls.toLowerCase();

    // Check for Uncertain/Conflicting first as they often contain "pathogenic" or "benign" in the description
    if (
      l.includes("uncertain") ||
      l.includes("vus") ||
      l.includes("conflicting")
    ) {
      return 2;
    }

    if (l.includes("likely pathogenic")) return 3;
    if (l.includes("pathogenic")) return 4;
    if (l.includes("likely benign")) return 1;
    if (l.includes("benign")) return 0;

    return -1;
  };

  const getClassificationColor = (rank: number) => {
    if (rank >= 3.5) return "bg-red-600 text-white";
    if (rank >= 2.5) return "bg-orange-500 text-white";
    if (rank >= 1.5) return "bg-amber-400 text-black";
    if (rank >= 0.5) return "bg-emerald-400 text-white";
    return "bg-emerald-500 text-white";
  };

  // Handle Conflicting
  let displayLabels: string[] = [germlineClassification];
  let positionPercent = 50;
  let rangeIndices: number[] = [];

  const isConflicting = lowerDesc.includes("conflicting");

  if (isConflicting && myVariantData?.clinvar) {
    const rcv = myVariantData.clinvar.rcv;
    const rcvArray = Array.isArray(rcv) ? rcv : [rcv];
    const significances = new Set<string>();

    rcvArray.forEach((r: any) => {
      const sig =
        typeof r.clinical_significance === "string"
          ? r.clinical_significance
          : r.clinical_significance?.description;
      if (sig) significances.add(sig);
    });

    if (significances.size > 0) {
      displayLabels = Array.from(significances);
      rangeIndices = displayLabels
        .map((s) => getRank(s))
        .filter((r) => r !== -1);
    }
  }

  const finalRank =
    rangeIndices.length > 0
      ? rangeIndices.reduce((a, b) => a + b, 0) / rangeIndices.length
      : getRank(germlineClassification) !== -1
        ? getRank(germlineClassification)
        : 2;

  positionPercent = ((finalRank + 0.5) / classifications.length) * 100;

  const badgeColor = getClassificationColor(finalRank);

  return (
    <div className="space-y-3 flex-1 flex flex-col h-full">
      {/* Classification Visualization */}
      <div className="relative pt-12 pb-14 mt-8">
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
              className={`py-2 px-3 rounded-full text-white font-semibold text-[10px] ${badgeColor} border-2 border-current whitespace-nowrap text-center max-w-[400px] shadow-sm`}
            >
              {displayLabels.length > 2
                ? `Conflicting interpretations of pathogenicity`
                : displayLabels.join(" / ")}
            </div>
            <div
              className="w-0 h-0 mt-1 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[6px]"
              style={{
                borderTopColor: badgeColor.split(" ")[0].replace("bg-", "#"),
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
                className="absolute text-[9px] font-bold text-gray-500 dark:text-gray-400 transform -translate-x-1/2 text-center w-16"
                style={{ left: `${pos}%` }}
              >
                {category}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1"></div>

      <div className="mt-auto border-t border-gray-100 dark:border-gray-700 pt-4">
        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
          Source Data
        </h5>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500 dark:text-gray-400">
              NCBI ClinVar:
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {germlineClassification}
            </span>
          </div>
          {isConflicting && displayLabels.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                MyVariant Significances:
              </span>
              <div className="flex flex-wrap gap-1">
                {displayLabels.map((l, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="text-[9px] text-gray-400 mt-3 italic">
          ClinVar germline classification sourced from NCBI ClinVar and
          MyVariant.info databases.
        </p>
      </div>
    </div>
  );
}
