from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.budget import Budget
from ..schemas.budget import BudgetSummary, BudgetUpdate, CategoryBudgetUpdate

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=BudgetSummary)
def get_budgets(db: Session = Depends(get_db)):
    budget_records = db.query(Budget).all()
    categories = {}
    monthly_total = 1500.0

    for b in budget_records:
        if b.category:
            categories[b.category] = b.category_limit
        if b.monthly_total:
            monthly_total = b.monthly_total

    return BudgetSummary(monthly_total=monthly_total, categories=categories)

@router.put("", response_model=BudgetSummary)
def update_budgets(budget_in: BudgetUpdate, db: Session = Depends(get_db)):
    if budget_in.monthly_total is not None:
        total_record = db.query(Budget).filter(Budget.category == None).first()
        if not total_record:
            total_record = Budget(monthly_total=budget_in.monthly_total)
            db.add(total_record)
        else:
            total_record.monthly_total = budget_in.monthly_total

    if budget_in.categories:
        for cat_name, limit in budget_in.categories.items():
            cat_record = db.query(Budget).filter(Budget.category == cat_name).first()
            if not cat_record:
                cat_record = Budget(category=cat_name, category_limit=limit)
                db.add(cat_record)
            else:
                cat_record.category_limit = limit

    db.commit()
    return get_budgets(db)

@router.put("/category/{category_id}")
def update_category_budget(category_id: str, data: CategoryBudgetUpdate, db: Session = Depends(get_db)):
    cat_record = db.query(Budget).filter(Budget.category == category_id).first()
    if not cat_record:
        cat_record = Budget(category=category_id, category_limit=data.amount)
        db.add(cat_record)
    else:
        cat_record.category_limit = data.amount
    db.commit()
    return {"category": category_id, "amount": data.amount}
