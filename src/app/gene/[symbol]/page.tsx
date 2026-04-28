"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import FilterPanel, { FilterState } from "@/components/filters/FilterPanel";
import VariantTable from "@/components/tables/VariantTable";
import CustomVariantTable from "@/components/tables/CustomVariantTable";
import ScatterPlot, { ScatterDataPoint } from "@/components/charts/ScatterPlot";
import ACMGDistribution from "@/components/charts/ACMGDistribution";
import { dummyCustomVariants } from "../../../lib/dummyData";
import {
  fetchClinVarVariants,
  getProteinPosition,
  getDomainInfo,
} from "@/lib/api";
import { Variant } from "@/lib/types";
import ColumnSelector from "@/components/tables/ColumnSelector";
import { CLINVAR_COLUMNS } from "@/components/tables/VariantTable";
import { CUSTOM_COLUMNS } from "@/components/tables/CustomVariantTable";
import Navbar from "@/components/layout/Navbar";

// type SortOption =
//   | "af-desc"
//   | "af-asc"
//   | "cadd-desc"
//   | "revel-desc"
//   | "id-asc"
//   | "points-desc"
//   | "points-asc";

// Helper to extract numeric position from cDNA (e.g., "c.1138G>A" -> 1138)
const extractCdnaNumber = (cdna: string): number | null => {
  if (!cdna) return null;
  const match = cdna.match(/c\.(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

// Helper to extract numeric position from proteinConsequence (e.g., "p.Gly380Arg" -> 380)
const extractPosition = (proteinConsequence: string): number | null => {
  if (!proteinConsequence) return null;
  const match = proteinConsequence.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

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
  Asx: "B",
  Glx: "Z",
  Xaa: "X",
  Xle: "J",
  Ter: "*",
};

const formatProteinConsequence = (consequence: string) => {
  if (!consequence || !consequence.includes("p.")) return consequence;
  const pPart = consequence.split("p.")[1] || consequence;
  return pPart.replace(/([A-Z][a-z]{2})/g, (match) => {
    return AA_MAP[match] || match;
  });
};

// Helper for dataset merging
const normalizeCDNA = (cdna: string) => {
  if (!cdna || cdna === "N/A" || cdna === "NA") return "";

  // 1. Try to isolate c. marker using regex (handles "c.123A>G" within larger strings)
  const cdnaMatch = cdna.match(/(c\.[0-9]+[^(\s]*)/i);
  if (cdnaMatch) {
    return cdnaMatch[1].toUpperCase().trim();
  }

  // 2. Fallback: Take part after last colon and split by space
  const parts = cdna.split(":");
  let candidate = parts[parts.length - 1].trim();
  // Remove trailing info like "(p.Gly380Arg)" if present
  candidate = candidate.split(" ")[0];

  return candidate.toUpperCase().replace(/\s+/g, "");
};

const getColorForPoints = (points?: string) => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "#9ca3af"; // Gray

  if (pts >= 10) return "#ef4444"; // Pathogenic: Red
  if (pts >= 6) return "#f97316"; // Likely Pathogenic: Orange
  if (pts >= -5) return "#eab308"; // Uncertain Significance: Yellow
  if (pts >= -9) return "#34d399"; // Likely Benign: Light Emerald
  return "#10b981"; // Benign: Emerald
};

const getCategoryIndex = (points?: string): number => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return 2; // Default to Uncertain Significance

  if (pts >= 10) return 4; // Pathogenic
  if (pts >= 6) return 3; // Likely Pathogenic
  if (pts >= -5) return 2; // Uncertain Significance
  if (pts >= -9) return 1; // Likely Benign
  return 0; // Benign
};

const getLabelForPoints = (points?: string): string => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "Uncertain Significance";

  if (pts >= 10) return "Pathogenic";
  if (pts >= 6) return "Likely Pathogenic";
  if (pts >= -5) return "Uncertain Significance";
  if (pts >= -9) return "Likely Benign";
  return "Benign";
};

// Helper functions for ClinVar classification
const getCategoryIndexFromClinvar = (classification?: string): number => {
  if (!classification) return 2; // Default to Uncertain Significance

  const cls = classification.toLowerCase();
  if (cls.includes("pathogenic") && !cls.includes("likely")) return 4; // Pathogenic
  if (cls.includes("likely pathogenic")) return 3; // Likely Pathogenic
  if (cls.includes("Uncertain Significance") || cls.includes("uncertain"))
    return 2; // Uncertain Significance/Uncertain significance
  if (cls.includes("likely benign")) return 1; // Likely Benign
  if (cls.includes("benign") && !cls.includes("likely")) return 0; // Benign
  return 2; // Default to Uncertain Significance for unknown classifications
};

const getColorForClinvarClassification = (classification?: string): string => {
  if (!classification) return "#eab308"; // Default Uncertain Significance color

  const cls = classification.toLowerCase();
  if (cls.includes("pathogenic") && !cls.includes("likely")) return "#ef4444"; // Pathogenic: Red
  if (cls.includes("likely pathogenic")) return "#f97316"; // Likely Pathogenic: Orange
  if (cls.includes("Uncertain Significance") || cls.includes("uncertain"))
    return "#eab308"; // Uncertain Significance: Yellow
  if (cls.includes("likely benign")) return "#34d399"; // Likely Benign: Light Emerald
  if (cls.includes("benign") && !cls.includes("likely")) return "#10b981"; // Benign: Emerald
  return "#eab308"; // Default Uncertain Significance color
};

export default function GeneDashboard() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const router = useRouter();

  // Remove useSearchParams to prevent re-renders - read URL directly on mount only
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<"table" | "plots">("table");
  const [chartView, setChartView] = useState<"scatter" | "bar">("scatter");
  // searchQuery is initialized from URL below
  // const [sortOption, setSortOption] = useState<SortOption>("id-asc");
  const [clinvarVariants, setClinvarVariants] = useState<Variant[]>([]);
  const [clinvarTotal, setClinvarTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isClinvarSyncing, setIsClinvarSyncing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleClinVarColumns, setVisibleClinVarColumns] = useState<string[]>(
    CLINVAR_COLUMNS.map((col) => col.key),
  );
  const [visibleCustomColumns, setVisibleCustomColumns] = useState<string[]>([
    "cDNA_change",
    "Genomic_ID",
    "Protein_change",
    "Mutation_type",
    "acmgClassification",
    "clinvarClassification",
    "clinvar",
    "gnomad",
  ]);
  const [sortOption, setSortOption] = useState<"cdna-asc" | "cdna-desc">(
    "cdna-asc",
  );
  const [searchField, setSearchField] = useState<
    "all" | "cdna" | "genomic" | "protein"
  >("all");

  // Initialize filters and search query from URL ONCE on mount using lazy initialization
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return {
        clinvarClassifications:
          searchParams.get("clinvar")?.split(",").filter(Boolean) || [],
        acmgClassifications:
          searchParams.get("acmg")?.split(",").filter(Boolean) || [],
        vepAnnotations:
          searchParams.get("vepAnnotations")?.split(",").filter(Boolean) || [],
        mutationTypes:
          searchParams.get("mutationTypes")?.split(",").filter(Boolean) || [],
        afMin: searchParams.get("afMin")
          ? Number(searchParams.get("afMin"))
          : "",
        afMax: searchParams.get("afMax")
          ? Number(searchParams.get("afMax"))
          : "",
        caddMin: searchParams.get("caddMin")
          ? Number(searchParams.get("caddMin"))
          : "",
        revelMin: searchParams.get("revelMin")
          ? Number(searchParams.get("revelMin"))
          : "",
        revelMax: searchParams.get("revelMax")
          ? Number(searchParams.get("revelMax"))
          : "",
        proteinDomains: [],
        proteinSubdomains: [],
      };
    }
    return {
      clinvarClassifications: [],
      acmgClassifications: [],
      vepAnnotations: [],
      mutationTypes: [],
      afMin: "",
      afMax: "",
      caddMin: "",
      revelMin: "",
      revelMax: "",
      proteinDomains: [],
      proteinSubdomains: [],
    };
  });

  // Initialize searchQuery from URL ONCE on mount
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("search") || "";
    }
    return "";
  });

  // Initialize viewMode from URL ONCE on mount
  const [viewMode, setViewMode] = useState<"clinvar" | "custom">(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return (searchParams.get("viewMode") as "clinvar" | "custom") || "custom";
    }
    return "custom";
  });

  // Track if we've initialized to avoid syncing on mount
  const hasInitializedRef = useRef(false);

  // Sync filters and search to URL only when user changes them (not on initial mount)
  useEffect(() => {
    // Skip on initial mount
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    // Build URL params from current filters, search, and viewMode
    const params = new URLSearchParams();

    if (filters.clinvarClassifications.length > 0)
      params.set("clinvar", filters.clinvarClassifications.join(","));
    if (filters.acmgClassifications.length > 0)
      params.set("acmg", filters.acmgClassifications.join(","));
    if (filters.vepAnnotations.length > 0)
      params.set("vepAnnotations", filters.vepAnnotations.join(","));
    if (filters.mutationTypes.length > 0)
      params.set("mutationTypes", filters.mutationTypes.join(","));
    if (filters.afMin) params.set("afMin", String(filters.afMin));
    if (filters.afMax) params.set("afMax", String(filters.afMax));
    if (filters.caddMin) params.set("caddMin", String(filters.caddMin));
    if (filters.revelMin) params.set("revelMin", String(filters.revelMin));
    if (filters.revelMax) params.set("revelMax", String(filters.revelMax));
    if (searchQuery) params.set("search", searchQuery);
    if (viewMode) params.set("viewMode", viewMode);

    // Update URL without triggering re-render
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, searchQuery, viewMode, router]);

  // Initial data load - now incremental
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      if (!symbol) return;
      setIsLoading(true);
      setIsClinvarSyncing(true);

      await fetchClinVarVariants(symbol, (chunkedVariants, totalCount) => {
        if (isMounted) {
          setClinvarVariants(chunkedVariants);
          setClinvarTotal(totalCount);
          setIsLoading(false); // Stop main loading as soon as we have first chunk
        }
      });

      if (isMounted) {
        setIsClinvarSyncing(false);
        setIsLoading(false);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Lookup maps for O(1) cross-dataset access
  const customLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    dummyCustomVariants.forEach((cv: any) => {
      const key = normalizeCDNA(cv.cDNA_change);
      if (key) {
        map.set(key, {
          label: getLabelForPoints(cv.ACMG),
          condition: cv.condition,
          genomicID: cv.Genomic_ID,
          proteinChange: cv.Protein_change,
        });
      }
    });
    console.log(`Debug: customLookupMap created with ${map.size} entries.`);
    return map;
  }, []);

  const clinvarLookupMap = useMemo(() => {
    const map = new Map<string, any>();
    clinvarVariants.forEach((v) => {
      const key = normalizeCDNA(v.hgvsConsequence);
      if (key) {
        map.set(key, {
          classification: v.clinvarGermlineClassification,
          conditions: v.conditions,
          variationID: v.clinvarVariationID,
          genomicID: v.genomicID,
          transcript: v.transcript,
          id: v.id,
        });
      }
    });
    return map;
  }, [clinvarVariants]);

  const filteredAndSortedVariants = useMemo(() => {
    // Initial dataset based on view mode
    let result: Variant[] = [];

    if (viewMode === "clinvar") {
      result = clinvarVariants;
    } else {
      result = dummyCustomVariants
        .filter((v: any) => symbol?.toUpperCase() === "FGFR3")
        .map((cv: any) => {
          const genomicParts = (cv.Genomic_ID || "").split(":");
          return {
            id: cv.cDNA_change || "N/A",
            gene: symbol?.toUpperCase() || "FGFR3",
            disease: cv.condition || "Custom Analysis",
            chromosome: genomicParts[0] || "N/A",
            position: parseInt(genomicParts[1]) || 0,
            rsIDs: [],
            reference: genomicParts[2] || "N/A",
            alternate: genomicParts[3] || "N/A",
            transcript: "N/A",
            hgvsConsequence: cv.cDNA_change || "",
            proteinConsequence: cv.Protein_change || "",
            vepAnnotation: "missense_variant",
            clinvarGermlineClassification: "Custom",
            clinvarVariationID: "",
            alleleFrequency: parseFloat(cv["Allele Frequency"]) || 0,
            REVEL: parseFloat(cv.REVEL) || 0,
            Mutation_type: cv.Mutation_type,

            Functional: cv.Functional || "",
            Pvalue_functional: cv.Pvalue_functional || "",
            "Allele Count": cv["Allele Count"],
            "Allele Number": cv["Allele Number"],
            "Allele Frequency": cv["Allele Frequency"],
            condition: cv.condition,
            Genomic_ID: cv.Genomic_ID,
            Protein_change: cv.Protein_change,
            cDNA_change: cv.cDNA_change,
            sourceType: "custom" as const,
            conditions: cv.condition ? [cv.condition] : [],
            VEST4_score: cv.VEST4_score,
            MutPred_score: cv.MutPred_score,
            BayesDel_addAF_score: cv.BayesDel_addAF_score,
            ACMG: cv.ACMG,
            Meta_height: cv.Meta_height,
            Meta_height_SE: cv.Meta_height_SE,
            Meta_ratio: cv.Meta_ratio,
            Meta_ratio_SE: cv.Meta_ratio_SE,
            proteinPosition: getProteinPosition(cv.Protein_change),
            proteinDomain: getDomainInfo(getProteinPosition(cv.Protein_change))
              .domain,
            proteinSubdomain: getDomainInfo(
              getProteinPosition(cv.Protein_change),
            ).subdomain,
            acmgClassification: getLabelForPoints(cv.ACMG),
            clinvarClassification: clinvarLookupMap.get(
              normalizeCDNA(cv.cDNA_change),
            )?.classification,
            clinvarConditions: clinvarLookupMap.get(
              normalizeCDNA(cv.cDNA_change),
            )?.conditions,
            clinvarTranscript: clinvarLookupMap.get(
              normalizeCDNA(cv.cDNA_change),
            )?.transcript,
            clinvarVariant_ID: clinvarLookupMap.get(
              normalizeCDNA(cv.cDNA_change),
            )?.variationID,
            clinvarGenomicID: clinvarLookupMap.get(
              normalizeCDNA(cv.cDNA_change),
            )?.genomicID,
            myvariant_id: clinvarLookupMap.get(normalizeCDNA(cv.cDNA_change))
              ?.id,
          };
        });
      console.log("Debug: Finished mapping custom variants.");
    }

    if (viewMode === "clinvar") {
      result = result.map((v) => {
        const customMatch = customLookupMap.get(
          normalizeCDNA(v.hgvsConsequence),
        );
        if (customMatch) {
          console.log(
            `Debug: Matched ClinVar ${v.hgvsConsequence} to custom data.`,
          );
        }
        return {
          ...v,
          clinvarClassification: v.clinvarGermlineClassification,
          acmgClassification: customMatch?.label,
          customCondition: customMatch?.condition,
          customGenomicID: customMatch?.genomicID,
          customProteinChange: customMatch?.proteinChange,
        };
      });
    }

    // 2. Search Query - Based on selected searchField
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => {
        // cDNA matches
        const matchesCdna =
          (v.hgvsConsequence || "").toLowerCase().includes(q) ||
          (v.cdnaChanges || []).some((c) => c.toLowerCase().includes(q));

        // Genomic ID matches
        const matchesGenomic =
          (v.genomicID || "").toLowerCase().includes(q) ||
          (v.genomicIDs || []).some((g) => g.toLowerCase().includes(q)) ||
          (v as any).Genomic_ID?.toLowerCase().includes(q);

        // Protein matches
        const formattedProtein = formatProteinConsequence(
          v.proteinConsequence,
        ).toLowerCase();
        const matchesProtein =
          (v.proteinConsequence || "").toLowerCase().includes(q) ||
          formattedProtein.includes(q) ||
          (v.proteinChanges || []).some((p) => p.toLowerCase().includes(q));

        if (searchField === "all") {
          return matchesCdna || matchesGenomic || matchesProtein;
        }
        if (searchField === "cdna") return matchesCdna;
        if (searchField === "genomic") return matchesGenomic;
        if (searchField === "protein") return matchesProtein;
        return false;
      });
    }

    // 3. Classifications
    const getClassificationLabel = (p: string) => {
      const pts = parseFloat(p || "0");
      if (isNaN(pts)) return "Uncertain Significance";
      if (pts >= 10) return "Pathogenic";
      if (pts >= 6) return "Likely Pathogenic";
      if (pts >= -5) return "Uncertain Significance";
      if (pts >= -9) return "Likely Benign";
      return "Benign";
    };

    // 3a. ClinVar Classifications
    if (filters.clinvarClassifications.length > 0) {
      result = result.filter((v) => {
        const clinvarClassRaw = (
          v.clinvarGermlineClassification ||
          v.clinvarClassification ||
          ""
        ).toLowerCase();
        if (!clinvarClassRaw || clinvarClassRaw === "custom") return false;

        const individualClasses = clinvarClassRaw
          .split(" || ")
          .map((part) => part.split("(")[0].trim().toLowerCase());

        return filters.clinvarClassifications.some((f) => {
          const filterLower = f.toLowerCase();

          if (filterLower.includes("uncertain significance")) {
            return individualClasses.some(
              (cls) =>
                cls === "uncertain significance" ||
                cls === "vus" ||
                cls.includes("uncertain"),
            );
          }

          if (filterLower.includes("conflicting")) {
            return individualClasses.some((cls) => cls.includes("conflicting"));
          }

          return individualClasses.some((cls) => cls === filterLower);
        });
      });
    }

    // 3b. ACMG Classifications
    if (filters.acmgClassifications.length > 0) {
      result = result.filter((v) => {
        const acmgClass = (
          v.acmgClassification || getLabelForPoints(v.ACMG || "")
        ).toLowerCase();
        return filters.acmgClassifications.some(
          (f) => f.toLowerCase() === acmgClass.toLowerCase(),
        );
      });
    }

    // 4. Mutation Types
    if (filters.mutationTypes.length > 0) {
      result = result.filter(
        (v) =>
          v.Mutation_type && filters.mutationTypes.includes(v.Mutation_type),
      );
    }

    // 5. Protein Domains & Subdomains
    if (filters.proteinDomains.length > 0) {
      result = result.filter(
        (v) =>
          v.proteinDomain && filters.proteinDomains.includes(v.proteinDomain),
      );
    }
    if (filters.proteinSubdomains.length > 0) {
      result = result.filter(
        (v) =>
          v.proteinSubdomain &&
          filters.proteinSubdomains.includes(v.proteinSubdomain),
      );
    }

    // 5. Numeric Filters
    if (filters.afMin !== "")
      result = result.filter((v) => v.alleleFrequency >= Number(filters.afMin));
    if (filters.afMax !== "")
      result = result.filter((v) => v.alleleFrequency <= Number(filters.afMax));
    if (filters.revelMin !== "")
      result = result.filter(
        (v) => Number(v.REVEL) >= Number(filters.revelMin),
      );
    if (filters.revelMax !== "")
      result = result.filter(
        (v) => Number(v.REVEL) <= Number(filters.revelMax),
      );

    // 6. Sorting
    result = [...result].sort((a, b) => {
      const posA = extractCdnaNumber(a.hgvsConsequence || "");
      const posB = extractCdnaNumber(b.hgvsConsequence || "");

      if (posA === null) return 1;
      if (posB === null) return -1;

      return sortOption === "cdna-asc" ? posA - posB : posB - posA;
    });

    return result;
  }, [
    clinvarVariants,
    viewMode,
    symbol,
    filters,
    searchQuery,
    sortOption,
    searchField,
  ]);

  const classificationScatterData = useMemo(() => {
    return filteredAndSortedVariants
      .map((v) => {
        const x = extractPosition(v.proteinConsequence || v.hgvsConsequence);

        // Use different classification logic for ClinVar vs Custom
        const yValue =
          viewMode === "clinvar"
            ? getCategoryIndexFromClinvar(v.clinvarGermlineClassification)
            : getCategoryIndex(v.ACMG || "0");

        if (x === null) return null;

        const isHighlighted =
          searchQuery.trim() &&
          (v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (v.genomicID &&
              v.genomicID.toLowerCase().includes(searchQuery.toLowerCase())) ||
            v.proteinConsequence
              .toLowerCase()
              .includes(searchQuery.toLowerCase()));

        return {
          x,
          y: yValue,
          label: `Variant: ${
            v.proteinConsequence || v.id
          } <br>Classification: ${
            viewMode === "clinvar"
              ? v.clinvarGermlineClassification
              : getLabelForPoints(v.ACMG || "0")
          }`,
          color:
            viewMode === "clinvar"
              ? getColorForClinvarClassification(
                  v.clinvarGermlineClassification,
                )
              : getColorForPoints(v.ACMG || "0"),
          size: isHighlighted ? 12 : 8,
          symbol: isHighlighted ? "star" : "circle",
        } as ScatterDataPoint;
      })
      .filter((p): p is ScatterDataPoint => p !== null);
  }, [filteredAndSortedVariants, searchQuery, viewMode]);

  // Reset page when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, viewMode, symbol, pageSize]);

  const hasActiveFilters =
    filters.clinvarClassifications.length > 0 ||
    filters.acmgClassifications.length > 0 ||
    filters.vepAnnotations.length > 0 ||
    filters.mutationTypes.length > 0 ||
    filters.afMin !== "" ||
    filters.afMax !== "" ||
    filters.caddMin !== "" ||
    filters.revelMin !== "" ||
    filters.revelMax !== "" ||
    searchQuery.trim() !== "";

  const displayTotal =
    viewMode === "clinvar" && !hasActiveFilters
      ? clinvarTotal
      : filteredAndSortedVariants.length;

  const totalPages = Math.ceil(displayTotal / pageSize);
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    // For ClinVar, we use the raw filtered list which grows as we fetch more
    return filteredAndSortedVariants.slice(start, start + pageSize);
  }, [filteredAndSortedVariants, currentPage, pageSize]);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0f172a]">
      {/* Navbar */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Filters) - Fixed position with internal scroll */}
        <div
          className={`shrink-0 h-[calc(100vh-4rem)] overflow-hidden border-r border-gray-200 dark:border-scientific-border bg-white dark:bg-scientific-panel transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "w-72 lg:w-80" : "w-0 overflow-hidden"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>
        </div>

        {/* Main Content Area - Separate scroll */}
        <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)] relative bg-gray-50/50 dark:bg-scientific-bg/50">
          {/* Top Control Bar - Sticky within right section */}
          <div className="shrink-0 bg-white dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border p-4 sticky top-0 z-20">
            <div className="flex flex-wrap items-center gap-4">
              {/* Left Section - Toggle & Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1 cursor-pointer ring-primary-500 ring-2 rounded-md hover:bg-gray-100 dark:hover:bg-scientific-border text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 shrink-0"
                  aria-label="Toggle Filters"
                  title="Toggle Filters"
                >
                  {isSidebarOpen ? (
                    <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m15 19-7-7 7-7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-width="2"
                        d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"
                      />
                    </svg>
                  )}
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {symbol?.toUpperCase()} Variants
                </h1>
              </div>

              {/* Middle Section - View Mode & Table/Plots Toggle */}
              <div className="flex items-center gap-4 order-3 md:order-2 w-full md:w-auto mt-3 md:mt-0 md:flex-none">
                <div className="flex bg-gray-100 dark:bg-scientific-border p-1 rounded-lg shrink-0">
                  <button
                    onClick={() => setViewMode("custom")}
                    className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      viewMode === "custom"
                        ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => setViewMode("clinvar")}
                    className={`cursor-pointer px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      viewMode === "clinvar"
                        ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    ClinVar
                  </button>
                </div>

                <div className="inline-flex shrink-0">
                  <button
                    onClick={() => setMainView("table")}
                    className={`
                    whitespace-nowrap cursor-pointer flex items-center py-2 px-3 border-b-2 font-medium text-sm transition-all duration-200 mx-1 rounded-t-md
                    ${
                      mainView === "table"
                        ? "border-primary-500 text-primary-600 dark:text-scientific-accent dark:border-scientific-accent bg-primary-50 dark:bg-primary-900/20"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M4 8H20V5H4V8ZM14 19V10H10V19H14ZM16 19H20V10H16V19ZM8 19V10H4V19H8ZM3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z"></path>
                    </svg>
                    <span className="ml-1 hidden sm:inline">Table</span>
                  </button>
                  <button
                    onClick={() => setMainView("plots")}
                    className={`
                    whitespace-nowrap cursor-pointer flex items-center py-2 px-3 border-b-2 font-medium text-sm transition-all duration-200 mx-1 rounded-t-md
                    ${
                      mainView === "plots"
                        ? "border-primary-500 text-primary-600 dark:text-scientific-accent dark:border-scientific-accent bg-primary-50 dark:bg-primary-900/20"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    }
                  `}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z"></path>
                    </svg>
                    <span className="ml-1 hidden sm:inline">Plots</span>
                  </button>
                </div>
              </div>

              {/* Right Section - Search & Sort */}
              <div className="flex items-center gap-3 order-2 md:order-3 w-full md:w-auto mt-3 md:mt-0 md:flex-none">
                {isClinvarSyncing && (
                  <div className="flex items-center text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 sm:px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 animate-pulse whitespace-nowrap">
                    <div className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2 animate-bounce"></div>
                    Syncing ClinVar... ({clinvarVariants.length})
                  </div>
                )}
                <div className="relative flex-1 group max-w-xl flex gap-1">
                  <select
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value as any)}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  >
                    <option value="all">All Fields</option>
                    <option value="cdna">cDNA</option>
                    <option value="genomic">Genomic ID</option>
                    <option value="protein">Protein</option>
                  </select>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-gray-400 dark:text-gray-500 group-focus-within:text-primary-500 transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                      placeholder={`Search by ${
                        searchField === "all"
                          ? "Any Field"
                          : searchField === "cdna"
                            ? "cDNA"
                            : searchField === "genomic"
                              ? "Genomic ID"
                              : "Protein Change"
                      }...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center">
                  <select
                    id="sortOrder"
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(e.target.value as "cdna-asc" | "cdna-desc")
                    }
                    className="text-[14px] py-2 text-gray-600 w-[130px] border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary-500 transition-colors font-medium"
                  >
                    <option value="cdna-asc">Sort by: cDNA (Asc)</option>
                    <option value="cdna-desc">Sort by: cDNA (Desc)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Container - Scrollable independently */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fetching core ClinVar data for {symbol}...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {mainView === "plots" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="!p-0 !max-w-none shadow-sm relative overflow-hidden flex-1 w-full h-full min-h-[600px]">
                      {/* View Toggle */}
                      {viewMode === "custom" && (
                        <div className="flex inline-flex m-4">
                          <button
                            onClick={() => setChartView("scatter")}
                            className={`flex mx-1 cursor-pointer items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                              chartView === "scatter"
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm border border-primary-100 dark:border-primary-800"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                          >
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
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Scatter Distribution
                          </button>
                          <button
                            onClick={() => setChartView("bar")}
                            className={`flex mx-1 cursor-pointer items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                              chartView === "bar"
                                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm border border-primary-100 dark:border-primary-800"
                                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                          >
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
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                              />
                            </svg>
                            Composition Bar
                          </button>
                        </div>
                      )}
                      {chartView === "scatter" && viewMode === "custom" ? (
                        <ScatterPlot
                          data={classificationScatterData}
                          xLabel="Protein Position (AA)"
                          yLabel="ACMG Classification"
                          title="Variant Classification Showcase"
                          height="100%"
                          yTickVals={[0, 1, 2, 3, 4]}
                          yTickText={[
                            "Benign",
                            "Likely Benign",
                            "Uncertain Significance",
                            "Likely Pathogenic",
                            "Pathogenic",
                          ]}
                          viewMode={viewMode}
                        />
                      ) : (
                        <div className="p-4 h-full">
                          <ACMGDistribution
                            variants={filteredAndSortedVariants}
                            title="Classification Composition"
                            height="100%"
                            viewMode={viewMode}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mainView === "table" && (
                  <div className="flex flex-col h-full overflow-hidden">
                    {/* Table Header Controls - Fixed */}
                    <div className="shrink-0 bg-gray-50/50 dark:bg-scientific-bg/50">
                      <div className="shrink-0 flex flex-wrap items-center justify-between bg-white dark:bg-scientific-panel p-3 rounded-t-lg border border-gray-200 dark:border-scientific-border shadow-sm gap-4">
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing{" "}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {filteredAndSortedVariants.length > 0
                                ? (currentPage - 1) * pageSize + 1
                                : 0}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {Math.min(
                                currentPage * pageSize,
                                filteredAndSortedVariants.length,
                              )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {displayTotal}
                            </span>{" "}
                            variants
                          </div>

                          <div className="h-4 w-px bg-gray-200 dark:bg-scientific-border hidden sm:block"></div>

                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="pageSize"
                              className="text-xs text-gray-500 font-medium uppercase tracking-wider"
                            >
                              Rows:
                            </label>
                            <select
                              id="pageSize"
                              value={pageSize}
                              onChange={(e) =>
                                setPageSize(Number(e.target.value))
                              }
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              {[25, 50, 100, 500].map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <ColumnSelector
                            columns={
                              viewMode === "clinvar"
                                ? CLINVAR_COLUMNS
                                : CUSTOM_COLUMNS
                            }
                            visibleColumns={
                              viewMode === "clinvar"
                                ? visibleClinVarColumns
                                : visibleCustomColumns
                            }
                            onChange={
                              viewMode === "clinvar"
                                ? setVisibleClinVarColumns
                                : setVisibleCustomColumns
                            }
                            label="Select Columns"
                          />

                          <div className="flex items-center gap-2 sticky top-0 z-40">
                            <button
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                              className="p-1 px-3 rounded border border-gray-200 dark:border-scientific-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Previous
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-400 mx-1">
                              Page{" "}
                              <span className="font-semibold">
                                {currentPage}
                              </span>{" "}
                              of {totalPages || 1}
                            </span>
                            <button
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(totalPages, prev + 1),
                                )
                              }
                              disabled={
                                currentPage === totalPages || totalPages === 0
                              }
                              className="p-1 px-3 rounded border border-gray-200 dark:border-scientific-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Table Area */}
                    {viewMode === "clinvar" ? (
                      <VariantTable
                        variants={paginatedVariants}
                        visibleColumns={visibleClinVarColumns}
                        gene={symbol}
                      />
                    ) : (
                      <CustomVariantTable
                        variants={paginatedVariants as any}
                        visibleColumns={visibleCustomColumns}
                        gene={symbol}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-none w-full border-t border-gray-200 dark:border-scientific-border bg-white dark:bg-scientific-panel py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Biomarin Gene Variant Explorer.
          </p>
        </div>
      </footer>
    </div>
  );
}
