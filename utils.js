/**
 * Utility functions shared across the extension
 */

/**
 * Normalize text for comparison (lowercase, trim, remove extra spaces)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Save data to chrome.storage.local
 * @param {Array} data - Array of label/value pairs
 * @returns {Promise<void>}
 */
async function saveData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ formData: data }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Load data from chrome.storage.local
 * @returns {Promise<Array>} Array of label/value pairs
 */
async function loadData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['formData'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.formData || []);
      }
    });
  });
}

/**
 * Generate a unique ID based on timestamp
 * @returns {number}
 */
function generateId() {
  return Date.now();
}

/**
 * Dispatch DOM events to trigger React/Vue framework listeners
 * @param {HTMLElement} element - The target element
 */
function triggerInputEvents(element) {
  // Create and dispatch input event
  const inputEvent = new Event('input', {
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(inputEvent);

  // Create and dispatch change event
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(changeEvent);

  // Also dispatch InputEvent for better framework compatibility
  if (typeof InputEvent !== 'undefined') {
    const inputEventTyped = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertText',
    });
    element.dispatchEvent(inputEventTyped);
  }
}

/**
 * Check if an input field matches a saved label
 * @param {HTMLElement} input - The input element
 * @param {string} label - The saved label to match against
 * @returns {boolean}
 */
function isMatchingInput(input, label) {
  const normalizedLabel = normalizeText(label);
  
  // Priority 1: Check ID attribute
  const id = normalizeText(input.id);
  if (id && id.includes(normalizedLabel)) {
    return true;
  }
  
  // Priority 1: Check name attribute
  const name = normalizeText(input.name);
  if (name && name.includes(normalizedLabel)) {
    return true;
  }
  
  // Priority 2: Check associated label element
  const labelElement = findLabelForInput(input);
  if (labelElement) {
    const labelText = normalizeText(labelElement.textContent);
    if (labelText.includes(normalizedLabel)) {
      return true;
    }
  }
  
  // Priority 3: Check placeholder attribute
  const placeholder = normalizeText(input.placeholder);
  if (placeholder && placeholder.includes(normalizedLabel)) {
    return true;
  }
  
  return false;
}

/**
 * Find the label element associated with an input
 * @param {HTMLElement} input - The input element
 * @returns {HTMLElement|null}
 */
function findLabelForInput(input) {
  // Method 1: Label with 'for' attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label;
  }
  
  // Method 2: Input wrapped in label
  let parent = input.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent;
    }
    parent = parent.parentElement;
  }
  
  // Method 3: Label that's a previous sibling
  let sibling = input.previousElementSibling;
  if (sibling && sibling.tagName === 'LABEL') {
    return sibling;
  }
  
  return null;
}

