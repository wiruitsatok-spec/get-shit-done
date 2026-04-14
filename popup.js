// Arc path total length for the semicircle (radius 90, half circumference ≈ 283)
const ARC_LENGTH = 283;

const arcFill   = document.getElementById('arc-fill');
const scoreNum  = document.getElementById('score-num');
const verdict   = document.getElementById('verdict');
const verdictTxt = document.getElementById('verdict-text');
const paraCount = document.getElementById('para-count');
const wordCount = document.getElementById('word-count');
const confidence = document.getElementById('confidence');
const analyzeBtn = document.getElementById('analyze-btn');
const status    = document.getElementById('status');

function getColor(score) {
  if (score >= 67) return { hex: '#ef4444', cls: 'red' };
  if (score >= 34) return { hex: '#eab308', cls: 'yellow' };
  return { hex: '#22c55e', cls: '' };
}

function getVerdict(score) {
  if (score >= 67) return 'Likely AI Generated';
  if (score >= 34) return 'Possibly AI Assisted';
  return 'Human Written';
}

function setScore(score) {
  const filled = (score / 100) * ARC_LENGTH;
  arcFill.setAttribute('stroke-dasharray', `${filled} ${ARC_LENGTH}`);

  const { hex, cls } = getColor(score);
  arcFill.style.stroke = hex;

  scoreNum.textContent = score;

  verdict.className = `verdict ${cls}`.trim();
  verdictTxt.textContent = getVerdict(score);
}

// Heuristic scoring: measures patterns common in AI-generated text.
// Returns a 0-100 integer. This is intentionally simple — swap in a
// real model call (e.g. chrome.runtime → background fetch) as needed.
function scoreText(paragraphs) {
  if (paragraphs.length === 0) return 0;

  const full = paragraphs.join(' ');
  const words = full.split(/\s+/).filter(Boolean);
  if (words.length < 20) return 0;

  let points = 0;
  let checks = 0;

  // 1. Average sentence length (AI tends toward 18-30 words)
  const sentences = full.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentLen = words.length / Math.max(sentences.length, 1);
  checks++;
  if (avgSentLen >= 18 && avgSentLen <= 30) points++;

  // 2. Low type-token ratio → less lexical diversity (AI repeats more)
  const unique = new Set(words.map(w => w.toLowerCase()));
  const ttr = unique.size / words.length;
  checks++;
  if (ttr < 0.6) points++;

  // 3. Filler / transition phrases common in AI text
  const aiPhrases = [
    /\bit is (important|worth|essential|crucial|notable) to\b/i,
    /\bin (conclusion|summary|this (article|post|piece))\b/i,
    /\bfurthermore\b/i,
    /\bmoreover\b/i,
    /\badditionally\b/i,
    /\bdelve\b/i,
    /\btailored\b/i,
    /\bseamless(ly)?\b/i,
    /\bultimately\b/i,
    /\bembark\b/i,
  ];
  const phraseHits = aiPhrases.filter(r => r.test(full)).length;
  checks++;
  if (phraseHits >= 2) points++;
  if (phraseHits >= 4) points++; // double-weight heavy usage

  // 4. Consistent paragraph length variance (AI tends to be uniform)
  const lengths = paragraphs.map(p => p.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
  checks++;
  if (variance < mean * 0.5) points++;

  // 5. Low first-person pronoun use
  const firstPerson = (full.match(/\b(i|i'm|i've|i'd|i'll|my|mine|myself)\b/gi) || []).length;
  const fpRate = firstPerson / words.length;
  checks++;
  if (fpRate < 0.005) points++;

  const raw = points / (checks || 1);
  // Map 0-1 → 5-95 so the needle never sits at the absolute extremes
  return Math.round(5 + raw * 90);
}

analyzeBtn.addEventListener('click', async () => {
  analyzeBtn.disabled = true;
  status.textContent = 'Scanning page…';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    chrome.tabs.sendMessage(tab.id, { action: 'extractParagraphs' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        status.textContent = 'Could not read page content.';
        analyzeBtn.disabled = false;
        return;
      }

      const paras = response.paragraphs;
      const words = paras.join(' ').split(/\s+/).filter(Boolean);

      // Ask background.js to call Sapling; fall back to local heuristic.
      chrome.runtime.sendMessage({ action: 'getAiScore', paragraphs: paras }, (aiResp) => {
        const score = (aiResp && typeof aiResp.score === 'number')
          ? aiResp.score
          : scoreText(paras);
        const conf = score >= 67 || score <= 33 ? 'High' : 'Medium';

        setScore(score);
        paraCount.textContent = paras.length;
        wordCount.textContent = words.length >= 1000
          ? `${(words.length / 1000).toFixed(1)}k`
          : words.length;
        confidence.textContent = conf;

        const src = (aiResp && aiResp.score != null) ? 'Sapling AI' : 'local heuristic';
        status.textContent = `Analyzed ${paras.length} paragraph${paras.length !== 1 ? 's' : ''} via ${src}.`;
        analyzeBtn.disabled = false;
      });
    });
  } catch (err) {
    status.textContent = `Error: ${err.message}`;
    analyzeBtn.disabled = false;
  }
});
