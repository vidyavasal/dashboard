"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, DetailItem, StatusBadge } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { StaffForm } from "../StaffForm";
import type { Staff } from "@/lib/db/schema";

export function StaffDetails({ record }: { record: Staff }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <StaffForm record={record} onCancel={() => setEditing(false)} />;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Staff details
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
        <DetailItem label="Name" value={record.name} />
        <DetailItem label="Role" value={record.role} />
        <DetailItem
          label="Base salary (monthly)"
          value={record.baseSalary ? formatMoney(record.baseSalary) : null}
        />
        <DetailItem label="Join date" value={formatDate(record.joinDate)} />
        <DetailItem
          label="Status"
          value={<StatusBadge status={record.status} />}
        />
        <DetailItem label="Linked admin user" value={record.adminUserId} />
      </div>
    </Card>
  );
}
