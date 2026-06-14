import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { formatDate } from "@/lib/format";
import { encodeId } from "@/lib/ids";

export default async function AdminBlogPage() {
  await requireRole("owner", "staff");
  const rows = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-1">
            {rows.length} posts — published ones appear on the public site.
          </p>
        </div>
        <Link
          href="/admin/content/blog/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Post
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">
                Author
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">
                Updated
              </th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  No posts yet.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.title}</div>
                  <div className="text-xs text-gray-400">/blog/{p.slug}</div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                  {p.author ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.status === "published"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                  {p.updatedAt ? formatDate(p.updatedAt) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/content/blog/${encodeId(p.id)}`}
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
    </div>
  );
}
