import React from "react";

export default function StructureTab() {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-scientific-panel/30 border border-dashed border-gray-200 dark:border-scientific-border rounded-xl">
      <svg
        className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <p className="text-lg font-medium">
        Structural mapping data not yet loaded.
      </p>
      <p className="text-sm mt-1">
        AlphaFold or PDB 3D protein structures will appear here.
      </p>
    </div>
  );
}
