"use client";

import { useRef, useState } from "react";
import type { ProfileDocument } from "@/lib/db/schema";

// Certificate / document uploads. A FIXED set of slots — one per required
// document — each with a single file upload. Only JPG / PNG / PDF, max 300 KB.
// Serialised into a hidden `documents` field as JSON.

// The documents the university portal expects. Edit this list to change slots.
const DOC_SLOTS = [
  "Photo",
  "Signature",
  "Aadhaar Card",
  "10th Marksheet",
  "10+2 Marksheet",
  "Graduation Marksheet",
  "Transfer Certificate",
  "Income Certificate",
  "Category Certificate",
];

const ACCEPT = ["image/jpeg", "image/png", "application/pdf"];
const ACCEPT_ATTR = ".jpg,.jpeg,.png,.pdf";
const MAX_BYTES = 300 * 1024; // 300 KB

export function DocumentsField({
  defaultValue,
}: {
  defaultValue?: ProfileDocument[] | null;
}) {
  // Seed each slot from any existing upload of the same type.
  const [docs, setDocs] = useState<Record<string, ProfileDocument>>(() => {
    const map: Record<string, ProfileDocument> = {};
    for (const type of DOC_SLOTS) {
      const existing = defaultValue?.find((d) => d.type === type);
      map[type] = existing ?? { type, url: "" };
    }
    return map;
  });

  function setDoc(type: string, patch: Partial<ProfileDocument>) {
    setDocs((d) => ({ ...d, [type]: { ...d[type], ...patch } }));
  }

  // Only persist slots that actually have a file.
  const serialised = JSON.stringify(
    Object.values(docs).filter((d) => d.url)
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name="documents" value={serialised} />
      <p className="text-xs text-text-secondary">
        JPG, PNG or PDF · max 300 KB each.
      </p>
      {DOC_SLOTS.map((type) => (
        <DocSlot
          key={type}
          type={type}
          doc={docs[type]}
          onChange={(patch) => setDoc(type, patch)}
        />
      ))}
    </div>
  );
}

function DocSlot({
  type,
  doc,
  onChange,
}: {
  type: string;
  doc: ProfileDocument;
  onChange: (patch: Partial<ProfileDocument>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    if (!ACCEPT.includes(file.type)) {
      setError("Only JPG, PNG or PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Too large (${Math.round(file.size / 1024)} KB). Max 300 KB.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "/iode/documents");
      fd.append("fileName", `${type}-${file.name}`);
      fd.append("maxBytes", String(MAX_BYTES));
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
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2">
      <span className="w-44 shrink-0 text-sm font-medium text-text-primary">
        {type}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      {doc.url ? (
        <>
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            ✓ View
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-text-secondary hover:text-text-primary"
          >
            Replace
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="text-sm rounded-lg bg-surface border border-border px-3 py-1.5 hover:bg-primary-light hover:text-primary disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
