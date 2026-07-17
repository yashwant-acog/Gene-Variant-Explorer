"use client";

import { useState } from "react";

export default function UploadDataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [chr, setChr] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file.");
      return;
    }

    if (!chr.trim()) {
      setMessage("Please enter a chromosome.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chr", chr.trim());

      const res = await fetch("/api/upload-variant-db", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage(
        `Successfully uploaded ${data.inserted} variants into ${data.table}`,
      );
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-xl rounded-lg border bg-white p-8 shadow">
      <h1 className="mb-6 text-2xl font-bold">Upload dbNSFP Chromosome CSV</h1>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Chromosome</label>

          <input
            type="text"
            placeholder="Examples: 1, 2, X, Y, M"
            value={chr}
            onChange={(e) => setChr(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">CSV File</label>

          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>

        {message && (
          <div className="rounded border bg-gray-50 p-3 text-sm">{message}</div>
        )}
      </div>
    </div>
  );
}
