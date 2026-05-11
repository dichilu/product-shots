# Product Shot Generator — 版控文件 (CHANGELOG)

---

## [v1.0.0] — 2026-05-07

### 🎉 初始版本

#### 新增功能
- **CrewAI 5-Agent 工作流**
  - Creative Director：產品空間分析 + 拍攝方案規劃
  - Prompt Engineer：Identity Block + Spatial Direction Block prompt 建構
  - Photographer：Gemini Image Gen (Nano Banana) 圖片生成
  - Quality Inspector：產品一致性比對審核（含原圖比對）
  - Photo Editor：使用者手動修改圖片

- **自動重拍迴圈**
  - 品質審核不通過 → 自動修正 prompt → 重新生成
  - 最多重試 2 次，取分數較高版本
  - 只重拍失敗照片，節省 API 額度

- **產品一致性強化**
  - Product Anatomy Map（左右前後裝飾地圖）
  - 每張照片標註相機位置 vs 可見裝飾
  - 品質審核包含 Logo/釦飾/圖案位置檢查
  - 適用不對稱產品（鞋類、包款等）

- **前端 UI**
  - 深色主題 + glassmorphism 設計系統
  - 模特兒/產品圖片上傳（拖放 + 點擊）
  - 拍攝地點、季節時間、重點補充文字欄位
  - 形象照類型選擇（模特兒/產品）
  - 生成張數選擇（1-6 張）
  - 圖片比例選擇（1:1, 16:9, 9:16, 4:3, 3:4）
  - 即時進度百分比 + Agent 步驟追蹤
  - 預覽圖網格 + 品質分數 + 問題標記
  - 單張下載 / ZIP 全部打包下載
  - 修改彈窗（輸入意見 → Photo Editor 執行）

- **國際化**
  - 中文（zh）、英文（en）雙語支援
  - 右上角一鍵切換，偏好存於 localStorage

- **部署**
  - Vite + React 專案結構
  - Vercel 部署設定（vercel.json）
  - Production build 通過驗證

#### 技術堆疊
- Vite 8.x + React 19.x
- @google/genai 1.52+ (Gemini API)
- JSZip + FileSaver.js
- Vanilla CSS（深色主題）

#### 檔案清單（12 個原始碼檔案）
```
index.html, package.json, vite.config.js, vercel.json,
src/main.jsx, src/App.jsx, src/index.css,
src/agents/orchestrator.js,
src/components/Header.jsx, src/components/UploadForm.jsx,
src/components/ProgressTracker.jsx, src/components/ImageGallery.jsx,
src/components/EditModal.jsx, src/components/ErrorToast.jsx,
src/contexts/AppContext.jsx,
src/utils/gemini.js, src/utils/i18n.js
```

---

## 版本規則

- **Major (x.0.0)**：架構變更（如改用 Python CrewAI 後端）
- **Minor (0.x.0)**：新增功能（如新增語言、新 Agent）
- **Patch (0.0.x)**：Bug 修復、prompt 調優、UI 微調
