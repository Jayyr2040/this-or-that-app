/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Criterion {
  id: string;
  name: string;
  weight: number; // 1-5
  scoreA: number; // 1-5
  scoreB: number; // 1-5
}

export interface DecisionState {
  decision: string;
  optionA: string;
  optionB: string;
  criteria: Criterion[];
  firstStepText: string;
  firstStepDone: boolean;
}
