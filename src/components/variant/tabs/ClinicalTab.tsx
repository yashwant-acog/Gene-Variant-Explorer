import React from "react";
import { Variant } from "@/lib/types";

interface ClinicalTabProps {
  variant: Variant;
}

// const dummyConditions = [
//   "Achondroplasia (ACH)",
//   "Camptodactyly-tall stature-scoliosis-hearing loss syndrome",
//   "Cervical cancer",
//   "Crouzon syndrome-acanthosis nigricans syndrome",
//   "Muenke syndrome (MNKES)",
//   "Thanatophoric dysplasia type 1 (TD1)",
//   "Thanatophoric dysplasia, type 2 (TD2)",
//   "Malignant tumor of urinary bladder",
//   "Hypochondroplasia (HCH)",
//   "Epidermal nevus,",
//   "Severe achondroplasia-developmental delay-acanthosis nigricans syndrome",
// ];

export default function ClinicalTab({ variant }: ClinicalTabProps) {
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

        {variant?.condition != "NA" ? (
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary-100 dark:border-primary-800/30">
              {variant?.condition}
            </span>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 italic">
            conditions not provided for these variant
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 dark:border-scientific-border pt-4">
          Detailed clinical evidence and phenotypic mapping sourced from ClinVar
          RCV records.
        </p>
      </div>
    </div>
  );
}
