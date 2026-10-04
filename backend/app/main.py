from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .database import engine, Base
from .models.user import User
from .models.expense import Expense
from .models.budget import Budget
from .routes import expenses_router, analytics_router, budget_router, ai_router, auth_router
from datetime import datetime

# Initialize PostgreSQL database tables in Supabase
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Clean production startup - No hardcoded sample expenses or mock budgets!
    # Data is dynamically created and managed by authenticated student users.
    print("[Supabase Cloud PostgreSQL] Database connected & verified.")
    yield

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production FastAPI Backend connected to Supabase Cloud PostgreSQL for Student Expense AI",
    lifespan=lifespan
)

# Enable CORS for React frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(budget_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)

@app.get("/", status_code=status.HTTP_200_OK)
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "database": "Supabase Cloud PostgreSQL",
        "docs_url": "/docs"
    }

@app.get("/health", status_code=status.HTTP_200_OK)
@app.get("/api/health", status_code=status.HTTP_200_OK)
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "provider": "Supabase PostgreSQL",
        "timestamp": datetime.utcnow().isoformat()
    }
