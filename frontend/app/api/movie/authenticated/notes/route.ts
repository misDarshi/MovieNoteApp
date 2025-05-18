import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title');
  const notes = searchParams.get('notes');
  const authHeader = req.headers.get('Authorization');
  
  if (!title) {
    return NextResponse.json(
      { error: 'Title parameter is required' },
      { status: 400 }
    );
  }

  if (notes === null) {
    return NextResponse.json(
      { error: 'Notes parameter is required' },
      { status: 400 }
    );
  }

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authorization header is required' },
      { status: 401 }
    );
  }

  try {
    // Call the backend API to update movie notes
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const apiUrl = `${backendUrl}/update_movie_notes/?movie_name=${encodeURIComponent(title)}&notes=${encodeURIComponent(notes)}`;
    
    console.log(`📡 Calling backend API to update notes: ${apiUrl}`);
    const response = await fetch(apiUrl, {
      method: 'PUT',
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
      { error: 'Failed to update movie notes' },
      { status: 500 }
    );
  }
}
