document.addEventListener('DOMContentLoaded', () => {
  const summarizeBtn = document.getElementById('summarize-btn');
  const retryBtn = document.getElementById('retry-btn');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const resultState = document.getElementById('result-state');
  const errorText = document.getElementById('error-text');
  const clearBtn = document.getElementById('clear-btn');

  // Result Elements
  const timeVal = document.getElementById('time-val');
  const insightContent = document.getElementById('insight-content');
  const summaryList = document.getElementById('summary-list');



  const showState = (state) => {
    summarizeBtn.classList.add('hidden');
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    resultState.classList.add('hidden');

    if (state === 'initial') {
      summarizeBtn.classList.remove('hidden');
    } else if (state === 'loading') {
      loadingState.classList.remove('hidden');
    } else if (state === 'error') {
      errorState.classList.remove('hidden');
    } else if (state === 'result') {
      resultState.classList.remove('hidden');
    }
  };

  const renderResult = (data) => {
    timeVal.textContent = `${data.readingTime} min read`;
    insightContent.textContent = data.insight;
    summaryList.innerHTML = '';
    data.summary.forEach(point => {
      const li = document.createElement('li');
      li.textContent = point;
      summaryList.appendChild(li);
    });
    showState('result');
  };

  const extractPageText = () => {
    // Basic extraction, removes scripts and styles text
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, nav, footer, iframe');
    elementsToRemove.forEach(el => el.remove());
    return clone.innerText || clone.textContent;
  };

  const handleSummarize = async () => {
    showState('loading');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.id) {
        throw new Error('Could not access active tab. Make sure you are on a webpage.');
      }

      // Check if it's a restricted URL (chrome://, edge://, etc)
      const url = tab.url || '';
      if (url.startsWith('chrome://') || url.startsWith('edge://') || url === '') {
        throw new Error('Cannot summarize browser internal pages.');
      }

      // Check Cache first
      const cachedData = await chrome.storage.local.get(url);
      if (cachedData[url]) {
        renderResult(cachedData[url]);
        return;
      }

      // Extract text from the page
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageText,
      });

      const extractedText = injectionResults[0]?.result;

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text found on this page.');
      }

      // Send to Background Script
      const response = await chrome.runtime.sendMessage({ 
        action: 'summarize', 
        text: extractedText 
      });

      if (!response.success) {
        throw new Error(response.error || 'Unknown error occurred in background script.');
      }

      const data = response.data;

      // Save to Cache
      await chrome.storage.local.set({ [url]: data });

      // Update UI
      renderResult(data);

    } catch (err) {
      console.error('Summarization error:', err);
      errorText.textContent = err.message || 'An unexpected error occurred.';
      showState('error');
    }
  };

  summarizeBtn.addEventListener('click', handleSummarize);
  retryBtn.addEventListener('click', () => showState('initial'));
  
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        await chrome.storage.local.remove(tab.url);
      }
      showState('initial');
    });
  }

  // Initial Check on Load
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const cachedData = await chrome.storage.local.get(tab.url);
        if (cachedData[tab.url]) {
          renderResult(cachedData[tab.url]);
        }
      }
    } catch (e) {
      console.warn('Failed to check initial cache', e);
    }
  })();
});
