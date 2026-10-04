from .expenses import router as expenses_router
from .analytics import router as analytics_router
from .budget import router as budget_router
from .ai import router as ai_router
from .auth import router as auth_router

__all__ = ["expenses_router", "analytics_router", "budget_router", "ai_router", "auth_router"]
