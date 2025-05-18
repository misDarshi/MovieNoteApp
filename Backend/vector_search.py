import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional, Tuple

# Constants
MODEL_NAME = "all-MiniLM-L6-v2"  # Small but effective model for semantic search
VECTOR_DIMENSION = 384  # Dimension of embeddings for this model
INDEX_FILE = "movie_vectors.faiss"
MOVIE_EMBEDDINGS_FILE = "movie_embeddings.json"

# Initialize the model
model = None

def get_model():
    """Lazy-load the sentence transformer model"""
    global model
    if model is None:
        print(f"Loading model: {MODEL_NAME}")
        model = SentenceTransformer(MODEL_NAME)
    return model

def create_embedding(text: str) -> np.ndarray:
    """Create embedding for a single text"""
    return get_model().encode(text, show_progress_bar=False)

def create_embeddings(texts: List[str]) -> np.ndarray:
    """Create embeddings for a list of texts"""
    return get_model().encode(texts, show_progress_bar=True)

def index_movies(movies: List[Dict[str, Any]]) -> None:
    """Create and save embeddings and FAISS index for movies"""
    if not movies:
        print("No movies to index")
        return
    
    # Extract texts to embed (title + description)
    texts = [f"{movie['title']} {movie['description']}" for movie in movies]
    
    # Create embeddings
    print(f"Creating embeddings for {len(texts)} movies...")
    embeddings = create_embeddings(texts)
    
    # Create FAISS index
    print("Creating FAISS index...")
    index = faiss.IndexFlatL2(VECTOR_DIMENSION)
    index.add(np.array(embeddings).astype('float32'))
    
    # Save index
    print(f"Saving index to {INDEX_FILE}")
    faiss.write_index(index, INDEX_FILE)
    
    # Save movie embeddings mapping
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
    """Search for movies similar to the query"""
    if not os.path.exists(INDEX_FILE) or not os.path.exists(MOVIE_EMBEDDINGS_FILE):
        print("Index files not found. Please index movies first.")
        return []
    
    # Load index
    index = faiss.read_index(INDEX_FILE)
    
    # Load movie embeddings mapping
    with open(MOVIE_EMBEDDINGS_FILE, 'r') as f:
        embeddings_map = json.load(f)
    
    # Create query embedding
    query_embedding = create_embedding(query)
    
    # Search
    distances, indices = index.search(np.array([query_embedding]).astype('float32'), top_k)
    
    # Map results
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
                    'score': float(1.0 / (1.0 + distances[0][i]))  # Convert distance to similarity score
                })
                break
    
    # Sort by score (highest first)
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

def recommend_movies(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Recommend movies based on a vague description"""
    return search_movies(query, top_k)
