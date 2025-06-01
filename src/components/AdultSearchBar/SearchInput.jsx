import React from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchInput = ({ searchQuery, onSearchChange, loading }) => (
  <div className="search-bar">
    <input
      type="text"
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Search adult videos..."
      className="search-input"
      aria-label="Search adult videos"
      disabled={loading}
    />
    <FaSearch className="search-icon" />
  </div>
);

export default SearchInput; 