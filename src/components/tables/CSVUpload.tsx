import React, { useState } from "react";

interface CSVUploadProps {
  gene: string;
  onUploadSuccess: () => void;
}

export default function CSVUpload({ gene, onUploadSuccess }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const parseCSV = (text: string) => {
    // Robust parser that handles quoted values with newlines
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;
    let i = 0;

    // Detect delimiter
    const firstLineLineEnding = text.search(/\r?\n/);
    const firstLine =
      firstLineLineEnding !== -1
        ? text.substring(0, firstLineLineEnding)
        : text;
    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        if (char === '"') {
          inQuotes = false;
          i++;
          continue;
        }
        currentField += char;
        i++;
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
        } else if (char === delimiter) {
          currentRow.push(currentField.trim());
          currentField = "";
          i++;
        } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
          currentRow.push(currentField.trim());
          if (currentRow.length > 1 || currentRow[0] !== "") {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
          i += char === "\r" ? 2 : 1;
        } else {
          currentField += char;
          i++;
        }
      }
    }

    // Push the final row if there's data left
    if (currentRow.length > 0 || currentField !== "") {
      currentRow.push(currentField.trim());
      rows.push(currentRow);
    }

    if (rows.length === 0) return [];

    const finalHeaders = rows[0].map((h) => h.trim());
    const mandatoryColumns = ["c.change", "p.change", "ID", "transcript"];

    // Whitelist based on user request (Allele columns re-added for data ingestion)
    const allowedStatic = [
      "condition",
      "Allele Count",
      "Allele Number",
      "Allele Frequency",
      "Allele Count African/African American",
      "Allele Number African/African American",
      "Allele Count Admixed American",
      "Allele Number Admixed American",
      "Allele Count Ashkenazi Jewish",
      "Allele Number Ashkenazi Jewish",
      "Allele Count East Asian",
      "Allele Number East Asian",
      "Allele Count European (Finnish)",
      "Allele Number European (Finnish)",
      "Allele Count Middle Eastern",
      "Allele Number Middle Eastern",
      "Allele Count European (non-Finnish)",
      "Allele Number European (non-Finnish)",
      "Allele Count Amish",
      "Allele Number Amish",
      "Allele Count South Asian",
      "Allele Number South Asian",
      "REVEL",
      "VEST4_score",
      "MutPred_score",
      "BayesDel_addAF_score",
      "ACMG",
      "Functional",
      "Pvalue_functional",
    ];

    const missingRequired = mandatoryColumns.filter((col) => {
      if (col === "transcript") {
        return (
          !finalHeaders.includes("transcript") &&
          !finalHeaders.includes("Transcript")
        );
      }
      return !finalHeaders.includes(col);
    });
    if (missingRequired.length > 0) {
      throw new Error(
        `Missing required mandatory columns: ${missingRequired.join(", ")}`,
      );
    }

    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i];
      if (values.length === 1 && values[0] === "") continue;

      if (values.length !== finalHeaders.length) continue;

      const fullRow: any = {};
      finalHeaders.forEach((header, index) => {
        fullRow[header] = values[index];
      });

      const variantId = (fullRow["ID"] || "").toString().trim();
      if (!variantId || variantId.length > 2000) continue;

      // Build the final variant object using ONLY whitelisted columns
      const variant: any = {
        cdnaChange: fullRow["c.change"] || null,
        proteinChange: fullRow["p.change"] || null,
        id: variantId,
        transcript: fullRow["transcript"] || fullRow["Transcript"] || null,
      };

      // Add other allowed columns if present in CSV
      finalHeaders.forEach((header) => {
        if (allowedStatic.includes(header) || header.startsWith("Phenotype_")) {
          if (fullRow[header] !== undefined) {
            variant[header] = fullRow[header];
          }
        }
      });

      data.push(variant);
    }

    if (data.length === 0) {
      throw new Error("No valid data rows found in the CSV file.");
    }

    return data;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const variants = parseCSV(text);
          console.log(
            `Starting batched upload of ${variants.length} variants...`,
          );

          // Batching to prevent "Payload Too Large" errors
          const BATCH_SIZE = 100;
          for (let i = 0; i < variants.length; i += BATCH_SIZE) {
            const chunk = variants.slice(i, i + BATCH_SIZE);
            console.log(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

            const response = await fetch(`/api/variants/${gene}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ variants: chunk }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(
                data.error || `Failed to upload batch ${i / BATCH_SIZE}`,
              );
            }
          }

          onUploadSuccess();
        } catch (err: any) {
          setError(err.message || "Error parsing CSV.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/10 space-y-6 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-2">
        <svg
          className="w-8 h-8 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Upload Custom Variant Data for {gene}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          No custom analysis found for this gene. Upload a CSV file with the
          following columns (<b>bold</b> are required):
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-3 overflow-hidden">
          {[
            { name: "c.change", req: true },
            { name: "p.change", req: true },
            { name: "ID", req: true },
            { name: "transcript", req: true },
            { name: "ACMG", req: false },
            { name: "Functional", req: false },
            { name: "Functional_Pvalue", req: false },
            { name: "condition", req: false },
          ].map((c) => (
            <span
              key={c.name}
              className={`px-2 py-1 ${
                c.req
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-800"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-normal"
              } text-[10px] rounded font-mono`}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all cursor-pointer"
        />
        {error && (
          <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-400 text-white rounded-lg font-bold shadow-lg shadow-primary-500/20 transition-all flex items-center gap-2 uppercase tracking-wide text-xs"
      >
        {isUploading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : (
          "Upload & Create Table"
        )}
      </button>

      <div className="text-[10px] text-gray-400">
        Supported format: CSV or TSV. The ID column must be unique.
      </div>
    </div>
  );
}
