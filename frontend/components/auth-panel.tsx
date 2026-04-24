"use client";

import { clearSession } from "@/lib/session";
import { DEFAULT_INITIA_CHAIN_ID } from "@/lib/initia";
import { useSessionKey } from "@/lib/session-key";
import { AuthMethod, RequestPhase, Session } from "@/lib/types";

type AuthPanelProps = {
  session: Session | null;
  walletAddress: string | null;
  walletReady: boolean;
  walletConnected: boolean;
  walletStatus: RequestPhase;
  walletError: string | null;
  onWalletConnect(): void;
  onWalletManage(): void;
  onSocialAuth(method: AuthMethod): void;
  onLogout(): void;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

function formatRemaining(ms: number): string {
  const mins = Math.ceil(ms / 60_000);
  return mins <= 1 ? "< 1 min" : `${mins} min`;
}

export function AuthPanel({
  session,
  walletAddress,
  walletReady,
  walletConnected,
  walletStatus,
  walletError,
  onWalletConnect,
  onWalletManage,
  onSocialAuth,
  onLogout,
}: AuthPanelProps) {
  const sessionKey = useSessionKey();
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
              Signed in via {session.authMethod} as{" "}
              <span className="font-medium break-all">{session.walletAddress}</span>
            </p>
          </div>
          {session.authMethod === "wallet" && !walletConnected ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-warning">
              Your saved wallet session is present, but the wallet is not currently connected in this browser.
              Reconnect before submitting another run.
            </div>
          ) : null}
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
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-sm font-medium text-primary">Wallet status</p>
                <p className="mt-1 text-sm text-secondary">
                  Keep the wallet window available while approving the connection or transaction prompts for this MVP flow.
                </p>
              </div>
            </div>
          ) : session.authMethod === "wallet" ? (
            <button
              type="button"
              onClick={onWalletConnect}
              className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Reconnect Initia wallet
            </button>
          ) : null}
          {session.authMethod === "wallet" && walletConnected ? (
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-primary">Session key auto-signing</p>
                  <p className="mt-1 text-sm text-secondary">
                    {sessionKey.isActive
                      ? `Active — expires in ${formatRemaining(sessionKey.remainingMs)}. Simulation runs auto-sign without wallet popups.`
                      : "Grant a session key to auto-sign repeat simulation runs without re-approving each transaction."}
                  </p>
                </div>
                {sessionKey.isActive ? (
                  <button
                    type="button"
                    onClick={sessionKey.revoke}
                    className="focus-ring min-h-11 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-warning transition hover:bg-amber-100"
                  >
                    Revoke
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={sessionKey.grant}
                    className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Grant session key
                  </button>
                )}
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
            disabled={walletStatus === "loading"}
            aria-busy={walletStatus === "loading"}
            className="focus-ring min-h-11 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {walletStatus === "loading" ? "Opening wallet connection..." : "Connect Initia wallet"}
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
          {walletError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
              {walletError}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
