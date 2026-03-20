"use client";

import React, { use, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import TabLayout from "@/components/layout/TabLayout";
import { dummyVariants, dummyCustomVariants } from "@/lib/dummyData";
import { Variant } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

import OverviewTab from "@/components/variant/tabs/OverviewTab";
import ClinicalTab from "@/components/variant/tabs/ClinicalTab";
import FunctionalTab from "@/components/variant/tabs/FunctionalTab";
import AnnotationTab from "@/components/variant/tabs/AnnotationTab";
import PopulationTab from "@/components/variant/tabs/PopulationTab";
import AssociationsTab from "@/components/variant/tabs/AssociationsTab";
import TherapeuticsTab from "@/components/variant/tabs/TherapeuticsTab";
import StructureTab from "@/components/variant/tabs/StructureTab";
import LiteratureTab from "@/components/variant/tabs/LiteratureTab";

interface Props {
  params: Promise<{ id: string }>;
}

export default function VariantPage({ params }: Props) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const cDNA = decodeURIComponent(resolvedParams.id);
  const genomicIdFromParam = searchParams.get("genomicId") || "";

  const router = useRouter();

  // State for ClinVar matched results
  const [clinvarMatches, setClinvarMatches] = useState<any[]>([]);
  const [isClinVarLoading, setIsClinVarLoading] = useState(true);

  // Use genomic ID from params instead of finding from customVariant
  const customVariant = dummyCustomVariants.find((v) => v.cDNA_change === cDNA);

  // Fetch ClinVar matches on mount
  useEffect(() => {
    async function fetchMatches() {
      // Use genomic ID from URL params, fallback to customVariant if not provided
      const genomicId = genomicIdFromParam || (customVariant?.Genomic_ID || "");
      const cdnaToMatch = cDNA;

      if (genomicId && cdnaToMatch) {
        setIsClinVarLoading(true);
        try {
          // Call our Next.js API route instead of ClinVar directly
          console.log("API called");
          const response = await fetch(
            `/api/clinvar/match?genomicId=${encodeURIComponent(
              genomicId
            )}&cdnaToMatch=${encodeURIComponent(cdnaToMatch)}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch ClinVar data");
          }
          const matches = await response.json();
          console.log("Matches found:", matches);
          if (matches && matches.length > 0) {
            setClinvarMatches(matches);
          }
        } catch (error) {
          console.error("Error fetching ClinVar matches:", error);
          setClinvarMatches([]);
        } finally {
          setIsClinVarLoading(false);
        }
      } else {
        setIsClinVarLoading(false);
      }
    }

    if (!cDNA) return;
    fetchMatches();
  }, [cDNA, genomicIdFromParam]);

  // Map to normalized shape for shared UI
  let variant: Variant;

  if (customVariant) {
    // Fallback for live ClinVar variants or unknown IDs
    const genomicParts = (customVariant.Genomic_ID || "").split(":");
    const parseSci = (val: string) => {
      if (!val || val.trim() === "NA" || val.trim() === "False") return 0;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    variant = {
      id: cDNA,
      gene: "FGFR3",
      disease:
        customVariant.condition && customVariant.condition !== "NA"
          ? customVariant.condition
          : "Custom Analysis",
      gnomAD_ID:
        customVariant.gnomAD && customVariant.gnomAD.trim() !== "NA"
          ? customVariant.gnomAD.trim()
          : "N/A",
      chromosome: genomicParts[0] || "N/A",
      position: parseInt(genomicParts[1]) || 0,
      rsIDs: [],
      reference: genomicParts[2] || "N/A",
      alternate: genomicParts[3] || "N/A",
      transcript: "N/A",
      hgvsConsequence: customVariant.cDNA_change || "",
      proteinConsequence: customVariant.Protein_change || "",
      vepAnnotation: "missense_variant",
      clinvarGermlineClassification: "Unknown", // Add later
      clinvarVariationID: "",
      alleleFrequency: parseSci(customVariant["Allele Frequency"]),
      cadd: Math.abs(parseSci(customVariant.Effect_height)),
      alleleCount: parseSci(customVariant["Allele Count"]),
      alleleNumber: parseSci(customVariant["Allele Number"]),

      alleleCountAfrican: parseSci(
        customVariant["Allele Count African/African American"]
      ),
      alleleNumberAfrican: parseSci(
        customVariant["Allele Number African/African American"]
      ),

      alleleCountAdmixedAmerican: parseSci(
        customVariant["Allele Count Admixed American"]
      ),
      alleleNumberAdmixedAmerican: parseSci(
        customVariant["Allele Number Admixed American"]
      ),

      alleleCountAshkenaziJewish: parseSci(
        customVariant["Allele Count Ashkenazi Jewish"]
      ),
      alleleNumberAshkenaziJewish: parseSci(
        customVariant["Allele Number Ashkenazi Jewish"]
      ),

      alleleCountEastAsian: parseSci(customVariant["Allele Count East Asian"]),
      alleleNumberEastAsian: parseSci(
        customVariant["Allele Number East Asian"]
      ),

      alleleCountEuropeanFinnish: parseSci(
        customVariant["Allele Count European (Finnish)"]
      ),
      alleleNumberEuropeanFinnish: parseSci(
        customVariant["Allele Number European (Finnish)"]
      ),

      alleleCountMiddleEastern: parseSci(
        customVariant["Allele Count Middle Eastern"]
      ),
      alleleNumberMiddleEastern: parseSci(
        customVariant["Allele Number Middle Eastern"]
      ),

      alleleCountEuropeanNonFinnish: parseSci(
        customVariant["Allele Count European (non-Finnish)"]
      ),
      alleleNumberEuropeanNonFinnish: parseSci(
        customVariant["Allele Number European (non-Finnish)"]
      ),

      alleleCountAmish: parseSci(customVariant["Allele Count Amish"]),
      alleleNumberAmish: parseSci(customVariant["Allele Number Amish"]),

      alleleCountSouthAsian: parseSci(
        customVariant["Allele Count South Asian"]
      ),
      alleleNumberSouthAsian: parseSci(
        customVariant["Allele Number South Asian"]
      ),

      sourceType: "custom",
      conditions:
        customVariant.condition && customVariant.condition !== "NA"
          ? [customVariant.condition]
          : [],
      Mutation_type: customVariant.Mutation_type,
      Points: customVariant?.Points,
      C_REVEL: customVariant?.C_REVEL,
      REVEL: customVariant?.REVEL,
      condition: customVariant?.condition,
      Genomic_ID: customVariant?.Genomic_ID,
      freq_background: parseSci(customVariant.freq_background),
      freq_DD: parseSci(customVariant.freq_DD),
      Effect_height: parseSci(customVariant.Effect_height),
      Pvalue_height: parseSci(customVariant.Pvalue_height),
      Effect_ratio: parseSci(customVariant.Effect_ratio),
      Pvalue_ratio: parseSci(customVariant.Pvalue_ratio),
      Functional: parseSci(customVariant.Functional),
      Pvalue_functional: parseSci(customVariant.Pvalue_functional),
      VEST4_score: customVariant.VEST4_score,
      MutPred_score: customVariant.MutPred_score,
      BayesDel_addAF_score: customVariant.BayesDel_addAF_score,
      ACMG: customVariant.ACMG,
      New_Functional: customVariant.New_Functional,
      New_Functional_Pvalue: customVariant.New_Functional_Pvalue,
      Meta_height: customVariant.Meta_height,
      Meta_height_SE: customVariant.Meta_height_SE,
      Meta_ratio: customVariant.Meta_ratio,
      Meta_ratio_SE: customVariant.Meta_ratio_SE,
    };
  } else {
    variant = {
      id: cDNA,
      gene: "FGFR3",
      disease: "ClinVar Live Data Entry",
      gnomAD_ID: cDNA,
      chromosome: "N/A",
      position: 0,
      rsIDs: cDNA.startsWith("rs") ? [cDNA] : [],
      reference: "N/A",
      alternate: "N/A",
      transcript: "N/A",
      hgvsConsequence: "N/A",
      proteinConsequence: "N/A",
      vepAnnotation: "missense_variant",
      clinvarGermlineClassification: "Uncertain significance",
      clinvarVariationID: "",
      alleleFrequency: 0,
      cadd: 0,
      REVEL: 0,
      alleleCount: 0,
      sourceType: "clinvar",
    };
  }

  // Calculate classification based on points
  const getClassificationByPoints = (pointsStr?: string) => {
    const pts = parseFloat(pointsStr || "0");
    if (isNaN(pts)) return "VUS";
    if (pts >= 10) return "Pathogenic";
    if (pts >= 6) return "Likely Pathogenic";
    if (pts >= -5) return "VUS";
    if (pts >= -9) return "Likely Benign";
    return "Benign";
  };

  const displayClassification = getClassificationByPoints(variant?.Points);

  // Generate color classes for Pathogenicity Badge matching Dashboard map
  const badgeColors =
    displayClassification === "Pathogenic" ||
    displayClassification === "Likely Pathogenic"
      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/10 dark:text-red-400 dark:border-red-400/20"
      : displayClassification === "VUS"
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20"
      : displayClassification.includes("Benign")
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/20"
      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";

  const annotationScatterData = [
    {
      x: 10,
      y: 0.2,
      label: "Background",
      color: "rgba(107, 114, 128, 0.3)",
      size: 6,
    },
    {
      x: 12,
      y: 0.1,
      label: "Background",
      color: "rgba(107, 114, 128, 0.3)",
      size: 6,
    },
    {
      x: 22,
      y: 0.6,
      label: "Background",
      color: "rgba(107, 114, 128, 0.3)",
      size: 6,
    },
    {
      x: 28,
      y: 0.8,
      label: "Background",
      color: "rgba(107, 114, 128, 0.3)",
      size: 6,
    },
    {
      x: 33,
      y: 0.95,
      label: "Background",
      color: "rgba(107, 114, 128, 0.3)",
      size: 6,
    },
    {
      x: variant.cadd,
      y: variant.REVEL,
      label: variant.gnomAD_ID,
      color: "#ef4444",
      size: 12,
      symbol: "star",
    },
  ];

  // Seeded random for consistent dummy data per variant
  const getSeededRandom = (seed: string) => {
    let h = 0;
    for (let i = 0; i < seed.length; i++)
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    return () => {
      h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
  };

  const popDefinitions = useMemo(
    () => [
      {
        name: "African / Af. Am.",
        countField: "Allele Count African/African American",
        numField: "Allele Number African/African American",
      },
      {
        name: "Admixed American",
        countField: "Allele Count Admixed American",
        numField: "Allele Number Admixed American",
      },
      {
        name: "Ashkenazi Jewish",
        countField: "Allele Count Ashkenazi Jewish",
        numField: "Allele Number Ashkenazi Jewish",
      },
      {
        name: "East Asian",
        countField: "Allele Count East Asian",
        numField: "Allele Number East Asian",
      },
      {
        name: "European (Finnish)",
        countField: "Allele Count European (Finnish)",
        numField: "Allele Number European (Finnish)",
      },
      {
        name: "European (Non-Fi)",
        countField: "Allele Count European (non-Finnish)",
        numField: "Allele Number European (non-Finnish)",
      },
      {
        name: "Middle Eastern",
        countField: "Allele Count Middle Eastern",
        numField: "Allele Number Middle Eastern",
      },
      {
        name: "South Asian",
        countField: "Allele Count South Asian",
        numField: "Allele Number South Asian",
      },
      {
        name: "Amish",
        countField: "Allele Count Amish",
        numField: "Allele Number Amish",
      },
    ],
    []
  );

  const popDistributions = useMemo(() => {
    const freqs: Record<string, number[]> = {};
    const counts: Record<string, number[]> = {};
    popDefinitions.forEach((p) => {
      freqs[p.name] = [];
      counts[p.name] = [];
    });

    dummyCustomVariants.forEach((v) => {
      popDefinitions.forEach((p) => {
        const c = parseFloat(v[p.countField as keyof typeof v] as string);
        const n = parseFloat(v[p.numField as keyof typeof v] as string);
        if (!isNaN(c) && c > 0) {
          counts[p.name].push(c);
          if (!isNaN(n) && n > 0) {
            const freq = c / n;
            freqs[p.name].push(freq);
          }
        }
      });
    });
    return { freqs, counts };
  }, [popDefinitions]);

  const associationStudies = [
    { name: "UK Biobank GWAS", oddsRatio: 1.2, ciLower: 1.05, ciUpper: 1.35 },
    { name: "FinnGen Cons.", oddsRatio: 0.95, ciLower: 0.8, ciUpper: 1.1 },
    { name: "All of Us", oddsRatio: 1.4, ciLower: 1.1, ciUpper: 1.8 },
    {
      name: "Meta-Analysis",
      oddsRatio: 1.15,
      ciLower: 1.02,
      ciUpper: 1.28,
      color: "#ef4444",
    },
  ];

  const [activeTabId, setActiveTabId] = useState("overview");

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      content: (
        <OverviewTab
          variant={variant}
          clinvarMatches={clinvarMatches}
          isLoading={isClinVarLoading}
        />
      ),
    },
    {
      id: "clinical",
      label: "Clinical",
      content: (
        <ClinicalTab
          variant={variant}
          clinvarMatches={clinvarMatches}
          isLoading={isClinVarLoading}
        />
      ),
    },
    {
      id: "functional",
      label: "Functional",
      content: (
        <FunctionalTab variant={variant} isCustom={customVariant !== null} />
      ),
    },
    {
      id: "annotation",
      label: "Annotation",
      content: (
        <AnnotationTab variant={variant} isCustom={customVariant !== null} />
      ),
    },
    {
      id: "population",
      label: "Population",
      content: (
        <PopulationTab variant={variant} popDistributions={popDistributions} />
      ),
    },
    {
      id: "associations",
      label: "Associations",
      content: <AssociationsTab variant={variant} />,
    },
    // {
    //   id: "therapeutics",
    //   label: "Therapeutics",
    //   content: <TherapeuticsTab />,
    // },
    // {
    //   id: "structure",
    //   label: "3D Structure",
    //   content: <StructureTab />,
    // },
    // {
    //   id: "literature",
    //   label: "Literature",
    //   content: <LiteratureTab />,
    // },
  ];

  const handleTabChange = (id: string) => {
    setActiveTabId(id);
  };

  const activeTabContent =
    tabs.find((t) => t.id === activeTabId)?.content || tabs[0].content;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-scientific-bg">
      {/* Rich Header Section - Sticky */}
      <div className="bg-white dark:bg-scientific-panel border-b border-gray-200 dark:border-scientific-border pt-6 pb-0 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            {/* Left Side: Back Button + Variant ID + Classification */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-scientific-accent transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                {variant.id}
              </h1>
              <span
                className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-full border ${badgeColors}`}
              >
                {displayClassification}
              </span>
              <Link
                href={`https://gnomad.broadinstitute.org/variant/${variant.Genomic_ID?.replaceAll(
                  ":",
                  "-"
                )}?dataset=gnomad_r4`}
                target="_blank"
                className="cursor-pointer flex inline-flex bg-primary-50 text-blue-700 dark:bg-primary-900/20 dark:text-primary-300 px-3 py-1.5 rounded-3xl text-sm font-medium border border-blue-400 dark:border-primary-800/30"
              >
                <span className="">gnoMAD</span>
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
              {/* <div>
                {variant.proteinConsequence}
              </div> */}
            </div>

            {/* Right Side: Tabs */}
            <div className="w-full md:w-auto">
              <TabLayout
                tabs={tabs}
                defaultActiveId={activeTabId}
                onTabChange={handleTabChange}
                showContent={false}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="container mx-auto px-4 max-w-7xl py-6 flex-1">
        {activeTabContent}
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
