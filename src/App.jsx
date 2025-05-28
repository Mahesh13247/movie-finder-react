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
        <button className={activePage==='adult'?'active':''} onClick={()=>setActivePage('adult')}>Adult 18+</button>
      </nav>
      {activePage === 'admin' && <AdminPanel />}
      {activePage === 'theme' && <ThemeCustomizer />}
      {activePage === 'animatedbg' && <AnimatedBackground />}
      {activePage === 'badges' && <UserBadges />}
      {activePage === 'lists' && <MovieLists />}
      {activePage === 'adult' && (
        <AdultSection BASE_URL={BASE_URL} API_KEY={API_KEY} t={t} />
      )}
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

function AdultSection({ BASE_URL, API_KEY, t }) {
  const [adultMovies, setAdultMovies] = useState([]);
  const [adultWebSeries, setAdultWebSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [sortBy, setSortBy] = useState("popularity.desc");

  // Watch History
  const [watchHistory, setWatchHistory] = useState(() => {
    const history = localStorage.getItem('adultWatchHistory');
    return history ? JSON.parse(history) : [];
  });

  // Cast Information
  const [castInfo, setCastInfo] = useState(null);

  // Similar Content
  const [similarContent, setSimilarContent] = useState([]);

  // Content Warnings
  const [contentWarnings, setContentWarnings] = useState({});

  // Add to watch history
  const addToWatchHistory = (item) => {
    const newHistory = [
      { ...item, watchedAt: new Date().toISOString() },
      ...watchHistory.filter(h => h.id !== item.id).slice(0, 19) // Keep last 20
    ];
    setWatchHistory(newHistory);
    localStorage.setItem('adultWatchHistory', JSON.stringify(newHistory));
  };

  // Fetch cast and similar content
  const fetchExtraInfo = async (id, type) => {
    // Fetch cast
    const castRes = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
    const castData = await castRes.json();
    setCastInfo(castData);

    // Fetch similar content
    const similarRes = await fetch(`${BASE_URL}/${type}/${id}/similar?api_key=${API_KEY}`);
    const similarData = await similarRes.json();
    setSimilarContent(similarData.results?.slice(0, 6) || []);

    // Fetch content details for warnings
    const detailsRes = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}`);
    const details = await detailsRes.json();
    setContentWarnings({
      adult: details.adult,
      rating: details.vote_average,
      language: details.spoken_languages?.[0]?.english_name,
      violence: details.genre_ids?.includes(28), // Action genre as proxy
      nudity: details.adult,
    });
  };

  // Clear cast and similar when closing preview
  const handleClosePreview = () => {
    setPreview(null);
    setCastInfo(null);
    setSimilarContent([]);
    setContentWarnings({});
  };

  // --- New Features ---
  // Favorite logic for adult movies/series
  const [adultFavorites, setAdultFavorites] = useState(() => {
    const favs = localStorage.getItem('adultFavorites');
    return favs ? JSON.parse(favs) : [];
  });
  const toggleAdultFavorite = (item, type) => {
    const id = `${type}-${item.id}`;
    let updated;
    if (adultFavorites.some(f => f.id === id)) {
      updated = adultFavorites.filter(f => f.id !== id);
    } else {
      updated = [...adultFavorites, { ...item, id, type }];
    }
    setAdultFavorites(updated);
    localStorage.setItem('adultFavorites', JSON.stringify(updated));
  };
  const isAdultFavorite = (item, type) => adultFavorites.some(f => f.id === `${type}-${item.id}`);

  // Simple modal for adult preview
  const [preview, setPreview] = useState(null);
  // Video player modal state
  const [player, setPlayer] = useState(null); // {id, type, title}

  // --- End New Features ---

  // --- Extra Features ---
  // Pagination for adult movies/web series
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);
  const [hasMoreMovies, setHasMoreMovies] = useState(true);
  const [hasMoreSeries, setHasMoreSeries] = useState(true);

  // User reviews for adult content
  const [adultReviews, setAdultReviews] = useState(() => JSON.parse(localStorage.getItem('adultReviews') || '{}'));
  const [reviewInput, setReviewInput] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null); // {id, type}

  // Infinite scroll for movies/series
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        if (hasMoreMovies) setMoviePage(p => p + 1);
        if (hasMoreSeries) setTvPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMoreMovies, hasMoreSeries]);

  // Fetch paginated movies/series
  useEffect(() => {
    setLoading(true);
    let movieUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&include_adult=true&sort_by=${sortBy}&page=${moviePage}`;
    let tvUrl = `${BASE_URL}/discover/tv?api_key=${API_KEY}&include_adult=true&sort_by=${sortBy}&page=${tvPage}`;
    if (search.trim()) {
      movieUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&include_adult=true&query=${encodeURIComponent(search)}&sort_by=${sortBy}&page=${moviePage}`;
      tvUrl = `${BASE_URL}/search/tv?api_key=${API_KEY}&include_adult=true&query=${encodeURIComponent(search)}&sort_by=${sortBy}&page=${tvPage}`;
    }
    fetch(movieUrl)
      .then(res => res.json())
      .then(data => {
        if (moviePage === 1) {
          setAdultMovies((data.results || []).filter(m => m.adult));
        } else {
          setAdultMovies(prev => [...prev, ...(data.results || []).filter(m => m.adult)]);
        }
        setHasMoreMovies(data.page < data.total_pages);
        setLoading(false);
      });
    fetch(tvUrl)
      .then(res => res.json())
      .then(data => {
        if (tvPage === 1) {
          setAdultWebSeries((data.results || []).filter(m => m.adult));
        } else {
          setAdultWebSeries(prev => [...prev, ...(data.results || []).filter(m => m.adult)]);
        }
        setHasMoreSeries(data.page < data.total_pages);
      });
  }, [BASE_URL, API_KEY, search, sortBy, moviePage, tvPage]);

  // Add review for adult content
  const handleAdultReviewSubmit = (id, type) => {
    if (!reviewInput.trim()) return;
    const key = `${type}-${id}`;
    const newReview = {
      text: reviewInput,
      date: new Date().toLocaleString(),
    };
    const updated = {
      ...adultReviews,
      [key]: [...(adultReviews[key] || []), newReview],
    };
    setAdultReviews(updated);
    localStorage.setItem('adultReviews', JSON.stringify(updated));
    setReviewInput("");
    setReviewTarget(null);
    toast.success('Review added!');
  };
  // --- End Extra Features ---

  // Video Source Arrays
  const VID_SOURCES = [
    "https://vidsrc.to",
    "https://vidsrc.me",
    "https://vidsrc.in",
    "https://vidsrc.pm",
    "https://vidsrc.net",
    "https://vidsrc.xyz",
    "https://vidsrc.io",
    "https://vidsrc.vc",
    "https://dbgo.fun",
    "https://2embed.ru",
    "https://vidsrc.stream",
    "https://godriveplayer.com"
  ];

  const EXTERNAL_SOURCES = [
    "https://fullmovieshow.com",
    "https://isputlockers.com",
    "https://teh-movie.com",
    "https://solarmovieru.com",
    "https://movie4kto.life",
    "https://123moviesgo.bar",
    "https://freeforyou.site/watchserieshd",
    "https://tih-movie.com",
    "http://www.streamlord.com/index.html",
    "https://www.couchtuner.show",
    "https://en.bmovies-official.live/movies",
    "https://en.watchfree-official.live/movies",
    "https://prmovies.repair",
    "https://pikahd.com",
    "https://moviesbaba.cam",
    "https://moviesmod.surf",
    "https://animeflix.ltd",
    "https://1337x.hashhackers.com",
    "https://movie4nx.site",
    "https://animehub.ac/animehub.to",
    "https://uhdmovies.wales",
    "https://watchomovies.support"
  ];

  const ADULT_SOURCES = [
    "https://www.javmov.com",
    "https://www.javhd.com",
    "https://www.javdoe.com",
    "https://www.javmost.com",
    "https://www.javbus.com",
    "https://www.javfinder.com",
    "https://www.jav321.com",
    "https://www.javlibrary.com",
    "https://www.javdb.com",
    "https://www.javzoo.com",
    "https://www.javplay.com",
    "https://www.javstream.com",
    "https://www.javmoo.com",
    "https://www.javfap.com",
    "https://www.javxxx.com",
    "https://www.javsex.com",
    "https://www.javtube.com",
    "https://www.manyvids.com",
    "https://kemono.su",
    "https://javheo.com",
    "https://clip18x.com",
    "https://javeng.com",
    "https://www.eporner.com",
    "https://www.miruro.tv",
    "https://katmovie18.mov",
    "https://katmoviehd.rodeo",
    "https://hentaigasm.com",
    "https://www4.javdock.com",
    "https://www.cartoonporn.com",
    "https://mat6tube.com/recent",
    "https://www.qorno.com",
    "https://avple.tv",
    "https://hotleaks.tv",
    "https://en.pornohd.blue",
    "https://missav123.com/dm22/en",
    "https://chiggywiggy.com",
    "https://hanimehub.site",
    "https://nxprime.in/home.html",
    "https://hanime.tv",
    "https://supjav.com",
    "https://javgg.net",
    "https://sextb.net",
    "https://123av.com/en/dm5",
    "https://ppp.porn/pp1"
  ];

  // Source management state
  const [currentSourceType, setCurrentSourceType] = useState('vidsrc'); // 'vidsrc', 'external', 'adult'
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const [sourceHistory, setSourceHistory] = useState([]);

  return (
    <main>
      <h2 style={{color:'#ff3333', marginTop:20}}>🔞 Adult 18+ Movies & Web Series</h2>
      {showWarning && (
        <div className="adult-warning" style={{position:'relative'}}>
          This section contains adult content (18+). Viewer discretion is advised.
          <button style={{position:'absolute',right:10,top:5}} onClick={()=>setShowWarning(false)}>✖</button>
        </div>
      )}
      <div style={{display:'flex',gap:10,alignItems:'center',margin:'10px 0 20px 0',justifyContent:'center',flexWrap:'wrap'}}>
        <input
          type="text"
          placeholder="Search Adult Movies/Web Series..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
          style={{padding:'8px 12px',borderRadius:8,border:'1px solid #ccc',minWidth:220}}
        />
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'8px 12px',borderRadius:8}}>
          <option value="popularity.desc">Most Popular</option>
          <option value="release_date.desc">Latest</option>
          <option value="vote_average.desc">Top Rated</option>
        </select>
        <button onClick={()=>setShowSources(v=>!v)} style={{padding:'8px 16px',borderRadius:8,background:'#ff3333',color:'#fff',border:'none',fontWeight:600}}>
          {showSources ? 'Hide More Sources' : 'Show More Sources'}
        </button>
      </div>
      <h3 style={{color:'#ff3333',marginTop:10}}>Movies</h3>
      <div className="movies-grid">
        {loading && moviePage === 1 ? (
          <div>Loading...</div>
        ) : (
          adultMovies.length === 0 ? (
            <div>No adult movies found.</div>
          ) : (
            adultMovies.map(movie => (
              <div key={movie.id} className="movie-card">
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={movie.title}
                  style={{cursor:'pointer'}}
                  onClick={() => {
                    setPreview({type:'movie',...movie});
                    fetchExtraInfo(movie.id, 'movie');
                  }}
                />
                <h3>{movie.title}</h3>
                <div style={{display:'flex',gap:6,justifyContent:'center',margin:'8px 0'}}>
                  <button style={{background:'#ff3333',color:'#fff'}} onClick={() => setPlayer({id: movie.id, type: 'movie', title: movie.title})}>
                    {t('watch_now') || 'Watch Now'}
                  </button>
                  <a href={`https://prmovies.land/?s=${encodeURIComponent(movie.title)}`} target="_blank" rel="noopener noreferrer" className="alt-link">PRMovies</a>
                  <a href={`https://yomovies.horse/?s=${encodeURIComponent(movie.title)}`} target="_blank" rel="noopener noreferrer" className="alt-link">YoMovies</a>
                </div>
                <div style={{fontSize:'0.95em',color:'#888'}}>Release: {movie.release_date || 'N/A'} | Rating: {movie.vote_average || 'N/A'}</div>
                <div style={{marginTop:6,display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                  <span style={{background:'#ffcc00',color:'#222',padding:'2px 8px',borderRadius:6,fontSize:'0.9em'}}>Adult</span>
                  <button onClick={()=>toggleAdultFavorite(movie,'movie')} style={{background:'none',border:'none',cursor:'pointer'}} title={isAdultFavorite(movie,'movie') ? 'Remove from Favorites' : 'Add to Favorites'}>
                    {isAdultFavorite(movie,'movie') ? '💖' : '🤍'}
                  </button>
                </div>
                {/* Reviews for this movie */}
                <div style={{marginTop:8}}>
                  <strong style={{fontSize:'0.95em'}}>Reviews:</strong>
                  <div style={{maxHeight:60,overflowY:'auto',fontSize:'0.93em'}}>
                    {(adultReviews[`movie-${movie.id}`]||[]).length === 0 && <div style={{color:'#888'}}>No reviews yet.</div>}
                    {(adultReviews[`movie-${movie.id}`]||[]).map((r,i)=>(
                      <div key={i} style={{marginBottom:2}}><span style={{color:'#ffcc00'}}>{r.text}</span> <span style={{color:'#888',fontSize:'0.85em'}}>({r.date})</span></div>
                    ))}
                  </div>
                  {reviewTarget && reviewTarget.id===movie.id && reviewTarget.type==='movie' ? (
                    <div style={{marginTop:4,display:'flex',gap:4}}>
                      <input value={reviewInput} onChange={e=>setReviewInput(e.target.value)} placeholder="Write a review..." style={{flex:1,padding:'4px 8px',borderRadius:6,border:'1px solid #ccc'}} />
                      <button style={{background:'#ffcc00',color:'#222',border:'none',borderRadius:6,padding:'4px 10px'}} onClick={()=>handleAdultReviewSubmit(movie.id,'movie')}>Submit</button>
                      <button style={{background:'#eee',color:'#222',border:'none',borderRadius:6,padding:'4px 10px'}} onClick={()=>{setReviewTarget(null);setReviewInput("")}}>Cancel</button>
                    </div>
                  ) : (
                    <button style={{marginTop:4,background:'#eee',color:'#222',border:'none',borderRadius:6,padding:'4px 10px',fontSize:'0.95em'}} onClick={()=>{setReviewTarget({id:movie.id,type:'movie'});setReviewInput("")}}>Add Review</button>
                  )}
                </div>
              </div>
            ))
          )
        )}
      </div>
      <h3 style={{color:'#ff3333',marginTop:30}}>Web Series</h3>
      <div className="movies-grid">
        {adultWebSeries.length === 0 ? (
          <div>No adult web series found.</div>
        ) : (
          adultWebSeries.map(series => (
            <div key={series.id} className="movie-card">
              <img
                src={
                  series.poster_path
                    ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
                    : "https://via.placeholder.com/200x300?text=No+Image"
                }                  alt={series.name}
                  style={{cursor:'pointer'}}
                  onClick={() => {
                    setPreview({type:'tv',...series});
                    fetchExtraInfo(series.id, 'tv');
                  }}
                />
              <h3>{series.name}</h3>
              <div style={{display:'flex',gap:6,justifyContent:'center',margin:'8px 0'}}>
                <button style={{background:'#ff3333',color:'#fff'}} onClick={() => setPlayer({id: series.id, type: 'tv', title: series.name})}>
                  {t('watch_now') || 'Watch Now'}
                </button>
                <a href={`https://prmovies.land/?s=${encodeURIComponent(series.name)}`} target="_blank" rel="noopener noreferrer" className="alt-link">PRMovies</a>
                <a href={`https://yomovies.horse/?s=${encodeURIComponent(series.name)}`} target="_blank" rel="noopener noreferrer" className="alt-link">YoMovies</a>
              </div>
              <div style={{fontSize:'0.95em',color:'#888'}}>First Air: {series.first_air_date || 'N/A'} | Rating: {series.vote_average || 'N/A'}</div>
              <div style={{marginTop:6,display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                <span style={{background:'#ffcc00',color:'#222',padding:'2px 8px',borderRadius:6,fontSize:'0.9em'}}>Adult</span>
                <button onClick={()=>toggleAdultFavorite(series,'tv')} style={{background:'none',border:'none',cursor:'pointer'}} title={isAdultFavorite(series,'tv') ? 'Remove from Favorites' : 'Add to Favorites'}>
                  {isAdultFavorite(series,'tv') ? '💖' : '🤍'}
                </button>
              </div>
              {/* Reviews for this series */}
              <div style={{marginTop:8}}>
                <strong style={{fontSize:'0.95em'}}>Reviews:</strong>
                <div style={{maxHeight:60,overflowY:'auto',fontSize:'0.93em'}}>
                  {(adultReviews[`tv-${series.id}`]||[]).length === 0 && <div style={{color:'#888'}}>No reviews yet.</div>}
                  {(adultReviews[`tv-${series.id}`]||[]).map((r,i)=>(
                    <div key={i} style={{marginBottom:2}}><span style={{color:'#ffcc00'}}>{r.text}</span> <span style={{color:'#888',fontSize:'0.85em'}}>({r.date})</span></div>
                  ))}
                </div>
                {reviewTarget && reviewTarget.id===series.id && reviewTarget.type==='tv' ? (
                  <div style={{marginTop:4,display:'flex',gap:4}}>
                    <input value={reviewInput} onChange={e=>setReviewInput(e.target.value)} placeholder="Write a review..." style={{flex:1,padding:'4px 8px',borderRadius:6,border:'1px solid #ccc'}} />
                    <button style={{background:'#ffcc00',color:'#222',border:'none',borderRadius:6,padding:'4px 10px'}} onClick={()=>handleAdultReviewSubmit(series.id,'tv')}>Submit</button>
                    <button style={{background:'#eee',color:'#222',border:'none',borderRadius:6,padding:'4px 10px'}} onClick={()=>{setReviewTarget(null);setReviewInput("")}}>Cancel</button>
                  </div>
                ) : (
                  <button style={{marginTop:4,background:'#eee',color:'#222',border:'none',borderRadius:6,padding:'4px 10px',fontSize:'0.95em'}} onClick={()=>{setReviewTarget({id:series.id,type:'tv'});setReviewInput("")}}>Add Review</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Favorites Section */}
      {adultFavorites.length > 0 && (
        <div style={{marginTop:40}}>
          <h3 style={{color:'#ff3333'}}>💖 Your Adult Favorites</h3>
          <div className="movies-grid">
            {adultFavorites.map(fav => (
              <div key={fav.id} className="movie-card">
                <img
                  src={
                    fav.poster_path
                      ? `https://image.tmdb.org/t/p/w500${fav.poster_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image"
                  }
                  alt={fav.title || fav.name}
                  style={{cursor:'pointer'}}
                  onClick={()=>setPreview(fav)}
                />
                <h3>{fav.title || fav.name}</h3>
                <div style={{fontSize:'0.95em',color:'#888'}}>{fav.type === 'movie' ? `Release: ${fav.release_date || 'N/A'}` : `First Air: ${fav.first_air_date || 'N/A'}`} | Rating: {fav.vote_average || 'N/A'}</div>
                <div style={{marginTop:6,display:'flex',justifyContent:'center',alignItems:'center',gap:8}}>
                  <span style={{background:'#ffcc00',color:'#222',padding:'2px 8px',borderRadius:6,fontSize:'0.9em'}}>Adult</span>
                  <button onClick={()=>toggleAdultFavorite(fav,fav.type)} style={{background:'none',border:'none',cursor:'pointer'}} title="Remove from Favorites">💖</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Preview Modal */}
      {preview && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={handleClosePreview}>
          <div style={{background:'#222',padding:24,borderRadius:16,maxWidth:800,width:'90%',color:'#fff',position:'relative',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <button style={{position:'absolute',top:8,right:12,background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer'}} onClick={handleClosePreview}>✖</button>
            
            {/* Main Info */}
            <div style={{display:'flex',gap:20,marginBottom:20}}>
              <img 
                src={preview.poster_path ? `https://image.tmdb.org/t/p/w500${preview.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Image'} 
                alt={preview.title || preview.name} 
                style={{width:200,borderRadius:10}}
              />
              <div>
                <h2 style={{color:'#ff3333',margin:'0 0 10px'}}>{preview.title || preview.name}</h2>
                <div style={{fontSize:'0.98em',color:'#ffcc00',marginBottom:8}}>
                  {preview.type === 'movie' ? `Release: ${preview.release_date || 'N/A'}` : `First Air: ${preview.first_air_date || 'N/A'}`}
                </div>
                <div style={{fontSize:'0.98em',marginBottom:8}}>Rating: {preview.vote_average || 'N/A'}/10</div>
                <p style={{fontSize:'0.98em',color:'#ddd'}}>{preview.overview || 'No description available.'}</p>
                
                {/* Content Warnings */}
                {Object.keys(contentWarnings).length > 0 && (
                  <div style={{marginTop:15}}>
                    <h4 style={{color:'#ff3333',marginBottom:8}}>⚠️ Content Warnings:</h4>
                    <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                      {contentWarnings.adult && (
                        <span style={{background:'#ff3333',color:'#fff',padding:'3px 8px',borderRadius:4,fontSize:'0.9em'}}>Adult Content</span>
                      )}
                      {contentWarnings.violence && (
                        <span style={{background:'#ff3333',color:'#fff',padding:'3px 8px',borderRadius:4,fontSize:'0.9em'}}>Violence</span>
                      )}
                      {contentWarnings.nudity && (
                        <span style={{background:'#ff3333',color:'#fff',padding:'3px 8px',borderRadius:4,fontSize:'0.9em'}}>Nudity</span>
                      )}
                      {contentWarnings.language && (
                        <span style={{background:'#666',color:'#fff',padding:'3px 8px',borderRadius:4,fontSize:'0.9em'}}>
                          Language: {contentWarnings.language}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{display:'flex',gap:8,marginTop:15}}>
                  <button 
                    style={{background:'#ff3333',color:'#fff',padding:'8px 16px',borderRadius:8,border:'none'}}
                    onClick={() => {
                      setPlayer({id: preview.id, type: preview.type, title: preview.title || preview.name});
                      addToWatchHistory(preview);
                    }}
                  >
                    Watch Now
                  </button>
                  <button 
                    style={{background:'#ffcc00',color:'#222',padding:'8px 16px',borderRadius:8,border:'none'}}
                    onClick={() => toggleAdultFavorite(preview,preview.type)}
                  >
                    {isAdultFavorite(preview,preview.type) ? '💖 Remove Favorite' : '🤍 Add Favorite'}
                  </button>
                </div>
              </div>
            </div>

            {/* Cast Information */}
            {castInfo?.cast?.length > 0 && (
              <div style={{marginTop:20}}>
                <h3 style={{color:'#ff3333',marginBottom:10}}>Cast</h3>
                <div style={{display:'flex',gap:15,overflowX:'auto',padding:'10px 0'}}>
                  {castInfo.cast.slice(0, 6).map(person => (
                    <div key={person.id} style={{textAlign:'center',minWidth:100}}>
                      <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w200${person.profile_path}` : 'https://via.placeholder.com/100x150?text=No+Image'}
                        alt={person.name}
                        style={{width:100,height:150,objectFit:'cover',borderRadius:8}}
                      />
                      <div style={{fontSize:'0.9em',marginTop:5}}>{person.name}</div>
                      <div style={{fontSize:'0.8em',color:'#888'}}>{person.character}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Content */}
            {similarContent.length > 0 && (
              <div style={{marginTop:20}}>
                <h3 style={{color:'#ff3333',marginBottom:10}}>Similar Content</h3>
                <div style={{display:'flex',gap:15,overflowX:'auto',padding:'10px 0'}}>
                  {similarContent.map(item => (
                    <div key={item.id} style={{minWidth:120,cursor:'pointer'}} onClick={() => {
                      setPreview({type: preview.type, ...item});
                      fetchExtraInfo(item.id, preview.type);
                    }}>
                      <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/120x180?text=No+Image'}
                        alt={item.title || item.name}
                        style={{width:120,borderRadius:8}}
                      />
                      <div style={{fontSize:'0.9em',marginTop:5}}>{item.title || item.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download Links */}
            <div style={{marginTop:20}}>
              <h3 style={{color:'#ff3333',marginBottom:10}}>Download Options</h3>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                <a
                  href={`https://prmovies.land/?s=${encodeURIComponent(preview.title || preview.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="alt-link"
                  style={{padding:'8px 16px',background:'#444',color:'#fff',textDecoration:'none',borderRadius:8}}
                >
                  PRMovies
                </a>
                <a
                  href={`https://yomovies.horse/?s=${encodeURIComponent(preview.title || preview.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="alt-link"
                  style={{padding:'8px 16px',background:'#444',color:'#fff',textDecoration:'none',borderRadius:8}}
                >
                  YoMovies
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Player Modal */}
      {player && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.92)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setPlayer(null)}>
          <div style={{background:'#111',padding:12,borderRadius:12,maxWidth:900,width:'96%',position:'relative'}} onClick={e=>e.stopPropagation()}>
            <button style={{position:'absolute',top:8,right:12,background:'none',border:'none',color:'#fff',fontSize:28,cursor:'pointer'}} onClick={()=>setPlayer(null)}>✖</button>
            <h2 style={{color:'#ff3333',marginBottom:8}}>Streaming: {player.title}</h2>
            <div style={{position:'relative',width:'100%',height:480,background:'#000',borderRadius:8}}>
              <iframe
                src={player.type==='movie' ? `https://vidsrc.to/embed/movie/${player.id}` : `https://vidsrc.to/embed/tv/${player.id}`}
                width="100%"
                height="100%"
                allowFullScreen
                style={{borderRadius:8,border:'none',width:'100%',height:'100%'}}
                title={player.title}
                onError={(e) => {
                  console.error('Player error:', e);
                  toast.error('Error loading video. Trying alternative source...');
                  // Try alternative source
                  e.target.src = `https://flixhq.to/embed/${player.id}`;
                }}
              ></iframe>
              {/* Backup message if iframe fails */}
              <div style={{
                position:'absolute',
                bottom:10,
                left:0,
                right:0,
                textAlign:'center',
                color:'#fff',
                fontSize:'0.9em',
                padding:'10px'
              }}>
                If the player doesn't load, try the alternative sources below
              </div>
            </div>
            <div style={{marginTop:10,display:'flex',gap:10,justifyContent:'center'}}>
              <a href={player.type==='movie' ? `https://prmovies.land/?s=${encodeURIComponent(player.title)}` : `https://vidsrc.to/embed/tv/${player.id}`} target="_blank" rel="noopener noreferrer" className="alt-link">PRMovies</a>
              <a href={player.type==='movie' ? `https://yomovies.horse/?s=${encodeURIComponent(player.title)}` : `https://vidsrc.to/embed/tv/${player.id}`} target="_blank" rel="noopener noreferrer" className="alt-link">YoMovies</a>
              <a href={player.type==='movie' ? `https://flixhq.to/embed/${player.id}` : `https://flixhq.to/embed/${player.id}`} target="_blank" rel="noopener noreferrer" className="alt-link">FlixHQ</a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;