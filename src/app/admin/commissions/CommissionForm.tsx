"use client";

import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { MoneyInput, SelectField, FormField } from "@/components/form";
import { saveCommission } from "./actions";
import type { UniversityCommission } from "@/lib/db/schema";

export function CommissionForm({
  record,
  universityOptions,
  onCancel,
}: {
  record?: UniversityCommission;
  universityOptions: { value: string; label: string }[];
  /** When set (details page), Cancel exits edit mode instead of navigating. */
  onCancel?: () => void;
}) {
  return (
    <Card className="p-6">
      <form action={saveCommission} className="space-y-4 max-w-md">
        <SelectField
          label="University"
          name="universityId"
          required
          defaultValue={record?.universityId}
          options={universityOptions}
          placeholder="Select a university…"
        />
        <FormField
          label="Commission %"
          name="commissionPercent"
          type="number"
          step="0.01"
          placeholder="e.g. 15"
          defaultValue={record?.commissionPercent}
        />
        <MoneyInput
          label="Incentive per admission"
          name="incentivePerAdmission"
          defaultValue={record?.incentivePerAdmission}
        />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>{record ? "Save changes" : "Save"}</SubmitButton>
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
              href="/admin/commissions"
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
