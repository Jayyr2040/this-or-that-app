/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecisionState } from "./types";

export const DEFAULT_STATE: DecisionState = {
  decision: "Stay in my current role or take the new job offer?",
  optionA: "Stay",
  optionB: "Switch",
  criteria: [
    {
      id: "salary-id-1",
      name: "Salary",
      weight: 4,
      scoreA: 3,
      scoreB: 5,
    },
    {
      id: "growth-id-2",
      name: "Growth potential",
      weight: 5,
      scoreA: 3,
      scoreB: 4,
    },
    {
      id: "commute-id-3",
      name: "Commute",
      weight: 2,
      scoreA: 4,
      scoreB: 2,
    },
    {
      id: "security-id-4",
      name: "Job security",
      weight: 3,
      scoreA: 5,
      scoreB: 3,
    },
    {
      id: "learning-id-5",
      name: "Learning opportunities",
      weight: 4,
      scoreA: 3,
      scoreB: 5,
    },
  ],
  firstStepText: "Talk to my mentor about the transition details and outline my training needs",
  firstStepDone: false,
};
