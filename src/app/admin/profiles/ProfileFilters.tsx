"use client";

import {
  FilterPanel,
  FSearch,
  FSelect,
  FDateRange,
  FApply,
  FUniversityCourse,
} from "@/components/filters";
import { PROFILE_STATUSES, PROGRAM_LEVELS } from "@/lib/lead-status";
import type { ProfileFilters as Filters } from "@/lib/db/profiles-query";

type Option = { value: string; label: string };
type Course = { id: string; name: string; universityId: string | null };

export function ProfileFilters({
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
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <FilterPanel action="/admin/profiles" hasActiveFilters={hasActiveFilters}>
      <FSearch defaultValue={filters.q} placeholder="Name / mobile / email" />
      <FSelect
        label="Status"
        name="status"
        allLabel={`All (${allCount})`}
        options={PROFILE_STATUSES.map((s) => ({
          value: s.value,
          label: `${s.label} (${counts[s.value] ?? 0})`,
        }))}
        value={filters.status}
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
      <FDateRange
        label="Created between"
        fromValue={filters.from}
        toValue={filters.to}
      />
      <FDateRange
        label="Admitted between"
        fromName="afrom"
        toName="ato"
        fromValue={filters.afrom}
        toValue={filters.ato}
      />
      <FApply />
    </FilterPanel>
  );
}
