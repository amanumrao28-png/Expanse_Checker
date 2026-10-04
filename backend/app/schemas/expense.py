from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Amount must be positive")
    description: str = Field(..., min_length=1, description="Description cannot be empty")
    category: str = Field(..., min_length=1, description="Category name")
    date: str = Field(..., min_length=1, description="Valid date string YYYY-MM-DD")
    payment_method: Optional[str] = Field("Card", description="Payment method used")
    notes: Optional[str] = Field(None, description="Optional notes")
    is_recurring: Optional[bool] = Field(False, description="Whether expense repeats regularly")
    recurring_frequency: Optional[str] = Field(None, description="Frequency: monthly, weekly, yearly")

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Description cannot be empty or whitespace only")
        return trimmed

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None

    @field_validator("description")
    @classmethod
    def validate_description_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Description cannot be empty")
            return trimmed
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount_optional(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v <= 0:
                raise ValueError("Amount must be greater than zero")
            return round(v, 2)
        return v

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: Optional[int] = None
    title: Optional[str] = None  # Helper property mirroring description
    is_recurring: Optional[bool] = False
    recurring_frequency: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    def model_post_init(self, __context):
        if not self.title:
            self.title = self.description
