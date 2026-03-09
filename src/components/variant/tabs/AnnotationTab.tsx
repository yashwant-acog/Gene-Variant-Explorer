import React, { useMemo } from "react";
import { Variant } from "@/lib/types";
import dynamic from "next/dynamic";
import { dummyCustomVariants } from "@/lib/dummyData";

// Dynamically import Plotly for client-side rendering in Next.js
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface AnnotationTabProps {
  variant: Variant;
  isCustom?: boolean;
}

export default function AnnotationTab({
  variant,
  isCustom = true,
}: AnnotationTabProps) {
  // Helper to parse numeric values
  const parseNum = (val: string | number | undefined) => {
    if (val === undefined || val === null) return NaN;
    if (typeof val === "string") {
      if (!val || val.trim() === "NA" || val.trim() === "False") return NaN;
      return parseFloat(val);
    }
    return val;
  };

  // Prepare distribution data from all custom variants for this gene
  const plotData = useMemo(() => {
    // Filter variants for the current gene (FGFR3)
    const geneVariants = dummyCustomVariants.filter(
      (v) => variant.gene === "FGFR3", // Currently focusing on FGFR3
    );

    const points = geneVariants
      .map((v) => ({
        x: parseNum(v.C_REVEL),
        y: parseNum(v.Points), // Using Points as Y-axis if P-value isn't REVEL-specific
        // Fallback: If C_REVEL vs Points is redundant, we could use CADD if mapped
        cadd: parseNum(v.C_REVEL), // Note: In dummy data these seem correlated
        label: v.Protein_change || v.cDNA_change,
        id: v.cDNA_change,
      }))
      .filter((p) => !isNaN(p.x));

    const currentVariantIndex = points.findIndex(
      (p) => p.id === variant.id || p.id === variant.hgvsConsequence,
    );

    return [
      {
        x: points.map((p) => p.x),
        y: points.map((p) => p.y),
        mode: "markers" as const,
        type: "scatter" as const,
        name: "Genomic Variants",
        text: points.map(
          (p) =>
            `${p.label}<br>C_REVEL: ${p.x.toFixed(3)}<br>Predictive Points: ${p.y.toFixed(1)}`,
        ),
        hoverinfo: "text" as const,
        marker: {
          size: points.map((_, i) => (i === currentVariantIndex ? 16 : 8)),
          color: points.map((p, i) =>
            i === currentVariantIndex
              ? "#ff0000"
              : p.x < 0
                ? "#ef4444"
                : "#3b82f6",
          ),
          symbol: points.map((_, i) =>
            i === currentVariantIndex ? "star" : "circle",
          ),
          line: {
            color: points.map((_, i) =>
              i === currentVariantIndex ? "#000000" : "white",
            ),
            width: points.map((_, i) => (i === currentVariantIndex ? 2 : 1)),
          },
          opacity: points.map((_, i) => (i === currentVariantIndex ? 1 : 0.6)),
        },
      },
    ];
  }, [variant]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            CADD PHRED
          </h3>
          <p
            className={`text-3xl font-mono font-bold ${variant.cadd >= 20 ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.cadd.toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            REVEL
          </h3>
          <p
            className={`text-3xl font-mono font-bold ${variant.revel >= 0.5 ? "text-red-500 dark:text-red-400" : "text-gray-900 dark:text-gray-100"}`}
          >
            {variant.revel.toFixed(3)}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            SIFT
          </h3>
          <p className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant?.sift?.toFixed(2) || "N/A"}
          </p>
        </div>
        <div className="bg-white dark:bg-scientific-panel p-5 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm flex flex-col items-center justify-center transition-all hover:border-primary-200 dark:hover:border-primary-800">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
            PolyPhen
          </h3>
          <p className="text-3xl font-mono font-bold text-gray-900 dark:text-gray-100">
            {variant.polyphen ? variant.polyphen.toFixed(2) : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-scientific-panel/50 p-6 rounded-lg border border-gray-100 dark:border-scientific-border/50">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
          VEP Functional Consequence
        </h3>
        <div className="flex items-center gap-3">
          <span className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-md text-sm font-mono border border-primary-200 dark:border-primary-800">
            {variant.vepAnnotation.replace(/_/g, " ")}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400 italic">
            Determined via Ensembl Variant Effect Predictor
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-scientific-panel rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-scientific-border bg-gray-50/50 dark:bg-black/20">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">
            Predictive vs Functional Evidence (C_REVEL vs P-value)
          </h3>
        </div>
        <div className="p-4">
          <Plot
            data={
              useMemo(() => {
                const geneVariants = dummyCustomVariants.filter(
                  (v) => variant.gene === "FGFR3",
                );

                const points = geneVariants
                  .map((v) => ({
                    x: parseNum(v.C_REVEL),
                    y: parseNum(v.Pvalue_functional),
                    label: v.Protein_change || v.cDNA_change,
                    id: v.cDNA_change,
                  }))
                  .filter((p) => !isNaN(p.x) && !isNaN(p.y));

                const currentIndex = points.findIndex(
                  (p) =>
                    p.id === variant.id || p.id === variant.hgvsConsequence,
                );

                return [
                  {
                    x: points.map((p) => p.x),
                    y: points.map((p) => p.y),
                    mode: "markers" as const,
                    type: "scatter" as const,
                    name: "Variants",
                    text: points.map(
                      (p) =>
                        `${p.label}<br>C_REVEL: ${p.x.toFixed(3)}<br>P-value: ${p.y.toExponential(2)}`,
                    ),
                    hoverinfo: "text" as const,
                    marker: {
                      size: points.map((_, i) => (i === currentIndex ? 16 : 8)),
                      color: points.map((p, i) =>
                        i === currentIndex
                          ? "#4ade80" // Neon Green
                          : p.x < 0
                            ? "#ef4444"
                            : "#3b82f6",
                      ),
                      symbol: points.map((_, i) =>
                        i === currentIndex ? "star" : "circle",
                      ),
                      line: {
                        color: points.map((_, i) =>
                          i === currentIndex ? "#000000" : "white",
                        ),
                        width: points.map((_, i) =>
                          i === currentIndex ? 2 : 1,
                        ),
                      },
                      opacity: points.map((_, i) =>
                        i === currentIndex ? 1 : 0.6,
                      ),
                    },
                  },
                ];
              }, [variant]) as any
            }
            layout={{
              autosize: true,
              height: 400,
              margin: { t: 20, r: 20, l: 60, b: 60 },
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              hovermode: "closest",
              xaxis: {
                title: {
                  text: "C_REVEL Score",
                  font: { size: 12, color: "#9ca3af" },
                },
                gridcolor: "rgba(107, 114, 128, 0.1)",
                zerolinecolor: "rgba(107, 114, 128, 0.2)",
                tickfont: { color: "#6b7280" },
              },
              yaxis: {
                title: {
                  text: "Functional P-value",
                  font: { size: 12, color: "#9ca3af" },
                },
                autorange: "reversed",
                gridcolor: "rgba(107, 114, 128, 0.1)",
                zerolinecolor: "rgba(107, 114, 128, 0.2)",
                tickfont: { color: "#6b7280" },
              },
            }}
            config={{ responsive: true, displayModeBar: false }}
            useResizeHandler={true}
            style={{ width: "100%", height: "400px" }}
          />
          <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 flex items-center justify-center text-[#4ade80] text-xl font-bold drop-shadow-sm"
                style={{ textShadow: "0 0 1px black, 0 0 1px black" }}
              >
                ★
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Current Variant ({variant.proteinConsequence || "Target"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#ef4444" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Depleted / Impactful
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: "#3b82f6" }}
              ></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Neutral / Enriched
              </span>
            </div>
          </div>
          <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 mt-3 italic">
            Comparison of C_REVEL predictive scores vs experimental functional
            significance.
          </p>
        </div>
      </div>
    </div>
  );
}
