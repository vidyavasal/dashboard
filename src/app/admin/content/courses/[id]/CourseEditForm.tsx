"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import TabNav from "@/components/admin/TabNav";
import ImageUploader from "@/components/admin/ImageUploader";
import type {
  Course,
  CourseFeeStructure,
  CourseFeeBreakdown,
} from "@/lib/db/external";
import { saveCourse, type BreakdownRowData, type OtherFeeRowData } from "../actions";

const MarkdownEditor = dynamic(
  () => import("@/components/admin/MarkdownEditor"),
  { ssr: false }
);

const TABS = ["Info", "Brochure", "Fee Structure"];

export type CourseWithFee = Course & {
  feeStructure: CourseFeeStructure | null;
  breakdowns: CourseFeeBreakdown[];
  universityName: string | null;
};

const STARTING_FEE_UNITS = [
  "per semester",
  "per year",
  "first semester",
  "first year",
  "one-time",
  "university fee",
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function CourseEditForm({ course: c }: { course: CourseWithFee }) {
  const router = useRouter();
  const [tab, setTab] = useState("Info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(c.name);
  const [shortName, setShortName] = useState(c.shortName ?? "");
  const [slug, setSlug] = useState(c.slug ?? "");
  const [courseType, setCourseType] = useState(c.courseType ?? "UG");
  const [deliveryMode, setDeliveryMode] = useState(c.deliveryMode ?? "Online");
  const [durationYears, setDurationYears] = useState(
    c.durationYears?.toString() ?? ""
  );
  const [totalSemesters, setTotalSemesters] = useState(
    c.totalSemesters?.toString() ?? ""
  );
  const [eligibility, setEligibility] = useState(c.eligibility ?? "");
  const [description, setDescription] = useState(c.description ?? "");
  const [isOnline, setIsOnline] = useState(c.isOnline ?? true);
  const [isDistance, setIsDistance] = useState(c.isDistance ?? false);
  const [specializations, setSpecializations] = useState<string[]>(
    c.specializations ?? []
  );
  const [specDraft, setSpecDraft] = useState("");

  const [bannerImage, setBannerImage] = useState(c.bannerImage ?? "");
  const [content, setContent] = useState(c.content ?? "");

  const fee = c.feeStructure;
  const [feeOnRequest, setFeeOnRequest] = useState(fee?.feeOnRequest ?? false);
  const [paymentCycle, setPaymentCycle] = useState(fee?.paymentCycle ?? "yearly");
  const [registrationFee, setRegistrationFee] = useState(
    fee?.registrationFee ?? "0"
  );
  const [admissionFee, setAdmissionFee] = useState(fee?.admissionFee ?? "0");
  const [processingFee, setProcessingFee] = useState(fee?.processingFee ?? "0");
  const [courseFee, setCourseFee] = useState(fee?.courseFee ?? "0");
  const [examFee, setExamFee] = useState(fee?.examFee ?? "0");
  const [certificateFee, setCertificateFee] = useState(
    fee?.certificateFee ?? "0"
  );
  const [yearlyFee, setYearlyFee] = useState(fee?.yearlyFee ?? "");
  const [totalFee, setTotalFee] = useState(fee?.totalFee ?? "");
  const [offerFee, setOfferFee] = useState(fee?.offerFee ?? "");
  const [startingFee, setStartingFee] = useState(fee?.startingFee ?? "");
  const [startingFeeUnit, setStartingFeeUnit] = useState(
    fee?.startingFeeUnit ?? "per semester"
  );
  const [feeNote, setFeeNote] = useState(fee?.feeNote ?? "");
  const [emiAvailable, setEmiAvailable] = useState(fee?.emiAvailable ?? false);

  const [rows, setRows] = useState<BreakdownRowData[]>(
    c.breakdowns.map((b) => ({
      label: b.label ?? "",
      amount: b.amount ?? "",
      periodType: (b.periodType as BreakdownRowData["periodType"]) ?? "year",
      periodNumber: b.periodNumber ?? 1,
      note: b.note ?? "",
    }))
  );
  const [otherFees, setOtherFees] = useState<OtherFeeRowData[]>(
    (fee?.otherFees ?? []).map((o) => ({
      label: o.label,
      amount: String(o.amount),
      recurrence: o.recurrence,
      included: o.included,
    }))
  );

  const installmentsSum = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [rows]
  );
  const firstInstallment = rows.length ? Number(rows[0].amount) || 0 : 0;

  function addSpec() {
    const parts = specDraft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) setSpecializations((prev) => [...prev, ...parts]);
    setSpecDraft("");
  }

  function generateRows() {
    const type = paymentCycle === "semester" ? "semester" : "year";
    const count =
      type === "semester"
        ? parseInt(totalSemesters, 10) ||
          Math.round((parseFloat(durationYears) || 1) * 2)
        : Math.round(parseFloat(durationYears) || 1);
    setRows(
      Array.from({ length: Math.max(count, 1) }, (_, i) => ({
        label: `${type === "semester" ? "Semester" : "Year"} ${i + 1}`,
        amount: rows[i]?.amount ?? "",
        periodType: type,
        periodNumber: i + 1,
        note: rows[i]?.note ?? "",
      }))
    );
  }

  function updateRow(i: number, patch: Partial<BreakdownRowData>) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function updateOther(i: number, patch: Partial<OtherFeeRowData>) {
    setOtherFees((prev) =>
      prev.map((r, j) => (j === i ? { ...r, ...patch } : r))
    );
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveCourse(c.id, {
        name,
        shortName,
        slug,
        courseType,
        deliveryMode,
        durationYears,
        totalSemesters,
        eligibility,
        description,
        content,
        bannerImage,
        isOnline,
        isDistance,
        specializations,
        feeStructure: {
          feeOnRequest,
          paymentCycle,
          registrationFee: registrationFee ?? "",
          admissionFee: admissionFee ?? "",
          processingFee: processingFee ?? "",
          courseFee: courseFee ?? "",
          examFee: examFee ?? "",
          certificateFee: certificateFee ?? "",
          yearlyFee: yearlyFee ?? "",
          totalFee: totalFee ?? "",
          offerFee: offerFee ?? "",
          startingFee: startingFee ?? "",
          startingFeeUnit,
          feeNote,
          emiAvailable,
          otherFees,
          breakdowns: feeOnRequest ? [] : rows,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content/courses"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{c.name}</h1>
            <p className="text-xs text-gray-400">{c.universityName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium">✓ Saved</span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <TabNav tabs={TABS} active={tab} onChange={setTab} />

      {tab === "Info" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Field
              label="Short Name / Degree Key"
              value={shortName}
              onChange={setShortName}
              placeholder="e.g. MBA — used for course-wise browsing"
            />
            <Field
              label="URL Slug"
              value={slug}
              onChange={setSlug}
              placeholder="e.g. sgvu-bba"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Type
              </label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UG">UG (Undergraduate)</option>
                <option value="PG">PG (Postgraduate)</option>
                <option value="PG Diploma">PG Diploma</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Mode
              </label>
              <select
                value={deliveryMode}
                onChange={(e) => setDeliveryMode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Online">Online</option>
                <option value="ODL">ODL (Open Distance Learning)</option>
                <option value="Online / Distance">Online / Distance</option>
                <option value="Online / ODL">Online / ODL</option>
                <option value="Distance">Distance</option>
                <option value="ODL · WLP">ODL · WLP (Work-Linked)</option>
                <option value="Center-based">Center-based</option>
              </select>
            </div>
            <Field
              label="Duration (Years)"
              value={durationYears}
              onChange={setDurationYears}
              placeholder="e.g. 3"
            />
            <Field
              label="Total Semesters"
              value={totalSemesters}
              onChange={setTotalSemesters}
              placeholder="e.g. 6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specializations
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {specializations.map((s, i) => (
                <span
                  key={`${s}-${i}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() =>
                      setSpecializations((prev) =>
                        prev.filter((_, j) => j !== i)
                      )
                    }
                    className="text-blue-400 hover:text-blue-700"
                    aria-label={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              {specializations.length === 0 && (
                <span className="text-xs text-gray-400">
                  No specializations added
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={specDraft}
                onChange={(e) => setSpecDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSpec();
                  }
                }}
                placeholder="Type a specialization (comma-separate for several) and press Enter"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSpec}
                className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Add
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eligibility
            </label>
            <textarea
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              rows={2}
              placeholder="e.g. 10+2 from a recognized board with 50% marks"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="One-line description shown in course cards"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="rounded"
              />
              Online
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isDistance}
                onChange={(e) => setIsDistance(e.target.checked)}
                className="rounded"
              />
              Distance / ODL
            </label>
          </div>
        </div>
      )}

      {tab === "Brochure" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <ImageUploader
              value={bannerImage}
              onChange={setBannerImage}
              folder="/iode/courses/banners"
              label="Course Banner Image (16:9)"
              aspectRatio="16/5"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Course Brochure Content (Markdown)
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Describe the course in detail — curriculum, career outcomes, who
              should apply, highlights.
            </p>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              folder="/iode/courses/content"
              height={480}
            />
          </div>
        </div>
      )}

      {tab === "Fee Structure" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={feeOnRequest}
                onChange={(e) => setFeeOnRequest(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Fee on request
              </span>
              <span className="text-xs text-gray-400">
                Amounts stay hidden on the site; students are asked to contact
                the counsellor.
              </span>
            </label>
          </div>

          {!feeOnRequest && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Installments
                    </p>
                    <p className="text-xs text-gray-400">
                      Year-wise or semester-wise payments shown in the fee
                      table.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={paymentCycle ?? "yearly"}
                      onChange={(e) => setPaymentCycle(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="yearly">Yearly</option>
                      <option value="semester">Semester-wise</option>
                      <option value="one_time">One-time</option>
                    </select>
                    <button
                      type="button"
                      onClick={generateRows}
                      className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      Generate rows
                    </button>
                  </div>
                </div>

                {rows.length > 0 ? (
                  <div className="space-y-2">
                    {rows.map((r, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={r.label}
                          onChange={(e) =>
                            updateRow(i, { label: e.target.value })
                          }
                          placeholder="Label"
                          className="w-36 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={r.amount}
                            onChange={(e) =>
                              updateRow(i, { amount: e.target.value })
                            }
                            className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          value={r.note}
                          onChange={(e) =>
                            updateRow(i, { note: e.target.value })
                          }
                          placeholder="Note (e.g. Payable ₹8,000 per semester)"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) => prev.filter((_, j) => j !== i))
                          }
                          className="text-gray-300 hover:text-red-500 px-1"
                          aria-label="Remove row"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                    No installment rows — choose a cycle and press “Generate
                    rows”, or add manually.
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRows((prev) => [
                        ...prev,
                        {
                          label: "",
                          amount: "",
                          periodType:
                            paymentCycle === "semester" ? "semester" : "year",
                          periodNumber: prev.length + 1,
                          note: "",
                        },
                      ])
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add row
                  </button>
                  {installmentsSum > 0 && (
                    <p className="text-xs text-gray-500">
                      Installments sum to{" "}
                      <span className="font-semibold text-gray-700">
                        {inr(installmentsSum)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Component Fees (INR)
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  One-time / recurring charges. Mention in the note below
                  whether they are already included in the installments.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <FeeField
                    label="Registration Fee"
                    value={registrationFee ?? ""}
                    onChange={setRegistrationFee}
                  />
                  <FeeField
                    label="Admission Fee"
                    value={admissionFee ?? ""}
                    onChange={setAdmissionFee}
                  />
                  <FeeField
                    label="Processing Fee"
                    value={processingFee ?? ""}
                    onChange={setProcessingFee}
                  />
                  <FeeField
                    label="Exam Fee"
                    value={examFee ?? ""}
                    onChange={setExamFee}
                  />
                  <FeeField
                    label="Certificate Fee"
                    value={certificateFee ?? ""}
                    onChange={setCertificateFee}
                  />
                  <FeeField
                    label="Course / University Fee"
                    value={courseFee ?? ""}
                    onChange={setCourseFee}
                  />
                </div>

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Other Fees
                  </p>
                  {otherFees.map((o, i) => (
                    <div key={i} className="flex gap-2 items-center mb-2">
                      <input
                        value={o.label}
                        onChange={(e) =>
                          updateOther(i, { label: e.target.value })
                        }
                        placeholder="Label (e.g. GST, Alumni Fee)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={o.amount}
                          onChange={(e) =>
                            updateOther(i, { amount: e.target.value })
                          }
                          className="w-full pl-7 pr-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <select
                        value={o.recurrence}
                        onChange={(e) =>
                          updateOther(i, {
                            recurrence: e.target
                              .value as OtherFeeRowData["recurrence"],
                          })
                        }
                        className="px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="one_time">One-time</option>
                        <option value="per_year">Per year</option>
                        <option value="per_semester">Per semester</option>
                      </select>
                      <label
                        className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap"
                        title="Already included in the total fee"
                      >
                        <input
                          type="checkbox"
                          checked={o.included}
                          onChange={(e) =>
                            updateOther(i, { included: e.target.checked })
                          }
                          className="rounded"
                        />
                        Included
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setOtherFees((prev) =>
                            prev.filter((_, j) => j !== i)
                          )
                        }
                        className="text-gray-300 hover:text-red-500 px-1"
                        aria-label="Remove fee"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setOtherFees((prev) => [
                        ...prev,
                        {
                          label: "",
                          amount: "",
                          recurrence: "one_time",
                          included: true,
                        },
                      ])
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add other fee
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm font-medium text-gray-700 mb-4">
                  Totals &amp; Display
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <FeeField
                    label="Yearly Fee"
                    value={yearlyFee ?? ""}
                    onChange={setYearlyFee}
                  />
                  <FeeField
                    label="Total Fee"
                    value={totalFee ?? ""}
                    onChange={setTotalFee}
                    highlight
                  />
                  <FeeField
                    label="Offer / Discounted Total"
                    value={offerFee ?? ""}
                    onChange={setOfferFee}
                  />
                  <FeeField
                    label='Starting Fee ("from ₹X")'
                    value={startingFee ?? ""}
                    onChange={setStartingFee}
                    highlight
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Fee Unit
                    </label>
                    <select
                      value={startingFeeUnit ?? "per semester"}
                      onChange={(e) => setStartingFeeUnit(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STARTING_FEE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={emiAvailable}
                        onChange={(e) => setEmiAvailable(e.target.checked)}
                        className="rounded"
                      />
                      EMI Available
                    </label>
                  </div>
                </div>
                {firstInstallment > 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    Hint: first installment is {inr(firstInstallment)}; the
                    lowest amount a student pays to start is usually the
                    starting fee.
                  </p>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Note
                  </label>
                  <textarea
                    value={feeNote ?? ""}
                    onChange={(e) => setFeeNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Exam fee ₹2,000/yr included in year fee. Discounts on one-time payment."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function FeeField({
  label,
  value,
  onChange,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          ₹
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-7 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            highlight
              ? "border-blue-300 bg-blue-50 font-medium"
              : "border-gray-300"
          }`}
        />
      </div>
    </div>
  );
}
