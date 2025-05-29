import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function MovieLists() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(()=>JSON.parse(localStorage.getItem('movieLists')||'[]'));
  const [newList, setNewList] = useState('');
  const addList = () => {
    if (!newList.trim()) return;
    const updated = [...lists, { name: newList, movies: [] }];
    setLists(updated);
    localStorage.setItem('movieLists', JSON.stringify(updated));
    setNewList('');
  };
  return (
    <div className="movie-lists">
      <h2>{t('movie_lists')}</h2>
      <input value={newList} onChange={e=>setNewList(e.target.value)} placeholder="New list name" />
      <button onClick={addList}>Add List</button>
      <ul>
        {lists.map((l,i)=>(<li key={i}>{l.name} ({l.movies.length} movies)</li>))}
      </ul>
    </div>
  );
}

export default MovieLists;
