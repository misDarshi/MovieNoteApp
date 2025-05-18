import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const search = searchParams.get('search');
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authorization header is required' },
      { status: 401 }
    );
  }
  
  // Handle search parameter for movie search functionality
  if (search) {
    try {
      // Call OMDB API to search for movies
      const omdbApiKey = "42d83121"; // Same key used in backend
      const apiUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${encodeURIComponent(search)}&type=movie`;
      
      console.log(`📡 Searching movies with query: ${search}`);
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
      console.error('❌ Error searching movies:', error);
      return NextResponse.json(
        { error: 'Failed to search movies' },
        { status: 500 }
      );
    }
  }
  
  // Handle title parameter for adding a movie
  if (!title) {
    return NextResponse.json(
      { error: 'Title or search parameter is required' },
      { status: 400 }
    );
  }

  try {
    // First, get movie details from OMDB API
    const omdbApiKey = "42d83121"; // Same key used in backend
    const omdbUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&t=${encodeURIComponent(title)}&plot=full`;
    
    console.log(`📡 Fetching movie details from OMDB: ${omdbUrl}`);
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
    
    // Format the OMDB data
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
    
    // Call the backend API to add the movie with authentication
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/add_movie/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`📡 Calling authenticated backend API to add movie: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST', // Use POST method as required by the backend
      headers: {
        'Authorization': authHeader
      }
    });
    
    // Even if the backend returns an error (e.g., movie already exists),
    // we still want to return the movie details to the frontend
    if (!response.ok) {
      console.log(`Backend API returned status ${response.status}, but continuing with movie details`);
      return NextResponse.json(movieDetails);
    }
    
    const data = await response.json();
    
    // Return the movie details from OMDB, not the backend response
    return NextResponse.json(movieDetails);
  } catch (error) {
    console.error('❌ Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to add movie' },
      { status: 500 }
    );
  }
}

// Add POST method to handle direct POST requests
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authorization header is required' },
      { status: 401 }
    );
  }
  
  if (!title) {
    return NextResponse.json(
      { error: 'Title parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Call the backend API to add the movie with authentication
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/add_movie/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`📡 Calling authenticated backend API to add movie (POST): ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend API error: ${response.status} - ${errorText}`);
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
    console.error('❌ Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to add movie' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authorization header is required' },
      { status: 401 }
    );
  }
  
  if (!title) {
    return NextResponse.json(
      { error: 'Title parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Call the backend API to delete the movie with authentication
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/delete_movie/?movie_name=${encodeURIComponent(title)}`;
    
    console.log(`📡 Calling authenticated backend API to delete movie: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend API error: ${response.status} - ${errorText}`);
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
    console.error('❌ Error calling backend API:', error);
    return NextResponse.json(
      { error: 'Failed to delete movie' },
      { status: 500 }
    );
  }
}
