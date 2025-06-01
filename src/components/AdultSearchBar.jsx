import { useState, useCallback, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { FaSearch, FaPlay, FaExternalLinkAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './AdultSearchBar.css';
import SearchInput from './AdultSearchBar/SearchInput';
import ResultsGrid from './AdultSearchBar/ResultsGrid';
import VideoModal from './AdultSearchBar/VideoModal';

const AdultSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sources, setSources] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('adultFavorites') || '[]'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('adultHistory') || '[]'));
  const [filters, setFilters] = useState({ category: '', duration: '', quality: '', rating: '' });
  const [sortBy, setSortBy] = useState('relevance');
  const [tab, setTab] = useState('all'); // all, favorites, watchlist, history
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('adultWatchlist') || '[]'));

  // API endpoints and keys
  const EPORNER_API_KEY = import.meta.env.VITE_EPORNER_API_KEY;
  const EPORNER_BASE_URL = 'https://www.eporner.com/api/v2/video';

  const tabOrder = ['all', 'favorites', 'watchlist', 'history'];
  const containerRef = useRef(null);

  // Swipe gesture handlers
  let touchStartX = 0;
  let touchEndX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
  };
  const handleTouchEnd = (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipeGesture();
  };
  const handleSwipeGesture = () => {
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 60) {
      const currentIdx = tabOrder.indexOf(tab);
      if (deltaX < 0 && currentIdx < tabOrder.length - 1) {
        setTab(tabOrder[currentIdx + 1]);
      } else if (deltaX > 0 && currentIdx > 0) {
        setTab(tabOrder[currentIdx - 1]);
      }
    }
  };

  // Update debouncedSearch to fetch from Eporner only
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const epornerResponse = await fetch(
          `${EPORNER_BASE_URL}/search/?query=${encodeURIComponent(query)}&per_page=20&page=1&thumbsize=medium&order=top-weekly&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
        );
        const epornerData = await epornerResponse.json();
        const epornerResults = epornerData.videos.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.default_thumb.src,
          duration: video.duration,
          views: video.views,
          rating: video.rating,
          source: 'eporner',
          embedUrl: `https://www.eporner.com/embed/${video.id}`,
          directUrl: `https://www.eporner.com/video/${video.id}`
        }));
        setSearchResults(epornerResults);
      } catch (error) {
        console.error('Error searching videos:', error);
        toast.error('Error searching videos. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle video selection
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    // Add to history
    setHistory((prev) => {
      const updated = [video, ...prev.filter((v) => v.id !== video.id)].slice(0, 10);
      localStorage.setItem('adultHistory', JSON.stringify(updated));
      return updated;
    });
    fetchAdditionalSources(video.title);
  };

  // Toggle favorite
  const handleToggleFavorite = (video) => {
    setFavorites((prev) => {
      let updated;
      if (prev.some((v) => v.id === video.id)) {
        updated = prev.filter((v) => v.id !== video.id);
        toast.info('Removed from favorites');
      } else {
        updated = [video, ...prev];
        toast.success('Added to favorites');
      }
      localStorage.setItem('adultFavorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Toggle watchlist
  const handleToggleWatchlist = (video) => {
    setWatchlist((prev) => {
      let updated;
      if (prev.some((v) => v.id === video.id)) {
        updated = prev.filter((v) => v.id !== video.id);
        toast.info('Removed from watchlist');
      } else {
        updated = [video, ...prev];
        toast.success('Added to watchlist');
      }
      localStorage.setItem('adultWatchlist', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch additional sources for a video
  const fetchAdditionalSources = async (title) => {
    try {
      const additionalSources = [
        { name: 'VidSrc', url: `https://vidsrc.to/embed/movie/${title}`, type: 'embed' },
        { name: 'FlixHQ', url: `https://flixhq.to/embed/${title}`, type: 'embed' }
      ];
      setSources(additionalSources);
    } catch (error) {
      console.error('Error fetching additional sources:', error);
    }
  };

  // Advanced filters and sorting UI (placeholder)
  const renderFilters = () => (
    <div className="filters-section">
      <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
        <option value="">All Categories</option>
        <option value="straight">Straight</option>
        <option value="gay">Gay</option>
        <option value="lesbian">Lesbian</option>
      </select>
      <select value={filters.duration} onChange={e => setFilters(f => ({ ...f, duration: e.target.value }))}>
        <option value="">All Durations</option>
        <option value="short">Short (&lt;10m)</option>
        <option value="medium">Medium (10-30m)</option>
        <option value="long">Long (&gt;30m)</option>
      </select>
      <select value={filters.quality} onChange={e => setFilters(f => ({ ...f, quality: e.target.value }))}>
        <option value="">All Qualities</option>
        <option value="hd">HD</option>
        <option value="sd">SD</option>
      </select>
      <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))}>
        <option value="">All Ratings</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="relevance">Relevance</option>
        <option value="views">Most Viewed</option>
        <option value="rating">Top Rated</option>
        <option value="duration">Longest</option>
      </select>
    </div>
  );

  // Loading skeletons and empty states
  const renderSkeletons = () => (
    <div className="search-results">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="result-card skeleton">
          <div className="result-thumbnail skeleton-img" />
          <div className="result-info">
            <div className="skeleton-title" />
            <div className="skeleton-meta" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="no-results">No results found. Try a different search or adjust your filters.</div>
  );

  return (
    <div
      className="adult-search-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SearchInput
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        loading={loading}
      />
      {renderFilters()}
      <div className="tabs">
        <button className={tab==='all' ? 'active' : ''} onClick={()=>setTab('all')}>All</button>
        <button className={tab==='favorites' ? 'active' : ''} onClick={()=>setTab('favorites')}>Favorites</button>
        <button className={tab==='watchlist' ? 'active' : ''} onClick={()=>setTab('watchlist')}>Watchlist</button>
        <button className={tab==='history' ? 'active' : ''} onClick={()=>setTab('history')}>Recently Watched</button>
      </div>
      {tab==='all' && (loading
        ? renderSkeletons()
        : searchResults.length > 0
          ? <ResultsGrid searchResults={searchResults} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />
          : renderEmptyState()
      )}
      {tab==='favorites' && <ResultsGrid searchResults={favorites} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {tab==='watchlist' && <ResultsGrid searchResults={watchlist} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {tab==='history' && <ResultsGrid searchResults={history} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          sources={sources}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
};

export default AdultSearchBar; 