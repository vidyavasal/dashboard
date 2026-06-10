// ────────────────────────────────────────────────────────────────────────────
// Lead + student-profile status taxonomy — the SINGLE source of truth.
//
// Every status has an optional list of sub-statuses ("further status") used
// for the dependent dropdown on the lead form and the sub-status filter.
// Edit the lists here and every form / filter / badge picks it up.
//
// `converted` and the profile statuses are set by the app (Convert / Mark
// admitted buttons) — keep their values stable; labels are free to change.
//
// This file must stay free of Node-only / DB imports so client components can
// use it.
// ────────────────────────────────────────────────────────────────────────────

export interface LeadStatusDef {
  value: string;
  label: string;
  subStatuses: string[];
}

export const LEAD_STATUSES: LeadStatusDef[] = [
  {
    value: "new",
    label: "New",
    subStatuses: ["Not contacted", "Website enquiry", "Walk-in", "Referral"],
  },
  {
    value: "contacted",
    label: "Contacted",
    subStatuses: [
      "Call answered",
      "Call not answered",
      "Busy / call later",
      "Switched off",
      "Wrong number",
      "WhatsApp sent",
    ],
  },
  {
    value: "follow_up",
    label: "Follow-up",
    subStatuses: [
      "Call back scheduled",
      "Considering options",
      "Waiting for results",
      "Parent discussion pending",
      "Fee details requested",
    ],
  },
  {
    value: "interested",
    label: "Interested",
    subStatuses: [
      "Highly interested",
      "Fee details shared",
      "Office visit planned",
      "Documents requested",
    ],
  },
  {
    value: "not_interested",
    label: "Not interested",
    subStatuses: [
      "Budget issue",
      "Joined elsewhere",
      "Not eligible",
      "Location issue",
      "Just enquiring",
    ],
  },
  {
    value: "converted",
    label: "Converted",
    subStatuses: [],
  },
  {
    value: "lost",
    label: "Lost",
    subStatuses: ["No response", "Invalid number", "Duplicate", "Closed"],
  },
];

export const LEAD_STATUS_VALUES = LEAD_STATUSES.map((s) => s.value);

export function leadStatusLabel(value: string | null | undefined): string {
  return LEAD_STATUSES.find((s) => s.value === value)?.label ?? value ?? "—";
}

export function subStatusesFor(status: string | null | undefined): string[] {
  return LEAD_STATUSES.find((s) => s.value === status)?.subStatuses ?? [];
}

// ── Student profile statuses (the post-conversion pipeline) ─────────────────

export const PROFILE_STATUSES: { value: string; label: string }[] = [
  { value: "profile_pending", label: "Profile pending" }, // link shared, waiting for data
  { value: "profile_submitted", label: "Profile submitted" }, // student filled the form
  { value: "docs_pending", label: "Documents pending" },
  { value: "admission_processing", label: "Admission processing" },
  { value: "admitted", label: "Admitted" },
  { value: "dropped", label: "Dropped" },
];

export const PROFILE_STATUS_VALUES = PROFILE_STATUSES.map((s) => s.value);

export function profileStatusLabel(value: string | null | undefined): string {
  return (
    PROFILE_STATUSES.find((s) => s.value === value)?.label ?? value ?? "—"
  );
}

// ── Shared option lists ──────────────────────────────────────────────────────

export const PROGRAM_LEVELS: { value: string; label: string }[] = [
  { value: "plus_one", label: "+1" },
  { value: "plus_two", label: "+2" },
  { value: "degree", label: "Degree (UG)" },
  { value: "pg", label: "PG" },
  { value: "diploma", label: "Diploma" },
  { value: "other", label: "Other" },
];

export function programLevelLabel(value: string | null | undefined): string {
  return (
    PROGRAM_LEVELS.find((p) => p.value === value)?.label ?? value ?? "—"
  );
}

export const SEX_OPTIONS: { value: string; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export const LEAD_SOURCES: { value: string; label: string }[] = [
  { value: "web_form", label: "Web form" },
  { value: "manual", label: "Manual entry" },
  { value: "csv_import", label: "CSV import" },
];

export function leadSourceLabel(value: string | null | undefined): string {
  return LEAD_SOURCES.find((s) => s.value === value)?.label ?? value ?? "—";
}

// ── CSV import format (leads) ────────────────────────────────────────────────
// Header row of the import template. Only name + phone are mandatory;
// university/course are matched by NAME (case-insensitive). Dates are
// YYYY-MM-DD. status must be one of LEAD_STATUSES values.

export const LEAD_IMPORT_COLUMNS = [
  "name",
  "phone",
  "email",
  "age",
  "sex",
  "program_level",
  "university",
  "course",
  "status",
  "sub_status",
  "follow_up_date",
  "notes",
] as const;
