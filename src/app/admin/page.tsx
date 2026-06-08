import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function AdminIndex() {
  const session = await requireSession();
  // Owners land on the finance dashboard; sales execs on their admissions.
  redirect(session.role === "owner" ? "/admin/dashboard" : "/admin/students");
}
