import os
import json
from typing import List, Dict, Any, Optional

# Constants
MOVIES_FILE = "movies.json"

def load_movies():
    """Load all movies from the JSON file"""
    if os.path.exists(MOVIES_FILE):
        with open(MOVIES_FILE, "r") as f:
            return json.load(f)
    return []

def save_movies(movies):
    """Save all movies to the JSON file"""
    with open(MOVIES_FILE, "w") as f:
        json.dump(movies, f, indent=2)

def get_user_movies(user_id: str) -> List[Dict[str, Any]]:
    """Get movies for a specific user"""
    all_movies = load_movies()
    return [movie for movie in all_movies if movie.get("user_id") == user_id]

def add_movie(movie_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Add a movie to the database, optionally associating it with a user"""
    movies = load_movies()
    
    # Add user_id to the movie data if provided
    if user_id:
        movie_data["user_id"] = user_id
    
    # Check for duplicates (for the same user if user_id is provided)
    if user_id:
        # If user is logged in, check for duplicates only in their movies
        duplicate = any(
            movie["title"].lower() == movie_data["title"].lower() and movie.get("user_id") == user_id 
            for movie in movies
        )
    else:
        # If no user, check for duplicates in movies without user_id
        duplicate = any(
            movie["title"].lower() == movie_data["title"].lower() and not movie.get("user_id")
            for movie in movies
        )
    
    if duplicate:
        # Instead of returning an error, update the existing movie with new details
        for i, movie in enumerate(movies):
            if movie["title"].lower() == movie_data["title"].lower():
                if (user_id and movie.get("user_id") == user_id) or (not user_id and not movie.get("user_id")):
                    # Update the movie with new details
                    movies[i].update(movie_data)
                    save_movies(movies)
                    return movies[i]
    
    # Add the movie
    movies.append(movie_data)
    save_movies(movies)
    return movie_data

def update_movie(movie_title: str, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
    """Update a movie in the database"""
    movies = load_movies()
    
    for i, movie in enumerate(movies):
        # Match by title and user_id if provided
        if movie["title"].lower() == movie_title.lower():
            if user_id is None or movie.get("user_id") == user_id:
                # Update the movie
                movies[i].update(update_data)
                save_movies(movies)
                return movies[i]
    
    return {"error": "Movie not found"}

def delete_movie(movie_title: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """Delete a movie from the database"""
    movies = load_movies()
    
    for i, movie in enumerate(movies):
        # Match by title and user_id if provided
        if movie["title"].lower() == movie_title.lower():
            if user_id is None or movie.get("user_id") == user_id:
                # Remove the movie
                deleted_movie = movies.pop(i)
                save_movies(movies)
                return {"message": f"Movie '{deleted_movie['title']}' deleted successfully"}
    
    return {"error": "Movie not found"}
