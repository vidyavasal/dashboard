"use client";

import { useRef, useState } from "react";
import type { ProfileDocument } from "@/lib/db/schema";

// Certificate / document uploads. Each row has a label + an uploaded file URL
// (via the shared /api/upload/image route, which accepts images and PDFs).
// Serialised into a hidden `documents` field as JSON.

const inputCls =
  "w-full px-2.5 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";

// Common certificate types for quick add.
const SUGGESTED = [
  "Photo",
  "Aadhaar",
  "10th Marksheet",
  "10+2 Marksheet",
  "Graduation Marksheet",
  "Transfer Certificate",
  "Signature",
];

export function DocumentsField({
  defaultValue,
}: {
  defaultValue?: ProfileDocument[] | null;
}) {
  const [docs, setDocs] = useState<ProfileDocument[]>(defaultValue ?? []);

  function update(i: number, patch: Partial<ProfileDocument>) {
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function remove(i: number) {
    setDocs((d) => d.filter((_, idx) => idx !== i));
  }
  function add(type = "") {
    setDocs((d) => [...d, { type, url: "" }]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="documents" value={JSON.stringify(docs)} />

      {docs.map((doc, i) => (
        <DocRow
          key={i}
          doc={doc}
          onChange={(patch) => update(i, patch)}
          onRemove={() => remove(i)}
        />
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => add()}
          className="text-sm text-primary hover:underline"
        >
          + Add document
        </button>
        <span className="text-xs text-text-secondary">or quick add:</span>
        {SUGGESTED.filter((s) => !docs.some((d) => d.type === s)).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => add(s)}
            className="text-xs rounded-full border border-border px-2 py-0.5 text-text-secondary hover:bg-primary-light hover:text-primary"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocRow({
  doc,
  onChange,
  onRemove,
}: {
  doc: ProfileDocument;
  onChange: (patch: Partial<ProfileDocument>) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "/iode/documents");
      fd.append("fileName", file.name);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange({ url: data.url, uploadedAt: new Date().toISOString() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/40 p-3">
      <input
        value={doc.type}
        onChange={(e) => onChange({ type: e.target.value })}
        placeholder="Document name"
        className={`${inputCls} max-w-56`}
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {doc.url ? (
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          ✓ View file
        </a>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm rounded-lg bg-surface border border-border px-3 py-1.5 hover:bg-primary-light hover:text-primary disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto text-xs text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}
