import React, { useCallback, useRef } from 'react';
import { useApp } from './contexts/AppContext.jsx';
import { t, LANGUAGES } from './utils/i18n.js';
import { fileToBase64 } from './utils/gemini.js';
import { runCrewPipeline, runPhotoEditor } from './agents/orchestrator.js';
import Header from './components/Header.jsx';
import UploadForm from './components/UploadForm.jsx';
import ProgressTracker from './components/ProgressTracker.jsx';
import ImageGallery from './components/ImageGallery.jsx';
import EditModal from './components/EditModal.jsx';
import ErrorToast from './components/ErrorToast.jsx';

export default function App() {
  const { state, dispatch } = useApp();
  const cancelledRef = useRef(false);

  const handleGenerate = useCallback(async () => {
    if (!state.apiKey) {
      dispatch({ type: 'SET_ERROR', payload: t(state.lang, 'errors.noApiKey') });
      return;
    }
    if (!state.productImage) {
      dispatch({ type: 'SET_ERROR', payload: t(state.lang, 'errors.noProduct') });
      return;
    }

    cancelledRef.current = false;
    dispatch({ type: 'START_GENERATION' });

    const params = {
      productImage: state.productImage ? { base64: state.productImage.base64, mimeType: state.productImage.mimeType } : null,
      modelImage: state.modelImage ? { base64: state.modelImage.base64, mimeType: state.modelImage.mimeType } : null,
      location: state.location,
      season: state.season,
      emphasis: state.emphasis,
      count: state.count,
      type: state.type,
      aspectRatio: state.aspectRatio,
      lang: state.lang,
      cancelled: cancelledRef,
    };

    const onProgress = (agent, percent, currentPhoto) => {
      if (cancelledRef.current) return;
      dispatch({ type: 'UPDATE_PROGRESS', agent, percent, currentPhoto });
    };

    try {
      const results = await runCrewPipeline(state.apiKey, params, onProgress);
      if (!cancelledRef.current) {
        dispatch({ type: 'GENERATION_COMPLETE', images: results.images, creativePlan: results.creativePlan });
      }
    } catch (err) {
      if (!cancelledRef.current) {
        dispatch({ type: 'GENERATION_ERROR', error: err.message || t(state.lang, 'errors.generationFailed') });
      }
    }
  }, [state.apiKey, state.productImage, state.modelImage, state.location, state.season, state.emphasis, state.count, state.type, state.aspectRatio, state.lang, dispatch]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    dispatch({ type: 'BACK_TO_INPUT' });
  }, [dispatch]);

  const handleEdit = useCallback(async (index, instruction) => {
    dispatch({ type: 'START_EDIT' });
    try {
      const img = state.generatedImages[index];
      
      const referenceImages = [];
      if (state.productImage) referenceImages.push({ base64: state.productImage.base64, mimeType: state.productImage.mimeType });
      if (state.modelImage) referenceImages.push({ base64: state.modelImage.base64, mimeType: state.modelImage.mimeType });

      const result = await runPhotoEditor(
        state.apiKey,
        img.prompt,
        instruction,
        referenceImages,
        state.aspectRatio,
      );
      if (result.imageData) {
        dispatch({ type: 'EDIT_COMPLETE', index, imageData: result.imageData, instruction, newPrompt: result.newPrompt });
      } else {
        dispatch({ type: 'SET_ERROR', payload: t(state.lang, 'errors.editFailed') });
        dispatch({ type: 'CLOSE_EDIT' });
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message || t(state.lang, 'errors.editFailed') });
      dispatch({ type: 'CLOSE_EDIT' });
    }
  }, [state.generatedImages, state.apiKey, state.aspectRatio, state.lang, state.productImage, state.modelImage, dispatch]);

  return (
    <>
      <div className="app-bg" />
      <Header />

      <main className="container">
        {state.phase === 'input' && (
          <UploadForm onGenerate={handleGenerate} />
        )}

        {state.phase === 'generating' && (
          <ProgressTracker onCancel={handleCancel} />
        )}

        {state.phase === 'results' && (
          <ImageGallery
            onEdit={(index) => dispatch({ type: 'OPEN_EDIT', index })}
            onRegenerate={() => dispatch({ type: 'BACK_TO_INPUT' })}
          />
        )}
      </main>

      {state.editingImage !== null && (
        <EditModal
          onSubmit={handleEdit}
          onClose={() => dispatch({ type: 'CLOSE_EDIT' })}
        />
      )}

      {state.error && <ErrorToast />}

      <footer className="footer">
        {t(state.lang, 'footer.disclaimer')}
      </footer>
    </>
  );
}
