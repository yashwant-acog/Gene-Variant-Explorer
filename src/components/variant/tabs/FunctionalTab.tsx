import React, { useState } from "react";
import Plot from "react-plotly.js";
import { Variant } from "@/lib/types";
import { dummyCustomVariants } from "@/lib/dummyData";
import { title } from "node:process";

interface FunctionalTabProps {
  variant: Variant;
  isCustom: boolean;
}

export default function FunctionalTab({
  variant,
  isCustom,
}: FunctionalTabProps) {
  // State to track zoom level for showing off-screen points
  const [viewRange, setViewRange] = useState<{
    xMin: number | null;
    xMax: number | null;
    yMin: number | null;
    yMax: number | null;
  }>({ xMin: null, xMax: null, yMin: null, yMax: null });

  // State for minimap visibility
  const [showMinimap, setShowMinimap] = useState(true);

  // State for minimap zoom rectangle
  const [zoomRect, setZoomRect] = useState<{
    x0: number | null;
    x1: number | null;
    y0: number | null;
    y1: number | null;
  }>({ x0: null, x1: null, y0: null, y1: null });

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
    (p) => p.cDNA === variant.id || p.cDNA === variant.hgvsConsequence
  );

  const plotData = [
    {
      x: plotPoints.map((p) => p.x),
      y: plotPoints.map((p) => p.negLog10Y), // Use transformed y-axis
      mode: "markers" as const,
      type: "scatter" as const,
      name: "main",
      marker: {
        size: plotPoints.map((_, i) => (i === currentVariantIndex ? 14 : 6)),
        color: plotPoints.map((_, i) =>
          i === currentVariantIndex
            ? "#4ade80" // Neon Green for current
            : plotPoints[i].x < 0
            ? "#3b82f6":
            "#ef4444"
        ),
        symbol: plotPoints.map((_, i) =>
          i === currentVariantIndex ? "star" : "circle"
        ),
        line: {
          color: plotPoints.map((_, i) =>
            i === currentVariantIndex ? "#000000" : "transparent"
          ),
          width: plotPoints.map((_, i) => (i === currentVariantIndex ? 2 : 0)),
        },
        opacity: plotPoints.map((_, i) =>
          i === currentVariantIndex ? 1 : 0.6
        ),
      },
      text: plotPoints.map(
        (p) =>
          `${p.protein} (${p.cDNA})<br>Functional: ${p.x}<br>P-value: ${
            p.y
          }<br>-log10(P): ${p.negLog10Y.toFixed(2)}`
      ),
      hoverinfo: "text" as const,
      showlegend: false,
    },
    // Minimap data - smaller overview (only shown when showMinimap is true)
    ...(showMinimap
      ? [
          {
            x: plotPoints.map((p) => p.x),
            y: plotPoints.map((p) => p.negLog10Y),
            mode: "markers" as const,
            type: "scatter" as const,
            name: "minimap",
            xaxis: "x2" as any,
            yaxis: "y2" as any,
            showlegend: false,
            marker: {
              size: 3,
              color: plotPoints.map((_, i) =>
                plotPoints[i].x < 0 ? "#3b82f6": "#ef4444"
              ),
              opacity: 0.4,
            },
            hoverinfo: "skip" as any,
          },
        ]
      : []),
  ];

  const yValues = plotPoints.map((p) => p.negLog10Y).filter((y) => !isNaN(y));
  const hasYData = yValues.length > 0;
  const minY = hasYData ? Math.min(...yValues) : 0;
  const maxY = hasYData ? Math.max(...yValues) : 1;
  const yPadding = (maxY - minY) * 0.2 || 0.1; // 20% padding to increase range

  const currentPoint =
    currentVariantIndex !== -1 ? plotPoints[currentVariantIndex] : null;

  // Calculate counts of points outside the current view
  const getOffScreenCounts = () => {
    const { xMin, xMax, yMin, yMax } = viewRange;
    if (xMin === null || xMax === null || yMin === null || yMax === null) {
      return { above: 0, below: 0, left: 0, right: 0 };
    }

    const counts = { above: 0, below: 0, left: 0, right: 0 };

    plotPoints.forEach((p) => {
      if (p.negLog10Y > yMax) counts.above++;
      else if (p.negLog10Y < yMin) counts.below++;

      if (p.x < xMin) counts.left++;
      else if (p.x > xMax) counts.right++;
    });

    return counts;
  };

  const offScreenCounts = getOffScreenCounts();

  // Create annotations for off-screen points
  const getOffScreenAnnotations = () => {
    if (
      !viewRange.xMin ||
      !viewRange.xMax ||
      !viewRange.yMin ||
      !viewRange.yMax
    ) {
      return [];
    }

    const annotations: any[] = [];
    const xMid = (viewRange.xMin + viewRange.xMax) / 2;
    const yMid = (viewRange.yMin + viewRange.yMax) / 2;
    const xRange = viewRange.xMax - viewRange.xMin;
    const yRange = viewRange.yMax - viewRange.yMin;

    // Above indicator
    if (offScreenCounts.above > 0) {
      annotations.push({
        x: xMid,
        y: viewRange.yMax,
        xref: "x",
        yref: "y",
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
        xref: "x",
        yref: "y",
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
        xref: "x",
        yref: "y",
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
        xref: "x",
        yref: "y",
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

  const offScreenAnnotations = getOffScreenAnnotations();

  const layout = {
    height: 500,
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
        number
      ], // Normal order (bottom to top)
      nticks: 20, // increase intervals
      gridcolor: "#f1f5f9",
    },
    // Minimap axes configuration (only shown when showMinimap is true)
    ...(showMinimap
      ? {
          xaxis2: {
            domain: [0.75, 0.95],
            anchor: "y2" as any,
            range: [
              Math.min(...plotPoints.map((p) => p.x)),
              Math.max(...plotPoints.map((p) => p.x)),
            ],
            showgrid: false,
            showticklabels: false,
            zeroline: false,
            showline: true,
            linewidth: 1,
            linecolor: "#94a3b8",
          },
          yaxis2: {
            domain: [0.77, 0.97],
            anchor: "x2" as any,
            range: [Math.max(0, minY - yPadding), maxY + yPadding],
            showgrid: false,
            showticklabels: false,
            zeroline: false,
            showline: true,
            linewidth: 1,
            linecolor: "#94a3b8",
          },
        }
      : {}),
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
    margin: { l: 70, r: 40, t: 10, b: 60 },
    hovermode: "closest" as const,
    font: { family: "Inter, sans-serif" },
    annotations: [
      // Current variant annotation
      ...(currentPoint &&
      !isNaN(currentPoint.x) &&
      !isNaN(currentPoint.negLog10Y)
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
        : []),
      // Off-screen point indicators
      ...offScreenAnnotations,
    ],
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
            <div className="flex my-1">
                <h2 className="mr-auto font-semibold text-md">Functional Impact Distribution (Experimental Data)</h2>
              <button
                onClick={() => setShowMinimap(!showMinimap)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex-shrink-0 ${
                  showMinimap
                    ? "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 border-primary-300 dark:border-primary-700"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                }`}
              >
                {showMinimap ? "✓ Minimap On" : "○ Minimap Off"}
              </button>
              {/* Controls Hint Tooltip */}
                <div className="relative group ml-4 mt-auto mb-auto">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center cursor-help transition-all hover:bg-primary-100 dark:hover:bg-primary-900 hover:border-primary-400 dark:hover:border-primary-600">
                    <svg
                      className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  {/* Tooltip Content */}
                  <div className="absolute right-0 top-8 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase tracking-wider">
                        Plot Controls
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Extend Axis
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Hover over axis end and drag
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16l-4-4m0 0l4-4m-4 4h18"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Shrink Axis
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Hover over axis start and drag
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Scroll Axis
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Hover over axis middle and drag
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                strokeWidth={2}
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 9h6v6H9z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Box Zoom
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Click and drag to draw box
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
                            <svg
                              className="w-4 h-4 text-gray-600 dark:text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              Reset View
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              Double-click to reset zoom
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            {/* horizontal divider */}
            <div className="bg-black h-[0.5px] my-2 mt-4"></div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="w-full flex items-center gap-3">
                <div className="w-full">
                  <Plot
                    data={plotData}
                    layout={{
                      ...layout,
                      shapes:
                        zoomRect.x0 !== null &&
                        zoomRect.x1 !== null &&
                        zoomRect.y0 !== null &&
                        zoomRect.y1 !== null
                          ? [
                              {
                                type: "rect",
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
                          : [],
                    }}
                    config={config}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "500px" }}
                    onRelayout={(eventData: any) => {
                      // Update view range for off-screen indicators
                      if (eventData["xaxis.range[0]"] !== undefined) {
                        setViewRange({
                          xMin: eventData["xaxis.range[0]"],
                          xMax: eventData["xaxis.range[1]"],
                          yMin: eventData["yaxis.range[0]"],
                          yMax: eventData["yaxis.range[1]"],
                        });
                        // Update minimap zoom rectangle
                        setZoomRect({
                          x0: eventData["xaxis.range[0]"],
                          x1: eventData["xaxis.range[1]"],
                          y0: eventData["yaxis.range[0]"],
                          y1: eventData["yaxis.range[1]"],
                        });
                      }
                    }}
                    onDoubleClick={() => {
                      // Reset zoom rectangle on double-click
                      setZoomRect({ x0: null, x1: null, y0: null, y1: null });
                      setViewRange({
                        xMin: null,
                        xMax: null,
                        yMin: null,
                        yMax: null,
                      });
                    }}
                  />
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
                  style={{ backgroundColor: "#3b82f6" }}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Loss of Function
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: "#ef4444" }}
                ></div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Gain of Function
                </span>
              </div>
            </div>
            <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-3 italic">
              Y-axis shows -log10(P-value): higher values indicate greater
              statistical significance.
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
