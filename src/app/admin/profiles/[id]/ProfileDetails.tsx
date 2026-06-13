"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import type { CourseOption } from "@/components/profiles/ProfileFields";
import { PROFILE_STATUSES, programLevelLabel } from "@/lib/lead-status";
import { formatDate } from "@/lib/format";
import { ProfileForm } from "../ProfileForm";
import { updateProfileStatus } from "../actions";
import type { StudentProfile } from "@/lib/db/schema";

type Option = { value: string; label: string };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </div>
      <div className="text-sm text-text-primary mt-0.5 break-words">
        {value || "—"}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h4>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
        {children}
      </div>
    </div>
  );
}

export function ProfileDetails({
  record,
  universityName,
  courseName,
  assignedToName,
  universityOptions,
  courses,
  staffOptions,
}: {
  record: StudentProfile;
  universityName: string | null;
  courseName: string | null;
  assignedToName: string | null;
  universityOptions: Option[];
  courses: CourseOption[];
  staffOptions: Option[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ProfileForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const sexLabel = record.sex
    ? record.sex.charAt(0).toUpperCase() + record.sex.slice(1)
    : null;

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      {/* Profile details (read-only) */}
      <Card className="p-6 lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Profile details
          </h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-white border border-border text-text-primary hover:bg-surface transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </button>
        </div>

        <Section title="Student details">
          <Item label="Full name" value={record.name} />
          <Item label="Mobile" value={record.phone} />
          <Item label="Email" value={record.email} />
          <Item label="Date of birth" value={formatDate(record.dob)} />
          <Item label="Age" value={record.age ? String(record.age) : null} />
          <Item label="Sex" value={sexLabel} />
        </Section>

        <Section title="Guardian & address">
          <Item label="Guardian name" value={record.guardianName} />
          <Item label="Guardian mobile" value={record.guardianPhone} />
          <div className="sm:col-span-2 lg:col-span-1">
            <Item label="Address" value={record.address} />
          </div>
          <Item label="District" value={record.district} />
          <Item label="State" value={record.state} />
          <Item label="Pincode" value={record.pincode} />
        </Section>

        <Section title="Admission preference">
          <Item
            label="Looking for"
            value={
              record.programLevel ? programLevelLabel(record.programLevel) : null
            }
          />
          <Item label="University" value={universityName} />
          <Item label="Course" value={courseName} />
        </Section>

        <Section title="Previous education">
          <Item label="Last institution" value={record.lastInstitution} />
          <Item label="Last qualification" value={record.lastQualification} />
          <Item label="Year of passing" value={record.yearOfPassing} />
          <Item label="Marks / percentage" value={record.marksPercent} />
          <div className="sm:col-span-2">
            <Item label="Documents note" value={record.documentsNote} />
          </div>
        </Section>

        <Section title="Internal">
          <Item label="Assigned to" value={assignedToName} />
          <Item
            label="Created"
            value={record.createdAt ? formatDate(record.createdAt) : null}
          />
          <Item
            label="Student last submitted"
            value={
              record.profileSubmittedAt
                ? formatDate(record.profileSubmittedAt)
                : null
            }
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Item label="Internal notes" value={record.notes} />
          </div>
        </Section>
      </Card>

      {/* Quick status update */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Update status
        </h3>
        <form action={updateProfileStatus} className="space-y-4">
          <input type="hidden" name="id" value={record.id} />
          <label className="block">
            <span className={labelCls}>Profile status</span>
            <select
              name="status"
              defaultValue={record.status ?? "profile_pending"}
              className={inputCls}
            >
              {PROFILE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Assigned to</span>
            <select
              name="assignedToId"
              defaultValue={record.assignedToId ?? ""}
              className={inputCls}
            >
              <option value="">Unassigned</option>
              {staffOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <PendingButton pendingText="Updating…">Update status</PendingButton>
        </form>
      </Card>
    </div>
  );
}
