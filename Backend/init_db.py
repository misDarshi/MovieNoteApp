import json
import os
from omdb_utils import fetch_popular_movies
from indexer import index_movies

def initialize_database():
    """
    Initialize the database with some popular movies and create the initial index
    """
    print("Initializing database with popular movies...")
    
    # Fetch popular movies
    movies = fetch_popular_movies()
    
    if not movies:
        print("Failed to fetch popular movies.")
        return False
    
    # Save movies to file
    with open("movies.json", "w") as f:
        json.dump(movies, f, indent=2)
    
    print(f"Added {len(movies)} movies to the database.")
    
    # Create index
    print("Creating vector index...")
    index_movies(movies)
    
    print("Database initialization complete!")
    return True

if __name__ == "__main__":
    initialize_database()
