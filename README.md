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

## Current limitations we're working on

- **Search results**: Sometimes the search can be a bit finicky - we're improving this
- **Movie details**: Currently shows basic info, but we want to add more details like director, runtime, etc.
- **Performance**: The app can be slow when adding movies - we're optimizing this
- **Mobile view**: Works on mobile but needs better responsive design
- **Error handling**: Sometimes errors aren't clearly explained to users

## What's coming next

- **Watched status**: Mark movies as watched/unwatched
- **Ratings**: Add your own ratings to movies you've watched
- **Notes**: Add personal notes about each movie
- **Better recommendations**: Smarter movie recommendations based on your taste
- **Social features**: Share your watchlist with friends
- **Dark mode**: Because everything needs a dark mode!

## Tech under the hood

This is a full-stack app with:
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: Python FastAPI
- External data: OMDb API for movie info

## Getting it running

### Backend
```bash
cd Backend
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Then visit http://localhost:3000 in your browser.

## Want to help out?

This is a work in progress, and I'd love your input! If you find bugs or have ideas for features, let me know. If you're a developer and want to contribute, even better - the code could use some love in a few places.

## Credits

Big thanks to the OMDb API for providing all the movie data. Couldn't have done it without them!
