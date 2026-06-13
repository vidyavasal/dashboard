"use client";

import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import {
  ProfileFields,
  type CourseOption,
} from "@/components/profiles/ProfileFields";
import { PROFILE_STATUSES } from "@/lib/lead-status";
import { saveProfile } from "./actions";
import type { StudentProfile } from "@/lib/db/schema";

type Option = { value: string; label: string };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

export function ProfileForm({
  record,
  universityOptions,
  courses,
  staffOptions,
  onCancel,
}: {
  record: StudentProfile;
  universityOptions: Option[];
  courses: CourseOption[];
  staffOptions: Option[];
  /** When set (details page), Cancel exits edit mode instead of navigating. */
  onCancel?: () => void;
}) {
  return (
    <Card className="p-6">
      <form action={saveProfile} className="space-y-5">
        <input type="hidden" name="id" value={record.id} />

        <ProfileFields
          record={record}
          universityOptions={universityOptions}
          courses={courses}
        />

        <div className="border-t border-border pt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Internal (staff only)
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
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
            <label className="block sm:col-span-2">
              <span className={labelCls}>Internal notes</span>
              <textarea
                name="notes"
                rows={3}
                defaultValue={record.notes ?? ""}
                className={inputCls}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>Save profile</SubmitButton>
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
              href="/admin/profiles"
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
