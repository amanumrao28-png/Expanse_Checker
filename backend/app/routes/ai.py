from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from ..database import get_db
from ..models.user import User
from ..models.expense import Expense
from ..services.auth_service import get_optional_user
from ..services.ai_service import ai_service
from ..schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AICategorizeExpenseRequest,
    AICategorizeExpenseResponse,
    AINaturalExpenseRequest,
    AINaturalExpenseResponse,
    AICategorizeRequest,
    AICategorizeResponse,
    AIInsightItem,
    AIInsightResponse
)
from .budget import get_or_create_active_budget, calculate_budget_summary

from datetime import datetime, timedelta
import calendar

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/chat", response_model=AIChatResponse, status_code=status.HTTP_200_OK)
async def chat_with_gemma(
    req: AIChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    AI Expense Assistant endpoint:
    1. Receive user question.
    2. Fetch relevant expense data from Supabase for authenticated user.
    3. Fetch current budget from Supabase for authenticated user.
    4. Calculate relevant statistics (totals, top category, biggest expense, daily safe budget, month-over-month).
    5. Build a structured context.
    6. Send the context + user question to Gemma through Ollama.
    7. Return the AI response grounded in real data.
    """
    now = datetime.utcnow()
    current_month_prefix = now.strftime("%Y-%m")
    
    first_this_month = datetime(now.year, now.month, 1)
    prev_month_date = first_this_month - timedelta(days=1)
    prev_month_prefix = prev_month_date.strftime("%Y-%m")

    u_id = current_user.id if current_user else None

    # 2. Fetch relevant expense data from Supabase
    if u_id is not None:
        all_expenses = db.query(Expense).filter(Expense.user_id == u_id).all()
    else:
        all_expenses = []

    current_month_expenses = [e for e in all_expenses if (e.date or "").startswith(current_month_prefix)]
    if not current_month_expenses and all_expenses:
        current_month_expenses = all_expenses

    prev_month_expenses = [e for e in all_expenses if (e.date or "").startswith(prev_month_prefix)]

    # 3. Fetch current budget
    budget = get_or_create_active_budget(db, user_id=u_id)
    total_budget = round(float(budget.total_budget), 2)
    cat_budgets = budget.category_budgets or {}

    # 4. Calculate relevant statistics
    cat_spent_map = {}
    for cat_name in ["Food", "Travel", "Education", "Shopping", "Entertainment", "Bills", "Healthcare", "Electronics", "Other"]:
        cat_spent_map[cat_name] = round(sum(
            float(e.amount) for e in current_month_expenses
            if (e.category or "").strip().lower() == cat_name.lower()
        ), 2)

    sorted_categories = sorted(cat_spent_map.items(), key=lambda x: x[1], reverse=True)
    top_category = sorted_categories[0][0] if sorted_categories else "None"
    top_category_amount = sorted_categories[0][1] if sorted_categories else 0.0

    total_spent = round(sum(float(e.amount) for e in current_month_expenses), 2)
    remaining_budget = round(total_budget - total_spent, 2)
    percentage_used = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

    # Biggest single transaction
    biggest_expense = None
    if current_month_expenses:
        sorted_by_amt = sorted(current_month_expenses, key=lambda e: float(e.amount), reverse=True)
        top_exp = sorted_by_amt[0]
        biggest_expense = {
            "description": top_exp.description or "Expense",
            "amount": float(top_exp.amount),
            "category": top_exp.category,
            "date": top_exp.date
        }

    # Calendar pacing
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    day_today = min(now.day, days_in_month)
    days_remaining = max(1, days_in_month - day_today)
    safe_daily_budget = round(max(0.0, remaining_budget) / days_remaining, 2)
    daily_average = round(total_spent / max(1, day_today), 2)

    # Previous month metrics
    prev_month_spent = round(sum(float(e.amount) for e in prev_month_expenses), 2)
    mom_change = round(total_spent - prev_month_spent, 2)

    # 5. Build structured context
    structured_context = {
        "currency": "₹",
        "total_budget": total_budget,
        "total_spent": total_spent,
        "remaining_budget": remaining_budget,
        "percentage_used": percentage_used,
        "top_category": top_category,
        "top_category_amount": top_category_amount,
        "category_breakdown": cat_spent_map,
        "category_budgets": cat_budgets,
        "sorted_categories": sorted_categories,
        "biggest_expense": biggest_expense,
        "previous_month_spent": prev_month_spent,
        "month_over_month_change": mom_change,
        "days_in_month": days_in_month,
        "day_today": day_today,
        "days_remaining": days_remaining,
        "safe_daily_budget": safe_daily_budget,
        "daily_average": daily_average,
        "current_month_name": calendar.month_name[now.month],
        "previous_month_name": calendar.month_name[prev_month_date.month],
        "total_transactions": len(current_month_expenses)
    }

    # Merge client context if provided
    if req.context:
        structured_context.update(req.context)

    # 6. Send context + user question to Gemma through Ollama
    res = await ai_service.chat(
        message=req.message,
        context=structured_context,
        model=req.model
    )

    # 7. Return the AI response
    return {
        "reply": res["reply"],
        "model": res.get("model", "gemma3"),
        "source": res.get("source", "ollama-gemma")
    }

@router.post("/categorize-expense", response_model=AICategorizeExpenseResponse, status_code=status.HTTP_200_OK)
async def categorize_expense_ai(req: AICategorizeExpenseRequest):
    """
    Categorize expense using local Ollama Gemma model with strict structured JSON output.
    Input:
        {"description": "Had pizza with friends", "amount": 250}
    Expected structured output:
        {"category": "Food", "description": "Pizza with friends", "reason": "Food purchase"}
    Gracefully returns error metadata and allows manual category selection if Ollama fails.
    """
    result = await ai_service.categorize_expense(description=req.description, amount=req.amount)
    return result

@router.post("/parse-natural-expense", response_model=AINaturalExpenseResponse, status_code=status.HTTP_200_OK)
@router.post("/parse-natural", response_model=AINaturalExpenseResponse, status_code=status.HTTP_200_OK)
async def parse_natural_expense_ai(req: AINaturalExpenseRequest):
    """
    Parse natural language student expense statements using local Gemma AI via Ollama.
    Extracts amount, category, description, date, and payment method into structured JSON.
    """
    result = await ai_service.parse_natural_expense(text=req.text, client_date=req.current_date)
    return result

@router.post("/categorize", status_code=status.HTTP_200_OK)
async def legacy_categorize_expense(req: AICategorizeRequest):
    """Legacy endpoint for fast category classification."""
    text = req.description or req.title or ""
    res = await ai_service.categorize_expense(description=text, amount=req.amount)
    return {
        "category": res["category"],
        "description": res["description"],
        "reason": res["reason"],
        "confidence": 0.95,
        "source": res.get("source", "ollama-gemma")
    }

@router.get("/insights", response_model=AIInsightResponse, status_code=status.HTTP_200_OK)
def get_insights(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Automatic AI financial insights endpoint:
    Analyzes real expenses and budgets in Supabase PostgreSQL to generate actionable,
    data-grounded financial alerts, trends, and saving recommendations.
    If there is insufficient data, returns a prompt to add more expenses.
    """
    u_id = current_user.id if current_user else None
    if u_id is not None:
        expenses = db.query(Expense).filter(Expense.user_id == u_id).all()
    else:
        expenses = []

    if len(expenses) < 2:
        return {
            "insights": [],
            "has_sufficient_data": False,
            "message": "Add more expenses to unlock personalized insights."
        }

    now = datetime.utcnow()
    current_month_prefix = now.strftime("%Y-%m")
    first_this_month = datetime(now.year, now.month, 1)
    prev_month_date = first_this_month - timedelta(days=1)
    prev_month_prefix = prev_month_date.strftime("%Y-%m")

    # Current month expenses
    curr_month_exps = [e for e in expenses if (e.date or "").startswith(current_month_prefix)]
    if not curr_month_exps:
        curr_month_exps = expenses

    prev_month_exps = [e for e in expenses if (e.date or "").startswith(prev_month_prefix)]

    total_spent = sum(float(e.amount) for e in curr_month_exps)
    if total_spent <= 0:
        return {
            "insights": [],
            "has_sufficient_data": False,
            "message": "Add more expenses to unlock personalized insights."
        }

    # Fetch active budget
    budget = get_or_create_active_budget(db, user_id=u_id)
    total_budget = float(budget.total_budget) if budget else 10000.0
    cat_budgets = budget.category_budgets or {}
    remaining_budget = max(0.0, total_budget - total_spent)

    # Category breakdown
    cat_spent_map = {}
    for e in curr_month_exps:
        cat = (e.category or "Other").strip()
        cat_spent_map[cat] = cat_spent_map.get(cat, 0.0) + float(e.amount)

    sorted_cats = sorted(cat_spent_map.items(), key=lambda x: x[1], reverse=True)
    top_cat, top_cat_amt = sorted_cats[0] if sorted_cats else ("Other", 0.0)
    top_cat_pct = round((top_cat_amt / total_spent) * 100, 1) if total_spent > 0 else 0.0

    # Week-over-week calculation
    curr_week_start = now - timedelta(days=now.weekday())
    curr_week_start_str = curr_week_start.strftime("%Y-%m-%d")
    prev_week_start = curr_week_start - timedelta(days=7)
    prev_week_start_str = prev_week_start.strftime("%Y-%m-%d")

    curr_week_exps = [e for e in expenses if (e.date or "") >= curr_week_start_str]
    prev_week_exps = [e for e in expenses if prev_week_start_str <= (e.date or "") < curr_week_start_str]

    curr_week_food = sum(float(e.amount) for e in curr_week_exps if (e.category or "").lower() == "food")
    prev_week_food = sum(float(e.amount) for e in prev_week_exps if (e.category or "").lower() == "food")
    curr_week_total = sum(float(e.amount) for e in curr_week_exps)
    prev_week_total = sum(float(e.amount) for e in prev_week_exps)

    insights_list = []
    insight_id = 1

    # 1. Highest Spending Category
    # Example: "Shopping accounts for 23% of your monthly expenses."
    highest_severity = "high" if top_cat_pct >= 40 else "medium"
    highest_type = "warning" if top_cat_pct >= 40 else "info"
    highest_text = f"{top_cat} accounts for {top_cat_pct}% of your monthly expenses (₹{top_cat_amt:,.2f} spent)."
    insights_list.append({
        "id": insight_id,
        "type": highest_type,
        "severity": highest_severity,
        "title": f"Highest Spending: {top_cat}",
        "explanation": highest_text,
        "content": highest_text,
        "metric": f"{top_cat_pct}% of Total",
        "category": top_cat
    })
    insight_id += 1

    # 2. Spending Compared with Previous Period / Unusual Spending Increase
    # Example: "You spent ₹950 on food this week compared to ₹650 last week."
    if curr_week_food > 0 and prev_week_food > 0:
        period_text = f"You spent ₹{curr_week_food:,.2f} on food this week compared to ₹{prev_week_food:,.2f} last week."
        period_severity = "medium" if curr_week_food > prev_week_food else "low"
        period_type = "warning" if curr_week_food > prev_week_food else "success"
        insights_list.append({
            "id": insight_id,
            "type": period_type,
            "severity": period_severity,
            "title": "Weekly Food Spending Comparison",
            "explanation": period_text,
            "content": period_text,
            "metric": f"₹{curr_week_food:,.0f} vs ₹{prev_week_food:,.0f}",
            "category": "Food"
        })
        insight_id += 1
    elif curr_week_total > 0 and prev_week_total > 0:
        diff_pct = round(((curr_week_total - prev_week_total) / prev_week_total) * 100, 1)
        period_text = f"You spent ₹{curr_week_total:,.2f} this week compared to ₹{prev_week_total:,.2f} last week."
        insights_list.append({
            "id": insight_id,
            "type": "warning" if curr_week_total > prev_week_total else "success",
            "severity": "medium" if curr_week_total > prev_week_total else "low",
            "title": "Weekly Spending Trajectory",
            "explanation": period_text,
            "content": period_text,
            "metric": f"{'+' if diff_pct > 0 else ''}{diff_pct}%",
            "category": top_cat
        })
        insight_id += 1
    else:
        # Check single transaction spike
        sorted_by_amt = sorted(curr_month_exps, key=lambda e: float(e.amount), reverse=True)
        top_single = sorted_by_amt[0] if sorted_by_amt else None
        if top_single and float(top_single.amount) >= 100:
            spike_amt = float(top_single.amount)
            spike_text = f"Unusual spending increase on {top_single.description}: single transaction of ₹{spike_amt:,.2f} in {top_single.category} on {top_single.date}."
            insights_list.append({
                "id": insight_id,
                "type": "warning",
                "severity": "high",
                "title": "Unusual Spending Increase",
                "explanation": spike_text,
                "content": spike_text,
                "metric": f"₹{spike_amt:,.2f}",
                "category": top_single.category
            })
            insight_id += 1

    # 3. Budget Nearing Limit / Monthly Budget Status
    # Example: "You have ₹1,550 remaining from your monthly budget."
    nearing_cat = None
    for c_name, c_spent in cat_spent_map.items():
        c_limit = cat_budgets.get(c_name, 0.0)
        if c_limit > 0 and (c_spent / c_limit) >= 0.75:
            nearing_cat = (c_name, c_spent, c_limit, round((c_spent / c_limit) * 100, 1))
            break

    if nearing_cat:
        c_name, c_spent, c_limit, c_pct = nearing_cat
        nearing_text = f"{c_name} budget is nearing limit: ₹{c_spent:,.2f} spent out of ₹{c_limit:,.2f} ({c_pct}% utilized)."
        insights_list.append({
            "id": insight_id,
            "type": "warning",
            "severity": "high" if c_pct >= 90 else "medium",
            "title": f"{c_name} Budget Nearing Limit",
            "explanation": nearing_text,
            "content": nearing_text,
            "metric": f"{c_pct}% Used",
            "category": c_name
        })
        insight_id += 1
    else:
        rem_text = f"You have ₹{remaining_budget:,.2f} remaining from your monthly budget of ₹{total_budget:,.2f}."
        insights_list.append({
            "id": insight_id,
            "type": "success" if remaining_budget > 0 else "danger",
            "severity": "low" if remaining_budget > 0 else "high",
            "title": "Monthly Budget Status",
            "explanation": rem_text,
            "content": rem_text,
            "metric": f"₹{remaining_budget:,.0f} Left",
            "category": "Budget"
        })
        insight_id += 1

    # 4. Spending compared with previous period (Month-over-Month)
    prev_month_total = sum(float(e.amount) for e in prev_month_exps)
    if prev_month_total > 0:
        mom_diff = total_spent - prev_month_total
        mom_dir = "higher" if mom_diff > 0 else "lower"
        mom_text = f"Your current spending of ₹{total_spent:,.2f} is ₹{abs(mom_diff):,.2f} {mom_dir} than last month's ₹{prev_month_total:,.2f}."
        insights_list.append({
            "id": insight_id,
            "type": "warning" if mom_diff > 0 else "success",
            "severity": "medium",
            "title": "Month-Over-Month Comparison",
            "explanation": mom_text,
            "content": mom_text,
            "metric": f"{'+' if mom_diff >= 0 else '-'}{abs(round((mom_diff/prev_month_total)*100))}%",
            "category": "Analytics"
        })
        insight_id += 1
    else:
        days_in_month = calendar.monthrange(now.year, now.month)[1]
        days_rem = max(1, days_in_month - now.day)
        safe_daily = round(remaining_budget / days_rem, 2)
        pacing_text = f"Your calculated safe spending pace is ₹{safe_daily:,.2f}/day across your remaining {days_rem} days this month."
        insights_list.append({
            "id": insight_id,
            "type": "info",
            "severity": "low",
            "title": "Daily Spending Pace",
            "explanation": pacing_text,
            "content": pacing_text,
            "metric": f"₹{safe_daily:,.0f}/day",
            "category": "Pacing"
        })
        insight_id += 1

    # 5. Potential Saving Opportunity
    saving_text = f"Potential Saving Opportunity: {top_cat} is your largest expense area (₹{top_cat_amt:,.2f}). Preparing dorm meals or batch cooking could save up to ₹400–₹600 this month."
    insights_list.append({
        "id": insight_id,
        "type": "success",
        "severity": "low",
        "title": "Potential Saving Opportunity",
        "explanation": saving_text,
        "content": saving_text,
        "metric": "Save ~₹500",
        "category": top_cat
    })

    return {
        "insights": insights_list,
        "has_sufficient_data": True,
        "message": None
    }
