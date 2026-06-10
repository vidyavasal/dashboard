"use client";

import { useMemo, useState } from "react";
import { PROGRAM_LEVELS, SEX_OPTIONS } from "@/lib/lead-status";
import type { StudentProfile } from "@/lib/db/schema";

// Full student-profile fields, shared by the PUBLIC dynamic-link form
// (/profile/<token>) and the admin profile editor. Name + mobile mandatory;
// everything else optional. Picking a university filters the course dropdown.

type Option = { value: string; label: string };
export type CourseOption = { id: string; name: string; universityId: string | null };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

export function ProfileFields({
  record,
  universityOptions,
  courses,
}: {
  record?: Partial<StudentProfile>;
  universityOptions: Option[];
  courses: CourseOption[];
}) {
  const [universityId, setUniversityId] = useState(record?.universityId ?? "");
  const filteredCourses = useMemo(
    () =>
      universityId
        ? courses.filter((c) => c.universityId === universityId)
        : courses,
    [courses, universityId]
  );

  return (
    <div className="space-y-5">
      <Section title="Student details">
        <label className="block">
          <span className={labelCls}>
            Full name <span className="text-red-500">*</span>
          </span>
          <input name="name" required defaultValue={record?.name ?? ""} className={inputCls} />
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
            defaultValue={record?.phone ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Email</span>
          <input name="email" type="email" defaultValue={record?.email ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Date of birth</span>
          <input name="dob" type="date" defaultValue={record?.dob ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Age</span>
          <input
            name="age"
            type="number"
            min={5}
            max={99}
            defaultValue={record?.age ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Sex</span>
          <select name="sex" defaultValue={record?.sex ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Guardian & address">
        <label className="block">
          <span className={labelCls}>Guardian name</span>
          <input name="guardianName" defaultValue={record?.guardianName ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Guardian mobile</span>
          <input
            name="guardianPhone"
            type="tel"
            defaultValue={record?.guardianPhone ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelCls}>Address</span>
          <textarea name="address" rows={2} defaultValue={record?.address ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>District</span>
          <input name="district" defaultValue={record?.district ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>State</span>
          <input name="state" defaultValue={record?.state ?? ""} className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Pincode</span>
          <input
            name="pincode"
            pattern="[0-9]{6}"
            title="6-digit pincode"
            defaultValue={record?.pincode ?? ""}
            className={inputCls}
          />
        </label>
      </Section>

      <Section title="Admission preference">
        <label className="block">
          <span className={labelCls}>Looking for</span>
          <select
            name="programLevel"
            defaultValue={record?.programLevel ?? ""}
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
        <label className="block sm:col-span-2">
          <span className={labelCls}>Course</span>
          <select name="courseId" defaultValue={record?.courseId ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Previous education">
        <label className="block">
          <span className={labelCls}>Last institution (school / college)</span>
          <input
            name="lastInstitution"
            defaultValue={record?.lastInstitution ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Last qualification</span>
          <input
            name="lastQualification"
            placeholder="e.g. SSLC / +2 Science / BSc"
            defaultValue={record?.lastQualification ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Year of passing</span>
          <input
            name="yearOfPassing"
            defaultValue={record?.yearOfPassing ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Marks / percentage</span>
          <input
            name="marksPercent"
            defaultValue={record?.marksPercent ?? ""}
            className={inputCls}
          />
        </label>
        <label className="block sm:col-span-2 lg:col-span-3">
          <span className={labelCls}>Documents note</span>
          <textarea
            name="documentsNote"
            rows={2}
            placeholder="e.g. TC and marksheet ready, Aadhaar pending"
            defaultValue={record?.documentsNote ?? ""}
            className={inputCls}
          />
        </label>
      </Section>
    </div>
  );
}
