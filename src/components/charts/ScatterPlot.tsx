"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface ScatterDataPoint {
  x: number;
  y: number;
  label: string;
  color?: string;
  size?: number;
  symbol?: string;
}

interface ScatterPlotProps {
  data: ScatterDataPoint[];
  xLabel?: string;
  yLabel?: string;
  title?: string;
  height?: number | string;
  yTickVals?: number[];
  yTickText?: string[];
}

export default function ScatterPlot({
  data,
  xLabel = "X",
  yLabel = "Y",
  title,
  height = 300,
  yTickVals,
  yTickText,
}: ScatterPlotProps) {
  const plotData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return [
      {
        type: "scatter" as const,
        mode: "markers" as const,
        x: data.map((d) => d.x),
        y: data.map((d) => d.y),
        text: data.map((d) => d.label),
        marker: {
          color: data.map((d) => d.color || "#3b82f6"),
          size: data.map((d) => d.size || 8),
          symbol: data.map((d) => d.symbol || "circle"),
          line: { color: "white", width: 1 },
          opacity: 0.8,
        },
        hoverinfo: "text" as const,
        showlegend: false,
      },
    ];
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full bg-gray-50 dark:bg-scientific-panel/30 border border-gray-200 dark:border-scientific-border rounded-lg flex items-center justify-center text-gray-400 text-sm italic"
        style={{ height }}
      >
        No scatter data available.
      </div>
    );
  }

  return (
    <div className="w-full m-4 bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden">
      {title && (
        <div className="p-3 border-b border-gray-200 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            <div className="h-4 w-4 inline-block mr-2">
              <svg 
                className="w-4 h-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
              ><path d="M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z"></path></svg>
            </div>
            {title}
          </h3>
        </div>
      )}
      <div style={{ height, width: "100%" }} className="relative">
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { t: title ? 10 : 30, r: 40, l: 140, b: 80 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            hovermode: "closest",
            xaxis: {
              title: { text: xLabel, font: { size: 12, color: "#9ca3af" } },
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              zeroline: true,
              zerolinecolor: "rgba(107, 114, 128, 0.2)",
              tickfont: { color: "#6b7280" },
              automargin: true,
            },
            yaxis: {
              title: { text: yLabel, font: { size: 12, color: "#9ca3af" } },
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              zeroline: true,
              zerolinecolor: "rgba(107, 114, 128, 0.2)",
              tickfont: { color: "#6b7280" },
              tickvals: yTickVals,
              ticktext: yTickText,
              automargin: true,
            },
          }}
          style={{ width: "100%", height: "100%" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
