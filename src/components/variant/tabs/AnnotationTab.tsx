import React, { useMemo, useState } from "react";
import { Variant } from "@/lib/types";
import dynamic from "next/dynamic";
import { dummyCustomVariants } from "@/lib/dummyData";
import { config } from "node:process";

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

  // Helper to extract protein position from protein change (e.g., "M1K" -> 1)
  const extractProteinPosition = (proteinChange: string): number => {
    if (!proteinChange || proteinChange === "N/A") return NaN;
    // Match the numeric part in the protein change (e.g., M1K -> 1, A256T -> 256)
    const match = proteinChange.match(/[A-Z](\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return NaN;
  };

  // Prepare distribution data from all custom variants for this gene
  const { plotPoints, currentIndex, maxXValue } = useMemo(() => {
    // Filter variants for the current gene (FGFR3)
    const geneVariants = dummyCustomVariants.filter(
      (v) => variant.gene === "FGFR3", // Currently focusing on FGFR3
    );

    const points = geneVariants
      .map((v) => {
        const protein = v.Protein_change || "N/A";
        const position = extractProteinPosition(protein);
        const revelScore = parseNum(v.REVEL);
        const classification = getRevelClassification(revelScore);
        return {
          x: position,
          y: revelScore,
          label: v.Protein_change || v.cDNA_change,
          id: v.cDNA_change,
          protein: protein,
          classification: classification.label,
          color: classification.color,
        };
      })
      .filter((p) => !isNaN(p.y) && !isNaN(p.x));

    const currentVariantIndex = points.findIndex(
      (p) => p.id === variant.id || p.id === variant.hgvsConsequence,
    );

    // Find the maximum protein position for dynamic x-axis scaling
    const maxPosition = points.length > 0 ? Math.max(...points.map(p => p.x)) : 100;
    // Add 5% padding to the max value for better visualization
    const maxX = Math.ceil(maxPosition * 1.05);

    return { 
      plotPoints: points, 
      currentIndex: currentVariantIndex,
      maxXValue: maxX
    };
  }, [variant]);

  // State for minimap visibility
  const [showMinimap, setShowMinimap] = useState(true);

  // State for minimap zoom rectangle
  const [zoomRect, setZoomRect] = useState<{
    x0: number | null;
    x1: number | null;
    y0: number | null;
    y1: number | null;
  }>({ x0: null, x1: null, y0: null, y1: null });

  // State to track view range for off-screen indicators
  const [viewRange, setViewRange] = useState<{
    xMin: number | null;
    xMax: number | null;
    yMin: number | null;
    yMax: number | null;
  }>({ xMin: null, xMax: null, yMin: null, yMax: null });

  // Calculate counts of points outside the current view
  const getOffScreenCounts = () => {
    const { xMin, xMax, yMin, yMax } = viewRange;
    if (xMin === null || xMax === null || yMin === null || yMax === null) {
      return { above: 0, below: 0, left: 0, right: 0 };
    }

    const counts = { above: 0, below: 0, left: 0, right: 0 };
    
    plotPoints.forEach((p) => {
      if (p.y > yMax) counts.above++;
      else if (p.y < yMin) counts.below++;
      
      if (p.x < xMin) counts.left++;
      else if (p.x > xMax) counts.right++;
    });

    return counts;
  };

  const offScreenCounts = getOffScreenCounts();

  // Create annotations for off-screen points
  const getOffScreenAnnotations = () => {
    if (!viewRange.xMin || !viewRange.xMax || !viewRange.yMin || !viewRange.yMax) {
      return [];
    }

    const annotations: any[] = [];
    const xMid = (viewRange.xMin + viewRange.xMax) / 2;
    const yMid = (viewRange.yMin + viewRange.yMax) / 2;

    // Above indicator
    if (offScreenCounts.above > 0) {
      annotations.push({
        x: xMid,
        y: viewRange.yMax,
        xref: "x" as const,
        yref: "y" as const,
        text: `▲ ${offScreenCounts.above} more`,
        showarrow: false,
        font: { size: 11 },
        yshift: -5,
        bgcolor: "rgba(241, 245, 249, 0.9)",
        borderpad: 4,
      });
    }

    // Below indicator
    if (offScreenCounts.below > 0) {
      annotations.push({
        x: xMid,
        y: viewRange.yMin,
        xref: "x" as const,
        yref: "y" as const,
        text: `▼ ${offScreenCounts.below} more`,
        showarrow: false,
        font: { size: 11 },
        yshift: 5,
        bgcolor: "rgba(241, 245, 249, 0.9)",
        borderpad: 4,
      });
    }

    // Left indicator
    if (offScreenCounts.left > 0) {
      annotations.push({
        x: viewRange.xMin,
        y: yMid,
        xref: "x" as const,
        yref: "y" as const,
        text: `${offScreenCounts.left} more ◀`,
        showarrow: false,
        font: { size: 11 },
        xshift: 5,
        bgcolor: "rgba(241, 245, 249, 0.9)",
        borderpad: 4,
      });
    }

    // Right indicator
    if (offScreenCounts.right > 0) {
      annotations.push({
        x: viewRange.xMax,
        y: yMid,
        xref: "x" as const,
        yref: "y" as const,
        text: `▶ ${offScreenCounts.right} more`,
        showarrow: false,
        font: { size: 11 },
        xshift: -5,
        bgcolor: "rgba(241, 245, 249, 0.9)",
        borderpad: 4,
      });
    }

    return annotations;
  };

  const annotations = [
    // Current variant annotation
    ...(currentIndex !== -1 && plotPoints[currentIndex]
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
      : []),
    // Off-screen point indicators
    ...getOffScreenAnnotations(),
  ];

  const config = {
    responsive: true,
    displayModeBar: true, // Allow zoom controls
    displaylogo: false,
  };

  return (
    <div className="space-y-4">
      {/* Compact score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            VEST4 Score
          </h3>
          <p
            className={`text-xs font-mono font-bold ${variant.cadd >= 20 ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.VEST4_score ? parseFloat(variant.VEST4_score).toFixed(2) : "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            REVEL Score
          </h3>
          <p
            className={`text-xs font-mono font-bold ${Number(variant.REVEL) >= 0.5 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {Number(variant.REVEL).toFixed(3)}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            MutPred Score
          </h3>
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant?.MutPred_score ? parseFloat(variant.MutPred_score).toFixed(2) : "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            BayesDel Score
          </h3>
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant.BayesDel_addAF_score ? parseFloat(variant.BayesDel_addAF_score).toFixed(2) : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-scientific-panel/50 p-4 rounded-lg border border-gray-100 dark:border-scientific-border/50">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
          VEP Functional Consequence
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-2.5 py-1 rounded-md text-xs font-mono border border-primary-200 dark:border-primary-800">
            {variant.vepAnnotation.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400 italic">
            Via Ensembl VEP
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-scientific-panel rounded-lg border border-gray-200 dark:border-scientific-border shadow-sm overflow-hidden">
        <div className="p-3 dark:bg-black/20 flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            REVEL Score Distribution by Protein Change
          </h3>
          <div className="flex items-center">
            {/* Minimap Toggle Button */}
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                showMinimap
                  ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 border-primary-300 dark:border-primary-700"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
              }`}
            >
              {showMinimap ? "✓ Minimap On" : "○ Minimap Off"}
            </button>
            {/* Controls Hint Tooltip */}
            <div className="relative group ml-2">
            <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-help transition-all hover:bg-primary-100 dark:hover:bg-primary-900 hover:border-primary-400 dark:hover:border-primary-600">
              <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {/* Tooltip Content */}
            <div className="absolute right-0 top-8 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-3">
                <h4 className="text-[10px] font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wider">Plot Controls</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Extend Axis</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">Hover over axis end and drag</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Shrink Axis</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">Hover over axis start and drag</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Scroll Axis</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">Hover over axis middle and drag</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Box Zoom</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">Click and drag to draw box</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                      <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Reset View</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">Double-click to reset zoom</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        <div className="bg-black h-[0.5px] mx-3"></div>
        <div className="p-3">
          <Plot
            data={[
              {
                x: plotPoints.map((p) => p.x),
                y: plotPoints.map((p) => p.y),
                mode: "markers" as const,
                type: "scatter" as const,
                name: "main",
                text: plotPoints.map(
                  (p) =>
                    `${p.label}<br>Protein Position: ${p.x}<br>cDNA change: ${p.id}<br>REVEL: ${p.y.toFixed(3)}<br>Classification: ${p.classification}`,
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
              // Minimap data - smaller overview (only shown when showMinimap is true)
              ...(showMinimap ? [{
                x: plotPoints.map((p) => p.x),
                y: plotPoints.map((p) => p.y),
                mode: "markers" as const,
                type: "scatter" as const,
                name: "minimap",
                xaxis: "x2" as any,
                yaxis: "y2" as any,
                showlegend: false,
                marker: {
                  size: 3,
                  color: plotPoints.map((p) => p.color),
                  opacity: 0.4,
                },
                hoverinfo: "skip" as any,
              }] : []),
            ]}
            layout={{
              autosize: true,
              height: 500,
              margin: { t: 10, r: 20, l: 100, b: 100 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              hovermode: "closest",
              annotations: annotations,
              xaxis: {
                title: {
                  text: "Protein Position",
                  font: { size: 12, color: "#9ca3af" },
                },
                tickangle: 0,
                tickfont: { 
                  color: "#6b7280",
                  size: 11,
                },
                range: [0, maxXValue], // Dynamic range based on max protein position
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
              // Minimap axes configuration (only shown when showMinimap is true)
              ...(showMinimap ? {
                xaxis2: {
                  domain: [0.82, 0.98],
                  anchor: "y2" as any,
                  range: [0, maxXValue],
                  showgrid: false,
                  showticklabels: false,
                  zeroline: false,
                  showline: true,
                  linewidth: 1,
                  linecolor: "#94a3b8",
                },
                yaxis2: {
                  domain: [0.82, 0.98],
                  anchor: "x2" as any,
                  range: [0, 1],
                  showgrid: false,
                  showticklabels: false,
                  zeroline: false,
                  showline: true,
                  linewidth: 1,
                  linecolor: "#94a3b8",
                },
              } : {}),
              shapes: [
                // Zoom rectangle for minimap
                ...(zoomRect.x0 !== null && zoomRect.x1 !== null && zoomRect.y0 !== null && zoomRect.y1 !== null
                  ? [
                      {
                        type: "rect" as any,
                        xref: "x2" as any,
                        yref: "y2" as any,
                        x0: zoomRect.x0,
                        y0: zoomRect.y0,
                        x1: zoomRect.x1,
                        y1: zoomRect.y1,
                        line: {
                          color: "#4ade80",
                          width: 1,
                        },
                        fillcolor: "rgba(74, 222, 128, 0.2)",
                      },
                    ]
                  : []),
                // Threshold lines
                {
                  type: "line" as any,
                  x0: 0,
                  y0: 0.9,
                  x1: maxXValue,
                  y1: 0.9,
                  line: {
                    color: "#dc2626",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line" as any,
                  x0: 0,
                  y0: 0.6,
                  x1: maxXValue,
                  y1: 0.6,
                  line: {
                    color: "#f97316",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line" as any,
                  x0: 0,
                  y0: 0.4,
                  x1: maxXValue,
                  y1: 0.4,
                  line: {
                    color: "#eab308",
                    width: 2,
                    dash: "dot",
                  },
                },
                {
                  type: "line" as any,
                  x0: 0,
                  y0: 0.2,
                  x1: maxXValue,
                  y1: 0.2,
                  line: {
                    color: "#22c55e",
                    width: 2,
                    dash: "dot",
                  },
                },
              ],
            }}
            config={config}
            useResizeHandler={true}
            style={{ width: "100%", height: "500px" }}
            onRelayout={(eventData: any) => {
              if (eventData["xaxis.range[0]"] !== undefined) {
                // Update zoom rectangle for minimap
                setZoomRect({
                  x0: eventData["xaxis.range[0]"],
                  x1: eventData["xaxis.range[1]"],
                  y0: eventData["yaxis.range[0]"],
                  y1: eventData["yaxis.range[1]"],
                });
                // Update view range for off-screen indicators
                setViewRange({
                  xMin: eventData["xaxis.range[0]"],
                  xMax: eventData["xaxis.range[1]"],
                  yMin: eventData["yaxis.range[0]"],
                  yMax: eventData["yaxis.range[1]"],
                });
              }
            }}
            onDoubleClick={() => {
              setZoomRect({ x0: null, x1: null, y0: null, y1: null });
              setViewRange({ xMin: null, xMax: null, yMin: null, yMax: null });
            }}
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
        </div>
      </div>
    </div>
  );
}
