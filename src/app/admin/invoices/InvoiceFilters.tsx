"use client";

import {
  FilterPanel,
  FSearch,
  FSelect,
  FDateRange,
  FApply,
} from "@/components/filters";
import type { InvoiceFiltersT } from "@/lib/db/invoices-query";

const TYPES = [
  { value: "student_fee", label: "Student fee receipt" },
  { value: "staff_salary", label: "Staff salary slip" },
  { value: "other", label: "Manual / other" },
];

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

export function InvoiceFilters({
  filters,
  hasActiveFilters,
}: {
  filters: InvoiceFiltersT;
  hasActiveFilters: boolean;
}) {
  return (
    <FilterPanel action="/admin/invoices" hasActiveFilters={hasActiveFilters}>
      <FSearch
        defaultValue={filters.q}
        placeholder="Bill-to name or INV-0012"
      />
      <FSelect label="Type" name="type" options={TYPES} value={filters.type} />
      <FSelect
        label="Status"
        name="status"
        options={STATUSES}
        value={filters.status}
      />
      <FDateRange
        label="Invoice date"
        fromValue={filters.from}
        toValue={filters.to}
      />
      <FApply />
    </FilterPanel>
  );
}
