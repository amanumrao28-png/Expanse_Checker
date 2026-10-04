from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models.expense import Expense
from ..models.budget import Budget
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

STANDARD_CATEGORIES = [
    {"name": "Food", "color": "#38bdf8", "defaultBudget": 2500.0},
    {"name": "Travel", "color": "#06b6d4", "defaultBudget": 1500.0},
    {"name": "Education", "color": "#a855f7", "defaultBudget": 2000.0},
    {"name": "Shopping", "color": "#ec4899", "defaultBudget": 1000.0},
    {"name": "Entertainment", "color": "#f43f5e", "defaultBudget": 800.0},
    {"name": "Bills", "color": "#6366f1", "defaultBudget": 1000.0},
    {"name": "Healthcare", "color": "#10b981", "defaultBudget": 500.0},
    {"name": "Electronics", "color": "#3b82f6", "defaultBudget": 500.0},
    {"name": "Other", "color": "#94a3b8", "defaultBudget": 200.0}
]

class AnalyticsService:
    def get_summary(self, db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Calculate summary numbers strictly from Supabase PostgreSQL for a specific user.
        """
        now = datetime.utcnow()
        current_month_str = now.strftime("%Y-%m")
        
        first_of_current = datetime(now.year, now.month, 1)
        last_of_prev = first_of_current - timedelta(days=1)
        prev_month_str = last_of_prev.strftime("%Y-%m")

        if user_id is not None:
            all_expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
            budget_rec = db.query(Budget).filter(Budget.user_id == user_id).order_by(Budget.id.desc()).first()
        else:
            all_expenses = []
            budget_rec = None

        monthly_budget = float(budget_rec.total_budget) if budget_rec and budget_rec.total_budget else 10000.0

        current_month_expenses = [e for e in all_expenses if (e.date or "").startswith(current_month_str)]
        if not current_month_expenses and all_expenses:
            current_month_expenses = all_expenses

        total_spent = sum(float(e.amount) for e in current_month_expenses)
        total_spent = round(total_spent, 2)

        prev_month_expenses = [e for e in all_expenses if (e.date or "").startswith(prev_month_str)]
        previous_month_spending = round(sum(float(e.amount) for e in prev_month_expenses), 2)

        remaining_budget = round(monthly_budget - total_spent, 2)
        days_passed = max(1, now.day)
        daily_average = round(total_spent / days_passed, 2)
        percentage_used = round((total_spent / monthly_budget) * 100, 1) if monthly_budget > 0 else 0.0

        if previous_month_spending > 0:
            spending_change_percentage = round(((total_spent - previous_month_spending) / previous_month_spending) * 100, 1)
        else:
            spending_change_percentage = 0.0

        return {
            "total_spent": total_spent,
            "monthly_budget": round(monthly_budget, 2),
            "remaining_budget": remaining_budget,
            "daily_average": daily_average,
            "percentage_used": percentage_used,
            "previous_month_spending": previous_month_spending,
            "spending_change_percentage": spending_change_percentage,
            "total_transactions": len(current_month_expenses),
            "all_time_transactions": len(all_expenses)
        }

    def get_categories(self, db: Session, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Return total spending for all 9 categories for a specific user.
        """
        if user_id is not None:
            expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
            budget_rec = db.query(Budget).filter(Budget.user_id == user_id).order_by(Budget.id.desc()).first()
        else:
            expenses = []
            budget_rec = None

        category_caps = {}
        if budget_rec and budget_rec.category_budgets:
            category_caps = budget_rec.category_budgets

        cat_spent_map: Dict[str, float] = {}
        cat_count_map: Dict[str, int] = {}
        for e in expenses:
            cat = (e.category or "Other").strip()
            cat_spent_map[cat] = cat_spent_map.get(cat, 0.0) + float(e.amount)
            cat_count_map[cat] = cat_count_map.get(cat, 0) + 1

        result = []
        for cat_info in STANDARD_CATEGORIES:
            name = cat_info["name"]
            spent = round(cat_spent_map.get(name, 0.0), 2)
            budget_limit = float(category_caps.get(name, cat_info["defaultBudget"]))
            pct = round((spent / budget_limit) * 100, 1) if budget_limit > 0 else 0.0

            result.append({
                "name": name,
                "category": name,
                "amount": spent,
                "budget": round(budget_limit, 2),
                "remaining": round(max(0.0, budget_limit - spent), 2),
                "percentage": pct,
                "color": cat_info["color"],
                "count": cat_count_map.get(name, 0)
            })

        return result

    def get_daily(self, db: Session, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Return spending grouped by date for a specific user."""
        if user_id is not None:
            expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
        else:
            expenses = []

        if not expenses:
            return []

        daily_map: Dict[str, float] = {}
        for e in expenses:
            d = (e.date or "")[:10]
            daily_map[d] = daily_map.get(d, 0.0) + float(e.amount)

        daily_list = [{"date": k, "amount": round(v, 2)} for k, v in sorted(daily_map.items())]
        return daily_list

    def get_weekly(self, db: Session, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Return spending grouped by week for a specific user."""
        if user_id is not None:
            expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
        else:
            expenses = []

        if not expenses:
            return []

        weekly_map: Dict[str, Dict[str, Any]] = {}
        for e in expenses:
            try:
                dt = datetime.strptime((e.date or "")[:10], "%Y-%m-%d")
                year_week = dt.strftime("%Y-W%U")
                week_label = f"W{dt.strftime('%U')}"
            except Exception:
                year_week = "Unknown"
                week_label = "Unknown"

            if year_week not in weekly_map:
                weekly_map[year_week] = {
                    "week": year_week,
                    "week_label": week_label,
                    "amount": 0.0,
                    "count": 0
                }
            weekly_map[year_week]["amount"] += float(e.amount)
            weekly_map[year_week]["count"] += 1

        weekly_list = sorted(weekly_map.values(), key=lambda x: x["week"])
        for item in weekly_list:
            item["amount"] = round(item["amount"], 2)

        return weekly_list

    def get_monthly(self, db: Session, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Return spending grouped by month for a specific user."""
        if user_id is not None:
            expenses = db.query(Expense).filter(Expense.user_id == user_id).all()
            budget_rec = db.query(Budget).filter(Budget.user_id == user_id).order_by(Budget.id.desc()).first()
        else:
            expenses = []
            budget_rec = None

        monthly_budget = float(budget_rec.total_budget) if budget_rec and budget_rec.total_budget else 10000.0

        if not expenses:
            return []

        monthly_map: Dict[str, Dict[str, Any]] = {}
        for e in expenses:
            try:
                m_str = (e.date or "")[:7]  # YYYY-MM
                dt = datetime.strptime(m_str, "%Y-%m")
                month_name = dt.strftime("%b %Y")
            except Exception:
                m_str = "Unknown"
                month_name = "Unknown"

            if m_str not in monthly_map:
                monthly_map[m_str] = {
                    "month": m_str,
                    "month_name": month_name,
                    "amount": 0.0,
                    "budget": round(monthly_budget, 2),
                    "count": 0
                }
            monthly_map[m_str]["amount"] += float(e.amount)
            monthly_map[m_str]["count"] += 1

        monthly_list = sorted(monthly_map.values(), key=lambda x: x["month"])
        for item in monthly_list:
            item["amount"] = round(item["amount"], 2)

        return monthly_list

analytics_service = AnalyticsService()
