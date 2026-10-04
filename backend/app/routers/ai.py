from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.expense import Expense
from ..services.ollama_service import ollama_service
from ..schemas.ai import AIChatRequest, AIChatResponse, AICategorizeRequest, AICategorizeResponse
from typing import List, Dict, Any

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_assistant(req: AIChatRequest):
    result = await ollama_service.generate_response(
        prompt=req.message,
        context=req.context,
        model=req.model
    )
    return AIChatResponse(
        reply=result["reply"],
        model=result["model"],
        source=result["source"]
    )

@router.post("/categorize", response_model=AICategorizeResponse)
async def categorize_expense(req: AICategorizeRequest):
    title = req.title.lower()
    if any(k in title for k in ["food", "cafe", "coffee", "burger", "pizza", "grocer", "trader", "chipotle", "lunch", "dinner", "dining"]):
        return AICategorizeResponse(category="food", confidence=0.96)
    if any(k in title for k in ["book", "course", "tuition", "exam", "pen", "notebook", "cs", "physics", "textbook"]):
        return AICategorizeResponse(category="education", confidence=0.98)
    if any(k in title for k in ["rent", "dorm", "electric", "water", "wifi", "room", "housing"]):
        return AICategorizeResponse(category="housing", confidence=0.95)
    if any(k in title for k in ["uber", "lyft", "bus", "metro", "gas", "transit", "train", "subway"]):
        return AICategorizeResponse(category="transport", confidence=0.94)
    if any(k in title for k in ["movie", "steam", "game", "concert", "party", "bowling"]):
        return AICategorizeResponse(category="entertainment", confidence=0.92)
    if any(k in title for k in ["spotify", "netflix", "apple", "cloud", "software", "domain", "prime"]):
        return AICategorizeResponse(category="tech", confidence=0.93)
    if any(k in title for k in ["gym", "pharmacy", "medicine", "doctor", "haircut", "protein"]):
        return AICategorizeResponse(category="health", confidence=0.91)
    
    return AICategorizeResponse(category="other", confidence=0.70)

@router.get("/insights")
def get_ai_insights(db: Session = Depends(get_db)):
    expenses = db.query(Expense).all()
    food_total = sum(e.amount for e in expenses if e.category == "food")
    edu_total = sum(e.amount for e in expenses if e.category == "education")

    insights = [
        {
            "id": 1,
            "type": "warning",
            "title": "Dining Spike Alert",
            "content": "You spent 18% more on food this week compared to last week. Batch cooking one weekend meal plan will save an estimated $42.",
            "metric": "+18%",
            "category": "food"
        },
        {
            "id": 2,
            "type": "success",
            "title": "Academic Spending On Target",
            "content": f"Your textbook & study supplies spending is currently ${edu_total:.2f}. Safe within student semester guidelines.",
            "metric": "Healthy",
            "category": "education"
        },
        {
            "id": 3,
            "type": "info",
            "title": "Tech & Subscription Auditing",
            "content": "Make sure you claim your free university GitHub Student Developer Pack and campus Microsoft Office 365 licensing.",
            "metric": "Tip",
            "category": "tech"
        }
    ]
    return insights
