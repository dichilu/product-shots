import React from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t } from '../utils/i18n.js';
import { base64ToDataUrl } from '../utils/gemini.js';

export default function EditModal({ onSubmit, onClose }) {
  const { state, dispatch } = useApp();
  const { lang, editingImage, editInstruction, isEditing, generatedImages } = state;

  if (editingImage === null || !generatedImages[editingImage]) return null;

  const img = generatedImages[editingImage];
  const imgSrc = base64ToDataUrl(img.imageData.data, img.imageData.mimeType);

  const handleSubmit = () => {
    if (!editInstruction.trim()) return;
    onSubmit(editingImage, editInstruction);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{t(lang, 'edit.title')}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <img src={imgSrc} alt="Original" className="modal-image" />

          <div className="form-group">
            <label className="form-label">{t(lang, 'edit.instruction')}</label>
            <textarea
              className="form-textarea"
              placeholder={t(lang, 'edit.instructionPlaceholder')}
              value={editInstruction}
              onChange={(e) => dispatch({ type: 'SET_EDIT_INSTRUCTION', payload: e.target.value })}
              disabled={isEditing}
              rows={4}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isEditing}>
            {t(lang, 'edit.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isEditing || !editInstruction.trim()}
          >
            {isEditing ? (
              <>
                <span className="spinner" />
                {t(lang, 'edit.submitting')}
              </>
            ) : (
              t(lang, 'edit.submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
