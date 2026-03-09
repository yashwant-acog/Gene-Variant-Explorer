import React from "react";
import Plot from "react-plotly.js";
import { Variant } from "@/lib/types";
import { dummyCustomVariants } from "@/lib/dummyData";

interface FunctionalTabProps {
  variant: Variant;
  isCustom: boolean;
}

export default function FunctionalTab({
  variant,
  isCustom,
}: FunctionalTabProps) {
  // Helper to parse numeric values from strings, handling "NA"
  const parseNum = (val: string) => {
    if (!val || val.trim() === "NA" || val.trim() === "False") return NaN;
    return parseFloat(val);
  };

  // Prepare data from dummyCustomVariants
  const plotPoints = dummyCustomVariants
    .map((v) => ({
      x: parseNum(v.Functional),
      y: parseNum(v.Pvalue_functional),
      cDNA: v.cDNA_change,
      protein: v.Protein_change,
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y));

  // Find the point for the current variant
  const currentVariantIndex = plotPoints.findIndex(
    (p) => p.cDNA === variant.id || p.cDNA === variant.hgvsConsequence,
  );

  const plotData = [
    {
      x: plotPoints.map((p) => p.x),
      y: plotPoints.map((p) => p.y),
      mode: "markers" as const,
      type: "scatter" as const,
      marker: {
        size: plotPoints.map((_, i) => (i === currentVariantIndex ? 14 : 6)),
        color: plotPoints.map((p, i) =>
          i === currentVariantIndex
            ? "#4ade80" // Neon Green for current
            : p.x < 0
              ? "#ef4444"
              : "#3b82f6",
        ),
        symbol: plotPoints.map((_, i) =>
          i === currentVariantIndex ? "star" : "circle",
        ),
        line: {
          color: plotPoints.map((_, i) =>
            i === currentVariantIndex ? "#000000" : "transparent",
          ),
          width: plotPoints.map((_, i) => (i === currentVariantIndex ? 2 : 0)),
        },
        opacity: plotPoints.map((_, i) =>
          i === currentVariantIndex ? 1 : 0.6,
        ),
      },
      text: plotPoints.map(
        (p) =>
          `${p.protein} (${p.cDNA})<br>Functional: ${p.x}<br>P-value: ${p.y}`,
      ),
      hoverinfo: "text" as const,
      showlegend: false,
    },
  ];

  const layout = {
    height: 450,
    title: {
      text: "Functional Impact Distribution (Experimental Data)",
      font: { size: 16, weight: "bold" as const },
    },
    xaxis: {
      title: { text: "Functional Score" },
      zeroline: true,
      zerolinecolor: "#94a3b8",
      zerolinewidth: 1,
      gridcolor: "#f1f5f9",
    },
    yaxis: {
      title: { text: "P-value Functional" },
      autorange: "reversed" as const, // Typically smaller p-values are "better"
      gridcolor: "#f1f5f9",
    },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 60, r: 40, t: 80, b: 60 },
    hovermode: "closest" as const,
    font: { family: "Inter, sans-serif" },
  };

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  return (
    <div className="space-y-6">
      {isCustom && (
        <>
          {/* Splicing cards (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                  Functional Score
                </h3>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                  {plotPoints[currentVariantIndex].x
                    ? plotPoints[currentVariantIndex].x
                    : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-blue-500 font-medium">
                  Effect Height
                </span>
              </div>
            </div>
            <div className="bg-purple-50/50 dark:bg-purple-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                  Pvalue Functional
                </h3>
                <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                  {plotPoints[currentVariantIndex].y
                    ? plotPoints[currentVariantIndex].y
                    : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-500 font-medium">
                  Pvalue Height
                </span>
              </div>
            </div>
          </div>

          {/* New Plot Section */}
          <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Functional Evidence Overview
            </h3>

            <div className="w-full">
              <Plot
                data={plotData}
                layout={layout}
                config={config}
                useResizeHandler={true}
                style={{ width: "100%", height: "450px" }}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 flex items-center justify-center text-[#4ade80] text-xl font-bold drop-shadow-sm"
                  style={{ textShadow: "0 0 1px black, 0 0 1px black" }}
                >
                  ★
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {currentVariantIndex !== -1
                    ? `Current Variant (${plotPoints[currentVariantIndex].protein})`
                    : "Current Variant (Not Found)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: "#ef4444" }}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Loss of Function
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: "#3b82f6" }}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Gain/Neutral Function
                </span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-3 italic">
              Vertical axis is reversed: higher points are more statistically
              significant.
            </p>
          </div>
        </>
      )}

      {!isCustom && (
        <div className="flex flex-col items-center justify-center p-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-scientific-panel/30 border border-dashed border-gray-200 dark:border-scientific-border rounded-xl">
          <p className="text-lg font-medium">
            Functional analysis for ClinVar variants currently uses standardized
            annotations.
          </p>
          <p className="text-sm mt-1">
            Switch to Custom Analysis for detailed predictor scores.
          </p>
        </div>
      )}
    </div>
  );
}
