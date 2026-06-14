"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { encodeId } from "@/lib/ids";

export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  body: string;
  author: string;
  status: string; // draft | published
}

const empty = (v: string) => (v.trim() === "" ? null : v.trim());

export async function saveBlogPost(id: string, data: BlogFormData) {
  await requireRole("owner", "staff");

  // Load current status to know if we're transitioning to published.
  const [current] = await db
    .select({ status: blogPosts.status, publishedAt: blogPosts.publishedAt })
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  // Stamp publishedAt the first time a post becomes published.
  const publishedAt =
    data.status === "published"
      ? (current?.publishedAt ?? new Date())
      : current?.publishedAt ?? null;

  await db
    .update(blogPosts)
    .set({
      title: data.title.trim(),
      slug: data.slug.trim(),
      excerpt: empty(data.excerpt),
      coverImage: empty(data.coverImage),
      body: empty(data.body),
      author: empty(data.author),
      status: data.status,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidatePath("/admin/content/blog");
  revalidatePath(`/admin/content/blog/${encodeId(id)}`);
}

export async function createBlogPost(formData: FormData) {
  await requireRole("owner", "staff");
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  if (!title) throw new Error("Title is required");

  const slug =
    slugRaw ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const [created] = await db
    .insert(blogPosts)
    .values({ title, slug })
    .returning({ id: blogPosts.id });

  revalidatePath("/admin/content/blog");
  redirect(`/admin/content/blog/${encodeId(created.id)}`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/admin/content/blog");
}
