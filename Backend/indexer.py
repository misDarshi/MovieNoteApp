import os
import json
from typing import List, Dict, Any
from vector_search import index_movies as create_vector_index

def index_movies(movies: List[Dict[str, Any]]) -> None:
    """
    Index movies for vector search
    
    This function takes a list of movies and creates vector embeddings
    for semantic search functionality.
    """
    print(f"Indexing {len(movies)} movies...")
    
    # Create vector embeddings for semantic search
    create_vector_index(movies)
    
    print("Indexing complete!")

if __name__ == "__main__":
    # If run directly, index all movies in the movies.json file
    if os.path.exists("movies.json"):
        with open("movies.json", "r") as f:
            movies = json.load(f)
        
        index_movies(movies)
    else:
        print("movies.json file not found. Please add some movies first.")
