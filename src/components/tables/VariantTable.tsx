import Link from "next/link";
import { Variant } from "@/lib/types";

export const CLINVAR_COLUMNS = [
  { key: "Protein_change", label: "Protein/HGVS" },
  { key: "rsID", label: "rsID" },
  { key: "gnomAD_ID", label: "Genomic ID" },
  { key: "clinvarGermlineClassification", label: "Classification" },
  { key: "conditions", label: "Clinical Conditions" },
  { key: "af", label: "AF" },
  { key: "scores", label: "Scores" },
  { key: "action", label: "Action" },
];

interface VariantTableProps {
  variants: Variant[];
  visibleColumns?: string[];
}

export default function VariantTable({
  variants,
  visibleColumns,
}: VariantTableProps) {
  if (variants.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-lg font-medium">
          No variants found matching your filters.
        </p>
        <p className="text-sm mt-1">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  // Filter columns based on visibility
  const columns = visibleColumns
    ? CLINVAR_COLUMNS.filter((col) => visibleColumns.includes(col.key))
    : CLINVAR_COLUMNS;

  return (
    <div className="flex-1 w-full border border-gray-200 dark:border-scientific-border rounded-lg shadow-sm  flex flex-col">
      <div className="flex-1 max-h-[520px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-scientific-border">
          <thead className="sticky top-0 z-20 bg-gray-50 dark:bg-scientific-panel/90 backdrop-blur shadow-sm">
          <tr>
            {columns.map((col) => {
              let className =
                "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";
              if (col.key === "Protein_change") className += " w-40";
              if (col.key === "gnomAD_ID")
                className +=
                  " sticky left-0 bg-gray-50 dark:bg-scientific-panel/90 z-10 backdrop-blur w-36";
              if (col.key === "af" || col.key === "scores")
                className = className.replace("text-left", "text-right");
              if (col.key === "action")
                className = className.replace("text-left", "text-center");

              return (
                <th key={col.key} scope="col" className={className}>
                  {col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-scientific-border">
          {variants.map((variant) => (
            <tr
              key={variant.id}
              className="hover:bg-gray-50/50 dark:hover:bg-scientific-panel/40 transition-colors group"
            >
              {columns.map((col) => {
                const cellClassName = "px-4 py-3 text-sm";

                if (col.key === "Protein_change") {
                  return (
                    <td key={col.key} className={cellClassName}>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {variant.proteinConsequence}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {variant.hgvsConsequence}
                      </div>
                    </td>
                  );
                }

                if (col.key === "rsID") {
                  return (
                    <td
                      key={col.key}
                      className={`${cellClassName} text-gray-500 dark:text-gray-300`}
                    >
                      {variant.rsIDs.length > 0 ? (
                        variant.rsIDs.join(", ")
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                  );
                }

                if (col.key === "gnomAD_ID") {
                  return (
                    <td
                      key={col.key}
                      className={`${cellClassName} font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap sticky left-0 bg-white dark:bg-scientific-bg group-hover:bg-gray-50/50 dark:group-hover:bg-[#152033] z-10`}
                    >
                      {variant.gnomAD_ID}
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {variant.sourceType === "clinvar"
                          ? "ClinVar"
                          : "Custom"}
                      </div>
                    </td>
                  );
                }

                if (col.key === "clinvarGermlineClassification") {
                  return (
                    <td
                      key={col.key}
                      className={`${cellClassName} whitespace-nowrap`}
                    >
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border 
                        ${
                          variant.clinvarGermlineClassification ===
                            "Pathogenic" ||
                          variant.clinvarGermlineClassification ===
                            "Likely Pathogenic"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20"
                            : variant.clinvarGermlineClassification === "VUS"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20"
                              : variant.clinvarGermlineClassification.includes(
                                    "Benign",
                                  )
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
                                : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        }`}
                      >
                        {variant.clinvarGermlineClassification}
                      </span>
                    </td>
                  );
                }

                if (col.key === "conditions") {
                  return (
                    <td key={col.key} className={cellClassName}>
                      {variant.conditions && variant.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {variant.conditions.map(
                            (condition: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100 dark:border-blue-800/30 whitespace-nowrap"
                              >
                                {condition}
                              </span>
                            ),
                          )}
                        </div>
                      ) : null}
                    </td>
                  );
                }

                if (col.key === "af") {
                  return (
                    <td
                      key={col.key}
                      className={`${cellClassName} text-gray-700 dark:text-gray-300 text-right font-mono`}
                    >
                      {typeof variant.alleleFrequency === "number" &&
                      variant.alleleFrequency > 0
                        ? variant.alleleFrequency.toExponential(2)
                        : "0.00"}
                    </td>
                  );
                }

                if (col.key === "scores") {
                  return (
                    <td key={col.key} className={`${cellClassName} text-right`}>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center text-xs">
                          <span className="text-gray-400 w-10 text-right mr-1">
                            CADD:
                          </span>
                          <span
                            className={`font-mono font-medium ${variant.cadd >= 20 ? "text-orange-500 dark:text-orange-400" : "text-gray-700 dark:text-gray-300"}`}
                          >
                            {variant.cadd.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="text-gray-400 w-10 text-right mr-1">
                            RVL:
                          </span>
                        </div>
                      </div>
                    </td>
                  );
                }

                if (col.key === "action") {
                  const genomicIdEncoded = variant.Genomic_ID ? encodeURIComponent(variant.Genomic_ID) : '';
                  return (
                    <td
                      key={col.key}
                      className={`${cellClassName} text-center`}
                    >
                      <Link
                        href={`/variant/${encodeURIComponent(variant.rsIDs[0] || variant.id)}?genomicId=${genomicIdEncoded}`}
                        className="inline-flex items-center justify-center p-1.5 rounded-md text-primary-600 dark:text-scientific-accent hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="View Details"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                    </td>
                  );
                }

                return null;
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
