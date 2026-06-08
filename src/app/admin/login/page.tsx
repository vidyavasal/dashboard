"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { loginAction, type LoginState } from "./actions";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-primary text-white grid place-items-center text-lg font-bold">
            IO
          </div>
          <h1 className="text-lg font-bold text-text-primary">
            IODE Business Tracker
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Sign in to continue
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="you@iode.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>

            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-text-secondary mt-6">
          Internal — restricted access
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
