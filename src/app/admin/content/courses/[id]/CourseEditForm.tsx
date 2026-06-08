"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import TabNav from "@/components/admin/TabNav";
import ImageUploader from "@/components/admin/ImageUploader";
import type { Course, CourseFeeStructure } from "@/lib/db/external";
import { saveCourse } from "../actions";

const MarkdownEditor = dynamic(
  () => import("@/components/admin/MarkdownEditor"),
  { ssr: false }
);

const TABS = ["Info", "Brochure", "Fee Structure"];

export type CourseWithFee = Course & {
  feeStructure: CourseFeeStructure | null;
  universityName: string | null;
};

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

  const [bannerImage, setBannerImage] = useState(c.bannerImage ?? "");
  const [content, setContent] = useState(c.content ?? "");

  const fee = c.feeStructure;
  const [registrationFee, setRegistrationFee] = useState(
    fee?.registrationFee ?? "0"
  );
  const [admissionFee, setAdmissionFee] = useState(fee?.admissionFee ?? "0");
  const [courseFee, setCourseFee] = useState(fee?.courseFee ?? "0");
  const [examFee, setExamFee] = useState(fee?.examFee ?? "0");
  const [yearlyFee, setYearlyFee] = useState(fee?.yearlyFee ?? "");
  const [totalFee, setTotalFee] = useState(fee?.totalFee ?? "");
  const [emiAvailable, setEmiAvailable] = useState(fee?.emiAvailable ?? false);

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
        feeStructure: {
          registrationFee: registrationFee ?? "",
          admissionFee: admissionFee ?? "",
          courseFee: courseFee ?? "",
          examFee: examFee ?? "",
          yearlyFee: yearlyFee ?? "",
          totalFee: totalFee ?? "",
          emiAvailable,
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
              label="Short Name"
              value={shortName}
              onChange={setShortName}
              placeholder="e.g. BBA"
            />
            <Field
              label="URL Slug"
              value={slug}
              onChange={setSlug}
              placeholder="e.g. bba-general"
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
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-4">
            Fee Structure (INR)
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
              label="Course Fee"
              value={courseFee ?? ""}
              onChange={setCourseFee}
            />
            <FeeField
              label="Exam Fee"
              value={examFee ?? ""}
              onChange={setExamFee}
            />
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
          </div>
          <div className="mt-4">
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
