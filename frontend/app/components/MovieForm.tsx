'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface MovieFormProps {
  onAddMovie?: (title: string, notes?: string) => void;
  movieTitle?: string;
  genre?: string;
  notes?: string;
  onRemove?: () => void;
  onUpdateNotes?: (notes: string) => void;
}

interface SearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Poster: string;
}

export default function MovieForm({
  onAddMovie,
  movieTitle,
  notes: initialNotes,
  onRemove,
  onUpdateNotes
}: MovieFormProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [watched, setWatched] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);

  // Initialize notes from props
  useEffect(() => {
    if (initialNotes !== undefined) {
      setNotes(initialNotes);
    }
  }, [initialNotes]);

  // Fetch movie details when in card mode
  useEffect(() => {
    if (movieTitle) {
      const fetchDetails = async () => {
        try {
          const res = await fetch(`/api/movie?title=${encodeURIComponent(movieTitle)}`);
          const data = await res.json();
          setDetails(data);
        } catch (err) {
          setDetails({ error: 'Failed to load movie details' });
        }
      };
      fetchDetails();
    }
  }, [movieTitle]);

  // Search movie titles
  const handleSearch = async () => {
    if (!title.trim()) return;

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const res = await fetch(`/api/movie?search=${encodeURIComponent(title.trim())}`);
      const data = await res.json();

      if (res.ok) {
        setSearchResults(data);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Failed to fetch movie list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (movie: SearchResult) => {
    setSelectedMovie(movie);
  };

  const handleAddMovie = () => {
    if (selectedMovie) {
      onAddMovie?.(selectedMovie.Title);
      setSelectedMovie(null);
      setTitle('');
      setSearchResults([]);
    }
  };

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(notes);
      setIsEditingNotes(false);
    }
  };

  // --- Form for adding movies ---
  if (onAddMovie) {
    return (
      <div className="p-4 rounded theme-transition"
           style={{ 
             background: 'var(--card-bg)',
             boxShadow: '0 2px 8px var(--shadow)'
           }}>
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Add a Movie
        </h2>
        <div className="flex gap-3 mb-2">
          <input
            type="text"
            placeholder="Enter movie title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded w-full theme-transition"
            style={{ 
              background: 'var(--input-bg)',
              borderColor: 'var(--input-border)',
              color: 'var(--text-primary)'
            }}
          />
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 rounded theme-transition"
            style={{ 
              background: 'var(--primary)',
              color: 'var(--button-text)'
            }}
          >
            Search
          </button>
        </div>

        {loading && <p style={{ color: 'var(--text-secondary)' }} className="mb-2">Searching...</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {searchResults.length > 0 && !selectedMovie && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((movie) => (
              <div
                key={movie.imdbID}
                onClick={() => handleSelect(movie)}
                className="cursor-pointer flex items-center gap-3 border p-2 rounded theme-transition"
                style={{ 
                  background: 'var(--input-bg)',
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px var(--shadow)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img
                  src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png'}
                  alt={movie.Title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{movie.Title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Year: {movie.Year}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMovie && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--card-border)' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Add "{selectedMovie.Title}" to your list
            </h3>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddMovie}
                className="px-4 py-2 rounded theme-transition"
                style={{ 
                  background: 'var(--primary)',
                  color: 'var(--button-text)'
                }}
              >
                Add Movie
              </button>
              <button
                onClick={() => setSelectedMovie(null)}
                className="px-4 py-2 rounded theme-transition"
                style={{ 
                  background: 'var(--secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--input-border)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Movie Card ---
  return (
    <div className="p-4 rounded mb-4 theme-transition relative"
         style={{ 
           background: 'var(--card-bg)',
           color: 'var(--text-primary)',
           border: '1px solid var(--card-border)'
         }}>
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
        aria-label="Remove movie"
      >
        ❌
      </button>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={watched}
            onChange={() => setWatched(!watched)}
            className="w-4 h-4"
          />
          <h2 className={`text-xl font-bold ${watched ? 'line-through' : ''}`}
              style={{ color: watched ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
            {movieTitle}
          </h2>
        </div>
      </div>

      {details?.genre && (
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          🎭 Genre: <span className="font-medium">{String(details.genre || 'N/A')}</span>
        </p>
      )}

      {details && !details.error && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1 rounded mb-2 theme-transition"
          style={{ 
            background: 'var(--secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--card-border)'
          }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {details && showDetails && !details.error && (
        <div className="mt-2 theme-transition p-3 rounded"
             style={{ 
               background: 'var(--input-bg)',
               border: '1px solid var(--input-border)'
             }}>
          {details.poster && (
            <img src={details.poster} alt="Movie Poster" className="w-40 mb-3 rounded shadow-md" />
          )}
          <p className="mb-1"><strong>Title:</strong> {String(details.title || 'N/A')}</p>
          <p className="mb-1"><strong>Year:</strong> {String(details.year || 'N/A')}</p>
          <p className="mb-1"><strong>Genre:</strong> {String(details.genre || 'N/A')}</p>
          <p className="mb-1"><strong>Cast:</strong> {String(details.cast || 'N/A')}</p>

          {details.ratings && Array.isArray(details.ratings) && details.ratings.length > 0 && (
            <div className="mb-2">
              <strong>Ratings:</strong>
              <ul className="list-disc ml-6">
                {details.ratings.map((r: any, idx: number) => (
                  <li key={idx}>
                    {String(r?.Source || 'Unknown')}: {String(r?.Value || 'N/A')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-2"><strong>Plot:</strong> {String(details.plot || 'N/A')}</p>

          {details.platforms && Array.isArray(details.platforms) && details.platforms.length > 0 && (
            <p className="mt-3"><strong>Available on:</strong> {details.platforms.join(', ')}</p>
          )}
        </div>
      )}

      {details && details.error && (
        <div className="mt-4 text-red-500">
          Error: {details.error}
        </div>
      )}

      {/* Notes Section */}
      <div className="mt-4 pt-3 theme-transition" style={{ borderTop: '1px solid var(--card-border)' }}>
        {!isEditingNotes && (
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold" style={{ color: 'var(--text-primary)' }}>
              Personal Notes
            </h3>
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-sm theme-transition"
              style={{ color: 'var(--primary)' }}
            >
              {notes ? 'Edit' : 'Add Notes'}
            </button>
          </div>
        )}

        {isEditingNotes ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded p-2 h-24 mb-2 theme-transition"
              style={{ 
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
              placeholder="Add your personal notes about this movie..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 rounded text-sm theme-transition"
                style={{ 
                  background: 'var(--primary)',
                  color: 'var(--button-text)'
                }}
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setNotes(initialNotes || '');
                  setIsEditingNotes(false);
                }}
                className="px-3 py-1 rounded text-sm theme-transition"
                style={{ 
                  background: 'var(--secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--input-border)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : notes ? (
          <div className="p-3 rounded theme-transition"
               style={{ 
                 background: 'var(--note-bg)',
                 border: '1px solid var(--note-border)'
               }}>
            <p className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{notes}</p>
          </div>
        ) : (
          <p className="italic" style={{ color: 'var(--text-secondary)' }}>No notes added yet.</p>
        )}
      </div>
    </div>
  );
}
