"use client";

import { useState } from "react";
import type { QualificationRow } from "@/lib/db/schema";

// Repeating prior-qualification rows (10th / 10+2 / graduation / PG). Serialised
// into a hidden `qualifications` field as JSON for the server action.

const inputCls =
  "w-full px-2.5 py-1.5 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";

const RESULT_STATUSES = ["Passed", "Awaited", "Failed", "Appearing"];

function seedRows(level: string | null | undefined): QualificationRow[] {
  const isPg = (level ?? "").toLowerCase().includes("pg");
  const levels = isPg
    ? ["10th", "10+2", "Graduation", "Post Graduation"]
    : ["10th", "10+2", "Graduation"];
  return levels.map((l) => ({ level: l }));
}

export function QualificationsField({
  defaultValue,
  programLevel,
}: {
  defaultValue?: QualificationRow[] | null;
  programLevel?: string | null;
}) {
  const [rows, setRows] = useState<QualificationRow[]>(
    defaultValue && defaultValue.length > 0
      ? defaultValue
      : seedRows(programLevel)
  );

  function update(i: number, patch: Partial<QualificationRow>) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }
  function add() {
    setRows((rs) => [...rs, { level: "" }]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="qualifications" value={JSON.stringify(rows)} />
      {rows.map((r, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface/40 p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              value={r.level}
              onChange={(e) => update(i, { level: e.target.value })}
              placeholder="Level (e.g. 10th)"
              className={`${inputCls} font-medium max-w-48`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="ml-auto text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <input
              value={r.board ?? ""}
              onChange={(e) => update(i, { board: e.target.value })}
              placeholder="Board / University"
              className={`${inputCls} lg:col-span-2`}
            />
            <select
              value={r.resultStatus ?? ""}
              onChange={(e) => update(i, { resultStatus: e.target.value })}
              className={inputCls}
            >
              <option value="">Result…</option>
              {RESULT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              value={r.percentage ?? ""}
              onChange={(e) => update(i, { percentage: e.target.value })}
              placeholder="Percentage"
              className={inputCls}
            />
            <input
              value={r.cgpa ?? ""}
              onChange={(e) => update(i, { cgpa: e.target.value })}
              placeholder="CGPA"
              className={inputCls}
            />
            <input
              value={r.year ?? ""}
              onChange={(e) => update(i, { year: e.target.value })}
              placeholder="Year"
              className={inputCls}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-primary hover:underline"
      >
        + Add qualification
      </button>
    </div>
  );
}
