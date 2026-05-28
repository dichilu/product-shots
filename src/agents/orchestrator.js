/**
 * CrewAI Agent Orchestrator (Enhanced)
 * 
 * Multi-agent workflow with AUTO-RETRY loop:
 * 1. Creative Director → Plans shooting with spatial awareness
 * 2. Prompt Engineer → Builds Identity Blocks with L/R orientation
 * 3. Photographer → Generates images via Gemini (Nano Banana)
 * 4. Quality Inspector → Checks consistency; if FAIL → auto-retry
 * 5. Photo Editor → User-requested edits (on-demand)
 */

import { generateText, generateImage, editImage, resetTierState } from '../utils/gemini.js';

const MAX_RETRIES = 2;

// ─── Shooting angles ───
const SHOOTING_ANGLES = {
  model: [
    { id: 'hero_front', zh: '正面全身 Hero Shot', en: 'Front Full-Body Hero Shot', cameraPosition: 'Camera directly in front, eye level' },
    { id: 'three_quarter', zh: '45° 三分之二側面', en: '45° Three-Quarter View', cameraPosition: 'Camera at 45° to the right-front, slightly above eye level' },
    { id: 'side_profile', zh: '側面輪廓', en: 'Side Profile', cameraPosition: 'Camera at 90° to the right side, eye level' },
    { id: 'close_up', zh: '產品特寫（模特兒手持/穿戴）', en: 'Product Close-up (Model Wearing/Holding)', cameraPosition: 'Camera close-up on the product area, slightly below product level looking up' },
    { id: 'over_shoulder', zh: '過肩/背面視角', en: 'Over-the-Shoulder / Back View', cameraPosition: 'Camera behind and above the subject, looking over shoulder' },
    { id: 'lifestyle', zh: '生活情境', en: 'Lifestyle / Environmental Scene', cameraPosition: 'Camera at medium distance, natural candid angle' },
  ],
  product: [
    { id: 'hero_front', zh: '正面主視覺', en: 'Front Hero Shot', cameraPosition: 'Camera directly in front of product, slightly above center' },
    { id: 'three_quarter', zh: '45° 產品斜角', en: '45° Product Angle', cameraPosition: 'Camera at 45° to the right-front, slightly above product' },
    { id: 'side_view', zh: '側面視圖', en: 'Side View', cameraPosition: 'Camera at 90° to the right side of product' },
    { id: 'detail_close', zh: '細節/材質特寫', en: 'Detail / Texture Close-up', cameraPosition: 'Macro lens close-up on a key detail area' },
    { id: 'top_down', zh: '俯視 / 平拍', en: 'Top-Down / Flat Lay', cameraPosition: 'Camera directly above product, looking straight down' },
    { id: 'lifestyle', zh: '情境使用場景', en: 'Lifestyle / In-Use Scene', cameraPosition: 'Camera at natural viewing angle in environment' },
  ],
};

/**
 * Agent 1: Creative Director
 */
async function runCreativeDirector(apiKey, params, onProgress) {
  onProgress('creativeDirector', 0);

  const { productImage, modelImage, location, season, emphasis, type, count } = params;
  const angleList = SHOOTING_ANGLES[type];
  const selectedAngles = angleList.slice(0, count);

  const prompt = `You are a world-class Creative Director specializing in e-commerce product photography campaigns.

CONTEXT:
- Shot Type: ${type === 'model' ? 'Model wearing/using the product' : 'Product-only shot'}
- Shooting Location: ${location || 'Professional studio'}
- Season & Time: ${season || 'Not specified'}
- Key Emphasis: ${emphasis || 'Product features and appeal'}
- Number of photos needed: ${count}

REFERENCE IMAGES:
${productImage ? '- A product reference photo is provided. CAREFULLY ANALYZE: colors, materials, textures, shape, any logos, decorations, buckles, patterns. Pay special attention to ASYMMETRIC DESIGNS — many products (shoes, bags, watches) have different details on left vs right, front vs back, inside vs outside.' : ''}
${modelImage ? '- A model reference photo is provided (note their appearance, body type, style)' : ''}

═══ CRITICAL: SPATIAL ANALYSIS ═══
Before creating the plan, you MUST first analyze the product and create a PRODUCT ANATOMY MAP:
- **Left side details**: What logos, decorations, buckles, patterns are on the LEFT?
- **Right side details**: What is on the RIGHT? Is it the same or different?
- **Front details**: What is visible from the front?
- **Back details**: What is visible from the back?
- **Top/Bottom**: Any distinguishing features?
- **Asymmetric elements**: List ALL elements that are NOT symmetrical (e.g., logo only on one side, different number of buckles on each side, unique patterns per side)

YOUR TASK:
Create a detailed shooting plan for ${count} photos using these angles:
${selectedAngles.map((a, i) => `${i + 1}. ${a.en} (${a.zh}) — Camera: ${a.cameraPosition}`).join('\n')}

For EACH photo, provide:
1. **angle**: Which specific angle
2. **cameraPosition**: Exact camera position description
3. **visibleSides**: Which sides of the product will be visible from this camera position (e.g., "left outer side + front")
4. **expectedDetails**: Based on the Product Anatomy Map, what specific logos/decorations/patterns SHOULD be visible from this angle, and which should NOT
5. **composition**: Detailed composition description
6. **lighting**: Specific lighting setup
7. **mood**: Mood/emotion to drive purchase intent
8. **productFocus**: How the product is highlighted
9. **background**: Setting details

CRITICAL RULES:
- Each photo MUST use a DIFFERENT angle
- For EACH angle, explicitly state which product details (logos, buckles, patterns) should be VISIBLE vs HIDDEN based on the camera position
- The product must be the visual hero in every shot
- ${type === 'model' ? 'The model must look natural and aspirational. CRITICAL: Analyze the reference model\'s clothing and provide a HIGHLY DETAILED description of their exact outfit (top, bottom, accessories). This outfit MUST remain identical across all shots.' : 'The product should command attention with perfect lighting and composition'}
- Every photo should make the viewer want to BUY the product

Output as JSON: { productAnatomyMap: { leftSide: string, rightSide: string, front: string, back: string, asymmetricElements: string[] }, ${type === 'model' ? '"modelOutfit": "detailed outfit description", ' : ''}shots: [{angle, cameraPosition, visibleSides, expectedDetails, composition, lighting, mood, productFocus, background}] }`;

  const images = [];
  if (productImage) images.push(productImage);
  if (modelImage) images.push(modelImage);

  const result = await generateText(apiKey, prompt, images);
  onProgress('creativeDirector', 100);

  return { plan: result, selectedAngles };
}

/**
 * Agent 2: Prompt Engineer
 */
async function runPromptEngineer(apiKey, params, creativePlan, onProgress, failedFeedback = null) {
  onProgress('promptEngineer', 0);

  const { productImage, modelImage, location, season, emphasis, type, count } = params;

  const retryContext = failedFeedback
    ? `\n\n═══ RETRY CONTEXT ═══\nThe previous generation FAILED quality inspection. Here is the feedback:\n${failedFeedback}\nYou MUST fix these issues in the new prompts. Pay EXTRA attention to product detail placement and spatial accuracy.\n`
    : '';

  const prompt = `You are an expert Prompt Engineer specializing in AI image generation for commercial product photography.
${retryContext}
CREATIVE DIRECTOR'S PLAN:
${creativePlan.plan}

CONTEXT:
- Shot Type: ${type === 'model' ? 'Model with product' : 'Product only'}
- Location: ${location || 'Professional studio'}
- Season/Time: ${season || 'Not specified'}
- Emphasis: ${emphasis || 'Product appeal'}

YOUR TASK:
Transform each photo plan into a highly detailed prompt for the Gemini image generation model.

═══ PROMPT STRUCTURE (MANDATORY FOR EVERY PROMPT) ═══

Each prompt MUST contain these blocks IN ORDER:

**[SHOT TYPE]** "Professional commercial ${type === 'model' ? 'fashion' : 'product'} photograph"

**[PRODUCT IDENTITY BLOCK]** (IDENTICAL across all prompts)
- Describe the product exactly as seen in the reference photo
- Include: material, color (exact shade), texture, shape, size
- List ALL decorations, logos, buckles, patterns with their EXACT positions
- Example: "The shoe has a gold brand logo on the LEFT outer side only, three asymmetric silver buckles on the LEFT strap, and a geometric pattern on the LEFT tongue. The RIGHT shoe has NO logo, two buckles on the RIGHT strap, and text on the RIGHT tongue."

**[SPATIAL DIRECTION BLOCK]** (UNIQUE per prompt)
- State the camera position explicitly
- State which side of the product faces the camera
- State which details (logos, buckles) SHOULD be visible from this angle
- State which details should NOT be visible
- Example: "Camera is positioned at 45° to the right. The RIGHT outer side of the shoe faces the camera. The gold logo is on the LEFT side and should NOT be visible from this angle."

${type === 'model' ? `**[MODEL & OUTFIT IDENTITY BLOCK]** (IDENTICAL across all prompts)
- Describe the model exactly as in the reference: face shape, skin tone, hair style/color, body type
- Describe the model's exact outfit based on the Creative Director's plan: "${creativePlan.modelOutfit || 'Analyze from reference and keep identical'}"
- This outfit description MUST be 100% IDENTICAL in every single prompt. Do not change colors, styles, or pieces.
- Always say "same model as the reference photo"
- Describe pose naturally for each angle` : ''}

**[SCENE BLOCK]** (Per prompt)
- Composition, environment, lighting, atmosphere

**[QUALITY BLOCK]** (IDENTICAL)
- "Shot on Hasselblad H6D-100c, 100mm f/2.8, natural studio lighting, 8K resolution, ultra-detailed, commercial quality, award-winning product photography"

═══ CRITICAL RULES ═══
1. The PRODUCT IDENTITY BLOCK must be COPY-PASTED identically in every prompt
2. The SPATIAL DIRECTION BLOCK must correctly predict which product details are visible based on camera angle
3. NEVER mirror or flip the product — left is always left, right is always right
4. If a logo is only on the left side, it must ONLY appear when the left side faces the camera
5. Decorations and patterns must maintain their exact positions regardless of angle
6. NEVER include text overlays or watermarks

Output as a JSON array of ${count} objects with keys: photoIndex (1-based), angle, cameraPosition, visibleDetails, prompt
Each prompt should be 150-250 words.`;

  const images = [];
  if (productImage) images.push(productImage);
  if (modelImage) images.push(modelImage);

  const result = await generateText(apiKey, prompt, images);
  onProgress('promptEngineer', 100);

  return result;
}

/**
 * Agent 3: Photographer
 */
async function runPhotographer(apiKey, params, prompts, onProgress, specificIndices = null) {
  const { productImage, modelImage, aspectRatio, count } = params;

  let promptList;
  try {
    const jsonMatch = prompts.match(/\[[\s\S]*\]/);
    promptList = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch (e) {
    promptList = [{ prompt: prompts }];
  }

  while (promptList.length < count) {
    promptList.push(promptList[promptList.length - 1] || { prompt: 'Professional commercial product photograph, studio lighting, 8K quality' });
  }

  const indicesToGenerate = specificIndices || Array.from({ length: count }, (_, i) => i);
  const generatedImages = [];

  for (let idx = 0; idx < indicesToGenerate.length; idx++) {
    const i = indicesToGenerate[idx];
    const progressPercent = Math.round(((idx + 1) / indicesToGenerate.length) * 100);
    onProgress('photographer', progressPercent, i + 1);

    const promptObj = promptList[i];
    const promptText = typeof promptObj === 'string' ? promptObj : (promptObj.prompt || JSON.stringify(promptObj));

    const referenceImages = [];
    if (productImage) referenceImages.push(productImage);
    if (modelImage) referenceImages.push(modelImage);

    let attempts = 0;
    let success = false;

    while (attempts < 2 && !success) {
      attempts++;
      try {
        const result = await generateImage(apiKey, promptText, referenceImages, aspectRatio);
        if (result.imageData) {
          generatedImages.push({
            index: i,
            imageData: result.imageData,
            prompt: promptText,
            angle: promptObj.angle || `Photo ${i + 1}`,
            cameraPosition: promptObj.cameraPosition || '',
            visibleDetails: promptObj.visibleDetails || '',
            textResponse: result.textResponse,
            usedTier: result.usedTier,
          });
          success = true;
        }
      } catch (err) {
        console.error(`Photographer: Error on photo ${i + 1}, attempt ${attempts}:`, err);
      }
    }
  }

  onProgress('photographer', 100, count);
  return generatedImages;
}

/**
 * Agent 4: Quality Inspector (Enhanced with spatial consistency checks)
 */
async function runQualityInspector(apiKey, generatedImages, params, onProgress) {
  onProgress('qualityInspector', 0);

  const reviewedImages = [];

  for (let i = 0; i < generatedImages.length; i++) {
    const img = generatedImages[i];
    const progressPercent = Math.round(((i + 1) / generatedImages.length) * 100);

    try {
      const reviewPrompt = `You are a senior Quality Inspector for commercial product photography with expertise in product consistency verification.

ORIGINAL PRODUCT REFERENCE is the first image. The GENERATED IMAGE to review is the second image.

CAMERA ANGLE for this shot: ${img.angle}
CAMERA POSITION: ${img.cameraPosition}
EXPECTED VISIBLE DETAILS: ${img.visibleDetails}

═══ REVIEW CHECKLIST ═══

**A. PRODUCT IDENTITY CONSISTENCY (Most Critical)**
Compare the generated image against the reference product:
1. Are all logos in their CORRECT positions? (Not mirrored, not moved to wrong side)
2. Are decorations/buckles/patterns in their CORRECT positions and correct count?
3. Are asymmetric elements preserved? (If logo is only on left in reference, is it only on left in generated?)
4. Is the product NOT accidentally mirrored/flipped?
5. Are colors, materials, and textures accurate?

**B. SPATIAL ACCURACY**
Given the camera angle:
6. Are the CORRECT sides of the product visible for this camera position?
7. Are details that should be HIDDEN from this angle actually hidden?
8. Is the perspective/foreshortening natural for this viewing angle?

**C. PROFESSIONAL QUALITY**
9. Does it look like a real professional photograph?
10. Is the composition appealing and well-balanced?
11. Is the lighting professional?
12. Would this photo make someone want to BUY the product?

${params.type === 'model' ? `**D. MODEL & OUTFIT CONSISTENCY**
13. Does the model match the reference? (Face, body, skin tone, hair)
14. Is the model wearing the EXACT SAME OUTFIT as the other shots / reference? (Top, bottom, style must match). Reject if clothing changes.
15. Is the model's pose natural for this angle?` : ''}

═══ OUTPUT ═══
Output as JSON:
{
  "overallScore": number (1-10),
  "passed": boolean (true if score >= 7),
  "productConsistency": { "score": number, "issues": ["list of specific issues"] },
  "spatialAccuracy": { "score": number, "issues": ["list of specific issues"] },
  "professionalQuality": { "score": number },
  "assessment": "brief overall assessment",
  "failureReason": "if failed, specific reason for re-generation prompt"
}`;

      // Send both reference product image and generated image for comparison
      const reviewImages = [];
      if (params.productImage) {
        reviewImages.push(params.productImage);
      }
      reviewImages.push({
        base64: img.imageData.data,
        mimeType: img.imageData.mimeType,
      });

      const result = await generateText(apiKey, reviewPrompt, reviewImages);

      let review;
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        review = jsonMatch ? JSON.parse(jsonMatch[0]) : { overallScore: 7, passed: true, assessment: 'Review parsing failed', productConsistency: { score: 7, issues: [] }, spatialAccuracy: { score: 7, issues: [] } };
      } catch {
        review = { overallScore: 7, passed: true, assessment: result, productConsistency: { score: 7, issues: [] }, spatialAccuracy: { score: 7, issues: [] } };
      }

      reviewedImages.push({ ...img, review });
    } catch (err) {
      reviewedImages.push({
        ...img,
        review: { overallScore: 7, passed: true, assessment: 'Review skipped due to error', productConsistency: { score: 7, issues: [] }, spatialAccuracy: { score: 7, issues: [] } },
      });
    }

    onProgress('qualityInspector', progressPercent);
  }

  return reviewedImages;
}

/**
 * Agent 5: Photo Editor (on-demand)
 */
export async function runPhotoEditor(apiKey, originalPrompt, editInstruction, referenceImages, aspectRatio = '1:1', onProgress) {
  if (onProgress) onProgress('photoEditor', 0);

  // 1. Prompt Engineer rewrites the original prompt
  const rewritePrompt = `You are an expert Prompt Engineer for commercial product photography.
The user wants to make a specific modification to a photo generation prompt.

ORIGINAL PROMPT:
"""
${originalPrompt}
"""

USER'S EDIT REQUEST:
"${editInstruction}"

YOUR TASK:
Rewrite the ORIGINAL PROMPT to incorporate the user's edit request.

CRITICAL RULES:
1. You MUST keep the [PRODUCT IDENTITY BLOCK] absolutely identical. Do not change a single word about the product's appearance, logos, or decorations.
2. You MUST keep the [SPATIAL DIRECTION BLOCK] identical to maintain the exact same camera angle.
3. Modify ONLY the [SCENE BLOCK] or [QUALITY BLOCK] to reflect the user's edit request (e.g., changing background, lighting, or overall style).
4. Output ONLY the raw rewritten prompt text, without any markdown formatting or explanations.`;

  const newPrompt = await generateText(apiKey, rewritePrompt);
  if (onProgress) onProgress('photoEditor', 50);

  // 2. Photographer generates the new image
  const result = await generateImage(apiKey, newPrompt, referenceImages, aspectRatio);
  
  if (onProgress) onProgress('photoEditor', 100);
  
  return {
    imageData: result.imageData,
    newPrompt: newPrompt
  };
}

/**
 * Main orchestrator with AUTO-RETRY loop
 */
export async function runCrewPipeline(apiKey, params, onProgress) {
  const results = {
    creativePlan: null,
    prompts: null,
    images: [],
    error: null,
  };

  try {
    // Reset tier state at start of each pipeline run
    resetTierState();

    // ═══ Step 1: Creative Director ═══
    const creativeResult = await runCreativeDirector(apiKey, params, onProgress);
    results.creativePlan = creativeResult;
    if (params.cancelled?.current) return results;

    // ═══ Step 2: Prompt Engineer (initial) ═══
    let prompts = await runPromptEngineer(apiKey, params, creativeResult, onProgress);
    results.prompts = prompts;
    if (params.cancelled?.current) return results;

    // ═══ Step 3: Photographer (initial) ═══
    let images = await runPhotographer(apiKey, params, prompts, onProgress);
    if (params.cancelled?.current) return results;

    // ═══ Step 4: Quality Inspector ═══
    let reviewedImages = await runQualityInspector(apiKey, images, params, onProgress);

    // ═══ AUTO-RETRY LOOP ═══
    let retryCount = 0;
    let failedImages = reviewedImages.filter((img) => !img.review.passed);

    while (failedImages.length > 0 && retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Auto-retry ${retryCount}/${MAX_RETRIES}: ${failedImages.length} image(s) failed QC`);

      if (params.cancelled?.current) break;

      // Collect failure feedback
      const failureFeedback = failedImages.map((img) => {
        const issues = [
          ...(img.review.productConsistency?.issues || []),
          ...(img.review.spatialAccuracy?.issues || []),
        ];
        return `Photo ${img.index + 1} (${img.angle}): ${img.review.failureReason || img.review.assessment || 'Quality below threshold'}. Issues: ${issues.join('; ') || 'General quality'}`;
      }).join('\n');

      // Re-run Prompt Engineer with failure feedback
      onProgress('promptEngineer', 0);
      const retriedPrompts = await runPromptEngineer(apiKey, params, creativeResult, onProgress, failureFeedback);

      if (params.cancelled?.current) break;

      // Re-run Photographer only for failed images
      const failedIndices = failedImages.map((img) => img.index);
      const retriedImages = await runPhotographer(apiKey, params, retriedPrompts, onProgress, failedIndices);

      if (params.cancelled?.current) break;

      // Re-run Quality Inspector on retried images
      const retriedReviewed = await runQualityInspector(apiKey, retriedImages, params, onProgress);

      // Replace failed images with retried versions
      for (const retriedImg of retriedReviewed) {
        const existingIdx = reviewedImages.findIndex((img) => img.index === retriedImg.index);
        if (existingIdx !== -1) {
          // Use retried version if it's better, otherwise keep original
          if (retriedImg.review.overallScore >= reviewedImages[existingIdx].review.overallScore) {
            reviewedImages[existingIdx] = retriedImg;
          }
        }
      }

      // Check again
      failedImages = reviewedImages.filter((img) => !img.review.passed);
    }

    // Sort by index to maintain order
    reviewedImages.sort((a, b) => a.index - b.index);
    results.images = reviewedImages;

    onProgress('complete', 100);
  } catch (error) {
    console.error('CrewAI pipeline error:', error);
    results.error = error.message || 'Unknown error occurred';
    throw error;
  }

  return results;
}

export { SHOOTING_ANGLES };
