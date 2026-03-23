import React from "react";
import { Variant } from "@/lib/types";
import Link from "next/link";

interface ClinicalTabProps {
  variant: Variant;
  clinvarMatches?: any[];
  isLoading?: boolean;
}

export default function ClinicalTab({
  variant,
  clinvarMatches,
  isLoading = false,
}: ClinicalTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-scientific-panel p-6 rounded-xl border border-gray-200 dark:border-scientific-border shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Associated Conditions
        </h3>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Fetching clinical data...
            </p>
          </div>
        ) : (
          <>
            {/* Two-column layout for conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Additional Conditions */}
              {variant?.condition != "NA" && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                    Additional Conditions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-100 dark:border-primary-800/30">
                      {variant?.condition}
                    </span>
                  </div>
                </div>
              )}

              {/* Right Column - ClinVar Database Matches */}
              {clinvarMatches && clinvarMatches.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                    ClinVar Database Matches
                  </h4>

                  {clinvarMatches.map((match, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <Link
                        href={`https://www.ncbi.nlm.nih.gov/clinvar/variation/${match.variationID}/`}
                        target="_blank"
                        className="flex inline-flex text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 mb-2 bg-primary-50 dark:bg-primary-900/20 inline-block px-2 py-1 rounded"
                      >
                        Variation ID: {match.variationID}
                        <div className="h-4 w-4 ml-1 cursor-pointer">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"></path>
                          </svg>
                        </div>
                      </Link>

                      {match.conditions && match.conditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {match.conditions.map(
                            (condition: string, condIndex: number) => (
                              <span
                                key={condIndex}
                                className="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-100 dark:border-primary-800/30"
                              >
                                {condition}
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No conditions associated with this variation
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* No data state */}
            {(!clinvarMatches || clinvarMatches.length === 0) &&
            variant?.condition === "NA" ? (
              <div className="text-center py-8 text-gray-500 italic">
                No conditions provided for this variant
              </div>
            ) : null}
          </>
        )}

        <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 dark:border-scientific-border pt-4">
          Detailed clinical evidence and phenotypic mapping sourced from ClinVar
          RCV records.
        </p>
      </div>
    </div>
  );
}
