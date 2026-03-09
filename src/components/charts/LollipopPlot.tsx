"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Variant } from "@/lib/types";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface LollipopPlotProps {
  variants: Variant[];
  highlightedId?: string;
}

// Helper to extract numeric position from proteinConsequence (e.g., "p.Gly380Arg" -> 380)
const extractPosition = (proteinConsequence: string): number | null => {
  if (!proteinConsequence) return null;
  const match = proteinConsequence.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const CLASSIFICATIONS = [
  "Benign",
  "Likely Benign",
  "VUS",
  "Likely Pathogenic",
  "Pathogenic",
];

// Map Classification to specific colors matching the Tailwind dashboard theme
const getColorForClassification = (points?: string) => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "#9ca3af"; // Gray

  if (pts >= 20) return "#ef4444"; // Pathogenic: Red
  if (pts >= 15) return "#f97316"; // Likely Pathogenic: Orange
  if (pts >= 8) return "#eab308"; // VUS: Yellow
  if (pts >= 4) return "#34d399"; // Likely Benign: Light Emerald
  return "#10b981"; // Benign: Emerald
};

const getCategoryIndex = (points?: string): number => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return 2; // Default to VUS

  if (pts >= 20) return 4; // Pathogenic
  if (pts >= 15) return 3; // Likely Pathogenic
  if (pts >= 8) return 2; // VUS
  if (pts >= 4) return 1; // Likely Benign
  return 0; // Benign
};

const getLabelForPoints = (points?: string): string => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "VUS";

  if (pts >= 20) return "Pathogenic";
  if (pts >= 15) return "Likely Pathogenic";
  if (pts >= 8) return "VUS";
  if (pts >= 4) return "Likely Benign";
  return "Benign";
};

export default function LollipopPlot({
  variants,
  highlightedId,
}: LollipopPlotProps) {
  const plotData = useMemo(() => {
    if (!variants || variants.length === 0) return [];

    const traces = variants
      .map((v) => {
        const pos = extractPosition(v.proteinConsequence || v.hgvsConsequence);
        if (pos === null) return null;

        const catIndex = getCategoryIndex(v.Points);
        const color = getColorForClassification(v.Points);
        const label = getLabelForPoints(v.Points);
        const isHighlighted =
          highlightedId &&
          (v.id === highlightedId || v.gnomAD_ID === highlightedId);

        return {
          type: "scatter" as const,
          mode: "markers" as const,
          x: [pos],
          y: [catIndex],
          name: v.proteinConsequence || v.id,
          text: `Variant: ${v.proteinConsequence || v.id}<br>Pos: ${pos}<br>Class: ${label}<br>Points: ${v.Points || "0"}`,
          hoverinfo: "text" as const,
          showlegend: false,
          marker: {
            color: color,
            size: isHighlighted ? 18 : 12,
            symbol: isHighlighted ? "diamond" : "circle",
            line: {
              color: isHighlighted ? "#ef4444" : "white",
              width: isHighlighted ? 3 : 1.5,
            },
            opacity: 1,
          },
          // Error bar act as the "stick" of the lollipop
          error_y: {
            type: "data" as const,
            symmetric: false,
            array: [0],
            arrayminus: [catIndex + 0.1],
            color: color,
            thickness: isHighlighted ? 3 : 1.5,
            width: 0,
            opacity: 0.6,
          },
        };
      })
      .filter((t): t is any => t !== null);

    return traces;
  }, [variants, highlightedId]);

  const minX = 0;
  // Dynamic max position based on variants or default to 1000
  const maxX = useMemo(() => {
    const maxVal = Math.max(
      ...variants.map(
        (v) => extractPosition(v.proteinConsequence || v.hgvsConsequence) || 0,
      ),
      0,
    );
    return Math.max(maxVal + 50, 500);
  }, [variants]);

  return (
    <div className="w-full bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="p-3 border-b border-gray-200 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 0 01-1-1V4z"
            />
          </svg>
          Variant Classification Showcase
        </h3>
      </div>
      <div className="w-full h-80 relative">
        <Plot
          data={plotData as Plotly.Data[]}
          layout={{
            autosize: true,
            margin: { t: 40, r: 40, l: 120, b: 50 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            hovermode: "closest",
            xaxis: {
              title: {
                text: "Protein Position (AA)",
                font: { size: 12, color: "#9ca3af" },
              },
              range: [minX, maxX],
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              zeroline: false,
              tickfont: { color: "#6b7280" },
            },
            yaxis: {
              title: {
                text: "Classification",
                font: { size: 12, color: "#9ca3af" },
              },
              tickvals: [0, 1, 2, 3, 4],
              ticktext: CLASSIFICATIONS,
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              zeroline: false,
              tickfont: { color: "#6b7280", size: 11 },
              range: [-0.5, 4.5],
            },
          }}
          style={{ width: "100%", height: "100%" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
