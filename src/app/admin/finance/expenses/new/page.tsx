import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { ExpenseForm } from "../ExpenseForm";

export default async function NewExpensePage() {
  await requireRole("owner");
  return (
    <>
      <PageHeader title="Add expense" />
      <ExpenseForm />
    </>
  );
}
