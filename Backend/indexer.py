import os
import json
from typing import List, Dict, Any
from vector_search import index_movies as create_vector_index

def index_movies(movies: List[Dict[str, Any]]) -> None:
    """Index movies for vector search to enable semantic matching"""
    print(f"Indexing {len(movies)} movies...")
    
    # Pass to vector search module for embedding creation
    create_vector_index(movies)
    
    print("Indexing complete!")

if __name__ == "__main__":
    # When run as a script, index all movies from the local database
    if os.path.exists("movies.json"):
        with open("movies.json", "r") as f:
            movies = json.load(f)
        
        index_movies(movies)
    else:
        print("movies.json file not found. Please add some movies first.")
