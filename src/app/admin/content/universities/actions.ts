"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { universities } from "@/lib/db/external";
import { requireRole } from "@/lib/session";
import type { UniversityHighlights } from "@/components/admin/HighlightsEditor";
import { encodeId } from "@/lib/ids";

export interface UniversityFormData {
  name: string;
  shortName: string;
  code: string;
  slug: string;
  website: string;
  universityType: string;
  state: string;
  city: string;
  logoUrl: string;
  isActive: boolean;
  bannerImage: string;
  content: string;
  highlights: UniversityHighlights;
  galleryImages: string[];
}

// Writes to the main site's `universities` table via the runtime mirror — the
// same rows the public site renders. Available to owners and hired `staff`.
export async function saveUniversity(id: string, data: UniversityFormData) {
  await requireRole("owner", "staff");

  const empty = (v: string) => (v.trim() === "" ? null : v.trim());

  await db
    .update(universities)
    .set({
      name: data.name.trim(),
      shortName: empty(data.shortName),
      code: empty(data.code),
      slug: empty(data.slug),
      website: empty(data.website),
      universityType: empty(data.universityType),
      state: empty(data.state),
      city: empty(data.city),
      logoUrl: empty(data.logoUrl),
      isActive: data.isActive,
      bannerImage: empty(data.bannerImage),
      content: empty(data.content),
      highlights: data.highlights,
      galleryImages: data.galleryImages,
      updatedAt: new Date(),
    })
    .where(eq(universities.id, id));

  revalidatePath("/admin/content/universities");
  revalidatePath(`/admin/content/universities/${encodeId(id)}`);
}

export async function createUniversity(formData: FormData) {
  await requireRole("owner", "staff");
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const slug =
    (slugRaw ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")) || null;

  const [created] = await db
    .insert(universities)
    .values({ name, slug })
    .returning({ id: universities.id });

  revalidatePath("/admin/content/universities");
  redirect(`/admin/content/universities/${encodeId(created.id)}`);
}

export async function deleteUniversity(formData: FormData) {
  await requireRole("owner", "staff");
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await db.delete(universities).where(eq(universities.id, id));
  revalidatePath("/admin/content/universities");
}
