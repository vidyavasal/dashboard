"use client";

import { useMemo, useState } from "react";
import { PROGRAM_LEVELS, SEX_OPTIONS } from "@/lib/lead-status";

// The basic lead fields shared by the PUBLIC /lead form and the admin lead
// form. Name + mobile are the only mandatory fields; everything else is
// optional. Picking a university filters the course dropdown.

type Option = { value: string; label: string };
export type CourseOption = { id: string; name: string; universityId: string | null };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

export function LeadBasicFields({
  universityOptions,
  courses,
  defaults,
}: {
  universityOptions: Option[];
  courses: CourseOption[];
  defaults?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    age?: number | null;
    sex?: string | null;
    programLevel?: string | null;
    universityId?: string | null;
    courseId?: string | null;
  };
}) {
  const [universityId, setUniversityId] = useState(defaults?.universityId ?? "");

  const filteredCourses = useMemo(
    () =>
      universityId
        ? courses.filter((c) => c.universityId === universityId)
        : courses,
    [courses, universityId]
  );

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <label className="block">
        <span className={labelCls}>
          Name <span className="text-red-500">*</span>
        </span>
        <input
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>
          Mobile <span className="text-red-500">*</span>
        </span>
        <input
          name="phone"
          type="tel"
          required
          pattern="[0-9+\-() ]{7,20}"
          title="Enter a valid mobile number"
          defaultValue={defaults?.phone ?? ""}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Email</span>
        <input
          name="email"
          type="email"
          defaultValue={defaults?.email ?? ""}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Age</span>
        <input
          name="age"
          type="number"
          min={5}
          max={99}
          defaultValue={defaults?.age ?? ""}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className={labelCls}>Sex</span>
        <select name="sex" defaultValue={defaults?.sex ?? ""} className={inputCls}>
          <option value="">Select…</option>
          {SEX_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>Looking for</span>
        <select
          name="programLevel"
          defaultValue={defaults?.programLevel ?? ""}
          className={inputCls}
        >
          <option value="">Select…</option>
          {PROGRAM_LEVELS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>University</span>
        <select
          name="universityId"
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
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
          defaultValue={defaults?.courseId ?? ""}
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
  );
}
