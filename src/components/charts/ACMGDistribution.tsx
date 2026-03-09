"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { Variant } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface ACMGDistributionProps {
  variants: Variant[];
  title?: string;
  height?: number | string;
}

const getLabelForPoints = (points?: string): string => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "VUS";

  if (pts >= 10) return "Pathogenic";
  if (pts >= 6) return "Likely Pathogenic";
  if (pts >= -5) return "VUS";
  if (pts >= -9) return "Likely Benign";
  return "Benign";
};

const CATEGORIES = [
  { label: "Benign", color: "#10b981" },
  { label: "Likely Benign", color: "#34d399" },
  { label: "VUS", color: "#eab308" },
  { label: "Likely Pathogenic", color: "#f97316" },
  { label: "Pathogenic", color: "#ef4444" },
];

export default function ACMGDistribution({
  variants,
  title = "ACMG Classification Distribution",
  height = 300,
}: ACMGDistributionProps) {
  const chartData = useMemo(() => {
    if (!variants || variants.length === 0) return [];

    const counts: Record<string, number> = {
      Benign: 0,
      "Likely Benign": 0,
      VUS: 0,
      "Likely Pathogenic": 0,
      Pathogenic: 0,
    };

    variants.forEach((v) => {
      const label = getLabelForPoints(v.Points);
      if (counts[label] !== undefined) {
        counts[label]++;
      }
    });

    return [
      {
        type: "bar" as const,
        x: CATEGORIES.map((c) => c.label),
        y: CATEGORIES.map((c) => counts[c.label]),
        marker: {
          color: CATEGORIES.map((c) => c.color),
          line: { color: "rgba(255,255,255,0.5)", width: 1 },
        },
        text: CATEGORIES.map((c) => counts[c.label].toString()),
        textposition: "auto" as const,
        hoverinfo: "x+y" as const,
      },
    ];
  }, [variants]);

  if (!variants || variants.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-scientific-panel border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
      <div className="p-2" style={{ height }}>
        <Plot
          data={chartData}
          layout={{
            autosize: true,
            margin: { t: 20, r: 20, l: 60, b: 80 },
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            xaxis: {
              showgrid: false,
              tickfont: { color: "#6b7280", size: 10 },
              automargin: true,
            },
            yaxis: {
              title: { text: "Count", font: { size: 10, color: "#9ca3af" } },
              gridcolor: "rgba(107, 114, 128, 0.1)",
              tickfont: { color: "#6b7280" },
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
