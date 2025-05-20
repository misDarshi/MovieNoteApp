import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const search = searchParams.get('search');
  
  // Movie search functionality
  if (search) {
    try {
      // Search OMDB database
      const omdbApiKey = "42d83121"; // Same key used in backend
      const apiUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(search)}&type=movie`;
      
      console.log(`Searching movies with query: ${search}`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `API error: ${response.status}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      
      if (data.Response === "False") {
        return NextResponse.json(
          { error: data.Error || "No movies found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(data.Search || []);
    } catch (error) {
      console.error('Error searching movies:', error);
      return NextResponse.json(
        { error: 'Failed to search movies' },
        { status: 500 }
      );
    }
  }
  
  // Add movie by title
  if (!title) {
    return NextResponse.json(
      { error: 'Title or search parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get movie details from OMDB
    const omdbApiKey = "42d83121"; // Same key used in backend
    const omdbUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&t=${encodeURIComponent(title)}&plot=full`;
    
    console.log(`Fetching movie details from OMDB: ${omdbUrl}`);
    const omdbResponse = await fetch(omdbUrl);
    
    if (!omdbResponse.ok) {
      return NextResponse.json(
        { error: `OMDB API error: ${omdbResponse.status}` },
        { status: omdbResponse.status }
      );
    }
    
    const omdbData = await omdbResponse.json();
    
    if (omdbData.Response === "False") {
      return NextResponse.json(
        { error: omdbData.Error || "Movie not found" },
        { status: 404 }
      );
    }
    
    // Extract relevant movie info
    const movieDetails = {
      title: omdbData.Title,
      year: omdbData.Year,
      genre: omdbData.Genre,
      director: omdbData.Director,
      actors: omdbData.Actors,
      plot: omdbData.Plot,
      poster: omdbData.Poster !== "N/A" ? omdbData.Poster : null,
      ratings: omdbData.Ratings,
      imdbRating: omdbData.imdbRating,
      imdbID: omdbData.imdbID
    };
    
    // Add to backend database
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/add_movie_guest/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`Adding movie to database: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST', // Use POST method as required by the backend
    });
    
    // Return movie details even if backend has issues
    if (!response.ok) {
      console.log(`Backend API returned status ${response.status}, but continuing with movie details`);
      return NextResponse.json(movieDetails);
    }
    
    const data = await response.json();
    
    // Use OMDB data for consistent response format
    return NextResponse.json(movieDetails);
  } catch (error) {
    console.error('Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to add movie' },
      { status: 500 }
    );
  }
}

// Handle direct movie addition requests
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  
  if (!title) {
    return NextResponse.json(
      { error: 'Title parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Add movie to database
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/add_movie_guest/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`Adding movie (POST): ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(data.movie || data);
  } catch (error) {
    console.error('Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to add movie' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  
  if (!title) {
    return NextResponse.json(
      { error: 'Title parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Remove movie from database
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/delete_movie_guest/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`Deleting movie: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json(
        { error: data.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    );
  }
}
