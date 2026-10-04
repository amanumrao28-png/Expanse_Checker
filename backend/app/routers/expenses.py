from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.expense import Expense
from ..schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: Optional[str] = Query("date_desc", regex="^(date_desc|date_asc|amount_desc|amount_asc)$"),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    query = db.query(Expense)
    
    # Category Filter
    if category and category.lower() != "all":
        query = query.filter(Expense.category.ilike(category))

    # Search Query
    if search and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Expense.description.ilike(search_filter)) |
            (Expense.title.ilike(search_filter)) |
            (Expense.notes.ilike(search_filter))
        )

    # Date Range Filter
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    # Sorting
    if sort_by == "date_asc":
        query = query.order_by(Expense.date.asc(), Expense.id.asc())
    elif sort_by == "amount_desc":
        query = query.order_by(Expense.amount.desc(), Expense.id.desc())
    elif sort_by == "amount_asc":
        query = query.order_by(Expense.amount.asc(), Expense.id.asc())
    else: # default date_desc
        query = query.order_by(Expense.date.desc(), Expense.id.desc())

    return query.offset(skip).limit(limit).all()

@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(expense_in: ExpenseCreate, db: Session = Depends(get_db)):
    desc = (expense_in.description or expense_in.title or "").strip()
    if not desc:
        raise HTTPException(status_code=422, detail="Description cannot be empty")
    if expense_in.amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be positive")

    expense = Expense(
        description=desc,
        title=desc,
        amount=expense_in.amount,
        category=expense_in.category,
        date=expense_in.date,
        payment_method=expense_in.payment_method or "Card",
        notes=expense_in.notes
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_in: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    update_data = expense_in.dict(exclude_unset=True)
    if "description" in update_data and update_data["description"]:
        update_data["title"] = update_data["description"]
    elif "title" in update_data and update_data["title"]:
        update_data["description"] = update_data["title"]

    for field, val in update_data.items():
        setattr(expense, field, val)
        
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return None
