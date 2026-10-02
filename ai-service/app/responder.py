"""
Turns (intent, context, extractedData) into a natural-language reply.

CRITICAL RULE: the response must only describe data present in `context`
(sent by the Node backend, which reads it straight from MongoDB). This module
never fabricates workouts, distances, or health readings. When data is
missing, it says so plainly instead of guessing.
"""
from typing import Dict, Any


def _fmt_workout(w):
    if not w:
        return None
    status = w.get("status")
    name = w.get("name") or w.get("muscleGroup") or "workout"
    return name, status


def build_response(intent: str, message: str, context: Dict[str, Any], extracted: Dict[str, Any], execution: Dict[str, Any] = None) -> str:
    today_plan = context.get("todayPlan", {}) or {}
    yesterday = context.get("yesterday", {}) or {}

    if intent == "GET_TODAY_PLAN":
        parts = []
        w = today_plan.get("workout")
        c = today_plan.get("cardio")
        if w:
            parts.append(f"Aaj tumhara {w.get('muscleGroup', w.get('name', 'workout'))} workout planned hai (status: {w.get('status')}).")
        if c:
            dist = c.get("distanceKm")
            parts.append(f"Cardio: {c.get('activityType')}{f' {dist} km' if dist else ''} (status: {c.get('status')}).")
        if not parts:
            return "Aaj ke liye koi workout ya cardio plan record nahi mila."
        return " ".join(parts)

    if intent == "GET_PAST_ACTIVITY":
        parts = []
        yw = yesterday.get("workout")
        yc = yesterday.get("cardio")
        if yw:
            yw_status = yw.get("status")
            yw_phrase = "complete kiya tha" if yw_status == "completed" else f"({yw_status})"
            parts.append(f"Kal tumne {yw.get('name')} {yw_phrase}.")
        if yc:
            dist = yc.get("distanceKm")
            dist_str = f" {dist} km" if dist else ""
            yc_status = yc.get("status")
            yc_phrase = "complete ki" if yc_status == "completed" else f"({yc_status})"
            parts.append(f"{yc.get('activityType')}{dist_str} bhi {yc_phrase}.")
        if not parts:
            return "Kal ke liye koi activity record nahi mili."
        return " ".join(parts)

    if intent == "GET_LAST_WORKOUT":
        history = context.get("recentHistory", [])
        if not history:
            return "Koi previous workout record nahi mila."
        last = history[0]
        return f"Tumhara last workout tha: {last.get('activity')} ({last.get('date')}), status: {last.get('status')}."

    if intent == "GET_NEXT_WORKOUT":
        w = today_plan.get("workout")
        if w:
            return f"Agla planned workout: {w.get('muscleGroup', w.get('name'))}."
        return "Koi next workout plan record nahi mila."

    if intent == "GET_PENDING_TASKS":
        pending = context.get("pendingTasks", [])
        if not pending:
            return "Koi pending task nahi hai — sab kuch up to date hai!"
        return "Pending: " + ", ".join(pending) + "."

    if intent == "GET_PROGRESS" or intent == "DAILY_SUMMARY":
        completed = context.get("completedTasks", [])
        goals = context.get("fitnessGoals", [])
        msg = f"Completed: {', '.join(completed) if completed else 'kuch bhi nahi abhi tak'}."
        if goals:
            msg += " Goals: " + "; ".join(goals) + "."
        return msg

    if intent == "GET_HEALTH_SUMMARY":
        return "Health summary sirf recorded data se banayi jaati hai — is request ke liye latest metrics dashboard se check karo, ya specific metric (heart rate, sleep, steps) pucho."

    if intent == "SAVE_CARDIO":
        if execution and execution.get("executed"):
            r = execution["result"]
            return f"Save ho gaya: {r.get('activityType')} {r.get('distanceKm', '')} km."
        if execution and execution.get("reason") == "missing_fields":
            needs = ", ".join(execution.get("needs", []))
            return f"Kuch details missing hain: {needs}. Bata do."
        return "Cardio save nahi ho paaya — thoda detail aur do (activity type aur distance ya duration)."

    if intent == "SAVE_SET":
        if execution and execution.get("executed"):
            return "Set save ho gaya!"
        if execution and execution.get("reason") == "missing_fields":
            return "Kaunsa exercise, kitna weight aur kitne reps?"
        if execution and execution.get("reason") == "no_active_workout":
            return "Koi active workout nahi mila — pehle workout start karo."
        return "Set save nahi ho paaya, dobara try karo."

    if intent == "START_WORKOUT":
        return "Workout start karne ke liye Workout tab pe jao aur 'Start Workout' dabao."

    if intent == "SAVE_WORKOUT":
        return "Workout complete mark karne ke liye Workout page par jaake 'Mark Complete' dabao, ya mujhe exact exercise details batao."

    if intent == "UPDATE_GOAL":
        return "Goal update karne ke liye Goals page use karo, ya mujhe naya target batao."

    return "Samajh nahi aaya. Tum 'aaj kya karna hai', 'kal maine kya kiya', ya 'meri progress batao' jaisa pooch sakte ho."
