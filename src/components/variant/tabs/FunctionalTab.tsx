import React, { useState } from "react";
import Plot from "react-plotly.js";
import { Variant } from "@/lib/types";
import DisclaimerEditor from "../DisclaimerEditor";

interface FunctionalTabProps {
  variant: Variant;
  isCustom: boolean;
  allGeneVariants: any[];
}

export default function FunctionalTab({
  variant,
  isCustom,
  allGeneVariants,
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
  const parseNum = (val: any) => {
    if (val === undefined || val === null) return NaN;
    const str = val.toString().trim();
    if (str === "" || str === "NA" || str === "False") return NaN;
    return parseFloat(str);
  };

  const plotPoints = allGeneVariants
    .map((v: any) => {
      const func = parseNum(v.Functional || v.functional);
      const pval = parseNum(v.Pvalue_functional || v.pvalue_functional);
      return {
        x: func,
        y: pval,
        negLog10Y: -Math.log10(pval), // Transform p-value to -log10
        cDNA: v.cDNA_change || v.cdna_change,
        protein: v.Protein_change || v.protein_change,
        Mutation_type: v.Mutation_type || v.mutation_type,
      };
    })
    .filter((p: any) => !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.negLog10Y));

  // Find the point for the current variant
  const currentVariantIndex = plotPoints.findIndex(
    (p: any) =>
      p.cDNA === (variant.cDNA_change || variant.id) ||
      p.protein === variant.Protein_change,
  );

  const plotData = [
    {
      x: plotPoints.map((p: any) => p.x),
      y: plotPoints.map((p: any) => p.negLog10Y), // Use transformed y-axis
      mode: "markers" as const,
      type: "scatter" as const,
      name: "main",
      marker: {
        size: plotPoints.map((_: any, i: number) =>
          i === currentVariantIndex ? 14 : 6,
        ),
        color: plotPoints.map((p: any, i: number) =>
          i === currentVariantIndex
            ? "#4ade80" // Neon Green for current
            : p.x < 0
              ? "#3b82f6"
              : "#ef4444",
        ),
        symbol: plotPoints.map((_: any, i: number) =>
          i === currentVariantIndex ? "star" : "circle",
        ),
        line: {
          color: plotPoints.map((_: any, i: number) =>
            i === currentVariantIndex ? "#000000" : "transparent",
          ),
          width: plotPoints.map((_: any, i: number) =>
            i === currentVariantIndex ? 2 : 0,
          ),
        },
        opacity: plotPoints.map((_: any, i: number) =>
          i === currentVariantIndex ? 1 : 0.6,
        ),
      },
      text: plotPoints.map(
        (p: any) =>
          `${p.protein} (${p.cDNA})<br>Functional: ${p.x}<br>P-value: ${
            p.y
          }<br>-log10(P): ${p.negLog10Y.toFixed(2)}`,
      ),
      hoverinfo: "text" as const,
      showlegend: false,
    },
    // Minimap data - smaller overview (only shown when showMinimap is true)
    ...(showMinimap
      ? [
          {
            x: plotPoints.map((p: any) => p.x),
            y: plotPoints.map((p: any) => p.negLog10Y),
            mode: "markers" as const,
            type: "scatter" as const,
            name: "minimap",
            xaxis: "x2" as any,
            yaxis: "y2" as any,
            showlegend: false,
            marker: {
              size: 3,
              color: plotPoints.map((p: any) =>
                p.x < 0 ? "#3b82f6" : "#ef4444",
              ),
              opacity: 0.4,
            },
            hoverinfo: "skip" as any,
          },
        ]
      : []),
  ];

  const yValues = plotPoints
    .map((p: any) => p.negLog10Y)
    .filter((y: number) => !isNaN(y));
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

    plotPoints.forEach((p: any) => {
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
      viewRange.xMin === null ||
      viewRange.xMax === null ||
      viewRange.yMin === null ||
      viewRange.yMax === null
    ) {
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
      side: "bottom" as const,
    },
    yaxis: {
      title: { text: "−log₁₀(p)" },
      range: [Math.max(0, minY - yPadding), maxY + yPadding],
      nticks: 20,
      gridcolor: "#f1f5f9",
    },
    // Minimap axes configuration
    ...(showMinimap
      ? {
          xaxis2: {
            domain: [0.75, 0.95],
            anchor: "y2" as any,
            range: [
              Math.min(...plotPoints.map((p: any) => p.x), 0),
              Math.max(...plotPoints.map((p: any) => p.x), 1),
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
      ...offScreenAnnotations,
    ],
  };

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  return (
    <div className="space-y-6">
      <DisclaimerEditor gene={variant.gene} tab="functional" />
      {isCustom && plotPoints.length > 0 ? (
        <>
          <div className="bg-white dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex my-1 items-center gap-3">
              <h2 className="mr-auto font-semibold text-md">
                Functional Impact Distribution (Experimental Data)
              </h2>
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
            </div>
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
                      if (eventData["xaxis.range[0]"] !== undefined) {
                        setViewRange({
                          xMin: eventData["xaxis.range[0]"],
                          xMax: eventData["xaxis.range[1]"],
                          yMin: eventData["yaxis.range[0]"],
                          yMax: eventData["yaxis.range[1]"],
                        });
                        setZoomRect({
                          x0: eventData["xaxis.range[0]"],
                          x1: eventData["xaxis.range[1]"],
                          y0: eventData["yaxis.range[0]"],
                          y1: eventData["yaxis.range[1]"],
                        });
                      }
                    }}
                    onDoubleClick={() => {
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
                    : "Current Variant"}
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
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-scientific-panel/30 border border-dashed border-gray-200 dark:border-scientific-border rounded-xl">
          <p className="text-lg font-medium">
            No functional analysis data available for this gene context.
          </p>
          <p className="text-sm mt-1">
            Data is dynamically retrieved from the database based on the
            selected gene.
          </p>
        </div>
      )}
    </div>
  );
}
