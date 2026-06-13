"use client";

import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { FormField, MoneyInput, SelectField } from "@/components/form";
import { todayStr, monthsAgoStr } from "@/lib/dates";
import { saveStaff } from "./actions";
import type { Staff } from "@/lib/db/schema";

export function StaffForm({
  record,
  onCancel,
}: {
  record?: Staff;
  /** When set (details page), Cancel exits edit mode instead of navigating. */
  onCancel?: () => void;
}) {
  const today = todayStr();
  return (
    <Card className="p-6">
      <form action={saveStaff} className="space-y-4">
        {record && <input type="hidden" name="id" value={record.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Name"
            name="name"
            required
            defaultValue={record?.name}
          />
          <FormField
            label="Role"
            name="role"
            placeholder="Sales Executive"
            defaultValue={record?.role}
          />
          <MoneyInput
            label="Base salary (monthly)"
            name="baseSalary"
            defaultValue={record?.baseSalary}
          />
          <FormField
            label="Join date"
            name="joinDate"
            type="date"
            defaultValue={record?.joinDate ?? today}
            // New staff: today or up to one month back — never a future date.
            // Editing keeps older historical join dates valid.
            min={record ? undefined : monthsAgoStr(1)}
            max={today}
            hint={record ? undefined : "Today or up to 1 month back."}
          />
          <SelectField
            label="Status"
            name="status"
            defaultValue={record?.status ?? "active"}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <FormField
            label="Linked admin user ID (optional)"
            name="adminUserId"
            placeholder="uuid of admin_users row"
            defaultValue={record?.adminUserId}
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>{record ? "Save changes" : "Add staff"}</SubmitButton>
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
              href="/admin/staff"
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
