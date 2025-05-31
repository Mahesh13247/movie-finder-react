import { useState, useEffect, useRef } from 'react';
import debounce from 'lodash.debounce';
import { FaSearch, FaPlay, FaExternalLinkAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdultSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sources, setSources] = useState([]);
  const searchTimeout = useRef(null);

  // API endpoints and keys
  const EPORNER_API_KEY = import.meta.env.VITE_EPORNER_API_KEY;
  const EPORNER_BASE_URL = 'https://www.eporner.com/api/v2/video';

  // Debounced search function
  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Search eporner API
      const epornerResponse = await fetch(
        `${EPORNER_BASE_URL}/search/?query=${encodeURIComponent(query)}&per_page=20&page=1&thumbsize=medium&order=top-weekly&gay=0&lq=1&format=json&key=${EPORNER_API_KEY}`
      );
      const epornerData = await epornerResponse.json();

      // Process and combine results
      const processedResults = epornerData.videos.map(video => ({
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

      setSearchResults(processedResults);
    } catch (error) {
      console.error('Error searching videos:', error);
      toast.error('Error searching videos. Please try again.');
    } finally {
      setLoading(false);
    }
  }, 500);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Handle video selection
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    // Fetch additional sources for the selected video
    fetchAdditionalSources(video.title);
  };

  // Fetch additional sources for a video
  const fetchAdditionalSources = async (title) => {
    try {
      // Add more source fetching logic here
      const additionalSources = [
        {
          name: 'VidSrc',
          url: `https://vidsrc.to/embed/movie/${title}`,
          type: 'embed'
        },
        {
          name: 'FlixHQ',
          url: `https://flixhq.to/embed/${title}`,
          type: 'embed'
        }
      ];
      setSources(additionalSources);
    } catch (error) {
      console.error('Error fetching additional sources:', error);
    }
  };

  return (
    <div className="adult-search-container">
      <div className="search-bar">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search adult videos..."
          className="search-input"
        />
        <FaSearch className="search-icon" />
      </div>

      {loading && (
        <div className="loading-indicator">
          Searching...
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="result-card"
              onClick={() => handleVideoSelect(result)}
            >
              <img
                src={result.thumbnail}
                alt={result.title}
                className="result-thumbnail"
              />
              <div className="result-info">
                <h3>{result.title}</h3>
                <div className="result-meta">
                  <span>{result.duration}</span>
                  <span>{result.views} views</span>
                  <span>
                    <FaStar /> {result.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedVideo && (
        <div className="video-player-modal">
          <div className="modal-content">
            <h2>{selectedVideo.title}</h2>
            <div className="video-sources">
              <iframe
                src={selectedVideo.embedUrl}
                title={selectedVideo.title}
                allowFullScreen
                className="video-iframe"
              />
              <div className="additional-sources">
                <h3>Additional Sources</h3>
                {sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    <FaExternalLinkAlt /> {source.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdultSearchBar; 