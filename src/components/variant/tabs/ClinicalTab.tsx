import React from "react";
import { Variant } from "@/lib/types";
import Link from "next/link";

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

        <Link
          href={`https://gnomad.broadinstitute.org/variant/${variant.Genomic_ID?.replaceAll(":", "-")}?dataset=gnomad_r4`}
          target="_blank"
          className="mb-8 cursor-pointer flex inline-flex bg-primary-50 text-blue-700 dark:bg-primary-900/20 dark:text-primary-300 px-3 py-1.5 rounded-3xl text-sm font-medium border border-blue-400 dark:border-primary-800/30"
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
