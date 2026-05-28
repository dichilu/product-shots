import { GoogleGenAI } from '@google/genai';

let clientInstance = null;
let currentApiKey = null;

// ─── Three-Tier Image Generation Models ───────────────────────────────────────
// Tier 1: Nano Banana 2 (highest quality, newest)
// Tier 2: Nano Banana (fast, reliable)
// Tier 3: Imagen 4 Standard (fallback, different API)
export const IMAGE_MODEL_TIERS = [
  { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2', type: 'gemini' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana', type: 'gemini' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4 Standard', type: 'imagen' },
];

// Session-level tier tracking (resets on page reload)
// Tracks which tiers are exhausted to avoid retrying known-failed tiers
let exhaustedTiers = new Set();
export function resetTierState() { exhaustedTiers = new Set(); }
export function getCurrentTier() {
  return IMAGE_MODEL_TIERS.find(t => !exhaustedTiers.has(t.id)) || IMAGE_MODEL_TIERS[IMAGE_MODEL_TIERS.length - 1];
}

// Determine if an error means quota/rate limit exceeded
function isQuotaError(err) {
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  const status = err?.status || err?.code;
  return (
    status === 429 ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('rateerror')
  );
}

export function getClient(apiKey) {
  if (clientInstance && currentApiKey === apiKey) return clientInstance;
  clientInstance = new GoogleGenAI({ apiKey });
  currentApiKey = apiKey;
  return clientInstance;
}

/**
 * Generate text content using Gemini (for Creative Director / Prompt Engineer / Quality Inspector)
 */
export async function generateText(apiKey, prompt, images = []) {
  const client = getClient(apiKey);
  const contents = [];

  // Add images as inline data
  for (const img of images) {
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  contents.push(prompt);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
  });

  return response.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join('\n') || '';
}

/**
 * [Tier helper] Gemini-family image generation (Tier 1 & 2)
 */
async function generateImageGemini(client, modelId, prompt, referenceImages, aspectRatio) {
  const contents = [];
  for (const img of referenceImages) {
    contents.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
  }
  contents.push(prompt);

  const response = await client.models.generateContent({
    model: modelId,
    contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  let imageData = null;
  let textResponse = '';
  for (const part of parts) {
    if (part.inlineData) imageData = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    if (part.text) textResponse += part.text;
  }
  return { imageData, textResponse };
}

/**
 * [Tier helper] Imagen 4 image generation (Tier 3) — uses predict API
 * Note: Imagen does NOT support reference images via inline data in the same way.
 * The prompt must carry all visual intent.
 */
async function generateImageImagen(client, modelId, prompt, aspectRatio) {
  const response = await client.models.generateImages({
    model: modelId,
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio,
      // Imagen supports outputMimeType
      outputMimeType: 'image/jpeg',
    },
  });

  const generated = response.generatedImages?.[0];
  if (!generated?.image?.imageBytes) return { imageData: null, textResponse: '' };

  return {
    imageData: {
      data: generated.image.imageBytes,
      mimeType: 'image/jpeg',
    },
    textResponse: '',
  };
}

/**
 * Generate image with THREE-TIER FALLBACK:
 *   Tier 1: gemini-3.1-flash-image-preview  (Nano Banana 2)
 *   Tier 2: gemini-2.5-flash-image          (Nano Banana)
 *   Tier 3: imagen-4.0-generate-001         (Imagen 4 Standard)
 *
 * On RESOURCE_EXHAUSTED (quota), automatically falls to the next tier.
 * Exhausted tiers are remembered for the session to avoid retrying.
 */
export async function generateImage(apiKey, prompt, referenceImages = [], aspectRatio = '1:1') {
  const client = getClient(apiKey);

  // Try each tier in order, skipping already-exhausted ones
  for (const tier of IMAGE_MODEL_TIERS) {
    if (exhaustedTiers.has(tier.id)) continue;

    try {
      console.log(`[ImageGen] Trying Tier: ${tier.name} (${tier.id})`);

      let result;
      if (tier.type === 'gemini') {
        result = await generateImageGemini(client, tier.id, prompt, referenceImages, aspectRatio);
      } else {
        // Imagen: reference images not supported, prompt carries all context
        result = await generateImageImagen(client, tier.id, prompt, aspectRatio);
      }

      // Success — log which tier was used and return
      console.log(`[ImageGen] ✅ Success with ${tier.name}`);
      result.usedTier = tier;
      return result;

    } catch (err) {
      if (isQuotaError(err)) {
        console.warn(`[ImageGen] ⚠️ Quota exhausted on ${tier.name}, falling to next tier...`);
        exhaustedTiers.add(tier.id);
        // Continue to next tier
      } else {
        // Non-quota error — re-throw immediately, don't fallback
        throw err;
      }
    }
  }

  // All tiers exhausted
  throw new Error('All image generation tiers exhausted. Please wait for quota to reset or check your API key.');
}

/**
 * Edit an existing image — uses Gemini-family tiers with fallback.
 * (Imagen 4 does not support image editing via inline data, so we skip Tier 3 for edits)
 */
export async function editImage(apiKey, originalImageBase64, originalMimeType, editInstruction, aspectRatio = '1:1') {
  const client = getClient(apiKey);
  const geminiTiers = IMAGE_MODEL_TIERS.filter(t => t.type === 'gemini');

  for (const tier of geminiTiers) {
    if (exhaustedTiers.has(tier.id)) continue;

    try {
      console.log(`[EditImage] Trying Tier: ${tier.name} (${tier.id})`);

      const response = await client.models.generateContent({
        model: tier.id,
        contents: [
          { inlineData: { mimeType: originalMimeType, data: originalImageBase64 } },
          editInstruction,
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let imageData = null;
      let textResponse = '';
      for (const part of parts) {
        if (part.inlineData) imageData = { data: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
        if (part.text) textResponse += part.text;
      }

      console.log(`[EditImage] ✅ Success with ${tier.name}`);
      return { imageData, textResponse, usedTier: tier };

    } catch (err) {
      if (isQuotaError(err)) {
        console.warn(`[EditImage] ⚠️ Quota exhausted on ${tier.name}, falling to next tier...`);
        exhaustedTiers.add(tier.id);
      } else {
        throw err;
      }
    }
  }

  throw new Error('All image edit tiers exhausted. Please wait for quota to reset.');
}

/**
 * Convert a File object to base64
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({
        base64,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 image data to a data URL for display
 */
export function base64ToDataUrl(base64, mimeType = 'image/png') {
  return `data:${mimeType};base64,${base64}`;
}
