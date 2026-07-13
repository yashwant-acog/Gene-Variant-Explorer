import React, { useState, useMemo } from "react";
import Link from "next/link";
import { CustomVariant } from "@/lib/types";
import { XMLParser } from "fast-xml-parser";

const BASE_CUSTOM_COLUMNS = [
  { key: "cDNA_change", label: "cDNA Change", group: "Identity" },
  { key: "Genomic_ID", label: "Genomic ID", group: "Identity" },
  { key: "Protein_change", label: "Protein Change", group: "Identity" },
  { key: "transcript", label: "Transcript", group: "Identity" },
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
    label: "BMRN (ACMG) Classification",
    group: "Clinical",
  },
  {
    key: "clinvarClassification",
    label: "ClinVar Classification",
    group: "Clinical",
  },
  { key: "Functional", label: "Functional", group: "Functional" },
  {
    key: "Pvalue_functional",
    label: "P-value Functional",
    group: "Functional",
  },
  { key: "clinvar", label: "ClinVar", group: "Public Sources" },
  { key: "gnomad", label: "gnomAD", group: "Public Sources" },
  { key: "clinical reference", label: "Clinical Ref", group: "References" },
  {
    key: "association reference",
    label: "Association Ref",
    group: "References",
  },
  { key: "functional reference", label: "Functional Ref", group: "References" },
  { key: "annotation reference", label: "Annotation Ref", group: "References" },
];

export const getCustomColumns = (variants: any[]) => {
  const columns = [...BASE_CUSTOM_COLUMNS];

  // Dynamically find all Phenotype_ columns
  const phenotypeKeys = new Set<string>();
  variants.forEach((v) => {
    Object.keys(v).forEach((k) => {
      if (
        k.startsWith("Phenotype_") &&
        v[k] !== null &&
        v[k] !== undefined &&
        v[k] !== ""
      ) {
        phenotypeKeys.add(k);
      }
    });
  });

  // Add them to the columns list
  Array.from(phenotypeKeys)
    .sort()
    .forEach((key) => {
      const cleanName = key.replace("Phenotype_", "").replace(/_/g, " ");
      const group = key.toLowerCase().endsWith("_se")
        ? "Association (SE)"
        : "Association";
      columns.push({
        key,
        label: cleanName,
        group,
      });
    });

  // Filter out any columns from BASE_CUSTOM_COLUMNS that have NO data in the current variants set
  // EXCEPT for core columns like Identity and Public Sources (ClinVar/gnomAD)
  return columns.filter((col) => {
    if (col.group === "Identity" || col.group === "Public Sources") return true;

    return variants.some((v) => {
      const val = v[col.key];
      return (
        val !== null &&
        val !== undefined &&
        val !== "" &&
        val !== "NA" &&
        val !== "N/A"
      );
    });
  });
};

interface CustomVariantTableProps {
  variants: CustomVariant[];
  allVariants?: CustomVariant[]; // Full list for comparison logic
  visibleColumns?: string[];
  gene: string;
}

const ConditionList = ({
  conditions,
  type,
}: {
  conditions: string[];
  type: "clinvar" | "custom";
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!conditions || conditions.length === 0)
    return <span className="text-gray-400">-</span>;

  const displayedConditions = isExpanded ? conditions : conditions.slice(0, 3);
  const hasMore = conditions.length > 3;

  const colorClasses =
    type === "clinvar"
      ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
      : "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";

  return (
    <div className="flex flex-wrap gap-1 w-[250px]">
      {displayedConditions.map((cond, idx) => (
        <span
          key={idx}
          className={`px-2 py-1 border rounded-md text-[10px] max-w-[250px] whitespace-normal break-words leading-tight inline-block ${colorClasses}`}
        >
          {cond}
        </span>
      ))}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2 py-0.5 bg-black text-white rounded-full text-[10px] whitespace-nowrap hover:bg-gray-800 cursor-pointer transition-colors"
        >
          {isExpanded ? "show less" : "show more"}
        </button>
      )}
    </div>
  );
};

const TruncatedCell = ({
  text,
  maxWidth = "max-w-[150px]",
  className = "",
}: {
  text: string;
  maxWidth?: string;
  className?: string;
}) => {
  return (
    <div className={`${maxWidth} truncate ${className}`} title={text}>
      {text}
    </div>
  );
};

const MostSubmissionsButton = ({ variationId }: { variationId: string }) => {
  const [loading, setLoading] = useState(false);
  const [bestMatch, setBestMatch] = useState<{
    condition: string;
    score: number;
  } | null>(null);

  const handleCheck = async () => {
    if (!variationId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=clinvar&id=${variationId}&rettype=vcv&is_variationid`,
      );
      const xmlData = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false });
      const data = parser.parse(xmlData);

      const rcvList =
        data?.["ClinVarResult-Set"]?.VariationArchive?.ClassifiedRecord?.RCVList
          ?.RCVAccession;

      const accessions = Array.isArray(rcvList)
        ? rcvList
        : rcvList
          ? [rcvList]
          : [];

      let maxCount = -1;
      let topCondition = "";

      accessions.forEach((item: any) => {
        const condition =
          item?.ClassifiedConditionList?.ClassifiedCondition?.["#text"];
        const countStr =
          item?.RCVClassifications?.GermlineClassification?.Description?.[
            "@_SubmissionCount"
          ];
        const count = parseInt(countStr || "0");

        if (
          condition &&
          condition.toLowerCase() !== "not provided" &&
          count > maxCount
        ) {
          maxCount = count;
          topCondition = condition;
        }
      });

      if (topCondition) {
        setBestMatch({ condition: topCondition, score: maxCount });
      }
    } catch (error) {
      console.error("Error fetching most submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (bestMatch) {
    return (
      <span className="mt-1 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] whitespace-normal dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30 animate-in fade-in zoom-in duration-300">
        Most Submissions: <strong>{bestMatch.condition}</strong> (
        {bestMatch.score})
      </span>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCheck();
      }}
      disabled={loading}
      className="mt-1 px-2 py-1 bg-gray-50 dark:bg-scientific-panel text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-scientific-border rounded text-[10px] hover:bg-gray-100 dark:hover:bg-scientific-header transition-all cursor-pointer flex items-center gap-1.5 w-fit font-medium"
    >
      {loading ? (
        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      )}
      Check Most Submissions
    </button>
  );
};

// Robust parser that handles quoted values with newlines
const parseCSV = (text: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  const firstLineLineEnding = text.search(/\r?\n/);
  const firstLine =
    firstLineLineEnding !== -1 ? text.substring(0, firstLineLineEnding) : text;
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 2;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
        i++;
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 1 || currentRow[0] !== "") {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        i += char === "\r" ? 2 : 1;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  if (currentRow.length > 0 || currentField !== "") {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];
  const finalHeaders = rows[0].map((h) => h.trim());

  // Whitelist based on user request (Allele columns re-added for data ingestion)
  const allowedStatic = [
    "condition",
    "Allele Count",
    "Allele Number",
    "Allele Frequency",
    "Allele Count African/African American",
    "Allele Number African/African American",
    "Allele Count Admixed American",
    "Allele Number Admixed American",
    "Allele Count Ashkenazi Jewish",
    "Allele Number Ashkenazi Jewish",
    "Allele Count East Asian",
    "Allele Number East Asian",
    "Allele Count European (Finnish)",
    "Allele Number European (Finnish)",
    "Allele Count Middle Eastern",
    "Allele Number Middle Eastern",
    "Allele Count European (non-Finnish)",
    "Allele Number European (non-Finnish)",
    "Allele Count Amish",
    "Allele Number Amish",
    "Allele Count South Asian",
    "Allele Number South Asian",
    "REVEL",
    "VEST4_score",
    "MutPred_score",
    "BayesDel_addAF_score",
    "ACMG",
    "Functional",
    "Pvalue_functional",
  ];

  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.length === 1 && values[0] === "") continue;
    if (values.length !== finalHeaders.length) continue;

    const fullRow: any = {};
    finalHeaders.forEach((header, index) => {
      fullRow[header] = values[index];
    });

    const variantId = (fullRow["ID"] || "").toString().trim();
    // PostgreSQL B-tree index limit is ~2700 bytes. Skip rows with massive IDs to prevent "index row size exceeds maximum" errors.
    if (!variantId || variantId.length > 2000) {
      if (variantId.length > 2000) {
        console.warn(
          `Skipping row with excessively large ID (${variantId.length} chars).`,
        );
      }
      continue;
    }

    const variant: any = {
      cdnaChange: fullRow["c.change"] || null,
      proteinChange: fullRow["p.change"] || null,
      id: variantId,
      transcript: fullRow["transcript"] || fullRow["Transcript"] || null,
    };

    // Add other allowed columns if present in CSV
    finalHeaders.forEach((header) => {
      if (allowedStatic.includes(header) || header.startsWith("Phenotype_")) {
        if (fullRow[header] !== undefined) {
          variant[header] = fullRow[header];
        }
      }
    });

    data.push(variant);
  }
  return data;
};

const DiffRow = ({ variant, diffs }: { variant: any; diffs: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-black/10">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
          <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
            {variant.id || variant.Genomic_ID}
          </span>
        </div>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-800/30">
          {diffs.length} CHANGES
        </span>
      </div>

      {isOpen && (
        <div className="p-3 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {diffs.map((d, idx) => (
            <div key={idx} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {d.field.replace(/_/g, " ")}
              </span>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-red-500/80 line-through truncate max-w-[120px]">
                  {d.old || "(empty)"}
                </span>
                <svg
                  className="w-3 h-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                <span className="text-green-600 dark:text-green-400 font-bold truncate max-w-[200px]">
                  {d.new || "(empty)"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UpdateConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  onCancelWithAdd,
  newVariants,
  changedRows = [],
  isUploading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancelWithAdd?: () => void;
  newVariants: any[];
  changedRows: any[];
  isUploading: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-scientific-panel rounded-2xl shadow-2xl border border-gray-200 dark:border-scientific-border w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-scientific-border">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Confirm Incremental Update
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            The following new variants were found in your CSV and will be added
            to the dashboard.
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[400px] space-y-6">
          {newVariants.length > 0 && (
            <div>
              <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-800/30 mb-3">
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                  {newVariants.length} New Variants Detected
                </span>
              </div>
              <div className="space-y-2">
                {newVariants.slice(0, 20).map((v, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono p-2 bg-gray-50 dark:bg-black/20 rounded border border-gray-100 dark:border-gray-800 flex justify-between"
                  >
                    <span>{v.id || v.Genomic_ID}</span>
                    <span className="text-gray-400">
                      {v.cdnaChange || v.cDNA_change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {changedRows.length > 0 && (
            <div>
              <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800/30 mb-3">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {changedRows.length} Modified Variants Detected
                </span>
                <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5">
                  Existing rows with updated values (e.g. conditions)
                </p>
              </div>
              <div className="space-y-2">
                {changedRows.slice(0, 20).map((row, i) => (
                  <DiffRow key={i} variant={row.data} diffs={row.diffs} />
                ))}
              </div>
            </div>
          )}

          {newVariants.length === 0 && changedRows.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">
              No changes detected in CSV.
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-scientific-border bg-gray-50 dark:bg-black/10 flex gap-3">
          <button
            onClick={onCancelWithAdd || onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={
              isUploading ||
              (newVariants.length === 0 && changedRows.length === 0)
            }
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUploading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.forwardRef(function CustomVariantTable(
  { variants, allVariants = [], visibleColumns, gene }: CustomVariantTableProps,
  ref: React.Ref<any>,
) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<{
    new: any[];
    changed: any[];
  }>({ new: [], changed: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [fullCSVData, setFullCSVData] = useState<any[]>([]);

  // Expose the trigger via ref
  React.useImperativeHandle(ref, () => ({
    triggerUpdate: handleUpdateFlow,
  }));

  const handleUpdateFlow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const csvData = parseCSV(text);
          setFullCSVData(csvData);

          // Use allVariants for filtering to ensure we check against the entire DB state
          const compareList = allVariants.length > 0 ? allVariants : variants;

          const nRows: any[] = [];
          const cRows: any[] = [];

          csvData.forEach((csvV) => {
            const csvId = (csvV.Genomic_ID || csvV.id || "").toString().trim();
            const existing = compareList.find((v: any) => {
              const exId = (v.genomic_id || v.Genomic_ID || v.id || "")
                .toString()
                .trim();
              return exId.toLowerCase() === csvId.toLowerCase();
            });

            if (!existing) {
              nRows.push(csvV);
            } else {
              const diffs: any[] = [];
              const getMappedVal = (obj: any, k: string) => {
                const targetK = k.toLowerCase().replace(/[^a-z0-9]/g, "");

                // Final fallback: case-insensitive alphanumeric search through all object keys
                const objKeys = Object.keys(obj);
                const match = objKeys.find(
                  (ok) =>
                    ok.toLowerCase().replace(/[^a-z0-9]/g, "") === targetK,
                );
                if (match) return obj[match];

                return "";
              };

              Object.keys(csvV).forEach((key) => {
                const lowerK = key.toLowerCase().replace(/[^a-z0-9]/g, "");

                // Whitelist check
                const isPhenotype = lowerK.startsWith("phenotype");
                const isPopulation =
                  lowerK.includes("homozygote") ||
                  lowerK.includes("hemizygote");

                const isWhitelisted =
                  [
                    "pchange",
                    "cchange",
                    "id",
                    "genomicid",
                    "condition",
                    "allelecount",
                    "allelenumber",
                    "allelefrequency",
                    "allelecountafricanafricanamerican",
                    "allelenumberafricanafricanamerican",
                    "allelecountadmixedamerican",
                    "allelenumberadmixedamerican",
                    "allelecountashkenazijewish",
                    "allelenumberashkenazijewish",
                    "allelecounteastasian",
                    "allelenumbereastasian",
                    "allelecounteuropeanfinnish",
                    "allelenumbereuropeanfinnish",
                    "allelecountmiddleeastern",
                    "allelenumbermiddleeastern",
                    "allelecounteuropeannonfinnish",
                    "allelenumbereuropeannonfinnish",
                    "allelecountamish",
                    "allelenumberamish",
                    "allelecountsouthasian",
                    "allelenumbersouthasian",
                    "transcript",
                    "revel",
                    "vest4score",
                    "mutpredscore",
                    "bayesdeladdafscore",
                    "acmg",
                    "functional",
                    "pvaluefunctional",
                  ].includes(lowerK) || isPhenotype;

                // Explicitly ignore homozygote and hemizygote columns as requested
                const isIgnored =
                  lowerK.includes("homozygote") ||
                  lowerK.includes("hemizygote");
                if (isIgnored) return;

                if (!isWhitelisted) return;

                // Also skip primary keys from being modified
                if (
                  lowerK === "id" ||
                  lowerK === "genomicid" ||
                  lowerK === "cdnachange" ||
                  lowerK === "cchange" ||
                  lowerK === "proteinchange" ||
                  lowerK === "pchange"
                )
                  return;

                const csvVal = (csvV[key] || "").toString().trim();
                const existingVal = (getMappedVal(existing, key) || "")
                  .toString()
                  .trim();

                const isNA = (val: string) =>
                  !val ||
                  val === "NA" ||
                  val === "N/A" ||
                  val === "nan" ||
                  val === "null";
                if (isNA(csvVal) && isNA(existingVal)) return;

                // Numeric comparison fallback
                if (
                  !isNaN(Number(csvVal)) &&
                  !isNaN(Number(existingVal)) &&
                  csvVal !== "" &&
                  existingVal !== ""
                ) {
                  if (Math.abs(Number(csvVal) - Number(existingVal)) < 1e-10)
                    return;
                }

                if (csvVal !== existingVal) {
                  diffs.push({
                    field: key,
                    old: isNA(existingVal) ? null : existingVal,
                    new: csvVal,
                  });
                }
              });

              if (diffs.length > 0) {
                cRows.push({ data: csvV, diffs });
              }
            }
          });

          if (nRows.length === 0 && cRows.length === 0) {
            alert(
              "No changes found in the uploaded CSV compared to the existing database.",
            );
            return;
          }

          setPendingUpdates({ new: nRows, changed: cRows });
          setIsModalOpen(true);
        } catch (err: any) {
          alert("Error parsing CSV: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const processUpload = async () => {
    if (
      pendingUpdates.new.length === 0 &&
      pendingUpdates.changed.length === 0
    ) {
      setIsModalOpen(false);
      return;
    }
    setIsUploading(true);
    try {
      console.log(
        `Starting batched update of ${fullCSVData.length} variants...`,
      );

      // Batching to prevent "Payload Too Large" errors (Next.js limit is typically 1MB)
      const BATCH_SIZE = 100;
      for (let i = 0; i < fullCSVData.length; i += BATCH_SIZE) {
        const chunk = fullCSVData.slice(i, i + BATCH_SIZE);
        console.log(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        const response = await fetch(`/api/variants/${gene}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variants: chunk }),
        });

        if (!response.ok) {
          const d = await response.json();
          throw new Error(
            d.error || `Failed to upload batch ${i / BATCH_SIZE}`,
          );
        }
      }

      setIsModalOpen(false);
      window.location.reload();
    } catch (e: any) {
      alert("Error uploading data: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gray-50 dark:bg-scientific-panel/30 border border-gray-200 dark:border-scientific-border rounded-lg text-gray-500 italic">
        No custom variants found matching current filters.
      </div>
    );
  }

  const allAvailableColumns = useMemo(
    () => getCustomColumns(variants),
    [variants],
  );

  const columns = visibleColumns
    ? allAvailableColumns.filter((col: any) => visibleColumns.includes(col.key))
    : allAvailableColumns;

  const groups = Array.from(new Set(columns.map((c: any) => c.group)));

  function getACMGColor(classification: string) {
    switch (classification.toLowerCase()) {
      case "benign":
        return "bg-emerald-500 text-white";
      case "likely benign":
        return "bg-emerald-400 text-white";
      case "benign/likely benign":
        return "bg-emerald-400 text-white";
      case "uncertain significance":
        return "bg-amber-400 text-white";
      case "likely pathogenic":
        return "bg-orange-500 text-white";
      case "pathogenic/likely pathogenic":
        return "bg-orange-500 text-white";
      case "pathogenic":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-400 text-white";
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
            <tr className="bg-white dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border text-xs font-semibold text-gray-700 dark:text-gray-200">
              {columns.map((col: any, idx: number) => (
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
            {variants.map((v: any, vIdx: number) => (
              <tr
                key={vIdx}
                className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
              >
                {columns.map((col: any, cIdx: number) => {
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
                        )}?genomicId=${genomicIdEncoded}&variationID=${
                          (v as any).clinvarVariant_ID || ""
                        }&hgvsId=${(v as any).myvariant_id || ""}&gene=${gene}`}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        <TruncatedCell
                          text={v.cDNA_change}
                          maxWidth="max-w-[120px]"
                        />
                      </Link>
                    );
                  }

                  if (col.key === "Genomic_ID") {
                    renderedValue = (
                      <TruncatedCell
                        text={v.Genomic_ID || ""}
                        maxWidth="max-w-[140px]"
                      />
                    );
                  }

                  if (col.key === "transcript") {
                    let nmId = (v as any).clinvarTranscript || null;
                    let cdna = v.cDNA_change || "";

                    if (!nmId || nmId === "N/A") {
                      const title =
                        (v as any).clinvar?.rcv?.preferred_name || "";
                      const nmMatch = title.match(/^(NM_[0-9]+\.[0-9]+)/);
                      nmId = nmMatch ? nmMatch[1] : null;

                      const cdnaMatch = title.match(/:(c\.[^ (]+)/);
                      if (cdnaMatch) cdna = cdnaMatch[1];
                    }

                    const customTranscriptParams = v.transcript;
                    const customTranscript =
                      customTranscriptParams &&
                      customTranscriptParams !== "N/A" &&
                      customTranscriptParams !== "NA" &&
                      customTranscriptParams !== "nan"
                        ? customTranscriptParams
                        : null;

                    if ((!nmId || nmId === "N/A") && !customTranscript) {
                      renderedValue = (
                        <span className="text-gray-400 font-sans">-</span>
                      );
                    } else {
                      const renderClinvarLink = () => {
                        if (!nmId || nmId === "N/A") return null;
                        const searchParam = encodeURIComponent(
                          `${nmId}:${cdna}`,
                        );
                        const href = `https://www.ncbi.nlm.nih.gov/nuccore/${nmId}?report=graph&search=${searchParam}`;
                        return (
                          <Link
                            href={href}
                            target="_blank"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs whitespace-nowrap"
                          >
                            {nmId}
                          </Link>
                        );
                      };

                      const renderCustomTranscript = () => {
                        if (!customTranscript) return null;
                        return (
                          <span className="font-medium text-xs whitespace-nowrap text-gray-700 dark:text-gray-300">
                            {customTranscript}
                          </span>
                        );
                      };

                      if (
                        nmId === customTranscript ||
                        (nmId && nmId !== "N/A" && !customTranscript)
                      ) {
                        renderedValue = renderClinvarLink();
                      } else if (
                        (!nmId || nmId === "N/A") &&
                        customTranscript
                      ) {
                        renderedValue = renderCustomTranscript();
                      } else {
                        renderedValue = (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase text-gray-400 tracking-wider font-semibold">
                                ClinVar
                              </span>
                              {renderClinvarLink()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase text-gray-400 tracking-wider font-semibold">
                                Custom
                              </span>
                              {renderCustomTranscript()}
                            </div>
                          </div>
                        );
                      }
                    }
                  }

                  if (
                    col.key === "acmgClassification" ||
                    col.key === "clinvarClassification"
                  ) {
                    const acmgScore = v.ACMG || v.acmg;
                    const classification =
                      col.key === "acmgClassification"
                        ? acmgScore && acmgScore !== "NA" && acmgScore !== "N/A"
                          ? (v as any)[col.key] || ""
                          : ""
                        : (v as any)[col.key] || "";

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
                      <div className="flex flex-col gap-1">
                        <ConditionList conditions={conditions} type="clinvar" />
                        {(v as any).clinvarVariant_ID &&
                          conditions.length > 1 && (
                            <MostSubmissionsButton
                              variationId={(v as any).clinvarVariant_ID}
                            />
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

                  // Phenotype / Meta analysis columns
                  if (col.key.startsWith("Phenotype_")) {
                    renderedValue =
                      value &&
                      value !== "NA" &&
                      value !== "N/A" &&
                      value !== "nan" ? (
                        <span className="font-mono text-xs">
                          {typeof value === "string" &&
                          !isNaN(parseFloat(value))
                            ? parseFloat(value).toFixed(4)
                            : value}
                        </span>
                      ) : null;
                  }

                  if (col.key === "condition") {
                    const conds = value
                      ? typeof value === "string"
                        ? value.split(",").map((s: string) => s.trim())
                        : [String(value)]
                      : [];
                    renderedValue = (
                      <ConditionList conditions={conds} type="custom" />
                    );
                  }

                  if (col.key === "clinvarConditions") {
                    const conds = Array.isArray(value) ? value : [];
                    const clinvarID = (v as any).clinvarVariant_ID;
                    renderedValue = (
                      <div className="flex flex-col gap-1">
                        {clinvarID && conds.length > 1 && (
                          <MostSubmissionsButton variationId={clinvarID} />
                        )}
                        <ConditionList conditions={conds} type="clinvar" />
                      </div>
                    );
                  }

                  if (col.key === "clinvar") {
                    const clinvarID = (v as any).clinvarVariant_ID;
                    if (!clinvarID) {
                      renderedValue = (
                        <span className="text-gray-400 font-sans">-</span>
                      );
                    } else {
                      renderedValue = (
                        <Link
                          href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarID}`}
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
                    const gid =
                      v.Genomic_ID || (v as any).clinvarGenomicID || "";
                    const isValidGid =
                      gid &&
                      gid.split(":").length === 4 &&
                      gid
                        .split(":")
                        .every((p: string) => p && p !== "undefined") &&
                      gid !== "Not found";

                    if (!(v as any).clinvarVariant_ID) {
                      renderedValue = (
                        <span className="text-gray-400 font-sans">-</span>
                      );
                    } else {
                      renderedValue = (
                        <Link
                          href={`https://gnomad.broadinstitute.org/variant/${gid.replaceAll(
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

                  // Global fallback for missing values
                  if (
                    renderedValue === null ||
                    renderedValue === undefined ||
                    renderedValue === "" ||
                    renderedValue === "NA" ||
                    renderedValue === "N/A" ||
                    renderedValue === "nan"
                  ) {
                    renderedValue = (
                      <span className="text-gray-400 font-sans">-</span>
                    );
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

      <UpdateConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCancelWithAdd={processUpload}
        onConfirm={processUpload}
        newVariants={pendingUpdates.new}
        changedRows={pendingUpdates.changed}
        isUploading={isUploading}
      />
    </div>
  );
});
