import Link from "next/link";
import { Variant } from "@/lib/types";

export const CLINVAR_COLUMNS = [
  { key: "Variation", label: "Variation" },
  { key: "genomicID", label: "Genomic ID" },
  { key: "Protein_change", label: "Protein change" },
  { key: "rsID", label: "rsID" },
  { key: "clinvarClassification", label: "ClinVar Classification" },
  { key: "acmgClassification", label: "ACMG Classification" },
  { key: "conditions", label: "ClinVar Conditions" },
  { key: "customCondition", label: "Custom Condition" },
  { key: "clinvar", label: "ClinVar" },
  { key: "gnomad", label: "gnomAD" },
];

interface VariantTableProps {
  variants: Variant[];
  visibleColumns?: string[];
  gene: string;
}

export default function VariantTable({
  variants,
  visibleColumns,
  gene,
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

  function getACMGColor(classification: string) {
    switch (classification.toLowerCase()) {
      case "benign":
        return "bg-emerald-500 text-white";
      case "likely benign":
        return "bg-emerald-400 text-white";
      case "benign/likely benign":
        return "bg-emerald-400 text-white";
      case "uncertain significance":
        return "bg-amber-400 text-black";
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

  // Filter columns based on visibility
  const columns = visibleColumns
    ? CLINVAR_COLUMNS.filter((col) => visibleColumns.includes(col.key))
    : CLINVAR_COLUMNS;

  const AA_MAP: Record<string, string> = {
    Ala: "A",
    Arg: "R",
    Asn: "N",
    Asp: "D",
    Cys: "C",
    Gln: "Q",
    Glu: "E",
    Gly: "G",
    His: "H",
    Ile: "I",
    Leu: "L",
    Lys: "K",
    Met: "M",
    Phe: "F",
    Pro: "P",
    Ser: "S",
    Thr: "T",
    Trp: "W",
    Tyr: "Y",
    Val: "V",
    // Ambiguous/Special
    Asx: "B",
    Glx: "Z",
    Xaa: "X",
    Xle: "J",
    Ter: "*",
  };

  const formatProteinConsequence = (consequence: string) => {
    if (!consequence || !consequence.includes("p.")) return consequence;

    // Extract the part starting from 'p.' (e.g., p.Gln485Arg)
    const pPart = consequence.split("p.")[1] || consequence;

    // Use regex to replace 3-letter codes with 1-letter codes
    // We look for 3 letters followed by numbers or ending strings
    return pPart.replace(/([A-Z][a-z]{2})/g, (match) => {
      return AA_MAP[match] || match; // Fallback to original if not found
    });
  };

  const formatClinVarGenomicID = (variant: Variant) => {
    if (!variant.clinvar?.hgvs?.genomic) return "Not found";

    const ncEntries = variant.clinvar.hgvs.genomic.filter((h) =>
      h.startsWith("NC_"),
    );
    if (ncEntries.length === 0) return "Not found";

    // Heuristic: GRCh38 usually has a higher version suffix (.12 vs .11)
    const sorted = [...ncEntries].sort((a, b) => {
      const vA = parseInt(a.split(":")[0]?.split(".")[1]) || 0;
      const vB = parseInt(b.split(":")[0]?.split(".")[1]) || 0;
      return vB - vA;
    });

    const target = sorted[0];

    // Format: NC_000004.12:g.1805662G>T -> 4:1805662:G:T
    // Regex matches chromosome, position, ref, and alternate alleles
    const match = target.match(/NC_(\d+)\.\d+:g\.(\d+)([A-Z]+)>([A-Z]+)/);
    if (match) {
      const chr = parseInt(match[1], 10);
      const pos = match[2];
      const ref = match[3];
      const alt = match[4];
      return `${chr}:${pos}:${ref}:${alt}`;
    }

    return target;
  };

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
                if (col.key === "genomicID")
                  className +=
                    "left-0 bg-gray-50 dark:bg-scientific-panel/90 z-10 backdrop-blur w-36";
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

                  if (col.key === "Variation") {
                    const rawCdna = variant.clinvar?.hgvs.coding[0];
                    const cdna: any = rawCdna?.split(":")[1];
                    const genomicId = `${variant.clinvar?.chrom}:${variant.clinvar?.hg38.start}:${variant.clinvar?.ref}:${variant.clinvar?.alt}`;
                    return (
                      <td key={col.key} className={cellClassName}>
                        {cdna ? (
                          <Link
                            href={`/variant/${encodeURIComponent(
                              cdna,
                            )}?genomicId=${genomicId}&variationID=${variant.clinvarVariationID}&hgvsId=${variant.id}`}
                            className="text-blue-600 dark:text-blue-400 font-medium"
                          >
                            <span className="hover:underline">{cdna}</span>
                            <div>
                              <span className="text-sm text-gray-400">
                                {variant.clinvar?.rcv.preferred_name}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <div className="text-blue-600 dark:text-blue-400 font-medium">
                            <div>
                              <span className="text-sm text-gray-400">
                                {variant?.clinvar?.rcv?.preferred_name}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  }

                  if (col.key === "Protein_change") {
                    const formattedValue = formatProteinConsequence(
                      variant.proteinConsequence,
                    );

                    return (
                      <td key={col.key} className={cellClassName}>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {formattedValue}
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

                  if (col.key === "genomicID") {
                    return (
                      <td
                        key={col.key}
                        className={`${cellClassName} font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap left-0 bg-white dark:bg-scientific-bg group-hover:bg-gray-50/50 dark:group-hover:bg-[#152033] z-10`}
                      >
                        {(variant as any).customGenomicID ||
                          (variant.sourceType === "clinvar"
                            ? formatClinVarGenomicID(variant)
                            : variant.genomicID)}
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {variant.sourceType === "clinvar"
                            ? "ClinVar"
                            : "Custom"}
                        </div>
                      </td>
                    );
                  }

                  if (
                    col.key === "clinvarClassification" ||
                    col.key === "acmgClassification"
                  ) {
                    const classification = (variant as any)[col.key] || "";

                    // Regex to parse things like "Benign(4) Uncertain Significance(3)"
                    // It looks for a label, optionally followed by (digits)
                    const parts = classification.split(" || ");
                    const finalParts =
                      parts.length > 0 && parts[0] !== ""
                        ? parts
                        : [classification];

                    return (
                      <td
                        key={col.key}
                        className={`${cellClassName} whitespace-nowrap`}
                      >
                        <div className="flex flex-wrap gap-1">
                          {finalParts.map((part: string, idx: number) => {
                            if (!part) return null;
                            // Extract just the label part for colors (e.g. "Benign" from "Benign(4)")
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
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (col.key === "conditions") {
                    const conditions = variant.conditions || [];
                    return (
                      <td key={col.key} className={cellClassName}>
                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                          {conditions.map((cond, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] whitespace-nowrap dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                            >
                              {cond}
                            </span>
                          ))}
                          {conditions.length === 0 && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    );
                  }

                  if (col.key === "customCondition") {
                    const cond = (variant as any).customCondition;
                    return (
                      <td key={col.key} className={cellClassName}>
                        {cond ? (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[10px] whitespace-nowrap dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                            {cond}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    );
                  }

                  if (col.key === "clinvar") {
                    const cDNA =
                      variant.transcript || variant.hgvsConsequence || "";
                    if (!cDNA || cDNA === "N/A") {
                      return (
                        <td key={col.key} className={cellClassName}>
                          -
                        </td>
                      );
                    }
                    const term = encodeURIComponent(
                      `"${cDNA}"[VARNAME] AND "${gene}"[GENE]`,
                    );
                    return (
                      <td key={col.key} className={cellClassName}>
                        <Link
                          href={`https://www.ncbi.nlm.nih.gov/clinvar/?variant=${cDNA}&gene=${gene}&term=${term}`}
                          className="flex text-blue-600 dark:text-blue-400 font-medium hover:underline"
                          target="_blank"
                          onClick={() =>
                            console.log("right = ", cDNA, gene, term)
                          }
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
                      </td>
                    );
                  }

                  if (col.key === "gnomad") {
                    const genomicID = (variant as any).customGenomicID || "";
                    if (!genomicID) {
                      return (
                        <td key={col.key} className={cellClassName}>
                          -
                        </td>
                      );
                    }
                    return (
                      <td key={col.key} className={cellClassName}>
                        <Link
                          href={`https://gnomad.broadinstitute.org/variant/${genomicID.replaceAll(
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
