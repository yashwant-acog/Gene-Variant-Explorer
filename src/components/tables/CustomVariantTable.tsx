import React from "react";
import Link from "next/link";
import { CustomVariant } from "@/lib/types";

export const CUSTOM_COLUMNS = [
  { key: "cDNA_change", label: "cDNA Change", group: "Identity" },
  { key: "Genomic_ID", label: "Genomic ID", group: "Identity" },
  { key: "Protein_change", label: "Protein Change", group: "Identity" },
  { key: "gnomAD", label: "gnomAD", group: "Identity" },

  { key: "C_REVEL", label: "C_REVEL", group: "Predictive" },
  { key: "Points", label: "Points", group: "Predictive" },

  { key: "Mutation_type", label: "Mutation", group: "Functional" },
  { key: "Functional", label: "Functional", group: "Functional" },
  { key: "Pvalue_functional", label: "P-value", group: "Functional" },
  { key: "FDR_functional", label: "FDR", group: "Functional" },

  { key: "Effect_height", label: "Effect", group: "Enrichment (H)" },
  { key: "Pvalue_height", label: "P-value", group: "Enrichment (H)" },
  { key: "FDR_height", label: "FDR", group: "Enrichment (H)" },
  { key: "Count_height", label: "Count", group: "Enrichment (H)" },

  { key: "Effect_ratio", label: "Effect", group: "Enrichment (R)" },
  { key: "Pvalue_ratio", label: "P-value", group: "Enrichment (R)" },
  { key: "FDR_ratio", label: "FDR", group: "Enrichment (R)" },
  { key: "Count_ratio", label: "Count", group: "Enrichment (R)" },

  { key: "DD_enrich", label: "DD Enrich", group: "DD Enrichment" },
  { key: "Pvalue_DD", label: "P-value", group: "DD Enrichment" },
  { key: "FDR_DD", label: "FDR", group: "DD Enrichment" },
  { key: "Count_DD", label: "Count", group: "DD Enrichment" },

  { key: "freq_background", label: "Freq BG", group: "Population" },
  { key: "freq_DD", label: "Freq DD", group: "Population" },
  { key: "Allele Count", label: "Allele Count", group: "Population" },
  { key: "Allele Number", label: "Allele Num", group: "Population" },
  { key: "Allele Frequency", label: "Allele Freq", group: "Population" },

  { key: "condition", label: "Conditions", group: "Clinical" },
];

interface CustomVariantTableProps {
  variants: CustomVariant[];
  visibleColumns?: string[];
}

export default function CustomVariantTable({
  variants,
  visibleColumns,
}: CustomVariantTableProps) {
  if (!variants || variants.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-50 dark:bg-scientific-panel/30 border border-gray-200 dark:border-scientific-border rounded-lg text-gray-500 italic">
        No custom variants found matching current filters.
      </div>
    );
  }

  const columns = visibleColumns
    ? CUSTOM_COLUMNS.filter((col) => visibleColumns.includes(col.key))
    : CUSTOM_COLUMNS;

  const groups = Array.from(new Set(columns.map((c) => c.group)));

  return (
    <div className="border border-gray-200 dark:border-scientific-border rounded-b-lg shadow-sm">
      {/* SCROLL CONTAINER */}
      <div className="max-h-[520px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-30">
            {/* Group Headers */}
            <tr className="bg-gray-100 dark:bg-scientific-header border-b border-gray-200 dark:border-scientific-border text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
              {groups.map((group) => {
                const span = columns.filter((c) => c.group === group).length;
                return (
                  <th
                    key={group}
                    colSpan={span}
                    className="px-4 py-1 text-center border-r border-gray-200 dark:border-scientific-border last:border-r-0 sticky top-0 bg-gray-100 dark:bg-scientific-header z-30"
                  >
                    {group}
                  </th>
                );
              })}
            </tr>

            {/* Column Headers */}
            <tr className="bg-white dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border text-xs font-semibold text-gray-700 dark:text-gray-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 border-r border-gray-200 dark:border-scientific-border last:border-r-0 whitespace-nowrap sticky top-[28px] bg-white dark:bg-scientific-panel z-30"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 dark:divide-scientific-border bg-white dark:bg-transparent">
            {variants.map((v, vIdx) => (
              <tr
                key={vIdx}
                className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
              >
                {columns.map((col, cIdx) => {
                  const value = (v as any)[col.key];
                  let renderedValue: React.ReactNode = value;

                  if (typeof value === "number") {
                    if (
                      col.key.startsWith("Pvalue") ||
                      col.key.startsWith("FDR")
                    ) {
                      renderedValue = value.toExponential(2);
                    } else if (col.key.startsWith("freq")) {
                      renderedValue = value.toFixed(6);
                    } else {
                      renderedValue = value.toFixed(2);
                    }
                  }

                  if (col.key === "cDNA_change") {
                    renderedValue = (
                      <Link
                        href={`/variant/${encodeURIComponent(
                          v.cDNA_change
                        )}`}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        {value}
                      </Link>
                    );
                  }

                  if (col.key === "Functional") {
                    const numVal = parseFloat(value);
                    let colorClass = "";

                    if (!isNaN(numVal)) {
                      if (numVal < 0)
                        colorClass =
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                      else if (numVal > 0)
                        colorClass =
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                      else
                        colorClass =
                          "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
                    } else {
                      const colorMap: any = {
                        Enriched:
                          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        Depleted:
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        Neutral:
                          "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                      };
                      colorClass = colorMap[value] || "";
                    }

                    renderedValue = (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                      >
                        {value}
                      </span>
                    );
                  }

                  if (col.key === "condition") {
                    renderedValue = value ? (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[10px] whitespace-nowrap dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                        {value}
                      </span>
                    ) : null;
                  }

                  return (
                    <td
                      key={cIdx}
                      className="px-4 py-2 border-r border-gray-200 dark:border-scientific-border last:border-r-0 text-sm font-mono text-gray-600 dark:text-gray-300"
                    >
                      {renderedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}