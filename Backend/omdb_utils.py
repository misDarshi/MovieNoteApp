import requests
import json
import os
from typing import List, Dict, Any, Optional

# OMDb API key from .env.local
OMDB_API_KEY = "42d83121"  # This matches the key in frontend/.env.local

# Base URL for OMDb API
OMDB_BASE_URL = "http://www.omdbapi.com/"

def search_movies(query: str, page: int = 1) -> Dict[str, Any]:
    """
    Search for movies using OMDb API
    
    Args:
        query: Search query
        page: Page number for results
        
    Returns:
        Dictionary with search results
    """
    params = {
        "apikey": OMDB_API_KEY,
        "s": query,
        "page": page,
        "type": "movie"
    }
    
    try:
        response = requests.get(OMDB_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("Response") == "True":
            return data
        else:
            print(f"OMDb API error: {data.get('Error', 'Unknown error')}")
            return {"Search": [], "totalResults": "0"}
    except Exception as e:
        print(f"Error searching OMDb: {e}")
        return {"Search": [], "totalResults": "0"}

def get_movie_details(title: str, year: str = None) -> Dict[str, Any]:
    """
    Get detailed information about a movie
    
    Args:
        title: Movie title
        year: Optional release year to narrow search
        
    Returns:
        Dictionary with movie details
    """
    params = {
        "apikey": OMDB_API_KEY,
        "t": title,
        "plot": "full"
    }
    
    if year:
        params["y"] = year
    
    try:
        response = requests.get(OMDB_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("Response") == "True":
            return data
        else:
            print(f"OMDb API error: {data.get('Error', 'Unknown error')}")
            return {}
    except Exception as e:
        print(f"Error getting movie details from OMDb: {e}")
        return {}

def get_movie_by_id(imdb_id: str) -> Dict[str, Any]:
    """
    Get movie details by IMDb ID
    
    Args:
        imdb_id: IMDb ID (e.g., tt0111161)
        
    Returns:
        Dictionary with movie details
    """
    params = {
        "apikey": OMDB_API_KEY,
        "i": imdb_id,
        "plot": "full"
    }
    
    try:
        response = requests.get(OMDB_BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        
        if data.get("Response") == "True":
            return data
        else:
            print(f"OMDb API error: {data.get('Error', 'Unknown error')}")
            return {}
    except Exception as e:
        print(f"Error getting movie details from OMDb: {e}")
        return {}

def format_movie_data(omdb_movie: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format OMDb movie data to match our application's format
    
    Args:
        omdb_movie: Movie data from OMDb API
        
    Returns:
        Formatted movie data
    """
    # Extract rating
    rating = 0.0
    if "imdbRating" in omdb_movie and omdb_movie["imdbRating"] != "N/A":
        try:
            rating = float(omdb_movie["imdbRating"])
        except (ValueError, TypeError):
            rating = 0.0
    
    # Format the data
    return {
        "title": omdb_movie.get("Title", "Unknown Title"),
        "rating": rating,
        "description": omdb_movie.get("Plot", "No description available."),
        "watched": False,
        "year": omdb_movie.get("Year", "Unknown"),
        "genre": omdb_movie.get("Genre", ""),
        "director": omdb_movie.get("Director", "Unknown"),
        "actors": omdb_movie.get("Actors", ""),
        "imdb_id": omdb_movie.get("imdbID", ""),
        "poster": omdb_movie.get("Poster", "") if omdb_movie.get("Poster") != "N/A" else ""
    }

def fetch_movies_by_keyword(keyword: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch movies from OMDb by keyword and format them for our application
    
    Args:
        keyword: Search keyword
        count: Maximum number of movies to fetch
        
    Returns:
        List of formatted movie data
    """
    movies = []
    page = 1
    
    while len(movies) < count:
        results = search_movies(keyword, page)
        search_results = results.get("Search", [])
        
        if not search_results:
            break
        
        for result in search_results:
            if len(movies) >= count:
                break
                
            # Get detailed information for each movie
            if "imdbID" in result:
                movie_details = get_movie_by_id(result["imdbID"])
                if movie_details:
                    formatted_movie = format_movie_data(movie_details)
                    movies.append(formatted_movie)
        
        page += 1
        
        # Safety check to avoid infinite loops
        if page > 5 or len(movies) >= count:
            break
    
    return movies

def search_by_description(description: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    Search for movies that match a vague description by extracting keywords
    and searching OMDb API with improved keyword extraction
    
    Args:
        description: Vague movie description
        count: Maximum number of movies to fetch
        
    Returns:
        List of formatted movie data
    """
    print(f"Searching for movies matching description: {description}")
    
    # Extract potential keywords from the description
    words = description.lower().split()
    
    # Filter out common words
    common_words = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
        "about", "from", "by", "is", "are", "was", "were", "be", "been", "being", 
        "have", "has", "had", "do", "does", "did", "will", "would", "should", "can", 
        "could", "may", "might", "must", "that", "which", "who", "whom", "whose", 
        "what", "where", "when", "why", "how", "movie", "film", "watch", "see", "like"
    }
    
    # Extract keywords and phrases
    keywords = []
    phrases = []
    
    # Extract multi-word phrases (potential genres or themes)
    if len(words) >= 2:
        for i in range(len(words) - 1):
            if words[i] not in common_words and words[i+1] not in common_words:
                phrases.append(f"{words[i]} {words[i+1]}")
    
    # Extract single keywords
    keywords = [word for word in words if word not in common_words and len(word) > 2]
    
    print(f"Extracted keywords: {keywords}")
    print(f"Extracted phrases: {phrases}")
    
    # Check for specific patterns in the description
    all_movies = []
    
    # Pattern matching for common movie descriptions
    description_lower = description.lower()
    
    # Check for specific movie patterns
    movie_patterns = [
        {"keywords": ["boy", "boat", "tiger"], "title": "Life of Pi"},
        {"keywords": ["dream", "inception", "dreams", "within"], "title": "Inception"},
        {"keywords": ["space", "interstellar", "wormhole"], "title": "Interstellar"},
        {"keywords": ["prison", "escape", "shawshank"], "title": "The Shawshank Redemption"},
        {"keywords": ["mafia", "godfather", "family", "crime"], "title": "The Godfather"},
        {"keywords": ["batman", "joker", "dark", "knight"], "title": "The Dark Knight"},
        {"keywords": ["matrix", "neo", "reality", "simulation"], "title": "The Matrix"},
        {"keywords": ["club", "fight", "tyler", "durden"], "title": "Fight Club"},
        {"keywords": ["time", "travel", "future", "back"], "title": "Back to the Future"},
        {"keywords": ["dinosaur", "jurassic", "park"], "title": "Jurassic Park"}
    ]
    
    # Check if description matches any specific movie pattern
    for pattern in movie_patterns:
        if any(keyword in description_lower for keyword in pattern["keywords"]):
            movie_details = get_movie_details(pattern["title"])
            if movie_details:
                formatted = format_movie_data(movie_details)
                all_movies.append(formatted)
    
    # Try searching with phrases first
    if len(all_movies) < count and phrases:
        for phrase in phrases[:3]:  # Use top 3 phrases
            if len(all_movies) >= count:
                break
                
            movies = fetch_movies_by_keyword(phrase, count=3)
            
            # Add only new movies
            existing_ids = {movie.get("imdb_id") for movie in all_movies}
            for movie in movies:
                if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                    all_movies.append(movie)
                    existing_ids.add(movie.get("imdb_id"))
    
    # Try with combinations of keywords
    if len(all_movies) < count and len(keywords) >= 2:
        search_term = " ".join(keywords[:3])
        movies = fetch_movies_by_keyword(search_term, count=3)
        
        # Add only new movies
        existing_ids = {movie.get("imdb_id") for movie in all_movies}
        for movie in movies:
            if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                all_movies.append(movie)
                existing_ids.add(movie.get("imdb_id"))
    
    # If we still don't have enough movies, try with individual keywords
    if len(all_movies) < count:
        for keyword in keywords[:5]:  # Use top 5 keywords
            if len(all_movies) >= count:
                break
                
            movies = fetch_movies_by_keyword(keyword, count=2)
            
            # Add only new movies
            existing_ids = {movie.get("imdb_id") for movie in all_movies}
            for movie in movies:
                if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                    all_movies.append(movie)
                    existing_ids.add(movie.get("imdb_id"))
    
    # If we still don't have enough movies, add some popular ones
    if len(all_movies) < count:
        popular_movies = fetch_popular_movies()
        
        # Add only new movies
        existing_ids = {movie.get("imdb_id") for movie in all_movies}
        for movie in popular_movies:
            if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                all_movies.append(movie)
                existing_ids.add(movie.get("imdb_id"))
    
    return all_movies[:count]  # Return only the requested number of movies

def fetch_popular_movies() -> List[Dict[str, Any]]:
    """
    Fetch some popular movies as a fallback
    
    Since OMDb doesn't have a "popular movies" endpoint,
    we'll use a predefined list of popular movie titles
    
    Returns:
        List of formatted movie data
    """
    popular_titles = [
        "The Shawshank Redemption",
        "The Godfather",
        "The Dark Knight",
        "Pulp Fiction",
        "Inception",
        "Fight Club",
        "Forrest Gump",
        "The Matrix",
        "Goodfellas",
        "Interstellar"
    ]
    
    movies = []
    for title in popular_titles:
        movie_details = get_movie_details(title)
        if movie_details:
            formatted_movie = format_movie_data(movie_details)
            movies.append(formatted_movie)
    
    return movies
