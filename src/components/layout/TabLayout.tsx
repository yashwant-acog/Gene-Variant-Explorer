"use client";

import { useState } from "react";
import { TabItem } from "@/lib/types";

interface TabLayoutProps {
    tabs: TabItem[];
    defaultActiveId?: string;
    onTabChange?: (id: string) => void;
    className?: string;
    showContent?: boolean; // New prop to control content rendering
}

export default function TabLayout({
    tabs,
    defaultActiveId,
    onTabChange,
    className = "",
    showContent = true, // Default to true for backward compatibility
}: TabLayoutProps) {
    const [activeId, setActiveId] = useState(defaultActiveId || tabs[0]?.id);

    const handleTabClick = (id: string) => {
        setActiveId(id);
        if (onTabChange) {
            onTabChange(id);
        }
    };

    const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

    return (
        <div className={`flex flex-col w-full ${className}`}>
            <div className="border-b border-gray-200 dark:border-scientific-border px-4">
                <nav className="-mb-px flex space-x-8 overflow-x-auto scroolbar-hide" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeId;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`
                  whitespace-nowrap flex py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                  ${isActive
                                        ? "border-primary-500 text-primary-600 dark:text-scientific-accent dark:border-scientific-accent"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                                    }
                `}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
            {showContent && <div className="p-6">{activeTab?.content}</div>}
        </div>
    );
}
