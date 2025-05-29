import React from 'react';
import { useTranslation } from 'react-i18next';

function UserBadges() {
  const { t } = useTranslation();
  const badges = JSON.parse(localStorage.getItem('userBadges') || '[]');
  return (
    <div className="user-badges">
      <h2>{t('user_badges')}</h2>
      {badges.length === 0 ? <p>No badges yet.</p> : (
        <ul>
          {badges.map((b,i)=>(<li key={i}>{b}</li>))}
        </ul>
      )}
    </div>
  );
}

export default UserBadges;
