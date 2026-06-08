import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getStaffOptions } from "@/lib/lookups";
import { SalaryForm } from "../SalaryForm";

export default async function NewSalaryPage() {
  await requireRole("owner");
  const staffOptions = await getStaffOptions();
  const defaultMonth = new Date().toISOString().slice(0, 7);
  return (
    <>
      <PageHeader
        title="Add payroll"
        subtitle="Saving again for the same staff + month updates that row."
      />
      <SalaryForm staffOptions={staffOptions} defaultMonth={defaultMonth} />
    </>
  );
}
