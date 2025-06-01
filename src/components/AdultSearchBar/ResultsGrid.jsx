import React, { useState } from 'react';
import { FaStar, FaHeart, FaRegHeart, FaShareAlt, FaDownload, FaFlag } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ResultsGrid = ({ searchResults, onVideoSelect, favorites = [], onToggleFavorite, watchlist = [], onToggleWatchlist }) => {
  // Track which card is hovered for preview
  const [hoveredId, setHoveredId] = useState(null);

  // Share/copy handler
  const handleShare = (e, url) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  // Report handler
  const handleReport = (e, video) => {
    e.stopPropagation();
    toast.info('Reported. Thank you!');
    // Optionally, store report in localStorage or send to backend
  };

  return (
    <div className="search-results">
      {searchResults.map((result) => (
        <div
          key={result.id}
          className="result-card"
          onClick={() => onVideoSelect(result)}
          onMouseEnter={() => setHoveredId(result.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Video preview on hover */}
          {hoveredId === result.id && (result.preview || result.previewGif) ? (
            result.preview ? (
              <video
                src={result.preview}
                className="result-thumbnail"
                autoPlay
                loop
                muted
                playsInline
                poster={result.thumbnail}
              />
            ) : (
              <img
                src={result.previewGif}
                alt={result.title}
                className="result-thumbnail"
              />
            )
          ) : (
            <img
              src={result.thumbnail}
              alt={result.title}
              className="result-thumbnail"
            />
          )}
          {/* Tag/category badges placeholder */}
          <div className="badges-row">
            {result.category && <span className="badge">{result.category}</span>}
            {result.source && (
              <span className={`badge badge-source badge-source-${result.source}`}>
                {result.source === 'eporner' ? 'Eporner' : result.source === 'porndb' ? 'PORNDB' : result.source}
              </span>
            )}
            {/* Add more badges as needed */}
          </div>
          <div className="result-info">
            <h3>{result.title}</h3>
            <div className="result-meta">
              <span>{result.duration}</span>
              <span>{result.views} views</span>
              <span>
                <FaStar /> {result.rating}
              </span>
              {/* Favorite button */}
              <button
                className="favorite-btn"
                type="button"
                aria-label={favorites.includes(result.id) ? 'Remove from favorites' : 'Add to favorites'}
                onClick={e => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(result); }}
              >
                {favorites.includes(result.id) ? <FaHeart color="#ff3333" /> : <FaRegHeart />}
              </button>
              {/* Watchlist button */}
              <button
                className="watchlist-btn"
                type="button"
                aria-label={watchlist.includes(result.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                onClick={e => { e.stopPropagation(); onToggleWatchlist && onToggleWatchlist(result); }}
              >
                {watchlist.includes(result.id) ? <FaStar color="#ffd700" /> : <FaRegHeart />}
              </button>
              {/* Share/copy link button */}
              <button
                className="share-btn"
                type="button"
                aria-label="Copy video link"
                onClick={e => handleShare(e, result.directUrl)}
              >
                <FaShareAlt />
              </button>
              {/* Download button (if available) */}
              {result.downloadUrl && (
                <a
                  className="download-btn"
                  href={result.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download video"
                  onClick={e => e.stopPropagation()}
                >
                  <FaDownload />
                </a>
              )}
              {/* Report button */}
              <button
                className="report-btn"
                type="button"
                aria-label="Report content"
                onClick={e => handleReport(e, result)}
              >
                <FaFlag />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultsGrid; 