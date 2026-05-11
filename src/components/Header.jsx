import React from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t, LANGUAGES } from '../utils/i18n.js';

export default function Header() {
  const { state, dispatch } = useApp();

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">📸</div>
        <div>
          <div className="header-title">{t(state.lang, 'app.title')}</div>
          <div className="header-subtitle">{t(state.lang, 'app.subtitle')}</div>
        </div>
      </div>
      <div className="header-actions">
        <div className="lang-switch">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${state.lang === l.code ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_LANG', payload: l.code })}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
