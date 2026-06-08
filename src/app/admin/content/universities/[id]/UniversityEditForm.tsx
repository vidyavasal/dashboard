"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { University } from "@/lib/db/external";
import TabNav from "@/components/admin/TabNav";
import ImageUploader from "@/components/admin/ImageUploader";
import GalleryUploader from "@/components/admin/GalleryUploader";
import HighlightsEditor, {
  type UniversityHighlights,
} from "@/components/admin/HighlightsEditor";
import { saveUniversity } from "../actions";

const MarkdownEditor = dynamic(
  () => import("@/components/admin/MarkdownEditor"),
  { ssr: false }
);

const TABS = ["Info", "Brochure", "Highlights", "Gallery", "Courses"];

type CourseSummary = {
  id: string;
  name: string;
  slug: string | null;
  courseType: string | null;
  deliveryMode: string | null;
  totalFee: string | null;
};

interface Props {
  university: University;
  courses: CourseSummary[];
}

export default function UniversityEditForm({
  university: uni,
  courses,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState("Info");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Info
  const [name, setName] = useState(uni.name);
  const [shortName, setShortName] = useState(uni.shortName ?? "");
  const [code, setCode] = useState(uni.code ?? "");
  const [slug, setSlug] = useState(uni.slug ?? "");
  const [website, setWebsite] = useState(uni.website ?? "");
  const [universityType, setUniversityType] = useState(
    uni.universityType ?? ""
  );
  const [state, setState] = useState(uni.state ?? "");
  const [city, setCity] = useState(uni.city ?? "");
  const [logoUrl, setLogoUrl] = useState(uni.logoUrl ?? "");
  const [isActive, setIsActive] = useState(uni.isActive ?? true);

  // Brochure
  const [bannerImage, setBannerImage] = useState(uni.bannerImage ?? "");
  const [content, setContent] = useState(uni.content ?? "");

  // Highlights
  const [highlights, setHighlights] = useState<UniversityHighlights>(
    (uni.highlights as UniversityHighlights) ?? {}
  );

  // Gallery
  const [galleryImages, setGalleryImages] = useState<string[]>(
    uni.galleryImages ?? []
  );

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await saveUniversity(uni.id, {
        name,
        shortName,
        code,
        slug,
        website,
        universityType,
        state,
        city,
        logoUrl,
        isActive,
        bannerImage,
        content,
        highlights,
        galleryImages,
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
            href="/admin/content/universities"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{uni.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{uni.id}</p>
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
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="max-w-[180px]">
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              folder="/iode/universities/logos"
              label="University Logo / Icon"
              aspectRatio="1/1"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Square logo recommended (shown on cards & brochure).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="University Name *" value={name} onChange={setName} />
            <Field
              label="Short Name"
              value={shortName}
              onChange={setShortName}
              placeholder="e.g. AMRITA"
            />
            <Field
              label="Code"
              value={code}
              onChange={setCode}
              placeholder="e.g. AMRITA"
            />
            <Field
              label="URL Slug"
              value={slug}
              onChange={setSlug}
              placeholder="e.g. amrita-university"
            />
            <Field
              label="University Type"
              value={universityType}
              onChange={setUniversityType}
              placeholder="Deemed / State / Central / Private"
            />
            <Field
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="https://..."
            />
            <Field
              label="State"
              value={state}
              onChange={setState}
              placeholder="e.g. Tamil Nadu"
            />
            <Field
              label="City"
              value={city}
              onChange={setCity}
              placeholder="e.g. Coimbatore"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active (visible on public site)
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
              folder="/iode/universities/banners"
              label="Banner Image (16:9 recommended)"
              aspectRatio="16/5"
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Brochure Content (Markdown)
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Write about the university — overview, accreditations, USPs,
              campus, programs offered. Supports full markdown: headings, bold,
              lists, tables, images.
            </p>
            <MarkdownEditor
              value={content}
              onChange={setContent}
              folder="/iode/universities/content"
              height={500}
            />
          </div>
        </div>
      )}

      {tab === "Highlights" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Key Facts & Highlights
          </p>
          <p className="text-xs text-gray-400 mb-4">
            These appear as highlight badges on the university brochure page.
          </p>
          <HighlightsEditor value={highlights} onChange={setHighlights} />
        </div>
      )}

      {tab === "Gallery" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-1">
            Photo Gallery
          </p>
          <p className="text-xs text-gray-400 mb-4">
            Images shown in the gallery section of the university brochure page.
          </p>
          <GalleryUploader
            value={galleryImages}
            onChange={setGalleryImages}
            folder="/iode/universities/gallery"
          />
        </div>
      )}

      {tab === "Courses" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {courses.length} courses
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">
                  Course
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 hidden sm:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 hidden sm:table-cell">
                  Mode
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                  Total Fee
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5 font-medium text-gray-800">
                    {c.name}
                  </td>
                  <td className="px-4 py-2.5 hidden sm:table-cell">
                    {c.courseType && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.courseType === "UG"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {c.courseType}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell text-xs">
                    {c.deliveryMode ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 text-xs">
                    {c.totalFee
                      ? `₹${Number(c.totalFee).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/admin/content/courses/${c.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
