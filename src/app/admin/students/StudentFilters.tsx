"use client";

import {
  FilterPanel,
  FSearch,
  FSelect,
  FDateRange,
  FApply,
  FUniversityCourse,
} from "@/components/filters";
import type { StudentFilters as Filters } from "@/lib/db/students-query";

type Option = { value: string; label: string };
type Course = { id: string; name: string; universityId: string | null };

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export function StudentFilters({
  filters,
  universityOptions,
  courses,
  staffOptions,
  isOwner,
  hasActiveFilters,
}: {
  filters: Filters;
  universityOptions: Option[];
  courses: Course[];
  staffOptions: Option[];
  isOwner: boolean;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterPanel action="/admin/students" hasActiveFilters={hasActiveFilters}>
      <FSearch defaultValue={filters.q} placeholder="Name / mobile" />
      <FUniversityCourse
        universityOptions={universityOptions}
        courses={courses}
        universityId={filters.universityId}
        courseId={filters.courseId}
      />
      <FSelect
        label="Payment"
        name="paymentStatus"
        options={PAYMENT_STATUSES}
        value={filters.paymentStatus}
      />
      {isOwner && (
        <FSelect
          label="Sales exec"
          name="salesExecutiveId"
          options={staffOptions}
          value={filters.salesExecutiveId}
        />
      )}
      <FDateRange
        label="Admission date"
        fromValue={filters.from}
        toValue={filters.to}
      />
      <FApply />
    </FilterPanel>
  );
}
