"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export interface VolcanoDataPoint {
  x: number; // Effect Size
  y: number; // P-value
  label: string;
  isCurrent: boolean;
}

interface VolcanoPlotProps {
  points: VolcanoDataPoint[];
  title: string;
  xAxisTitle?: string;
  height?: number | string;
}

export default function VolcanoPlot({
  points,
  title,
  xAxisTitle = "Effect Size (Beta)",
  height = 400,
}: VolcanoPlotProps) {
  const data = useMemo(() => {
    if (!points || points.length === 0) return [];

    // Transform p-values to -log10(p)
    const backgroundPoints = points.filter((p) => !p.isCurrent);
    const currentVariant = points.find((p) => p.isCurrent);

    const series = [
      {
        name: "Background Variants",
        x: backgroundPoints.map((p) => p.x),
        y: backgroundPoints.map((p) => -Math.log10(p.y || 1)),
        text: backgroundPoints.map(
          (p) =>
            `${p.label}<br>P=${p.y.toExponential(2)}<br>Effect=${p.x.toFixed(3)}`,
        ),
        mode: "markers" as const,
        type: "scatter" as const,
        marker: {
          color: "rgba(156, 163, 175, 0.5)",
          size: 8,
          line: { color: "rgba(255, 255, 255, 0.8)", width: 0.5 },
        },
        hoverinfo: "text" as const,
      },
    ];

    if (currentVariant) {
      series.unshift({
        name: "Current Variant",
        x: [currentVariant.x],
        y: [-Math.log10(currentVariant.y || 1)],
        text: [
          `<b>${currentVariant.label}</b><br>P=${currentVariant.y.toExponential(2)}<br>Effect=${currentVariant.x.toFixed(3)}`,
        ],
        mode: "markers+text",
        type: "scatter",
        textposition: "top center",
        marker: {
          color: "#4ade80", // Vibrant Neon Green
          size: 18,
          symbol: "star",
          line: { color: "#000000", width: 2 },
        },
        hoverinfo: "text",
      } as any);
    }

    return series as any;
  }, [points]);

  return (
    <div className="w-full bg-white dark:bg-scientific-panel rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-scientific-border">
      <div className="p-4 border-b border-gray-100 dark:border-scientific-border bg-gray-50/50 dark:bg-scientific-header flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="p-2">
        <Plot
          data={data}
          layout={{
            autosize: true,
            height: typeof height === "number" ? height : 400,
            margin: { t: 40, r: 40, l: 60, b: 60 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            showlegend: true,
            legend: { orientation: "h", y: -0.2 },
            xaxis: {
              title: { text: xAxisTitle, font: { size: 12, color: "#9ca3af" } },
              zeroline: true,
              zerolinecolor: "rgba(107, 114, 128, 0.2)",
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
            },
            yaxis: {
              title: {
                text: "-log<sub>10</sub> (p-value)",
                font: { size: 12, color: "#9ca3af" },
              },
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
            },
            shapes: [
              // Significance threshold line at p = 0.05 (-log10 = 1.30)
              {
                type: "line",
                x0: -10, // Far enough to cover range
                x1: 10,
                y0: -Math.log10(0.05),
                y1: -Math.log10(0.05),
                line: {
                  color: "rgba(239, 68, 68, 0.3)",
                  width: 1,
                  dash: "dash",
                },
              },
            ],
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}
