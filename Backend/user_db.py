import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from passlib.context import CryptContext

# Constants
USERS_FILE = "users.json"
USER_MOVIES_DIR = "user_movies"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def load_users():
    """Load all users from the JSON file"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return []

def save_users(users):
    """Save all users to the JSON file"""
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)

def get_user(username: str):
    """Get a user by username"""
    users = load_users()
    for user in users:
        if user["username"] == username:
            return user
    return None

def get_user_by_id(user_id: str):
    """Get a user by ID"""
    users = load_users()
    for user in users:
        if user["id"] == user_id:
            return user
    return None

def verify_password(plain_password, hashed_password):
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def create_user(email: str, username: str, password: str):
    """Create a new user"""
    users = load_users()
    
    # Check if username or email already exists
    for user in users:
        if user["username"] == username:
            return {"error": "Username already registered"}
        if user["email"] == email:
            return {"error": "Email already registered"}
    
    # Create new user
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
    
    # Create user's movie directory
    ensure_user_movies_dir(user_id)
    
    # Return user without hashed_password
    return {
        "id": user_id,
        "email": email,
        "username": username,
        "created_at": new_user["created_at"]
    }

def ensure_user_movies_dir(user_id: str):
    """Ensure the user's movie directory exists"""
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
    """Get movies for a specific user"""
    user_movies_file = os.path.join(USER_MOVIES_DIR, user_id, "movies.json")
    if os.path.exists(user_movies_file):
        with open(user_movies_file, "r") as f:
            return json.load(f)
    return []

def add_user_movie(user_id: str, movie_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a movie to a user's collection"""
    movies = get_user_movies(user_id)
    
    # Check for duplicates
    duplicate = any(movie["title"].lower() == movie_data["title"].lower() for movie in movies)
    
    if duplicate:
        # Update existing movie
        for i, movie in enumerate(movies):
            if movie["title"].lower() == movie_data["title"].lower():
                movies[i].update(movie_data)
                save_user_movies(user_id, movies)
                return movies[i]
    
    # Add the movie
    movies.append(movie_data)
    save_user_movies(user_id, movies)
    return movie_data

def save_user_movies(user_id: str, movies: List[Dict[str, Any]]):
    """Save a user's movies"""
    ensure_user_movies_dir(user_id)
    user_movies_file = os.path.join(USER_MOVIES_DIR, user_id, "movies.json")
    with open(user_movies_file, "w") as f:
        json.dump(movies, f, indent=2)

def update_user_movie(user_id: str, movie_title: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update a movie in a user's collection"""
    movies = get_user_movies(user_id)
    
    for i, movie in enumerate(movies):
        if movie["title"].lower() == movie_title.lower():
            movies[i].update(update_data)
            save_user_movies(user_id, movies)
            return movies[i]
    
    return {"error": "Movie not found"}

def delete_user_movie(user_id: str, movie_title: str) -> Dict[str, Any]:
    """Delete a movie from a user's collection"""
    movies = get_user_movies(user_id)
    
    for i, movie in enumerate(movies):
        if movie["title"].lower() == movie_title.lower():
            deleted_movie = movies.pop(i)
            save_user_movies(user_id, movies)
            return {"message": f"Movie '{deleted_movie['title']}' deleted successfully"}
    
    return {"error": "Movie not found"}
