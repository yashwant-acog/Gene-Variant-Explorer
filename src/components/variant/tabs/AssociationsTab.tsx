import React, { useMemo } from "react";
import ForestPlot, { ForestPlotData } from "@/components/charts/ForestPlot";
import { Variant } from "@/lib/types";

interface AssociationsTabProps {
  variant: Variant;
}

export default function AssociationsTab({ variant }: AssociationsTabProps) {
  const forestData = useMemo(() => {
    const currentX = variant.Effect_height;
    const currentP = variant.Pvalue_height;

    if (
      currentX !== undefined &&
      currentP !== undefined &&
      !isNaN(currentX) &&
      !isNaN(currentP)
    ) {
      const ciWidth = Math.abs(currentX * 0.1) + 0.01;
      return [
        {
          name: `P-val: ${currentP.toExponential(2)}`,
          oddsRatio: currentX,
          ciLower: currentX - ciWidth,
          ciUpper: currentX + ciWidth,
          color: "#8b5cf6",
        } as ForestPlotData,
      ];
    }

    return [];
  }, [variant]);

  const hasData =
    variant.Effect_height !== undefined &&
    variant.Pvalue_height !== undefined &&
    !isNaN(variant.Effect_height) &&
    !isNaN(variant.Pvalue_height) &&
    variant.Pvalue_height > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <svg
                className="w-6 h-6 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11l-7 7-7-7"
                />
              </svg>
              Height Association
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Distribution of effect size and significance across the gene for
              Height.
            </p>
          </div>
        </div>

        {hasData ? (
          <>
            <div className="grid grid-cols-1 gap-8">
              <ForestPlot
                studies={forestData}
                title="Height Association (Forest Plot)"
                xAxisTitle="Association Effect Size (Beta)"
                xAxisType="linear"
                nullEffect={0}
                height={200}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100/50 dark:border-purple-800/20">
                <span className="block text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">
                  Y-Axis
                </span>
                <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                  <strong>P-value</strong> for the effect. Displays the exact
                  significance of this variant's association.
                </p>
              </div>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                <span className="block text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">
                  X-Axis
                </span>
                <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                  <strong>Effect Size (Width)</strong> represents the magnitude
                  and direction of the trait modification.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700/50 border-dashed">
            <svg
              className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
              No Association Data
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              The selected variant does not have valid Effect Height or P-value
              Height data to plot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
