import React, { useMemo } from "react";
import ForestPlot, { ForestPlotData } from "@/components/charts/ForestPlot";
import { Variant } from "@/lib/types";

interface AssociationsTabProps {
  variant: Variant;
}

export default function AssociationsTab({ variant }: AssociationsTabProps) {
  // Prepare combined forest plot data for both Meta_height and Meta_ratio
  const combinedData = useMemo(() => {
    const studies: ForestPlotData[] = [];

    // Process Meta_height
    const metaHeight = variant.Meta_height;
    const metaHeightSE = variant.Meta_height_SE;

    if (
      metaHeight !== undefined &&
      metaHeightSE !== undefined &&
      metaHeight !== "NA" &&
      metaHeightSE !== "NA" &&
      !isNaN(parseFloat(metaHeight)) &&
      !isNaN(parseFloat(metaHeightSE))
    ) {
      const height = parseFloat(metaHeight);
      const se = parseFloat(metaHeightSE);
      const ciLower = height - 1.96 * se;
      const ciUpper = height + 1.96 * se;

      studies.push({
        name: `Meta Height`,
        oddsRatio: height,
        ciLower: ciLower,
        ciUpper: ciUpper,
        color: "#8b5cf6",
      });
    }

    // Process Meta_ratio
    const metaRatio = variant.Meta_ratio;
    const metaRatioSE = variant.Meta_ratio_SE;

    if (
      metaRatio !== undefined &&
      metaRatioSE !== undefined &&
      metaRatio !== "NA" &&
      metaRatioSE !== "NA" &&
      !isNaN(parseFloat(metaRatio)) &&
      !isNaN(parseFloat(metaRatioSE))
    ) {
      const ratio = parseFloat(metaRatio);
      const se = parseFloat(metaRatioSE);
      const ciLower = ratio - 1.96 * se;
      const ciUpper = ratio + 1.96 * se;

      studies.push({
        name: `Meta Ratio`,
        oddsRatio: ratio,
        ciLower: ciLower,
        ciUpper: ciUpper,
        color: "#3b82f6",
      });
    }

    return studies;
  }, [variant]);

  const hasData = combinedData.length > 0;

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
              Meta-Analysis Associations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Forest plots showing meta-analysis results for height and ratio associations.
            </p>
          </div>
        </div>

        {hasData ? (
          <>
            {/* Combined Forest Plot */}
            <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <ForestPlot
                studies={combinedData}
                title=""
                xAxisTitle="Effect Size / Ratio"
                xAxisType="linear"
                nullEffect={0}
                height={220}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {combinedData.some(d => d.name === "Meta Height") && (
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100/50 dark:border-purple-800/20">
                  <span className="block text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest mb-1">
                    Meta Height
                  </span>
                  <p className="text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
                    <strong>Effect:</strong> Beta coefficient with 95% CI (±1.96×SE). 
                    Reference line at 0 (no effect).
                  </p>
                </div>
              )}
              {combinedData.some(d => d.name === "Meta Ratio") && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-800/20">
                  <span className="block text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">
                    Meta Ratio
                  </span>
                  <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>Ratio:</strong> Effect ratio with 95% CI (±1.96×SE). 
                    Reference line at 0 (no effect).
                  </p>
                </div>
              )}
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
              No Meta-Analysis Data
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              The selected variant does not have valid Meta_height or Meta_ratio data to plot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
