"use client";

export interface UniversityHighlights {
  naac?: string;
  established?: string;
  approvals?: string;
  students?: string;
  accreditation?: string;
  /** When true, the public site shows an "Admissions Open" badge for this university. */
  admissionOpen?: boolean;
}

interface Props {
  value: UniversityHighlights;
  onChange: (v: UniversityHighlights) => void;
}

const FIELDS: {
  key: keyof UniversityHighlights;
  label: string;
  placeholder: string;
}[] = [
  { key: "naac", label: "NAAC Grade", placeholder: "e.g. A++" },
  { key: "established", label: "Established Year", placeholder: "e.g. 1998" },
  {
    key: "approvals",
    label: "Approvals / Recognitions",
    placeholder: "e.g. UGC, AICTE, AIU",
  },
  { key: "students", label: "Student Count", placeholder: "e.g. 50,000+" },
  {
    key: "accreditation",
    label: "Accreditation Body",
    placeholder: "e.g. NBA, NIRF Rank 42",
  },
];

export default function HighlightsEditor({ value, onChange }: Props) {
  function update(key: keyof UniversityHighlights, val: string) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </label>
            <input
              type="text"
              value={(value[f.key] as string) ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      {/* Admissions Open — drives the "Admissions Open" badge on the public homepage */}
      <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={value.admissionOpen ?? false}
          onChange={(e) => onChange({ ...value, admissionOpen: e.target.checked })}
          className="mt-0.5 rounded"
        />
        <span>
          <span className="block text-sm font-medium text-gray-800">
            Admissions Open
          </span>
          <span className="block text-xs text-gray-400 mt-0.5">
            Shows a green “Admissions Open” badge for this university on the
            public homepage carousel. Turn off when the intake closes.
          </span>
        </span>
      </label>
    </div>
  );
}
