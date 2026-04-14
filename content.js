function isVisible(element) {
  const style = window.getComputedStyle(element);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function extractParagraphText() {
  const paragraphs = document.querySelectorAll('p');
  const texts = [];

  for (const p of paragraphs) {
    if (!isVisible(p)) continue;
    const text = p.innerText.trim();
    if (text.length > 0) {
      texts.push(text);
    }
  }

  return texts;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'extractParagraphs') {
    sendResponse({ paragraphs: extractParagraphText() });
  }
});
