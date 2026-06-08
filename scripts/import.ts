/**
 * One-time data import from the Google-Sheets tracker (Phase 6).
 *
 * Usage:
 *   1. Export each sheet to CSV into ./data/ :
 *        data/staff.csv         (name, role, base_salary, join_date, status)
 *        data/commissions.csv   (university, commission_percent, incentive_per_admission)
 *        data/students.csv      (admission_date, student_name, phone, university, course,
 *                                model, university_fee, collected_from_student,
 *                                commission_percent, commission_amount, iode_profit,
 *                                sales_executive, incentive, payment_status, notes)
 *        data/expenses.csv      (expense_date, category, description, amount, paid_by)
 *        data/investments.csv   (investment_date, partner, amount, note)
 *
 *   2. Point DATABASE_URL at STAGING and dry-run:
 *        npx tsx scripts/import.ts --dry
 *      Review the "unmatched" report, fix names in the sheet/CSV, repeat.
 *
 *   3. Commit for real against STAGING, eyeball the Reports page, then re-run
 *      against PRODUCTION:
 *        npx tsx scripts/import.ts
 *        DATABASE_URL=$DATABASE_URL_PRODUCTION npx tsx scripts/import.ts
 *
 * Names are matched to ids; rows that don't match are REPORTED, never guessed.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { asc } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
  staff,
  students,
  expenses,
  investments,
  universityCommissions,
} from "../src/lib/db/schema";
import { universities, courses } from "../src/lib/db/external";
import { computeCommission } from "../src/lib/commission-model";

const DRY = process.argv.includes("--dry");
const DATA_DIR = join(process.cwd(), "data");

// ── Minimal CSV parser (handles quoted fields, commas, newlines) ─────────────
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function readCsv(name: string): Record<string, string>[] {
  const path = join(DATA_DIR, name);
  if (!existsSync(path)) {
    console.log(`  (skipping ${name} — file not found)`);
    return [];
  }
  return parseCsv(readFileSync(path, "utf8"));
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const moneyOrNull = (s: string) => {
  const n = parseFloat(s.replace(/[₹,]/g, ""));
  return Number.isFinite(n) ? String(n) : null;
};
const strOrNull = (s: string) => (s.trim() === "" ? null : s.trim());

async function main() {
  console.log(`\nIODE import ${DRY ? "(DRY RUN — no writes)" : "(LIVE)"}\n`);
  const unmatched: string[] = [];

  // ── Build lookup maps from the shared tables ──────────────────────────────
  const univRows = await db
    .select({ id: universities.id, name: universities.name })
    .from(universities)
    .orderBy(asc(universities.name));
  const courseRows = await db
    .select({ id: courses.id, name: courses.name })
    .from(courses);
  const univByName = new Map(univRows.map((u) => [norm(u.name), u.id]));
  const courseByName = new Map(courseRows.map((c) => [norm(c.name), c.id]));

  // ── Staff ─────────────────────────────────────────────────────────────────
  const staffCsv = readCsv("staff.csv");
  const staffByName = new Map<string, string>();
  for (const r of staffCsv) {
    const name = r.name;
    if (!name) continue;
    if (!DRY) {
      const [ins] = await db
        .insert(staff)
        .values({
          name,
          role: strOrNull(r.role ?? ""),
          baseSalary: moneyOrNull(r.base_salary ?? ""),
          joinDate: strOrNull(r.join_date ?? ""),
          status: strOrNull(r.status ?? "") ?? "active",
        })
        .returning({ id: staff.id });
      staffByName.set(norm(name), ins.id);
    }
  }
  console.log(`Staff: ${staffCsv.length} rows`);

  // If dry-run, still populate staffByName from existing DB for student matching.
  if (DRY) {
    const existing = await db
      .select({ id: staff.id, name: staff.name })
      .from(staff);
    for (const s of existing) staffByName.set(norm(s.name), s.id);
  }

  // ── University commissions ─────────────────────────────────────────────────
  const commCsv = readCsv("commissions.csv");
  for (const r of commCsv) {
    const uid = univByName.get(norm(r.university ?? ""));
    if (!uid) {
      unmatched.push(`commission → university "${r.university}"`);
      continue;
    }
    if (!DRY) {
      await db
        .insert(universityCommissions)
        .values({
          universityId: uid,
          commissionPercent: strOrNull(r.commission_percent ?? ""),
          incentivePerAdmission: moneyOrNull(r.incentive_per_admission ?? ""),
        })
        .onConflictDoUpdate({
          target: universityCommissions.universityId,
          set: {
            commissionPercent: strOrNull(r.commission_percent ?? ""),
            incentivePerAdmission: moneyOrNull(r.incentive_per_admission ?? ""),
          },
        });
    }
  }
  console.log(`Commissions: ${commCsv.length} rows`);

  // ── Students ───────────────────────────────────────────────────────────────
  const studentCsv = readCsv("students.csv");
  for (const r of studentCsv) {
    const universityId = r.university
      ? univByName.get(norm(r.university)) ?? null
      : null;
    const courseId = r.course ? courseByName.get(norm(r.course)) ?? null : null;
    const salesExecutiveId = r.sales_executive
      ? staffByName.get(norm(r.sales_executive)) ?? null
      : null;

    if (r.university && !universityId)
      unmatched.push(`student "${r.student_name}" → university "${r.university}"`);
    if (r.course && !courseId)
      unmatched.push(`student "${r.student_name}" → course "${r.course}"`);
    if (r.sales_executive && !salesExecutiveId)
      unmatched.push(
        `student "${r.student_name}" → exec "${r.sales_executive}"`
      );

    // Derive money fields if the sheet left them blank.
    const computed = computeCommission({
      universityFee: r.university_fee,
      collectedFromStudent: r.collected_from_student,
      commissionPercent: r.commission_percent,
      incentivePerAdmission: r.incentive,
    });

    if (!DRY) {
      await db.insert(students).values({
        admissionDate: strOrNull(r.admission_date ?? ""),
        studentName: r.student_name || "(unknown)",
        phone: strOrNull(r.phone ?? ""),
        universityId,
        courseId,
        model: strOrNull(r.model ?? ""),
        universityFee: moneyOrNull(r.university_fee ?? ""),
        collectedFromStudent: moneyOrNull(r.collected_from_student ?? ""),
        commissionPercent: strOrNull(r.commission_percent ?? ""),
        commissionAmount:
          moneyOrNull(r.commission_amount ?? "") ??
          String(computed.commissionAmount),
        iodeProfit:
          moneyOrNull(r.iode_profit ?? "") ?? String(computed.iodeProfit),
        salesExecutiveId,
        incentive: moneyOrNull(r.incentive ?? ""),
        paymentStatus: strOrNull(r.payment_status ?? "") ?? "pending",
        notes: strOrNull(r.notes ?? ""),
      });
    }
  }
  console.log(`Students: ${studentCsv.length} rows`);

  // ── Expenses ───────────────────────────────────────────────────────────────
  const expenseCsv = readCsv("expenses.csv");
  for (const r of expenseCsv) {
    if (!DRY) {
      await db.insert(expenses).values({
        expenseDate: strOrNull(r.expense_date ?? ""),
        category: strOrNull(r.category ?? ""),
        description: strOrNull(r.description ?? ""),
        amount: moneyOrNull(r.amount ?? ""),
        paidBy: strOrNull(r.paid_by ?? ""),
      });
    }
  }
  console.log(`Expenses: ${expenseCsv.length} rows`);

  // ── Investments ────────────────────────────────────────────────────────────
  const investmentCsv = readCsv("investments.csv");
  for (const r of investmentCsv) {
    if (!DRY) {
      await db.insert(investments).values({
        investmentDate: strOrNull(r.investment_date ?? ""),
        partner: strOrNull(r.partner ?? ""),
        amount: moneyOrNull(r.amount ?? ""),
        note: strOrNull(r.note ?? ""),
      });
    }
  }
  console.log(`Investments: ${investmentCsv.length} rows`);

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log(`\n── Unmatched (${unmatched.length}) ──`);
  if (unmatched.length === 0) console.log("  none 🎉");
  else unmatched.forEach((u) => console.log(`  ⚠ ${u}`));
  console.log(
    DRY
      ? "\nDry run complete. Re-run without --dry to write.\n"
      : "\nImport complete.\n"
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
