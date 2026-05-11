import { GoogleGenAI } from '@google/genai';

let clientInstance = null;
let currentApiKey = null;

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
 * Generate image using Gemini Image model (Nano Banana) — for the Photographer agent
 */
export async function generateImage(apiKey, prompt, referenceImages = [], aspectRatio = '1:1') {
  const client = getClient(apiKey);
  const contents = [];

  // Add reference images (model + product anchor images)
  for (const img of referenceImages) {
    contents.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    });
  }

  contents.push(prompt);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  // Extract image from response
  const parts = response.candidates?.[0]?.content?.parts || [];
  let imageData = null;
  let textResponse = '';

  for (const part of parts) {
    if (part.inlineData) {
      imageData = {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
    if (part.text) {
      textResponse += part.text;
    }
  }

  return { imageData, textResponse };
}

/**
 * Edit an existing image using Gemini Image model — for the Photo Editor agent
 */
export async function editImage(apiKey, originalImageBase64, originalMimeType, editInstruction, aspectRatio = '1:1') {
  const client = getClient(apiKey);

  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        inlineData: {
          mimeType: originalMimeType,
          data: originalImageBase64,
        },
      },
      editInstruction,
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  let imageData = null;
  let textResponse = '';

  for (const part of parts) {
    if (part.inlineData) {
      imageData = {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/png',
      };
    }
    if (part.text) {
      textResponse += part.text;
    }
  }

  return { imageData, textResponse };
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
