import "server-only";

// Tells the public marketing site (iode / Vidyavasal) to re-render specific
// pages on demand.
//
// The two apps are separate deployments that only share a database, so editing
// content here does NOT invalidate the public site's ISR cache by itself. After
// a content save we ping its /api/revalidate webhook with the affected paths so
// the changes show up immediately instead of waiting for the hourly ISR window.
//
// Failures are logged, never thrown: a save must not fail just because the
// public site was briefly unreachable (the hourly ISR window is the fallback).
export async function revalidatePublicPaths(paths: string[]): Promise<void> {
  const clean = [...new Set(paths.map((p) => p.trim()).filter(Boolean))];
  if (clean.length === 0) return;

  const siteUrl = process.env.IODE_SITE_URL?.replace(/\/+$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    console.warn(
      "[revalidate] IODE_SITE_URL or REVALIDATE_SECRET not set — skipping public site revalidation"
    );
    return;
  }

  try {
    const res = await fetch(`${siteUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ paths: clean }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        `[revalidate] public site responded ${res.status}: ${await res.text()}`
      );
    }
  } catch (err) {
    console.error("[revalidate] failed to reach public site:", err);
  }
}
