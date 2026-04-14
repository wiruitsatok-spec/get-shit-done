const SAPLING_API_URL = 'https://api.sapling.ai/api/v1/aidetect';

// Retrieve the API key from extension storage (set once via options page or
// chrome.storage.sync.set({ saplingApiKey: 'YOUR_KEY' }) from the console).
async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('saplingApiKey', (result) => {
      resolve(result.saplingApiKey || null);
    });
  });
}

// POST text to Sapling /aidetect and return a 0-100 integer score.
// Sapling returns { score: 0.0–1.0 } where 1.0 = fully AI generated.
async function fetchSaplingScore(text, apiKey) {
  const response = await fetch(SAPLING_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: apiKey, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Sapling API error ${response.status}: ${body}`);
  }

  const data = await response.json();

  if (typeof data.score !== 'number') {
    throw new Error('Unexpected Sapling response format');
  }

  return Math.round(data.score * 100);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== 'getAiScore') return false;

  const { paragraphs } = message;

  if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
    sendResponse({ error: 'No paragraph text provided.' });
    return true;
  }

  // Sapling recommends >= 50 words for reliable detection.
  const text = paragraphs.join('\n\n');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) {
    sendResponse({ error: 'Not enough text for reliable analysis (need ≥ 50 words).' });
    return true;
  }

  // Sapling's free tier accepts up to ~5 000 characters per request.
  const truncated = text.length > 5000 ? text.slice(0, 5000) : text;

  (async () => {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        sendResponse({ error: 'Sapling API key not set. Add it via chrome.storage.sync.' });
        return;
      }

      const score = await fetchSaplingScore(truncated, apiKey);
      sendResponse({ score });
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();

  return true; // keep message channel open for async sendResponse
});
