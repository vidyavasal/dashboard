"use client";

import { useState } from "react";
import {
  FilterPanel,
  FSearch,
  FSelect,
  FDateRange,
  FApply,
  FUniversityCourse,
  deferredSubmit,
} from "@/components/filters";
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  PROGRAM_LEVELS,
  subStatusesFor,
} from "@/lib/lead-status";
import type { LeadFilters as Filters } from "@/lib/db/leads-query";

type Option = { value: string; label: string };
type Course = { id: string; name: string; universityId: string | null };

export function LeadFilters({
  filters,
  counts,
  universityOptions,
  courses,
  hasActiveFilters,
}: {
  filters: Filters;
  counts: Record<string, number>;
  universityOptions: Option[];
  courses: Course[];
  hasActiveFilters: boolean;
}) {
  const [status, setStatus] = useState(filters.status ?? "");
  const [subStatus, setSubStatus] = useState(filters.subStatus ?? "");
  const subOptions = subStatusesFor(status);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <FilterPanel action="/admin/leads" hasActiveFilters={hasActiveFilters}>
      <FSearch defaultValue={filters.q} placeholder="Name / mobile / email" />
      <FSelect
        label="Status"
        name="status"
        allLabel={`All (${allCount})`}
        options={LEAD_STATUSES.map((s) => ({
          value: s.value,
          label: `${s.label} (${counts[s.value] ?? 0})`,
        }))}
        value={status}
        onValueChange={(v, form) => {
          setStatus(v);
          setSubStatus(""); // sub-status belongs to one status
          deferredSubmit(form);
        }}
      />
      <FSelect
        label="Further status"
        name="subStatus"
        options={subOptions.map((s) => ({ value: s, label: s }))}
        value={subStatus}
        disabled={subOptions.length === 0}
        onValueChange={(v, form) => {
          setSubStatus(v);
          deferredSubmit(form);
        }}
      />
      <FUniversityCourse
        universityOptions={universityOptions}
        courses={courses}
        universityId={filters.universityId}
        courseId={filters.courseId}
      />
      <FSelect
        label="Looking for"
        name="programLevel"
        options={PROGRAM_LEVELS}
        value={filters.programLevel}
      />
      <FSelect
        label="Source"
        name="source"
        options={LEAD_SOURCES}
        value={filters.source}
      />
      <FDateRange
        label="Created between"
        fromValue={filters.from}
        toValue={filters.to}
      />
      <FApply />
    </FilterPanel>
  );
}
