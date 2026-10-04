from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.auth import UserRegister, UserLogin, UserResetPassword, TokenResponse, UserResponse
from ..services.auth_service import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new student account in Supabase PostgreSQL."""
    clean_email = user_data.email.strip().lower()
    clean_password = user_data.password.strip()
    
    # Check if user already exists
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in or reset your password."
        )

    # Hash password and create user
    hashed = hash_password(clean_password)
    user = User(
        email=clean_email,
        hashed_password=hashed,
        full_name=user_data.full_name.strip() if user_data.full_name else clean_email.split("@")[0].title()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue access token
    access_token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate student user and return JWT session token."""
    clean_email = credentials.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    pw = credentials.password
    valid = False
    if user:
        valid = verify_password(pw, user.hashed_password) or verify_password(pw.strip(), user.hashed_password)

    if not user or not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials or click 'Reset Password'."
        )

    access_token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/reset-password", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def reset_password(data: UserResetPassword, db: Session = Depends(get_db)):
    """Reset password for a registered student account and log in."""
    clean_email = data.email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address. Please register first."
        )

    clean_password = data.new_password.strip()
    user.hashed_password = hash_password(clean_password)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get active student user profile."""
    return current_user
