import React, { useState, useRef, useEffect } from "react";

interface Column {
  key: string;
  label: string;
}

interface ColumnSelectorProps {
  columns: Column[];
  visibleColumns: string[];
  onChange: (visibleColumns: string[]) => void;
  label?: string;
}

export default function ColumnSelector({
  columns,
  visibleColumns,
  onChange,
  label = "Columns",
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      if (visibleColumns.length > 1) {
        onChange(visibleColumns.filter((k) => k !== key));
      }
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  const handleSelectAll = () => {
    onChange(columns.map((c) => c.key));
  };

  const handleReset = () => {
    // Reset to first 5 or all if less than 5
    onChange(columns.slice(0, 8).map((c) => c.key));
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-scientific-border rounded-md bg-white dark:bg-scientific-panel text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-scientific-panel/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-colors"
      >
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
          />
        </svg>
        {label}
        <span className="ml-1 px-1.5 py-0.5 bg-gray-100 dark:bg-scientific-header rounded-full text-[10px] text-gray-500 dark:text-gray-400">
          {visibleColumns.length}/{columns.length}
        </span>
        <svg
          className={`ml-1 h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-md bg-white dark:bg-scientific-panel shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100] border border-gray-200 dark:border-scientific-border">
          <div className="p-3 border-b border-gray-100 dark:border-scientific-border flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Visible Columns
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="text-[10px] text-primary-600 dark:text-scientific-accent hover:underline font-medium"
              >
                All
              </button>
              <button
                onClick={handleReset}
                className="text-[10px] text-gray-500 hover:underline font-medium"
              >
                Reset
              </button>
            </div>
          </div>
          <div className="p-2 max-h-80 overflow-y-auto grid grid-cols-1 gap-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="relative flex items-center px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-scientific-header transition-colors cursor-pointer group"
              >
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => handleToggle(col.key)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="ml-3 text-xs">
                  <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-scientific-accent">
                    {col.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
