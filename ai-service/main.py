"""
Athletix AI — AI Service (FastAPI)

Responsibilities:
- Detect user intent from a chat/voice message
- Use ONLY the context handed to it by the Node backend (no direct DB access)
- Produce a natural-language response grounded in that context
- Return structured data (intent + extractedData) so the backend can validate
  and execute any write (SAVE_SET, SAVE_CARDIO) itself

This service is intentionally stateless per-request. Conversation history is
persisted by the backend (ai_conversations collection), not here.
"""
import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.schemas import ChatRequest, ChatResponse, BriefingRequest, BriefingResponse
from app.intents import detect_intent
from app.responder import build_response

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("athletix-ai-service")

app = FastAPI(title="Athletix AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:5000")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "athletix-ai-service"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    try:
        intent, extracted = detect_intent(req.message)
        context_dict = req.context.model_dump()
        response_text = build_response(intent, req.message, context_dict, extracted, execution=None)
        return ChatResponse(intent=intent, response=response_text, extractedData=extracted)
    except Exception as exc:  # noqa: BLE001
        logger.exception("chat handling failed")
        raise HTTPException(status_code=500, detail="AI service failed to process the message.") from exc


@app.post("/daily-briefing", response_model=BriefingResponse)
def daily_briefing(req: BriefingRequest):
    try:
        context = req.context
        if req.type == "evening":
            completed = context.completedTasks or ["kuch bhi record nahi hua"]
            pending = context.pendingTasks or []
            text = f"Aaj complete hua: {', '.join(completed)}."
            if pending:
                text += f" Abhi bhi pending: {', '.join(pending)}."
            else:
                text += " Sab kuch complete — great job!"
        else:
            w = context.todayPlan.workout
            c = context.todayPlan.cardio
            parts = ["Good morning!"]
            if w:
                parts.append(f"Aaj tumhara {w.muscleGroup or w.name} workout scheduled hai.")
            if c:
                dist = f" {c.distanceKm} km" if c.distanceKm else ""
                parts.append(f"Cardio: {c.activityType}{dist}.")
            if not w and not c:
                parts.append("Aaj ke liye koi plan record nahi mila — apna plan set karo.")
            text = " ".join(parts)
        return BriefingResponse(response=text)
    except Exception as exc:  # noqa: BLE001
        logger.exception("daily briefing failed")
        raise HTTPException(status_code=500, detail="AI service failed to generate the briefing.") from exc


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
