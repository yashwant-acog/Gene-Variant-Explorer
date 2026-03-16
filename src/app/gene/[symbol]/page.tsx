"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import FilterPanel, { FilterState } from "@/components/filters/FilterPanel";
import VariantTable from "@/components/tables/VariantTable";
import CustomVariantTable from "@/components/tables/CustomVariantTable";
import LollipopPlot from "@/components/charts/LollipopPlot";
import ScatterPlot, { ScatterDataPoint } from "@/components/charts/ScatterPlot";
import ACMGDistribution from "@/components/charts/ACMGDistribution";
import { dummyCustomVariants } from "@/lib/dummyData";
import { fetchClinVarVariants } from "@/lib/api";
import { Variant } from "@/lib/types";
import ColumnSelector from "@/components/tables/ColumnSelector";
import { CLINVAR_COLUMNS } from "@/components/tables/VariantTable";
import { CUSTOM_COLUMNS } from "@/components/tables/CustomVariantTable";
import Navbar from "@/components/layout/Navbar";

type SortOption =
  | "af-desc"
  | "af-asc"
  | "cadd-desc"
  | "revel-desc"
  | "id-asc"
  | "points-desc"
  | "points-asc";

// Helper to extract numeric position from proteinConsequence (e.g., "p.Gly380Arg" -> 380)
const extractPosition = (proteinConsequence: string): number | null => {
  if (!proteinConsequence) return null;
  const match = proteinConsequence.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const getColorForPoints = (points?: string) => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "#9ca3af"; // Gray

  if (pts >= 10) return "#ef4444"; // Pathogenic: Red
  if (pts >= 6) return "#f97316"; // Likely Pathogenic: Orange
  if (pts >= -5) return "#eab308"; // VUS: Yellow
  if (pts >= -9) return "#34d399"; // Likely Benign: Light Emerald
  return "#10b981"; // Benign: Emerald
};

const getCategoryIndex = (points?: string): number => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return 2; // Default to VUS

  if (pts >= 10) return 4; // Pathogenic
  if (pts >= 6) return 3; // Likely Pathogenic
  if (pts >= -5) return 2; // VUS
  if (pts >= -9) return 1; // Likely Benign
  return 0; // Benign
};

const getLabelForPoints = (points?: string): string => {
  const pts = parseFloat(points || "0");
  if (isNaN(pts)) return "VUS";

  if (pts >= 10) return "Pathogenic";
  if (pts >= 6) return "Likely Pathogenic";
  if (pts >= -5) return "VUS";
  if (pts >= -9) return "Likely Benign";
  return "Benign";
};

export default function GeneDashboard() {
  const params = useParams();
  const symbol = params?.symbol as string;
  const router = useRouter();

  // Remove useSearchParams to prevent re-renders - read URL directly on mount only
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<"table" | "plots">("table");
  const [chartView, setChartView] = useState<"scatter" | "bar">("scatter");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("id-asc");
  const [viewMode, setViewMode] = useState<"clinvar" | "custom">("custom");
  const [clinvarVariants, setClinvarVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleClinVarColumns, setVisibleClinVarColumns] = useState<string[]>(
    CLINVAR_COLUMNS.map((col) => col.key)
  );
  const [visibleCustomColumns, setVisibleCustomColumns] = useState<string[]>([
    "cDNA_change",
    "Genomic_ID",
    "Protein_change",
    "Mutation_type",
    "clinvar",
    "gnomad",
  ]);

  // Initialize filters from URL ONCE on mount using lazy initialization
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return {
        classifications:
          searchParams.get("classifications")?.split(",").filter(Boolean) || [],
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
      };
    }
    return {
      classifications: [],
      vepAnnotations: [],
      mutationTypes: [],
      afMin: "",
      afMax: "",
      caddMin: "",
      revelMin: "",
      revelMax: "",
    };
  });

  // Track if we've initialized to avoid syncing on mount
  const hasInitializedRef = useRef(false);

  // Sync filters to URL only when user changes them (not on initial mount)
  useEffect(() => {
    // Skip on initial mount
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      return;
    }

    // Build URL params from current filters
    const params = new URLSearchParams();

    if (filters.classifications.length > 0)
      params.set("classifications", filters.classifications.join(","));
    if (filters.vepAnnotations.length > 0)
      params.set("vepAnnotations", filters.vepAnnotations.join(","));
    if (filters.mutationTypes.length > 0)
      params.set("mutationTypes", filters.mutationTypes.join(","));
    if (filters.afMin) params.set("afMin", String(filters.afMin));
    if (filters.afMax) params.set("afMax", String(filters.afMax));
    if (filters.caddMin) params.set("caddMin", String(filters.caddMin));
    if (filters.revelMin) params.set("revelMin", String(filters.revelMin));
    if (filters.revelMax) params.set("revelMax", String(filters.revelMax));

    // Update URL without triggering re-render
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const data = await fetchClinVarVariants(symbol);
      if (isMounted) {
        setClinvarVariants(data);
        setIsLoading(false);
      }
    }
    if (symbol) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  const filteredAndSortedVariants = useMemo(() => {
    // Initial dataset based on view mode
    let result: Variant[] = [];

    if (viewMode === "clinvar") {
      result = clinvarVariants;
    } else {
      result = dummyCustomVariants
        .filter((v) => symbol?.toUpperCase() === "FGFR3")
        .map((cv) => {
          const genomicParts = (cv.Genomic_ID || "").split(":");
          return {
            id: cv.cDNA_change || "N/A",
            gene: symbol?.toUpperCase() || "FGFR3",
            disease: cv.condition || "Custom Analysis",
            gnomAD_ID: cv.gnomAD || "",
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
            cadd: Math.abs(parseFloat(cv.Effect_height) || 0),
            REVEL: parseFloat(cv.REVEL) || 0,
            Mutation_type: cv.Mutation_type,
            C_REVEL: cv.C_REVEL,
            Points: cv.Points,
            Functional: parseFloat(cv.Functional) || 0,
            Pvalue_functional: parseFloat(cv.Pvalue_functional) || 0,
            FDR_functional: cv.FDR_functional,
            Effect_height: parseFloat(cv.Effect_height) || 0,
            Pvalue_height: parseFloat(cv.Pvalue_height) || 0,
            FDR_height: cv.FDR_height,
            Count_height: parseFloat(cv.Count_height) || 0,
            Effect_ratio: parseFloat(cv.Effect_ratio) || 0,
            Pvalue_ratio: parseFloat(cv.Pvalue_ratio) || 0,
            FDR_ratio: cv.FDR_ratio,
            Count_ratio: parseFloat(cv.Count_ratio) || 0,
            DD_enrich: parseFloat(cv.DD_enrich) || 0,
            Pvalue_DD: parseFloat(cv.Pvalue_DD) || 0,
            FDR_DD: cv.FDR_DD,
            Count_DD: parseFloat(cv.Count_DD) || 0,
            freq_background: parseFloat(cv.freq_background) || 0,
            freq_DD: parseFloat(cv.freq_DD) || 0,
            "Allele Count": cv["Allele Count"],
            "Allele Number": cv["Allele Number"],
            "Allele Frequency": cv["Allele Frequency"],
            condition: cv.condition,
            Genomic_ID: cv.Genomic_ID,
            Protein_change: cv.Protein_change,
            cDNA_change: cv.cDNA_change,
            sourceType: "custom" as const,
            conditions: cv.condition ? [cv.condition] : [],
          };
        });
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.gnomAD_ID.toLowerCase().includes(q) ||
          (v.id && v.id.toLowerCase().includes(q)) ||
          v.proteinConsequence.toLowerCase().includes(q)
      );
    }

    // 3. Classifications
    const getClassificationLabel = (p: string) => {
      const pts = parseFloat(p || "0");
      if (isNaN(pts)) return "VUS";
      if (pts >= 10) return "Pathogenic";
      if (pts >= 6) return "Likely Pathogenic";
      if (pts >= -5) return "VUS";
      if (pts >= -9) return "Likely Benign";
      return "Benign";
    };

    if (filters.classifications.length > 0) {
      result = result.filter((v) => {
        if (v.sourceType === "custom") {
          const calculatedClass = getClassificationLabel(v.Points || "");
          return filters.classifications.includes(calculatedClass);
        }
        return filters.classifications.includes(
          v.clinvarGermlineClassification
        );
      });
    }

    // 4. Mutation Types
    if (filters.mutationTypes.length > 0) {
      result = result.filter(
        (v) =>
          v.Mutation_type && filters.mutationTypes.includes(v.Mutation_type)
      );
    }

    // 5. Numeric Filters
    if (filters.afMin !== "")
      result = result.filter((v) => v.alleleFrequency >= Number(filters.afMin));
    if (filters.afMax !== "")
      result = result.filter((v) => v.alleleFrequency <= Number(filters.afMax));
    if (filters.caddMin !== "")
      result = result.filter((v) => v.cadd >= Number(filters.caddMin));
    if (filters.revelMin !== "")
      result = result.filter(
        (v) => Number(v.REVEL) >= Number(filters.revelMin)
      );
    if (filters.revelMax !== "")
      result = result.filter(
        (v) => Number(v.REVEL) <= Number(filters.revelMax)
      );

    // 6. Sorting
    result = [...result].sort((a, b) => {
      switch (sortOption) {
        case "af-desc":
          return b.alleleFrequency - a.alleleFrequency;
        case "af-asc":
          return a.alleleFrequency - b.alleleFrequency;
        case "cadd-desc":
          return b.cadd - a.cadd;
        case "revel-desc":
          return Number(b.REVEL) - Number(a.REVEL);
        case "points-desc":
          return parseFloat(b.Points || "0") - parseFloat(a.Points || "0");
        case "points-asc":
          return parseFloat(a.Points || "0") - parseFloat(b.Points || "0");
        case "id-asc":
        default:
          return (a.gnomAD_ID || "").localeCompare(b.gnomAD_ID || "");
      }
    });

    return result;
  }, [clinvarVariants, viewMode, symbol, filters, searchQuery, sortOption]);

  const classificationScatterData = useMemo(() => {
    return filteredAndSortedVariants
      .map((v) => {
        const x = extractPosition(v.proteinConsequence || v.hgvsConsequence);
        const yValue = getCategoryIndex(v.Points || "0");
        if (x === null) return null;

        const isHighlighted =
          searchQuery.trim() &&
          (v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.gnomAD_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.proteinConsequence
              .toLowerCase()
              .includes(searchQuery.toLowerCase()));

        return {
          x,
          y: yValue,
          label: `Variant: ${v.proteinConsequence || v.id} <br>Points: ${
            v.Points || "0"
          }`,
          color: getColorForPoints(v.Points || "0"),
          size: isHighlighted ? 12 : 8,
          symbol: isHighlighted ? "star" : "circle",
        } as ScatterDataPoint;
      })
      .filter((p): p is ScatterDataPoint => p !== null);
  }, [filteredAndSortedVariants, searchQuery]);

  // Reset page when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortOption, viewMode, symbol, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedVariants.length / pageSize);
  const paginatedVariants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
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
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              availableData={viewMode === "clinvar" ? clinvarVariants : []}
            />
          </div>
        </div>

        {/* Main Content Area - Separate scroll */}
        <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)] relative bg-gray-50/50 dark:bg-scientific-bg/50">
          {/* Top Control Bar - Sticky within right section */}
          <div className="shrink-0 bg-white dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border p-4 flex items-center justify-between gap-4 sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1 cursor-pointer ring-primary-500 ring-2 rounded-md hover:bg-gray-100 dark:hover:bg-scientific-border text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <>
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
                  </>
                )}
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">
                {symbol?.toUpperCase()} Variants Directory
              </h1>
            </div>

            <div className="flex bg-gray-100 dark:bg-scientific-border p-1 rounded-lg">
              <button
                onClick={() => setViewMode("clinvar")}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  viewMode === "clinvar"
                    ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                ClinVar
              </button>
              <button
                onClick={() => setViewMode("custom")}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  viewMode === "custom"
                    ? "bg-white dark:bg-scientific-panel shadow-sm text-primary-600 dark:text-scientific-accent"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                Custom
              </button>
            </div>

            <div className="flex justify-center flex-none mb-1 ml-6">
              <div className="inline-flex">
                <button
                  onClick={() => setMainView("table")}
                  className={`
                  whitespace-nowrap cursor-pointer flex py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 mx-1
                  ${
                    mainView === "table"
                      ? "border-primary-500 text-primary-600 dark:text-scientific-accent dark:border-scientific-accent"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }
                `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4 8H20V5H4V8ZM14 19V10H10V19H14ZM16 19H20V10H16V19ZM8 19V10H4V19H8ZM3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3Z"></path>
                  </svg>
                  <span className="ml-1">Table</span>
                </button>
                <button
                  onClick={() => setMainView("plots")}
                  className={`
                  whitespace-nowrap cursor-pointer flex py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 mx-1
                  ${
                    mainView === "plots"
                      ? "border-primary-500 text-primary-600 dark:text-scientific-accent dark:border-scientific-accent"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  }
                `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5 3V19H21V21H3V3H5ZM20.2929 6.29289L21.7071 7.70711L16 13.4142L13 10.415L8.70711 14.7071L7.29289 13.2929L13 7.58579L16 10.585L20.2929 6.29289Z"></path>
                  </svg>
                  <span className="ml-1">Plots</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 w-20 justify-end">
              {/* Search Input */}
              <div className="relative w-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
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
                  placeholder="Search cDNA or Protein..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="block w-20 pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer transition-colors"
                >
                  <option value="id-asc">Sort: ID (A-Z)</option>
                  <option value="points-desc">Sort: Highest Points</option>
                  <option value="points-asc">Sort: Lowest Points</option>
                  <option value="af-desc">Sort: Highest AF</option>
                  <option value="af-asc">Sort: Lowest AF</option>
                  <option value="cadd-desc">Sort: Highest CADD</option>
                  <option value="revel-desc">Sort: Highest REVEL</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg
                    className="h-4 w-4"
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
                </div>
              </div>
            </div>
          </div>

          {/* Content Container - Scrollable independently */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col gap-6">
            {isLoading && viewMode === "clinvar" ? (
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
                      {chartView === "scatter" ? (
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
                            "VUS",
                            "Likely Pathogenic",
                            "Pathogenic",
                          ]}
                        />
                      ) : (
                        <div className="p-4 h-full">
                          <ACMGDistribution
                            variants={filteredAndSortedVariants}
                            title="ACMG Aggregate Composition"
                            height="100%"
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
                                filteredAndSortedVariants.length
                              )}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {filteredAndSortedVariants.length}
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
                                  Math.min(totalPages, prev + 1)
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
                      />
                    ) : (
                      <CustomVariantTable
                        variants={paginatedVariants as any}
                        visibleColumns={visibleCustomColumns}
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
