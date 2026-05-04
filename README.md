# Insighta: AI Web Summarizer

Insighta is a Chrome Extension that leverages Gemini AI to instantly extract, analyze, and summarize any readable webpage you visit. It provides a clean, modern side panel UI with reading time estimations, key insights, and bulleted summaries.

The project is built using a secure client-server architecture:
1. **Chrome Extension (Client):** A Manifest V3 extension built with Vanilla JS, HTML, and CSS that handles text extraction and UI presentation via a Side Panel.
2. **Next.js Proxy (Server):** A Next.js API route that securely holds the Gemini AI API keys and communicates with the AI models to process the extracted text.

---

## Installation Guide

Because this extension uses an external API proxy, you must run the local proxy server before installing the extension into your browser.

### Step 1: Set up the API Proxy
1. Clone this repository to your local machine.
2. Open your terminal and navigate into the `api-proxy` directory:
   ```bash
   cd api-proxy
   ```
3. Install the required dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file inside the `api-proxy` directory and add your Google Gemini API key:
   ```env
   AI_API_KEY=your_gemini_api_key_here
   ```
5. Start the Next.js proxy server:
   ```bash
   npm run dev
   ```
   *The server should now be running on `http://localhost:3000` (or `3001` depending on port availability).*

### Step 2: Install the Chrome Extension locally
This extension is designed to run locally and is not hosted on the Chrome Web Store. To install it:

1. Open Google Chrome.
2. Type `chrome://extensions/` into the URL bar and press Enter.
3. In the top right corner, toggle on **Developer mode**.
4. In the top left corner, click the **Load unpacked** button.
5. In the file picker, navigate to this project's folder and select the `extension` directory.
6. The Insighta extension will now appear in your list of installed extensions!

### Step 3: Use the Extension
1. Navigate to any article, blog post, or readable website (e.g., Wikipedia).
2. Click the **Extensions puzzle piece icon** in the top right of your browser toolbar.
3. Click the **Insighta** icon to open the Side Panel.
4. Click the **"Summarize this page"** button and wait a few seconds for the AI to generate your insights!

---

## Architecture & Data Flow

- **sidepanel.js**: Triggers a content script to scrape the active page's readable text, ignoring navigation and footer elements. It then uses `chrome.runtime.sendMessage` to pass the text to the background script.
- **background.js**: Acts as the orchestrator. It receives the text, makes an asynchronous `POST` request to the local Next.js proxy, and passes the generated JSON summary back to the side panel.
- **route.js (API Proxy)**: Receives the payload, enforces data minimization (limits text to 10k characters), and queries the `gemini-2.5-flash` model, enforcing a strict JSON schema for the response.
