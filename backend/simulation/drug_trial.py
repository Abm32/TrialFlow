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


def _generate_arm(
    rng: np.random.Generator,
    arm_name: str,
    size: int,
    dosage: float,
    duration_days: int,
    age_response_multiplier: float,
    age_risk_multiplier: float,
) -> pd.DataFrame:
    baseline_severity = rng.beta(2.4, 2.2, size=size) * 100
    adherence = rng.beta(9.5, 2.2 + (duration_days / 180.0), size=size)

    placebo_response = 7.5 + rng.normal(0, 4.0, size=size)
    treatment_component = _dose_response_effect(dosage) * age_response_multiplier * adherence
    onset_factor = _clamp(math.log1p(duration_days) / math.log(181.0), 0.2, 1.15)

    if arm_name == "treatment":
        efficacy_delta = treatment_component * onset_factor + placebo_response
    else:
        efficacy_delta = placebo_response * 0.92

    biomarker_noise = rng.normal(0, 6.0, size=size)
    response_score = np.clip(baseline_severity * 0.42 + efficacy_delta + biomarker_noise, 0, 100)

    side_effect_logit = (
        -2.7
        + 0.021 * dosage
        + 0.45 * age_risk_multiplier
        + (0.18 if arm_name == "treatment" else -0.08)
    )
    side_effect_probability = _normal_cdf(side_effect_logit)
    side_effect_events = rng.binomial(1, _clamp(side_effect_probability, 0.04, 0.72), size=size)

    severity_raw = rng.choice(
        ["none", "mild", "moderate", "severe"],
        size=size,
        p=[0.0, 0.63, 0.27, 0.10],
    )
    event_severity = np.where(side_effect_events == 1, severity_raw, "none")

    dropout_probability = np.clip(
        0.02
        + 0.00055 * duration_days
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


def run_drug_trial(params: dict) -> dict:
    dosage = float(params["dosage"])
    population_size = int(params["population_size"])
    age_group = str(params["age_group"])
    trial_duration_days = int(params["trial_duration_days"])

    age_response_multiplier = AGE_RESPONSE_MULTIPLIER.get(age_group, 0.95)
    age_risk_multiplier = AGE_RISK_MULTIPLIER.get(age_group, 1.04)
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
    )
    control_frame = _generate_arm(
        rng,
        "control",
        control_size,
        dosage * 0.1,
        trial_duration_days,
        age_response_multiplier,
        age_risk_multiplier,
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

    return {
        "metrics": {
            "effectiveness_percent": round(float(treatment_responses.mean()), 2),
            "side_effect_probability_percent": round(treatment_side_effect_rate, 2),
            "outcome_distribution": {
                "improved": int(treatment_outcomes["improved"]),
                "stable": int(treatment_outcomes["stable"]),
                "declined": int(treatment_outcomes["declined"]),
            },
            "average_response_score": average_response_score,
            "dropout_rate_percent": round(dropout_rate, 2),
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
                "Two-arm Monte Carlo model with deterministic seeding, Emax dose response, placebo control, "
                "patient adherence, dropout risk, and normal-approximation treatment effect inference."
            ),
        },
        "effect_curve": effect_curve,
        "side_effect_curve": side_effect_curve,
    }
