import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  FaStar,
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaDownload,
  FaFlag,
  FaClock,
  FaEye,
  FaCog,
  FaCheck,
  FaPlay,
  FaChevronRight,
  FaStarHalfAlt,
  FaRegStar,
  FaVolumeMute,
  FaVolumeUp,
  FaEllipsisH,
  FaList,
  FaComment,
  FaTag,
  FaBookmark,
  FaShare,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaTelegram,
  FaCalendarAlt,
  FaUser,
  FaLanguage,
  FaClosedCaptioning,
  FaDownload as FaDownloadIcon,
  FaHistory,
  FaRandom,
  FaChevronLeft,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ResultsGrid = ({
  searchResults = [],
  onVideoSelect,
  favorites = [],
  onToggleFavorite,
  watchlist = [],
  onToggleWatchlist,
}) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [showShare, setShowShare] = useState(null);
  const [showQuality, setShowQuality] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isMuted, setIsMuted] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(null);
  const [showVideoInfo, setShowVideoInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const calculatedTotalPages = Math.ceil(searchResults.length / itemsPerPage);
    setTotalPages(calculatedTotalPages);

    setCurrentPage(1);
  }, [searchResults, itemsPerPage]);

  const handleQualitySelect = (resultId, quality) => {
    setShowQuality(null);
    setDownloadProgress((prev) => ({ ...prev, [resultId]: 0 }));

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setDownloadProgress((prev) => ({ ...prev, [resultId]: progress }));

      if (progress >= 100) {
        clearInterval(interval);
        onQualitySelect(resultId, quality);
        toast.success(`Downloading ${quality} quality video...`);
      }
    }, 200);
  };

  const handleMuteToggle = (resultId) => {
    setIsMuted((prev) => ({ ...prev, [resultId]: !prev[resultId] }));
  };

  const handleShare = (resultId, platform) => {
    setShowShare(null);
    onShare(resultId, platform);
  };

  const getSimilarVideos = (currentVideo) => {
    return searchResults
      .filter(
        (video) =>
          video.id !== currentVideo.id &&
          video.category === currentVideo.category
      )
      .slice(0, 3);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" className="text-yellow-400" />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar key={`empty-star-${i}`} className="text-yellow-400" />
      );
    }

    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setCurrentPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 500);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <FaAngleDoubleLeft />
        </button>
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <FaChevronLeft />
        </button>

        {startPage > 1 && (
          <>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className="pagination-ellipsis">...</span>}
          </>
        )}

        {pageNumbers.map((number) => (
          <button
            key={number}
            className={`pagination-btn ${
              currentPage === number ? "active" : ""
            }`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          className="pagination-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <FaChevronRight />
        </button>
        <button
          className="pagination-btn"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    );
  };

  return (
    <div className="search-results-container">
      <div className="search-results">
        {currentResults.map((result) => (
          <div
            key={result.id}
            className="result-card"
            onMouseEnter={() => setHoveredId(result.id)}
            onMouseLeave={() => {
              setHoveredId(null);
              setShowShare(null);
              setShowQuality(null);
              setShowQuickActions(null);
              setShowSuggestions(null);
              setShowVideoInfo(null);
            }}
            onClick={() => onVideoSelect(result)}
          >
            <div className="video-preview-container">
              <img
                src={result.thumbnail}
                alt={result.title}
                className="result-thumbnail"
              />
              <div className="quality-indicator">{result.quality || "HD"}</div>
              <div className="video-overlay">
                <button
                  className="mute-toggle-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMuteToggle(result.id);
                  }}
                >
                  {isMuted[result.id] ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                {hoveredId === result.id && (
                  <div className="play-overlay">
                    <FaPlay size={24} />
                  </div>
                )}
                <div className="video-duration">
                  <FaClock /> {result.duration || "00:00"}
                </div>
              </div>
            </div>

            <div className="result-info">
              <h3>{result.title}</h3>

              <div className="video-stats">
                <div className="stat-item">
                  <FaEye />
                  <span>{(result.views || 0).toLocaleString()} views</span>
                </div>
                <div className="stat-item">
                  <FaHeart />
                  <span>{(result.likes || 0).toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <FaComment />
                  <span>{(result.comments || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="result-meta">
                <div className="meta-item">
                  <FaCalendarAlt />
                  <span>{formatDate(result.uploadDate)}</span>
                </div>
                <div className="meta-item">
                  <FaStar />
                  <span>{(result.rating || 0).toFixed(1)}</span>
                </div>
                <div className="badge-tag">
                  <FaTag />
                  <span>{result.category || "Uncategorized"}</span>
                </div>
              </div>

              <div className="video-details">
                <div className="detail-item">
                  <FaLanguage />
                  <span>{result.language || "Unknown"}</span>
                </div>
                <div className="detail-item">
                  <FaClosedCaptioning />
                  <span>
                    {result.subtitles ? "Subtitles Available" : "No Subtitles"}
                  </span>
                </div>
                <div className="detail-item">
                  <FaUser />
                  <span>{result.uploader || "Unknown Uploader"}</span>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(result.id);
                  }}
                  title={
                    favorites.includes(result.id)
                      ? "Remove from Favorites"
                      : "Add to Favorites"
                  }
                >
                  {favorites.includes(result.id) ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(result.id);
                  }}
                  title={
                    watchlist.includes(result.id)
                      ? "Remove from Watchlist"
                      : "Add to Watchlist"
                  }
                >
                  <FaBookmark />
                </button>

                <div className="quality-selector">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQuality(
                        showQuality === result.id ? null : result.id
                      );
                    }}
                    title="Download Options"
                  >
                    <FaDownloadIcon />
                  </button>
                  {showQuality === result.id && (
                    <div className="quality-menu">
                      {["4K", "1080p", "720p", "480p"].map((quality) => (
                        <button
                          key={quality}
                          className="quality-option"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQualitySelect(result.id, quality);
                          }}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="share-container">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShare(showShare === result.id ? null : result.id);
                    }}
                    title="Share Video"
                  >
                    <FaShare />
                  </button>
                  {showShare === result.id && (
                    <div className="share-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(result.id, "facebook");
                        }}
                      >
                        <FaFacebook /> Share on Facebook
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(result.id, "twitter");
                        }}
                      >
                        <FaTwitter /> Share on Twitter
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(result.id, "whatsapp");
                        }}
                      >
                        <FaWhatsapp /> Share on WhatsApp
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(result.id, "telegram");
                        }}
                      >
                        <FaTelegram /> Share on Telegram
                      </button>
                    </div>
                  )}
                </div>

                <div className="quick-actions-container">
                  <button
                    className="action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQuickActions(
                        showQuickActions === result.id ? null : result.id
                      );
                    }}
                    title="More Options"
                  >
                    <FaEllipsisH />
                  </button>
                  {showQuickActions === result.id && (
                    <div className="quick-actions-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVideoInfo(result.id);
                        }}
                      >
                        <FaInfoCircle /> Video Info
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSuggestions(result.id);
                        }}
                      >
                        <FaRandom /> Similar Videos
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReport(result.id);
                        }}
                      >
                        <FaFlag /> Report
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {downloadProgress[result.id] > 0 && (
                <div className="download-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${downloadProgress[result.id]}%` }}
                  />
                </div>
              )}

              {showVideoInfo === result.id && (
                <div className="video-info-panel">
                  <h4>Video Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <FaCalendarAlt />
                      <span>Upload Date: {formatDate(result.uploadDate)}</span>
                    </div>
                    <div className="info-item">
                      <FaUser />
                      <span>Uploader: {result.uploader || "Unknown"}</span>
                    </div>
                    <div className="info-item">
                      <FaLanguage />
                      <span>Language: {result.language || "Unknown"}</span>
                    </div>
                    <div className="info-item">
                      <FaClosedCaptioning />
                      <span>
                        Subtitles:{" "}
                        {result.subtitles ? "Available" : "Not Available"}
                      </span>
                    </div>
                    <div className="info-item">
                      <FaHistory />
                      <span>
                        Last Updated: {formatDate(result.lastUpdated)}
                      </span>
                    </div>
                    <div className="info-item">
                      <FaTag />
                      <span>Tags: {result.tags?.join(", ") || "No tags"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showSuggestions === result.id && (
              <div className="video-suggestions">
                <div className="suggestions-header">
                  <h4>Similar Videos</h4>
                  <FaChevronRight />
                </div>
                <div className="suggestions-grid">
                  {getSimilarVideos(result).map((video) => (
                    <div
                      key={video.id}
                      className="suggestion-card"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVideoSelect(video);
                      }}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="suggestion-thumbnail"
                      />
                      <div className="suggestion-info">
                        <div className="suggestion-title">{video.title}</div>
                        <div className="suggestion-meta">
                          <FaClock /> {video.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-section">
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)}{" "}
            of {searchResults.length} results
          </div>
          {renderPagination()}

          {currentPage < totalPages && (
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <span className="loading-spinner">Loading...</span>
              ) : (
                <>
                  Load More
                  <FaChevronRight className="load-more-icon" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

ResultsGrid.propTypes = {
  searchResults: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      thumbnail: PropTypes.string.isRequired,
      duration: PropTypes.string,
      views: PropTypes.number,
      rating: PropTypes.number,
      category: PropTypes.string,
      quality: PropTypes.arrayOf(PropTypes.string),
      tags: PropTypes.arrayOf(PropTypes.string),
      uploadDate: PropTypes.string,
      lastUpdated: PropTypes.string,
      language: PropTypes.string,
      subtitles: PropTypes.bool,
      uploader: PropTypes.string,
      stats: PropTypes.shape({
        views: PropTypes.number,
        likes: PropTypes.number,
        comments: PropTypes.number,
      }),
    })
  ),
  onVideoSelect: PropTypes.func,
  favorites: PropTypes.arrayOf(PropTypes.string),
  onToggleFavorite: PropTypes.func,
  watchlist: PropTypes.arrayOf(PropTypes.string),
  onToggleWatchlist: PropTypes.func,
};

ResultsGrid.defaultProps = {
  searchResults: [],
  onVideoSelect: () => {},
  favorites: [],
  onToggleFavorite: () => {},
  watchlist: [],
  onToggleWatchlist: () => {},
};

export default ResultsGrid;
