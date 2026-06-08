import { toNumber } from "./format";

// ────────────────────────────────────────────────────────────────────────────
// The admissions commission model — kept in ONE place so the live form preview
// (client) and the server-side save can agree. All inputs/outputs are the same
// numeric-string shape used by Drizzle.
//
//   commissionAmount = universityFee × commissionPercent / 100
//   iodeProfit       = (collectedFromStudent − universityFee) + commissionAmount
//   incentive        = flat incentivePerAdmission for the university
//
// Every computed value is overridable by the user; this is only the default.
// ────────────────────────────────────────────────────────────────────────────

export interface CommissionInputs {
  universityFee?: string | number | null;
  collectedFromStudent?: string | number | null;
  commissionPercent?: string | number | null;
  incentivePerAdmission?: string | number | null;
}

export interface CommissionOutputs {
  commissionAmount: number;
  iodeProfit: number;
  incentive: number;
}

export function computeCommission(i: CommissionInputs): CommissionOutputs {
  const fee = toNumber(i.universityFee);
  const collected = toNumber(i.collectedFromStudent);
  const pct = toNumber(i.commissionPercent);

  const commissionAmount = round2((fee * pct) / 100);
  const iodeProfit = round2(collected - fee + commissionAmount);
  const incentive = round2(toNumber(i.incentivePerAdmission));

  return { commissionAmount, iodeProfit, incentive };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
