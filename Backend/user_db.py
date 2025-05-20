import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from passlib.context import CryptContext

# Storage locations
USERS_FILE = "users.json"
USER_MOVIES_DIR = "user_movies"

# Security setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def load_users():
    """Read user accounts from storage"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return []

def save_users(users):
    """Write user accounts to storage"""
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def get_user(username: str):
    """Find user account by username"""
    users = load_users()
    for user in users:
        if user["username"] == username:
            return user
    return None

def get_user_by_id(user_id: str):
    """Find user account by ID"""
    users = load_users()
    for user in users:
        if user["id"] == user_id:
            return user
    return None

def verify_password(plain_password, hashed_password):
    """Check if password is correct"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Securely hash a password"""
    return pwd_context.hash(password)

def create_user(email: str, username: str, password: str):
    """Register a new user account"""
    users = load_users()
    
    # Prevent duplicate accounts
    for user in users:
        if user["username"] == username:
            return {"error": "Username already registered"}
        if user["email"] == email:
            return {"error": "Email already registered"}
    
    # Set up new account
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(password)
    
    new_user = {
        "id": user_id,
        "email": email,
        "username": username,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow().isoformat()
    }
    
    users.append(new_user)
    save_users(users)
    
    # Set up storage for user's movies
    ensure_user_movies_dir(user_id)
    
    # Return safe user data
    return {
        "id": user_id,
        "email": email,
        "username": username,
        "created_at": new_user["created_at"]
    }

def ensure_user_movies_dir(user_id: str):
    """Create user's movie storage if needed"""
    if not os.path.exists(USER_MOVIES_DIR):
        os.makedirs(USER_MOVIES_DIR)
    
    user_dir = os.path.join(USER_MOVIES_DIR, user_id)
    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
    
    user_movies_file = os.path.join(user_dir, "movies.json")
    if not os.path.exists(user_movies_file):
        with open(user_movies_file, "w") as f:
            json.dump([], f)

def get_user_movies(user_id: str) -> List[Dict[str, Any]]:
    """Load user's movie collection"""
    user_movies_file = os.path.join(USER_MOVIES_DIR, user_id, "movies.json")
    if os.path.exists(user_movies_file):
        with open(user_movies_file, "r") as f:
            return json.load(f)
    return []

def add_user_movie(user_id: str, movie_data: Dict[str, Any]) -> Dict[str, Any]:
    """Save a movie to user's collection"""
    movies = get_user_movies(user_id)
    
    # Handle duplicate movies
    duplicate = any(movie["title"].lower() == movie_data["title"].lower() for movie in movies)
    
    if duplicate:
        # Update existing entry
        for i, movie in enumerate(movies):
            if movie["title"].lower() == movie_data["title"].lower():
                movies[i].update(movie_data)
                save_user_movies(user_id, movies)
                return movies[i]
    
    # Add new movie
    movies.append(movie_data)
    save_user_movies(user_id, movies)
    return movie_data

def save_user_movies(user_id: str, movies: List[Dict[str, Any]]):
    """Write movie collection to storage"""
    ensure_user_movies_dir(user_id)
    user_movies_file = os.path.join(USER_MOVIES_DIR, user_id, "movies.json")
    with open(user_movies_file, "w") as f:
        json.dump(movies, f, indent=2)

def update_user_movie(user_id: str, movie_title: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Modify a movie in user's collection"""
    movies = get_user_movies(user_id)
    
    for i, movie in enumerate(movies):
        if movie["title"].lower() == movie_title.lower():
            movies[i].update(update_data)
            save_user_movies(user_id, movies)
            return movies[i]
    
    return {"error": "Movie not found"}

def delete_user_movie(user_id: str, movie_title: str) -> Dict[str, Any]:
    """Remove a movie from user's collection"""
    movies = get_user_movies(user_id)
    
    for i, movie in enumerate(movies):
        if movie["title"].lower() == movie_title.lower():
            deleted_movie = movies.pop(i)
            save_user_movies(user_id, movies)
            return {"message": f"Movie '{deleted_movie['title']}' deleted successfully"}
    
    return {"error": "Movie not found"}
