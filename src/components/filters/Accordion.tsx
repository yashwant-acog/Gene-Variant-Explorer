import { useState } from "react";

type AccordionSectionProps = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export default function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6 last:mb-0">
      <button
        className="flex w-full items-center justify-between py-1 text-left group focus:outline-none mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
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
      </button>
      <div
        className={`transition-all duration-300 ease-in-out origin-top overflow-hidden ${
          isOpen ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
