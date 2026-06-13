// Reusable form field primitives, shared across every CRUD form.

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required = false,
  placeholder,
  step,
  min,
  max,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  step?: string;
  /** e.g. date window constraints (YYYY-MM-DD for type="date"). */
  min?: string;
  max?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {hint && <span className="block text-xs text-text-secondary mt-1">{hint}</span>}
    </label>
  );
}

/** Money input — prefixes ₹ and uses 0.01 step. Stores plain numeric string. */
export function MoneyInput({
  label,
  name,
  defaultValue,
  required = false,
  id,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  id?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
          ₹
        </span>
        <input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min="0"
          required={required}
          defaultValue={defaultValue ?? undefined}
          className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </label>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  required = false,
  placeholder = "Select…",
  id,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  id?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-primary mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="" disabled={required}>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-text-primary mb-1">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </label>
  );
}
