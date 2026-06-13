"use client";

import { useActionState, useState } from "react";
import {
  saveCredentials,
  revealCredential,
  type SaveCredState,
  type RevealState,
} from "@/app/admin/profiles/[id]/fill/credential-actions";

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls =
  "block text-[11px] font-semibold uppercase tracking-wide text-text-secondary mb-1";

export function CredentialVault({
  profileId,
  username,
  note,
  hasPassword,
}: {
  profileId: string;
  username: string | null;
  note: string | null;
  hasPassword: boolean;
}) {
  const [editing, setEditing] = useState(!hasPassword && !username);
  const [saveState, saveAction, saving] = useActionState<SaveCredState, FormData>(
    saveCredentials,
    { status: "idle" }
  );
  const [revealState, revealAction, revealing] = useActionState<
    RevealState,
    FormData
  >(revealCredential, { status: "idle" });

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary">
        🔒 The password is encrypted with a key derived from the memorized admin
        passphrase — it can only be revealed by re-entering that passphrase.
      </p>

      {/* Stored summary */}
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className={labelCls}>Username</span>
          <span className="text-text-primary">{username || "—"}</span>
        </div>
        <div>
          <span className={labelCls}>Password</span>
          <span className="text-text-primary">
            {hasPassword ? "•••••••• (stored)" : "—"}
          </span>
        </div>
        {note && (
          <div className="sm:col-span-2">
            <span className={labelCls}>Note</span>
            <span className="text-text-primary">{note}</span>
          </div>
        )}
      </div>

      {/* Reveal */}
      {hasPassword && (
        <form action={revealAction} className="rounded-xl bg-surface/50 border border-border p-3 space-y-2">
          <input type="hidden" name="id" value={profileId} />
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-48 block">
              <span className={labelCls}>Admin passphrase to reveal</span>
              <input type="password" name="passphrase" autoComplete="off" className={inputCls} />
            </label>
            <button
              type="submit"
              disabled={revealing}
              className="rounded-lg bg-text-primary text-white px-3.5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {revealing ? "Revealing…" : "Reveal password"}
            </button>
          </div>
          {revealState.status === "error" && (
            <p className="text-xs text-red-600">{revealState.message}</p>
          )}
          {revealState.status === "ok" && revealState.password && (
            <RevealedPassword value={revealState.password} />
          )}
        </form>
      )}

      {/* Set / update */}
      {editing ? (
        <form action={saveAction} className="rounded-xl border border-border p-3 space-y-3">
          <input type="hidden" name="id" value={profileId} />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Portal username</span>
              <input name="username" defaultValue={username ?? ""} autoComplete="off" className={inputCls} />
            </label>
            <label className="block">
              <span className={labelCls}>Portal password</span>
              <input name="password" type="text" autoComplete="off" placeholder={hasPassword ? "Leave blank to keep current" : ""} className={inputCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Note (optional)</span>
              <input name="note" defaultValue={note ?? ""} className={inputCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Admin passphrase *</span>
              <input name="passphrase" type="password" autoComplete="off" required className={inputCls} />
            </label>
          </div>
          {saveState.status === "error" && (
            <p className="text-xs text-red-600">{saveState.message}</p>
          )}
          {saveState.status === "ok" && (
            <p className="text-xs text-green-600">{saveState.message}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary text-white px-3.5 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save credentials"}
            </button>
            {(hasPassword || username) && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-primary hover:underline"
        >
          ✏️ Update credentials
        </button>
      )}
    </div>
  );
}

function RevealedPassword({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
      <code className="text-sm font-mono text-green-900 break-all">{value}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            window.prompt("Copy password:", value);
          }
        }}
        className="ml-auto shrink-0 text-xs font-medium text-green-700 hover:text-green-900"
      >
        {copied ? "✓ Copied" : "Copy"}
      </button>
    </div>
  );
}
