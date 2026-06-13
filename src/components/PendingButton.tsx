"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Submit button that shows a spinner and disables itself while the parent
 * form's server action is running — so users see something happening and
 * can't double-submit. Must be rendered INSIDE the <form>.
 */
export function PendingButton({
  children,
  pendingText,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  /** Label while submitting, e.g. "Saving…". Defaults to the children. */
  pendingText?: string;
  /** Full class override; when set, `variant` is ignored. */
  className?: string;
  variant?: "primary" | "danger" | "success" | "ghost" | "link" | "danger-link";
}) {
  const { pending } = useFormStatus();

  const variants: Record<string, string> = {
    primary:
      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors bg-primary hover:bg-primary-hover text-white",
    danger:
      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white",
    success:
      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors bg-green-600 hover:bg-green-700 text-white",
    ghost:
      "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors bg-white border border-border text-text-primary hover:bg-surface",
    link: "inline-flex items-center gap-1.5 text-sm text-primary hover:underline",
    "danger-link": "inline-flex items-center gap-1.5 text-sm text-red-600 hover:underline",
  };

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className ?? variants[variant]} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
