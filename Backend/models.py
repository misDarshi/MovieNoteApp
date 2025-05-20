from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Movie(BaseModel):
    title: str
    rating: float
    description: str
    watched: bool = False
    genre: str = ""
    year: str = ""
    director: str = ""
    actors: str = ""
    poster: str = ""
    notes: Optional[str] = None  # User's personal notes
    user_id: Optional[str] = None  # Owner of this movie entry
