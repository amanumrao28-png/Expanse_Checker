from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class AIChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    model: Optional[str] = "gemma3"

class AIChatResponse(BaseModel):
    reply: str
    model: str
    source: str

class AICategorizeExpenseRequest(BaseModel):
    description: str = Field(..., min_length=1, description="Expense description to categorize")
    amount: Optional[float] = Field(None, description="Optional expense amount")

class AICategorizeExpenseResponse(BaseModel):
    category: str
    description: str
    reason: str
    source: Optional[str] = "ollama-gemma"
    success: Optional[bool] = True
    error: Optional[str] = None

class AINaturalExpenseRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Natural language expense statement")
    current_date: Optional[str] = Field(None, description="Client current date in YYYY-MM-DD format")

class AINaturalExpenseResponse(BaseModel):
    amount: Optional[float] = None
    category: str = "Other"
    description: str = ""
    date: str
    payment_method: Optional[str] = None
    needs_clarification: bool = False
    clarification_prompt: Optional[str] = None
    raw_text: str
    source: str = "ollama-gemma"
    success: bool = True
    error: Optional[str] = None

# Legacy aliases for backwards compatibility
class AICategorizeRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None

class AICategorizeResponse(BaseModel):
    category: str
    confidence: float = 0.95

class AIInsightItem(BaseModel):
    id: int
    type: str = "info"  # warning, success, info
    severity: str = "low"  # low, medium, high
    title: str
    explanation: str
    content: str  # alias for backwards compatibility
    metric: Optional[str] = None
    category: Optional[str] = None

class AIInsightResponse(BaseModel):
    insights: List[AIInsightItem]
    has_sufficient_data: bool = True
    message: Optional[str] = None
