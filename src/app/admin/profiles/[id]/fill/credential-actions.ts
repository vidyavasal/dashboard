"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { requireRole } from "@/lib/session";
import { reqStr, str } from "@/lib/parse";
import { encryptSecret, decryptSecret, checkPassphrase } from "@/lib/crypto";
import { encodeId } from "@/lib/ids";

// Credential vault actions — gated to owner + staff. The admin passphrase is
// the decryption key (never stored); see src/lib/crypto.ts.

export type SaveCredState = { status: "idle" | "ok" | "error"; message?: string };

export async function saveCredentials(
  _prev: SaveCredState,
  formData: FormData
): Promise<SaveCredState> {
  await requireRole("owner", "staff");
  try {
    const id = reqStr(formData, "id");
    const passphrase = reqStr(formData, "passphrase");
    const username = str(formData, "username");
    const password = str(formData, "password");
    const note = str(formData, "note");

    if (!checkPassphrase(passphrase)) {
      return { status: "error", message: "Wrong admin passphrase." };
    }
    if (!password && !username) {
      return { status: "error", message: "Enter a username and/or password." };
    }

    await db
      .update(studentProfiles)
      .set({
        portalUsername: username,
        portalPasswordEnc: password ? encryptSecret(password, passphrase) : null,
        portalCredNote: note,
        updatedAt: new Date(),
      })
      .where(eq(studentProfiles.id, id));

    revalidatePath(`/admin/profiles/${encodeId(id)}/fill`);
    return { status: "ok", message: "Credentials saved (encrypted)." };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Could not save.",
    };
  }
}

export type RevealState = {
  status: "idle" | "ok" | "error";
  password?: string;
  message?: string;
};

export async function revealCredential(
  _prev: RevealState,
  formData: FormData
): Promise<RevealState> {
  const session = await requireRole("owner", "staff");
  try {
    const id = reqStr(formData, "id");
    const passphrase = reqStr(formData, "passphrase");

    if (!checkPassphrase(passphrase)) {
      return { status: "error", message: "Wrong admin passphrase." };
    }

    const [row] = await db
      .select({ enc: studentProfiles.portalPasswordEnc })
      .from(studentProfiles)
      .where(eq(studentProfiles.id, id))
      .limit(1);
    if (!row?.enc) {
      return { status: "error", message: "No password stored." };
    }

    const password = decryptSecret(row.enc, passphrase);
    // Lightweight audit trail (no plaintext logged).
    console.info(
      `[cred-vault] reveal profile=${id} by=${session.email} at=${new Date().toISOString()}`
    );
    return { status: "ok", password };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Could not reveal.",
    };
  }
}
