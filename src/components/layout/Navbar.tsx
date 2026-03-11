"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Ensure we start in light mode by removing 'dark' class if present
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="flex-none sticky top-0 z-50 w-full border-b border-gray-200 dark:border-scientific-border bg-white/80 dark:bg-scientific-panel/80 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-4 h-8 rounded-md bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm"></span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block tracking-tight">
              Biomarin Gene{" "}
              <span className="text-primary-600 dark:text-scientific-accent font-medium">
                Variant Explorer
              </span>
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-primary-600 dark:hover:text-scientific-accent transition-colors"
          >
            Dashboard
          </Link>
          <div className="h-4 w-px bg-gray-300 dark:bg-scientific-border"></div>
          {mounted && (
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-scientific-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Toggle Dark Mode"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 3.22a1 1 0 011.415 0l.708.707a1 1 0 01-1.414 1.415l-.708-.707a1 1 0 010-1.415zM16 10a1 1 0 011 1h1a1 1 0 110-2h-1a1 1 0 01-1 1zm-3.22 4.22a1 1 0 010 1.415l-.708.707a1 1 0 11-1.414-1.415l.708-.708a1 1 0 011.415 0zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4.22-3.22a1 1 0 01-1.415 0l-.708-.707a1 1 0 011.414-1.415l.708.707a1 1 0 010 1.415zM4 10a1 1 0 01-1-1H2a1 1 0 110 2h1a1 1 0 011-1zm3.22-4.22a1 1 0 010-1.415l.708-.707a1 1 0 011.414 1.415l-.708.707a1 1 0 01-1.414 0zM10 5a5 5 0 100 10 5 5 0 000-10z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
