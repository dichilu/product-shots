import React, { useCallback, useMemo } from 'react';
import { useApp } from '../contexts/AppContext.jsx';
import { t } from '../utils/i18n.js';
import { base64ToDataUrl } from '../utils/gemini.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function getAspectValue(ratio) {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}

export default function ImageGallery({ onEdit, onRegenerate }) {
  const { state } = useApp();
  const { lang, generatedImages, aspectRatio } = state;

  const aspectValue = useMemo(() => getAspectValue(aspectRatio), [aspectRatio]);

  const handleDownloadSingle = useCallback(async (img, index) => {
    const ext = img.imageData.mimeType.includes('png') ? 'png' : 'jpg';
    const dataUrl = base64ToDataUrl(img.imageData.data, img.imageData.mimeType);
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `product-shot-${index + 1}.${ext}`);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip();
    generatedImages.forEach((img, i) => {
      const ext = img.imageData.mimeType.includes('png') ? 'png' : 'jpg';
      zip.file(`product-shot-${i + 1}.${ext}`, img.imageData.data, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'product-shots.zip');
  }, [generatedImages]);

  if (!generatedImages || generatedImages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {lang === 'zh' ? '沒有生成到任何圖片，請重試。' : 'No images were generated. Please try again.'}
        </p>
        <button className="btn btn-primary" onClick={onRegenerate}>
          {t(lang, 'gallery.regenerate')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="gallery-header">
        <h2 className="gallery-title">{t(lang, 'gallery.title')}</h2>
        <div className="gallery-actions">
          <button className="btn btn-secondary" onClick={onRegenerate}>
            🔄 {t(lang, 'gallery.regenerate')}
          </button>
          <button className="btn btn-primary" onClick={handleDownloadAll}>
            📦 {t(lang, 'gallery.downloadAll')}
          </button>
        </div>
      </div>

      <div className="gallery-grid">
        {generatedImages.map((img, i) => (
          <div
            key={i}
            className="gallery-item"
            style={{ '--gallery-aspect': aspectValue }}
          >
            <div className="gallery-item-img-wrap">
              <img
                className="gallery-item-img"
                src={base64ToDataUrl(img.imageData.data, img.imageData.mimeType)}
                alt={`Generated shot ${i + 1}`}
              />
              <div className="gallery-item-overlay">
                <button className="btn btn-primary btn-sm" onClick={() => handleDownloadSingle(img, i)}>
                  ⬇ {t(lang, 'gallery.downloadSingle')}
                </button>
                <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }} onClick={() => onEdit(i)}>
                  ✏️ {t(lang, 'gallery.edit')}
                </button>
              </div>
            </div>
            <div className="gallery-item-info">
              <span className="gallery-item-angle">
                {img.angle || `#${i + 1}`}
              </span>
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                {img.review?.productConsistency?.score && (
                  <span className="gallery-item-score" title={lang === 'zh' ? '產品一致性' : 'Product Consistency'}>
                    🎯 {img.review.productConsistency.score}
                  </span>
                )}
                {img.review?.overallScore && (
                  <span className="gallery-item-score">
                    ⭐ {img.review.overallScore}
                  </span>
                )}
              </div>
            </div>
            {img.review?.productConsistency?.issues?.length > 0 && (
              <div style={{ padding: '0 1rem 0.75rem', fontSize: '0.7rem', color: 'var(--warning)' }}>
                ⚠️ {img.review.productConsistency.issues.join('; ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
