'use client';

import { useState, useEffect } from 'react';

interface MovieFormProps {
  onAddMovie?: (title: string) => void;
  movieTitle?: string;
  genre?: string;
  onRemove?: () => void;
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
  onRemove
}: MovieFormProps) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [watched, setWatched] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    onAddMovie?.(movie.Title);
    setTitle('');
    setSearchResults([]);
  };

  // --- Form for adding movies ---
  if (onAddMovie) {
    return (
      <div className="bg-white p-4 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Add a Movie</h2>
        <div className="flex gap-3 mb-2">
          <input
            type="text"
            placeholder="Enter movie title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Search
          </button>
        </div>

        {loading && <p className="text-gray-500 mb-2">Searching...</p>}
        {error && <p className="text-red-500 mb-2">{error}</p>}

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((movie) => (
              <div
                key={movie.imdbID}
                onClick={() => handleSelect(movie)}
                className="cursor-pointer flex items-center gap-3 border p-2 rounded hover:bg-gray-100"
              >
                <img
                  src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png'}
                  alt={movie.Title}
                  className="w-10 h-14 object-cover rounded"
                />
                <div>
                  <p className="font-semibold text-gray-800">{movie.Title}</p>
                  <p className="text-sm text-gray-500">Year: {movie.Year}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Movie Card ---
  return (
    <div className="p-4 border rounded mb-4 shadow-md bg-white relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
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
          <h2 className={`text-xl font-bold ${watched ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {movieTitle}
          </h2>
        </div>
      </div>

      {details?.genre && (
        <p className="text-sm text-gray-500 mb-2">
          🎭 Genre: <span className="font-medium">{String(details.genre || 'N/A')}</span>
        </p>
      )}

      {details && !details.error && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded mb-2"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {details && showDetails && !details.error && (
        <div className="mt-2">
          {details.poster && (
            <img src={details.poster} alt="Movie Poster" className="w-40 mb-3 rounded" />
          )}
          <p><strong>Title:</strong> {String(details.title || 'N/A')}</p>
          <p><strong>Year:</strong> {String(details.year || 'N/A')}</p>
          <p><strong>Genre:</strong> {String(details.genre || 'N/A')}</p>
          <p><strong>Cast:</strong> {String(details.cast || 'N/A')}</p>

          {details.ratings && Array.isArray(details.ratings) && details.ratings.length > 0 && (
            <div>
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
    </div>
  );
}
