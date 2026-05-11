import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t } from '../utils/i18n.js';

const AGENT_STEPS = ['creativeDirector', 'promptEngineer', 'photographer', 'qualityInspector', 'complete'];

export default function ProgressTracker({ onCancel }) {
  const { state } = useApp();
  const { lang } = state;
  const { currentAgent, percent, currentPhoto, totalPhotos } = state.progress;

  const currentIndex = AGENT_STEPS.indexOf(currentAgent);

  const overallPercent = useMemo(() => {
    // Each agent is 25% of total progress
    const agentWeight = { creativeDirector: 0, promptEngineer: 1, photographer: 2, qualityInspector: 3, complete: 4 };
    const w = agentWeight[currentAgent] ?? 0;
    const agentProgress = percent / 100;
    return Math.min(Math.round(((w + agentProgress) / 4) * 100), 100);
  }, [currentAgent, percent]);

  const agentMessage = useMemo(() => {
    switch (currentAgent) {
      case 'creativeDirector': return t(lang, 'progress.creativeDirector');
      case 'promptEngineer': return t(lang, 'progress.promptEngineer');
      case 'photographer': return t(lang, 'progress.photographer', { n: currentPhoto });
      case 'qualityInspector': return t(lang, 'progress.qualityInspector');
      case 'complete': return t(lang, 'progress.complete');
      default: return '';
    }
  }, [currentAgent, currentPhoto, lang]);

  return (
    <div className="progress-section">
      <h2 className="progress-title">{t(lang, 'progress.title')}</h2>

      <div className="progress-percent">{overallPercent}%</div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} />
      </div>

      <div className="progress-agent">{agentMessage}</div>

      <div className="progress-steps">
        {AGENT_STEPS.slice(0, -1).map((step, i) => {
          const isDone = currentIndex > i || currentAgent === 'complete';
          const isActive = currentIndex === i;
          return (
            <div key={step} className={`progress-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="progress-step-dot" />
              <span>
                {t(lang, `progress.${step}`)}
              </span>
            </div>
          );
        })}
      </div>

      {currentAgent !== 'complete' && (
        <button className="btn-cancel" onClick={onCancel}>
          {t(lang, 'progress.cancel')}
        </button>
      )}
    </div>
  );
}
