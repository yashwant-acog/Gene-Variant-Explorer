"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface FrequencyHistogramProps {
  frequencies: number[];
  currentValue?: number;
  title?: string;
  height?: string | number;
}

export default function FrequencyHistogram({
  frequencies,
  currentValue,
  title = "Allele Frequency Distribution",
  height = 400,
}: FrequencyHistogramProps) {
  const plotData = useMemo(() => {
    const traces: any[] = [
      {
        type: "histogram",
        x: frequencies,
        name: "Dataset Frequencies",
        autobinx: true,
        marker: {
          color: "rgba(59, 130, 246, 0.5)",
          line: { width: 1, color: "rgb(59, 130, 246)" },
        },
        hoverinfo: "y+x",
      },
    ];

    if (currentValue !== undefined && currentValue > 0) {
      traces.push({
        type: "scatter",
        x: [currentValue],
        y: [0], // We'll put it at the bottom, Plotly might need help with Y if we want it to span
        mode: "markers",
        name: "Current Variant",
        marker: {
          color: "#ef4444",
          size: 15,
          symbol: "star",
          line: { width: 2, color: "white" },
        },
        hoverinfo: "name+x",
      });
    }

    return traces;
  }, [frequencies, currentValue]);

  return (
    <div className="w-full bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden">
      {title && (
        <div className="p-3 border-b border-gray-200 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
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
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {title}
          </h3>
        </div>
      )}
      <div className="w-full relative" style={{ height: height }}>
        <Plot
          data={plotData}
          layout={{
            autosize: true,
            margin: { t: 20, r: 40, l: 60, b: 50 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            hovermode: "closest",
            showlegend: false,
            xaxis: {
              title: {
                text: "Allele Frequency",
                font: { size: 12, color: "#9ca3af" },
              },
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
              type: "linear", // Can switch to log if needed
            },
            yaxis: {
              title: {
                text: "Count",
                font: { size: 12, color: "#9ca3af" },
              },
              showgrid: true,
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
            },
            shapes:
              currentValue !== undefined
                ? [
                    {
                      type: "line",
                      xref: "x",
                      yref: "paper",
                      x0: currentValue,
                      x1: currentValue,
                      y0: 0,
                      y1: 1,
                      line: {
                        color: "#ef4444",
                        width: 2,
                        dash: "dash",
                      },
                    },
                  ]
                : [],
          }}
          style={{ width: "100%", height: "100%" }}
          config={{ responsive: true, displayModeBar: false }}
        />
      </div>
    </div>
  );
}
