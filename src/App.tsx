/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  Trash2, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Lightbulb, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Scale
} from "lucide-react";
import { Criterion, DecisionState } from "./types";
import { DEFAULT_STATE } from "./defaultData";

const LOCAL_STORAGE_KEY = "this_or_that_decision_state_v1";

export default function App() {
  // State initialization with localStorage fallback to DEFAULT_STATE worked example
  const [state, setState] = useState<DecisionState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            decision: parsed.decision ?? "",
            optionA: parsed.optionA ?? "",
            optionB: parsed.optionB ?? "",
            criteria: parsed.criteria ?? [],
            firstStepText: parsed.firstStepText ?? "",
            firstStepDone: parsed.firstStepDone ?? false,
          };
        }
      } catch (e) {
        console.error("Error restoring saved state from localStorage:", e);
      }
    }
    return DEFAULT_STATE;
  });

  // Keep state in sync with localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Helper inputs for adding a criterion
  const [newCriterionName, setNewCriterionName] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  // Handler to clear all data and start fresh
  const handleStartFresh = () => {
    const confirmClear = window.confirm(
      "Are you sure you want to start fresh? This will clear all your current criteria, options, and decision details."
    );
    if (confirmClear) {
      setState({
        decision: "",
        optionA: "",
        optionB: "",
        criteria: [],
        firstStepText: "",
        firstStepDone: false,
      });
      setNewCriterionName("");
    }
  };

  // Quick reset to default worked example
  const handleResetToExample = () => {
    const confirmReset = window.confirm(
      "Would you like to restore the 'Career Switch' worked example to see how the scoring system works?"
    );
    if (confirmReset) {
      setState(DEFAULT_STATE);
      setNewCriterionName("");
    }
  };

  // State update helpers
  const updateDecision = (val: string) => {
    setState((prev) => ({ ...prev, decision: val }));
  };

  const updateOptionA = (val: string) => {
    setState((prev) => ({ ...prev, optionA: val }));
  };

  const updateOptionB = (val: string) => {
    setState((prev) => ({ ...prev, optionB: val }));
  };

  const updateFirstStepText = (val: string) => {
    setState((prev) => ({ ...prev, firstStepText: val }));
  };

  const toggleFirstStepDone = () => {
    setState((prev) => ({ ...prev, firstStepDone: !prev.firstStepDone }));
  };

  // Criteria update functions
  const addTodoCriterion = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newCriterionName.trim();
    if (!trimmed) return;

    const newCrit: Criterion = {
      id: `crit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      weight: 3, // default
      scoreA: 3,  // default
      scoreB: 3,  // default
    };

    setState((prev) => ({
      ...prev,
      criteria: [...prev.criteria, newCrit],
    }));
    setNewCriterionName("");
  };

  const handleSuggestCriterion = async () => {
    if (!state.decision.trim()) return;
    setIsSuggesting(true);
    setSuggestionError(null);

    try {
      const response = await fetch("/api/suggest-criterion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: state.decision,
          currentCriteria: state.criteria.map((c) => c.name),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch suggestion");
      }

      const data = await response.json();
      const suggestion = data.suggestion;

      if (suggestion && suggestion.trim()) {
        const newCrit: Criterion = {
          id: `crit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: suggestion.trim(),
          weight: 3,
          scoreA: 3,
          scoreB: 3,
        };

        setState((prev) => ({
          ...prev,
          criteria: [...prev.criteria, newCrit],
        }));
      } else {
        throw new Error("No suggestion returned. Try updating your decision text.");
      }
    } catch (err: any) {
      console.error(err);
      setSuggestionError(err.message || "An error occurred");
    } finally {
      setIsSuggesting(false);
    }
  };

  const deleteCriterion = (id: string) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((c) => c.id !== id),
    }));
  };

  const updateCriterionName = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  };

  const updateCriterionWeight = (id: string, weight: number) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, weight } : c)),
    }));
  };

  const updateCriterionScoreA = (id: string, scoreA: number) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, scoreA } : c)),
    }));
  };

  const updateCriterionScoreB = (id: string, scoreB: number) => {
    setState((prev) => ({
      ...prev,
      criteria: prev.criteria.map((c) => (c.id === id ? { ...c, scoreB } : c)),
    }));
  };

  // Compute display option names
  const displayOptionA = state.optionA.trim() || "Option A";
  const displayOptionB = state.optionB.trim() || "Option B";

  // Calculate totals: sum of (weight * score)
  const totalA = state.criteria.reduce((sum, c) => sum + c.weight * c.scoreA, 0);
  const totalB = state.criteria.reduce((sum, c) => sum + c.weight * c.scoreB, 0);

  const maxTotal = Math.max(totalA, totalB);

  // Scaled bar percentages (relative to the larger total)
  const barPercentA = maxTotal > 0 ? (totalA / maxTotal) * 100 : 0;
  const barPercentB = maxTotal > 0 ? (totalB / maxTotal) * 100 : 0;

  // Verdict evaluation:
  // - If fewer than 3 criteria, "Add at least 3 criteria for a meaningful verdict"
  // - If they differ by more than 10%, "Leaning: [winning option name]"
  // - Otherwise, "Too close to call — your gut gets the casting vote."
  // Let's compute difference percentage relative to the maximum total
  const diffPercent = maxTotal > 0 ? (Math.abs(totalA - totalB) / maxTotal) * 100 : 0;
  const hasEnoughCriteria = state.criteria.length >= 3;

  const currentLeaderName = totalA > totalB ? displayOptionA : totalB > totalA ? displayOptionB : displayOptionA;
  const isTie = totalA === totalB;

  // First step placeholder dynamically changing based on the leader
  const firstStepLabel = `If I choose ${currentLeaderName}, my first step this week is...`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* SECTION 1: HEADER */}
        <header id="app-header" className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2 md:gap-3">
              <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-widest font-mono">
                Decision Engine
              </span>
              This or That
            </h1>
            <p className="text-slate-400 mt-1 font-medium text-sm md:text-base">
              Weigh a decision that matters
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              id="reset-example-btn"
              onClick={handleResetToExample}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-xl transition-all cursor-pointer"
              title="See a filled example to see how it works"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              View Example
            </button>
            <button
              id="start-fresh-btn"
              onClick={handleStartFresh}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start Fresh
            </button>
          </div>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT BENTO BLOCK: Inputs & Criteria (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* SECTION 2: MY DECISION */}
            <section id="decision-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  1. My Decision
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-grow">
                  <label htmlFor="decision-question-input" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">
                    What are you deciding?
                  </label>
                  <input
                    id="decision-question-input"
                    type="text"
                    value={state.decision}
                    onChange={(e) => updateDecision(e.target.value)}
                    placeholder="e.g. Stay in my current role or take the new job offer?"
                    className="w-full bg-slate-800 hover:bg-slate-800/80 focus:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-slate-500 text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="option-a-input" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">
                      Option A
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-md">
                        A
                      </span>
                      <input
                        id="option-a-input"
                        type="text"
                        value={state.optionA}
                        onChange={(e) => updateOptionA(e.target.value)}
                        placeholder="Option A Name"
                        className="w-full bg-slate-800 hover:bg-slate-800/80 focus:bg-slate-800 border-none rounded-xl pl-11 pr-4 py-2.5 text-indigo-300 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-slate-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="option-b-input" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1.5 block">
                      Option B
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                        B
                      </span>
                      <input
                        id="option-b-input"
                        type="text"
                        value={state.optionB}
                        onChange={(e) => updateOptionB(e.target.value)}
                        placeholder="Option B Name"
                        className="w-full bg-slate-800 hover:bg-slate-800/80 focus:bg-slate-800 border-none rounded-xl pl-11 pr-4 py-2.5 text-emerald-300 font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-slate-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: WHAT MATTERS TO ME */}
            <section id="criteria-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-4 flex-grow">
              <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    2. What Matters to Me
                  </h2>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800/60 border border-slate-800 rounded-lg text-[10px] font-mono font-semibold text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Weight × Score
                </div>
              </div>

              {/* CRITERION FORM INPUT */}
              <form onSubmit={addTodoCriterion} className="flex gap-2">
                <input
                  id="new-criterion-input"
                  type="text"
                  value={newCriterionName}
                  onChange={(e) => setNewCriterionName(e.target.value)}
                  placeholder="Add a criterion (e.g. salary, commute)..."
                  className="flex-1 bg-slate-800 hover:bg-slate-800/80 focus:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-white font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none placeholder-slate-500 text-sm"
                />
                <button
                  id="add-criterion-btn"
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-900/30"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </form>

              {/* GEMINI SUGGESTION BUTTON */}
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <button
                  id="suggest-criterion-btn"
                  type="button"
                  onClick={handleSuggestCriterion}
                  disabled={isSuggesting || !state.decision.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all cursor-pointer"
                  title={!state.decision.trim() ? "Define your decision question first to get suggestions" : "Let Gemini suggest a relevant decision criterion"}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSuggesting ? "animate-spin text-indigo-400" : "text-indigo-400"}`} />
                  {isSuggesting ? "Analyzing decision..." : "Suggest a criterion I might have missed"}
                </button>
                {suggestionError && (
                  <span className="text-xs text-rose-400 font-semibold bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">
                    {suggestionError}
                  </span>
                )}
                {!state.decision.trim() && !suggestionError && (
                  <span className="text-[10px] text-slate-500 font-semibold italic">
                    (Specify what you are deciding in step 1 to enable suggestions)
                  </span>
                )}
              </div>

              {/* LIST OF CRITERIA */}
              <div className="space-y-2 flex-grow">
                {/* Header row on desktop */}
                {state.criteria.length > 0 && (
                  <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800">
                    <div className="col-span-5">Criterion Factor</div>
                    <div className="col-span-2 text-center">Weight</div>
                    <div className="col-span-2 text-center">{displayOptionA}</div>
                    <div className="col-span-2 text-center">{displayOptionB}</div>
                    <div className="col-span-1"></div>
                  </div>
                )}

                {/* Criteria Rows */}
                {state.criteria.length > 0 ? (
                  <div className="space-y-2">
                    {state.criteria.map((crit) => (
                      <div
                        key={crit.id}
                        id={`criterion-row-${crit.id}`}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-800/40 border border-slate-800/60 p-3 rounded-xl items-center hover:bg-slate-800/80 transition-colors duration-150"
                      >
                        {/* Criterion Name / Input */}
                        <div className="md:col-span-5">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold md:hidden block mb-1">
                            Criterion Factor
                          </span>
                          <input
                            type="text"
                            value={crit.name}
                            onChange={(e) => updateCriterionName(crit.id, e.target.value)}
                            placeholder="Criterion Factor Name"
                            className="w-full px-2.5 py-1 text-sm font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:bg-slate-850 rounded-md transition outline-none"
                          />
                        </div>

                        {/* Weight Selector */}
                        <div className="md:col-span-2 flex flex-col md:block">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold md:hidden mb-1">
                            Weight (Importance)
                          </span>
                          <select
                            value={crit.weight}
                            onChange={(e) => updateCriterionWeight(crit.id, parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm rounded-xl px-2.5 py-1.5 font-mono text-center outline-none transition cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num} className="bg-slate-900">
                                {num} {num === 5 ? "🔥" : num === 1 ? "💤" : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Score Option A */}
                        <div className="md:col-span-2 flex flex-col md:block">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold md:hidden mb-1">
                            Score for {displayOptionA}
                          </span>
                          <select
                            value={crit.scoreA}
                            onChange={(e) => updateCriterionScoreA(crit.id, parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 text-sm rounded-xl px-2.5 py-1.5 font-mono text-center outline-none transition cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num} className="bg-slate-900">
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Score Option B */}
                        <div className="md:col-span-2 flex flex-col md:block">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold md:hidden mb-1">
                            Score for {displayOptionB}
                          </span>
                          <select
                            value={crit.scoreB}
                            onChange={(e) => updateCriterionScoreB(crit.id, parseInt(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-emerald-300 text-sm rounded-xl px-2.5 py-1.5 font-mono text-center outline-none transition cursor-pointer"
                          >
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option key={num} value={num} className="bg-slate-900">
                                {num}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete Action */}
                        <div className="md:col-span-1 flex justify-end items-center pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => deleteCriterion(crit.id)}
                            className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                            title="Delete criterion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // MANDATORY: Empty state placeholder
                  <div id="criteria-empty-state" className="flex flex-col items-center justify-center text-center p-8 bg-slate-900/60 rounded-xl border border-dashed border-slate-800 space-y-2 mt-4">
                    <HelpCircle className="w-8 h-8 text-slate-700" />
                    <p className="text-sm font-semibold text-slate-400">No criteria factors defined yet</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Specify criteria such as Salary, Work-life balance, or Commute time to calculate your optimal direction.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT BENTO BLOCK: The Verdict & First Step (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* SECTION 4: THE VERDICT */}
            <section id="verdict-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full min-h-[380px] gap-6">
              <div>
                <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Scale className="w-4 h-4 text-indigo-500" />
                  3. The Verdict
                </h2>
              </div>

              {/* Scaled Div Bars */}
              <div className="space-y-6 flex-grow flex flex-col justify-center">
                {/* Option A Result */}
                <div id="option-a-result-container" className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                      <span className="font-bold text-slate-300">{displayOptionA}</span>
                    </div>
                    <div className="font-mono font-extrabold text-indigo-400 text-lg">
                      {totalA} <span className="text-xs font-medium text-slate-500">pts</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-8 overflow-hidden relative shadow-inner">
                    <div
                      id="option-a-progress-bar"
                      className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out flex items-center justify-end px-3"
                      style={{ width: `${Math.max(barPercentA, 2)}%` }}
                    >
                      {totalA > 0 && barPercentA > 20 && (
                        <span className="text-[10px] font-bold text-indigo-100 font-mono">
                          {Math.round(barPercentA)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option B Result */}
                <div id="option-b-result-container" className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-slate-300">{displayOptionB}</span>
                    </div>
                    <div className="font-mono font-extrabold text-emerald-400 text-lg">
                      {totalB} <span className="text-xs font-medium text-slate-500">pts</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-8 overflow-hidden relative shadow-inner border border-emerald-500/10">
                    <div
                      id="option-b-progress-bar"
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out flex items-center justify-end px-3"
                      style={{ width: `${Math.max(barPercentB, 2)}%` }}
                    >
                      {totalB > 0 && barPercentB > 20 && (
                        <span className="text-[10px] font-bold text-emerald-950 font-mono">
                          {Math.round(barPercentB)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verdict Banner */}
              <div id="verdict-banner-container" className="mt-auto">
                {!hasEnoughCriteria ? (
                  // Fewer than 3 criteria message
                  <div id="verdict-insufficient-criteria" className="bg-slate-800/50 border border-slate-800 rounded-xl p-4 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Evaluation Blocked
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add at least 3 criteria for a meaningful verdict (currently has {state.criteria.length}/3).
                    </p>
                  </div>
                ) : (
                  // Active Assessment Banner
                  <div
                    id="verdict-assessment-banner"
                    className={`border rounded-xl p-4 text-center transition-all duration-300 ${
                      isTie 
                        ? "bg-slate-800/60 border-slate-700 text-slate-300" 
                        : diffPercent > 10 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <p className="font-bold uppercase tracking-widest text-[10px] text-slate-400 mb-1">
                      {diffPercent > 10 ? "Recommendation" : "Balanced Evaluation"}
                    </p>
                    <p className="text-base md:text-lg font-black text-white leading-tight">
                      {diffPercent > 10 ? (
                        <span>Leaning: {currentLeaderName}</span>
                      ) : (
                        <span className="text-slate-200">Too close to call — your gut gets the casting vote.</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {diffPercent > 10 
                        ? `Option outweighs counterpart by ${Math.round(diffPercent)}%.` 
                        : `Difference is only ${Math.round(diffPercent)}% (within 10% tie-breaker limit).`
                      }
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 5: FIRST STEP */}
            <section id="first-step-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
              <div>
                <h2 className="text-sm uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                  4. First Step
                </h2>
              </div>

              <div className="space-y-3">
                <label htmlFor="first-step-input" className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  {firstStepLabel}
                </label>
                
                <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700 hover:border-slate-600 transition-all">
                  <input
                    id="first-step-done-checkbox"
                    type="checkbox"
                    checked={state.firstStepDone}
                    onChange={toggleFirstStepDone}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <input
                    id="first-step-input"
                    type="text"
                    value={state.firstStepText}
                    onChange={(e) => updateFirstStepText(e.target.value)}
                    placeholder="Describe a simple starting action item..."
                    className={`bg-transparent border-none w-full text-sm outline-none text-slate-100 placeholder-slate-500 focus:ring-0 ${
                      state.firstStepDone ? "line-through text-slate-500" : ""
                    }`}
                  />
                </div>

                {/* Validation placeholder feedback */}
                {!state.firstStepText.trim() && (
                  <div id="first-step-placeholder-helper" className="text-[10px] font-bold text-amber-500/80 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                    Type a clear task to prevent analysis paralysis!
                  </div>
                )}
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
