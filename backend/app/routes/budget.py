from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import calendar
from typing import Optional, Dict, Any, List

from ..database import get_db
from ..models.user import User
from ..models.budget import Budget
from ..models.expense import Expense
from ..schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    CategoryBudgetUpdate,
    BudgetResponse,
    CategoryBudgetProgress
)
from ..services.auth_service import get_current_user, get_optional_user

router = APIRouter(tags=["Budgets"])

STANDARD_CATEGORIES = [
    {"name": "Food", "color": "#38bdf8", "default": 2500.0},
    {"name": "Travel", "color": "#06b6d4", "default": 1500.0},
    {"name": "Education", "color": "#a855f7", "default": 2000.0},
    {"name": "Shopping", "color": "#ec4899", "default": 1000.0},
    {"name": "Entertainment", "color": "#f43f5e", "default": 800.0},
    {"name": "Bills", "color": "#6366f1", "default": 1000.0},
    {"name": "Healthcare", "color": "#10b981", "default": 500.0},
    {"name": "Electronics", "color": "#3b82f6", "default": 500.0},
    {"name": "Other", "color": "#94a3b8", "default": 200.0}
]

def get_status_info(percentage: float):
    if percentage > 100:
        return "over_budget", "Over budget"
    elif percentage >= 85:
        return "near_limit", "Near limit"
    elif percentage >= 70:
        return "warning", "Warning"
    else:
        return "safe", "Safe spending"

def calculate_budget_summary(budget: Budget, db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Calculate all budget metrics from Supabase PostgreSQL for a specific user:
    - Total budget, Total spent, Remaining, Percentage used
    - For each category: Budget, Spent, Remaining, Percentage used, Visual status
    - AI-readable financial summary
    """
    now = datetime.utcnow()
    m = budget.month or now.month
    y = budget.year or now.year
    month_prefix = f"{y:04d}-{m:02d}"

    # Fetch expenses strictly for this user
    if user_id is not None:
        user_expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
    else:
        user_expenses = []

    month_expenses = [e for e in user_expenses if (e.date or "").startswith(month_prefix)]
    if not month_expenses and user_expenses:
        month_expenses = user_expenses

    total_spent = round(sum(float(e.amount) for e in month_expenses), 2)
    total_budget = round(float(budget.total_budget), 2)
    remaining = round(total_budget - total_spent, 2)
    percentage_used = round((total_spent / total_budget) * 100, 1) if total_budget > 0 else 0.0

    overall_status, overall_label = get_status_info(percentage_used)
    cat_budgets = budget.category_budgets or {}

    category_progress_list: List[Dict[str, Any]] = []
    category_health_dict: Dict[str, Any] = {}
    over_budget_cats = []
    near_limit_cats = []
    warning_cats = []
    safe_cats = []

    for cat_meta in STANDARD_CATEGORIES:
        name = cat_meta["name"]
        cat_budget = float(cat_budgets.get(name, cat_meta["default"]))

        cat_spent = round(sum(
            float(e.amount) for e in month_expenses 
            if (e.category or "").strip().lower() == name.lower()
        ), 2)

        cat_remaining = round(cat_budget - cat_spent, 2)
        cat_pct = round((cat_spent / cat_budget) * 100, 1) if cat_budget > 0 else 0.0
        c_status, c_label = get_status_info(cat_pct)

        if c_status == "over_budget":
            over_budget_cats.append(name)
        elif c_status == "near_limit":
            near_limit_cats.append(name)
        elif c_status == "warning":
            warning_cats.append(name)
        else:
            safe_cats.append(name)

        progress_item = {
            "category": name,
            "budget": round(cat_budget, 2),
            "spent": cat_spent,
            "remaining": cat_remaining,
            "percentage_used": cat_pct,
            "status": c_status,
            "status_label": c_label,
            "color": cat_meta["color"]
        }
        category_progress_list.append(progress_item)

        category_health_dict[name] = {
            "budget": round(cat_budget, 2),
            "spent": cat_spent,
            "remaining": cat_remaining,
            "percentage_used": f"{cat_pct}%",
            "status": c_label
        }

    month_name = calendar.month_name[m]
    days_in_month = calendar.monthrange(y, m)[1]
    day_today = min(now.day, days_in_month)
    daily_average = round(total_spent / max(1, day_today), 2)
    projected_spend = round(daily_average * days_in_month, 2)

    ai_financial_data = {
        "period": f"{month_name} {y}",
        "month": m,
        "year": y,
        "monthly_budget": total_budget,
        "total_spent": total_spent,
        "remaining_budget": remaining,
        "percentage_used": f"{percentage_used}%",
        "overall_status": overall_label,
        "daily_average_spending": daily_average,
        "projected_month_end": projected_spend,
        "category_health": category_health_dict,
        "flags": {
            "over_budget": over_budget_cats,
            "near_limit": near_limit_cats,
            "warning": warning_cats,
            "safe": safe_cats
        },
        "ai_prompt_context": (
            f"Student financial profile for {month_name} {y}: "
            f"Total budget is {total_budget}, with {total_spent} spent ({percentage_used}% used) "
            f"and {remaining} remaining. Status is '{overall_label}'. "
            f"Over-budget categories: {over_budget_cats or 'None'}. "
            f"Near-limit categories: {near_limit_cats or 'None'}."
        )
    }

    clean_cat_budgets = {c["category"]: c["budget"] for c in category_progress_list}

    return {
        "id": budget.id,
        "month": m,
        "year": y,
        "total_budget": total_budget,
        "total_spent": total_spent,
        "remaining": remaining,
        "percentage_used": percentage_used,
        "status": overall_status,
        "status_label": overall_label,
        "categories": category_progress_list,
        "category_budgets": clean_cat_budgets,
        "ai_financial_data": ai_financial_data,
        "created_at": budget.created_at,
        "updated_at": budget.updated_at
    }

def get_or_create_active_budget(
    db: Session,
    month: Optional[int] = None,
    year: Optional[int] = None,
    user_id: Optional[int] = None
) -> Budget:
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    query = db.query(Budget).filter(Budget.month == m, Budget.year == y)
    if user_id is not None:
        query = query.filter(Budget.user_id == user_id)
    
    b = query.first()
    if not b:
        initial_cats = {c["name"]: c["default"] for c in STANDARD_CATEGORIES}
        b = Budget(
            user_id=user_id,
            month=m,
            year=y,
            total_budget=10000.0,
            category_budgets=initial_cats
        )
        db.add(b)
        db.commit()
        db.refresh(b)
    return b

@router.get("/budget", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
@router.get("/budgets", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def get_budget(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000, le=2100),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Get active budget for authenticated user."""
    u_id = current_user.id if current_user else None
    budget = get_or_create_active_budget(db, month, year, user_id=u_id)
    return calculate_budget_summary(budget, db, user_id=u_id)

@router.post("/budget", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_set_budget(
    budget_in: BudgetCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create or set monthly budget for authenticated user."""
    now = datetime.utcnow()
    m = budget_in.month or now.month
    y = budget_in.year or now.year
    u_id = current_user.id if current_user else None

    query = db.query(Budget).filter(Budget.month == m, Budget.year == y)
    if u_id is not None:
        query = query.filter(Budget.user_id == u_id)
    b = query.first()

    if not b:
        b = Budget(
            user_id=u_id,
            month=m,
            year=y,
            total_budget=budget_in.total_budget,
            category_budgets=budget_in.category_budgets or {}
        )
        db.add(b)
    else:
        b.total_budget = budget_in.total_budget
        if budget_in.category_budgets:
            b.category_budgets = {**b.category_budgets, **budget_in.category_budgets}

    db.commit()
    db.refresh(b)
    return calculate_budget_summary(b, db, user_id=u_id)

@router.put("/budget", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
@router.put("/budgets", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def update_budget(
    budget_in: BudgetUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Update monthly budget for authenticated user."""
    now = datetime.utcnow()
    m = budget_in.month or now.month
    y = budget_in.year or now.year
    u_id = current_user.id if current_user else None

    b = get_or_create_active_budget(db, m, y, user_id=u_id)

    if budget_in.total_budget is not None:
        b.total_budget = budget_in.total_budget
    elif budget_in.monthlyTotal is not None:
        b.total_budget = budget_in.monthlyTotal

    new_cats = budget_in.category_budgets or budget_in.categories
    if new_cats is not None:
        current_cats = dict(b.category_budgets or {})
        current_cats.update(new_cats)
        
        # Verify that category totals do not exceed total_budget
        all_cats_sum = 0.0
        for cat_meta in STANDARD_CATEGORIES:
            name = cat_meta["name"]
            val = current_cats.get(name, cat_meta["default"])
            all_cats_sum += float(val)

        if round(all_cats_sum, 2) > round(float(b.total_budget), 2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum budget limit exceeded! Total category quotas ({all_cats_sum:,.2f}) exceed your monthly budget ({float(b.total_budget):,.2f})."
            )
        b.category_budgets = current_cats

    b.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(b)
    return calculate_budget_summary(b, db, user_id=u_id)

@router.put("/budget/category/{category_name}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
@router.put("/budgets/category/{category_name}", response_model=BudgetResponse, status_code=status.HTTP_200_OK)
def update_single_category_budget(
    category_name: str,
    data: CategoryBudgetUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Update single category quota for authenticated user with total budget limit validation."""
    u_id = current_user.id if current_user else None
    b = get_or_create_active_budget(db, user_id=u_id)
    current_cats = dict(b.category_budgets or {})

    # Calculate other categories sum
    other_cats_total = 0.0
    for cat_meta in STANDARD_CATEGORIES:
        name = cat_meta["name"]
        if name.lower() != category_name.lower():
            val = current_cats.get(name, cat_meta["default"])
            other_cats_total += float(val)

    total_budget = float(b.total_budget)
    new_amount = float(data.amount)
    if round(other_cats_total + new_amount, 2) > round(total_budget, 2):
        max_allowed = max(0.0, round(total_budget - other_cats_total, 2))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum budget limit exceeded! Total category budgets cannot exceed your monthly budget of {total_budget:,.2f}. Max allowed for {category_name} is {max_allowed:,.2f}."
        )

    current_cats[category_name] = data.amount
    b.category_budgets = current_cats
    b.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(b)
    return calculate_budget_summary(b, db, user_id=u_id)
