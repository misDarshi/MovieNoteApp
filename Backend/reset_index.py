import os
import json
import numpy as np
import faiss

# Constants
VECTOR_DIMENSION = 384  # Dimension of embeddings for the model
INDEX_FILE = "movie_vectors.faiss"
MOVIE_EMBEDDINGS_FILE = "movie_embeddings.json"

def create_empty_index():
    """Create and save an empty FAISS index"""
    print("Creating empty FAISS index...")
    
    # Create empty FAISS index
    index = faiss.IndexFlatL2(VECTOR_DIMENSION)
    
    # Save index
    print(f"Saving empty index to {INDEX_FILE}")
    faiss.write_index(index, INDEX_FILE)
    
    # Save empty movie embeddings mapping
    with open(MOVIE_EMBEDDINGS_FILE, 'w') as f:
        json.dump({}, f, indent=2)
    
    print("Reset complete! All movie recommendations have been removed.")

if __name__ == "__main__":
    create_empty_index()
