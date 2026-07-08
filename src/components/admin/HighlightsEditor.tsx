"use client";

export interface UniversityHighlights {
  naac?: string;
  established?: string;
  approvals?: string;
  students?: string;
  accreditation?: string;
  /** When true, the public site shows an "Admissions Open" badge for this university. */
  admissionOpen?: boolean;
  /** Delivery mode label shown on public cards, e.g. "Online", "ODL", "Online / Distance" */
  mode?: string;
  /** Marketing feature bullets shown on the public university page */
  features?: string[];
  /** University-wide fee note, e.g. "Exam fee included in the yearly fee" */
  feeNote?: string;
  /** Card gradient colors (set by seed; editable here if needed) */
  brandColor?: string;
  brandColor2?: string;
}

interface Props {
  value: UniversityHighlights;
  onChange: (v: UniversityHighlights) => void;
}

type TextKey = Exclude<
  keyof UniversityHighlights,
  "admissionOpen" | "features"
>;

const FIELDS: {
  key: TextKey;
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
    placeholder: "e.g. NAAC A+, Central University",
  },
  {
    key: "mode",
    label: "Delivery Mode Label",
    placeholder: "e.g. Online / ODL / Distance",
  },
];

export default function HighlightsEditor({ value, onChange }: Props) {
  function update(key: TextKey, val: string) {
    onChange({ ...value, [key]: val });
  }
  const features = value.features ?? [];
  function updateFeature(i: number, val: string) {
    onChange({
      ...value,
      features: features.map((f, j) => (j === i ? val : f)),
    });
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
              value={value[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feature Bullets
        </label>
        <p className="text-xs text-gray-400 mb-2">
          Shown as tick-marked highlights on the public university page.
        </p>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder="e.g. NAAC A+ accredited university"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    features: features.filter((_, j) => j !== i),
                  })
                }
                className="text-gray-300 hover:text-red-500 px-1"
                aria-label="Remove feature"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, features: [...features, ""] })}
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + Add feature
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fee Note
        </label>
        <p className="text-xs text-gray-400 mb-2">
          University-wide fee remark shown alongside course fee tables, e.g.
          “Exam fee ₹2,000/yr included in the yearly fee”.
        </p>
        <textarea
          value={value.feeNote ?? ""}
          onChange={(e) => onChange({ ...value, feeNote: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
