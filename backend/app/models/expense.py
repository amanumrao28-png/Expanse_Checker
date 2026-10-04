from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from datetime import datetime
from ..database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    date = Column(String(50), nullable=False, index=True)
    payment_method = Column(String(100), nullable=False, default="Card")
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=True)
    recurring_frequency = Column(String(50), nullable=True)  # "monthly", "weekly", "yearly"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
