'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MovieForm from './components/MovieForm';
import VagueSearchForm from './components/VagueSearchForm';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

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
  notes?: string;
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
  
  // Load notes from localStorage when movies are loaded
  useEffect(() => {
    if (movieList.length > 0) {
      loadNotesFromLocalStorage();
    }
  }, [movieList.length]);
  
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

  const { theme, toggleTheme } = useTheme();
  
  // Save notes to localStorage
  const saveNotesToLocalStorage = (movieTitle: string, notes: string) => {
    try {
      // Get existing notes from localStorage
      const storedNotesStr = localStorage.getItem('movieNotes');
      const storedNotes = storedNotesStr ? JSON.parse(storedNotesStr) : {};
      
      // Update notes for this movie
      storedNotes[movieTitle] = notes;
      
      // Save back to localStorage
      localStorage.setItem('movieNotes', JSON.stringify(storedNotes));
      console.log(`Notes for "${movieTitle}" saved to localStorage`);
    } catch (err) {
      console.error("Error saving notes to localStorage:", err);
    }
  };
  
  // Load notes from localStorage
  const loadNotesFromLocalStorage = () => {
    try {
      const storedNotesStr = localStorage.getItem('movieNotes');
      if (!storedNotesStr) return;
      
      const storedNotes = JSON.parse(storedNotesStr);
      
      // Update movie list with notes from localStorage
      const updatedList = movieList.map(movie => {
        const savedNotes = storedNotes[movie.title];
        return savedNotes !== undefined ? { ...movie, notes: savedNotes } : movie;
      });
      
      setMovieList(updatedList);
      console.log("Notes loaded from localStorage");
    } catch (err) {
      console.error("Error loading notes from localStorage:", err);
    }
  };

  // ⬇️ Add movie
  const handleAddMovie = async (title: string) => {
    try {
      console.log(`Adding movie: ${title}`);
      
      // Use different endpoints based on authentication status
      const endpoint = token 
        ? `/api/movie/authenticated?title=${encodeURIComponent(title)}`
        : `/api/movie?title=${encodeURIComponent(title)}`;
        
      const res = await fetch(endpoint, {
        method: 'POST',
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

  // ⬇️ Update movie notes
  const handleUpdateNotes = async (movieTitle: string, notes: string) => {
    try {
      console.log(`Updating notes for movie: ${movieTitle}`);
      
      // Save notes to localStorage as a backup
      saveNotesToLocalStorage(movieTitle, notes);
      
      // Use different endpoints based on authentication status
      const endpoint = token 
        ? `/api/movie/authenticated/notes?title=${encodeURIComponent(movieTitle)}&notes=${encodeURIComponent(notes)}`
        : `/api/movie/notes?title=${encodeURIComponent(movieTitle)}&notes=${encodeURIComponent(notes)}`;
        
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (res.ok) {
        console.log("Notes updated successfully");
        // Update the movie in the local state
        const updatedList = movieList.map(movie => 
          movie.title === movieTitle ? { ...movie, notes } : movie
        );
        setMovieList(updatedList);
      } else {
        const data = await res.json();
        console.error("API error but notes saved to localStorage:", data.error || 'Failed to update notes');
        
        // Even if the API call fails, we've already saved to localStorage
        // Update the movie in the local state
        const updatedList = movieList.map(movie => 
          movie.title === movieTitle ? { ...movie, notes } : movie
        );
        setMovieList(updatedList);
      }
    } catch (err) {
      console.error("Error updating notes:", err);
      // Even if there's an error, we've already saved to localStorage
      // Update the movie in the local state
      const updatedList = movieList.map(movie => 
        movie.title === movieTitle ? { ...movie, notes } : movie
      );
      setMovieList(updatedList);
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
        
        // Also remove from localStorage if present
        try {
          const storedNotesStr = localStorage.getItem('movieNotes');
          if (storedNotesStr) {
            const storedNotes = JSON.parse(storedNotesStr);
            if (storedNotes[movieToRemove.title]) {
              delete storedNotes[movieToRemove.title];
              localStorage.setItem('movieNotes', JSON.stringify(storedNotes));
            }
          }
        } catch (err) {
          console.error("Error removing notes from localStorage:", err);
        }
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
          await fetchUserMovies();
        } else {
          await fetchGuestMovies();
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
    <main className="min-h-screen theme-transition px-6 py-10" 
          style={{ 
            background: 'var(--secondary)',
            color: 'var(--text-primary)'
          }}>
      <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" 
            style={{ color: 'var(--primary)' }}>
          🎬 Movie Dashboard
        </h1>
        
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full theme-transition"
            style={{ 
              background: theme === 'dark' ? 'var(--accent)' : 'var(--primary)',
              color: 'var(--button-text)'
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden md:inline">
                Welcome, {user.username}!
              </span>
              <button
                onClick={logout}
                className="theme-transition px-3 py-1 rounded text-sm"
                style={{ 
                  background: 'var(--primary)',
                  color: 'var(--button-text)',
                  boxShadow: '0 2px 4px var(--shadow)'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="theme-transition px-4 py-2 rounded text-sm"
              style={{ 
                background: 'var(--primary)',
                color: 'var(--button-text)',
                boxShadow: '0 2px 4px var(--shadow)'
              }}
            >
              Login / Register
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 fade-in">
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
          <div className="theme-transition rounded-lg overflow-hidden"
               style={{ 
                 boxShadow: '0 4px 12px var(--shadow)',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease, box-shadow 0.3s ease'
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.transform = 'translateY(-5px)';
                 e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow)';
               }}>
            <MovieForm onAddMovie={handleAddMovie} />
          </div>
          
          <div className="theme-transition rounded-lg overflow-hidden"
               style={{ 
                 boxShadow: '0 4px 12px var(--shadow)',
                 transform: 'translateY(0)',
                 transition: 'transform 0.3s ease, box-shadow 0.3s ease'
               }}
               onMouseOver={(e) => {
                 e.currentTarget.style.transform = 'translateY(-5px)';
                 e.currentTarget.style.boxShadow = '0 8px 24px var(--shadow)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 4px 12px var(--shadow)';
               }}>
            <VagueSearchForm onSearch={handleVagueSearch} isLoading={isLoading} />
          </div>
        </div>

        {genreOptions.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg theme-transition"
               style={{ 
                 background: 'var(--card-bg)',
                 boxShadow: '0 4px 12px var(--shadow)',
                 border: '1px solid var(--card-border)'
               }}>
            <label className="font-medium text-lg" style={{ color: 'var(--text-secondary)' }}>
              🎭 Filter by Genre:
            </label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="border rounded-md px-4 py-2 theme-transition"
              style={{ 
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)',
                background: 'var(--input-bg)'
              }}
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
              className="px-4 py-2 rounded theme-transition"
              style={{ 
                background: 'var(--primary)',
                color: 'var(--button-text)'
              }}
            >
              🔎 Get Recommendations
            </button>
          </div>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="mt-6 p-4 rounded-lg theme-transition"
               style={{ 
                 background: 'var(--card-bg)',
                 boxShadow: '0 4px 12px var(--shadow)',
                 border: '1px solid var(--card-border)'
               }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
              🎯 Recommendations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {recommendations.map((movie, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg theme-transition"
                  style={{ 
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    boxShadow: '0 2px 4px var(--shadow)'
                  }}
                >
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{movie.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{movie.genre}</p>
                  <button 
                    onClick={() => addRecommendedMovie(movie)}
                    className="mt-2 px-2 py-1 rounded text-xs theme-transition w-full"
                    style={{ 
                      background: 'var(--primary)',
                      color: 'var(--button-text)'
                    }}
                  >
                    + Add to List
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredMovies.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              📋 Your Movie List
            </h2>
            <div className="space-y-4">
              {filteredMovies.map((movie, idx) => (
                <div 
                  key={idx}
                  className="theme-transition rounded-lg overflow-hidden"
                  style={{ 
                    boxShadow: '0 4px 12px var(--shadow)',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)'
                  }}
                >
                  <MovieForm
                    movieTitle={movie.title}
                    genre={movie.genre}
                    notes={movie.notes}
                    onRemove={() => handleRemoveMovie(idx)}
                    onUpdateNotes={(notes) => handleUpdateNotes(movie.title, notes)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div 
            className="mt-10 text-center text-lg italic p-8 rounded-lg theme-transition"
            style={{ 
              background: 'var(--card-bg)',
              color: 'var(--text-secondary)',
              boxShadow: '0 4px 12px var(--shadow)',
              border: '1px solid var(--card-border)'
            }}
          >
            {movieList.length === 0
              ? 'Start building your movie list! 🍿'
              : 'No movies match the selected genre.'}
          </div>
        )}
      </div>
    </main>
  );
}
