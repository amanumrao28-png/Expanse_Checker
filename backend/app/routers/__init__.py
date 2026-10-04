from .expenses import router as expenses_router
from .budgets import router as budgets_router
from .analytics import router as analytics_router
from .ai import router as ai_router

__all__ = ["expenses_router", "budgets_router", "analytics_router", "ai_router"]
