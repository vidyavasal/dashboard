/**
 * ONE-TIME: copy public content (categories, universities, courses, fees) from
 * STAGING into PRODUCTION, preserving UUIDs so all foreign keys stay intact.
 *
 * Safe to re-run: every insert is onConflictDoNothing, so existing prod rows are
 * never overwritten. Aborts if prod already has universities (so it can only
 * ever SEED an empty prod, never clobber edited prod content).
 *
 *   set -a; . ./.env.local; set +a; npx tsx scripts/seed-prod-content.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as ext from "../src/lib/db/external";

const STAGING = process.env.DATABASE_URL;
const PROD = process.env.DATABASE_URL_PRODUCTION;
if (!STAGING || !PROD) throw new Error("DATABASE_URL and DATABASE_URL_PRODUCTION must be set");

const staging = drizzle(neon(STAGING), { schema: ext });
const prod = drizzle(neon(PROD), { schema: ext });

async function chunkInsert<T extends { id?: unknown }>(
  table: Parameters<typeof prod.insert>[0],
  rows: T[],
  size = 200
) {
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    if (batch.length) await prod.insert(table).values(batch).onConflictDoNothing();
  }
}

async function main() {
  // Safety guard: only seed an empty prod.
  const existing = await prod.select().from(ext.universities);
  if (existing.length > 0) {
    console.error(
      `ABORT: production already has ${existing.length} universities. ` +
        `This script only seeds an empty prod to avoid clobbering edited content.`
    );
    process.exit(1);
  }

  const categories = await staging.select().from(ext.courseCategories);
  const universities = await staging.select().from(ext.universities);
  const courses = await staging.select().from(ext.courses);
  const feeStructures = await staging.select().from(ext.courseFeeStructures);
  const feeBreakdowns = await staging.select().from(ext.courseFeeBreakdowns);

  console.log(
    `Staging content: ${categories.length} categories, ${universities.length} universities, ` +
      `${courses.length} courses, ${feeStructures.length} fee structures, ${feeBreakdowns.length} breakdowns`
  );

  // FK-safe order: categories + universities → courses → fee structures → breakdowns.
  await chunkInsert(ext.courseCategories, categories);
  await chunkInsert(ext.universities, universities);
  await chunkInsert(ext.courses, courses);
  await chunkInsert(ext.courseFeeStructures, feeStructures);
  await chunkInsert(ext.courseFeeBreakdowns, feeBreakdowns);

  // Verify.
  const v = {
    categories: (await prod.select().from(ext.courseCategories)).length,
    universities: (await prod.select().from(ext.universities)).length,
    courses: (await prod.select().from(ext.courses)).length,
    feeStructures: (await prod.select().from(ext.courseFeeStructures)).length,
    feeBreakdowns: (await prod.select().from(ext.courseFeeBreakdowns)).length,
  };
  console.log("Production now has:", JSON.stringify(v));
  const ok =
    v.categories === categories.length &&
    v.universities === universities.length &&
    v.courses === courses.length &&
    v.feeStructures === feeStructures.length &&
    v.feeBreakdowns === feeBreakdowns.length;
  console.log(ok ? "\n✅ Seed complete — counts match." : "\n⚠️ Count mismatch — review above.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
