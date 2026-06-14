"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

interface Props {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  confirm?: string;
  label?: string;
}

function InnerButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Deleting…" : label}
    </button>
  );
}

export function DeleteButton({ id, action, confirm, label = "Delete" }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <InnerButton label={label} />
    </form>
  );
}
