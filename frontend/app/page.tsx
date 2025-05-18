'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MovieForm from './components/MovieForm';
import VagueSearchForm from './components/VagueSearchForm';
import { useAuth } from './context/AuthContext';

interface Movie {
  title: string;
  genre: string;
  description?: string;
  rating?: number;
  poster?: string;
  year?: string;
  director?: string;
  actors?: string;
  watched?: boolean;
  score?: number;
  user_id?: string;
}

export default function Home() {
  const [movieList, setMovieList] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, token, logout } = useAuth();
  const router = useRouter();
  
  // Fetch user's movies when authenticated
  useEffect(() => {
    if (token) {
      fetchUserMovies();
    } else {
      fetchGuestMovies();
    }
  }, [token]);
  
  const fetchUserMovies = async () => {
    try {
      const response = await fetch('http://localhost:8000/movies', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMovieList(data);
        updateGenres(data);
      }
    } catch (err) {
      console.error('Error fetching user movies:', err);
    }
  };
  
  const fetchGuestMovies = async () => {
    try {
      const response = await fetch('http://localhost:8000/movies_guest');
      
      if (response.ok) {
        const data = await response.json();
        setMovieList(data);
        updateGenres(data);
      }
    } catch (err) {
      console.error('Error fetching guest movies:', err);
    }
  };

  // ⬇️ Add movie and fetch genre
  const handleAddMovie = async (title: string) => {
    try {
      console.log(`Adding movie: ${title}`);
      
      // Use different endpoints based on authentication status
      const endpoint = token 
        ? `/api/movie/authenticated?title=${encodeURIComponent(title)}`
        : `/api/movie?title=${encodeURIComponent(title)}`;
        
      const res = await fetch(endpoint, {
        method: 'POST', // Use POST method to match our API routes
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const data = await res.json();

      if (res.ok) {
        console.log("Movie added successfully:", data);
        // Refresh the movie list after adding
        if (token) {
          await fetchUserMovies();
        } else {
          await fetchGuestMovies();
        }
      } else {
        throw new Error(data.error || 'Failed to add movie');
      }
    } catch (err) {
      console.error("Error adding movie:", err);
      alert("Failed to add movie. Please try again.");
    }
  };

  const updateGenres = (list: Movie[]) => {
    const genres = new Set<string>();
    list.forEach((m) => m.genre.split(',').forEach((g) => genres.add(g.trim())));
    setGenreOptions(Array.from(genres).sort());
  };

  const handleRemoveMovie = async (index: number) => {
    try {
      const movieToRemove = movieList[index];
      console.log(`Removing movie: ${movieToRemove.title}`);
      
      // Use different endpoints based on authentication status
      const endpoint = token 
        ? `/api/movie/authenticated?title=${encodeURIComponent(movieToRemove.title)}`
        : `/api/movie?title=${encodeURIComponent(movieToRemove.title)}`;
        
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        console.log("Movie deleted successfully");
        // Update the local state after successful deletion
        const updated = [...movieList];
        updated.splice(index, 1);
        setMovieList(updated);
        updateGenres(updated);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete movie');
      }
    } catch (err) {
      console.error("Error deleting movie:", err);
      alert("Failed to delete movie. Please try again.");
    }
  };

  const handleRecommend = () => {
    if (selectedGenre) {
      const url = `https://www.imdb.com/search/title/?genres=${encodeURIComponent(
        selectedGenre.toLowerCase()
      )}`;
      window.open(url, '_blank');
    } else {
      alert('Please select a genre to get recommendations.');
    }
  };

  // ⬇️ Filter logic
  const filteredMovies = selectedGenre
    ? movieList.filter((movie) =>
        movie.genre.toLowerCase().includes(selectedGenre.toLowerCase())
      )
    : movieList;

  // ⬇️ Handle vague search
  const handleVagueSearch = async (description: string) => {
    if (!description.trim()) return;
    
    setIsLoading(true);
    setRecommendations([]);
    
    try {
      const res = await fetch(`/api/recommend?query=${encodeURIComponent(description)}`);
      const data = await res.json();
      
      if (res.ok && data.recommendations) {
        setRecommendations(data.recommendations);
      } else {
        console.error("Error fetching recommendations:", data.error || "Unknown error");
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ⬇️ Add recommended movie to list
  const addRecommendedMovie = async (movie: Movie) => {
    try {
      // Use different endpoints based on authentication status
      const endpoint = token 
        ? `/api/movie/authenticated?title=${encodeURIComponent(movie.title)}`
        : `/api/movie?title=${encodeURIComponent(movie.title)}`;
        
      const addRes = await fetch(endpoint, {
        method: 'POST', // Use POST method to match our API routes
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const addData = await addRes.json();

      if (addRes.ok) {
        // Refresh the movie list after adding
        if (token) {
          fetchUserMovies();
        } else {
          fetchGuestMovies();
        }
      } else {
        throw new Error(addData.error || "Failed to add movie to database");
      }
    } catch (err) {
      console.error("Error adding recommended movie:", err);
      alert("Failed to add movie. Please try again.");
    }
  };
  
  // Handle login navigation
  const handleLoginClick = () => {
    router.push('/auth');
  };

  return (
    <main className="min-h-screen bg-[#f5f3ea] text-[#2e2e2e] px-6 py-10">
      <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#3b5742] tracking-tight">
          🎬 Movie Dashboard
        </h1>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden md:inline">
                Welcome, {user.username}!
              </span>
              <button
                onClick={logout}
                className="bg-[#3b5742] text-white px-3 py-1 rounded text-sm hover:bg-[#2e4635]"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="bg-[#3b5742] text-white px-4 py-2 rounded text-sm hover:bg-[#2e4635]"
            >
              Login / Register
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {!user && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  You are using the app as a guest. <a href="/auth" className="font-medium underline">Login or register</a> to save your movies to your account.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MovieForm onAddMovie={handleAddMovie} />
        </div>

        {genreOptions.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="text-[#4b3f33] font-medium text-lg">
              🎭 Filter by Genre:
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="border border-[#bfae9e] rounded-md px-4 py-2 text-[#2e4d3d] bg-[#fdfaf4] shadow-sm"
            >
              <option value="">All Genres</option>
              {genreOptions.map((genre, idx) => (
                <option key={idx} value={genre}>
                  {genre}
                </option>
              ))}
            </select>

            <button
              onClick={handleRecommend}
              className="bg-[#3b5742] text-white px-4 py-2 rounded hover:bg-[#2e4635] transition"
            >
              🔎 Get Recommendations
            </button>
          </div>
        )}

        {filteredMovies.length > 0 ? (
          <div className="space-y-4">
            {filteredMovies.map((movie, idx) => (
              <MovieForm
                key={idx}
                movieTitle={movie.title}
                genre={movie.genre}
                onRemove={() => handleRemoveMovie(idx)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center text-[#6b5b53] text-lg italic">
            {movieList.length === 0
              ? 'Start building your movie list! 🍿'
              : 'No movies match the selected genre.'}
          </div>
        )}
      </div>
    </main>
  );
}
