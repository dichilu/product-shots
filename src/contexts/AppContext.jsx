import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  // Language
  lang: localStorage.getItem('psg_lang') || 'zh',

  // API Key (from Vercel / .env)
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',

  // Form data
  modelImage: null,       // { file, preview, base64, mimeType }
  productImage: null,     // { file, preview, base64, mimeType }
  location: '',
  season: '',
  emphasis: '',
  count: 4,
  type: 'model',          // 'model' | 'product'
  aspectRatio: '1:1',

  // Generation state
  phase: 'input',         // 'input' | 'generating' | 'results'
  progress: {
    currentAgent: null,
    percent: 0,
    currentPhoto: 0,
    totalPhotos: 0,
  },

  // Results
  generatedImages: [],    // Array of generated image objects
  creativePlan: null,

  // Edit modal
  editingImage: null,     // Index of image being edited
  editInstruction: '',
  isEditing: false,

  // Error
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LANG':
      localStorage.setItem('psg_lang', action.payload);
      return { ...state, lang: action.payload };

    case 'SET_API_KEY':
      localStorage.setItem('psg_apiKey', action.payload);
      return { ...state, apiKey: action.payload };

    case 'SET_MODEL_IMAGE':
      return { ...state, modelImage: action.payload };

    case 'SET_PRODUCT_IMAGE':
      return { ...state, productImage: action.payload };

    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'START_GENERATION':
      return {
        ...state,
        phase: 'generating',
        progress: { currentAgent: null, percent: 0, currentPhoto: 0, totalPhotos: state.count },
        generatedImages: [],
        error: null,
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: {
          ...state.progress,
          currentAgent: action.agent,
          percent: action.percent,
          currentPhoto: action.currentPhoto || state.progress.currentPhoto,
        },
      };

    case 'GENERATION_COMPLETE':
      return {
        ...state,
        phase: 'results',
        generatedImages: action.images,
        creativePlan: action.creativePlan,
        progress: { currentAgent: 'complete', percent: 100, currentPhoto: state.count, totalPhotos: state.count },
      };

    case 'GENERATION_ERROR':
      return {
        ...state,
        phase: 'input',
        error: action.error,
      };

    case 'OPEN_EDIT':
      return {
        ...state,
        editingImage: action.index,
        editInstruction: '',
        isEditing: false,
      };

    case 'CLOSE_EDIT':
      return {
        ...state,
        editingImage: null,
        editInstruction: '',
        isEditing: false,
      };

    case 'SET_EDIT_INSTRUCTION':
      return { ...state, editInstruction: action.payload };

    case 'START_EDIT':
      return { ...state, isEditing: true };

    case 'EDIT_COMPLETE': {
      const updatedImages = [...state.generatedImages];
      updatedImages[action.index] = {
        ...updatedImages[action.index],
        imageData: action.imageData,
        prompt: action.newPrompt || updatedImages[action.index].prompt,
        editHistory: [
          ...(updatedImages[action.index].editHistory || []),
          { instruction: action.instruction, timestamp: Date.now() },
        ],
      };
      return {
        ...state,
        generatedImages: updatedImages,
        isEditing: false,
        editingImage: null,
      };
    }

    case 'RESET':
      return {
        ...initialState,
        lang: state.lang,
        apiKey: state.apiKey,
      };

    case 'BACK_TO_INPUT':
      return {
        ...state,
        phase: 'input',
        error: null,
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
