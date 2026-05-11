# Product Shot Generator — 核心功能說明

**版本號：v1.0.0**  
**最後更新：2026-05-07**

---

## 一、系統概述

本應用為一個 AI 驅動的電商形象照生成平台，採用 CrewAI 多 Agent 協作架構（JS 實作），搭配 Google Gemini Image Generation 模型（Nano Banana）生成產品/模特兒形象照。

**部署方式**：GitHub → Vercel（純前端靜態部署）  
**API 呼叫方式**：瀏覽器端直接呼叫 Gemini API（API Key 由使用者輸入，儲存於 localStorage）

---

## 二、CrewAI 多 Agent 工作流

### 2.1 Agent 角色與分工

| # | Agent | 角色 | 使用模型 | 職責 |
|---|-------|------|---------|------|
| 1 | Creative Director | 創意總監 | gemini-2.5-flash | 分析產品結構（左右前後）、規劃每張照片的獨特拍攝角度、建立 Product Anatomy Map |
| 2 | Prompt Engineer | 提示詞工程師 | gemini-2.5-flash | 將拍攝方案轉化為 Gemini 最佳化 prompt，包含 Identity Block + Spatial Direction Block |
| 3 | Photographer | 攝影師 | gemini-2.5-flash-preview-image-generation | 調用 Gemini Image Gen 模型，傳入參考圖 + prompt 生成形象照 |
| 4 | Quality Inspector | 品質審核官 | gemini-2.5-flash | 比對原始產品圖 vs 生成圖，檢查 Logo/釦飾/圖案位置一致性、空間準確度、專業品質 |
| 5 | Photo Editor | 修圖師 | gemini-2.5-flash-preview-image-generation | 僅在使用者手動要求修改時啟動，根據修改意見編輯圖片 |

### 2.2 自動重拍迴圈

```
Creative Director → Prompt Engineer → Photographer → Quality Inspector
                                                          │
                                                    通過? ─┤
                                                          │
                                              ┌─ YES → 完成
                                              └─ NO  → 回到 Prompt Engineer（攜帶失敗原因）
                                                          │
                                                     最多重試 2 次
                                                          │
                                                   取分數較高的版本
```

- 只重拍不合格的照片，不浪費 API 額度
- 重試時 Prompt Engineer 會收到具體失敗原因（如「Logo 跑到右腳」），針對性修正 prompt

### 2.3 產品一致性機制（鞋類等不對稱產品）

| 機制 | 說明 |
|------|------|
| Product Anatomy Map | 創意總監先分析產品的左右前後各有什麼裝飾，建立空間地圖 |
| Identity Block | 提示詞工程師建立固定的產品描述模板，所有照片共用，確保一致性 |
| Spatial Direction Block | 每張照片標註「相機位置 → 可見面 → 該出現的裝飾」，避免 AI 搞混方向 |
| 比對審核 | 品質審核官同時看原始產品圖和生成圖，逐項檢查 Logo、釦飾、圖案是否在正確位置 |

---

## 三、前端功能

### 3.1 輸入表單

| 欄位 | 類型 | 說明 |
|------|------|------|
| Gemini API Key | password input | 儲存於 localStorage，不傳送至伺服器 |
| 模特兒照片 | 圖片上傳（拖放/點擊） | 選填，作為模特兒參考圖 |
| 產品照片 | 圖片上傳（拖放/點擊） | **必填**，作為產品參考圖 |
| 拍攝地點 | text input | 選填 |
| 季節與時間 | text input | 選填 |
| 重點補充 | textarea | 選填，強調產品特色 |
| 形象照類型 | toggle | 模特兒形象照 / 產品形象照 |
| 生成張數 | selector | 1-6 張 |
| 圖片比例 | pills | 1:1、16:9、9:16、4:3、3:4（一次只能選一個） |

### 3.2 生成進度追蹤

- 即時百分比顯示（0-100%）
- 當前 Agent 步驟指示器（4 步 + 完成）
- 可隨時取消

### 3.3 結果預覽與下載

| 功能 | 說明 |
|------|------|
| 預覽圖網格 | 根據選擇的比例顯示 |
| 品質分數 | 每張圖顯示 🎯 產品一致性分數 + ⭐ 總分 |
| 問題標記 | 如有產品一致性問題，以 ⚠️ 顯示具體問題 |
| 單張下載 | hover 照片 → 點擊下載按鈕 |
| 全部打包下載 | 一鍵產生 ZIP 檔（使用 JSZip） |

### 3.4 圖片修改

- 點選預覽圖的「✏️ 修改」按鈕
- 彈出 Modal，顯示原圖 + 修改意見輸入欄
- 提交後由 Photo Editor Agent 執行修改
- 修改完畢自動替換預覽圖

### 3.5 國際化 (i18n)

- 支援中文（zh）與英文（en）
- 右上角一鍵切換
- 語言偏好儲存於 localStorage

---

## 四、技術堆疊

| 層級 | 技術 | 用途 |
|------|------|------|
| 前端框架 | Vite + React | SPA 應用 |
| 樣式 | Vanilla CSS | 深色主題、glassmorphism、動畫 |
| 狀態管理 | React Context + useReducer | 全域狀態 |
| AI 模型 | Google Gemini API (@google/genai) | 文字推理 + 圖片生成 |
| 檔案打包 | JSZip + FileSaver.js | ZIP 下載 |
| 部署 | Vercel | 靜態網站 |

---

## 五、檔案結構

```
product-shots/
├── index.html                          # HTML 入口
├── package.json                        # 依賴管理
├── vite.config.js                      # Vite 設定
├── vercel.json                         # Vercel 部署設定
├── CORE_FEATURES.md                    # 本文件
├── CHANGELOG.md                        # 版控文件
├── src/
│   ├── main.jsx                        # React 入口
│   ├── App.jsx                         # 主應用（流程控制）
│   ├── index.css                       # 設計系統
│   ├── agents/
│   │   └── orchestrator.js             # CrewAI 5-Agent 工作流 + 自動重拍
│   ├── components/
│   │   ├── Header.jsx                  # 品牌 + 語言切換
│   │   ├── UploadForm.jsx              # 上傳 + 表單
│   │   ├── ProgressTracker.jsx         # 進度追蹤
│   │   ├── ImageGallery.jsx            # 預覽 + 下載
│   │   ├── EditModal.jsx               # 修改彈窗
│   │   └── ErrorToast.jsx              # 錯誤通知
│   ├── contexts/
│   │   └── AppContext.jsx              # 全域狀態管理
│   └── utils/
│       ├── gemini.js                   # Gemini API 封裝
│       └── i18n.js                     # 中英文翻譯
```

---

## 六、API 呼叫量估算

以 **生成 4 張照片、無重拍** 為例：

| Agent | 呼叫次數 | 模型 |
|-------|---------|------|
| Creative Director | 1 | flash (text) |
| Prompt Engineer | 1 | flash (text) |
| Photographer | 4 | flash-image (image gen) |
| Quality Inspector | 4 | flash (text + vision) |
| **合計** | **10 次** | |

如有重拍（假設 1 張重拍 1 次）：額外 +3 次（PE + Photographer + QI）= **13 次**

---

## 七、已知限制

1. **圖片一致性非 100%**：Gemini Image Gen 在不對稱產品上仍可能出錯，自動重拍機制可降低但無法完全消除問題
2. **API Key 暴露風險**：API Key 存在瀏覽器端，適用於個人/團隊內部工具，不適合公開對外服務
3. **無歷史紀錄**：生成結果為 session-based，關閉瀏覽器後圖片消失，需在當次下載
4. **Vercel Timeout**：如未來改為後端呼叫，需注意 Vercel serverless 的 timeout 限制
