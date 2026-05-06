# Insighta: AI Web Summarizer

Insighta is a Chrome Extension that leverages Google Gemini AI to instantly extract, analyze, and summarize web content. It provides a modern side panel interface featuring reading time estimations, key insights, and structured bulleted summaries.

## Installation and Setup

Follow these steps to set up the extension and its mandatory local proxy server.

### 1. Setup the API Proxy (Backend)

The extension requires a local proxy server to securely communicate with the Gemini AI API without exposing your API keys.

1.  Navigate into the `api-proxy` directory:
    ```bash
    cd api-proxy
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
    The server will now be running at `http://localhost:3000` or `http://localhost:3001` if the former is in use.

### 2. Install the Chrome Extension

1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** using the toggle in the top-right corner.
3.  Click **Load unpacked** in the top-left corner.
4.  Select the `extension` directory from this repository.

### 3. Usage

1.  Navigate to any readable webpage (such as a news article or blog post).
2.  Click the **Extensions** (puzzle piece) icon in your toolbar and select **Insighta**.
3.  Click **Summarize Page** to generate insights.

## Project Architecture

The application follows a secure client-server model:

1.  **Chrome Extension (Frontend):**
    - **Manifest V3:** Adheres to the latest Chrome extension standards.
    - **Content Scripting:** Dynamically extracts readable text using heuristic filtering to ignore navigation and footers.
    - **Background Service Worker:** Orchestrates communication between the UI and the proxy server.
    - **Storage API:** Utilizes `chrome.storage.local` to implement a persistent caching layer. Before any network request is initiated, the extension checks if a summary for the current URL already exists in local storage. If found, the cached data is retrieved and displayed instantly, completely bypassing the API call. This significantly reduces latency and prevents redundant processing costs.

2.  **API Proxy (Backend):**
    - **Next.js API Routes:** Securely holds the API keys and manages requests.
    - **Data Minimization:** Truncates input text to 10,000 characters for efficiency.
    - **Schema Enforcement:** Uses JSON schema validation to ensure the AI returns structured data.

## AI Integration Details

The extension utilizes the Gemini 1.5 Flash model through the `@google/generative-ai` SDK. The integration uses a structured prompt that instructs the AI to return a specific JSON object containing a bulleted summary, a single-sentence insight, and an estimated reading time based on a standard rate of 200 words per minute.

## Security Decisions

1.  **Proxy Server Architecture:** API keys are never stored within the extension source code or the browser. All AI requests are proxied through the local Next.js server where keys are kept as secure environment variables.
2.  **Data Minimization:** The extension only extracts inner text and further truncates it before transmission, ensuring minimal data exposure.
3.  **Sanitized Rendering:** The UI uses `textContent` and `innerText` for rendering AI content to prevent Cross-Site Scripting (XSS) attacks.

## Trade-offs and Technical Decisions

1.  **Vanilla JS vs. Frameworks:** We used vanilla JavaScript to keep the extension lightweight and high-performing.
2.  **Heuristic Scraping:** We implemented a custom heuristic scraper (filtering `nav`, `footer`, etc.) rather than a heavy library to keep the extension small while maintaining high accuracy for articles.
3.  **Side Panel vs. Popup:** The `sidePanel` API was chosen over a popup so users can view summaries while continuing to read the original page.
4.  **Local Storage Caching:** We implemented a per-URL cache to save bandwidth and API costs for frequently visited pages.

## Remote Deployment (Optional)

This project is also configured for deployment on Vercel. To deploy, set the Root Directory to `api-proxy` and add the `AI_API_KEY` as an environment variable in the Vercel dashboard.
