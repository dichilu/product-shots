const translations = {
  zh: {
    app: {
      title: 'AI 形象照生成器',
      subtitle: '由 CrewAI 團隊 × Gemini 驅動',
      poweredBy: '由 Google Gemini (Nano Banana) 提供圖像生成能力',
    },
    apiKey: {
      label: 'Gemini API Key',
      placeholder: '輸入您的 Google Gemini API Key...',
      hint: '您的 API Key 僅儲存在瀏覽器本地，不會傳送至任何伺服器。',
      save: '儲存',
      saved: '已儲存',
      get: '取得 API Key',
    },
    upload: {
      modelTitle: '模特兒照片',
      modelDesc: '拖放或點擊上傳模特兒參考照片',
      productTitle: '產品照片',
      productDesc: '拖放或點擊上傳產品參考照片',
      dropHint: '支援 JPG、PNG、WebP',
      changeImage: '更換圖片',
    },
    form: {
      locationLabel: '拍攝地點',
      locationPlaceholder: '例：東京街頭、巴黎鐵塔前、白色攝影棚...',
      seasonLabel: '季節與時間',
      seasonPlaceholder: '例：夏日午後、冬季黃昏、春天清晨...',
      emphasisLabel: '重點補充',
      emphasisPlaceholder: '想強調的產品特色或風格，例：展現包包的大容量、凸顯鞋子的流線感...',
      countLabel: '生成張數',
      typeLabel: '形象照類型',
      typeModel: '模特兒形象照',
      typeProduct: '產品形象照',
      aspectLabel: '圖片比例',
      generate: '開始生成',
      generating: '生成中...',
    },
    aspects: {
      '1:1': '1:1 正方形',
      '16:9': '16:9 橫式',
      '9:16': '9:16 直式',
      '4:3': '4:3 標準',
      '3:4': '3:4 肖像',
    },
    progress: {
      title: '生成進行中',
      step: '步驟',
      creativeDirector: '🎨 創意總監正在規劃拍攝方案...',
      promptEngineer: '📝 提示詞工程師正在撰寫拍攝指令...',
      photographer: '📸 攝影師正在拍攝第 {n} 張...',
      qualityInspector: '🔍 品質審核官正在檢查品質...',
      complete: '✅ 全部完成！',
      cancel: '取消生成',
    },
    gallery: {
      title: '生成結果',
      downloadAll: '全部打包下載',
      downloadSingle: '下載',
      edit: '修改',
      angle: '拍攝角度',
      regenerate: '重新生成全部',
    },
    edit: {
      title: '修改照片',
      original: '原始照片',
      instruction: '修改意見',
      instructionPlaceholder: '請描述您想修改的內容，例：背景改成藍天、模特兒表情更開心...',
      submit: '提交修改',
      submitting: '修圖師正在修改...',
      cancel: '取消',
    },
    errors: {
      noApiKey: '請先輸入 Gemini API Key',
      noProduct: '請上傳產品照片',
      generationFailed: '圖片生成失敗，請重試',
      editFailed: '圖片修改失敗，請重試',
    },
    footer: {
      disclaimer: '此工具使用 AI 生成圖像，結果可能與預期不同。生成內容需要人工審核後使用。',
    },
  },
  en: {
    app: {
      title: 'AI Product Shot Generator',
      subtitle: 'Powered by CrewAI Team × Gemini',
      poweredBy: 'Image generation powered by Google Gemini (Nano Banana)',
    },
    apiKey: {
      label: 'Gemini API Key',
      placeholder: 'Enter your Google Gemini API Key...',
      hint: 'Your API Key is stored locally in the browser only. It is never sent to any server.',
      save: 'Save',
      saved: 'Saved',
      get: 'Get API Key',
    },
    upload: {
      modelTitle: 'Model Photo',
      modelDesc: 'Drag & drop or click to upload model reference photo',
      productTitle: 'Product Photo',
      productDesc: 'Drag & drop or click to upload product reference photo',
      dropHint: 'Supports JPG, PNG, WebP',
      changeImage: 'Change Image',
    },
    form: {
      locationLabel: 'Shooting Location',
      locationPlaceholder: 'e.g. Tokyo streets, in front of Eiffel Tower, white studio...',
      seasonLabel: 'Season & Time',
      seasonPlaceholder: 'e.g. Summer afternoon, winter dusk, spring morning...',
      emphasisLabel: 'Key Emphasis',
      emphasisPlaceholder: 'Product features or style to emphasize, e.g. show the bag\'s large capacity...',
      countLabel: 'Number of Photos',
      typeLabel: 'Shot Type',
      typeModel: 'Model Fashion Shot',
      typeProduct: 'Product Shot',
      aspectLabel: 'Aspect Ratio',
      generate: 'Start Generating',
      generating: 'Generating...',
    },
    aspects: {
      '1:1': '1:1 Square',
      '16:9': '16:9 Landscape',
      '9:16': '9:16 Portrait',
      '4:3': '4:3 Standard',
      '3:4': '3:4 Portrait',
    },
    progress: {
      title: 'Generating',
      step: 'Step',
      creativeDirector: '🎨 Creative Director is planning the shoot...',
      promptEngineer: '📝 Prompt Engineer is crafting instructions...',
      photographer: '📸 Photographer is shooting photo #{n}...',
      qualityInspector: '🔍 Quality Inspector is reviewing quality...',
      complete: '✅ All done!',
      cancel: 'Cancel',
    },
    gallery: {
      title: 'Generated Results',
      downloadAll: 'Download All (ZIP)',
      downloadSingle: 'Download',
      edit: 'Edit',
      angle: 'Angle',
      regenerate: 'Regenerate All',
    },
    edit: {
      title: 'Edit Photo',
      original: 'Original Photo',
      instruction: 'Edit Instructions',
      instructionPlaceholder: 'Describe what you want to change, e.g. change background to blue sky...',
      submit: 'Submit Edit',
      submitting: 'Photo Editor is working...',
      cancel: 'Cancel',
    },
    errors: {
      noApiKey: 'Please enter your Gemini API Key first',
      noProduct: 'Please upload a product photo',
      generationFailed: 'Image generation failed, please retry',
      editFailed: 'Image edit failed, please retry',
    },
    footer: {
      disclaimer: 'This tool uses AI to generate images. Results may differ from expectations. Generated content requires manual review before use.',
    },
  },
};

export function getTranslation(lang, key) {
  const keys = key.split('.');
  let result = translations[lang] || translations.zh;
  for (const k of keys) {
    result = result?.[k];
  }
  return result || key;
}

export function t(lang, key, params = {}) {
  let text = getTranslation(lang, key);
  if (typeof text !== 'string') return key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
}

export const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export default translations;
