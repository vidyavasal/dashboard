import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { InvestmentForm } from "../InvestmentForm";

export default async function NewInvestmentPage() {
  await requireRole("owner");
  return (
    <>
      <PageHeader title="Add investment" />
      <InvestmentForm />
    </>
  );
}
