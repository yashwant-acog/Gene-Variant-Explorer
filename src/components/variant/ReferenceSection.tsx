import React, { useState, useEffect, useRef } from "react";

interface ReferenceSectionProps {
  title: string;
  references?: string;
  type?: "clinical" | "functional" | "annotation" | "association";
}

export default function ReferenceSection({
  title,
  references,
}: ReferenceSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check for various ways a reference might be considered "missing"
  if (
    !references ||
    references === "NA" ||
    references === "N/A" ||
    references === "null" ||
    references === "undefined" ||
    references.trim() === ""
  ) {
    return null;
  }

  // Split by newline OR comma
  const refList = references
    .split(/[\n\r,]+/)
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  if (refList.length === 0) return null;

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Reference Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="shrink-0 p-2 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 hover:text-primary-500 rounded-lg transition-all border border-gray-100 dark:border-gray-700/50 group z-10 shadow-sm"
        title="View References"
      >
        <svg
          className="w-5 h-5 transition-transform group-hover:scale-110"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="bg-white dark:bg-scientific-panel w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-scientific-border overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-scientific-border flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {title}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l18 18"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {refList.map((ref, idx) => {
                  const isUrl =
                    ref.startsWith("http://") ||
                    ref.startsWith("https://") ||
                    ref.includes("www.");
                  const finalHref = ref.startsWith("www.")
                    ? `https://${ref}`
                    : ref;

                  return (
                    <div key={idx} className="flex flex-col">
                      {isUrl ? (
                        <a
                          href={finalHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group shadow-sm"
                        >
                          <span className="truncate pr-4">{ref}</span>
                          <svg
                            className="w-4 h-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6V8H5V19H16V14H18V20C18 20.5523 17.5523 21 17 21H4C3.44772 21 3 20.5523 3 20V7C3 6.44772 3.44772 6 4 6H10ZM21 3V11H19L18.9999 6.413L11.2071 14.2071L9.79289 12.7929L17.5849 5H13V3H21Z"
                            />
                          </svg>
                        </a>
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-750 rounded-xl text-sm font-medium">
                          {ref}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-scientific-border bg-gray-50/30 dark:bg-black/10 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
