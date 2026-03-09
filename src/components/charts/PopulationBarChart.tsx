"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PopulationBarChartProps {
  populations: Array<{
    name: string;
    count: number;
    color?: string;
  }>;
  title?: string;
  xAxisTitle?: string;
  height?: string | number;
}

export default function PopulationBarChart({
  populations,
  title = "Population Distribution",
  xAxisTitle = "Allele Count",
  height = 400,
}: PopulationBarChartProps) {
  const plotData = useMemo(() => {
    return [
      {
        type: "bar" as const,
        x: populations.map((p) => p.count),
        y: populations.map((p) => p.name),
        orientation: "h" as const,
        marker: {
          color: populations.map((p) => p.color || "#3b82f6"),
          line: { width: 1.5, color: "white" },
        },
        text: populations.map((p) =>
          p.count >= 0.01
            ? p.count.toLocaleString()
            : p.count === 0
              ? "0"
              : p.count.toExponential(2),
        ),
        textposition: "auto" as const,
        hoverinfo: "x+y" as const,
      },
    ];
  }, [populations]);

  return (
    <div className="w-full bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden">
      {title && (
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {title}
          </h3>
        </div>
      )}
      <div className="w-full relative" style={{ height: height }}>
        <Plot
          data={plotData as any[]}
          layout={{
            autosize: true,
            margin: { t: 20, r: 40, l: 150, b: 50 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            hovermode: "closest",
            xaxis: {
              title: {
                text: xAxisTitle,
                font: { size: 12, color: "#9ca3af" },
              },
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              zeroline: false,
              tickfont: { color: "#6b7280" },
            },
            yaxis: {
              autorange: "reversed" as const,
              showgrid: false,
              zeroline: false,
              tickfont: { color: "#6b7280", size: 11 },
            },
          }}
          style={{ width: "100%", height: "100%" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
