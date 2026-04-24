"use client";

import { useEffect, useRef, useState } from "react";

import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { useInterwovenKit } from "@initia/interwovenkit-react";

import { AuthPanel } from "@/components/auth-panel";
import { HistoryPanel } from "@/components/history-panel";
import { ResultPanel } from "@/components/result-panel";
import { SimulationForm } from "@/components/simulation-form";
import { fetchHistory, getDisplayError, runSimulation } from "@/lib/api";
import {
  DEFAULT_INITIA_CHAIN_ID,
  DEFAULT_INITIA_PAYMENT_DENOM,
  DEFAULT_INITIA_NETWORK,
  MINIMAL_SIMULATION_PAYMENT_AMOUNT,
} from "@/lib/initia";
import { loadSession, saveSession } from "@/lib/session";
import {
  AuthMethod,
  RequestPhase,
  Session,
  SimulationFormValues,
  SimulationRecord,
  SimulationResult,
  WalletPaymentState,
} from "@/lib/types";

const initialValues: SimulationFormValues = {
  dosage: "75",
  populationSize: "120",
  ageGroup: "31-45",
  trialDurationDays: "45",
};

const initialWalletPayment: WalletPaymentState = {
  status: "idle",
  txHash: null,
  amount: MINIMAL_SIMULATION_PAYMENT_AMOUNT,
  denom: DEFAULT_INITIA_PAYMENT_DENOM,
  error: null,
};

function buildMockSession(authMethod: AuthMethod): Session {
  const token = Math.random().toString(36).slice(2, 8);
  return {
    userId: `${authMethod}_user_${token}`,
    authMethod,
    displayName: authMethod === "wallet" ? "Wallet Operator" : "Research Analyst",
    walletAddress: authMethod === "wallet" ? `initia1${token}demo` : `social-${token}@trialflow`,
  };
}

function buildWalletSession(address: string): Session {
  const suffix = address.slice(-6).toLowerCase();
  return {
    userId: `wallet_${suffix}`,
    authMethod: "wallet",
    displayName: "Initia Wallet User",
    walletAddress: address,
  };
}

function getWalletTxErrorMessage(error: unknown): string {
  const message = getDisplayError(error, "Wallet transaction failed.");

  if (message === "User rejected") {
    return "Wallet transaction was rejected. Simulation did not run.";
  }

  return message;
}

export default function HomePage() {
  const { initiaAddress, openConnect, openWallet, requestTxSync, waitForTxConfirmation } =
    useInterwovenKit();
  const [session, setSession] = useState<Session | null>(null);
  const [formValues, setFormValues] = useState<SimulationFormValues>(initialValues);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationRecord[]>([]);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<RequestPhase>("idle");
  const [simulationStatus, setSimulationStatus] = useState<RequestPhase>("idle");
  const [simulationProgressLabel, setSimulationProgressLabel] = useState<string | null>(null);
  const [walletPayment, setWalletPayment] = useState<WalletPaymentState>(initialWalletPayment);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const walletResetTimerRef = useRef<number | null>(null);

  async function loadHistory(userId: string) {
    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const records = await fetchHistory(userId);
      setHistory(records);

      if (!records.length) {
        setSelectedSimulationId(null);
        setResult(null);
        return;
      }

      const nextSimulationId =
        selectedSimulationId && records.some((record) => record.result.simulation_id === selectedSimulationId)
          ? selectedSimulationId
          : records[0].result.simulation_id;
      const nextRecord = records.find((record) => record.result.simulation_id === nextSimulationId) ?? records[0];

      setSelectedSimulationId(nextSimulationId);
      setResult(nextRecord.result);
    } catch (error) {
      setHistoryError(getDisplayError(error, "History could not be loaded."));
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    const existingSession = loadSession();
    if (existingSession) {
      setSession(existingSession);
    }
  }, []);

  useEffect(() => {
    if (!initiaAddress) {
      if (session?.authMethod === "wallet") {
        setWalletStatus("idle");
      }
      return;
    }

    if (walletResetTimerRef.current) {
      window.clearTimeout(walletResetTimerRef.current);
      walletResetTimerRef.current = null;
    }

    const nextSession = buildWalletSession(initiaAddress);
    saveSession(nextSession);
    setSession(nextSession);
    setWalletStatus("success");
    setWalletError(null);
  }, [initiaAddress, session?.authMethod]);

  useEffect(() => {
    if (!initiaAddress && session?.authMethod === "wallet") {
      setWalletPayment(initialWalletPayment);
    }
  }, [initiaAddress, session]);

  useEffect(() => {
    return () => {
      if (walletResetTimerRef.current) {
        window.clearTimeout(walletResetTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setHistory([]);
      setHistoryError(null);
      return;
    }

    void loadHistory(session.userId);
  }, [session]);

  function handleSocialAuth(method: AuthMethod) {
    const nextSession = buildMockSession(method);
    saveSession(nextSession);
    setSession(nextSession);
    setResult(null);
    setSubmitError(null);
    setWalletError(null);
    setWalletStatus("success");
    setWalletPayment(initialWalletPayment);
  }

  function handleFormChange(nextValues: SimulationFormValues) {
    setFormValues(nextValues);

    if (submitError) {
      setSubmitError(null);
    }

    if (simulationStatus !== "idle") {
      setSimulationStatus("idle");
      setSimulationProgressLabel(null);
    }

    if (walletPayment.status !== "idle") {
      setWalletPayment(initialWalletPayment);
    }
  }

  function handleLogout() {
    setSession(null);
    setResult(null);
    setSubmitError(null);
    setWalletError(null);
    setWalletStatus("idle");
    setSimulationStatus("idle");
    setSimulationProgressLabel(null);
    setWalletPayment(initialWalletPayment);
    setSelectedSimulationId(null);
  }

  function handleWalletConnect() {
    setWalletStatus("loading");
    setWalletError(null);

    void Promise.resolve()
      .then(() => openConnect())
      .catch((error) => {
        setWalletStatus("error");
        setWalletError(getDisplayError(error, "Wallet connection was cancelled or failed to open."));
      });

    walletResetTimerRef.current = window.setTimeout(() => {
      setWalletStatus((current) => (current === "loading" ? "idle" : current));
    }, 4000);
  }

  function handleWalletManage() {
    setWalletError(null);

    try {
      openWallet();
    } catch (error) {
      setWalletError(getDisplayError(error, "Wallet modal could not be opened."));
    }
  }

  async function handleRunSimulation() {
    const senderAddress = initiaAddress;

    if (!session || !senderAddress || session.authMethod !== "wallet") {
      setSubmitError("A connected Initia wallet is required before running a simulation.");
      return;
    }

    setSubmitError(null);
    setSimulationStatus("loading");
    setSimulationProgressLabel("Requesting wallet approval for the payment transaction...");
    setWalletPayment({
      status: "pending",
      txHash: null,
      amount: MINIMAL_SIMULATION_PAYMENT_AMOUNT,
      denom: DEFAULT_INITIA_PAYMENT_DENOM,
      error: null,
    });

    try {
      const txHash = await requestTxSync({
        chainId: DEFAULT_INITIA_CHAIN_ID,
        memo: "TrialFlow simulation payment",
        messages: [
          {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: MsgSend.fromPartial({
              fromAddress: senderAddress,
              toAddress: senderAddress,
              amount: [
                {
                  amount: MINIMAL_SIMULATION_PAYMENT_AMOUNT,
                  denom: DEFAULT_INITIA_PAYMENT_DENOM,
                },
              ],
            }),
          },
        ],
      });

      setWalletPayment({
        status: "pending",
        txHash,
        amount: MINIMAL_SIMULATION_PAYMENT_AMOUNT,
        denom: DEFAULT_INITIA_PAYMENT_DENOM,
        error: null,
      });
      setSimulationProgressLabel("Wallet transaction submitted. Waiting for on-chain confirmation...");

      await waitForTxConfirmation({
        txHash,
        chainId: DEFAULT_INITIA_CHAIN_ID,
        timeoutMs: 60_000,
        intervalMs: 3_000,
      });

      setWalletPayment({
        status: "success",
        txHash,
        amount: MINIMAL_SIMULATION_PAYMENT_AMOUNT,
        denom: DEFAULT_INITIA_PAYMENT_DENOM,
        error: null,
      });
      setSimulationProgressLabel("Payment confirmed. Running the backend simulation...");

      const nextResult = await runSimulation(session, formValues, txHash);
      setResult(nextResult);
      setSelectedSimulationId(nextResult.simulation_id);

      setSimulationProgressLabel("Refreshing saved run history...");
      await loadHistory(session.userId);

      setSimulationStatus("success");
      setSimulationProgressLabel("Simulation completed.");
    } catch (error) {
      const walletMessage = getWalletTxErrorMessage(error);
      setWalletPayment((current) => ({
        ...current,
        status: "failed",
        error: walletMessage,
      }));
      setSimulationStatus("error");
      setSimulationProgressLabel(null);
      setSubmitError(walletMessage);
    }
  }

  function handleSelectHistoryRecord(record: SimulationRecord) {
    setSelectedSimulationId(record.result.simulation_id);
    setResult(record.result);
    setSubmitError(null);
  }

  const canRunSimulation = Boolean(session && session.authMethod === "wallet" && initiaAddress);

  return (
    <main className="min-h-screen px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="fade-up panel overflow-hidden p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                TrialFlow
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-primary md:text-5xl">
                Simulation-as-a-Service for drug trial modeling and on-chain proofing.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-secondary">
                This workflow uses an Initia wallet authorization step before the backend simulation is accepted, then keeps the result, payment receipt, and proof trail together in one review surface.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 backdrop-blur">
              <p className="text-sm font-medium text-secondary">Runtime</p>
              <dl className="mt-4 space-y-3 text-sm text-primary">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-secondary">Network</dt>
                  <dd className="font-semibold">{DEFAULT_INITIA_NETWORK}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-secondary">Chain ID</dt>
                  <dd className="font-semibold">{DEFAULT_INITIA_CHAIN_ID}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-secondary">Authorization denom</dt>
                  <dd className="font-semibold">{DEFAULT_INITIA_PAYMENT_DENOM}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <AuthPanel
              session={session}
              walletAddress={initiaAddress ?? null}
              walletReady={Boolean(initiaAddress)}
              walletConnected={Boolean(initiaAddress)}
              walletStatus={walletStatus}
              walletError={walletError}
              onWalletConnect={handleWalletConnect}
              onWalletManage={handleWalletManage}
              onSocialAuth={handleSocialAuth}
              onLogout={handleLogout}
            />
            <SimulationForm
              values={formValues}
              isSubmitting={simulationStatus === "loading"}
              disabled={!canRunSimulation}
              error={submitError}
              progressLabel={simulationProgressLabel}
              paymentState={walletPayment}
              requiresWallet={!canRunSimulation}
              onChange={handleFormChange}
              onSubmit={handleRunSimulation}
            />
          </div>

          <ResultPanel
            result={result}
            isLoading={simulationStatus === "loading"}
            loadingLabel={simulationProgressLabel}
            error={submitError}
            walletPayment={walletPayment}
            onRetry={session ? handleRunSimulation : undefined}
          />
        </div>

        <HistoryPanel
          records={history}
          isLoading={isHistoryLoading}
          error={historyError}
          selectedSimulationId={selectedSimulationId}
          onSelect={handleSelectHistoryRecord}
          onRetry={session ? () => void loadHistory(session.userId) : undefined}
        />
      </div>
    </main>
  );
}
