import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createUniversity } from "../actions";

export default async function NewUniversityPage() {
  await requireRole("owner", "staff");

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/content/universities"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Add University</h1>
      </div>

      <form
        action={createUniversity}
        className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
      >
        <p className="text-sm text-gray-500">
          Create the university, then add logo, banner, brochure, highlights and
          gallery on the next screen.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            University Name *
          </label>
          <input
            name="name"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Amrita Vishwa Vidyapeetham"
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
