"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PopulationDistributionChartProps {
  popDistributions: Record<string, number[]>;
  currentFrequencies: Record<string, number>;
  popColors?: Record<string, string>;
  yAxisTitle?: string;
  yAxisType?: "log" | "linear";
  height?: number;
}

export default function PopulationDistributionChart({
  popDistributions,
  currentFrequencies,
  popColors = {},
  yAxisTitle = "Allele Frequency",
  yAxisType = "log",
  height = 500,
}: PopulationDistributionChartProps) {
  const plotData = useMemo(() => {
    const traces: any[] = [];

    // 1. Plot all background points for each population as jittered points
    Object.entries(popDistributions).forEach(([name, frequencies], idx) => {
      if (frequencies.length === 0) return;

      const baseColor = popColors[name] || "rgb(156, 163, 175)";

      traces.push({
        type: "box",
        y: frequencies,
        name: name,
        boxpoints: "all",
        jitter: 0.5,
        pointpos: -1.8,
        marker: {
          color: baseColor.startsWith("#")
            ? `${baseColor}4D`
            : baseColor.replace("rgb", "rgba").replace(")", ", 0.3)"), // 0.3 opacity
          size: 2,
        },
        line: {
          color: baseColor,
          width: 1,
        },
        fillcolor: "transparent",
        hoverinfo: "y+name",
        showlegend: false,
      });
    });

    // 2. Plot the current variant's point for each population
    Object.entries(popDistributions).forEach(([name, _], idx) => {
      const currentVal = currentFrequencies[name];
      if (currentVal !== undefined && currentVal > 0) {
        traces.push({
          type: "scatter",
          x: [name],
          y: [currentVal],
          mode: "markers",
          name: "Current Variant",
          marker: {
            color: "#ef4444",
            size: 14,
            symbol: "star",
            line: {
              color: "white",
              width: 2,
            },
          },
          hoverinfo: "y+name+text",
          text: ["Current Variant"],
          showlegend: idx === 0, // Only show once in legend
        });
      }
    });

    return traces;
  }, [popDistributions, currentFrequencies, popColors]);

  return (
    <div className="w-full relative" style={{ height }}>
      <Plot
        data={plotData}
        layout={{
          autosize: true,
          margin: { t: 40, r: 40, l: 80, b: 120 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          hovermode: "closest",
          title: {
            text: `${yAxisTitle} Distributions across Populations`,
            font: { size: 16, color: "#374151" },
            y: 0.98,
          },
          yaxis: {
            title: {
              text: yAxisTitle,
              font: { size: 12, color: "#6b7280" },
            },
            type: yAxisType,
            gridcolor: "rgba(107, 114, 128, 0.1)",
            zeroline: false,
            tickfont: { size: 10, color: "#6b7280" },
            exponentformat: yAxisType === "log" ? "e" : "none",
            showexponent: yAxisType === "log" ? "all" : "none",
          },
          xaxis: {
            tickangle: -45,
            gridcolor: "transparent",
            tickfont: { size: 10, color: "#6b7280" },
          },
          showlegend: true,
          legend: {
            orientation: "h",
            y: -0.2,
            x: 0.5,
            xanchor: "center",
          },
        }}
        style={{ width: "100%", height: "100%" }}
        config={{ responsive: true, displayModeBar: false }}
      />
    </div>
  );
}
