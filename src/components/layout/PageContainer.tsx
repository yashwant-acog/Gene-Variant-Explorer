import React from "react";

interface PageContainerProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}

export default function PageContainer({
    children,
    title,
    description,
    className = "",
}: PageContainerProps) {
    return (
        <div className={`container mx-auto px-4 py-8 max-w-7xl ${className}`}>
            {(title || description) && (
                <div className="mb-8 border-b border-gray-200 dark:border-scientific-border pb-6">
                    {title && (
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-3">
                            <span className="w-1.5 h-8 bg-primary-500 rounded-full inline-block"></span>
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className="bg-white dark:bg-scientific-panel rounded-xl shadow-sm border border-gray-200 dark:border-scientific-border overflow-hidden">
                {children}
            </div>
        </div>
    );
}
