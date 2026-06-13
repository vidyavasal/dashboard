"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, DetailItem } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { CommissionForm } from "../CommissionForm";
import type { UniversityCommission } from "@/lib/db/schema";

export function CommissionDetails({
  record,
  universityName,
  universityOptions,
}: {
  record: UniversityCommission;
  universityName: string | null;
  universityOptions: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CommissionForm
        record={record}
        universityOptions={universityOptions}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Commission details
        </h3>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium bg-white border border-border text-text-primary hover:bg-surface transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit details
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailItem label="University" value={universityName} />
        <DetailItem
          label="Commission %"
          value={record.commissionPercent ? `${record.commissionPercent}%` : null}
        />
        <DetailItem
          label="Incentive per admission"
          value={
            record.incentivePerAdmission
              ? formatMoney(record.incentivePerAdmission)
              : null
          }
        />
      </div>
      <p className="mt-4 text-xs text-text-secondary bg-surface rounded-lg px-3 py-2">
        These defaults auto-fill the commission % and incentive on every new
        admission for this university.
      </p>
    </Card>
  );
}
