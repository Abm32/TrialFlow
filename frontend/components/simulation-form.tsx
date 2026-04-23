"use client";

import { ChangeEvent, FormEvent } from "react";

import { estimatePayment } from "@/lib/api";
import { SimulationFormValues } from "@/lib/types";

type SimulationFormProps = {
  values: SimulationFormValues;
  isSubmitting: boolean;
  disabled: boolean;
  error: string | null;
  onChange(values: SimulationFormValues): void;
  onSubmit(): void;
};

const ageGroups = ["18-30", "31-45", "46-60", "61+"];

export function SimulationForm({
  values,
  isSubmitting,
  disabled,
  error,
  onChange,
  onSubmit,
}: SimulationFormProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    onChange({
      ...values,
      [name]: value,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const estimatedPayment = estimatePayment(values);

  return (
    <section className="panel fade-up p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary">
            Drug Trial Simulation
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-primary">Configure a simulation run</h2>
        </div>
        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-secondary">
          Estimated payment: <span className="font-semibold text-primary">{estimatedPayment} INIT</span>
        </div>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block space-y-2" htmlFor="dosage">
            <span className="text-sm font-medium text-primary">Dosage (mg)</span>
            <input
              id="dosage"
              name="dosage"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={values.dosage}
              onChange={handleChange}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              required
            />
          </label>

          <label className="block space-y-2" htmlFor="populationSize">
            <span className="text-sm font-medium text-primary">Population size</span>
            <input
              id="populationSize"
              name="populationSize"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={values.populationSize}
              onChange={handleChange}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              required
            />
          </label>

          <label className="block space-y-2" htmlFor="ageGroup">
            <span className="text-sm font-medium text-primary">Age group</span>
            <select
              id="ageGroup"
              name="ageGroup"
              value={values.ageGroup}
              onChange={handleChange}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
            >
              {ageGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2" htmlFor="trialDurationDays">
            <span className="text-sm font-medium text-primary">Trial duration (days)</span>
            <input
              id="trialDurationDays"
              name="trialDurationDays"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={values.trialDurationDays}
              onChange={handleChange}
              className="focus-ring min-h-11 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-primary"
              required
            />
          </label>
        </div>

        <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-sm text-secondary">
          Payment is triggered first. After the mock chain confirms, the backend runs the drug trial simulation and stores a proof hash on the mock ledger.
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={disabled || isSubmitting}
          aria-busy={isSubmitting}
          className="focus-ring min-h-11 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Processing payment and simulation..." : "Run simulation"}
        </button>
      </form>
    </section>
  );
}
