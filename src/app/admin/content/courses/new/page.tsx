import Link from "next/link";
import { requireRole } from "@/lib/session";
import { getUniversityOptions } from "@/lib/lookups";
import { createCourse } from "../actions";

export default async function NewCoursePage() {
  await requireRole("owner", "staff");
  const universityOptions = await getUniversityOptions();

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/content/courses"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add Course</h1>
      </div>

      <form
        action={createCourse}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
      >
        <p className="text-sm text-gray-500">
          Pick the university and name the course; add brochure, fees and details
          on the next screen.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            University *
          </label>
          <select
            name="universityId"
            required
            defaultValue=""
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select a university…
            </option>
            {universityOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course Name *
          </label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Bachelor of Business Administration"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Slug
          </label>
          <input
            name="slug"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="auto-generated from name if left blank"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Create & continue
        </button>
      </form>
    </div>
  );
}
