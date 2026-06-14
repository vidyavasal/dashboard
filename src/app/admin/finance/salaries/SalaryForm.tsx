import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { MoneyInput, SelectField, FormField } from "@/components/form";
import { thisMonthStr } from "@/lib/dates";
import { saveSalary } from "./actions";
import type { Salary } from "@/lib/db/schema";

export function SalaryForm({
  record,
  staffOptions,
  defaultMonth,
}: {
  record?: Salary;
  staffOptions: { value: string; label: string }[];
  defaultMonth: string;
}) {
  return (
    <Card className="p-6">
      <form action={saveSalary} className="space-y-4 max-w-xl">
        {record && <input type="hidden" name="id" value={record.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <SelectField
            label="Staff"
            name="staffId"
            required
            defaultValue={record?.staffId}
            options={staffOptions}
          />
          <FormField
            label="Month (YYYY-MM)"
            name="month"
            type="month"
            required
            defaultValue={record?.month ?? defaultMonth}
            max={thisMonthStr()}
          />
          <MoneyInput
            label="Base salary"
            name="baseSalary"
            defaultValue={record?.baseSalary}
          />
          <MoneyInput
            label="Bonus"
            name="bonus"
            defaultValue={record?.bonus}
          />
        </div>
        <p className="text-sm text-text-secondary bg-surface rounded-lg px-3 py-2">
          Incentive is pulled automatically from this staff member&apos;s
          admissions for the selected month, and added to base + bonus to get the
          total payable.
          {record?.incentive != null && (
            <>
              {" "}
              Current stored incentive: <strong>₹{record.incentive}</strong>.
            </>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="paid"
            defaultChecked={record?.paid ?? false}
            className="h-4 w-4 rounded border-border"
          />
          Mark as paid
        </label>
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>
            {record ? "Save changes" : "Save payroll"}
          </SubmitButton>
          <Link
            href="/admin/finance/salaries"
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
