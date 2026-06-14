import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { FormField, MoneyInput, TextAreaField } from "@/components/form";
import { todayStr, daysAgoStr } from "@/lib/dates";
import { saveExpense } from "./actions";
import type { Expense } from "@/lib/db/schema";

export function ExpenseForm({ record }: { record?: Expense }) {
  return (
    <Card className="p-6">
      <form action={saveExpense} className="space-y-4 max-w-xl">
        {record && <input type="hidden" name="id" value={record.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Date"
            name="expenseDate"
            type="date"
            defaultValue={record?.expenseDate ?? todayStr()}
            // New expenses: today or up to one week back — never a future date.
            min={record ? undefined : daysAgoStr(7)}
            max={todayStr()}
            hint={record ? undefined : "Today or up to 1 week back."}
          />
          <FormField
            label="Category"
            name="category"
            placeholder="Marketing / Office / Web…"
            defaultValue={record?.category}
          />
          <MoneyInput
            label="Amount"
            name="amount"
            required
            defaultValue={record?.amount}
          />
          <FormField
            label="Paid by"
            name="paidBy"
            defaultValue={record?.paidBy}
          />
        </div>
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={record?.description}
        />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>{record ? "Save changes" : "Add expense"}</SubmitButton>
          <Link
            href="/admin/finance/expenses"
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
