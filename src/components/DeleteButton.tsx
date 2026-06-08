"use client";

interface Props {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  confirm?: string;
  label?: string;
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
      <button
        type="submit"
        className="text-sm text-red-600 hover:underline"
      >
        {label}
      </button>
    </form>
  );
}
