"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface ForestPlotData {
  name: string;
  oddsRatio: number;
  ciLower: number;
  ciUpper: number;
  color?: string;
}

interface ForestPlotProps {
  studies: ForestPlotData[];
  title?: string;
  height?: number | string;
  xAxisType?: "log" | "linear";
  nullEffect?: number;
  xAxisTitle?: string;
}

export default function ForestPlot({
  studies,
  title = "Association Studies (Forest Plot)",
  height = 300,
  xAxisType = "log",
  nullEffect = 1,
  xAxisTitle = "Effect Size",
}: ForestPlotProps) {
  const plotData = useMemo(() => {
    if (!studies || studies.length === 0) return [];

    // Reverse the array so the first item appears at the top of the Y axis
    const reversedStudies = [...studies].reverse();

    return [
      {
        type: "scatter" as const,
        mode: "markers" as const,
        x: reversedStudies.map((s) => s.oddsRatio),
        y: reversedStudies.map((s) => s.name),
        text: reversedStudies.map(
          (s) =>
            `${s.name}: ${s.oddsRatio.toFixed(3)} [${s.ciLower.toFixed(3)}-${s.ciUpper.toFixed(3)}]`,
        ),
        marker: {
          color: reversedStudies.map((s) => s.color || "#0ea5e9"), // Default sky blue
          size: 10,
          symbol: "square",
        },
        error_x: {
          type: "data" as const,
          symmetric: false,
          array: reversedStudies.map((s) => s.ciUpper - s.oddsRatio),
          arrayminus: reversedStudies.map((s) => s.oddsRatio - s.ciLower),
          color: "rgba(107, 114, 128, 0.6)",
          thickness: 1.5,
          width: 4,
        },
        hoverinfo: "text" as const,
        showlegend: false,
      },
    ];
  }, [studies]);

  if (!studies || studies.length === 0) {
    return (
      <div
        className="w-full bg-gray-50 dark:bg-scientific-panel/30 border border-gray-200 dark:border-scientific-border rounded-lg flex items-center justify-center text-gray-400 text-sm italic"
        style={{ height }}
      >
        No association studies data available.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden">
      {title && (
        <div className="p-3 border-b border-gray-200 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
        </div>
      )}
      <div style={{ height, width: "100%" }} className="relative p-2">
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { t: 20, r: 30, l: 150, b: 50 }, // Left margin large to accommodate study names
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            hovermode: "closest",
            xaxis: {
              title: { text: xAxisTitle, font: { size: 11, color: "#9ca3af" } },
              type: xAxisType,
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
              zeroline: false,
            },
            yaxis: {
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.05)",
              zeroline: false,
              tickfont: { color: "#4b5563", size: 12 },
            },
            shapes: [
              // Vertical line of no effect
              {
                type: "line",
                x0: nullEffect,
                x1: nullEffect,
                y0: -0.5,
                y1: studies.length - 0.5,
                line: {
                  color: "rgba(239, 68, 68, 0.5)", // Red dashed line
                  width: 1.5,
                  dash: "dash",
                },
              },
            ],
          }}
          style={{ width: "100%", height: "100%" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
