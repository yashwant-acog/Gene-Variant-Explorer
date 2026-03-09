"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";

const SUGGESTED_GENES = ["FGFR3", "BRCA1", "TP53", "EGFR", "MYC"];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/gene/${query.trim().toUpperCase()}`);
    }
  };

  const handleSelect = (symbol: string) => {
    router.push(`/gene/${symbol}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-white dark:bg-scientific-bg px-4 py-12">
      <div className="max-w-3xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Precision <span className="text-primary-600 dark:text-scientific-accent">Genomics</span> Explorer
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            A comprehensive intelligence dashboard for exploring genetic variants, clinical consequences, and population frequencies across the human genome.
          </p>
        </div>

        {/* Search Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              autoFocus
              className="block w-full pl-12 pr-4 py-5 text-xl border border-gray-200 dark:border-scientific-border rounded-2xl bg-white dark:bg-scientific-panel text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 shadow-xl transition-all"
              placeholder="Search Gene (e.g. FGFR3, TP53)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-3 inset-y-3 bg-primary-600 hover:bg-primary-700 dark:bg-scientific-accent dark:hover:bg-scientific-accent/90 text-white px-8 rounded-xl font-bold transition-all shadow-md"
            >
              Analyze
            </button>
          </form>

          {/* Suggested Genes */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mr-2">Suggestions:</span>
            {SUGGESTED_GENES.map((gene) => (
              <button
                key={gene}
                onClick={() => handleSelect(gene)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${gene === "FGFR3"
                    ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-scientific-accent/10 dark:border-scientific-accent/30 dark:text-scientific-accent"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 dark:bg-scientific-panel dark:border-scientific-border dark:text-gray-400 dark:hover:text-scientific-accent"
                  }`}
              >
                {gene}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
          <div className="p-6 bg-white dark:bg-scientific-panel rounded-2xl border border-gray-100 dark:border-scientific-border shadow-sm text-left group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Population Metrics</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Detailed allele frequencies across global and specific populations from gnomAD.</p>
          </div>
          <div className="p-6 bg-white dark:bg-scientific-panel rounded-2xl border border-gray-100 dark:border-scientific-border shadow-sm text-left group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Predictive Scores</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Real-time visualization of CADD, REVEL, and SpliceAI scores for pathogenicity assessment.</p>
          </div>
          <div className="p-6 bg-white dark:bg-scientific-panel rounded-2xl border border-gray-100 dark:border-scientific-border shadow-sm text-left group hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Literature Evidence</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Curated associations between variants and phenotypic outcomes from peer-reviewed studies.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
