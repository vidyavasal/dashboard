"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { computeCommission } from "@/lib/commission-model";
import { todayStr } from "@/lib/dates";
import { saveStudent } from "./actions";
import type { Student } from "@/lib/db/schema";

type Option = { value: string; label: string };
type Course = { id: string; name: string; universityId: string | null };
type CommissionDefaults = Record<
  string,
  { commissionPercent: string | null; incentive: string | null }
>;

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

export function StudentForm({
  record,
  universityOptions,
  courses,
  staffOptions,
  commissionDefaults,
  isOwner,
  onCancel,
}: {
  record?: Student;
  universityOptions: Option[];
  courses: Course[];
  staffOptions: Option[];
  commissionDefaults: CommissionDefaults;
  isOwner: boolean;
  /** When set (details page), Cancel exits edit mode instead of navigating. */
  onCancel?: () => void;
}) {
  const [universityId, setUniversityId] = useState(record?.universityId ?? "");
  const [universityFee, setUniversityFee] = useState(
    record?.universityFee ?? ""
  );
  const [collected, setCollected] = useState(
    record?.collectedFromStudent ?? ""
  );
  const [commissionPercent, setCommissionPercent] = useState(
    record?.commissionPercent ?? ""
  );
  const [commissionAmount, setCommissionAmount] = useState(
    record?.commissionAmount ?? ""
  );
  const [iodeProfit, setIodeProfit] = useState(record?.iodeProfit ?? "");
  const [incentive, setIncentive] = useState(record?.incentive ?? "");
  // Tracks fields the user has hand-edited so auto-compute won't clobber them.
  const [overridden, setOverridden] = useState<Record<string, boolean>>({});

  const filteredCourses = useMemo(
    () =>
      universityId
        ? courses.filter((c) => c.universityId === universityId)
        : courses,
    [courses, universityId]
  );

  function recompute(next: {
    universityFee?: string;
    collected?: string;
    commissionPercent?: string;
    incentive?: string;
    override?: Record<string, boolean>;
  }) {
    const ov = next.override ?? overridden;
    const out = computeCommission({
      universityFee: next.universityFee ?? universityFee,
      collectedFromStudent: next.collected ?? collected,
      commissionPercent: next.commissionPercent ?? commissionPercent,
      incentivePerAdmission: next.incentive ?? incentive,
    });
    if (!ov.commissionAmount) setCommissionAmount(String(out.commissionAmount));
    if (!ov.iodeProfit) setIodeProfit(String(out.iodeProfit));
  }

  function onUniversityChange(id: string) {
    setUniversityId(id);
    const def = commissionDefaults[id];
    let pct = commissionPercent;
    let inc = incentive;
    if (def && !overridden.commissionPercent) {
      pct = def.commissionPercent ?? "";
      setCommissionPercent(pct);
    }
    if (def && !overridden.incentive) {
      inc = def.incentive ?? "";
      setIncentive(inc);
    }
    recompute({ commissionPercent: pct, incentive: inc });
  }

  function markOverride(field: string) {
    setOverridden((o) => ({ ...o, [field]: true }));
  }

  return (
    <Card className="p-6">
      <form action={saveStudent} className="space-y-5">
        {record && <input type="hidden" name="id" value={record.id} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className={labelCls}>
              Student name <span className="text-red-500">*</span>
            </span>
            <input
              name="studentName"
              required
              defaultValue={record?.studentName}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Phone</span>
            <input
              name="phone"
              defaultValue={record?.phone ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Admission date</span>
            <input
              name="admissionDate"
              type="date"
              defaultValue={record?.admissionDate ?? todayStr()}
              max={todayStr()}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Model</span>
            <input
              name="model"
              placeholder="Commission / Fixed"
              defaultValue={record?.model ?? ""}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className={labelCls}>University</span>
            <select
              name="universityId"
              value={universityId}
              onChange={(e) => onUniversityChange(e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {universityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelCls}>Course</span>
            <select
              name="courseId"
              defaultValue={record?.courseId ?? ""}
              className={inputCls}
            >
              <option value="">Select…</option>
              {filteredCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Money
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <MoneyField
              label="University fee"
              name="universityFee"
              value={universityFee}
              onChange={(v) => {
                setUniversityFee(v);
                recompute({ universityFee: v });
              }}
            />
            <MoneyField
              label="Collected from student"
              name="collectedFromStudent"
              value={collected}
              onChange={(v) => {
                setCollected(v);
                recompute({ collected: v });
              }}
            />
            <label className="block">
              <span className={labelCls}>Commission %</span>
              <input
                name="commissionPercent"
                type="number"
                step="0.01"
                value={commissionPercent}
                onChange={(e) => {
                  markOverride("commissionPercent");
                  setCommissionPercent(e.target.value);
                  recompute({ commissionPercent: e.target.value });
                }}
                className={inputCls}
              />
            </label>
            <MoneyField
              label="Commission amount (auto)"
              name="commissionAmount"
              value={commissionAmount}
              onChange={(v) => {
                markOverride("commissionAmount");
                setCommissionAmount(v);
              }}
            />
            <MoneyField
              label="IODE profit (auto)"
              name="iodeProfit"
              value={iodeProfit}
              onChange={(v) => {
                markOverride("iodeProfit");
                setIodeProfit(v);
              }}
            />
            <MoneyField
              label="Incentive (auto)"
              name="incentive"
              value={incentive}
              onChange={(v) => {
                markOverride("incentive");
                setIncentive(v);
              }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-border pt-4">
          {isOwner && (
            <label className="block">
              <span className={labelCls}>Sales executive</span>
              <select
                name="salesExecutiveId"
                defaultValue={record?.salesExecutiveId ?? ""}
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
          )}
          <label className="block">
            <span className={labelCls}>Payment status</span>
            <select
              name="paymentStatus"
              defaultValue={record?.paymentStatus ?? "pending"}
              className={inputCls}
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelCls}>Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={record?.notes ?? ""}
              className={inputCls}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>
            {record ? "Save changes" : "Add admission"}
          </SubmitButton>
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
              href="/admin/students"
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

function MoneyField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string | number | null;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
          ₹
        </span>
        <input
          name={name}
          type="number"
          step="0.01"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputCls} pl-7`}
        />
      </div>
    </label>
  );
}
