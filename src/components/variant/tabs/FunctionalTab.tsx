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
      negLog10Y: -Math.log10(parseNum(v.Pvalue_functional)), // Transform p-value to -log10
      cDNA: v.cDNA_change,
      protein: v.Protein_change,
    }))
    .filter((p) => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.negLog10Y));

  // Find the point for the current variant
  const currentVariantIndex = plotPoints.findIndex(
    (p) => p.cDNA === variant.id || p.cDNA === variant.hgvsConsequence,
  );

  const plotData = [
    {
      x: plotPoints.map((p) => p.x),
      y: plotPoints.map((p) => p.negLog10Y), // Use transformed y-axis
      mode: "markers" as const,
      type: "scatter" as const,
      marker: {
        size: plotPoints.map((_, i) => (i === currentVariantIndex ? 14 : 6)),
        color: plotPoints.map((_, i) =>
          i === currentVariantIndex
            ? "#4ade80" // Neon Green for current
            : plotPoints[i].x < 0
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
          `${p.protein} (${p.cDNA})<br>Functional: ${p.x}<br>P-value: ${p.y}<br>-log10(P): ${p.negLog10Y.toFixed(2)}`,
      ),
      hoverinfo: "text" as const,
      showlegend: false,
    },
  ];

  const yValues = plotPoints.map((p) => p.negLog10Y).filter((y) => !isNaN(y));
  const hasYData = yValues.length > 0;
  const minY = hasYData ? Math.min(...yValues) : 0;
  const maxY = hasYData ? Math.max(...yValues) : 1;
  const yPadding = (maxY - minY) * 0.2 || 0.1; // 20% padding to increase range

  const currentPoint =
    currentVariantIndex !== -1 ? plotPoints[currentVariantIndex] : null;

  const layout = {
    height: 600,
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
      side: "bottom" as const, // Move x-axis to bottom
    },
    yaxis: {
      title: { text: "−log₁₀(p)" },
      range: [Math.max(0, minY - yPadding), maxY + yPadding] as [
        number,
        number,
      ], // Normal order (bottom to top)
      nticks: 20, // increase intervals
      gridcolor: "#f1f5f9",
    },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 70, r: 40, t: 150, b: 60 },
    hovermode: "closest" as const,
    font: { family: "Inter, sans-serif" },
    annotations:
      currentPoint && !isNaN(currentPoint.x) && !isNaN(currentPoint.negLog10Y)
        ? [
            {
              x: currentPoint.x,
              y: currentPoint.negLog10Y,
              xref: "x" as const,
              yref: "y" as const,
              text: "Current Variant",
              showarrow: true,
              arrowhead: 2,
              ax: 40,
              ay: -60,
              arrowcolor: "#16a34a",
              font: { size: 13, color: "#16a34a", weight: "bold" as const },
              bgcolor: "rgba(255, 255, 255, 0.9)",
              bordercolor: "#16a34a",
              borderpad: 4,
            },
          ]
        : [],
  };

  const config = {
    responsive: true,
    displayModeBar: true, // Allow zoom controls
  displaylogo: false,
  };

  return (
    <div className="space-y-6">
      {isCustom && (
        <>
          {/* New Plot Section */}
          <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-full">
                <Plot
                  data={plotData}
                  layout={layout}
                  config={config}
                  useResizeHandler={true}
                  style={{ width: "100%", height: "600px" }}
                />
              </div>
              {/* Controls Hint Tooltip */}
              <div className="relative group ml-4">
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-help transition-all hover:bg-primary-100 dark:hover:bg-primary-900 hover:border-primary-400 dark:hover:border-primary-600">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {/* Tooltip Content */}
                <div className="absolute right-0 top-8 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-wider">Plot Controls</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Extend Axis</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Hover over axis end and drag</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Shrink Axis</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Hover over axis start and drag</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Scroll Axis</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Hover over axis middle and drag</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Box Zoom</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Click and drag to draw box</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Reset View</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">Double-click to reset zoom</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                  Gain of Function
                </span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-3 italic">
              Y-axis shows -log10(P-value): higher values indicate greater statistical significance.
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
