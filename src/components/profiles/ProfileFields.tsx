"use client";

import { useMemo, useState } from "react";
import { PROGRAM_LEVELS, SEX_OPTIONS } from "@/lib/lead-status";
import type { StudentProfile } from "@/lib/db/schema";
import { QualificationsField } from "./QualificationsField";
import { DocumentsField } from "./DocumentsField";
import { AddressFields } from "./AddressFields";

// Minimum age 16 → latest allowed date of birth.
function maxDobStr(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return d.toISOString().slice(0, 10);
}

// Full student-profile fields, shared by the PUBLIC dynamic-link form
// (/profile/<token>) and the admin profile editor. Name + mobile mandatory;
// everything else optional. Picking a university filters the course dropdown.
// Most fields mirror the official university application portal so staff can
// copy them across in "filling mode".

type Option = { value: string; label: string };
export type CourseOption = { id: string; name: string; universityId: string | null };

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

const AREA_TYPES = ["Rural", "Urban"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const CONTACT_PERSONS = ["Mother", "Father", "Guardian", "Self"];

function Section({
  title,
  grid = true,
  children,
}: {
  title: string;
  grid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {title}
      </h3>
      {grid ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
      ) : (
        children
      )}
    </div>
  );
}

function Hint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <span className="block text-xs text-text-secondary mt-1">{children}</span>;
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  className = "",
  hint,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  className?: string;
  hint?: React.ReactNode;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "defaultValue" | "name" | "type" | "className"
>) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className={inputCls}
        {...rest}
      />
      <Hint>{hint}</Hint>
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  className = "",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: string[];
  className?: string;
  hint?: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={inputCls}>
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Hint>{hint}</Hint>
    </label>
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
  const [programLevel, setProgramLevel] = useState(record?.programLevel ?? "");
  const [corrSame, setCorrSame] = useState(
    record?.corrSameAsPermanent ?? true
  );
  const filteredCourses = useMemo(
    () =>
      universityId
        ? courses.filter((c) => c.universityId === universityId)
        : courses,
    [courses, universityId]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-primary-light/60 border border-primary/20 px-4 py-3 text-sm text-text-primary">
        📄 Please fill every detail <strong>exactly as it appears on your 10th
        certificate / SSLC</strong> — name, parents&rsquo; names and date of
        birth must match, as these go into the official university application.
      </div>

      <Section title="Student details">
        <label className="block">
          <span className={labelCls}>
            Full name <span className="text-red-500">*</span>
          </span>
          <input name="name" required defaultValue={record?.name ?? ""} className={inputCls} />
          <Hint>As printed on your 10th certificate / SSLC.</Hint>
        </label>
        <label className="block">
          <span className={labelCls}>
            Mobile <span className="text-red-500">*</span>
          </span>
          <input
            name="phone"
            type="tel"
            required
            inputMode="numeric"
            maxLength={10}
            pattern="[6-9][0-9]{9}"
            title="10-digit Indian mobile number"
            defaultValue={record?.phone ?? ""}
            className={inputCls}
          />
          <Hint>10-digit mobile number.</Hint>
        </label>
        <Field label="Email" name="email" type="email" defaultValue={record?.email} />
        <Field
          label="Date of birth"
          name="dob"
          type="date"
          defaultValue={record?.dob}
          max={maxDobStr()}
          hint="As on your 10th certificate. Must be 16 years or older."
        />
        <label className="block">
          <span className={labelCls}>Gender</span>
          <select name="sex" defaultValue={record?.sex ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <SelectField label="Area type" name="areaType" defaultValue={record?.areaType} options={AREA_TYPES} />
        <Field label="Father's name" name="fatherName" defaultValue={record?.fatherName} hint="As on your 10th certificate." />
        <Field label="Mother's name" name="motherName" defaultValue={record?.motherName} hint="As on your 10th certificate." />
        <Field label="Annual income" name="annualIncome" defaultValue={record?.annualIncome} inputMode="numeric" />
        <Field label="Nationality" name="nationality" defaultValue={record?.nationality ?? "INDIAN"} />
        <Field label="Religion" name="religion" defaultValue={record?.religion} />
        <SelectField label="Blood group" name="bloodGroup" defaultValue={record?.bloodGroup} options={BLOOD_GROUPS} />
        <SelectField label="Category" name="category" defaultValue={record?.category} options={CATEGORIES} />
        <Field
          label="Aadhaar number"
          name="aadhaarNumber"
          defaultValue={record?.aadhaarNumber}
          inputMode="numeric"
          maxLength={12}
          pattern="[0-9]{12}"
          title="12-digit Aadhaar number"
          hint="12-digit number on your Aadhaar card."
        />
        <Field label="ABC ID" name="abcId" defaultValue={record?.abcId} />
        <Field label="Student occupation" name="studentOccupation" defaultValue={record?.studentOccupation} />
        <Field label="Occupation details (if Other)" name="studentOccupationDetails" defaultValue={record?.studentOccupationDetails} />
      </Section>

      <Section title="Contact person">
        <SelectField label="Contact person" name="contactPerson" defaultValue={record?.contactPerson} options={CONTACT_PERSONS} />
        <Field label="Contact mobile" name="contactMobile" type="tel" defaultValue={record?.contactMobile} inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile number" />
        <Field label="Contact email" name="contactEmail" type="email" defaultValue={record?.contactEmail} />
        <Field label="Contact occupation" name="contactOccupation" defaultValue={record?.contactOccupation} />
        <Field label="Occupation details (if Other)" name="contactOccupationDetails" defaultValue={record?.contactOccupationDetails} />
        {/* Guardian (kept from earlier model). */}
        <Field label="Guardian name" name="guardianName" defaultValue={record?.guardianName} />
        <Field label="Guardian mobile" name="guardianPhone" type="tel" defaultValue={record?.guardianPhone} inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile number" />
      </Section>

      <Section title="Permanent address">
        <AddressFields
          names={{
            address: "address",
            city: "permCity",
            district: "district",
            state: "state",
            country: "permCountry",
            pincode: "pincode",
          }}
          defaults={{
            address: record?.address,
            city: record?.permCity,
            district: record?.district,
            state: record?.state,
            country: record?.permCountry,
            pincode: record?.pincode,
          }}
        />
      </Section>

      <Section title="Correspondence address" grid={false}>
        <label className="flex items-center gap-2 text-sm text-text-primary mb-4">
          <input
            type="checkbox"
            name="corrSameAsPermanent"
            checked={corrSame}
            onChange={(e) => setCorrSame(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          Same as permanent address
        </label>
        {!corrSame && (
          <AddressFields
            names={{
              address: "corrAddress",
              city: "corrCity",
              district: "corrDistrict",
              state: "corrState",
              country: "corrCountry",
              pincode: "corrPincode",
            }}
            defaults={{
              address: record?.corrAddress,
              city: record?.corrCity,
              district: record?.corrDistrict,
              state: record?.corrState,
              country: record?.corrCountry,
              pincode: record?.corrPincode,
            }}
          />
        )}
      </Section>

      <Section title="Admission preference">
        <label className="block">
          <span className={labelCls}>Looking for</span>
          <select
            name="programLevel"
            value={programLevel}
            onChange={(e) => setProgramLevel(e.target.value)}
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
          <span className={labelCls}>Course / Program</span>
          <select name="courseId" defaultValue={record?.courseId ?? ""} className={inputCls}>
            <option value="">Select…</option>
            {filteredCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <SelectField label="Specialization type" name="specializationType" defaultValue={record?.specializationType} options={["Single", "Dual"]} />
        <Field label="Specialization" name="specialization" defaultValue={record?.specialization} className="sm:col-span-2" />
      </Section>

      <Section title="Qualification details" grid={false}>
        <QualificationsField
          defaultValue={record?.qualifications}
          programLevel={programLevel}
        />
      </Section>

      <Section title="Documents & certificates" grid={false}>
        <DocumentsField defaultValue={record?.documents} />
        <label className="block mt-4">
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
