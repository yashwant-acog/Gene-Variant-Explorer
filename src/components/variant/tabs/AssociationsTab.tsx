import React, { useMemo } from "react";
import ForestPlot, { ForestPlotData } from "@/components/charts/ForestPlot";
import { Variant } from "@/lib/types";
import ReferenceSection from "../ReferenceSection";

interface AssociationsTabProps {
  variant: Variant;
}

export default function AssociationsTab({ variant }: AssociationsTabProps) {
  // Prepare dynamic forest plot data from Phenotype_ columns
  const combinedData = useMemo(() => {
    const studies: ForestPlotData[] = [];
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

    // Process all dynamic Phenotype_ columns
    Object.keys(variant).forEach((key, index) => {
      // Find keys starting with Phenotype_ that are likely the main effect/score (not the error term)
      if (
        key.startsWith("Phenotype_") &&
        !key.toLowerCase().endsWith("_se") &&
        !key.toLowerCase().endsWith("_err") &&
        !key.toLowerCase().endsWith("_std")
      ) {
        const baseName = key.replace("Phenotype_", "");
        const valStr = variant[key];

        // Try to find a matching SE/Error key with different casing and naming conventions
        const seKey =
          Object.keys(variant).find(
            (k) =>
              k.toLowerCase() === (key + "_SE").toLowerCase() ||
              k.toLowerCase() === (key + "_se").toLowerCase() ||
              k.toLowerCase() === (key + "_err").toLowerCase() ||
              k.toLowerCase() === (key + "_std").toLowerCase(),
          ) || `${key}_SE`;

        const seStr = variant[seKey];

        if (
          valStr !== undefined &&
          seStr !== undefined &&
          valStr !== "NA" &&
          seStr !== "NA"
        ) {
          const val = parseFloat(valStr);
          const se = parseFloat(seStr);
          if (!isNaN(val) && !isNaN(se)) {
            studies.push({
              name: baseName.replace(/_/g, " "),
              oddsRatio: val,
              ciLower: val - 1.96 * se,
              ciUpper: val + 1.96 * se,
              color: colors[studies.length % colors.length],
            });
          }
        }
      }
    });

    return studies;
  }, [variant]);

  const hasData = combinedData.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm">
        <div className="flex items-center justify-between gap-6 mb-8">
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
                  d="m19 11-7 7-7-7"
                />
              </svg>
              Phenotype Associations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Forest plots showing associations for user-defined phenotypes.
            </p>
          </div>
          <ReferenceSection
            title="Association References"
            references={variant?.["association reference"]}
          />
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
                height={Math.max(220, combinedData.length * 60)}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {combinedData.map((study, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gray-50/50 dark:bg-gray-800/20 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: study.color }}
                    ></div>
                    <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                      {study.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    <strong>Effect:</strong> {study.oddsRatio.toFixed(3)} with
                    95% CI ({study.ciLower.toFixed(3)} to{" "}
                    {study.ciUpper.toFixed(3)}).
                  </p>
                </div>
              ))}
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
              The selected variant does not have columns starting with
              "Phenotype_" to plot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
