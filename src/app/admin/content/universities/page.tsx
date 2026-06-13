import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { universities, courses } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { encodeId } from "@/lib/ids";

export default async function AdminUniversitiesPage() {
  await requireRole("owner", "staff");

  const rows = await db
    .select({
      id: universities.id,
      name: universities.name,
      shortName: universities.shortName,
      slug: universities.slug,
      universityType: universities.universityType,
      state: universities.state,
      city: universities.city,
      isActive: universities.isActive,
      courseCount: sql<number>`(SELECT count(*) FROM ${courses} WHERE ${courses.universityId} = ${universities.id})`,
    })
    .from(universities)
    .orderBy(asc(universities.name));

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Universities</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} universities — content shown on the public site.
          </p>
        </div>
        <Link
          href="/admin/content/universities/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add University
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">
                University
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                Location
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                Courses
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((uni) => (
              <tr
                key={uni.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                      {uni.shortName?.slice(0, 2) ?? uni.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {uni.name}
                      </div>
                      {uni.slug && (
                        <div className="text-xs text-gray-400">
                          /universities/{uni.slug}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {uni.universityType ?? "—"}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {[uni.city, uni.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    {uni.courseCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      uni.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {uni.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/content/universities/${encodeId(uni.id)}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
