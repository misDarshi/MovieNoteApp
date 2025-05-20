import os
import json
from typing import List, Dict, Any, Optional

# File storage location
MOVIES_FILE = "movies.json"

def load_movies():
    """Read movie data from storage"""
    if os.path.exists(MOVIES_FILE):
        with open(MOVIES_FILE, "r") as f:
            return json.load(f)
    return []

def save_movies(movies):
    """Write movie data to storage"""
    with open(MOVIES_FILE, "w") as f:
        json.dump(movies, f, indent=2)

def get_user_movies(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve movies belonging to a user"""
    all_movies = load_movies()
    return [movie for movie in all_movies if movie.get("user_id") == user_id]

def add_movie(movie_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Save a new movie entry"""
    movies = load_movies()
    
    # Link movie to user if logged in
    if user_id:
        movie_data["user_id"] = user_id
    
    # Handle duplicate entries
    if user_id:
        # Check user's collection for duplicates
        duplicate = any(
            movie["title"].lower() == movie_data["title"].lower() and movie.get("user_id") == user_id 
            for movie in movies
        )
    else:
        # Check guest collection for duplicates
        duplicate = any(
            movie["title"].lower() == movie_data["title"].lower() and not movie.get("user_id")
            for movie in movies
        )
    
    if duplicate:
        # Update existing entry instead of creating duplicate
        for i, movie in enumerate(movies):
            if movie["title"].lower() == movie_data["title"].lower():
                if (user_id and movie.get("user_id") == user_id) or (not user_id and not movie.get("user_id")):
                    # Refresh movie data
                    movies[i].update(movie_data)
                    save_movies(movies)
                    return movies[i]
    
    # Store new movie
    movies.append(movie_data)
    save_movies(movies)
    return movie_data

def update_movie(movie_title: str, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Modify existing movie data"""
    movies = load_movies()
    
    for i, movie in enumerate(movies):
        # Find the right movie to update
        if movie["title"].lower() == movie_title.lower():
            if user_id is None or movie.get("user_id") == user_id:
                # Apply changes
                movies[i].update(update_data)
                save_movies(movies)
                return movies[i]
    
    return {"error": "Movie not found"}

def delete_movie(movie_title: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Remove a movie entry"""
    movies = load_movies()
    
    for i, movie in enumerate(movies):
        # Find the movie to remove
        if movie["title"].lower() == movie_title.lower():
            if user_id is None or movie.get("user_id") == user_id:
                # Delete entry
                deleted_movie = movies.pop(i)
                save_movies(movies)
                return {"message": f"Movie '{deleted_movie['title']}' deleted successfully"}
    
    return {"error": "Movie not found"}
