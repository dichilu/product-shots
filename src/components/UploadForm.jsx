import React, { useCallback, useRef, useState } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t } from '../utils/i18n.js';
import { fileToBase64 } from '../utils/gemini.js';

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];

export default function UploadForm({ onGenerate }) {
  const { state, dispatch } = useApp();
  const lang = state.lang;

  const modelInputRef = useRef(null);
  const productInputRef = useRef(null);
  const [modelDrag, setModelDrag] = useState(false);
  const [productDrag, setProductDrag] = useState(false);

  const handleFile = useCallback(async (file, type) => {
    if (!file || !file.type.startsWith('image/')) return;
    const data = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    dispatch({
      type: type === 'model' ? 'SET_MODEL_IMAGE' : 'SET_PRODUCT_IMAGE',
      payload: { file, preview, base64: data.base64, mimeType: data.mimeType },
    });
  }, [dispatch]);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    type === 'model' ? setModelDrag(false) : setProductDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file, type);
  }, [handleFile]);

  const handleDragOver = (e, type) => {
    e.preventDefault();
    type === 'model' ? setModelDrag(true) : setProductDrag(true);
  };

  const handleDragLeave = (e, type) => {
    type === 'model' ? setModelDrag(false) : setProductDrag(false);
  };

  const isReady = state.productImage;

  return (
    <div>
      {/* Image Uploads */}
      <div className="upload-grid">
        {/* Model Upload */}
        <div
          className={`upload-zone ${state.modelImage ? 'has-image' : ''} ${modelDrag ? 'drag-over' : ''}`}
          onClick={() => modelInputRef.current?.click()}
          onDrop={(e) => handleDrop(e, 'model')}
          onDragOver={(e) => handleDragOver(e, 'model')}
          onDragLeave={(e) => handleDragLeave(e, 'model')}
        >
          <input
            ref={modelInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0], 'model')}
          />
          {state.modelImage ? (
            <>
              <img src={state.modelImage.preview} alt="Model" className="upload-preview" />
              <button className="upload-change" onClick={(e) => { e.stopPropagation(); modelInputRef.current?.click(); }}>
                {t(lang, 'upload.changeImage')}
              </button>
            </>
          ) : (
            <>
              <div className="upload-icon">👤</div>
              <div className="upload-label">{t(lang, 'upload.modelTitle')}</div>
              <div className="upload-hint">{t(lang, 'upload.modelDesc')}</div>
              <div className="upload-hint" style={{ marginTop: '0.25rem' }}>{t(lang, 'upload.dropHint')}</div>
            </>
          )}
        </div>

        {/* Product Upload */}
        <div
          className={`upload-zone ${state.productImage ? 'has-image' : ''} ${productDrag ? 'drag-over' : ''}`}
          onClick={() => productInputRef.current?.click()}
          onDrop={(e) => handleDrop(e, 'product')}
          onDragOver={(e) => handleDragOver(e, 'product')}
          onDragLeave={(e) => handleDragLeave(e, 'product')}
        >
          <input
            ref={productInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files[0], 'product')}
          />
          {state.productImage ? (
            <>
              <img src={state.productImage.preview} alt="Product" className="upload-preview" />
              <button className="upload-change" onClick={(e) => { e.stopPropagation(); productInputRef.current?.click(); }}>
                {t(lang, 'upload.changeImage')}
              </button>
            </>
          ) : (
            <>
              <div className="upload-icon">🛍️</div>
              <div className="upload-label">{t(lang, 'upload.productTitle')}</div>
              <div className="upload-hint">{t(lang, 'upload.productDesc')}</div>
              <div className="upload-hint" style={{ marginTop: '0.25rem' }}>{t(lang, 'upload.dropHint')}</div>
            </>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">{t(lang, 'form.locationLabel')}</label>
          <input
            className="form-input"
            placeholder={t(lang, 'form.locationPlaceholder')}
            value={state.location}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'location', value: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t(lang, 'form.seasonLabel')}</label>
          <input
            className="form-input"
            placeholder={t(lang, 'form.seasonPlaceholder')}
            value={state.season}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'season', value: e.target.value })}
          />
        </div>

        <div className="form-group full">
          <label className="form-label">{t(lang, 'form.emphasisLabel')}</label>
          <textarea
            className="form-textarea"
            placeholder={t(lang, 'form.emphasisPlaceholder')}
            value={state.emphasis}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'emphasis', value: e.target.value })}
          />
        </div>

        {/* Type */}
        <div className="form-group">
          <label className="form-label">{t(lang, 'form.typeLabel')}</label>
          <div className="type-toggle">
            <button
              className={`type-btn ${state.type === 'model' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'type', value: 'model' })}
            >
              {t(lang, 'form.typeModel')}
            </button>
            <button
              className={`type-btn ${state.type === 'product' ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_FIELD', field: 'type', value: 'product' })}
            >
              {t(lang, 'form.typeProduct')}
            </button>
          </div>
        </div>

        {/* Count */}
        <div className="form-group">
          <label className="form-label">{t(lang, 'form.countLabel')}</label>
          <div className="count-selector">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                className={`count-btn ${state.count === n ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'count', value: n })}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="form-group full">
          <label className="form-label">{t(lang, 'form.aspectLabel')}</label>
          <div className="aspect-pills">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                className={`aspect-pill ${state.aspectRatio === ar ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_FIELD', field: 'aspectRatio', value: ar })}
              >
                {t(lang, `aspects.${ar}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        className="btn-generate"
        disabled={!isReady}
        onClick={onGenerate}
      >
        {t(lang, 'form.generate')}
      </button>
    </div>
  );
}
