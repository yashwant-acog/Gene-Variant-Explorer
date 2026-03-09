import React from "react";
import { Variant } from "@/lib/types";

interface OverviewTabProps {
  variant: Variant;
}

export default function OverviewTab({ variant }: OverviewTabProps) {
  // ACMG classification logic based on points
  const pointsField = variant.Points || "0";
  const pts = parseFloat(pointsField);

  const getClassification = (p: number) => {
    if (isNaN(p)) return "VUS";
    if (p >= 10) return "Pathogenic";
    if (p >= 6) return "Likely Pathogenic";
    if (p >= -5) return "VUS";
    if (p >= -9) return "Likely Benign";
    return "Benign";
  };

  const classification = getClassification(pts);

  const categories = [
    { label: "Benign", color: "bg-emerald-500", textColor: "text-emerald-700" },
    {
      label: "Likely Benign",
      color: "bg-emerald-400",
      textColor: "text-emerald-600",
    },
    { label: "VUS", color: "bg-amber-400", textColor: "text-amber-700" },
    {
      label: "Likely Pathogenic",
      color: "bg-orange-500",
      textColor: "text-orange-700",
    },
    { label: "Pathogenic", color: "bg-red-600", textColor: "text-red-800" },
  ];

  const getIndex = (cls: string) => {
    if (cls === "Benign") return 0;
    if (cls === "Likely Benign") return 1;
    if (cls === "VUS") return 2;
    if (cls === "Likely Pathogenic") return 3;
    if (cls === "Pathogenic") return 4;
    return 2; // Fallback to VUS
  };

  const activeIndex = getIndex(classification);
  const activeCategory = categories[activeIndex];

  return (
    <div className="space-y-8">
      {/* ── Info cards (unchanged) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Gene
          </h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {variant.gene}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Chromosome
          </h3>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            chr{variant.chromosome}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Position / Alleles
          </h3>
          <p className="text-lg font-semibold font-mono text-sm text-gray-900 dark:text-gray-100">
            {variant.position.toLocaleString()} ({variant.reference} →{" "}
            {variant.alternate})
          </p>
        </div>
        {variant.Mutation_type && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mutation Type
            </h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {variant.Mutation_type}
            </p>
          </div>
        )}
      </div>

      {/* Classification Spectrum Section */}
      <div className="bg-white dark:bg-gray-800/70 px-20 py-10 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
          ACMG Classification
        </h3>

        <div className="relative pt-16 pb-16 md:pb-14">
          {" "}
          {/* increased top padding for the badge */}
          {/* Floating badge + arrow — now positioned at the active percentage */}
          <div
            className="absolute z-10"
            style={{
              left: `${(activeIndex / (categories.length - 1)) * 100}%`,
              transform: "translateX(-50%)",
              top: "0",
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className={`px-5 py-2.5 rounded-full text-white font-semibold text-base shadow-lg ${activeCategory.color} border-2 ${activeCategory.color.replace(
                  "bg-",
                  "border-",
                )} whitespace-nowrap min-w-[140px] text-center`}
              >
                {classification}
              </div>

              {/* Arrow pointing down */}
              <div
                className="w-0 h-0 mt-1 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[10px]"
                style={{
                  borderTopColor: activeCategory.color.replace("bg-", "#"),
                }}
              />
            </div>
          </div>
          {/* Gradient track */}
          <div className="h-4 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-amber-400 via-amber-500 to-red-600 mt-8" />
          {/* Markers and labels */}
          <div className="relative h-12 mt-5">
            {categories.map((cat, i) => {
              const position = (i / (categories.length - 1)) * 100;
              const isActive = i === activeIndex;

              return (
                <React.Fragment key={cat.label}>
                  {/* Marker dot */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 shadow transition-all duration-200 ${
                      isActive
                        ? `${cat.color} scale-125 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${cat.color.replace(
                            /bg-/g,
                            "ring-",
                          )}`
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    style={{
                      left: `${position}%`,
                      transform: "translateX(-50%) translateY(-50%)",
                    }}
                  />

                  {/* Label */}
                  <div
                    className={`absolute top-9 text-xs font-medium text-center whitespace-nowrap transform -translate-x-1/2 ${
                      isActive
                        ? "font-bold text-gray-900 dark:text-gray-100 scale-105"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                    style={{ left: `${position}%` }}
                  >
                    {cat.label}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
            Suggested classification based on current evidence
          </div>
        </div>
      </div>
    </div>
  );
}
