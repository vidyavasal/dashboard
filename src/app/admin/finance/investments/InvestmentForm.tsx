import Link from "next/link";
import { Card, SubmitButton } from "@/components/ui";
import { FormField, MoneyInput, TextAreaField } from "@/components/form";
import { todayStr } from "@/lib/dates";
import { saveInvestment } from "./actions";
import type { Investment } from "@/lib/db/schema";

export function InvestmentForm({ record }: { record?: Investment }) {
  return (
    <Card className="p-6">
      <form action={saveInvestment} className="space-y-4 max-w-xl">
        {record && <input type="hidden" name="id" value={record.id} />}
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            label="Date"
            name="investmentDate"
            type="date"
            defaultValue={record?.investmentDate ?? todayStr()}
            max={todayStr()}
          />
          <FormField
            label="Partner"
            name="partner"
            defaultValue={record?.partner}
          />
          <MoneyInput
            label="Amount"
            name="amount"
            required
            defaultValue={record?.amount}
          />
        </div>
        <TextAreaField label="Note" name="note" defaultValue={record?.note} />
        <div className="flex items-center gap-3 pt-2">
          <SubmitButton>
            {record ? "Save changes" : "Add investment"}
          </SubmitButton>
          <Link
            href="/admin/finance/investments"
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
