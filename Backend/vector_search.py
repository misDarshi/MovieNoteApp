import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional, Tuple

# Model configuration
MODEL_NAME = "all-MiniLM-L6-v2"  # Using a lightweight model that works well for this use case
VECTOR_DIMENSION = 384
INDEX_FILE = "movie_vectors.faiss"
MOVIE_EMBEDDINGS_FILE = "movie_embeddings.json"

# Initialize the model
model = None

def get_model():
    """Load the model only when needed to save memory"""
    global model
    if model is None:
        print(f"Loading model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME)
    return model

def create_embedding(text: str) -> np.ndarray:
    """Generate vector embedding for a single text input"""
    return get_model().encode(text, show_progress_bar=False)

def create_embeddings(texts: List[str]) -> np.ndarray:
    """Generate vector embeddings for multiple texts at once"""
    return get_model().encode(texts, show_progress_bar=True)

def index_movies(movies: List[Dict[str, Any]]) -> None:
    """Index movies for vector search and save to disk"""
    if not movies:
        print("No movies to index")
        return
    
    # Combine title and description for better semantic matching
    texts = [f"{movie['title']} {movie['description']}" for movie in movies]
    
    print(f"Creating embeddings for {len(texts)} movies...")
    embeddings = create_embeddings(texts)
    
    print("Creating FAISS index...")
    index = faiss.IndexFlatL2(VECTOR_DIMENSION)
    index.add(np.array(embeddings).astype('float32'))
    
    print(f"Saving index to {INDEX_FILE}")
    faiss.write_index(index, INDEX_FILE)
    
    # Store movie details with their vector IDs for later lookup
    embeddings_map = {
        movie['title']: {
            'id': i,
            'title': movie['title'],
            'description': movie['description'],
            'rating': movie.get('rating', 0),
            'watched': movie.get('watched', False)
        }
        for i, movie in enumerate(movies)
    }
    
    with open(MOVIE_EMBEDDINGS_FILE, 'w') as f:
        json.dump(embeddings_map, f, indent=2)
    
    print(f"Indexed {len(movies)} movies successfully")

def search_movies(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Find movies that match the query semantically"""
    if not os.path.exists(INDEX_FILE) or not os.path.exists(MOVIE_EMBEDDINGS_FILE):
        print("Index files not found. Please index movies first.")
        return []
    
    index = faiss.read_index(INDEX_FILE)
    
    with open(MOVIE_EMBEDDINGS_FILE, 'r') as f:
        embeddings_map = json.load(f)
    
    query_embedding = create_embedding(query)
    
    # Find nearest neighbors in vector space
    distances, indices = index.search(np.array([query_embedding]).astype('float32'), top_k)
    
    # Convert vector IDs back to movie data
    results = []
    for i, idx in enumerate(indices[0]):
        if idx < 0 or idx >= len(embeddings_map):
            continue
            
        # Find the movie with this index
        for title, movie_data in embeddings_map.items():
            if movie_data['id'] == int(idx):
                results.append({
                    'title': title,
                    'description': movie_data['description'],
                    'rating': movie_data.get('rating', 0),
                    'watched': movie_data.get('watched', False),
                    'score': float(1.0 / (1.0 + distances[0][i]))  # Higher score = better match
                })
                break
    
    # Best matches first
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

def recommend_movies(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Find movies matching a vague description or theme"""
    return search_movies(query, top_k)
