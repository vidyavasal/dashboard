"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import {
  LeadBasicFields,
  type CourseOption,
} from "@/components/leads/LeadBasicFields";
import { LEAD_STATUSES, subStatusesFor } from "@/lib/lead-status";
import { todayStr } from "@/lib/dates";
import { saveLead } from "./actions";
import type { TrackerLead } from "@/lib/db/schema";

type Option = { value: string; label: string };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

export function LeadForm({
  record,
  universityOptions,
  courses,
  staffOptions,
  onCancel,
}: {
  record?: TrackerLead;
  universityOptions: Option[];
  courses: CourseOption[];
  staffOptions: Option[];
  /** When set (details page), Cancel exits edit mode instead of navigating. */
  onCancel?: () => void;
}) {
  const [status, setStatus] = useState(record?.status ?? "new");
  const subOptions = subStatusesFor(status);

  return (
    <Card className="p-6">
      <form action={saveLead} className="space-y-5">
        {record && <input type="hidden" name="id" value={record.id} />}

        <LeadBasicFields
          universityOptions={universityOptions}
          courses={courses}
          defaults={record}
        />

        <div className="border-t border-border pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Lead status
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block">
              <span className={labelCls}>Status</span>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                key={status} // reset selection when status changes
                defaultValue={
                  record?.status === status ? (record?.subStatus ?? "") : ""
                }
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
              <span className={labelCls}>Assigned to</span>
              <select
                name="assignedToId"
                defaultValue={record?.assignedToId ?? ""}
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
            <label className="block">
              <span className={labelCls}>Follow-up date</span>
              <input
                name="followUpDate"
                type="date"
                defaultValue={record?.followUpDate ?? ""}
                // Follow-ups are scheduled ahead; existing past dates stay valid.
                min={record ? undefined : todayStr()}
                className={inputCls}
              />
            </label>
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className={labelCls}>Notes</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={record?.notes ?? ""}
                className={inputCls}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>{record ? "Save changes" : "Add lead"}</SubmitButton>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/admin/leads"
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Link>
          )}
        </div>
      </form>
    </Card>
  );
}
