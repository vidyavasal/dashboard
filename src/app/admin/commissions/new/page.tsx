import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { getUniversityOptions } from "@/lib/lookups";
import { CommissionForm } from "../CommissionForm";

export default async function NewCommissionPage() {
  await requireRole("owner");
  const universityOptions = await getUniversityOptions();
  return (
    <>
      <PageHeader
        title="Add / update commission"
        subtitle="Saving for an existing university overwrites its commission."
      />
      <CommissionForm universityOptions={universityOptions} />
    </>
  );
}
