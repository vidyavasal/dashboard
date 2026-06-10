"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { importLeadsCsv, type ImportResult } from "../actions";

const initial: ImportResult = { done: false, imported: 0, errors: [] };

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importLeadsCsv, initial);

  return (
    <div className="space-y-4">
      {state.done && (
        <Card
          className={`p-4 text-sm ${
            state.imported > 0
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <p className="font-medium">
            {state.imported > 0
              ? `Imported ${state.imported} lead${state.imported === 1 ? "" : "s"}.`
              : "Nothing was imported."}
            {state.imported > 0 && (
              <>
                {" "}
                <Link href="/admin/leads" className="underline">
                  View leads →
                </Link>
              </>
            )}
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 space-y-0.5">
              {state.errors.slice(0, 50).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {state.errors.length > 50 && (
                <li>…and {state.errors.length - 50} more.</li>
              )}
            </ul>
          )}
        </Card>
      )}

      <Card className="p-6">
        <form action={formAction} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-text-primary mb-1">
              CSV file <span className="text-red-500">*</span>
            </span>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary-light/70"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors disabled:opacity-60"
          >
            {pending ? "Importing…" : "Import leads"}
          </button>
        </form>
      </Card>
    </div>
  );
}
