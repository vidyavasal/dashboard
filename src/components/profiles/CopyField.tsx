"use client";

import { useState } from "react";

/**
 * One copy-to-clipboard row for the profile "filling mode" — the admin opens
 * the university portal in another tab and clicks Copy on each field, then
 * pastes it into the matching portal input. Copies the RAW value only.
 */
export function CopyField({
  label,
  value,
  required = false,
  mono = false,
}: {
  label: string;
  value?: string | null;
  required?: boolean;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const text = (value ?? "").toString().trim();
  const empty = text.length === 0;

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/60 last:border-b-0">
      <div className="w-40 shrink-0 pt-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      </div>
      <div
        className={`flex-1 min-w-0 text-sm break-words ${
          empty ? "text-text-secondary/50 italic" : "text-text-primary"
        } ${mono ? "font-mono" : ""}`}
      >
        {empty ? "—" : text}
      </div>
      <button
        type="button"
        disabled={empty}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            window.prompt("Copy this value:", text);
            return;
          }
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          empty
            ? "text-text-secondary/40 cursor-not-allowed"
            : copied
              ? "bg-green-100 text-green-700"
              : "bg-surface hover:bg-primary-light text-primary"
        }`}
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
