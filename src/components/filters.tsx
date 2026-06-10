"use client";

import Form from "next/form";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ListFilter, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Unified filter panel used by Leads / Student Profiles / Admissions.
//
// One GET form, laid out as a responsive grid that uses the full panel width.
// Selects and dates AUTO-APPLY on change (form.requestSubmit()); the search
// box applies on Enter or via the Apply button. All state lives in the URL,
// so pagination links and the Export button always match what's on screen.
// ─────────────────────────────────────────────────────────────────────────────

export const filterFieldCls =
  "w-full h-9 px-2.5 border border-border rounded-lg text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary truncate";

const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1";

/** Long course/university names blow up the <select> width — cap them. */
export function truncateLabel(s: string, max = 44): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function autoSubmit(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
  e.currentTarget.form?.requestSubmit();
}

export function FilterPanel({
  action,
  hasActiveFilters,
  children,
}: {
  action: string;
  hasActiveFilters: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-text-secondary">
        <ListFilter className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          Filters
        </span>
        <span className="text-[11px] text-text-secondary/70">
          — dropdowns apply instantly
        </span>
        {hasActiveFilters && (
          <Link
            href={action}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </Link>
        )}
      </div>
      <Form
        action={action}
        className="grid gap-3 items-end [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]"
      >
        {children}
      </Form>
    </div>
  );
}

export function FSearch({
  name = "q",
  defaultValue,
  placeholder = "Search…",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className={labelCls}>Search</span>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
        <input
          type="search"
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          className={`${filterFieldCls} pl-8`}
        />
      </div>
    </label>
  );
}

export function FSelect({
  label,
  name,
  options,
  value,
  onValueChange,
  allLabel = "All",
  disabled = false,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  /** Current value (uncontrolled-with-default unless onValueChange given). */
  value?: string;
  /**
   * Controlled mode. The form is passed so the caller can submit AFTER its
   * state flush (a synchronous submit would send stale sibling values).
   */
  onValueChange?: (v: string, form: HTMLFormElement | null) => void;
  allLabel?: string;
  disabled?: boolean;
}) {
  const controlled = onValueChange !== undefined;
  return (
    <label className="block min-w-0">
      <span className={labelCls}>{label}</span>
      <select
        name={name}
        disabled={disabled}
        {...(controlled
          ? { value: value ?? "" }
          : { defaultValue: value ?? "" })}
        onChange={(e) => {
          if (controlled) {
            onValueChange(e.target.value, e.currentTarget.form);
          } else {
            autoSubmit(e);
          }
        }}
        className={`${filterFieldCls} disabled:bg-surface disabled:text-text-secondary`}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value} title={o.label}>
            {truncateLabel(o.label)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Submit after React has flushed state updates from the current event. */
export function deferredSubmit(form: HTMLFormElement | null) {
  setTimeout(() => form?.requestSubmit(), 0);
}

export function FDateRange({
  label = "Date",
  fromName = "from",
  toName = "to",
  fromValue,
  toValue,
}: {
  label?: string;
  fromName?: string;
  toName?: string;
  fromValue?: string;
  toValue?: string;
}) {
  return (
    <div className="min-w-0 col-span-2">
      <span className={labelCls}>{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          name={fromName}
          defaultValue={fromValue ?? ""}
          onChange={autoSubmit}
          className={filterFieldCls}
        />
        <span className="text-text-secondary text-xs shrink-0">to</span>
        <input
          type="date"
          name={toName}
          defaultValue={toValue ?? ""}
          onChange={autoSubmit}
          className={filterFieldCls}
        />
      </div>
    </div>
  );
}

export function FApply() {
  return (
    <button
      type="submit"
      className="h-9 rounded-lg bg-primary hover:bg-primary-hover text-white px-4 text-sm font-medium transition-colors"
    >
      Apply
    </button>
  );
}

/**
 * Dependent university → course pair. Picking a university narrows the course
 * list to that university (and clears a course that no longer applies).
 */
export function FUniversityCourse({
  universityOptions,
  courses,
  universityId: initialUniversity,
  courseId: initialCourse,
}: {
  universityOptions: { value: string; label: string }[];
  courses: { id: string; name: string; universityId: string | null }[];
  universityId?: string;
  courseId?: string;
}) {
  const [universityId, setUniversityId] = useState(initialUniversity ?? "");
  const [courseId, setCourseId] = useState(initialCourse ?? "");

  const courseOptions = useMemo(
    () =>
      (universityId
        ? courses.filter((c) => c.universityId === universityId)
        : courses
      ).map((c) => ({ value: c.id, label: c.name })),
    [courses, universityId]
  );

  return (
    <>
      <FSelect
        label="University"
        name="universityId"
        options={universityOptions}
        value={universityId}
        onValueChange={(v, form) => {
          setUniversityId(v);
          // Clear a course that doesn't belong to the new university.
          if (
            courseId &&
            v &&
            !courses.some((c) => c.id === courseId && c.universityId === v)
          ) {
            setCourseId("");
          }
          deferredSubmit(form);
        }}
      />
      <FSelect
        label="Course"
        name="courseId"
        options={courseOptions}
        value={courseId}
        onValueChange={(v, form) => {
          setCourseId(v);
          deferredSubmit(form);
        }}
      />
    </>
  );
}
