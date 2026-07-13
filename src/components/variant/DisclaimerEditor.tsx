"use client";

import React, { useState, useEffect } from "react";

interface DisclaimerEditorProps {
  gene: string;
  tab: string;
}

export default function DisclaimerEditor({ gene, tab }: DisclaimerEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [savedText, setSavedText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDisclaimer() {
      try {
        const res = await fetch(`/api/disclaimers/${gene}`);
        if (res.ok) {
          const data = await res.json();
          if (data[tab]) {
            setText(data[tab]);
            setSavedText(data[tab]);
          }
        }
      } catch (e) {
        console.error("Error fetching disclaimers:", e);
      } finally {
        setLoading(false);
      }
    }
    if (gene) {
      fetchDisclaimer();
    }
  }, [gene, tab]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/disclaimers/${gene}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tab, disclaimer: text }),
      });
      if (res.ok) {
        setSavedText(text);
        setIsEditing(false);
      }
    } catch (e) {
      console.error("Error saving disclaimer:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setText(savedText);
    setIsEditing(false);
  };

  if (loading) return null;

  return (
    <div className="mb-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 relative transition-all">
      {/* Edit button — always visible */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2.5 right-2.5 p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          title="Edit Note"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      )}

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a note or disclaimer for this tab..."
            className="w-full text-sm p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 focus:outline-none min-h-[72px] resize-y"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-xs font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : savedText ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pr-8 whitespace-pre-wrap">
          {savedText}
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Click the edit icon to add a note for this tab.
        </p>
      )}
    </div>
  );
}
