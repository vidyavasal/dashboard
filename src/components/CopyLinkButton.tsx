"use client";

import { useState } from "react";

/**
 * Copies an app link to the clipboard. `path` is app-relative
 * (e.g. /profile/<token>); the current origin is prepended at click time so
 * the copied link is correct on staging and production alike.
 */
export function CopyLinkButton({
  path,
  label = "Copy link",
}: {
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        const text = `${window.location.origin}${path}`;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Clipboard API unavailable (http / old browser) — fallback prompt.
          window.prompt("Copy this link:", text);
          return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-sm text-primary hover:underline whitespace-nowrap"
    >
      {copied ? "✓ Copied" : label}
    </button>
  );
}
