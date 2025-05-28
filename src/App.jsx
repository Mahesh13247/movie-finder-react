import { useState, useEffect, useRef } from 'react';
import './App.css';
import './i18n';
import debounce from 'lodash.debounce';
import { FaHeart, FaRegHeart, FaStar, FaUserCircle, FaFacebook, FaTwitter, FaWhatsapp, FaCalendarAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import AnimatedBackground from './AnimatedBackground';
import ThemeCustomizer from './ThemeCustomizer';
import AdminPanel from './AdminPanel';
import UserBadges from './UserBadges';
import MovieLists from './MovieLists';

function App() {
  const API_KEY = import.meta.env.VITE_API_KEY;
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, i18n } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [lastWatched, setLastWatched] = useState(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [loading, setLoading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [trending, setTrending] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userRatings, setUserRatings] = useState(() => JSON.parse(localStorage.getItem('userRatings') || '{}'));
  const [reviews, setReviews] = useState(() => JSON.parse(localStorage.getItem('reviews') || '{}'));
  const [reviewInput, setReviewInput] = useState('');
  const [reviewMovieId, setReviewMovieId] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('profile') || '{"name":"Guest","avatar":""}'));
  const [editProfile, setEditProfile] = useState(false);
  const [profileName, setProfileName] = useState(profile.name);
  const [showCalendar, setShowCalendar] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [activePage, setActivePage] = useState('home');
  const searchInputRef = useRef();

  useEffect(() => {
    const storedMovie = JSON.parse(localStorage.getItem("lastWatchedMovie"));
    if (storedMovie) {
      setLastWatched(storedMovie);
      setBackgroundImage(storedMovie.movieID);
    }
  }, []);

  useEffect(() => {
    // Fetch genres on mount
    fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => setGenres(data.genres || []));
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Debounced search
  const debouncedSearch = useRef(
    debounce(() => {
      searchMovie();
    }, 300)
  ).current;

  useEffect(() => {
    if (searchInput) debouncedSearch();
    // eslint-disable-next-line
  }, [searchInput, selectedGenre]);

  // Trending movies fetch
  useEffect(() => {
    fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => setTrending(data.results || []));
  }, []);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 200 &&
        !loading && hasMore
      ) {
        setPage((prev) => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    if (page === 1) return;
    loadMoreMovies();
    // eslint-disable-next-line
  }, [page]);

  const loadMoreMovies = async () => {
    setLoading(true);
    let url = '';
    if (searchInput.trim()) {
      url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchInput)}&page=${page}`;
      if (selectedGenre) url += `&with_genres=${selectedGenre}`;
    } else if (selectedGenre) {
      url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&page=${page}`;
    } else {
      setLoading(false);
      setHasMore(false);
      return;
    }
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      setMovies((prev) => [...prev, ...data.results]);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  const setBackgroundImage = (movieId) => {
    fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.backdrop_path) {
          const imageUrl = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
          document.body.style.backgroundImage = `url('${imageUrl}')`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
        } else {
          document.body.style.backgroundImage = "url('default-background.jpg')";
        }
      })
      .catch((err) => {
        console.error("Error fetching movie details:", err);
        document.body.style.backgroundImage = "url('default-background.jpg')";
      });
  };

  const searchMovie = async () => {
    if (!searchInput.trim() && !selectedGenre) {
      setMovies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let url = '';
      if (searchInput.trim()) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchInput)}`;
        if (selectedGenre) url += `&with_genres=${selectedGenre}`;
      } else if (selectedGenre) {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch movie data. Status: ${response.status}`);
      }
      const data = await response.json();
      setMovies(data.results || []);
    } catch (error) {
      console.error("Error fetching movies:", error);
      setMovies([]);
    }
    setLoading(false);
  };

  const fetchTrailer = async (movieId) => {
    setTrailerUrl('');
    const res = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await res.json();
    const yt = (data.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (yt) setTrailerUrl(`https://www.youtube.com/embed/${yt.key}`);
  };

  const watchMovie = (movieId, movieTitle) => {
    const movieData = { movieID: movieId, movieTitle };
    localStorage.setItem("lastWatchedMovie", JSON.stringify(movieData));
    setLastWatched(movieData);
    setSelectedMovie(movieData);
    setBackgroundImage(movieId);
    fetchTrailer(movieId);
  };

  const switchSource = (movieId) => {
    console.warn("First source failed, switching to FlixHQ...");
    // In a real implementation, you would update the iframe source here
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchMovie();
    }
  };

  const streamingSources = [
    { name: "VidSrc", url: `https://vidsrc.to/embed/movie/${selectedMovie?.movieID || lastWatched?.movieID}` },
    { name: "FlixHQ", url: `https://flixhq.to/embed/${selectedMovie?.movieID || lastWatched?.movieID}` },
    { name: "Mat6Tube", url: "https://mat6tube.com/recent" }
  ];

  // Favorite logic
  const [favorites, setFavorites] = useState(() => {
    const favs = localStorage.getItem('favorites');
    return favs ? JSON.parse(favs) : [];
  });
  const toggleFavorite = (movie) => {
    let updated;
    if (isFavorite(movie)) {
      updated = favorites.filter(f => f.id !== movie.id);
    } else {
      updated = [...favorites, movie];
    }
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };
  const isFavorite = (movie) => favorites.some(f => f.id === movie.id);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Random movie
  const fetchRandomMovie = async () => {
    toast.info('Fetching a random movie...');
    let totalPages = 500; // TMDb max
    let pageNum = Math.floor(Math.random() * totalPages) + 1;
    const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${pageNum}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const random = data.results[Math.floor(Math.random() * data.results.length)];
      setMovies([random]);
      setSelectedMovie({ movieID: random.id, movieTitle: random.title });
      setBackgroundImage(random.id);
      fetchTrailer(random.id);
      toast.success(`Random movie: ${random.title}`);
    } else {
      toast.error('Could not fetch a random movie.');
    }
  };

  // User ratings
  const rateMovie = (movieId, rating) => {
    const updated = { ...userRatings, [movieId]: rating };
    setUserRatings(updated);
    localStorage.setItem('userRatings', JSON.stringify(updated));
    toast.success('Thanks for rating!');
  };

  const handleReviewSubmit = (movieId) => {
    if (!reviewInput.trim()) return;
    const newReview = {
      text: reviewInput,
      date: new Date().toLocaleString(),
    };
    const updated = {
      ...reviews,
      [movieId]: [...(reviews[movieId] || []), newReview],
    };
    setReviews(updated);
    localStorage.setItem('reviews', JSON.stringify(updated));
    setReviewInput('');
    setReviewMovieId(null);
    toast.success('Review added!');
  };

  const currentMovieId = selectedMovie?.movieID || lastWatched?.movieID;
  const currentReviews = reviews[currentMovieId] || [];

  // Fetch search suggestions
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchInput)}&page=1`)
      .then(res => res.json())
      .then(data => {
        setSuggestions((data.results || []).slice(0, 6));
        setShowSuggestions(true);
      });
  }, [searchInput]);

  // Fetch upcoming movies for calendar
  useEffect(() => {
    if (!showCalendar) return;
    fetch(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`)
      .then(res => res.json())
      .then(data => setUpcoming(data.results || []));
  }, [showCalendar]);

  // Profile save
  const handleProfileSave = () => {
    const updated = { ...profile, name: profileName };
    setProfile(updated);
    localStorage.setItem('profile', JSON.stringify(updated));
    setEditProfile(false);
    toast.success('Profile updated!');
  };

  // Social share
  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Check out this awesome movie site!`;
    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'whatsapp') shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="app">
      <ToastContainer position="top-right" autoClose={2000} />
      <nav className="feature-nav" style={{display:'flex',gap:8,justifyContent:'center',marginTop:8}}>
        <button className={activePage==='home'?'active':''} onClick={()=>setActivePage('home')}>Home</button>
        <button className={activePage==='admin'?'active':''} onClick={()=>setActivePage('admin')}>{t('admin_panel')}</button>
        <button className={activePage==='theme'?'active':''} onClick={()=>setActivePage('theme')}>{t('theme_customization')}</button>
        <button className={activePage==='animatedbg'?'active':''} onClick={()=>setActivePage('animatedbg')}>{t('animated_background')}</button>
        <button className={activePage==='badges'?'active':''} onClick={()=>setActivePage('badges')}>{t('user_badges')}</button>
        <button className={activePage==='lists'?'active':''} onClick={()=>setActivePage('lists')}>{t('movie_lists')}</button>
      </nav>
      {activePage === 'admin' && <AdminPanel />}
      {activePage === 'theme' && <ThemeCustomizer />}
      {activePage === 'animatedbg' && <AnimatedBackground />}
      {activePage === 'badges' && <UserBadges />}
      {activePage === 'lists' && <MovieLists />}
      {activePage === 'home' && (
        <>
          <header className="custom-header">
            <div className="header-bg-shape"></div>
            <div className="header-content">
              <div className="header-row">
                <div className="logo-title">
                  <span className="logo-icon">🍿</span>
                  <h1 className="main-title">{t('title')}</h1>
                </div>
                <div className="author-badge">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="profile" className="main-profile-photo" />
                  ) : (
                    <span className="author-avatar">👨‍💻</span>
                  )}
                  <span className="author-name">K MAHESH KUMAR ACHARY</span>
                  <button style={{marginLeft:8}} onClick={()=>setShowProfile(v=>!v)} title="Profile"><FaUserCircle size={22} /></button>
                  <button style={{marginLeft:4}} onClick={()=>setShowCalendar(v=>!v)} title="Upcoming Movies"><FaCalendarAlt size={20} /></button>
                  <select
                    aria-label="Language selector"
                    style={{marginLeft:8}}
                    value={i18n.language}
                    onChange={e => {
                      i18n.changeLanguage(e.target.value);
                      localStorage.setItem('lang', e.target.value);
                    }}
                  >
                    <option value="en">EN</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
              </div>
              <div className="search-row" style={{position:'relative'}}>
                <div className="search-container">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={t('search_placeholder')}
                    aria-label={t('search_placeholder')}
                    onFocus={()=>setShowSuggestions(suggestions.length>0)}
                    onBlur={()=>setTimeout(()=>setShowSuggestions(false), 200)}
                  />
                  <button onClick={searchMovie} aria-label={t('search')}>🔍 {t('search')}</button>
                  <select value={selectedGenre} onChange={e => setSelectedGenre(e.target.value)} aria-label={t('all_genres')}>
                    <option value="">{t('all_genres')}</option>
                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                  <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                  <button onClick={fetchRandomMovie} className="theme-toggle" style={{marginLeft: 8}} aria-label={t('random_movie')}>🎲 {t('random_movie')}</button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="autocomplete-suggestions">
                    {suggestions.map(s => (
                      <div key={s.id} className="autocomplete-suggestion" onMouseDown={()=>{
                        setSearchInput(s.title);
                        setShowSuggestions(false);
                        searchMovie();
                      }}>{s.title}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>
          {showProfile && (
            <div className="profile-page">
              <div className="profile-avatar">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" style={{width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover'}} />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <div className="profile-info">
                <label>Name:</label>
                {editProfile ? (
                  <input value={profileName} onChange={e=>setProfileName(e.target.value)} />
                ) : (
                  <span>{profile.name}</span>
                )}
              </div>
              {editProfile && (
                <div style={{marginBottom: 12}}>
                  <label>Upload Avatar: </label>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setProfile(p => ({...p, avatar: ev.target.result}));
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              )}
              <div className="profile-actions">
                {editProfile ? (
                  <button onClick={handleProfileSave}>Save</button>
                ) : (
                  <button onClick={()=>setEditProfile(true)}>Edit</button>
                )}
                <button onClick={()=>setShowProfile(false)}>Close</button>
              </div>
            </div>
          )}
          {showCalendar && (
            <div className="movie-calendar">
              <div className="calendar-header">🎬 Upcoming Movies</div>
              <ul className="calendar-list">
                {upcoming.length === 0 && <li>Loading...</li>}
                {upcoming.map(m => (
                  <li key={m.id}>
                    <span className="calendar-movie-title">{m.title}</span>
                    <span className="calendar-movie-date">{m.release_date}</span>
                  </li>
                ))}
              </ul>
              <button style={{marginTop:10}} onClick={()=>setShowCalendar(false)}>Close</button>
            </div>
          )}
          <main>
            {/* Trending Carousel */}
            <section className="carousel-section">
              <h2>{t('trending')}</h2>
              <div className="carousel">
                {trending.map((movie) => (
                  <div key={movie.id} className="carousel-card" onClick={() => watchMovie(movie.id, movie.title)}>
                    <img src={movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://via.placeholder.com/100x150?text=No+Image'} alt={movie.title} />
                    <div className="carousel-title">{movie.title}</div>
                  </div>
                ))}
              </div>
            </section>
            <div className="movies-grid" aria-live="polite">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="movie-card skeleton" aria-busy="true">
                    <div className="skeleton-img" />
                    <div className="skeleton-title" />
                    <div className="skeleton-btn" />
                  </div>
                ))
              ) : (
                movies.map((movie) => (
                  <div key={movie.id} className="movie-card">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : "https://via.placeholder.com/200x300?text=No+Image"
                      }
                      alt={movie.title}
                    />
                    <h3>{movie.title}</h3>
                    <div className="rating-stars">
                      {[1,2,3,4,5].map(star => (
                        <FaStar
                          key={star}
                          color={userRatings[movie.id] >= star ? '#fc0' : '#ccc'}
                          style={{cursor:'pointer'}}
                          onClick={() => rateMovie(movie.id, star)}
                        />
                      ))}
                    </div>
                    <button onClick={() => watchMovie(movie.id, movie.title)} aria-label={t('watch_now')}>
                      {t('watch_now')}
                    </button>
                    <button className="heart-btn" onClick={() => toggleFavorite(movie)}>
                      {isFavorite(movie) ? <FaHeart color="red" /> : <FaRegHeart />}
                    </button>
                    <div className="share-buttons">
                      <button className="share-btn" title="Share on Facebook" onClick={()=>handleShare('facebook')}><FaFacebook /></button>
                      <button className="share-btn" title="Share on Twitter" onClick={()=>handleShare('twitter')}><FaTwitter /></button>
                      <button className="share-btn" title="Share on WhatsApp" onClick={()=>handleShare('whatsapp')}><FaWhatsapp /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {(selectedMovie || lastWatched) && (
              <div className="player-container">
                <h2>Streaming: {selectedMovie?.movieTitle || lastWatched?.movieTitle}</h2>
                <iframe
                  id="videoPlayer"
                  src={streamingSources[0].url}
                  width="800"
                  height="450"
                  allowFullScreen
                  onError={() => switchSource(selectedMovie?.movieID || lastWatched?.movieID)}
                ></iframe>
                {trailerUrl && (
                  <div className="trailer-section">
                    <h3>Trailer</h3>
                    <iframe
                      width="560"
                      height="315"
                      src={trailerUrl}
                      title="YouTube trailer"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
                {/* Reviews Section */}
                <div className="reviews-section">
                  <h3>{t('reviews_comments')}</h3>
                  <div className="reviews-list">
                    {currentReviews.length === 0 && <div className="no-reviews">{t('no_reviews')}</div>}
                    {currentReviews.map((r, i) => (
                      <div key={i} className="review-item">
                        <div className="review-text">{r.text}</div>
                        <div className="review-date">{r.date}</div>
                      </div>
                    ))}
                  </div>
                  <div className="review-form">
                    <textarea
                      value={reviewMovieId === currentMovieId ? reviewInput : ''}
                      onChange={e => { setReviewInput(e.target.value); setReviewMovieId(currentMovieId); }}
                      placeholder={t('write_review')}
                      rows={2}
                      aria-label={t('write_review')}
                    />
                    <button onClick={() => handleReviewSubmit(currentMovieId)} style={{marginLeft:8}} aria-label={t('submit')}>{t('submit')}</button>
                  </div>
                </div>
                <div className="alternative-links">
                  <p>{t('alternative_sources')}</p>
                  <a
                    href={`https://prmovies.land/?s=${encodeURIComponent(
                      selectedMovie?.movieTitle || lastWatched?.movieTitle
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alt-link"
                  >
                    PRMovies
                  </a>
                  <a
                    href={`https://yomovies.horse/?s=${encodeURIComponent(
                      selectedMovie?.movieTitle || lastWatched?.movieTitle
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alt-link"
                  >
                    YoMovies
                  </a>
                  <a
                    href={streamingSources[1].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alt-link"
                  >
                    FlixHQ
                  </a>
                  <a
                    href={streamingSources[2].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="alt-link"
                  >
                    Mat6Tube
                  </a>
                </div>
              </div>
            )}
          </main>
          <div className="fottercontainer">
            <footer className="footer">
              <p>
                {t('designed_by')} <span className="author-name">K Mahesh Kumar Achary</span>
              </p>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}

export default App;