"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import type { CourseOption } from "@/components/leads/LeadBasicFields";
import {
  LEAD_STATUSES,
  subStatusesFor,
  programLevelLabel,
  leadSourceLabel,
} from "@/lib/lead-status";
import { formatDate } from "@/lib/format";
import { LeadForm } from "../LeadForm";
import { updateLeadStatus } from "../actions";
import type { TrackerLead } from "@/lib/db/schema";

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

export function LeadDetails({
  record,
  universityName,
  courseName,
  assignedToName,
  universityOptions,
  courses,
  staffOptions,
}: {
  record: TrackerLead;
  universityName: string | null;
  courseName: string | null;
  assignedToName: string | null;
  universityOptions: Option[];
  courses: CourseOption[];
  staffOptions: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(record.status ?? "new");
  const [subStatus, setSubStatus] = useState(record.subStatus ?? "");
  const subOptions = subStatusesFor(status);

  if (editing) {
    return (
      <LeadForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 items-start">
      {/* Lead details (read-only) */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Lead details
          </h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-white border border-border text-text-primary hover:bg-surface transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit details
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
          <Item label="Name" value={record.name} />
          <Item label="Mobile" value={record.phone} />
          <Item label="Email" value={record.email} />
          <Item label="Age" value={record.age ? String(record.age) : null} />
          <Item
            label="Sex"
            value={
              record.sex
                ? record.sex.charAt(0).toUpperCase() + record.sex.slice(1)
                : null
            }
          />
          <Item
            label="Looking for"
            value={record.programLevel ? programLevelLabel(record.programLevel) : null}
          />
          <Item label="University" value={universityName} />
          <Item label="Course" value={courseName} />
          <Item label="Assigned to" value={assignedToName} />
          <Item label="Source" value={leadSourceLabel(record.source)} />
          <Item
            label="Created"
            value={record.createdAt ? formatDate(record.createdAt) : null}
          />
          <Item label="Follow-up date" value={formatDate(record.followUpDate)} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Item label="Notes" value={record.notes} />
          </div>
        </div>
      </Card>

      {/* Quick status update */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Update status
        </h3>
        <form action={updateLeadStatus} className="space-y-4">
          <input type="hidden" name="id" value={record.id} />
          <label className="block">
            <span className={labelCls}>Status</span>
            <select
              name="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setSubStatus("");
              }}
              className={inputCls}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Further status</span>
            <select
              name="subStatus"
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              disabled={subOptions.length === 0}
              className={`${inputCls} disabled:bg-surface disabled:text-text-secondary`}
            >
              <option value="">—</option>
              {subOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Follow-up date</span>
            <input
              name="followUpDate"
              type="date"
              defaultValue={record.followUpDate ?? ""}
              className={inputCls}
            />
          </label>
          <PendingButton pendingText="Updating…">Update status</PendingButton>
        </form>
      </Card>
    </div>
  );
}
