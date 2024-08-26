from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: str
    email: EmailStr
    password: str

class Login(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None
