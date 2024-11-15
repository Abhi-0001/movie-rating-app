import StarRating from "./StarRating";
import { useEffect, useRef, useState } from "react";
import { useMovie } from "./useMovie";
import { useKeyDown } from "./useKeyDown";

const average = (arr) =>
  arr?.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "dda352a1";

export default function App() {
  const [query, setQuery] = useState("");
  const [watched, setWatched] = useState(
    JSON.parse(localStorage.getItem("watched")) || []
  );

  const [selectedId, setSelectedId] = useState(null);

  const { movies, isLoading, error } = useMovie(query);

  function handleMovieSelect(movieId) {
    setSelectedId((id) => (id === movieId ? null : movieId));
  }
  function handleMovieClose() {
    setSelectedId(null);
  }
  function handleAddWatched(watchedMovie) {
    setWatched((watched) => [...watched, watchedMovie]);
  }
  function handleDeleteMovie(movieId) {
    const newWatchedArr = watched.filter(
      (watchedMovie) => watchedMovie.imdbId !== movieId
    );
    setWatched(newWatchedArr);
  }

  // setting up local storage
  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watched));
    },
    [watched]
  );

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList handleMovieSelect={handleMovieSelect} movies={movies} />
          )}
          {error && <Error message={error} />}
          {error === undefined && <Error />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              handleMovieClose={handleMovieClose}
              onAddMovie={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedMoviesSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDelete={handleDeleteMovie}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function Error({ message = "Something went wrong" }) {
  return (
    <p className="error">
      <span>⛔</span> {message}
    </p>
  );
}

function NavBar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}
function Search({ query, setQuery }) {
  const inputEl = useRef(null);
  function focusSearch() {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.value = "";
    inputEl.current.focus();
  }
  useKeyDown("Enter", focusSearch);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}
function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}
function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong> {movies.length} </strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieDetails({ selectedId, handleMovieClose, onAddMovie, watched }) {
  const [movie, setMovie] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);
  const isWatched = watched
    ?.map((watchedMovie) => watchedMovie.imdbId)
    .includes(selectedId);
  const currentWatched = watched?.filter((watchedMovie) => watchedMovie.imdbId === selectedId)
    .at(0);

  function handleAdd() {
    const watchedMovie = {
      imdbId: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
      runtime: Number(movie.Runtime.split(" ").at(0)),
      imdbRating: movie.imdbRating,
      userRating,
    };
    onAddMovie(watchedMovie);
    handleMovieClose();
  }

  useKeyDown("Escape", handleMovieClose);

  useEffect(
    function () {
      async function fetchMovie() {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?i=${selectedId}&apikey=${KEY}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      fetchMovie();
    },
    [selectedId]
  );
  useEffect(
    function () {
      if (!movie.Title) return;
      document.title = `Movie | ${movie.Title}`;

      return function () {
        document.title = "usePopCorn";
      };
    },
    [movie.Title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button onClick={handleMovieClose} className="btn-back">
              &larr;
            </button>
            <img src={movie.Poster} alt={`movie ${movie.Title}`} />
            <div className="details-overview">
              <h2>{movie.Title}</h2>
              <p>
                {movie.Released} &bull; {movie.Runtime}{" "}
              </p>
              <p>{movie.Genre}</p>
              <p>
                {" "}
                <span>⭐</span> {movie.imdbRating} imdb Rating
              </p>
            </div>
          </header>

          <section>
            <div className="rating">
              {isWatched ? (
                <p>
                  This Movie is already rated: {currentWatched.userRating}
                  <span>⭐</span>
                </p>
              ) : (
                <>
                  <StarRating
                    size={24}
                    maxRating={10}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button onClick={handleAdd} className="btn-add">
                      <span>+</span> Add to list
                    </button>
                  )}
                </>
              )}
            </div>
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>
              <b>Starring</b>: {movie.Actors}
            </p>
            <p>
              <b>Directed</b> by: {movie.Director}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedMoviesSummary({ watched }) {
  const avgImdbRating = average(
    watched?.map((movie) => movie.imdbRating)
  )?.toFixed(2);
  const avgUserRating = average(
    watched?.map((movie) => movie.userRating)
  )?.toFixed(2);
  const avgRuntime = average(watched?.map((movie) => movie.runtime))?.toFixed(2);
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched?.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating || 'NA'}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating  || 'NA'}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime || 'NA'} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDelete }) {
  return (
    <ul className="list">
      {watched ? watched.map((movie) => (
        <li key={movie.imdbId}>
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
          <h3>{movie.Title}</h3>
          <div>
            <p>
              <span>⭐️</span>
              <span>{movie.imdbRating}</span>
            </p>
            <p>
              <span>🌟</span>
              <span>{movie.userRating}</span>
            </p>
            <p>
              <span>⏳</span>
              <span>{movie.runtime} min</span>
            </p>
          </div>
          <button className="btn-delete" onClick={() => onDelete(movie.imdbId)}>
            &times;
          </button>
        </li>
      )) : <></>}
    </ul>
  );
}

function MoviesList({ movies, handleMovieSelect }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <li onClick={() => handleMovieSelect(movie.imdbID)} key={movie.imdbID}>
          <img src={movie.Poster} alt={`${movie.Title} poster`} />
          <h3>{movie.Title}</h3>
          <div>
            <p>
              <span>🗓</span>
              <span>{movie.Year}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
