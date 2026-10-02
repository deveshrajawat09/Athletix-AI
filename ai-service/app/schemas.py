from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class WorkoutSummary(BaseModel):
    name: Optional[str] = None
    muscleGroup: Optional[str] = None
    status: Optional[str] = None


class CardioSummary(BaseModel):
    activityType: Optional[str] = None
    distanceKm: Optional[float] = None
    status: Optional[str] = None


class TodayPlan(BaseModel):
    workout: Optional[WorkoutSummary] = None
    cardio: Optional[CardioSummary] = None


class AIContext(BaseModel):
    """
    Mirrors what backend/src/services/contextBuilder.js sends.
    This is the ONLY user data the AI service is allowed to see —
    it must never be supplemented with invented facts.
    """
    currentDate: str
    todayPlan: TodayPlan = TodayPlan()
    yesterday: Dict[str, Any] = {}
    completedTasks: List[str] = []
    pendingTasks: List[str] = []
    recentHistory: List[Dict[str, Any]] = []
    recentCardio: List[Dict[str, Any]] = []
    fitnessGoals: List[str] = []


class ChatRequest(BaseModel):
    message: str
    context: AIContext


class ChatResponse(BaseModel):
    intent: str
    response: str
    extractedData: Dict[str, Any] = {}


class BriefingRequest(BaseModel):
    context: AIContext
    type: str = "morning"  # "morning" | "evening"


class BriefingResponse(BaseModel):
    response: str
