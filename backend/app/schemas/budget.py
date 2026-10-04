from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class CategoryBudgetProgress(BaseModel):
    category: str
    budget: float
    spent: float
    remaining: float
    percentage_used: float
    status: str  # safe | warning | near_limit | over_budget
    status_label: str  # "Safe spending" | "Warning" | "Near limit" | "Over budget"
    color: str

class BudgetCreate(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    total_budget: float = Field(..., gt=0, description="Total monthly budget")
    category_budgets: Optional[Dict[str, float]] = Field(default_factory=dict, description="Category spending caps")

class BudgetUpdate(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
    total_budget: Optional[float] = Field(None, gt=0, description="Total monthly budget")
    category_budgets: Optional[Dict[str, float]] = Field(None, description="Category spending caps")
    # Aliases for backward compatibility
    monthlyTotal: Optional[float] = None
    categories: Optional[Dict[str, float]] = None

class CategoryBudgetUpdate(BaseModel):
    amount: float = Field(..., ge=0)

class BudgetResponse(BaseModel):
    id: int
    month: int
    year: int
    total_budget: float
    total_spent: float
    remaining: float
    percentage_used: float
    status: str  # safe | warning | near_limit | over_budget
    status_label: str
    categories: List[CategoryBudgetProgress]
    category_budgets: Dict[str, float]
    ai_financial_data: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
