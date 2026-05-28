# AI Product Shot Generator (AI 形象照生成器)

這是一款專為電商打造的「多智能體 (Multi-Agent) 商業攝影產生器」。利用 Gemini 的多模態與強大的 Prompt 解析能力，讓使用者只需上傳「模特兒」與「商品」照片，就能自動產出高品質、特徵一致的商業形象照。

## 🌟 核心特色
- **明亮企業級 UI**：乾淨、直覺的無干擾操作介面。
- **5 Agent 自動工作流**：從企劃 (Creative Director)、下咒 (Prompt Engineer)、攝影 (Photographer)、品管 (Quality Inspector) 到修圖 (Photo Editor) 全自動完成。
- **商品特徵絕對鎖定**：採用獨家的「Prompt 改寫引擎」，即使事後修改背景或風格，商品的 Logo、扣飾等不對稱特徵也絕對不會跑位或消失。
- **全端無伺服器架構**：純前端 Vite + React 應用，邏輯全在 Client Side 執行，完美避開 Serverless 函式逾時限制，最適合部署於 Vercel。

## 🚀 部署至 Vercel

1. 將本專案推送到您的 GitHub 儲存庫：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <您的_GITHUB_REPO_URL>
   git push -u origin main
   ```
2. 登入 [Vercel](https://vercel.com/)，點擊 **Add New... > Project**。
3. 匯入您的 GitHub 儲存庫。
4. 在 **Environment Variables** 區塊中，務必新增以下變數：
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `您在 Google AI Studio 申請的 API Key`
5. 點擊 **Deploy**，等待部署完成！

## 💻 本地端開發

1. 安裝依賴：
   ```bash
   npm install
   ```
2. 在專案根目錄建立 `.env` 檔案，寫入：
   ```env
   VITE_GEMINI_API_KEY=您的_API_KEY
   ```
3. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

## 🛠️ 技術棧
- React + Vite
- Google GenAI SDK (`@google/genai`)
- JSZip & FileSaver (用於圖片封裝下載)

---
*測試 GitHub 到 Vercel 自動部署同步機制 (2026-05-28)*
