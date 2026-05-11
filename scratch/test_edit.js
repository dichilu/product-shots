import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const apiKey = 'AIzaSyCVrs-8KE_pw_4zBlbD6z-eU4XcCrVZok4';
const client = new GoogleGenAI({ apiKey });

async function test() {
  try {
    // Generate an initial image
    const resp1 = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: ['A red apple on a table'],
      config: { responseModalities: ['IMAGE'] },
    });
    
    const imgData = resp1.candidates[0].content.parts[0].inlineData;
    
    // Try to edit it
    const resp2 = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { inlineData: imgData },
        'Make the apple green'
      ],
      config: { responseModalities: ['IMAGE'] },
    });
    
    console.log('Edit successful!');
  } catch (err) {
    console.error('Error during edit:', err.message);
  }
}
test();
