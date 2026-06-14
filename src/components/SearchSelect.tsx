"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Option = { value: string; label: string };

/**
 * Searchable select for long lists (hundreds of admissions, payroll rows…).
 * Type to filter, click to pick; the chosen value is submitted via a hidden
 * input. Plain <select> becomes unusable at that size.
 */
export function SearchSelect({
  name,
  options,
  placeholder = "Type to search…",
  required = false,
}: {
  name: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
    return list.slice(0, 50);
  }, [options, query]);

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0">
      <input type="hidden" name={name} value={selected?.value ?? ""} />
      {selected ? (
        <div className="flex items-center justify-between gap-2 w-full px-3 py-2 text-sm border border-border rounded-lg bg-primary-light/50">
          <span className="truncate font-medium text-text-primary">
            {selected.label}
          </span>
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => {
              setSelected(null);
              setQuery("");
              setOpen(true);
            }}
            className="shrink-0 text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            value={query}
            required={required}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
      {open && !selected && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-border rounded-xl shadow-lg py-1">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-text-secondary">
              No matches.
            </li>
          )}
          {matches.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  setSelected(o);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary-light/60 truncate"
                title={o.label}
              >
                {o.label}
              </button>
            </li>
          ))}
          {options.length > matches.length && matches.length === 50 && (
            <li className="px-3 py-1.5 text-xs text-text-secondary border-t border-border">
              Showing first 50 — keep typing to narrow down.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
