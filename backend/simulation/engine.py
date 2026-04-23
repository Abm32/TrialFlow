from backend.simulation.drug_trial import run_drug_trial


def run_simulation(simulation_type: str, params: dict) -> dict:
    if simulation_type == "drug_trial":
        return run_drug_trial(params)
    raise ValueError(f"Unsupported simulation type: {simulation_type}")
