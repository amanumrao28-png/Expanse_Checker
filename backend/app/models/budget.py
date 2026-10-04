from sqlalchemy import Column, Integer, Float, DateTime, JSON, ForeignKey
from datetime import datetime
from ..database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    month = Column(Integer, default=lambda: datetime.utcnow().month, index=True)
    year = Column(Integer, default=lambda: datetime.utcnow().year, index=True)
    total_budget = Column(Float, nullable=False, default=10000.0)
    category_budgets = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
