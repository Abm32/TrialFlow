"use client";

import { clearSession } from "@/lib/session";
import { DEFAULT_INITIA_CHAIN_ID } from "@/lib/initia";
import { AuthMethod, Session } from "@/lib/types";

type AuthPanelProps = {
  session: Session | null;
  walletAddress: string | null;
  walletReady: boolean;
  autosignEnabled: boolean;
  autosignBusy: boolean;
  onWalletConnect(): void;
  onWalletManage(): void;
  onSocialAuth(method: AuthMethod): void;
  onToggleAutosign(): void;
  onLogout(): void;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

export function AuthPanel({
  session,
  walletAddress,
  walletReady,
  autosignEnabled,
  autosignBusy,
  onWalletConnect,
  onWalletManage,
  onSocialAuth,
  onToggleAutosign,
  onLogout,
}: AuthPanelProps) {
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
          {walletReady && walletAddress ? (
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">Initia wallet</p>
                  <p className="mt-1 text-sm text-secondary">
                    {shortenAddress(walletAddress)} on {DEFAULT_INITIA_CHAIN_ID}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onWalletManage}
                  className="focus-ring min-h-11 rounded-2xl border border-border px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100"
                >
                  Open wallet
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium text-primary">Autosign</p>
                  <p className="mt-1 text-sm text-secondary">
                    {autosignEnabled
                      ? "Enabled for seamless payment transactions."
                      : "Disabled. Enable it to streamline mock payment actions."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleAutosign}
                  disabled={autosignBusy}
                  className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {autosignBusy
                    ? "Updating autosign..."
                    : autosignEnabled
                      ? "Disable autosign"
                      : "Enable autosign"}
                </button>
              </div>
            </div>
          ) : null}
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
            onClick={onWalletConnect}
            className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Connect Initia wallet
          </button>
          <button
            type="button"
            onClick={() => onSocialAuth("social")}
            className="focus-ring min-h-11 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100"
          >
            Continue with social login
          </button>
          <p className="text-sm text-secondary">
            Wallet connections now use Initia InterwovenKit. Social login remains a local MVP fallback until we wire a production social provider.
          </p>
        </div>
      )}
    </section>
  );
}
