"use client";

import { ChangeEvent, FormEvent, useId, useMemo, useRef, useState } from "react";

import { estimatePayment } from "@/lib/api";
import { DEFAULT_INITIA_NATIVE_SYMBOL } from "@/lib/initia";
import { SimulationFormErrors, SimulationFormValues, WalletPaymentState } from "@/lib/types";

type SimulationFormProps = {
  values: SimulationFormValues;
  isSubmitting: boolean;
  disabled: boolean;
  error: string | null;
  progressLabel: string | null;
  paymentState: WalletPaymentState;
  requiresWallet: boolean;
  onChange(values: SimulationFormValues): void;
  onSubmit(): void;
};

const ageGroups = ["18-30", "31-45", "46-60", "61+"];
const defaultValues: SimulationFormValues = {
  dosage: "75",
  populationSize: "120",
  ageGroup: "31-45",
  trialDurationDays: "45",
};
const presetScenarios: Array<{
  key: "standard" | "high-risk";
  label: string;
  description: string;
  values: SimulationFormValues;
}> = [
  {
    key: "standard",
    label: "Standard Trial",
    description: "Moderate dosage with a balanced adult cohort.",
    values: {
      dosage: "70",
      populationSize: "140",
      ageGroup: "31-45",
      trialDurationDays: "56",
    },
  },
  {
    key: "high-risk",
    label: "High Risk Trial",
    description: "Higher dosage in a more vulnerable older population.",
    values: {
      dosage: "130",
      populationSize: "90",
      ageGroup: "61+",
      trialDurationDays: "84",
    },
  },
];

function validateValues(values: SimulationFormValues): SimulationFormErrors {
  const errors: SimulationFormErrors = {};
  const dosage = Number(values.dosage);
  const population = Number(values.populationSize);
  const duration = Number(values.trialDurationDays);

  if (!values.dosage.trim()) {
    errors.dosage = "Enter a dosage amount.";
  } else if (!Number.isFinite(dosage) || dosage <= 0) {
    errors.dosage = "Dosage must be a number greater than 0.";
  }

  if (!values.populationSize.trim()) {
    errors.populationSize = "Enter a participant count.";
  } else if (!Number.isInteger(population) || population < 10) {
    errors.populationSize = "Population size must be a whole number of at least 10.";
  }

  if (!values.ageGroup.trim()) {
    errors.ageGroup = "Select an age group.";
  }

  if (!values.trialDurationDays.trim()) {
    errors.trialDurationDays = "Enter a trial duration.";
  } else if (!Number.isInteger(duration) || duration < 1) {
    errors.trialDurationDays = "Trial duration must be at least 1 day.";
  }

  return errors;
}

export function SimulationForm({
  values,
  isSubmitting,
  disabled,
  error,
  progressLabel,
  paymentState,
  requiresWallet,
  onChange,
  onSubmit,
}: SimulationFormProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const headingId = useId();
  const errors = useMemo(() => validateValues(values), [values]);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => touched[key]),
  ) as SimulationFormErrors;

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    onChange({
      ...values,
      [name]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTouched = {
      dosage: true,
      populationSize: true,
      ageGroup: true,
      trialDurationDays: true,
    };
    setTouched(nextTouched);

    if (Object.keys(errors).length > 0) {
      const firstInvalidField = Object.keys(errors)[0];
      const target = formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`);
      target?.focus();
      return;
    }

    onSubmit();
  }

  const estimatedPayment = estimatePayment(values);
  const isRunDisabled = disabled || isSubmitting || Object.keys(errors).length > 0;

  return (
    <section className="panel fade-up p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Drug Trial Simulation
          </p>
          <h2 id={headingId} className="mt-2 text-2xl font-semibold text-primary">
            Configure a simulation run
          </h2>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-secondary">
          Estimated payment:{" "}
          <span className="font-semibold text-primary">
            {estimatedPayment} {DEFAULT_INITIA_NATIVE_SYMBOL}
          </span>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {presetScenarios.map((preset) => (
          <button
            key={preset.key}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onChange(preset.values);
              setTouched({});
            }}
            className="focus-ring min-h-11 rounded-2xl border border-border bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <span className="block text-sm font-semibold text-primary">{preset.label}</span>
            <span className="mt-1 block text-xs text-secondary">{preset.description}</span>
          </button>
        ))}
      </div>

      <form ref={formRef} className="space-y-5" onSubmit={handleSubmit} aria-labelledby={headingId}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2" htmlFor="dosage">
            <span className="text-sm font-medium text-primary">Dosage (mg) *</span>
            <input
              id="dosage"
              name="dosage"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={values.dosage}
              onChange={handleChange}
              onBlur={() => setTouched((current) => ({ ...current, dosage: true }))}
              aria-invalid={visibleErrors.dosage ? "true" : undefined}
              aria-describedby={visibleErrors.dosage ? "dosage-error" : "dosage-hint"}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              placeholder="75"
              required
            />
            <p id="dosage-hint" className="text-xs text-secondary">
              Recommended starting range: 25 to 150 mg.
            </p>
            {visibleErrors.dosage ? (
              <p id="dosage-error" className="text-xs text-warning">
                {visibleErrors.dosage}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2" htmlFor="populationSize">
            <span className="text-sm font-medium text-primary">Population size *</span>
            <input
              id="populationSize"
              name="populationSize"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={values.populationSize}
              onChange={handleChange}
              onBlur={() => setTouched((current) => ({ ...current, populationSize: true }))}
              aria-invalid={visibleErrors.populationSize ? "true" : undefined}
              aria-describedby={visibleErrors.populationSize ? "populationSize-error" : "populationSize-hint"}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              placeholder="120"
              required
            />
            <p id="populationSize-hint" className="text-xs text-secondary">
              Use a whole number for the participant cohort.
            </p>
            {visibleErrors.populationSize ? (
              <p id="populationSize-error" className="text-xs text-warning">
                {visibleErrors.populationSize}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2" htmlFor="ageGroup">
            <span className="text-sm font-medium text-primary">Age group *</span>
            <select
              id="ageGroup"
              name="ageGroup"
              value={values.ageGroup}
              onChange={handleChange}
              onBlur={() => setTouched((current) => ({ ...current, ageGroup: true }))}
              aria-invalid={visibleErrors.ageGroup ? "true" : undefined}
              aria-describedby={visibleErrors.ageGroup ? "ageGroup-error" : "ageGroup-hint"}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
            >
              {ageGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <p id="ageGroup-hint" className="text-xs text-secondary">
              Choose the primary cohort for this simulation.
            </p>
            {visibleErrors.ageGroup ? (
              <p id="ageGroup-error" className="text-xs text-warning">
                {visibleErrors.ageGroup}
              </p>
            ) : null}
          </label>

          <label className="block space-y-2" htmlFor="trialDurationDays">
            <span className="text-sm font-medium text-primary">Trial duration (days) *</span>
            <input
              id="trialDurationDays"
              name="trialDurationDays"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={values.trialDurationDays}
              onChange={handleChange}
              onBlur={() => setTouched((current) => ({ ...current, trialDurationDays: true }))}
              aria-invalid={visibleErrors.trialDurationDays ? "true" : undefined}
              aria-describedby={
                visibleErrors.trialDurationDays ? "trialDurationDays-error" : "trialDurationDays-hint"
              }
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              placeholder="45"
              required
            />
            <p id="trialDurationDays-hint" className="text-xs text-secondary">
              Use whole days to match the backend simulation model.
            </p>
            {visibleErrors.trialDurationDays ? (
              <p id="trialDurationDays-error" className="text-xs text-warning">
                {visibleErrors.trialDurationDays}
              </p>
            ) : null}
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm text-secondary">
          TrialFlow first sends a minimal wallet transaction on Initia testnet. The backend simulation only starts after that transaction is confirmed.
        </div>

        {requiresWallet ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
            Connect an Initia wallet to trigger the payment transaction and run the simulation.
          </div>
        ) : null}

        {progressLabel ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-primary">
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
              aria-hidden="true"
            />
            <span>{progressLabel}</span>
          </div>
        ) : null}

        {paymentState.status !== "idle" ? (
          <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-primary">
              Transaction status:{" "}
              {paymentState.status === "pending"
                ? "Pending"
                : paymentState.status === "success"
                  ? "Success"
                  : "Failed"}
            </p>
            <p className="mt-1 text-secondary">
              Minimal payment: {paymentState.amount} {paymentState.denom}
            </p>
            {paymentState.txHash ? (
              <p className="mt-1 break-all font-mono text-xs text-primary">{paymentState.txHash}</p>
            ) : null}
            {paymentState.error ? (
              <p className="mt-1 text-warning">{paymentState.error}</p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isRunDisabled}
            aria-busy={isSubmitting}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                Waiting for wallet transaction...
              </>
            ) : (
              "Run simulation"
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              onChange(defaultValues);
              setTouched({});
            }}
            className="focus-ring min-h-11 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-primary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-secondary"
          >
            Reset defaults
          </button>
        </div>
      </form>
    </section>
  );
}
