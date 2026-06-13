import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import BlogEditForm from "./BlogEditForm";
import { decodeId } from "@/lib/ids";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("owner", "staff");
  const { id: idToken } = await params;
  const id = decodeId(idToken);
  if (!id) notFound();
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);
  if (!post) notFound();
  return <BlogEditForm post={post} />;
}
