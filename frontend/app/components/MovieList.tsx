'use client';

import { useState } from 'react';
import MovieCard from './MovieForm';

export default function MovieList() {
  const [movies, setMovies] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addMovie = () => {
    if (input.trim()) {
      setMovies(prev => [...prev, input.trim()]);
      setInput('');
    }
  };

  const removeMovie = (title: string) => {
    setMovies(prev => prev.filter(m => m !== title));
  };

  return (
    <div>
      <div className="flex mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter movie title"
          className="border border-gray-300 rounded px-3 py-2 flex-1 mr-2"
        />
        <button onClick={addMovie} className="bg-green-600 text-white px-4 py-2 rounded">
          Add
        </button>
      </div>

      {movies.map((movie, idx) => (
        <MovieCard key={idx} movieTitle={movie} onRemove={() => removeMovie(movie)} />
      ))}
    </div>
  );
}
