from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.expense import Expense
from ..models.budget import Budget
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    expenses = db.query(Expense).all()
    budget_records = db.query(Budget).all()

    monthly_budget = 1500.0
    category_limits = {}
    for b in budget_records:
        if b.category:
            category_limits[b.category] = b.category_limit
        if b.monthly_total:
            monthly_budget = b.monthly_total

    total_spent = sum(e.amount for e in expenses)
    remaining_budget = monthly_budget - total_spent
    now = datetime.utcnow()
    daily_average = total_spent / max(1, now.day)

    # Category totals
    cat_totals = {}
    for e in expenses:
        cat_totals[e.category] = cat_totals.get(e.category, 0.0) + e.amount

    category_data = [
        {
            "id": cat,
            "name": cat.capitalize(),
            "amount": round(amt, 2),
            "budget": category_limits.get(cat, 100.0)
        }
        for cat, amt in cat_totals.items()
    ]

    return {
        "totalSpent": round(total_spent, 2),
        "monthlyBudget": monthly_budget,
        "remainingBudget": round(remaining_budget, 2),
        "dailyAverage": round(daily_average, 2),
        "percentOfBudget": round((total_spent / monthly_budget) * 100, 1) if monthly_budget else 0,
        "categoryData": category_data,
        "totalTransactions": len(expenses)
    }
