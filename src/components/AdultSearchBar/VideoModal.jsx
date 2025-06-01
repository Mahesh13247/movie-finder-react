import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

const VideoModal = ({ video, sources, onClose }) => (
  <div className="video-player-modal">
    <div className="modal-content">
      <button className="close-button" onClick={onClose} aria-label="Close video modal">✕</button>
      <h2>{video.title}</h2>
      <div className="video-sources">
        <iframe
          src={video.embedUrl}
          title={video.title}
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
);

export default VideoModal; 