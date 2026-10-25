// Deterministic ROI math. No model call happens in this file, on purpose.
// The model (via the compute_roi tool) may only supply hoursPerWeekSaved and
// peopleAffected as inputs; every dollar figure below is plain arithmetic.
// This is the same separation Vedette uses: the model proposes hours and
// scope, code computes money.

export interface RoiInput {
  hoursPerWeekSaved: number;
  peopleAffected: number;
  hourlyCost: number; // fully loaded hourly cost of the people affected
  adoptionRampWeeks?: number; // weeks to reach full adoption, default 4
}

export interface RoiResult {
  weeklyHoursSaved: number;
  annualHoursSaved: number;
  annualDollarsSaved: number;
  adoptionRampWeeks: number;
  steadyStateWeek: number;
}

export function computeRoi(input: RoiInput): RoiResult {
  const { hoursPerWeekSaved, peopleAffected, hourlyCost } = input;
  const adoptionRampWeeks = input.adoptionRampWeeks ?? 4;

  if (hoursPerWeekSaved < 0 || peopleAffected < 0 || hourlyCost < 0) {
    throw new Error("ROI inputs must be non-negative.");
  }

  const weeklyHoursSaved = hoursPerWeekSaved * peopleAffected;

  // Linear ramp to full adoption, then steady state for the rest of the year.
  const rampWeeks = Math.min(adoptionRampWeeks, 52);
  const rampHours = (weeklyHoursSaved / 2) * rampWeeks; // triangular ramp
  const steadyWeeks = 52 - rampWeeks;
  const steadyHours = weeklyHoursSaved * steadyWeeks;
  const annualHoursSaved = rampHours + steadyHours;

  const annualDollarsSaved = annualHoursSaved * hourlyCost;

  return {
    weeklyHoursSaved,
    annualHoursSaved: Math.round(annualHoursSaved * 100) / 100,
    annualDollarsSaved: Math.round(annualDollarsSaved * 100) / 100,
    adoptionRampWeeks: rampWeeks,
    steadyStateWeek: rampWeeks + 1,
  };
}
