"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, DetailItem, StatusBadge } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";
import { StudentForm } from "../StudentForm";
import type { Student } from "@/lib/db/schema";

type Option = { value: string; label: string };
type Course = { id: string; name: string; universityId: string | null };
type CommissionDefaults = Record<
  string,
  { commissionPercent: string | null; incentive: string | null }
>;

export function StudentDetails({
  record,
  universityName,
  courseName,
  execName,
  universityOptions,
  courses,
  staffOptions,
  commissionDefaults,
  isOwner,
}: {
  record: Student;
  universityName: string | null;
  courseName: string | null;
  execName: string | null;
  universityOptions: Option[];
  courses: Course[];
  staffOptions: Option[];
  commissionDefaults: CommissionDefaults;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <StudentForm
        record={record}
        universityOptions={universityOptions}
        courses={courses}
        staffOptions={staffOptions}
        commissionDefaults={commissionDefaults}
        isOwner={isOwner}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Admission details
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
        <DetailItem label="Student" value={record.studentName} />
        <DetailItem label="Mobile" value={record.phone} />
        <DetailItem
          label="Admission date"
          value={formatDate(record.admissionDate)}
        />
        <DetailItem label="University" value={universityName} />
        <DetailItem label="Course" value={courseName} />
        <DetailItem label="Model" value={record.model} />
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
          Money
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DetailItem
            label="University fee"
            value={record.universityFee ? formatMoney(record.universityFee) : null}
          />
          <DetailItem
            label="Collected from student"
            value={
              record.collectedFromStudent
                ? formatMoney(record.collectedFromStudent)
                : null
            }
          />
          <DetailItem
            label="Commission %"
            value={record.commissionPercent ? `${record.commissionPercent}%` : null}
          />
          <DetailItem
            label="Commission amount"
            value={
              record.commissionAmount ? formatMoney(record.commissionAmount) : null
            }
          />
          {isOwner && (
            <DetailItem
              label="IODE profit"
              value={record.iodeProfit ? formatMoney(record.iodeProfit) : null}
            />
          )}
          <DetailItem
            label="Incentive"
            value={record.incentive ? formatMoney(record.incentive) : null}
          />
        </div>
      </div>

      <div className="border-t border-border pt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isOwner && <DetailItem label="Sales executive" value={execName} />}
        <DetailItem
          label="Payment status"
          value={<StatusBadge status={record.paymentStatus} />}
        />
        <div className="sm:col-span-2 lg:col-span-1">
          <DetailItem label="Notes" value={record.notes} />
        </div>
      </div>
    </Card>
  );
}
