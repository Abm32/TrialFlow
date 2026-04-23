from __future__ import annotations

import math

import numpy as np
import pandas as pd


AGE_RESPONSE_MULTIPLIER = {
    "18-30": 1.08,
    "31-45": 1.0,
    "46-60": 0.94,
    "61+": 0.88,
}


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def run_drug_trial(params: dict) -> dict:
    dosage = float(params["dosage"])
    population_size = int(params["population_size"])
    age_group = str(params["age_group"])
    trial_duration_days = int(params["trial_duration_days"])

    age_multiplier = AGE_RESPONSE_MULTIPLIER.get(age_group, 0.96)
    dosage_factor = _clamp(dosage / 100.0, 0.35, 1.6)
    duration_factor = _clamp(math.log1p(trial_duration_days) / math.log(181), 0.25, 1.15)

    base_effectiveness = _clamp(45 + (30 * dosage_factor * age_multiplier * duration_factor), 30, 92)
    base_side_effects = _clamp(8 + (18 * dosage_factor) + (5 * (1.12 - age_multiplier)), 6, 48)

    rng = np.random.default_rng()
    response_scores = rng.normal(loc=base_effectiveness, scale=11.5, size=population_size)
    response_scores = np.clip(response_scores, 0, 100)

    side_effect_events = rng.binomial(
        n=1,
        p=_clamp(base_side_effects / 100.0, 0.05, 0.6),
        size=population_size,
    )

    outcomes = pd.Series(response_scores).map(
        lambda score: "improved" if score >= 65 else "stable" if score >= 40 else "declined"
    )
    outcome_distribution = outcomes.value_counts().reindex(["improved", "stable", "declined"], fill_value=0)

    checkpoints = np.linspace(1, trial_duration_days, num=min(8, trial_duration_days), dtype=int)
    effect_curve = []
    side_effect_curve = []
    for day in checkpoints:
        progress_ratio = day / trial_duration_days
        effect_curve.append(
            {
                "label": f"Day {day}",
                "value": round(_clamp(base_effectiveness * (0.38 + 0.62 * progress_ratio), 0, 100), 2),
            }
        )
        side_effect_curve.append(
            {
                "label": f"Day {day}",
                "value": round(_clamp(base_side_effects * (0.7 + 0.3 * progress_ratio), 0, 100), 2),
            }
        )

    effectiveness_percent = round(float(response_scores.mean()), 2)
    side_effect_probability_percent = round(float(side_effect_events.mean() * 100), 2)
    average_response_score = round(float(response_scores.mean() - (side_effect_events.mean() * 7.5)), 2)

    return {
        "metrics": {
            "effectiveness_percent": effectiveness_percent,
            "side_effect_probability_percent": side_effect_probability_percent,
            "outcome_distribution": {
                "improved": int(outcome_distribution["improved"]),
                "stable": int(outcome_distribution["stable"]),
                "declined": int(outcome_distribution["declined"]),
            },
            "average_response_score": average_response_score,
        },
        "effect_curve": effect_curve,
        "side_effect_curve": side_effect_curve,
    }
