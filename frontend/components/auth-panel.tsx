"use client";

import { clearSession } from "@/lib/session";
import { AuthMethod, Session } from "@/lib/types";

type AuthPanelProps = {
  session: Session | null;
  onAuth(method: AuthMethod): void;
  onLogout(): void;
};

export function AuthPanel({ session, onAuth, onLogout }: AuthPanelProps) {
  return (
    <section className="panel fade-up flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Auth
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Access the simulation workspace</h2>
        </div>
        {session ? (
          <span className="rounded-full bg-muted px-3 py-2 text-xs font-medium text-secondary">
            Session active
          </span>
        ) : null}
      </div>

      {session ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <p className="text-sm font-medium text-primary">{session.displayName}</p>
            <p className="mt-1 text-sm text-secondary">
              Signed in via {session.authMethod} as <span className="font-medium">{session.walletAddress}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              onLogout();
            }}
            className="focus-ring min-h-11 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          <button
            type="button"
            onClick={() => onAuth("wallet")}
            className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Connect wallet
          </button>
          <button
            type="button"
            onClick={() => onAuth("social")}
            className="focus-ring min-h-11 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100"
          >
            Continue with social login
          </button>
          <p className="text-sm text-secondary">
            MVP note: both options create a mock local session so we can exercise the payment and simulation flow quickly.
          </p>
        </div>
      )}
    </section>
  );
}
