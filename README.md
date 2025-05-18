# Movie Dashboard

Hey there! Welcome to our Movie Dashboard project - a place where movie buffs can keep track of what they want to watch next.

## What's this all about?

I built this app because I kept forgetting which movies I wanted to watch. Sound familiar? This simple dashboard lets you add movies to your watchlist, organize them by genre, and keep track of what you've watched.

## What works right now

- **Adding movies**: Search for any movie title and add it to your list
- **Deleting movies**: Changed your mind? Just hit the X button (and yes, they stay deleted now!)
- **Genre filtering**: Filter your movies by genre when your list gets too long
- **User accounts**: Create an account to save your movies across devices
- **Guest mode**: Just want to try it out? Use the app without signing up
- **Notes**: Add personal notes about each movie (notes persist even after page refresh)
- **Dark/Light mode**: Toggle between dark and light themes for comfortable viewing
- **Vague search**: Describe a movie you're thinking of, and get recommendations
- **Movie recommendations**: Get movie suggestions based on your descriptions

## Current limitations we're working on

- **Search results**: Sometimes the search can be a bit finicky - we're improving this
- **Movie details**: Currently shows basic info, but we want to add more details like director, runtime, etc.
- **Performance**: The app can be slow when adding movies - we're optimizing this
- **Mobile view**: Works on mobile but needs better responsive design
- **Error handling**: Sometimes errors aren't clearly explained to users

## What's coming next

- **Watched status**: Mark movies as watched/unwatched
- **Ratings**: Add your own ratings to movies you've watched
- **Social features**: Share your watchlist with friends
- **Better UI**: Enhance the user interface with more artistic and creative elements
- **Offline mode**: Access your movie list even without internet connection

## Tech under the hood

This is a full-stack app with:
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: Python FastAPI
- External data: OMDb API for movie info
- Authentication: JWT-based authentication
- Storage: File-based storage for user data and movies

## Getting it running

### Prerequisites
- Python 3.8+ with pip
- Node.js 14+ with npm
- bcrypt package for Python (`pip install bcrypt`)

### Backend
```bash
cd Backend
pip install -r requirements.txt  # If available, otherwise install dependencies manually
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then visit http://localhost:3000 in your browser.

## User Guide

1. **Registration/Login**: Create an account or use guest mode
2. **Adding Movies**: Search for movies by title in the "Add a Movie" section
3. **Finding Similar Movies**: Describe a movie in the "Find Similar Movies" section
4. **Adding Notes**: Click on a movie in your list to add personal notes
5. **Theme Toggle**: Use the sun/moon icon in the top right to switch between light and dark modes
6. **Filtering**: Use the genre dropdown to filter your movie list

## Want to help out?

This is a work in progress, and I'd love your input! If you find bugs or have ideas for features, let me know. If you're a developer and want to contribute, even better - the code could use some love in a few places.

## Credits

Big thanks to the OMDb API for providing all the movie data. Couldn't have done it without them!
