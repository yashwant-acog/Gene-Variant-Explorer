"use client";

import { useMemo, useState, useEffect } from "react";
import { Variant } from "@/lib/types";
import AccordionSection from "./Accordion";

export interface FilterState {
  clinvarClassifications: string[];
  acmgClassifications: string[];
  vepAnnotations: string[];
  mutationTypes: string[];
  afMin: number | "";
  afMax: number | "";
  caddMin: number | "";
  revelMin: number | "";
  revelMax: number | "";
  proteinDomains: string[];
  proteinSubdomains: string[];
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export default function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  // Internal state for pending filters
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  // Sync pendingFilters with filters when filters change from outside (e.g. Reset All)
  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  const ClinvarClassifications = [
    "Pathogenic",
    "Likely Pathogenic",
    "Conflicting interpretations of pathogenicity",
    "Uncertain significance",
    "Likely Benign",
    "Benign",
    "other",
    "not provided",
  ];

  const ACMGClassifications = [
    "Pathogenic",
    "Likely Pathogenic",
    "Uncertain significance",
    "Likely Benign",
    "Benign",
  ];

  const ProteinDomains = [
    "Extracellular",
    "Transmembrane",
    "Cytoplasmic",
    "Other",
  ];
  const ProteinSubdomains = [
    "Ig-like C2-type 1",
    "Ig-like C2-type 2",
    "Ig-like C2-type 3",
    "Protein kinase",
    "None",
  ];

  const handleClinvarChange = (cls: string) => {
    setPendingFilters((prev) => {
      const isSelected = prev.clinvarClassifications.includes(cls);
      return {
        ...prev,
        clinvarClassifications: isSelected
          ? prev.clinvarClassifications.filter((c) => c !== cls)
          : [...prev.clinvarClassifications, cls],
      };
    });
  };

  const handleACMGChange = (cls: string) => {
    setPendingFilters((prev) => {
      const isSelected = prev.acmgClassifications.includes(cls);
      return {
        ...prev,
        acmgClassifications: isSelected
          ? prev.acmgClassifications.filter((c) => c !== cls)
          : [...prev.acmgClassifications, cls],
      };
    });
  };

  const handleDomainChange = (domain: string) => {
    setPendingFilters((prev) => {
      const isSelected = prev.proteinDomains.includes(domain);
      return {
        ...prev,
        proteinDomains: isSelected
          ? prev.proteinDomains.filter((d) => d !== domain)
          : [...prev.proteinDomains, domain],
      };
    });
  };

  const handleSubdomainChange = (subdomain: string) => {
    setPendingFilters((prev) => {
      const isSelected = prev.proteinSubdomains.includes(subdomain);
      return {
        ...prev,
        proteinSubdomains: isSelected
          ? prev.proteinSubdomains.filter((s) => s !== subdomain)
          : [...prev.proteinSubdomains, subdomain],
      };
    });
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
  };

  const resetFilters = () => {
    const initialFilters: FilterState = {
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
    setPendingFilters(initialFilters);
    setFilters(initialFilters);
  };

  const isDirty = JSON.stringify(pendingFilters) !== JSON.stringify(filters);

  return (
    <div className="w-full h-full bg-white dark:bg-scientific-panel border-r border-gray-200 dark:border-scientific-border flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-scientific-border sticky top-0 bg-white/90 dark:bg-scientific-panel/90 backdrop-blur z-30 flex justify-between items-center">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </h2>
        <button
          onClick={resetFilters}
          className="text-xs text-primary-600 dark:text-scientific-accent hover:underline"
        >
          Reset All
        </button>
      </div>

      <div className="px-4 py-1 mt-2">
        {/* ClinVar Classifications */}
        <AccordionSection title="ClinVar Classification" defaultOpen={true}>
          <div className="space-y-2 max-h-[300px] mb-2 overflow-y-auto pr-2 scrollbar-thin">
            {ClinvarClassifications.map((cls) => (
              <label
                key={cls}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={pendingFilters.clinvarClassifications.includes(cls)}
                  onChange={() => handleClinvarChange(cls)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors break-words w-full">
                  {cls}
                </span>
              </label>
            ))}
          </div>
        </AccordionSection>

        <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

        {/* ACMG Classifications */}
        <AccordionSection title="BMRN (ACMG) Classification" defaultOpen={true}>
          <div className="space-y-2 max-h-[300px] mb-2 overflow-y-auto pr-2 scrollbar-thin">
            {ACMGClassifications.map((cls) => (
              <label
                key={cls}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={pendingFilters.acmgClassifications.includes(cls)}
                  onChange={() => handleACMGChange(cls)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors break-words w-full">
                  {cls}
                </span>
              </label>
            ))}
          </div>
        </AccordionSection>

        <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

        {/* Protein Domains */}
        <AccordionSection title="Protein Domain" defaultOpen={true}>
          <div className="space-y-2 max-h-[300px] mb-2 overflow-y-auto pr-2 scrollbar-thin">
            {ProteinDomains.map((domain) => (
              <label
                key={domain}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={pendingFilters.proteinDomains.includes(domain)}
                  onChange={() => handleDomainChange(domain)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors break-words w-full">
                  {domain}
                </span>
              </label>
            ))}
          </div>
        </AccordionSection>

        <div className="my-2 border-t border-gray-100 dark:border-gray-800" />

        {/* Protein Subdomains */}
        <AccordionSection title="Protein Subdomain" defaultOpen={true}>
          <div className="space-y-2 max-h-[300px] mb-2 overflow-y-auto pr-2 scrollbar-thin">
            {ProteinSubdomains.map((subdomain) => (
              <label
                key={subdomain}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={pendingFilters.proteinSubdomains.includes(subdomain)}
                  onChange={() => handleSubdomainChange(subdomain)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors break-words w-full">
                  {subdomain === "None" ? "Other" : subdomain}
                </span>
              </label>
            ))}
          </div>
        </AccordionSection>
      </div>

      <>
        {/* <div className="px-4 py-1">
          <AccordionSection title="Numeric Scores" defaultOpen={true}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">
                  REVEL Score Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={pendingFilters.revelMin}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        revelMin: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="w-full text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={pendingFilters.revelMax}
                    onChange={(e) =>
                      setPendingFilters({
                        ...pendingFilters,
                        revelMax: e.target.value ? Number(e.target.value) : "",
                      })
                    }
                    className="w-full text-sm px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </div>
              </div>
            </div>
          </AccordionSection>
        </div> */}
      </>

      {/* Apply Filter Button - Sticky Bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-scientific-border bg-white/90 dark:bg-scientific-panel/90 backdrop-blur sticky bottom-0 z-50 mt-auto">
        <button
          onClick={applyFilters}
          disabled={!isDirty}
          className={`w-full py-2.5 px-4 rounded-md font-semibold text-sm transition-all shadow-sm ${
            isDirty
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-gray-100 dark:bg-scientific-border text-gray-400 cursor-not-allowed"
          }`}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
