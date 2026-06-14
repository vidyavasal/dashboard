import Link from "next/link";
import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, universities, courseFeeStructures } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import { encodeId } from "@/lib/ids";

export default async function AdminCoursesPage() {
  await requireRole("owner", "staff");

  const rows = await db
    .select({
      id: courses.id,
      name: courses.name,
      slug: courses.slug,
      courseType: courses.courseType,
      deliveryMode: courses.deliveryMode,
      universityName: universities.name,
      totalFee: sql<string>`(SELECT total_fee FROM ${courseFeeStructures} WHERE course_id = ${courses.id} LIMIT 1)`,
    })
    .from(courses)
    .leftJoin(universities, eq(courses.universityId, universities.id))
    .orderBy(asc(universities.name), asc(courses.name));

  const grouped = rows.reduce<Record<string, typeof rows>>((acc, c) => {
    const key = c.universityName ?? "Unassigned";
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} courses across {Object.keys(grouped).length}{" "}
            universities
          </p>
        </div>
        <Link
          href="/admin/content/courses/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Course
        </Link>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([uniName, uniCourses]) => (
          <div
            key={uniName}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">{uniName}</h2>
              <span className="text-xs text-gray-400">
                {uniCourses.length} courses
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {uniCourses.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
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
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell text-xs">
                      {c.deliveryMode ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 text-xs text-right">
                      {c.totalFee
                        ? `₹${Number(c.totalFee).toLocaleString("en-IN")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/content/courses/${encodeId(c.id)}`}
                          className="text-xs text-blue-600 hover:underline"
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
        ))}
      </div>
    </div>
  );
}
