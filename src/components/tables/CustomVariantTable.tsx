import React from "react";
import Link from "next/link";
import { CustomVariant } from "@/lib/types";

export const CUSTOM_COLUMNS = [
  { key: "cDNA_change", label: "cDNA Change", group: "Identity" },
  { key: "Genomic_ID", label: "Genomic ID", group: "Identity" },
  { key: "Protein_change", label: "Protein Change", group: "Identity" },
  { key: "condition", label: "Conditions", group: "Clinical" },
  {
    key: "clinvarConditions",
    label: "ClinVar Conditions",
    group: "Clinical",
  },
  { key: "REVEL", label: "REVEL", group: "Predictive" },
  { key: "VEST4_score", label: "VEST4", group: "Predictive" },
  { key: "MutPred_score", label: "MutPred", group: "Predictive" },
  { key: "BayesDel_addAF_score", label: "BayesDel", group: "Predictive" },
  { key: "ACMG", label: "ACMG Score", group: "Predictive" },
  {
    key: "acmgClassification",
    label: "ACMG Classification",
    group: "Clinical",
  },
  {
    key: "clinvarClassification",
    label: "ClinVar Classification",
    group: "Clinical",
  },
  { key: "Mutation_type", label: "Mutation", group: "Functional" },
  { key: "Functional", label: "Functional", group: "Functional" },
  {
    key: "Pvalue_functional",
    label: "P-value Functional",
    group: "Functional",
  },
  { key: "clinvar", label: "ClinVar", group: "Public Sources" },
  { key: "gnomad", label: "gnomAD", group: "Public Sources" },
  { key: "Meta_height", label: "Meta Height", group: "Enrichment (H)" },
  { key: "Meta_height_SE", label: "Meta Height SE", group: "Enrichment (H)" },
  { key: "Meta_ratio", label: "Meta Ratio", group: "Enrichment (R)" },
  { key: "Meta_ratio_SE", label: "Meta Ratio SE", group: "Enrichment (R)" },
  { key: "Allele Count", label: "Allele Count", group: "Population" },
  { key: "Allele Number", label: "Allele Num", group: "Population" },
  { key: "Allele Frequency", label: "Allele Freq", group: "Population" },
];

interface CustomVariantTableProps {
  variants: CustomVariant[];
  visibleColumns?: string[];
  gene: string;
}

export default function CustomVariantTable({
  variants,
  visibleColumns,
  gene,
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

  function getACMGColor(classification: string) {
    switch (classification.toLowerCase()) {
      case "benign":
        return "bg-emerald-500 text-white border-black";
      case "likely benign":
        return "bg-emerald-400 text-white border-black";
      case "benign/likely benign":
        return "bg-emerald-400 text-white border-black";
      case "uncertain significance":
        return "bg-amber-400 text-black border-black";
      case "likely pathogenic":
        return "bg-orange-500 text-white border-black";
      case "pathogenic/likely pathogenic":
        return "bg-orange-500 text-white border-black";
      case "pathogenic":
        return "bg-red-600 text-white border-black";
      default:
        return "bg-gray-400 text-black";
    }
  }

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
            <tr className="bg- dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border text-xs font-semibold text-gray-700 dark:text-gray-200">
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
                    const genomicIdEncoded = v.Genomic_ID
                      ? encodeURIComponent(v.Genomic_ID)
                      : "";
                    renderedValue = (
                      <Link
                        href={`/variant/${encodeURIComponent(
                          v.cDNA_change,
                        )}?genomicId=${genomicIdEncoded}`}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        {value}
                      </Link>
                    );
                  }

                  if (
                    col.key === "acmgClassification" ||
                    col.key === "clinvarClassification"
                  ) {
                    const classification = (v as any)[col.key] || "";

                    const parts = classification.split(" || ");
                    const finalParts =
                      parts.length > 0 && parts[0] !== ""
                        ? parts
                        : [classification];

                    renderedValue = (
                      <div className="flex flex-wrap gap-1">
                        {finalParts.map((part: string, idx: number) => {
                          if (!part) return null;
                          const labelMatch = part.match(/^([^(]+)/);
                          const label = labelMatch
                            ? labelMatch[1].trim()
                            : part;

                          return (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap border ${getACMGColor(
                                label,
                              )}`}
                            >
                              {part.toUpperCase()}
                            </span>
                          );
                        })}
                        {!classification && (
                          <span className="text-gray-400 font-sans">-</span>
                        )}
                      </div>
                    );
                  }

                  if (col.key === "clinvarConditions") {
                    const conditions = (v as any).clinvarConditions || [];
                    renderedValue = (
                      <div className="flex flex-wrap gap-1">
                        {conditions.map((cond: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] whitespace-nowrap dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                          >
                            {cond}
                          </span>
                        ))}
                        {conditions.length === 0 && (
                          <span className="text-gray-400 font-sans">-</span>
                        )}
                      </div>
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

                  //REVEL scores
                  if (col.key === "REVEL") {
                    renderedValue = value ? (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[10px] whitespace-nowrap dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                        {value}
                      </span>
                    ) : null;
                  }

                  // New predictive scores - VEST4, MutPred, BayesDel, ACMG
                  if (
                    [
                      "VEST4_score",
                      "MutPred_score",
                      "BayesDel_addAF_score",
                    ].includes(col.key)
                  ) {
                    renderedValue =
                      value && value !== "NA" ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] whitespace-nowrap dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                          {typeof value === "string" &&
                          !isNaN(parseFloat(value))
                            ? parseFloat(value).toFixed(3)
                            : value}
                        </span>
                      ) : null;
                  }

                  if (col.key === "ACMG") {
                    renderedValue =
                      value && value !== "NA" ? (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-[10px] whitespace-nowrap dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
                          {value}
                        </span>
                      ) : null;
                  }

                  // New Functional score
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
                    }

                    renderedValue =
                      value && value !== "NA" ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                        >
                          {typeof value === "string" && !isNaN(numVal)
                            ? numVal
                            : value}
                        </span>
                      ) : null;
                  }

                  // New Functional P-value
                  if (col.key === "Pvalue_functional") {
                    renderedValue =
                      value && value !== "NA" ? (
                        <span className="font-mono text-xs">
                          {typeof value === "string" &&
                          !isNaN(parseFloat(value))
                            ? parseFloat(value)
                            : value}
                        </span>
                      ) : null;
                  }

                  // Meta analysis columns
                  if (
                    [
                      "Meta_height",
                      "Meta_height_SE",
                      "Meta_ratio",
                      "Meta_ratio_SE",
                    ].includes(col.key)
                  ) {
                    renderedValue =
                      value && value !== "NA" ? (
                        <span className="font-mono text-xs">
                          {typeof value === "string" &&
                          !isNaN(parseFloat(value))
                            ? parseFloat(value).toFixed(4)
                            : value}
                        </span>
                      ) : (
                        "NA"
                      );
                  }

                  if (col.key === "condition") {
                    renderedValue = value ? (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[10px] whitespace-nowrap dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                        {value}
                      </span>
                    ) : null;
                  }

                  if (col.key === "clinvar") {
                    if (!(v as any).clinvarClassification) {
                      renderedValue = (
                        <span className="text-gray-400 font-sans">-</span>
                      );
                    } else {
                      const term = encodeURIComponent(
                        `"${v.cDNA_change}"[VARNAME] AND "${gene}"[GENE]`,
                      );
                      renderedValue = (
                        <Link
                          href={`https://www.ncbi.nlm.nih.gov/clinvar/?variant=${
                            v.cDNA_change
                          }&gene=${gene}&term=${term}`}
                          className="flex text-blue-600 dark:text-blue-400 font-medium hover:underline"
                          target="_blank"
                        >
                          <div className="h-4 w-4 ml-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
                            </svg>
                          </div>
                        </Link>
                      );
                    }
                  }

                  if (col.key === "gnomad") {
                    if (!(v as any).clinvarClassification) {
                      renderedValue = (
                        <span className="text-gray-400 font-sans">-</span>
                      );
                    } else {
                      renderedValue = (
                        <Link
                          href={`https://gnomad.broadinstitute.org/variant/${v.Genomic_ID?.replaceAll(
                            ":",
                            "-",
                          )}?dataset=gnomad_r4`}
                          className="flex text-blue-600 dark:text-blue-400 font-medium hover:underline"
                          target="_blank"
                        >
                          <div className="h-4 w-4 ml-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                            >
                              <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
                            </svg>
                          </div>
                        </Link>
                      );
                    }
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
