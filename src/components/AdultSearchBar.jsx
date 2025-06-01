import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem('adultFilters');
    return savedFilters ? JSON.parse(savedFilters) : { category: '', duration: '', quality: '', rating: '' };
  });
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('adultSortBy') || 'relevance');
  const [tab, setTab] = useState('all'); // all, favorites, watchlist, history
  const [watchlist, setWatchlist] = useState(() => JSON.parse(localStorage.getItem('adultWatchlist') || '[]'));
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => JSON.parse(localStorage.getItem('adultRecentSearches') || '[]'));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [trendingResults, setTrendingResults] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [playlists, setPlaylists] = useState(() => JSON.parse(localStorage.getItem('adultPlaylists') || '{}'));
  const [activePlaylist, setActivePlaylist] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [downloadQueue, setDownloadQueue] = useState(() => JSON.parse(localStorage.getItem('adultDownloadQueue') || '[]'));

  // API endpoints and keys
  const EPORNER_API_KEY = import.meta.env.VITE_EPORNER_API_KEY;
  const EPORNER_BASE_URL = 'https://www.eporner.com/api/v2/video';

  const tabOrder = ['all', 'trending', 'favorites', 'watchlist', 'playlists', 'downloads', 'history'];
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Reset page and results on new search
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && hasMore && !isFetchingMore && !loading) {
        fetchMoreResults();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isFetchingMore, loading, searchResults]);

  // Add duration formatting helper
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update the video mapping in debouncedSearch
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
          duration: formatDuration(parseInt(video.duration)),
          durationSeconds: parseInt(video.duration),
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

  // Update the video mapping in fetchMoreResults
  const fetchMoreResults = async () => {
    setIsFetchingMore(true);
    try {
      const nextPage = page + 1;
      const epornerResponse = await fetch(
        `${EPORNER_BASE_URL}/search/?query=${encodeURIComponent(searchQuery)}&per_page=20&page=${nextPage}&thumbsize=medium&order=top-weekly&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
      );
      const epornerData = await epornerResponse.json();
      const newResults = epornerData.videos.map(video => ({
        id: video.id,
        title: video.title,
        thumbnail: video.default_thumb.src,
        duration: formatDuration(parseInt(video.duration)),
        durationSeconds: parseInt(video.duration),
        views: video.views,
        rating: video.rating,
        source: 'eporner',
        embedUrl: `https://www.eporner.com/embed/${video.id}`,
        directUrl: `https://www.eporner.com/video/${video.id}`
      }));
      if (newResults.length === 0) setHasMore(false);
      setSearchResults(prev => [...prev, ...newResults.filter(v => !prev.some(x => x.id === v.id))]);
      setPage(nextPage);
    } catch (error) {
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Update recent searches
  const updateRecentSearches = (term) => {
    if (!term.trim()) return;
    const newRecent = [term, ...recentSearches.filter(t => t !== term)].slice(0, 7);
    setRecentSearches(newRecent);
    localStorage.setItem('adultRecentSearches', JSON.stringify(newRecent));
  };

  // Show suggestions on input focus
  const handleInputFocus = () => setShowSuggestions(true);
  const handleInputBlur = () => setTimeout(() => setShowSuggestions(false), 120);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    debouncedSearch(suggestion);
    updateRecentSearches(suggestion);
    setShowSuggestions(false);
  };

  // Handle search input changes (with suggestions)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
  };

  // Keyboard navigation for suggestions
  const handleInputKeyDown = (e) => {
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      setActiveSuggestion((prev) => Math.min(prev + 1, recentSearches.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      handleSuggestionClick(recentSearches[activeSuggestion]);
    }
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

  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('adultFilters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem('adultSortBy', sortBy);
  }, [sortBy]);

  // Apply filters and sorting to results
  const applyFiltersAndSort = (results) => {
    let filtered = [...results];

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(video => {
        const categories = video.categories || [];
        if (filters.category === 'straight') {
          return !categories.includes('gay') && !categories.includes('lesbian');
        }
        return categories.includes(filters.category);
      });
    }

    // Apply duration filter using durationSeconds
    if (filters.duration) {
      filtered = filtered.filter(video => {
        const duration = video.durationSeconds || 0;
        switch (filters.duration) {
          case 'short':
            return duration < 600; // < 10 minutes
          case 'medium':
            return duration >= 600 && duration <= 1800; // 10-30 minutes
          case 'long':
            return duration > 1800; // > 30 minutes
          default:
            return true;
        }
      });
    }

    // Apply quality filter
    if (filters.quality) {
      filtered = filtered.filter(video => {
        const quality = video.quality?.toLowerCase() || '';
        if (filters.quality === 'hd') {
          return quality.includes('hd') || quality.includes('1080p') || quality.includes('720p');
        }
        if (filters.quality === 'sd') {
          return quality.includes('sd') || quality.includes('480p');
        }
        return true;
      });
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(video => {
        const rating = parseFloat(video.rating) || 0;
        switch (filters.rating) {
          case 'high':
            return rating >= 4.5;
          case 'medium':
            return rating >= 3.5 && rating < 4.5;
          case 'low':
            return rating < 3.5;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'views':
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
        break;
      case 'relevance':
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  };

  // Update the filtered results whenever filters or sort changes
  const filteredResults = useMemo(() => {
    return applyFiltersAndSort(searchResults);
  }, [searchResults, filters, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({ category: '', duration: '', quality: '', rating: '' });
    setSortBy('relevance');
    toast.info('Filters cleared');
  };

  // Advanced filters and sorting UI
  const renderFilters = () => {
    const hasActiveFilters = filters.category || filters.duration || filters.quality || filters.rating || sortBy !== 'relevance';
    
    return (
      <div className="filters-section">
        <div className="filters-group">
          <select 
            value={filters.category} 
            onChange={e => {
              setFilters(f => ({ ...f, category: e.target.value }));
              toast.info(`Category filter: ${e.target.value || 'All'}`);
            }}
            className={filters.category ? 'active' : ''}
          >
            <option value="">All Categories</option>
            <option value="straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="lesbian">Lesbian</option>
          </select>

          <select 
            value={filters.duration} 
            onChange={e => {
              setFilters(f => ({ ...f, duration: e.target.value }));
              toast.info(`Duration filter: ${e.target.value || 'All'}`);
            }}
            className={filters.duration ? 'active' : ''}
          >
            <option value="">All Durations</option>
            <option value="short">Short (&lt;10m)</option>
            <option value="medium">Medium (10-30m)</option>
            <option value="long">Long (&gt;30m)</option>
          </select>

          <select 
            value={filters.quality} 
            onChange={e => {
              setFilters(f => ({ ...f, quality: e.target.value }));
              toast.info(`Quality filter: ${e.target.value || 'All'}`);
            }}
            className={filters.quality ? 'active' : ''}
          >
            <option value="">All Qualities</option>
            <option value="hd">HD</option>
            <option value="sd">SD</option>
          </select>

          <select 
            value={filters.rating} 
            onChange={e => {
              setFilters(f => ({ ...f, rating: e.target.value }));
              toast.info(`Rating filter: ${e.target.value || 'All'}`);
            }}
            className={filters.rating ? 'active' : ''}
          >
            <option value="">All Ratings</option>
            <option value="high">High (4.5+)</option>
            <option value="medium">Medium (3.5-4.5)</option>
            <option value="low">Low (&lt;3.5)</option>
          </select>

          <select 
            value={sortBy} 
            onChange={e => {
              setSortBy(e.target.value);
              toast.info(`Sorting by: ${e.target.value}`);
            }}
            className={sortBy !== 'relevance' ? 'active' : ''}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="views">Most Viewed</option>
            <option value="rating">Top Rated</option>
            <option value="duration">Longest</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button 
            className="clear-filters" 
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}

        {hasActiveFilters && (
          <div className="active-filters-info">
            {filteredResults.length} results found
          </div>
        )}
      </div>
    );
  };

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
    <div className="no-results">
      No results found. Try a different search or adjust your filters.
    </div>
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const idx = tabOrder.indexOf(tab);
        if (e.key === 'ArrowLeft' && idx > 0) setTab(tabOrder[idx - 1]);
        if (e.key === 'ArrowRight' && idx < tabOrder.length - 1) setTab(tabOrder[idx + 1]);
      }
      if (['1','2','3','4'].includes(e.key)) {
        setTab(tabOrder[parseInt(e.key,10)-1]);
      }
      if (e.key === '/' && searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tab]);

  // Helper to get current list for modal navigation
  const getCurrentList = () => {
    if (tab === 'favorites') return favorites;
    if (tab === 'watchlist') return watchlist;
    if (tab === 'history') return history;
    return searchResults;
  };
  const currentList = getCurrentList();
  const currentIdx = selectedVideo ? currentList.findIndex(v => v.id === selectedVideo.id) : -1;
  const handlePrevVideo = () => {
    if (currentIdx > 0) setSelectedVideo(currentList[currentIdx - 1]);
  };
  const handleNextVideo = () => {
    if (currentIdx < currentList.length - 1) setSelectedVideo(currentList[currentIdx + 1]);
  };

  // Fetch trending videos on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch(
          `${EPORNER_BASE_URL}/search/?per_page=20&page=1&thumbsize=medium&order=top-rated&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
        );
        const data = await res.json();
        setTrendingResults(data.videos.map(video => ({
          id: video.id,
          title: video.title,
          thumbnail: video.default_thumb.src,
          duration: video.duration,
          views: video.views,
          rating: video.rating,
          source: 'eporner',
          embedUrl: `https://www.eporner.com/embed/${video.id}`,
          directUrl: `https://www.eporner.com/video/${video.id}`,
          category: video.categories && video.categories.length > 0 ? video.categories[0] : ''
        })));
      } catch {}
    };
    fetchTrending();
  }, []);

  // Extract unique categories from results
  const allCategories = Array.from(new Set([
    ...searchResults,
    ...trendingResults
  ].flatMap(v => v.category ? [v.category] : [])).values());

  // Filtered results by category
  const filteredResultsByCategory = categoryFilter
    ? searchResults.filter(v => v.category === categoryFilter)
    : searchResults;

  // Recommended for You: videos with categories/tags from history/favorites
  const userCategories = Array.from(new Set([
    ...history,
    ...favorites
  ].flatMap(v => v.category ? [v.category] : [])).values());
  const recommendedResults = searchResults.filter(v => userCategories.includes(v.category));

  // Save playlists and download queue to localStorage
  useEffect(() => { localStorage.setItem('adultPlaylists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => { localStorage.setItem('adultDownloadQueue', JSON.stringify(downloadQueue)); }, [downloadQueue]);

  // Playlist management
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim() || playlists[newPlaylistName]) return;
    setPlaylists(prev => ({ ...prev, [newPlaylistName]: [] }));
    setNewPlaylistName('');
  };
  const handleDeletePlaylist = (name) => {
    const updated = { ...playlists };
    delete updated[name];
    setPlaylists(updated);
    if (activePlaylist === name) setActivePlaylist('');
  };
  const handleRenamePlaylist = (oldName, newName) => {
    if (!newName.trim() || playlists[newName]) return;
    const updated = { ...playlists, [newName]: playlists[oldName] };
    delete updated[oldName];
    setPlaylists(updated);
    if (activePlaylist === oldName) setActivePlaylist(newName);
  };
  const handleAddToPlaylist = (playlist, video) => {
    setPlaylists(prev => ({ ...prev, [playlist]: [video, ...prev[playlist].filter(v => v.id !== video.id)] }));
  };
  const handleRemoveFromPlaylist = (playlist, video) => {
    setPlaylists(prev => ({ ...prev, [playlist]: prev[playlist].filter(v => v.id !== video.id) }));
  };
  // Download queue management
  const handleQueueDownload = (video) => {
    setDownloadQueue(prev => [video, ...prev.filter(v => v.id !== video.id)]);
  };
  const handleRemoveFromDownloadQueue = (video) => {
    setDownloadQueue(prev => prev.filter(v => v.id !== video.id));
  };

  return (
    <div
      className="adult-search-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="search-bar" style={{position:'relative'}}>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="Search adult videos..."
          className="search-input"
          aria-label="Search adult videos"
          disabled={loading}
        />
        <FaSearch className="search-icon" />
        {showSuggestions && recentSearches.length > 0 && (
          <div className="search-suggestions fade-slide">
            {recentSearches.map((s, i) => (
              <div
                key={s}
                className={`suggestion-item${i === activeSuggestion ? ' active' : ''}`}
                onMouseDown={() => handleSuggestionClick(s)}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      {renderFilters()}
      <div className="tabs">
        <button className={tab==='all' ? 'active' : ''} onClick={()=>setTab('all')}>All</button>
        <button className={tab==='favorites' ? 'active' : ''} onClick={()=>setTab('favorites')}>Favorites</button>
        <button className={tab==='watchlist' ? 'active' : ''} onClick={()=>setTab('watchlist')}>Watchlist</button>
        <button className={tab==='history' ? 'active' : ''} onClick={()=>setTab('history')}>Recently Watched</button>
        <button className={tab==='playlists' ? 'active' : ''} onClick={()=>setTab('playlists')}>Playlists</button>
        <button className={tab==='downloads' ? 'active' : ''} onClick={()=>setTab('downloads')}>Download Queue</button>
      </div>
      {tab==='all' && allCategories.length > 1 && (
        <div className="category-filter-bar">
          <button
            className={!categoryFilter ? 'active' : ''}
            onClick={()=>setCategoryFilter('')}
          >All</button>
          {allCategories.map(cat => (
            <button
              key={cat}
              className={categoryFilter===cat ? 'active' : ''}
              onClick={()=>setCategoryFilter(cat)}
            >{cat}</button>
          ))}
        </div>
      )}
      {tab==='all' && (loading
        ? renderSkeletons()
        : filteredResults.length > 0
          ? <ResultsGrid 
              searchResults={filteredResults} 
              onVideoSelect={handleVideoSelect} 
              favorites={favorites.map(f => f.id)} 
              onToggleFavorite={handleToggleFavorite} 
              watchlist={watchlist.map(w => w.id)} 
              onToggleWatchlist={handleToggleWatchlist} 
            />
          : renderEmptyState()
      )}
      {tab==='favorites' && <ResultsGrid searchResults={favorites} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {tab==='watchlist' && <ResultsGrid searchResults={watchlist} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {tab==='history' && <ResultsGrid searchResults={history} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />}
      {tab==='all' && recommendedResults.length > 0 && (
        <div className="recommended-section fade-slide">
          <h3>Recommended for You</h3>
          <ResultsGrid searchResults={recommendedResults} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />
        </div>
      )}
      {tab==='trending' && (
        <div className="fade-slide">
          <ResultsGrid searchResults={trendingResults} onVideoSelect={handleVideoSelect} favorites={favorites.map(f => f.id)} onToggleFavorite={handleToggleFavorite} watchlist={watchlist.map(w => w.id)} onToggleWatchlist={handleToggleWatchlist} />
        </div>
      )}
      {tab==='playlists' && (
        <div className="fade-slide">
          <div className="playlists-panel">
            <div className="playlist-controls">
              <input
                type="text"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)}
                placeholder="New playlist name"
              />
              <button onClick={handleCreatePlaylist}>Create</button>
            </div>
            <div className="playlist-list">
              {Object.keys(playlists).map(name => (
                <div key={name} className={`playlist-item${activePlaylist===name?' active':''}`}> 
                  <span onClick={()=>setActivePlaylist(name)}>{name}</span>
                  <button onClick={()=>handleDeletePlaylist(name)} aria-label="Delete playlist">🗑️</button>
                  <button onClick={()=>{
                    const newName = prompt('Rename playlist:', name);
                    if (newName && newName !== name) handleRenamePlaylist(name, newName);
                  }} aria-label="Rename playlist">✏️</button>
                </div>
              ))}
            </div>
            {activePlaylist && (
              <div className="playlist-videos">
                <h4>{activePlaylist}</h4>
                <ResultsGrid
                  searchResults={playlists[activePlaylist]}
                  onVideoSelect={handleVideoSelect}
                  favorites={favorites.map(f => f.id)}
                  onToggleFavorite={handleToggleFavorite}
                  watchlist={watchlist.map(w => w.id)}
                  onToggleWatchlist={handleToggleWatchlist}
                  onAddToPlaylist={video => handleAddToPlaylist(activePlaylist, video)}
                  onRemoveFromPlaylist={video => handleRemoveFromPlaylist(activePlaylist, video)}
                  playlistMode={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {tab==='downloads' && (
        <div className="fade-slide">
          <div className="download-queue-panel">
            <h4>Download Queue</h4>
            <ResultsGrid
              searchResults={downloadQueue}
              onVideoSelect={handleVideoSelect}
              favorites={favorites.map(f => f.id)}
              onToggleFavorite={handleToggleFavorite}
              watchlist={watchlist.map(w => w.id)}
              onToggleWatchlist={handleToggleWatchlist}
              onRemoveFromDownloadQueue={handleRemoveFromDownloadQueue}
              downloadQueueMode={true}
            />
          </div>
        </div>
      )}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          sources={sources}
          onClose={() => setSelectedVideo(null)}
          onPrev={handlePrevVideo}
          onNext={handleNextVideo}
          showPrev={currentIdx > 0}
          showNext={currentIdx < currentList.length - 1}
        />
      )}
      {isFetchingMore && <div style={{textAlign:'center',color:'#ff3333',margin:'20px'}}>Loading more...</div>}
    </div>
  );
};

export default AdultSearchBar; 