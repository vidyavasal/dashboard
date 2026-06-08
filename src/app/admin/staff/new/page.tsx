import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { StaffForm } from "../StaffForm";

export default async function NewStaffPage() {
  await requireRole("owner");
  return (
    <>
      <PageHeader title="Add staff" subtitle="Create a new team member." />
      <StaffForm />
    </>
  );
}
