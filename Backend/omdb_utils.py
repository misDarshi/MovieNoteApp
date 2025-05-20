import requests
import json
import os
from typing import List, Dict, Any, Optional

# API credentials
OMDB_API_KEY = "42d83121"  # API key for movie data

# API endpoint
OMDB_BASE_URL = "http://www.omdbapi.com/"

def search_movies(query: str, page: int = 1) -> Dict[str, Any]:
    """Search for movies by title or keywords"""
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
    """Get full movie information by title"""
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
    """Fetch movie using its IMDb ID"""
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
    """Convert OMDb response to our app's format"""
    # Parse rating value
    rating = 0.0
    if "imdbRating" in omdb_movie and omdb_movie["imdbRating"] != "N/A":
        try:
            rating = float(omdb_movie["imdbRating"])
        except (ValueError, TypeError):
            rating = 0.0
    
    # Structure the movie data
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
    """Search and retrieve movies matching a keyword"""
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
                
            # Get complete details for each result
            if "imdbID" in result:
                movie_details = get_movie_by_id(result["imdbID"])
                if movie_details:
                    formatted_movie = format_movie_data(movie_details)
                    movies.append(formatted_movie)
        
        page += 1
        
        # Prevent too many API calls
        if page > 5 or len(movies) >= count:
            break
    
    return movies

def search_by_description(description: str, count: int = 10) -> List[Dict[str, Any]]:
    """Find movies that match a vague description or theme"""
    print(f"Searching for movies matching description: {description}")
    
    # Break description into words
    words = description.lower().split()
    
    # Skip common words that don't help with search
    common_words = {
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
        "about", "from", "by", "is", "are", "was", "were", "be", "been", "being", 
        "have", "has", "had", "do", "does", "did", "will", "would", "should", "can", 
        "could", "may", "might", "must", "that", "which", "who", "whom", "whose", 
        "what", "where", "when", "why", "how", "movie", "film", "watch", "see", "like"
    }
    
    # Find useful search terms
    keywords = []
    phrases = []
    
    # Look for meaningful two-word combinations
    if len(words) >= 2:
        for i in range(len(words) - 1):
            if words[i] not in common_words and words[i+1] not in common_words:
                phrases.append(f"{words[i]} {words[i+1]}")
    
    # Keep meaningful single words
    keywords = [word for word in words if word not in common_words and len(word) > 2]
    
    print(f"Extracted keywords: {keywords}")
    print(f"Extracted phrases: {phrases}")
    
    # Start collecting results
    all_movies = []
    
    # Look for specific movie themes
    description_lower = description.lower()
    
    # Known movie patterns to check against
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
    
    # Try to match description to known movies
    for pattern in movie_patterns:
        if any(keyword in description_lower for keyword in pattern["keywords"]):
            movie_details = get_movie_details(pattern["title"])
            if movie_details:
                formatted = format_movie_data(movie_details)
                all_movies.append(formatted)
    
    # Search using two-word phrases
    if len(all_movies) < count and phrases:
        for phrase in phrases[:3]:  # Use top 3 phrases
            if len(all_movies) >= count:
                break
                
            movies = fetch_movies_by_keyword(phrase, count=3)
            
            # Avoid duplicates
            existing_ids = {movie.get("imdb_id") for movie in all_movies}
            for movie in movies:
                if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                    all_movies.append(movie)
                    existing_ids.add(movie.get("imdb_id"))
    
    # Try keyword combinations
    if len(all_movies) < count and len(keywords) >= 2:
        search_term = " ".join(keywords[:3])
        movies = fetch_movies_by_keyword(search_term, count=3)
        
        # Keep track of what we've found
        existing_ids = {movie.get("imdb_id") for movie in all_movies}
        for movie in movies:
            if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                all_movies.append(movie)
                existing_ids.add(movie.get("imdb_id"))
    
    # Try individual keywords if needed
    if len(all_movies) < count:
        for keyword in keywords[:5]:  # Use top 5 keywords
            if len(all_movies) >= count:
                break
                
            movies = fetch_movies_by_keyword(keyword, count=2)
            
            # Skip movies we already have
            existing_ids = {movie.get("imdb_id") for movie in all_movies}
            for movie in movies:
                if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                    all_movies.append(movie)
                    existing_ids.add(movie.get("imdb_id"))
    
    # Fill remaining slots with popular movies
    if len(all_movies) < count:
        popular_movies = fetch_popular_movies()
        
        # Avoid duplicates
        existing_ids = {movie.get("imdb_id") for movie in all_movies}
        for movie in popular_movies:
            if movie.get("imdb_id") not in existing_ids and len(all_movies) < count:
                all_movies.append(movie)
                existing_ids.add(movie.get("imdb_id"))
    
    return all_movies[:count]  # Return only the requested number of movies

def fetch_popular_movies() -> List[Dict[str, Any]]:
    """Get a list of well-known movies as fallback"""
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
