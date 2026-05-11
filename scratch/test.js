import { GoogleGenAI } from '@google/genai';

const apiKey = 'AIzaSyCVrs-8KE_pw_4zBlbD6z-eU4XcCrVZok4';
const client = new GoogleGenAI({ apiKey });

async function test() {
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: ['Generate a red sports car'],
      config: {
        responseModalities: ['IMAGE'],
      },
    });
    console.log('Success gemini-2.5-flash-image!', response.candidates[0].content.parts);
  } catch (err) {
    console.error('Error gemini-2.5-flash-image:', err.message);
  }
}
test();
