from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import requests
import json
import os

from indexer import index_movies
from vector_search import search_movies, recommend_movies
from omdb_utils import fetch_movies_by_keyword, fetch_popular_movies, get_movie_details, search_by_description
from models import Movie, User, UserCreate, Token
from auth import (
    authenticate_user, create_access_token, get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES, create_user
)
from storage import load_movies, save_movies, get_user_movies, add_movie, update_movie, delete_movie

app = FastAPI(title="Movie Notes API", 
              description="API for managing movie notes with semantic search capabilities")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OMDB_API_KEY = "42d83121"  # This matches the key in frontend/.env.local

# ----------------------------
# OMDb Movie Fetch
# ----------------------------

def fetch_movie_details(movie_name: str):
    print(f"📡 Requesting details for: {movie_name}")

    try:
        data = get_movie_details(movie_name)

        if data and "Title" in data:
            rating = 0.0
            if "imdbRating" in data and data["imdbRating"] != "N/A":
                try:
                    rating = float(data["imdbRating"])
                except (ValueError, TypeError):
                    rating = 0.0
                    
            return {
                "title": data["Title"],
                "rating": rating,
                "description": data.get("Plot", "No description available."),
                "watched": False,
                "genre": data.get("Genre", ""),
                "year": data.get("Year", ""),
                "director": data.get("Director", ""),
                "actors": data.get("Actors", ""),
                "poster": data.get("Poster", "") if data.get("Poster") != "N/A" else ""
            }
        else:
            return {"error": data.get("Error", "Unknown error from OMDb")}

    except Exception as e:
        print(f"❌ Exception during OMDb fetch: {e}")
        return {"error": str(e)}

# ----------------------------
# API Routes
# ----------------------------

# ----------------------------
# Authentication Routes
# ----------------------------

@app.post("/register", response_model=Dict[str, Any])
def register_user(user: UserCreate):
    """Register a new user"""
    result = create_user(user.email, user.username, user.password)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["error"]
        )
    return result

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

# ----------------------------
# Movie Routes
# ----------------------------

@app.post("/add_movie/")
def add_movie_endpoint(
    movie_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Add a movie for the current user"""
    try:
        movie_data = fetch_movie_details(movie_name)

        if isinstance(movie_data, dict) and "error" in movie_data:
            return movie_data  # return error directly

        if movie_data:
            # Add the movie with user_id using the new user_db module
            from user_db import add_user_movie
            result = add_user_movie(current_user.id, movie_data)
            if "error" in result:
                return result
                
            return {"message": "Movie added successfully!", "movie": result}

        return {"error": "Movie not found!"}

    except Exception as e:
        print(f"🔥 ERROR in add_movie: {e}")
        return {"error": str(e)}

@app.post("/add_movie_guest/")
def add_movie_guest(movie_name: str):
    """Add a movie without user authentication"""
    try:
        movie_data = fetch_movie_details(movie_name)

        if isinstance(movie_data, dict) and "error" in movie_data:
            return movie_data  # return error directly

        if movie_data:
            # Add the movie without user_id (using the original storage module)
            result = add_movie(movie_data)
            if "error" in result:
                return result
                
            return {"message": "Movie added successfully!", "movie": result}

        return {"error": "Movie not found!"}

    except Exception as e:
        print(f"🔥 ERROR in add_movie_guest: {e}")
        return {"error": str(e)}

@app.get("/movies/", response_model=List[Dict[str, Any]])
def get_movies_endpoint(current_user: User = Depends(get_current_active_user)):
    """Get movies for the current user"""
    from user_db import get_user_movies
    return get_user_movies(current_user.id)

@app.get("/movies_guest/", response_model=List[Dict[str, Any]])
def get_movies_guest():
    """Get movies without user authentication"""
    all_movies = load_movies()
    return [movie for movie in all_movies if not movie.get("user_id")]

@app.put("/mark_watched/")
def mark_watched_endpoint(
    movie_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Mark a movie as watched for the current user"""
    from user_db import update_user_movie
    update_data = {"watched": True}
    result = update_user_movie(current_user.id, movie_name, update_data)
    
    if "error" in result:
        return result
        
    return {"message": "Marked as watched", "movie": result}

@app.put("/mark_watched_guest/")
def mark_watched_guest(movie_name: str):
    """Mark a movie as watched without user authentication"""
    update_data = {"watched": True}
    result = update_movie(movie_name, update_data)
    
    if "error" in result:
        return result
        
    return {"message": "Marked as watched", "movie": result}

@app.delete("/delete_movie/")
def delete_movie_endpoint(
    movie_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a movie for the current user"""
    from user_db import delete_user_movie
    result = delete_user_movie(current_user.id, movie_name)
    
    if "error" in result:
        return result
        
    return {"message": f"Movie '{movie_name}' deleted successfully"}

@app.delete("/delete_movie_guest/")
def delete_movie_guest(movie_name: str):
    """Delete a movie without user authentication"""
    result = delete_movie(movie_name)
    
    if "error" in result:
        return result
        
    return {"message": f"Movie '{movie_name}' deleted successfully"}

@app.get("/toggle_details/{movie_name}")
def toggle_details(movie_name: str):
    movies = load_movies()
    for movie in movies:
        if movie["title"].lower() == movie_name.lower():
            return {
                "title": movie["title"],
                "description": movie["description"] if not movie["watched"] else "Hidden"
            }
    return {"error": "Movie not found!"}

@app.post("/reindex/")
def reindex_movies():
    movies = load_movies()
    index_movies(movies)
    return {"message": "Reindexing complete!"}

@app.get("/search/")
def search_movie(query: str):
    """Search for a movie by title or keywords"""
    results = search_movies(query)
    if results:
        return {"result": results[0]}
    return {"error": "No match found"}

@app.get("/recommend/")
def recommend(query: str = Query(..., description="Vague movie description or idea"), 
              top_k: int = Query(5, description="Number of recommendations to return")):
    """
    Get movie recommendations based on a vague description
    
    This endpoint uses external APIs to find movies that match the description.
    """
    print(f"Searching external APIs for: {query}")
    
    # Search for movies by description using OMDb API
    external_results = search_by_description(query, count=top_k)
    print(f"External search results: {[r['title'] for r in external_results] if external_results else 'None'}")
    
    if external_results:
        # Return the external results directly without saving to database
        return {
            "recommendations": external_results,
            "message": f"Found {len(external_results)} movies matching your description from external sources"
        }
    
    return {"recommendations": [], "message": "No matching movies found. Try a different description."}

@app.get("/fetch_movies/", response_model=Dict[str, Any])
def fetch_movies(keyword: str = Query(None, description="Keyword to search for movies"),
                count: int = Query(10, description="Number of movies to fetch")):
    """
    Fetch movies from OMDb API by keyword
    
    If no keyword is provided, returns popular movies
    """
    if keyword:
        movies = fetch_movies_by_keyword(keyword, count)
        message = f"Found {len(movies)} movies matching '{keyword}'"
    else:
        movies = fetch_popular_movies()
        message = f"Fetched {len(movies)} popular movies"
    
    # Return the movies directly without saving to database
    if movies:
        return {
            "movies": movies,
            "message": message
        }
    
    return {
        "movies": [],
        "message": "No movies found."
    }

# Run the server when this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
