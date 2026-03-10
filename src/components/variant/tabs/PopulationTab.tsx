import React, { useMemo, useState } from "react";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import PopulationDistributionChart from "@/components/charts/PopulationDistributionChart";
import { Variant } from "@/lib/types";

interface PopulationTabProps {
  variant: Variant;
  popDistributions: {
    freqs: Record<string, number[]>;
    counts: Record<string, number[]>;
  };
}

export default function PopulationTab({
  variant,
  popDistributions,
}: PopulationTabProps) {
  const [chartView, setChartView] = useState<"distribution" | "bar">("bar");
  const [barChartViewMode, setBarChartViewMode] = useState<
    "frequency" | "count"
  >("count");

  const popDefs = useMemo(
    () => [
      {
        name: "African / Af. Am.",
        count: variant.alleleCountAfrican,
        number: variant.alleleNumberAfrican,
        color: "#f59e0b",
      },
      {
        name: "Admixed American",
        count: variant.alleleCountAdmixedAmerican,
        number: variant.alleleNumberAdmixedAmerican,
        color: "#10b981",
      },
      {
        name: "Ashkenazi Jewish",
        count: variant.alleleCountAshkenaziJewish,
        number: variant.alleleNumberAshkenaziJewish,
        color: "#34d399",
      },
      {
        name: "East Asian",
        count: variant.alleleCountEastAsian,
        number: variant.alleleNumberEastAsian,
        color: "#059669",
      },
      {
        name: "European (Finnish)",
        count: variant.alleleCountEuropeanFinnish,
        number: variant.alleleNumberEuropeanFinnish,
        color: "#60a5fa",
      },
      {
        name: "European (Non-Fi)",
        count: variant.alleleCountEuropeanNonFinnish,
        number: variant.alleleNumberEuropeanNonFinnish,
        color: "#2563eb",
      },
      {
        name: "Middle Eastern",
        count: variant.alleleCountMiddleEastern,
        number: variant.alleleNumberMiddleEastern,
        color: "#8b5cf6",
      },
      {
        name: "South Asian",
        count: variant.alleleCountSouthAsian,
        number: variant.alleleNumberSouthAsian,
        color: "#7c3aed",
      },
      {
        name: "Amish",
        count: variant.alleleCountAmish,
        number: variant.alleleNumberAmish,
        color: "#d946ef",
      },
    ],
    [variant],
  );

  const currentValues = useMemo(() => {
    const values: Record<string, number> = {};
    popDefs.forEach((p) => {
      values[p.name] = p.number && p.number > 0 ? (p.count || 0) / p.number : 0;
    });
    return values;
  }, [popDefs]);

  const popColors = useMemo(() => {
    const colors: Record<string, string> = {};
    popDefs.forEach((p) => {
      colors[p.name] = p.color;
    });
    return colors;
  }, [popDefs]);

  return (
    <div className="space-y-8">
      {/* Global Summary Stats */}
      {(variant.alleleCount !== undefined ||
        variant.alleleNumber !== undefined ||
        variant.alleleFrequency !== undefined) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Global Allele Count
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {variant.alleleCount !== undefined
                ? variant.alleleCount.toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Global Allele Number
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {variant.alleleNumber !== undefined
                ? variant.alleleNumber.toLocaleString()
                : "N/A"}
            </p>
          </div>
          <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
              Global Allele Frequency
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {variant.alleleFrequency !== undefined
                ? variant.alleleFrequency >= 0.01
                  ? variant.alleleFrequency.toFixed(4)
                  : variant.alleleFrequency.toExponential(3)
                : variant.alleleCount !== undefined &&
                    variant.alleleNumber !== undefined &&
                    variant.alleleNumber > 0
                  ? variant.alleleCount / variant.alleleNumber >= 0.01
                    ? (variant.alleleCount / variant.alleleNumber).toFixed(4)
                    : (
                        variant.alleleCount / variant.alleleNumber
                      ).toExponential(3)
                  : "N/A"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-100 dark:border-scientific-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              Population Metrics
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Comparing current variant against study cohort and visualizing
              individual ancestry breakdown.
            </p>
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-lg w-fit">
            <button
              onClick={() => setChartView("bar")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === "bar"
                  ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Frequency Breakdown
            </button>
            <button
              onClick={() => setChartView("distribution")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                chartView === "distribution"
                  ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Distribution Plot
            </button>
          </div>
        </div>

        <div className="w-full">
          {chartView === "distribution" ? (
            <PopulationDistributionChart
              popDistributions={popDistributions.freqs}
              currentFrequencies={currentValues}
              popColors={popColors}
              yAxisTitle="Allele Frequency"
              yAxisType="log"
              height={500}
            />
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <div className="flex justify-end relative z-10 w-full mb-[-40px]">
                <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-lg w-fit mr-4">
                  <button
                    onClick={() => setBarChartViewMode("count")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      barChartViewMode === "count"
                        ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    Count
                  </button>
                  <button
                    onClick={() => setBarChartViewMode("frequency")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      barChartViewMode === "frequency"
                        ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    Frequency
                  </button>
                </div>
              </div>
              <PopulationBarChart
                populations={popDefs.map((p) => ({
                  name: p.name,
                  count:
                    barChartViewMode === "frequency"
                      ? p.number && p.number > 0
                        ? (p.count || 0) / p.number
                        : 0
                      : p.count || 0,
                  color: p.color,
                }))}
                title={`${barChartViewMode === "frequency" ? "Frequency" : "Count"} Breakdown for Selected Variant`}
                xAxisTitle={`Allele ${barChartViewMode === "frequency" ? "Frequency" : "Count"}`}
                height={400}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
