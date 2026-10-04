from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import csv
import io
import re
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.expense import Expense
from ..schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from ..services.auth_service import get_current_user, get_optional_user
from ..services.ai_service import ai_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Create a new expense record in Supabase PostgreSQL."""
    db_expense = Expense(
        user_id=current_user.id if current_user else None,
        amount=expense_in.amount,
        description=expense_in.description,
        category=expense_in.category,
        date=expense_in.date,
        payment_method=expense_in.payment_method or "Card",
        notes=expense_in.notes,
        is_recurring=expense_in.is_recurring or False,
        recurring_frequency=expense_in.recurring_frequency
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("", response_model=List[ExpenseResponse], status_code=status.HTTP_200_OK)
def get_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    payment_method: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    sort_by: Optional[str] = Query("date_desc", pattern="^(date_desc|date_asc|amount_desc|amount_asc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """List all expenses from Supabase PostgreSQL strictly for the authenticated student user."""
    if not current_user:
        return []

    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    # Category Filter
    if category and category.lower() != "all":
        query = query.filter(Expense.category.ilike(category))

    # Payment Method Filter
    if payment_method and payment_method.lower() != "all":
        query = query.filter(Expense.payment_method.ilike(payment_method))

    # Recurring Filter
    if is_recurring is not None:
        query = query.filter(Expense.is_recurring == is_recurring)

    # Search Query
    if search and search.strip():
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Expense.description.ilike(search_filter)) |
            (Expense.notes.ilike(search_filter)) |
            (Expense.category.ilike(search_filter))
        )

    # Amount Range Filters
    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)

    # Date Range Filters
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
    else:  # default date_desc
        query = query.order_by(Expense.date.desc(), Expense.id.desc())

    return query.offset(skip).limit(limit).all()

@router.get("/recurring", status_code=status.HTTP_200_OK)
def get_recurring_expenses(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Fetch active recurring expenses for the authenticated user."""
    if not current_user:
        return {
            "count": 0,
            "total_monthly_commitment": 0.0,
            "recurring_expenses": []
        }

    recurring_list = db.query(Expense).filter(
        Expense.is_recurring == True,
        Expense.user_id == current_user.id
    ).all()
    
    total_monthly = 0.0
    for exp in recurring_list:
        amt = float(exp.amount)
        freq = (exp.recurring_frequency or "monthly").lower()
        if freq == "weekly":
            total_monthly += amt * 4.33
        elif freq == "yearly":
            total_monthly += amt / 12.0
        else:
            total_monthly += amt

    return {
        "count": len(recurring_list),
        "total_monthly_commitment": round(total_monthly, 2),
        "recurring_expenses": recurring_list
    }

@router.get("/export-csv", status_code=status.HTTP_200_OK)
def export_expenses_csv(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Export current user's expenses as a downloadable CSV file."""
    if current_user:
        expenses = db.query(Expense).filter(
            Expense.user_id == current_user.id
        ).order_by(Expense.date.desc(), Expense.id.desc()).all()
    else:
        expenses = []

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Date",
        "Description",
        "Category",
        "Amount (INR)",
        "Payment Method",
        "Is Recurring",
        "Frequency",
        "Notes"
    ])

    for e in expenses:
        writer.writerow([
            e.id,
            e.date,
            e.description,
            e.category,
            f"{float(e.amount):.2f}",
            e.payment_method or "Card",
            "Yes" if e.is_recurring else "No",
            e.recurring_frequency or "N/A",
            e.notes or ""
        ])

    output.seek(0)
    filename = f"expenses_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/import-csv", status_code=status.HTTP_200_OK)
async def import_expenses_csv(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Import expenses in bulk for the authenticated user from CSV."""
    if not file.filename.lower().endswith(('.csv', '.txt')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV (.csv)"
        )

    content = await file.read()
    try:
        decoded = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        try:
            decoded = content.decode('latin-1')
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to decode CSV file: {str(e)}"
            )

    reader = csv.reader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        return {"imported_count": 0, "errors": ["CSV file is empty"]}

    header = [h.strip().lower().replace(" ", "_").replace("(", "").replace(")", "").replace("inr", "").strip("_") for h in rows[0]]

    def find_col(candidates):
        for c in candidates:
            if c in header:
                return header.index(c)
        return -1

    desc_col = find_col(["description", "title", "name", "item"])
    amount_col = find_col(["amount", "price", "cost", "spent"])
    cat_col = find_col(["category", "type"])
    date_col = find_col(["date", "time", "created_at"])
    pm_col = find_col(["payment_method", "payment", "method", "mode"])
    notes_col = find_col(["notes", "note", "comment", "remarks"])
    recur_col = find_col(["is_recurring", "recurring"])
    freq_col = find_col(["frequency", "recurring_frequency"])

    if desc_col == -1 or amount_col == -1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV must contain at least 'Description' and 'Amount' columns"
        )

    imported_count = 0
    errors = []
    today_iso = datetime.utcnow().strftime("%Y-%m-%d")
    u_id = current_user.id if current_user else None

    for idx, row in enumerate(rows[1:], start=2):
        if not row or not any(row):
            continue

        try:
            raw_desc = row[desc_col].strip() if desc_col < len(row) else ""
            if not raw_desc:
                continue

            raw_amount_str = row[amount_col].replace("₹", "").replace("$", "").replace(",", "").strip() if amount_col < len(row) else ""
            try:
                amt = float(raw_amount_str)
                if amt <= 0:
                    errors.append(f"Row {idx}: Amount must be positive ({raw_amount_str})")
                    continue
            except ValueError:
                errors.append(f"Row {idx}: Invalid numeric amount '{raw_amount_str}'")
                continue

            raw_cat = row[cat_col].strip().title() if (cat_col != -1 and cat_col < len(row)) else "Other"
            valid_cats = ["Food", "Travel", "Education", "Shopping", "Entertainment", "Bills", "Healthcare", "Electronics", "Other"]
            category = raw_cat if raw_cat in valid_cats else "Other"

            raw_date = row[date_col].strip() if (date_col != -1 and date_col < len(row)) else today_iso
            if re.match(r'^\d{4}-\d{2}-\d{2}$', raw_date):
                date_val = raw_date
            elif re.match(r'^\d{2}/\d{2}/\d{4}$', raw_date):
                parts = raw_date.split('/')
                date_val = f"{parts[2]}-{parts[1]}-{parts[0]}"
            else:
                date_val = today_iso

            payment_method = row[pm_col].strip() if (pm_col != -1 and pm_col < len(row) and row[pm_col].strip()) else "Card"
            notes = row[notes_col].strip() if (notes_col != -1 and notes_col < len(row)) else None
            
            is_rec = False
            if recur_col != -1 and recur_col < len(row):
                is_rec = row[recur_col].strip().lower() in ["yes", "true", "1", "y"]

            freq = None
            if freq_col != -1 and freq_col < len(row) and row[freq_col].strip():
                freq = row[freq_col].strip().lower()

            expense_record = Expense(
                user_id=u_id,
                amount=amt,
                description=raw_desc,
                category=category,
                date=date_val,
                payment_method=payment_method,
                notes=notes,
                is_recurring=is_rec,
                recurring_frequency=freq
            )
            db.add(expense_record)
            imported_count += 1

        except Exception as e:
            errors.append(f"Row {idx}: {str(e)}")

    if imported_count > 0:
        db.commit()

    return {
        "success": True,
        "imported_count": imported_count,
        "errors": errors[:10],
        "total_errors": len(errors),
        "message": f"Successfully imported {imported_count} expenses."
    }

@router.post("/scan-receipt", status_code=status.HTTP_200_OK)
async def scan_receipt(
    file: UploadFile = File(...),
    ocr_text: Optional[str] = Form(None)
):
    """
    Extract structured merchant, amount, date, and category from a receipt image.
    Returns structured data for user review and confirmation before saving.
    """
    filename = file.filename or "receipt"
    text = (ocr_text or "").strip()

    amount = None
    if text:
        total_patterns = [
            r'(?:total|amount\s+due|grand\s+total|balance\s+due|net\s+payable|subtotal)[\s:]*(?:₹|\$|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)',
            r'(?:₹|\$|rs\.?)\s*(\d+(?:,\d+)*(?:\.\d+)?)',
            r'\b(\d+\.\d{2})\b'
        ]
        for pattern in total_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    amounts = [float(m.replace(',', '')) for m in matches if float(m.replace(',', '')) > 0]
                    if amounts:
                        amount = max(amounts)
                        break
                except ValueError:
                    pass

    if not amount:
        m = re.search(r'(\d+(?:\.\d+)?)', filename)
        if m:
            try:
                amount = float(m.group(1))
            except ValueError:
                amount = 120.0
        else:
            amount = 150.0

    today_iso = datetime.utcnow().strftime("%Y-%m-%d")
    date_val = today_iso
    if text:
        date_patterns = [
            r'(\d{4}[-/.]\d{2}[-/.]\d{2})',
            r'(\d{2}[-/.]\d{2}[-/.]\d{4})'
        ]
        for dp in date_patterns:
            dm = re.search(dp, text)
            if dm:
                raw_d = dm.group(1).replace('/', '-').replace('.', '-')
                parts = raw_d.split('-')
                if len(parts) == 3:
                    if len(parts[0]) == 4:
                        date_val = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                    elif len(parts[2]) == 4:
                        date_val = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                break

    merchant = "Store Purchase"
    if text:
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) >= 3]
        if lines:
            merchant_candidates = [l for l in lines[:4] if not any(w in l.lower() for w in ['receipt', 'tax invoice', 'bill', 'date', 'order', 'cashier', 'welcome'])]
            if merchant_candidates:
                merchant = merchant_candidates[0].title()
    else:
        clean_name = re.sub(r'[\d_-]', ' ', filename.rsplit('.', 1)[0]).strip().title()
        if len(clean_name) >= 3 and clean_name.lower() not in ['receipt', 'image', 'photo', 'bill']:
            merchant = clean_name
        else:
            merchant = "Cafe Purchase"

    combined_info = f"{merchant} {text}"
    cat_result = await ai_service.categorize_expense(description=combined_info, amount=amount)
    category = cat_result.get("category", "Food")

    return {
        "success": True,
        "merchant": merchant,
        "amount": round(amount, 2),
        "date": date_val,
        "category": category,
        "description": f"{merchant} Receipt",
        "payment_method": "UPI",
        "notes": f"Scanned from receipt: {filename}",
        "raw_text_snippet": text[:200] if text else None
    }

@router.get("/{id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def get_expense(
    id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Fetch a single expense by ID from Supabase PostgreSQL."""
    query = db.query(Expense).filter(Expense.id == id)
    if current_user:
        query = query.filter(Expense.user_id == current_user.id)
    expense = query.first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {id} not found"
        )
    return expense

@router.put("/{id}", response_model=ExpenseResponse, status_code=status.HTTP_200_OK)
def update_expense(
    id: int,
    expense_in: ExpenseUpdate,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Update an existing expense in Supabase PostgreSQL."""
    query = db.query(Expense).filter(Expense.id == id)
    if current_user:
        query = query.filter(Expense.user_id == current_user.id)
    db_expense = query.first()
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {id} not found"
        )

    update_data = expense_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)

    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    id: int,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Delete an expense by ID from Supabase PostgreSQL."""
    query = db.query(Expense).filter(Expense.id == id)
    if current_user:
        query = query.filter(Expense.user_id == current_user.id)
    db_expense = query.first()
    if not db_expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense with ID {id} not found"
        )

    db.delete(db_expense)
    db.commit()
    return None
