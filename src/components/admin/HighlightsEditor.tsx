"use client";

export interface UniversityHighlights {
  naac?: string;
  established?: string;
  approvals?: string;
  students?: string;
  accreditation?: string;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {f.label}
          </label>
          <input
            type="text"
            value={value[f.key] ?? ""}
            onChange={(e) => update(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );
}
