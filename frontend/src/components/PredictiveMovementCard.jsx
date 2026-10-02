import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Dumbbell, Zap, ArrowRight, Activity, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';
import { getTodayPrediction, acceptPrediction } from '../api/prediction';

export default function PredictiveMovementCard({ onPlanAccepted }) {
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showAllMuscles, setShowAllMuscles] = useState(false);

  useEffect(() => {
    loadPrediction();
  }, []);

  async function loadPrediction() {
    try {
      const data = await getTodayPrediction();
      setPrediction(data);
    } catch (err) {
      console.error('Failed to load AI movement prediction', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptPlan() {
    setAccepting(true);
    try {
      await acceptPrediction();
      setAccepted(true);
      if (onPlanAccepted) onPlanAccepted();
      setTimeout(() => {
        navigate('/workout');
      }, 1200);
    } catch (err) {
      console.error('Failed to accept predicted plan', err);
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-6 text-gray-400">
        <Sparkles className="h-5 w-5 animate-spin mx-auto mb-2 text-primary-500" />
        <p className="text-xs">Analyzing fatigue, sets, and next movements...</p>
      </div>
    );
  }

  if (!prediction) return null;

  const readiness = prediction.muscleReadiness || {};
  const targetGroup = prediction.targetMuscleGroup;

  return (
    <div className="card space-y-4 border-2 border-primary-100/70 bg-[#f8fbf5] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3 border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary-600 text-white rounded-xl shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">AI Movement & Workout Predictor</h2>
              <span className="text-[10px] bg-primary-100 text-primary-800 font-semibold px-2 py-0.5 rounded-md">Adaptive AI</span>
            </div>
            <p className="text-xs text-gray-500">Continuous progression & recovery tracking</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
            {prediction.readinessScore}% Ready
          </span>
        </div>
      </div>

      {/* AI Rationale Box */}
      <div className="p-3 bg-white/90 rounded-xl border border-primary-100/60 text-xs text-gray-700 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-primary-700 text-[11px] uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5" /> AI Coach Movement Analysis
        </div>
        <p className="leading-relaxed">{prediction.aiRationale}</p>
      </div>

      {/* Predicted Movements List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Predicted movements for {prediction.targetMuscleGroup.toUpperCase()}</span>
          <span>{prediction.estimatedDurationMinutes} mins</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prediction.predictedMovements.map((mov, idx) => (
            <div key={idx} className="p-2.5 bg-white rounded-lg border border-gray-100 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 text-[10px] inline-flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  {mov.exerciseName}
                </p>
                <p className="text-[11px] text-primary-600 font-medium">{mov.overloadReason}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-gray-900">
                  {mov.setsCount} × {mov.targetReps} reps
                </span>
                {!mov.isBodyweight && (
                  <p className="text-[10px] text-gray-400">{mov.targetWeight} kg</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Muscle Recovery & Readiness Matrix */}
      <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary-600" /> Muscle Group Recovery Readiness
          </span>
          <button
            type="button"
            onClick={() => setShowAllMuscles(!showAllMuscles)}
            className="text-[11px] text-primary-600 hover:underline font-medium"
          >
            {showAllMuscles ? 'Collapse' : 'View All Muscles'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {Object.entries(readiness)
            .filter(([group]) => showAllMuscles || group === targetGroup || readiness[group].score >= 80)
            .map(([group, data]) => {
              const isTarget = group === targetGroup;
              const colorClass =
                data.score >= 85
                  ? 'bg-emerald-500'
                  : data.score >= 60
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

              return (
                <div
                  key={group}
                  className={`p-2 rounded-lg border ${
                    isTarget ? 'bg-primary-50/70 border-primary-200' : 'bg-gray-50/60 border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="capitalize font-medium text-gray-800 text-[11px]">{group}</span>
                    <span className="text-[10px] font-bold text-gray-700">{data.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Accept & Start Action */}
      <button
        type="button"
        onClick={handleAcceptPlan}
        disabled={accepting || accepted}
        className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
          accepted
            ? 'bg-emerald-600 text-white'
            : 'bg-primary-600 hover:bg-primary-700 text-white active:scale-[0.99]'
        }`}
      >
        {accepted ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Plan scheduled. Opening tracker...
          </>
        ) : accepting ? (
          <>
            <Sparkles className="h-4 w-4 animate-spin" /> Scheduling workout...
          </>
        ) : (
          <>
            <span>Accept Predicted Workout & Start Training</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
