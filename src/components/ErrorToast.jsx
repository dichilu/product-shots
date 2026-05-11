import React from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t } from '../utils/i18n.js';

export default function ErrorToast() {
  const { state, dispatch } = useApp();
  if (!state.error) return null;

  return (
    <div className="error-toast" role="alert">
      <span>⚠️ {state.error}</span>
      <button className="error-toast-close" onClick={() => dispatch({ type: 'CLEAR_ERROR' })}>✕</button>
    </div>
  );
}
