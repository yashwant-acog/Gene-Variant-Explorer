import React, { useMemo, useState } from "react";
import { Variant } from "@/lib/types";
import dynamic from "next/dynamic";
import ReferenceSection from "../ReferenceSection";

// Dynamically import Plotly for client-side rendering in Next.js
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AnnotationTabProps {
  variant: Variant;
  isCustom?: boolean;
  allGeneVariants: any[];
}

export default function AnnotationTab({
  variant,
  isCustom = true,
  allGeneVariants,
}: AnnotationTabProps) {
  // Helper to parse numeric values
  const parseNum = (val: string | number | undefined) => {
    if (val === undefined || val === null) return NaN;
    if (typeof val === "string") {
      const str = val.trim();
      if (str === "" || str === "NA" || str === "False") return NaN;
      return parseFloat(str);
    }
    return val;
  };

  // Helper to classify REVEL scores and get colors
  const getRevelClassification = (score: number) => {
    if (score > 0.9) return { label: "Pathogenic", color: "#dc2626" }; // Red
    if (score >= 0.6) return { label: "Likely Pathogenic", color: "#f97316" }; // Orange
    if (score >= 0.4)
      return { label: "Uncertain Significance", color: "#eab308" }; // Yellow
    if (score >= 0.2) return { label: "Likely Benign", color: "#22c55e" }; // Light Green
    return { label: "Benign", color: "green" }; // Green
  };

  // Helper to extract Amino Acid position from Amino Acid change (e.g., "M1K" -> 1)
  const extractProteinPosition = (proteinChange: string): number => {
    if (!proteinChange || proteinChange === "N/A") return NaN;
    const match = proteinChange.match(/[A-Z](\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return NaN;
  };

  // Prepare distribution data from all custom variants for this gene
  const { plotPoints, currentIndex, maxXValue } = useMemo(() => {
    const points = allGeneVariants
      .map((v: any) => {
        const protein = v.Protein_change || v.protein_change || "N/A";
        const position = extractProteinPosition(protein);
        const revelScore = parseNum(v.REVEL || v.revel);
        const classification = getRevelClassification(revelScore);
        return {
          x: position,
          y: revelScore,
          label:
            v.Protein_change ||
            v.protein_change ||
            v.cDNA_change ||
            v.cdna_change,
          id: v.cDNA_change || v.cdna_change,
          protein: protein,
          classification: classification.label,
          color: classification.color,
        };
      })
      .filter((p: any) => !isNaN(p.y) && !isNaN(p.x));

    const currentVariantIndex = points.findIndex(
      (p: any) =>
        p.id === (variant.cDNA_change || variant.id) ||
        p.protein === variant.Protein_change,
    );

    const maxPosition =
      points.length > 0 ? Math.max(...points.map((p: any) => p.x)) : 100;
    const maxX = Math.ceil(maxPosition * 1.05);

    return {
      plotPoints: points,
      currentIndex: currentVariantIndex,
      maxXValue: maxX,
    };
  }, [variant, allGeneVariants]);

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

    plotPoints.forEach((p: any) => {
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
    ...getOffScreenAnnotations(),
  ];

  const config = {
    responsive: true,
    displayModeBar: true,
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
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 uppercase">
            {variant.VEST4_score
              ? parseFloat(variant.VEST4_score).toFixed(2)
              : "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            REVEL Score
          </h3>
          <p
            className={`text-xs font-mono font-bold ${Number(variant.REVEL) >= 0.5 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.REVEL ? Number(variant.REVEL).toFixed(3) : "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            MutPred Score
          </h3>
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 uppercase">
            {variant?.MutPred_score
              ? parseFloat(variant.MutPred_score).toFixed(2)
              : "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
            BayesDel Score
          </h3>
          <p className="text-xs font-mono font-bold text-gray-900 dark:text-gray-100 uppercase">
            {variant.BayesDel_addAF_score
              ? parseFloat(variant.BayesDel_addAF_score).toFixed(2)
              : "N/A"}
          </p>
        </div>
      </div>

      {isCustom && plotPoints.length > 0 ? (
        <div className="bg-white dark:bg-scientific-panel rounded-lg border border-gray-200 dark:border-scientific-border shadow-sm overflow-hidden">
          <div className="p-3 dark:bg-black/20 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-sm">
              REVEL Score Distribution by Amino Acid Change
            </h3>
            <div className="flex items-center gap-3">
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
              <ReferenceSection
                title="Annotation & Predictive References"
                references={variant?.["annotation reference"]}
              />
            </div>
          </div>
          <div className="bg-black h-[0.5px] mx-3"></div>
          <div className="p-3">
            <Plot
              data={[
                {
                  x: plotPoints.map((p: any) => p.x),
                  y: plotPoints.map((p: any) => p.y),
                  mode: "markers" as const,
                  type: "scatter" as const,
                  name: "main",
                  text: plotPoints.map(
                    (p: any) =>
                      `${p.label}<br>Amino Acid Position: ${p.x}<br>cDNA change: ${p.id}<br>REVEL: ${p.y.toFixed(3)}<br>Classification: ${p.classification}`,
                  ),
                  hoverinfo: "text" as const,
                  marker: {
                    size: plotPoints.map((_: any, i: number) =>
                      i === currentIndex ? 16 : 8,
                    ),
                    color: plotPoints.map((p: any, i: number) =>
                      i === currentIndex ? "#4ade80" : p.color,
                    ),
                    symbol: plotPoints.map((_: any, i: number) =>
                      i === currentIndex ? "star" : "circle",
                    ),
                    line: {
                      color: plotPoints.map((_: any, i: number) =>
                        i === currentIndex ? "#000000" : "white",
                      ),
                      width: plotPoints.map((_: any, i: number) =>
                        i === currentIndex ? 2 : 1,
                      ),
                    },
                    opacity: plotPoints.map((_: any, i: number) =>
                      i === currentIndex ? 1 : 0.7,
                    ),
                  },
                },
                ...(showMinimap
                  ? [
                      {
                        x: plotPoints.map((p: any) => p.x),
                        y: plotPoints.map((p: any) => p.y),
                        mode: "markers" as const,
                        type: "scatter" as const,
                        name: "minimap",
                        xaxis: "x2" as any,
                        yaxis: "y2" as any,
                        showlegend: false,
                        marker: {
                          size: 3,
                          color: plotPoints.map((p: any) => p.color),
                          opacity: 0.4,
                        },
                        hoverinfo: "skip" as any,
                      },
                    ]
                  : []),
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
                    text: "Amino Acid Position",
                    font: { size: 12, color: "#9ca3af" },
                  },
                  range: [0, maxXValue],
                  gridcolor: "rgba(107, 114, 128, 0.1)",
                },
                yaxis: {
                  title: {
                    text: "REVEL Score",
                    font: { size: 12, color: "#9ca3af" },
                  },
                  range: [0, 1],
                  gridcolor: "rgba(107, 114, 128, 0.1)",
                },
                ...(showMinimap
                  ? {
                      xaxis2: {
                        domain: [0.82, 0.98],
                        anchor: "y2" as any,
                        range: [0, maxXValue],
                        showgrid: false,
                        showticklabels: false,
                        linecolor: "#94a3b8",
                      },
                      yaxis2: {
                        domain: [0.82, 0.98],
                        anchor: "x2" as any,
                        range: [0, 1],
                        showgrid: false,
                        showticklabels: false,
                        linecolor: "#94a3b8",
                      },
                    }
                  : {}),
                shapes: [
                  ...(zoomRect.x0 !== null &&
                  zoomRect.x1 !== null &&
                  zoomRect.y0 !== null &&
                  zoomRect.y1 !== null
                    ? [
                        {
                          type: "rect" as any,
                          xref: "x2" as any,
                          yref: "y2" as any,
                          x0: zoomRect.x0,
                          y0: zoomRect.y0,
                          x1: zoomRect.x1,
                          y1: zoomRect.y1,
                          line: { color: "#4ade80", width: 1 },
                          fillcolor: "rgba(74, 222, 128, 0.2)",
                        },
                      ]
                    : []),
                ],
              }}
              config={config}
              useResizeHandler={true}
              style={{ width: "100%", height: "500px" }}
              onRelayout={(eventData: any) => {
                if (eventData["xaxis.range[0]"] !== undefined) {
                  setZoomRect({
                    x0: eventData["xaxis.range[0]"],
                    x1: eventData["xaxis.range[1]"],
                    y0: eventData["yaxis.range[0]"],
                    y1: eventData["yaxis.range[1]"],
                  });
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
      ) : (
        <div className="flex flex-col items-center justify-center p-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-scientific-panel/30 border border-dashed border-gray-200 dark:border-scientific-border rounded-xl">
          <p className="text-lg font-medium">
            No annotation distribution data available for this gene context.
          </p>
        </div>
      )}
    </div>
  );
}
