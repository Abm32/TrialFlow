from __future__ import annotations

import hashlib
import math

import numpy as np
import pandas as pd


AGE_RESPONSE_MULTIPLIER = {
    "18-30": 1.06,
    "31-45": 1.0,
    "46-60": 0.93,
    "61+": 0.86,
}

AGE_RISK_MULTIPLIER = {
    "18-30": 0.92,
    "31-45": 1.0,
    "46-60": 1.08,
    "61+": 1.18,
}

AGE_EFFECT_VARIABILITY = {
    "18-30": 5.2,
    "31-45": 6.1,
    "46-60": 7.1,
    "61+": 8.2,
}

AGE_SIDE_EFFECT_CONCENTRATION = {
    "18-30": 42.0,
    "31-45": 36.0,
    "46-60": 31.0,
    "61+": 26.0,
}


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _normal_cdf(value: float) -> float:
    return 0.5 * (1.0 + math.erf(value / math.sqrt(2.0)))


def _deterministic_seed(params: dict) -> int:
    signature = (
        f"{params['dosage']}-{params['population_size']}-"
        f"{params['age_group']}-{params['trial_duration_days']}"
    )
    digest = hashlib.sha256(signature.encode("utf-8")).hexdigest()
    return int(digest[:16], 16) % (2**32)


def _dose_response_effect(dosage: float) -> float:
    e_max = 26.0
    ec50 = 62.0
    return e_max * dosage / (ec50 + dosage)


def _effectiveness_distribution(
    rng: np.random.Generator,
    size: int,
    baseline_severity: np.ndarray,
    adherence: np.ndarray,
    dosage: float,
    duration_days: int,
    age_response_multiplier: float,
    age_effect_variability: float,
    arm_name: str,
) -> np.ndarray:
    placebo_mean = 12.5 + 0.07 * np.sqrt(baseline_severity)
    duration_factor = _clamp(math.log1p(duration_days) / math.log(181.0), 0.22, 1.12)
    dose_effect = _dose_response_effect(dosage) * age_response_multiplier * duration_factor
    adherence_effect = 4.8 * (adherence - 0.7)
    arm_offset = dose_effect if arm_name == "treatment" else 0.38 * dose_effect
    patient_mean = 28.0 + placebo_mean + arm_offset + adherence_effect

    dose_variability = 0.028 * dosage
    response_std = np.clip(
        age_effect_variability + dose_variability + (1.0 - adherence) * 3.8,
        4.5,
        12.5,
    )
    return rng.normal(loc=patient_mean, scale=response_std, size=size)


def _side_effect_probabilities(
    rng: np.random.Generator,
    size: int,
    dosage: float,
    duration_days: int,
    adherence: np.ndarray,
    age_risk_multiplier: float,
    concentration: float,
    arm_name: str,
) -> np.ndarray:
    treatment_factor = 1.0 if arm_name == "treatment" else 0.72
    base_rate = (
        0.08
        + 0.00145 * dosage
        + 0.00032 * duration_days
        + 0.065 * (age_risk_multiplier - 1.0)
        + 0.035 * (1.0 - adherence)
    )
    mean_probability = np.clip(base_rate * treatment_factor, 0.03, 0.68)
    alpha = np.clip(mean_probability * concentration, 1.2, None)
    beta = np.clip((1.0 - mean_probability) * concentration, 1.2, None)
    return rng.beta(alpha, beta, size=size)


def _generate_arm(
    rng: np.random.Generator,
    arm_name: str,
    size: int,
    dosage: float,
    duration_days: int,
    age_response_multiplier: float,
    age_risk_multiplier: float,
    age_effect_variability: float,
    age_side_effect_concentration: float,
) -> pd.DataFrame:
    baseline_severity = rng.beta(2.4, 2.2, size=size) * 100
    adherence = rng.beta(9.5, 2.2 + (duration_days / 180.0), size=size)
    response_score = np.clip(
        _effectiveness_distribution(
            rng=rng,
            size=size,
            baseline_severity=baseline_severity,
            adherence=adherence,
            dosage=dosage,
            duration_days=duration_days,
            age_response_multiplier=age_response_multiplier,
            age_effect_variability=age_effect_variability,
            arm_name=arm_name,
        ),
        0,
        100,
    )

    side_effect_probability = _side_effect_probabilities(
        rng=rng,
        size=size,
        dosage=dosage,
        duration_days=duration_days,
        adherence=adherence,
        age_risk_multiplier=age_risk_multiplier,
        concentration=age_side_effect_concentration,
        arm_name=arm_name,
    )
    side_effect_events = rng.binomial(1, side_effect_probability, size=size)

    severe_share = np.clip(0.03 + 0.18 * side_effect_probability + 0.02 * (age_risk_multiplier - 1.0), 0.02, 0.24)
    moderate_share = np.clip(0.18 + 0.34 * side_effect_probability, 0.15, 0.46)
    mild_share = np.clip(1.0 - severe_share - moderate_share, 0.38, 0.74)
    severity_total = mild_share + moderate_share + severe_share

    severity_selector = rng.random(size=size)
    event_severity = np.where(
        side_effect_events == 0,
        "none",
        np.where(
            severity_selector < (mild_share / severity_total),
            "mild",
            np.where(
                severity_selector < ((mild_share + moderate_share) / severity_total),
                "moderate",
                "severe",
            ),
        ),
    )

    dropout_probability = np.clip(
        0.02
        + 0.00055 * duration_days
        + 0.045 * side_effect_probability
        + 0.032 * (event_severity == "moderate")
        + 0.075 * (event_severity == "severe")
        + 0.028 * (adherence < 0.62),
        0.01,
        0.45,
    )
    dropped_out = rng.binomial(1, dropout_probability, size=size)
    completion_flag = 1 - dropped_out

    effective_response = np.clip(response_score - (dropped_out * 5.5), 0, 100)
    outcome = np.where(
        effective_response >= 62,
        "improved",
        np.where(effective_response >= 42, "stable", "declined"),
    )

    return pd.DataFrame(
        {
            "arm": arm_name,
            "baseline_severity": baseline_severity,
            "adherence": adherence,
            "response_score": response_score,
            "effective_response": effective_response,
            "side_effect": side_effect_events,
            "side_effect_probability": side_effect_probability,
            "event_severity": event_severity,
            "dropped_out": dropped_out,
            "completed": completion_flag,
            "outcome": outcome,
        }
    )


def _mean_confidence_interval(series: pd.Series) -> dict[str, float]:
    sample_size = max(int(series.shape[0]), 1)
    mean = float(series.mean())
    standard_error = float(series.std(ddof=1) / math.sqrt(sample_size)) if sample_size > 1 else 0.0
    margin = 1.96 * standard_error
    return {
        "lower": round(mean - margin, 2),
        "upper": round(mean + margin, 2),
    }


def _arm_comparison(treatment: pd.Series, control: pd.Series) -> dict[str, float]:
    treatment_mean = float(treatment.mean())
    control_mean = float(control.mean())
    treatment_var = float(treatment.var(ddof=1))
    control_var = float(control.var(ddof=1))
    standard_error = math.sqrt((treatment_var / len(treatment)) + (control_var / len(control)))
    z_score = (treatment_mean - control_mean) / standard_error if standard_error else 0.0
    p_value = max(0.0, min(1.0, 2.0 * (1.0 - _normal_cdf(abs(z_score)))))
    absolute_lift = treatment_mean - control_mean
    relative_lift_percent = (absolute_lift / control_mean * 100.0) if control_mean else 0.0

    return {
        "treatment_mean": round(treatment_mean, 2),
        "control_mean": round(control_mean, 2),
        "absolute_lift": round(absolute_lift, 2),
        "relative_lift_percent": round(relative_lift_percent, 2),
        "p_value": round(p_value, 4),
    }


def _curves(
    treatment_frame: pd.DataFrame,
    dosage: float,
    duration_days: int,
    age_response_multiplier: float,
    age_risk_multiplier: float,
) -> tuple[list[dict], list[dict]]:
    checkpoints = np.linspace(1, duration_days, num=min(8, duration_days), dtype=int)
    max_treatment_effect = _dose_response_effect(dosage) * age_response_multiplier
    base_side_effect_rate = float(treatment_frame["side_effect"].mean() * 100.0)

    effect_curve: list[dict] = []
    side_effect_curve: list[dict] = []
    for day in checkpoints:
        progress = day / duration_days
        onset = 1.0 - math.exp(-3.6 * progress)
        cumulative_side_effects = _clamp(
            base_side_effect_rate * (0.46 + 0.54 * math.sqrt(progress)) * age_risk_multiplier,
            0,
            100,
        )
        average_effect = _clamp(12.0 + max_treatment_effect * onset + 24.0 * progress, 0, 100)
        effect_curve.append({"label": f"Day {day}", "value": round(average_effect, 2)})
        side_effect_curve.append({"label": f"Day {day}", "value": round(cumulative_side_effects, 2)})

    return effect_curve, side_effect_curve


def _insight_summary(
    effectiveness_percent: float,
    side_effect_probability_percent: float,
    dropout_rate_percent: float,
    relative_lift_percent: float,
) -> str:
    if effectiveness_percent >= 68 and side_effect_probability_percent >= 38:
        return (
            "Higher dosage improves effectiveness but increases side effect risk significantly, "
            "so the regimen looks potent but harder to tolerate."
        )

    if effectiveness_percent >= 68 and side_effect_probability_percent < 25:
        return (
            "The trial shows strong effectiveness with comparatively limited side effect burden, "
            "making this configuration the cleanest risk-reward profile in the current run."
        )

    if effectiveness_percent < 52 and side_effect_probability_percent >= 32:
        return (
            "This configuration underperforms on effectiveness while still creating meaningful side effect exposure, "
            "so it is unlikely to be a good dosing balance."
        )

    if dropout_rate_percent >= 24:
        return (
            "Completion risk is elevated, which suggests the protocol burden or tolerability profile may reduce "
            "real-world adherence even if treatment effects are acceptable."
        )

    if relative_lift_percent >= 22:
        return (
            "Treatment meaningfully outperforms control, indicating that the selected dosage and duration "
            "are generating a clear modeled efficacy signal."
        )

    return (
        "The run suggests a moderate treatment effect with manageable tradeoffs, but the benefit is not yet "
        "decisive enough to call the regimen clearly optimized."
    )


def run_drug_trial(params: dict) -> dict:
    dosage = float(params["dosage"])
    population_size = int(params["population_size"])
    age_group = str(params["age_group"])
    trial_duration_days = int(params["trial_duration_days"])

    age_response_multiplier = AGE_RESPONSE_MULTIPLIER.get(age_group, 0.95)
    age_risk_multiplier = AGE_RISK_MULTIPLIER.get(age_group, 1.04)
    age_effect_variability = AGE_EFFECT_VARIABILITY.get(age_group, 6.8)
    age_side_effect_concentration = AGE_SIDE_EFFECT_CONCENTRATION.get(age_group, 32.0)
    rng = np.random.default_rng(_deterministic_seed(params))

    treatment_size = population_size // 2
    control_size = population_size - treatment_size

    treatment_frame = _generate_arm(
        rng,
        "treatment",
        treatment_size,
        dosage,
        trial_duration_days,
        age_response_multiplier,
        age_risk_multiplier,
        age_effect_variability,
        age_side_effect_concentration,
    )
    control_frame = _generate_arm(
        rng,
        "control",
        control_size,
        dosage * 0.1,
        trial_duration_days,
        age_response_multiplier,
        age_risk_multiplier,
        age_effect_variability,
        age_side_effect_concentration,
    )

    study_frame = pd.concat([treatment_frame, control_frame], ignore_index=True)
    treatment_responses = treatment_frame["effective_response"]
    control_responses = control_frame["effective_response"]
    comparison = _arm_comparison(treatment_responses, control_responses)

    treatment_side_effect_rate = float(treatment_frame["side_effect"].mean() * 100.0)
    completion_rate = float(study_frame["completed"].mean() * 100.0)
    dropout_rate = 100.0 - completion_rate

    treatment_outcomes = (
        treatment_frame["outcome"]
        .value_counts()
        .reindex(["improved", "stable", "declined"], fill_value=0)
    )
    severity_share = (
        treatment_frame["event_severity"]
        .value_counts(normalize=True)
        .reindex(["mild", "moderate", "severe"], fill_value=0.0)
        * 100.0
    )
    confidence_interval = _mean_confidence_interval(treatment_responses)
    effect_curve, side_effect_curve = _curves(
        treatment_frame,
        dosage,
        trial_duration_days,
        age_response_multiplier,
        age_risk_multiplier,
    )

    average_response_score = round(float(treatment_responses.mean() - 0.18 * treatment_frame["side_effect"].sum()), 2)
    effectiveness_percent = round(float(treatment_responses.mean()), 2)
    side_effect_probability_percent = round(treatment_side_effect_rate, 2)
    dropout_rate_percent = round(dropout_rate, 2)
    insight_summary = _insight_summary(
        effectiveness_percent=effectiveness_percent,
        side_effect_probability_percent=side_effect_probability_percent,
        dropout_rate_percent=dropout_rate_percent,
        relative_lift_percent=comparison["relative_lift_percent"],
    )

    return {
        "insight_summary": insight_summary,
        "metrics": {
            "effectiveness_percent": effectiveness_percent,
            "side_effect_probability_percent": side_effect_probability_percent,
            "outcome_distribution": {
                "improved": int(treatment_outcomes["improved"]),
                "stable": int(treatment_outcomes["stable"]),
                "declined": int(treatment_outcomes["declined"]),
            },
            "average_response_score": average_response_score,
            "dropout_rate_percent": dropout_rate_percent,
        },
        "statistical_summary": {
            "efficacy_confidence_interval": confidence_interval,
            "treatment_vs_control": {
                "treatment_mean": comparison["treatment_mean"],
                "control_mean": comparison["control_mean"],
                "absolute_lift": comparison["absolute_lift"],
                "relative_lift_percent": comparison["relative_lift_percent"],
            },
            "p_value": comparison["p_value"],
            "adverse_event_breakdown": {
                "mild_percent": round(float(severity_share["mild"]), 2),
                "moderate_percent": round(float(severity_share["moderate"]), 2),
                "severe_percent": round(float(severity_share["severe"]), 2),
            },
            "completion_rate_percent": round(completion_rate, 2),
            "methodology": (
                "Two-arm Monte Carlo model with deterministic seeding, normal response distributions for "
                "patient-level effectiveness, beta-distributed side effect probabilities, age- and dose-sensitive "
                "variability, placebo control, adherence, dropout risk, and normal-approximation treatment effect inference."
            ),
        },
        "effect_curve": effect_curve,
        "side_effect_curve": side_effect_curve,
    }
