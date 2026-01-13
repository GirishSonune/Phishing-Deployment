/**
 * Content script for Aegis Phishing Detector.
 * Version 1.2: The selection icon is now clickable and opens the project website.
 */

let elementCounter = 0;
// Guard used to avoid removing the selection icon while the user is
// interacting with it (prevents a race where selectionchange removes the
// icon before the click handler fires).
let ignoreSelectionRemoval = false;

// --- 1. LOGIC FOR INPUT FIELDS (FOCUS/BLUR) ---

function assignId(element) {
  if (!element.dataset.aegisId) {
    element.dataset.aegisId = `aegis-input-${elementCounter++}`;
  }
  return element.dataset.aegisId;
}

const handleFocus = (event) => {
  const element = event.target;
  const elementId = assignId(element);
  showMessage(elementId, 'Aegis is active', 'aegis-popup-active', element);
};

const handleBlur = (event) => {
  const element = event.target;
  // Get the value, handling both input/textarea and contenteditable
  const value = element.value || element.textContent;

  // Simple URL regex check (same as backend roughly)
  if (value && /^(http|https):\/\/[^ "]+$/.test(value)) {
    chrome.runtime.sendMessage({ action: "checkUrl", url: value }, (response) => {
      // Handle response if the element is still valid
      const elementId = element.dataset.aegisId;
      if (elementId && response) {
        let message = "Analysis failed";
        let style = "aegis-popup-neutral";

        if (response.prediction) {
          const isPhishing = response.prediction.toLowerCase() === 'phishing';
          message = `${response.prediction} (${response.riskScore ? response.riskScore.toFixed(1) + '%' : 'N/A'})`;
          style = isPhishing ? "aegis-popup-danger" : "aegis-popup-safe";
        } else if (response.error) {
          message = "Error: " + response.error;
        }

        showMessage(elementId, message, style, element);
      }
    });
  } else {
    // If not a URL, or empty, just remove any existing message
    const elementId = element.dataset.aegisId;
    if (elementId) {
      removeMessage(`aegis-popup-${elementId}`);
    }
  }
};

function initializeInputListeners() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="url"], textarea, input[type="email"], input[type="search"], div[contenteditable="true"]');
  inputs.forEach(input => {
    if (input.dataset.aegisListener) return;

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    input.dataset.aegisListener = 'true';
  });
}


// --- 2. LOGIC FOR TEXT SELECTION ---

const handleSelectionChange = () => {
  const selection = window.getSelection();
  // If a mouse/pointer event started on the popup we should not remove it
  // immediately (click is about to happen).
  if (ignoreSelectionRemoval) return;

  if (selection && !selection.isCollapsed) {
    const text = selection.toString().trim();
    if (text.length > 0) {
      const range = selection.getRangeAt(0);

      // If it looks like a URL, check it immediately
      if (/^(http|https):\/\/[^ "]+$/.test(text)) {
        chrome.runtime.sendMessage({ action: "checkUrl", url: text }, (response) => {
          if (response) {
            let message = "Analysis failed";
            let isPhishing = false;

            if (response.prediction) {
              isPhishing = response.prediction.toLowerCase() === 'phishing';
              message = `${response.prediction} (${response.riskScore ? response.riskScore.toFixed(1) + '%' : ''})`;
            }

            showSelectionIcon(range, message, isPhishing);
          }
        });
      } else {
        // Just show the icon as before if it's not clearly a URL (or maybe just ignore non-URLs?)
        // For now, let's keep the old behavior for non-URLs but pass no message
        showSelectionIcon(range, null, false);
      }
    }
  } else {
    removeMessage('aegis-selection-icon');
  }
};

function showSelectionIcon(range, message = null, isPhishing = false) {
  const iconId = 'aegis-selection-icon';
  removeMessage(iconId);

  const popup = document.createElement('div');
  popup.id = iconId;
  popup.className = 'aegis-selection-icon';

  // Icon content
  let iconSvg = `<svg viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px;"><path d="M12 2L1 9l4 2v7h14v-7l4-2L12 2zm0 4.34L17.5 10H6.5L12 6.34zM7 13h10v5H7v-5z"></path></svg>`;

  if (message) {
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.gap = '8px';
    popup.style.padding = '4px 8px';
    popup.style.borderRadius = '4px';
    popup.style.backgroundColor = isPhishing ? '#ffcccc' : '#ccffcc';
    popup.style.border = isPhishing ? '1px solid #cc0000' : '1px solid #00cc00';
    popup.style.color = isPhishing ? '#cc0000' : '#006600';
    popup.style.fontSize = '12px';
    popup.style.fontWeight = 'bold';
    popup.style.whiteSpace = 'nowrap';

    popup.innerHTML = iconSvg + `<span>${message}</span>`;
  } else {
    popup.innerHTML = iconSvg;
  }

  // Add the click event listener
  popup.addEventListener('pointerdown', (event) => {
    event.stopPropagation();
    ignoreSelectionRemoval = true;
    setTimeout(() => { ignoreSelectionRemoval = false; }, 350);
  });

  popup.addEventListener('click', (event) => {
    event.stopPropagation();
    try {
      chrome.runtime.sendMessage({ action: "openAegisWebsite" });
    } catch (err) {
      window.open('https://phishing-detection-bfezd0d4frh9ecfr.canadacentral-01.azurewebsites.net/', '_blank');
    }
    removeMessage(iconId);
  });

  document.body.appendChild(popup);

  let rect;
  try {
    rect = range.getBoundingClientRect();
  } catch (err) {
    const container = range.startContainer && range.startContainer.parentElement;
    rect = container ? container.getBoundingClientRect() : { top: 0, left: 0, width: 0 };
  }

  const iconX = window.scrollX + rect.left + Math.max(0, (rect.width - 28) / 2);
  const iconY = window.scrollY + rect.top - (message ? 40 : 36);
  popup.style.top = `${iconY}px`;
  popup.style.left = `${iconX}px`;
}


// --- 3. SHARED HELPER FUNCTIONS ---

function showMessage(elementId, text, styleClass, targetElement) {
  const popupId = `aegis-popup-${elementId}`;
  removeMessage(popupId);

  const popup = document.createElement('div');
  popup.id = popupId;
  popup.className = `aegis-popup ${styleClass}`;
  popup.textContent = text;
  document.body.appendChild(popup);

  const rect = targetElement.getBoundingClientRect();
  popup.style.top = `${window.scrollY + rect.top}px`;
  popup.style.left = `${window.scrollX + rect.right + 10}px`;
  popup.style.height = `${rect.height}px`;
}

function removeMessage(popupId) {
  const existingPopup = document.getElementById(popupId);
  if (existingPopup) {
    existingPopup.remove();
  }
}


// --- 4. INITIALIZATION ---

document.addEventListener('selectionchange', handleSelectionChange);
initializeInputListeners();
const observer = new MutationObserver(() => initializeInputListeners());
observer.observe(document.body, { childList: true, subtree: true });