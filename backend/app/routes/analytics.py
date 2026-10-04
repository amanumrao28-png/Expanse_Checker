from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import calendar

from ..database import get_db
from ..models.user import User
from ..models.expense import Expense
from ..models.budget import Budget
from ..routes.budget import get_or_create_active_budget
from ..services.analytics_service import analytics_service
from ..services.auth_service import get_optional_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", status_code=status.HTTP_200_OK)
def get_summary(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Return summary numbers calculated strictly for the authenticated user from Supabase."""
    u_id = current_user.id if current_user else None
    return analytics_service.get_summary(db, user_id=u_id)

@router.get("/categories", status_code=status.HTTP_200_OK)
def get_categories(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Return category spending for user."""
    u_id = current_user.id if current_user else None
    return analytics_service.get_categories(db, user_id=u_id)

@router.get("/daily", status_code=status.HTTP_200_OK)
def get_daily(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Return spending grouped by date for user."""
    u_id = current_user.id if current_user else None
    return analytics_service.get_daily(db, user_id=u_id)

@router.get("/weekly", status_code=status.HTTP_200_OK)
def get_weekly(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Return spending grouped by week for user."""
    u_id = current_user.id if current_user else None
    return analytics_service.get_weekly(db, user_id=u_id)

@router.get("/monthly", status_code=status.HTTP_200_OK)
def get_monthly(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Return spending grouped by month for user."""
    u_id = current_user.id if current_user else None
    return analytics_service.get_monthly(db, user_id=u_id)

@router.get("/dashboard", status_code=status.HTTP_200_OK)
def get_dashboard(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Unified endpoint combining summary, category and trend data for Dashboard."""
    u_id = current_user.id if current_user else None
    summary = analytics_service.get_summary(db, user_id=u_id)
    categories = analytics_service.get_categories(db, user_id=u_id)
    daily = analytics_service.get_daily(db, user_id=u_id)
    weekly = analytics_service.get_weekly(db, user_id=u_id)
    monthly = analytics_service.get_monthly(db, user_id=u_id)

    category_chart_data = [
        {
            "id": c["category"].lower() if "category" in c else c["name"].lower(),
            "name": c["category"] if "category" in c else c["name"],
            "amount": c["amount"],
            "budget": c["budget"],
            "color": c["color"]
        }
        for c in categories if c["amount"] > 0
    ]

    return {
        "summary": summary,
        "categories": categories,
        "categoryData": category_chart_data,
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
        "totalSpent": summary["total_spent"],
        "monthlyBudget": summary["monthly_budget"],
        "remainingBudget": summary["remaining_budget"],
        "dailyAverage": summary["daily_average"],
        "percentOfBudget": summary["percentage_used"],
        "spendingChange": summary["spending_change_percentage"],
        "totalTransactions": summary["total_transactions"]
    }

@router.get("/report", status_code=status.HTTP_200_OK)
def get_monthly_report(
    month: Optional[str] = Query(None, description="Month in YYYY-MM format, defaults to current month"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Generate in-depth monthly report from Supabase for authenticated user."""
    now = datetime.utcnow()
    target_month = month or now.strftime("%Y-%m")
    u_id = current_user.id if current_user else None

    try:
        year_num, month_num = map(int, target_month.split("-"))
        month_name = f"{calendar.month_name[month_num]} {year_num}"
        days_in_month = calendar.monthrange(year_num, month_num)[1]
    except Exception:
        target_month = now.strftime("%Y-%m")
        month_name = f"{calendar.month_name[now.month]} {now.year}"
        days_in_month = calendar.monthrange(now.year, now.month)[1]

    if u_id is not None:
        all_expenses = db.query(Expense).filter(Expense.user_id == u_id).all()
        budget = db.query(Budget).filter(Budget.user_id == u_id).order_by(Budget.id.desc()).first()
    else:
        all_expenses = []
        budget = None

    month_expenses = [e for e in all_expenses if (e.date or "").startswith(target_month)]
    if not month_expenses and all_expenses and not month:
        month_expenses = all_expenses

    total_spent = round(sum(float(e.amount) for e in month_expenses), 2)
    total_budget = round(float(budget.total_budget), 2) if budget else 10000.0
    cat_budgets = budget.category_budgets if budget and budget.category_budgets else {}
    remaining_budget = round(total_budget - total_spent, 2)
    savings_rate = round(max(0.0, (remaining_budget / total_budget) * 100), 1) if total_budget > 0 else 0.0

    day_count = min(now.day, days_in_month) if target_month == now.strftime("%Y-%m") else days_in_month
    daily_average = round(total_spent / max(1, day_count), 2)

    STANDARD_CATEGORIES = ["Food", "Travel", "Education", "Shopping", "Entertainment", "Bills", "Healthcare", "Electronics", "Other"]
    category_breakdown = []
    for cat in STANDARD_CATEGORIES:
        spent = round(sum(float(e.amount) for e in month_expenses if (e.category or "").strip().lower() == cat.lower()), 2)
        b_cap = round(float(cat_budgets.get(cat, 0.0)), 2)
        pct_of_total = round((spent / total_spent) * 100, 1) if total_spent > 0 else 0.0
        pct_of_budget = round((spent / b_cap) * 100, 1) if b_cap > 0 else 0.0
        
        status_label = "Safe"
        if b_cap > 0:
            if spent > b_cap:
                status_label = "Over Budget"
            elif pct_of_budget >= 80:
                status_label = "Near Limit"

        category_breakdown.append({
            "category": cat,
            "spent": spent,
            "budget": b_cap,
            "percent_of_total": pct_of_total,
            "percent_of_budget": pct_of_budget,
            "status": status_label
        })

    category_breakdown.sort(key=lambda x: x["spent"], reverse=True)
    top_category = category_breakdown[0] if category_breakdown and category_breakdown[0]["spent"] > 0 else None

    pm_counts = {}
    for e in month_expenses:
        pm = e.payment_method or "Card"
        if pm not in pm_counts:
            pm_counts[pm] = {"count": 0, "amount": 0.0}
        pm_counts[pm]["count"] += 1
        pm_counts[pm]["amount"] += float(e.amount)

    pm_breakdown = [
        {"method": k, "count": v["count"], "amount": round(v["amount"], 2)}
        for k, v in pm_counts.items()
    ]

    recurring_total = round(sum(float(e.amount) for e in month_expenses if e.is_recurring), 2)

    highest_expense = None
    if month_expenses:
        sorted_by_amt = sorted(month_expenses, key=lambda x: float(x.amount), reverse=True)
        top_exp = sorted_by_amt[0]
        highest_expense = {
            "id": top_exp.id,
            "description": top_exp.description,
            "amount": float(top_exp.amount),
            "category": top_exp.category,
            "date": top_exp.date
        }

    pct_used = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0
    if pct_used >= 100:
        verdict = f"Critical: Budget exceeded by ₹{abs(remaining_budget):,.2f}. Discretionary freeze advised."
    elif pct_used >= 80:
        verdict = f"Warning: {pct_used}% of budget spent. Exercise discipline in {top_category['category'] if top_category else 'discretionary purchases'}."
    else:
        verdict = f"Healthy: On pace with ₹{remaining_budget:,.2f} remaining ({savings_rate}% savings buffer)."

    return {
        "month": target_month,
        "month_name": month_name,
        "total_spent": total_spent,
        "total_budget": total_budget,
        "remaining_budget": remaining_budget,
        "savings_rate_percentage": savings_rate,
        "budget_used_percentage": pct_used,
        "daily_average": daily_average,
        "total_transactions": len(month_expenses),
        "recurring_total": recurring_total,
        "highest_expense": highest_expense,
        "top_category": top_category,
        "category_breakdown": category_breakdown,
        "payment_methods": pm_breakdown,
        "ai_verdict": verdict
    }

@router.get("/compare", status_code=status.HTTP_200_OK)
def compare_spending_periods(
    month1: Optional[str] = Query(None, description="First month in YYYY-MM, defaults to current month"),
    month2: Optional[str] = Query(None, description="Second month in YYYY-MM, defaults to previous month"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Compare spending between two months for authenticated user."""
    now = datetime.utcnow()
    m1 = month1 or now.strftime("%Y-%m")
    u_id = current_user.id if current_user else None

    if not month2:
        first_m1 = datetime.strptime(m1 + "-01", "%Y-%m-%d")
        prev_date = first_m1 - timedelta(days=1)
        m2 = prev_date.strftime("%Y-%m")
    else:
        m2 = month2

    if u_id is not None:
        all_expenses = db.query(Expense).filter(Expense.user_id == u_id).all()
    else:
        all_expenses = []

    m1_expenses = [e for e in all_expenses if (e.date or "").startswith(m1)]
    m2_expenses = [e for e in all_expenses if (e.date or "").startswith(m2)]

    m1_total = round(sum(float(e.amount) for e in m1_expenses), 2)
    m2_total = round(sum(float(e.amount) for e in m2_expenses), 2)

    diff_amount = round(m1_total - m2_total, 2)
    if m2_total > 0:
        diff_pct = round(((m1_total - m2_total) / m2_total) * 100, 1)
    else:
        diff_pct = 100.0 if m1_total > 0 else 0.0

    STANDARD_CATEGORIES = ["Food", "Travel", "Education", "Shopping", "Entertainment", "Bills", "Healthcare", "Electronics", "Other"]
    category_deltas = []
    for cat in STANDARD_CATEGORIES:
        m1_cat = round(sum(float(e.amount) for e in m1_expenses if (e.category or "").strip().lower() == cat.lower()), 2)
        m2_cat = round(sum(float(e.amount) for e in m2_expenses if (e.category or "").strip().lower() == cat.lower()), 2)
        cat_diff = round(m1_cat - m2_cat, 2)
        if m2_cat > 0:
            cat_pct = round(((m1_cat - m2_cat) / m2_cat) * 100, 1)
        else:
            cat_pct = 100.0 if m1_cat > 0 else 0.0

        category_deltas.append({
            "category": cat,
            "period1_spent": m1_cat,
            "period2_spent": m2_cat,
            "difference": cat_diff,
            "percentage_change": cat_pct,
            "trend": "increased" if cat_diff > 0 else "decreased" if cat_diff < 0 else "same"
        })

    category_deltas.sort(key=lambda x: abs(x["difference"]), reverse=True)

    return {
        "period1": {
            "month": m1,
            "total_spent": m1_total,
            "transaction_count": len(m1_expenses)
        },
        "period2": {
            "month": m2,
            "total_spent": m2_total,
            "transaction_count": len(m2_expenses)
        },
        "difference_amount": diff_amount,
        "percentage_change": diff_pct,
        "trend": "increased" if diff_amount > 0 else "decreased" if diff_amount < 0 else "same",
        "category_deltas": category_deltas
    }
