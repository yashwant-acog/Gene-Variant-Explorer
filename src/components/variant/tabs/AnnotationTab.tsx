import React, { useMemo } from "react";
import { Variant } from "@/lib/types";
import dynamic from "next/dynamic";
import { dummyCustomVariants } from "@/lib/dummyData";

// Dynamically import Plotly for client-side rendering in Next.js
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AnnotationTabProps {
  variant: Variant;
  isCustom?: boolean;
}

export default function AnnotationTab({
  variant,
  isCustom = true,
}: AnnotationTabProps) {
  // Helper to parse numeric values
  const parseNum = (val: string | number | undefined) => {
    if (val === undefined || val === null) return NaN;
    if (typeof val === "string") {
      if (!val || val.trim() === "NA" || val.trim() === "False") return NaN;
      return parseFloat(val);
    }
    return val;
  };

  // Helper to classify REVEL scores and get colors
  const getRevelClassification = (score: number) => {
    if (score > 0.9) return { label: "Pathogenic", color: "#dc2626" }; // Red
    if (score >= 0.6) return { label: "Likely Pathogenic", color: "#f97316" }; // Orange
    if (score >= 0.4) return { label: "Uncertain Significance", color: "#eab308" }; // Yellow
    if (score >= 0.2) return { label: "Likely Benign", color: "#22c55e" }; // Light Green
    return { label: "Benign", color: "green" }; // Green
  };

  // Prepare distribution data from all custom variants for this gene
  const { plotPoints, currentIndex } = useMemo(() => {
    // Filter variants for the current gene (FGFR3)
    const geneVariants = dummyCustomVariants.filter(
      (v) => variant.gene === "FGFR3", // Currently focusing on FGFR3
    );

    const points = geneVariants
      .map((v) => {
        const protein = v.Protein_change || "N/A";
        const revelScore = parseNum(v.REVEL);
        const classification = getRevelClassification(revelScore);
        return {
          x: protein,
          y: revelScore,
          label: v.Protein_change || v.cDNA_change,
          id: v.cDNA_change,
          protein: protein,
          classification: classification.label,
          color: classification.color,
        };
      })
      .filter((p) => !isNaN(p.y));

    const currentVariantIndex = points.findIndex(
      (p) => p.id === variant.id || p.id === variant.hgvsConsequence,
    );

    return { 
      plotPoints: points, 
      currentIndex: currentVariantIndex
    };
  }, [variant]);

  const annotations =
    currentIndex !== -1 && plotPoints[currentIndex]
      ? [
          {
            x: plotPoints[currentIndex].x,
            y: plotPoints[currentIndex].y,
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
      : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            CADD PHRED
          </h3>
          <p
            className={`text-xl font-mono font-bold ${variant.cadd >= 20 ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.cadd.toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            REVEL
          </h3>
          <p
            className={`text-xl font-mono font-bold ${Number(variant.REVEL) >= 0.5 ? "text-red-500 dark:text-red-400" : "text-blue-500 dark:text-blue-100"}`}
          >
            {Number(variant.REVEL).toFixed(3)}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            SIFT
          </h3>
          <p className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant?.sift?.toFixed(2) || "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            PolyPhen
          </h3>
          <p className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant.polyphen ? variant.polyphen.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-scientific-panel/50 p-6 rounded-lg border border-gray-100 dark:border-scientific-border/50">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          VEP Functional Consequence
        </h3>
        <div className="flex items-center gap-3">
          <span className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-md text-sm font-mono border border-primary-200 dark:border-primary-800">
            {variant.vepAnnotation.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 italic">
            Determined via Ensembl Variant Effect Predictor
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-scientific-panel rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 tracking-widest">
            REVEL Score Distribution by Protein Change
          </h3>
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
        
        <div className="p-4">
          <Plot
            data={[
              {
                x: plotPoints.map((p) => p.x),
                y: plotPoints.map((p) => p.y),
                mode: "markers" as const,
                type: "scatter" as const,
                name: "Variants",
                text: plotPoints.map(
                  (p) =>
                    `${p.label}<br>Protein: ${p.x}<br>cDNA change: ${p.id}<br>REVEL: ${p.y.toFixed(3)}<br>Classification: ${p.classification}`,
                ),
                hoverinfo: "text" as const,
                marker: {
                  size: plotPoints.map((_, i) => (i === currentIndex ? 16 : 8)),
                  color: plotPoints.map((p, i) =>
                    i === currentIndex
                      ? "#4ade80" // Neon Green for current variant
                      : p.color, // Color based on REVEL classification
                  ),
                  symbol: plotPoints.map((_, i) =>
                    i === currentIndex ? "star" : "circle",
                  ),
                  line: {
                    color: plotPoints.map((_, i) =>
                      i === currentIndex ? "#000000" : "white",
                    ),
                    width: plotPoints.map((_, i) =>
                      i === currentIndex ? 2 : 1,
                    ),
                  },
                  opacity: plotPoints.map((_, i) =>
                    i === currentIndex ? 1 : 0.7,
                  ),
                },
              },
            ]}
            layout={{
              autosize: true,
              height: 500,
              margin: { t: 20, r: 20, l: 100, b: 100 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              hovermode: "closest",
              annotations: annotations,
              xaxis: {
                title: {
                  text: "Protein Change",
                  font: { size: 12, color: "#9ca3af" },
                },
                tickangle: -45,
                tickfont: { 
                  color: "#6b7280",
                  size: 11,
                },
                gridcolor: "rgba(107, 114, 128, 0.1)",
                zerolinecolor: "rgba(107, 114, 128, 0.2)",
              },
              yaxis: {
                title: {
                  text: "REVEL Score",
                  font: { size: 12, color: "#9ca3af" },
                },
                range: [0, 1], // REVEL scores are between 0 and 1
                gridcolor: "rgba(107, 114, 128, 0.1)",
                zerolinecolor: "rgba(107, 114, 128, 0.2)",
                tickfont: { color: "#6b7280" },
              },
              shapes: [
                // Threshold lines
                {
                  type: "line",
                  x0: -0.5,
                  y0: 0.9,
                  x1: plotPoints.length + 0.5,
                  y1: 0.9,
                  line: {
                    color: "#dc2626",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line",
                  x0: -0.5,
                  y0: 0.6,
                  x1: plotPoints.length + 0.5,
                  y1: 0.6,
                  line: {
                    color: "#f97316",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line",
                  x0: -0.5,
                  y0: 0.4,
                  x1: plotPoints.length + 0.5,
                  y1: 0.4,
                  line: {
                    color: "#eab308",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line",
                  x0: -0.5,
                  y0: 0.2,
                  x1: plotPoints.length + 0.5,
                  y1: 0.2,
                  line: {
                    color: "#22c55e",
                    width: 2,
                    dash: "dot",
                  },
                },
              ],
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler={true}
            style={{ width: "100%", height: "500px" }}
          />
          <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 flex items-center justify-center text-[#4ade80] text-xl font-bold drop-shadow-sm"
                style={{ textShadow: "0 0 1px black, 0 0 1px black" }}
              >
                ★
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Current Variant ({variant.proteinConsequence || "Target"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#dc2626" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Pathogenic (&gt;0.9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#f97316" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Likely Pathogenic (0.6-0.9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#eab308" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Uncertain (0.4-0.6)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#22c55e" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Likely Benign (0.2-0.4)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#16a34a" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Benign (&lt;0.2)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 italic">
              Dotted lines represent REVEL score thresholds: Pathogenic (&gt;0.9), Likely Pathogenic (0.6-0.9), Uncertain (0.4-0.6), Likely Benign (0.2-0.4), Benign (&lt;0.2)
            </p>
          </div>
          <p className="text-[9px] text-center text-gray-300 dark:text-gray-600 mt-2 flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Click & drag to zoom • Scroll to pan • Double-click to reset
          </p>
        </div>
      </div>
    </div>
  );
}
