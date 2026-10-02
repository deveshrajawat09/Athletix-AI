"""
Rule-based intent detector for Athletix AI.

Keeps the system fast, offline-capable, and predictable for the fixed intent
set the product defines. An LLM call (see main.py) is used only to phrase the
final natural-language response — never to decide facts, and never to invent
data that isn't in the context passed to it.
"""
import re
from typing import Tuple, Dict, Any

INTENTS = [
    "GET_TODAY_PLAN", "GET_PAST_ACTIVITY", "GET_PENDING_TASKS", "GET_HEALTH_SUMMARY",
    "GET_PROGRESS", "GET_LAST_WORKOUT", "START_WORKOUT", "SAVE_WORKOUT", "SAVE_SET",
    "SAVE_CARDIO", "GET_NEXT_WORKOUT", "DAILY_SUMMARY", "UPDATE_GOAL",
]

# Patterns cover both Hinglish (romanized Hindi) and English phrasing, since the
# product's example conversations mix both.
PATTERNS = [
    ("GET_TODAY_PLAN", [r"aaj.*(?:kya|plan)", r"today.*plan", r"what.*today", r"today'?s?\s+plan"]),
    ("GET_PAST_ACTIVITY", [r"kal.*(?:maine|kya|activity)", r"yesterday", r"what did i do"]),
    ("GET_LAST_WORKOUT", [r"last.*workout", r"pichla.*workout", r"previous workout"]),
    ("GET_NEXT_WORKOUT", [r"kal.*workout", r"next.*workout", r"tomorrow.*workout"]),
    ("GET_PENDING_TASKS", [r"pending", r"baaki.*kya", r"remaining"]),
    ("GET_PROGRESS", [r"progress", r"weekly.*progress", r"kaisa.*chal.*raha"]),
    ("GET_HEALTH_SUMMARY", [r"health.*summary", r"heart\s*rate", r"sleep\b", r"weight\b.*kya"]),
    ("DAILY_SUMMARY", [r"daily.*summary", r"aaj.*summary", r"how.*day.*go"]),
    ("SAVE_SET", [r"set\s*save", r"save.*set", r"\d+(?:\.\d+)?\s*kg\s*[x×]\s*\d+\s*reps?"]),
    ("SAVE_CARDIO", [r"\d+(?:\.\d+)?\s*km", r"running.*hui", r"walk(?:ed)?\s*\d", r"cycling.*ki", r"save.*(?:run|cardio|walk|cycl)"]),
    ("SAVE_WORKOUT", [r"workout\s*save", r"complete.*workout", r"log.*workout"]),
    ("START_WORKOUT", [r"workout\s*start", r"start.*workout", r"begin\s*workout"]),
    ("UPDATE_GOAL", [r"goal\s*update", r"change.*goal", r"set.*goal"]),
]

# Very light extraction for the two writable intents (SAVE_CARDIO, SAVE_SET).
# Anything not found stays None — the backend will ask the user for it rather
# than the AI service guessing.
def extract_cardio_fields(message: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    dist = re.search(r"(\d+(\.\d+)?)\s*km", message, re.IGNORECASE)
    if dist:
        data["distanceKm"] = float(dist.group(1))
    for activity in ["running", "walking", "cycling", "jogging"]:
        if activity in message.lower():
            data["activityType"] = activity
            break
    dur = re.search(r"(\d+)\s*(min|minute)", message, re.IGNORECASE)
    if dur:
        data["durationMinutes"] = int(dur.group(1))
    return data


def extract_set_fields(message: str) -> Dict[str, Any]:
    data: Dict[str, Any] = {}
    combo = re.search(r"(\d+(\.\d+)?)\s*kg\s*[x×]\s*(\d+)\s*reps?", message, re.IGNORECASE)
    if combo:
        data["weight"] = float(combo.group(1))
        data["reps"] = int(combo.group(3))
    known_exercises = ["bench press", "squat", "deadlift", "incline dumbbell press", "cable fly", "push-up", "pull-up"]
    for ex in known_exercises:
        if ex in message.lower():
            data["exerciseName"] = ex.title()
            break
    return data


def detect_intent(message: str) -> Tuple[str, Dict[str, Any]]:
    text = message.strip().lower()

    for intent, patterns in PATTERNS:
        for pattern in patterns:
            if re.search(pattern, text):
                extracted: Dict[str, Any] = {}
                if intent == "SAVE_CARDIO":
                    extracted = extract_cardio_fields(text)
                elif intent == "SAVE_SET":
                    extracted = extract_set_fields(text)
                return intent, extracted

    return "UNKNOWN", {}
