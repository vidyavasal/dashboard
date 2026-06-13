"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trackerLeads, studentProfiles } from "@/lib/db/schema";
import { universities, courses } from "@/lib/db/external";
import { requireSession, requireRole } from "@/lib/session";
import { reqStr, str } from "@/lib/parse";
import { parseCsv } from "@/lib/csv";
import { generateFormToken } from "@/lib/token";
import { encodeId } from "@/lib/ids";
import {
  LEAD_IMPORT_COLUMNS,
  LEAD_STATUS_VALUES,
  PROGRAM_LEVELS,
  SEX_OPTIONS,
  subStatusesFor,
} from "@/lib/lead-status";

function parseAge(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 && n < 120 ? n : null;
}

export async function saveLead(formData: FormData) {
  await requireSession();
  const id = str(formData, "id");

  const status = str(formData, "status") ?? "new";
  const subStatus = str(formData, "subStatus");

  const values = {
    name: reqStr(formData, "name"),
    phone: reqStr(formData, "phone"),
    email: str(formData, "email"),
    age: parseAge(str(formData, "age")),
    sex: str(formData, "sex"),
    programLevel: str(formData, "programLevel"),
    universityId: str(formData, "universityId"),
    courseId: str(formData, "courseId"),
    status: LEAD_STATUS_VALUES.includes(status) ? status : "new",
    // Only keep a sub-status that belongs to the chosen status.
    subStatus:
      subStatus && subStatusesFor(status).includes(subStatus)
        ? subStatus
        : null,
    assignedToId: str(formData, "assignedToId"),
    followUpDate: str(formData, "followUpDate"),
    notes: str(formData, "notes"),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(trackerLeads).set(values).where(eq(trackerLeads.id, id));
  } else {
    await db.insert(trackerLeads).values({ ...values, source: "manual" });
  }

  revalidatePath("/admin/leads");
  // Edits return to the lead's details page; new leads go to the list.
  redirect(id ? `/admin/leads/${encodeId(id)}` : "/admin/leads");
}

/** Quick status change from the lead details page (no full edit). */
export async function updateLeadStatus(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");
  const status = str(formData, "status") ?? "new";
  const subStatus = str(formData, "subStatus");

  await db
    .update(trackerLeads)
    .set({
      status: LEAD_STATUS_VALUES.includes(status) ? status : "new",
      subStatus:
        subStatus && subStatusesFor(status).includes(subStatus)
          ? subStatus
          : null,
      followUpDate: str(formData, "followUpDate"),
      updatedAt: new Date(),
    })
    .where(eq(trackerLeads.id, id));

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${encodeId(id)}`);
}

export async function deleteLead(formData: FormData) {
  await requireRole("owner", "staff");
  const id = reqStr(formData, "id");
  await db.delete(trackerLeads).where(eq(trackerLeads.id, id));
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

/**
 * Convert a lead: create a SEPARATE student-profile record (the lead row
 * stays as-is, only its status flips to "converted"). Idempotent — if the
 * lead already has a profile, just go there.
 */
export async function convertLead(formData: FormData) {
  await requireSession();
  const id = reqStr(formData, "id");

  const [lead] = await db
    .select()
    .from(trackerLeads)
    .where(eq(trackerLeads.id, id))
    .limit(1);
  if (!lead) throw new Error("Lead not found.");

  const [existing] = await db
    .select({ id: studentProfiles.id })
    .from(studentProfiles)
    .where(eq(studentProfiles.leadId, id))
    .limit(1);
  if (existing) {
    redirect(`/admin/profiles/${encodeId(existing.id)}`);
  }

  const [profile] = await db
    .insert(studentProfiles)
    .values({
      leadId: lead.id,
      formToken: generateFormToken(),
      status: "profile_pending",
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      age: lead.age,
      sex: lead.sex,
      programLevel: lead.programLevel,
      universityId: lead.universityId,
      courseId: lead.courseId,
      assignedToId: lead.assignedToId,
    })
    .returning({ id: studentProfiles.id });

  await db
    .update(trackerLeads)
    .set({ status: "converted", subStatus: null, updatedAt: new Date() })
    .where(eq(trackerLeads.id, id));

  revalidatePath("/admin/leads");
  revalidatePath("/admin/profiles");
  redirect(`/admin/profiles/${encodeId(profile.id)}`);
}

// ── CSV import ───────────────────────────────────────────────────────────────

export interface ImportResult {
  done: boolean;
  imported: number;
  errors: string[];
}

const PROGRAM_LEVEL_VALUES = PROGRAM_LEVELS.map((p) => p.value);
const SEX_VALUES = SEX_OPTIONS.map((s) => s.value);

export async function importLeadsCsv(
  _prev: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { done: true, imported: 0, errors: ["Choose a CSV file first."] };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { done: true, imported: 0, errors: ["File too large (max 2 MB)."] };
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) {
    return {
      done: true,
      imported: 0,
      errors: ["File has no data rows (expected a header row + data rows)."],
    };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: (typeof LEAD_IMPORT_COLUMNS)[number]) => header.indexOf(name);
  if (col("name") === -1 || col("phone") === -1) {
    return {
      done: true,
      imported: 0,
      errors: [
        `Header must include at least "name" and "phone". Found: ${header.join(", ")}. Download the template for the exact format.`,
      ],
    };
  }

  // Resolve university/course names -> ids (case-insensitive exact match).
  const [allUnis, allCourses] = await Promise.all([
    db.select({ id: universities.id, name: universities.name }).from(universities),
    db
      .select({ id: courses.id, name: courses.name, universityId: courses.universityId })
      .from(courses),
  ]);
  const uniByName = new Map(allUnis.map((u) => [u.name.trim().toLowerCase(), u.id]));
  const courseByName = new Map(
    allCourses.map((c) => [c.name.trim().toLowerCase(), c])
  );

  const errors: string[] = [];
  const values: (typeof trackerLeads.$inferInsert)[] = [];

  for (let i = 1; i < rows.length; i++) {
    const line = i + 1; // 1-based, header is line 1
    const cell = (name: (typeof LEAD_IMPORT_COLUMNS)[number]) => {
      const idx = col(name);
      const v = idx === -1 ? "" : (rows[i][idx] ?? "").trim();
      return v === "" ? null : v;
    };

    const name = cell("name");
    const phone = cell("phone");
    if (!name || !phone) {
      errors.push(`Line ${line}: skipped — name and phone are mandatory.`);
      continue;
    }

    const uniName = cell("university");
    const universityId = uniName
      ? (uniByName.get(uniName.toLowerCase()) ?? null)
      : null;
    if (uniName && !universityId) {
      errors.push(`Line ${line}: university "${uniName}" not found — left blank.`);
    }

    const courseName = cell("course");
    let courseId: string | null = null;
    if (courseName) {
      const c = courseByName.get(courseName.toLowerCase());
      if (!c) {
        errors.push(`Line ${line}: course "${courseName}" not found — left blank.`);
      } else if (universityId && c.universityId && c.universityId !== universityId) {
        errors.push(
          `Line ${line}: course "${courseName}" belongs to a different university — left blank.`
        );
      } else {
        courseId = c.id;
      }
    }

    const rawStatus = cell("status")?.toLowerCase().replace(/[\s-]+/g, "_");
    const status =
      rawStatus && LEAD_STATUS_VALUES.includes(rawStatus) ? rawStatus : "new";
    if (rawStatus && status !== rawStatus) {
      errors.push(`Line ${line}: unknown status "${rawStatus}" — set to "new".`);
    }
    const subStatus = cell("sub_status");

    const rawLevel = cell("program_level")?.toLowerCase().replace(/[\s-]+/g, "_");
    const programLevel =
      rawLevel && PROGRAM_LEVEL_VALUES.includes(rawLevel) ? rawLevel : null;

    const rawSex = cell("sex")?.toLowerCase();
    const sex = rawSex && SEX_VALUES.includes(rawSex) ? rawSex : null;

    const followUp = cell("follow_up_date");
    const followUpDate =
      followUp && /^\d{4}-\d{2}-\d{2}$/.test(followUp) ? followUp : null;

    values.push({
      name,
      phone,
      email: cell("email"),
      age: parseAge(cell("age")),
      sex,
      programLevel,
      universityId,
      courseId,
      status,
      subStatus:
        subStatus && subStatusesFor(status).includes(subStatus)
          ? subStatus
          : null,
      followUpDate,
      notes: cell("notes"),
      source: "csv_import",
    });
  }

  if (values.length > 0) {
    // Insert in chunks to stay within the HTTP driver's limits.
    for (let i = 0; i < values.length; i += 200) {
      await db.insert(trackerLeads).values(values.slice(i, i + 200));
    }
    revalidatePath("/admin/leads");
  }

  return { done: true, imported: values.length, errors };
}
