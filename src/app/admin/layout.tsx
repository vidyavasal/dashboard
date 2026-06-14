import { getSession } from "@/lib/session";
import { logoutAction } from "./login/actions";
import { SidebarNav } from "@/components/SidebarNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // The login page renders inside this layout too (it's under /admin), but it
  // has no session. Render children bare so login isn't wrapped in the shell.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-surface/60">
      <aside className="w-60 shrink-0 border-r border-border bg-white flex flex-col print:hidden sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary text-white grid place-items-center text-sm font-bold">
              IO
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-text-primary">
                IODE Tracker
              </div>
              <div className="text-xs text-text-secondary capitalize">
                {session.role}
              </div>
            </div>
          </div>
        </div>

        <SidebarNav role={session.role} />

        <div className="mt-auto border-t border-border px-5 py-4">
          <div className="text-xs text-text-secondary truncate mb-2">
            {session.name ?? session.email}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          <Breadcrumbs />
          {children}
        </div>
      </main>
    </div>
  );
}
