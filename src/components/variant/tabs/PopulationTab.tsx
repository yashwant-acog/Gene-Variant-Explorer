import React, { useMemo, useState, useEffect } from "react";
import PopulationBarChart from "@/components/charts/PopulationBarChart";
import PopulationDistributionChart from "@/components/charts/PopulationDistributionChart";
import { Variant } from "@/lib/types";
import { useSearchParams } from "next/navigation";

interface PopulationTabProps {
  variant: Variant;
  popDistributions: {
    freqs: Record<string, number[]>;
    counts: Record<string, number[]>;
  };
}

const POP_NAME_MAP: Record<string, string> = {
  afr: "African / African American",
  amr: "Admixed American",
  asj: "Ashkenazi Jewish",
  eas: "East Asian",
  fin: "European (Finnish)",
  nfe: "European (non-Finnish)",
  mid: "Middle Eastern",
  sas: "South Asian",
  ami: "Amish",
  remaining: "Remaining",
  remaining_individuals: "Remaining",
  oth: "Remaining",
};

const POP_COLORS: Record<string, string> = {
  afr: "#f59e0b",
  amr: "#10b981",
  asj: "#34d399",
  eas: "#059669",
  fin: "#60a5fa",
  nfe: "#2563eb",
  mid: "#8b5cf6",
  sas: "#7c3aed",
  ami: "#d946ef",
  remaining: "#94a3b8",
};

export default function PopulationTab({
  variant,
  popDistributions,
}: PopulationTabProps) {
  console.log(
    "PopulationTab Render - Variant ID:",
    variant?.Genomic_ID || variant?.id,
  );
  const searchParams = useSearchParams();
  const genomicIdFromUrl = searchParams.get("genomicId");

  const [chartView, setChartView] = useState<"distribution" | "bar">("bar");
  const [barChartViewMode, setBarChartViewMode] = useState<
    "frequency" | "count"
  >("count");
  const [gnomadData, setGnomadData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    console.log("PopulationTab useEffect Triggered");

    async function fetchGnomadData() {
      let variantId = "";
      console.log("DEBUG: fetchGnomadData started. URL ID:", genomicIdFromUrl);

      try {
        // 1. PRIORITIZE URL genomicId (requested by user)
        if (genomicIdFromUrl) {
          // Format from URL: 17:7688649:A:G -> 17-7688649-A-G
          variantId = genomicIdFromUrl
            .replace("chr", "")
            .replace(/:/g, "-")
            .replace(/\./g, "-");
        }
        // 2. FALLBACK to clinvar metadata
        else if (variant.clinvar?.chrom && variant.clinvar?.hg38?.start) {
          variantId = `${variant.clinvar.chrom.replace("chr", "")}-${variant.clinvar.hg38.start}-${variant.clinvar.ref}-${variant.clinvar.alt}`;
        }
        // 3. FALLBACK to variant props
        else if (
          variant.chromosome &&
          variant.position &&
          variant.chromosome !== "N/A"
        ) {
          variantId = `${variant.chromosome.replace("chr", "")}-${variant.position}-${variant.reference}-${variant.alternate}`;
        }
        // 4. FALLBACK to internal Genomic_ID
        else if (variant.Genomic_ID || variant.genomicID) {
          const raw = variant.Genomic_ID || variant.genomicID;
          if (raw) {
            if (raw.includes(":g.")) {
              const [chromPart, changePart] = raw.split(":g.");
              const chrom = chromPart.replace("chr", "");
              const posMatch = changePart.match(/(\d+)/);
              const pos = posMatch ? posMatch[1] : "";
              if (changePart.includes(">")) {
                const alleles = changePart.replace(/.*(\d+)/, "").split(">");
                if (chrom && pos && alleles.length === 2) {
                  variantId = `${chrom}-${pos}-${alleles[0]}-${alleles[1]}`;
                }
              }
            } else {
              variantId = raw
                .replace("chr", "")
                .replace(/:/g, "-")
                .replace(/\./g, "-");
            }
          }
        }
      } catch (e) {
        console.error("DEBUG: Error parsing variant ID:", e);
      }

      console.log("DEBUG: Final Constructed variantId:", variantId);

      if (
        !variantId ||
        variantId === "N/A" ||
        variantId.includes("undefined")
      ) {
        console.warn("DEBUG: No valid variantId, skipping fetch.");
        setGnomadData([]);
        return;
      }

      setLoading(true);
      setNotFound(false);
      try {
        console.log("Hitting API...");
        const query = `
          query GnomadVariant($variantId: String!, $datasetId: DatasetId!) {
            variant(variantId: $variantId, dataset: $datasetId) {
              joint {
                populations {
                  id
                  ac
                  an
                  homozygote_count
                  hemizygote_count
                }
              }
            }
          }
        `;

        const response = await fetch("https://gnomad.broadinstitute.org/api", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            variables: { variantId, datasetId: "gnomad_r4" },
          }),
        });

        const result = await response.json();
        console.log("gnomAD RESPONSE DATA:", variantId, result);

        const variantData = result.data?.variant;
        if (!variantData) {
          setNotFound(true);
          setGnomadData([]);
          return;
        }

        const pops = variantData.joint?.populations || [];

        // Return only non-zero populations with readable names
        const filteredPops = pops
          .filter((p: any) => p.ac > 0)
          .map((p: any) => ({
            ...p,
            name: POP_NAME_MAP[p.id] || p.id,
            af: p.an > 0 ? p.ac / p.an : 0,
            color: POP_COLORS[p.id] || "#94a3b8",
          }));

        setGnomadData(filteredPops);
      } catch (err) {
        console.error("Error fetching gnomAD data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGnomadData();
  }, [variant]);

  const popDefs = useMemo(() => {
    if (gnomadData.length > 0) {
      return gnomadData.map((p) => ({
        name: p.name,
        count: p.ac,
        number: p.an,
        color: p.color,
      }));
    }

    // Default empty array if truly not found or loading
    if (loading || notFound) return [];

    // Fallback to variant props if gnomAD fetch hasn't happened or failed quietly
    return [
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
    ].filter((p) => (p.count || 0) > 0);
  }, [variant, gnomadData, loading, notFound]);

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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-scientific-panel p-4 rounded-lg border border-gray-100 dark:border-scientific-border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                gnomAD Population Metrics
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time frequency data from gnomAD v4
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full border border-primary-100 dark:border-primary-800/30">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-ping" />
                <span className="text-[10px] font-bold text-primary-700 dark:text-primary-300 uppercase tracking-widest">
                  Fetching Live Data
                </span>
              </div>
            )}
          </div>

          <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-lg w-fit">
            <button
              disabled={loading}
              onClick={() => setChartView("bar")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartView === "bar"
                  ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Frequency Breakdown
            </button>
            <button
              disabled={loading}
              onClick={() => setChartView("distribution")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                chartView === "distribution"
                  ? "bg-white dark:bg-white/10 text-primary-600 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Distribution Plot
            </button>
          </div>
        </div>

        <div className="min-h-[400px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  Consulting gnomAD Bureau...
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                  Requesting joint population frequencies
                </p>
              </div>
            </div>
          ) : notFound ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-900/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <svg
                className="w-12 h-12 text-gray-300 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-500 text-center px-6">
                Variant not found in gnomAD v4 database.
                <br />
                <span className="text-xs text-gray-400 mt-1 block">
                  Check the variant coordinates or try a different dataset.
                </span>
              </p>
            </div>
          ) : (
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
                  <div className="flex justify-end relative z-10 w-full mb-[-45px]">
                    <div className="flex p-1 bg-gray-100 dark:bg-black/20 rounded-lg w-fit mr-4 mt-2">
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
                    title={`${barChartViewMode === "frequency" ? "Frequency" : "Count"} Breakdown`}
                    xAxisTitle={`Allele ${barChartViewMode === "frequency" ? "Frequency" : "Count"}`}
                    height={400}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
