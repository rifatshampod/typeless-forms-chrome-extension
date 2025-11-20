/**
 * Content Script - Form Auto-Filling Logic
 * This script runs on web pages to fill forms based on saved data
 */

(async function() {
  console.log('Form Auto-Filler: Starting form fill process...');
  
  try {
    // Load saved data
    const formData = await loadData();
    
    if (!formData || formData.length === 0) {
      console.log('Form Auto-Filler: No saved data found');
      showNotification('No saved form data found. Please add some in the extension popup.', 'warning');
      return;
    }
    
    console.log(`Form Auto-Filler: Loaded ${formData.length} saved pair(s)`);
    
    // Find and fill form fields
    const result = fillFormFields(formData);
    
    // Show result notification
    if (result.filled > 0) {
      showNotification(
        `Successfully filled ${result.filled} field(s). ${result.skipped} field(s) skipped (already filled).`,
        'success'
      );
      console.log(`Form Auto-Filler: Filled ${result.filled} field(s), skipped ${result.skipped}`);
    } else {
      showNotification(
        'No matching form fields found on this page.',
        'info'
      );
      console.log('Form Auto-Filler: No matching fields found');
    }
  } catch (error) {
    console.error('Form Auto-Filler Error:', error);
    showNotification('An error occurred while filling the form.', 'error');
  }
})();

/**
 * Fill form fields based on saved data
 * @param {Array} formData - Array of saved label/value pairs
 * @returns {Object} Result with filled and skipped counts
 */
function fillFormFields(formData) {
  let filledCount = 0;
  let skippedCount = 0;
  
  // Get all input and textarea elements
  const inputs = document.querySelectorAll('input, textarea');
  
  console.log(`Form Auto-Filler: Found ${inputs.length} input field(s) on page`);
  
  // Iterate through each input
  inputs.forEach(input => {
    // Skip if input already has a value
    if (input.value && input.value.trim() !== '') {
      skippedCount++;
      return;
    }
    
    // Skip certain input types
    const skipTypes = ['submit', 'button', 'reset', 'file', 'image', 'hidden'];
    if (input.type && skipTypes.includes(input.type.toLowerCase())) {
      return;
    }
    
    // Skip if input is disabled or readonly
    if (input.disabled || input.readOnly) {
      return;
    }
    
    // Try to find a matching saved pair
    const matchedPair = findMatchingPair(input, formData);
    
    if (matchedPair) {
      // Fill the input
      fillInput(input, matchedPair.value);
      filledCount++;
      
      console.log(`Form Auto-Filler: Filled field (label: "${matchedPair.label}") with value`);
    }
  });
  
  return { filled: filledCount, skipped: skippedCount };
}

/**
 * Find a matching saved pair for an input element
 * @param {HTMLElement} input - The input element
 * @param {Array} formData - Array of saved pairs
 * @returns {Object|null} Matched pair or null
 */
function findMatchingPair(input, formData) {
  // Try each saved pair
  for (const pair of formData) {
    if (isMatchingInput(input, pair.label)) {
      return pair;
    }
  }
  
  return null;
}

/**
 * Fill an input element with a value
 * @param {HTMLElement} input - The input element
 * @param {string} value - The value to fill
 */
function fillInput(input, value) {
  // Set the value using multiple methods for better compatibility
  
  // Method 1: Direct property setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  ).set;
  
  if (input.tagName === 'TEXTAREA') {
    nativeTextAreaValueSetter.call(input, value);
  } else {
    nativeInputValueSetter.call(input, value);
  }
  
  // Method 2: Also set via attribute for fallback
  input.setAttribute('value', value);
  
  // Method 3: Trigger all necessary events for React/Vue/Angular compatibility
  triggerInputEvents(input);
  
  // Additional React-specific events
  triggerReactEvents(input);
  
  // Visual feedback
  highlightInput(input);
}

/**
 * Trigger React-specific events for better compatibility
 * @param {HTMLElement} element - The target element
 */
function triggerReactEvents(element) {
  // React uses synthetic events, but also listens to native events
  // Trigger events that React specifically listens for
  
  // Focus event
  element.focus();
  
  // React onChange trigger
  const reactOnChangeEvent = new Event('change', {
    bubbles: true,
    cancelable: false,
  });
  element.dispatchEvent(reactOnChangeEvent);
  
  // Blur event (some forms validate on blur)
  setTimeout(() => {
    element.blur();
  }, 50);
}

/**
 * Highlight input temporarily to show it was filled
 * @param {HTMLElement} input - The input element
 */
function highlightInput(input) {
  const originalBackground = input.style.background;
  const originalTransition = input.style.transition;
  
  input.style.transition = 'background 0.3s ease';
  input.style.background = '#d4f4dd';
  
  setTimeout(() => {
    input.style.background = originalBackground;
    setTimeout(() => {
      input.style.transition = originalTransition;
    }, 300);
  }, 1000);
}

/**
 * Show a notification on the page
 * @param {string} message - The message to show
 * @param {string} type - Type of notification (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existingNotif = document.getElementById('form-autofiller-notification');
  if (existingNotif) {
    existingNotif.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'form-autofiller-notification';
  notification.textContent = message;
  
  // Styling
  const colors = {
    success: { bg: '#48bb78', border: '#38a169' },
    error: { bg: '#f56565', border: '#e53e3e' },
    warning: { bg: '#ed8936', border: '#dd6b20' },
    info: { bg: '#4299e1', border: '#3182ce' }
  };
  
  const color = colors[type] || colors.info;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: color.bg,
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '999999',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '400px',
    animation: 'slideInFromRight 0.3s ease-out',
    border: `2px solid ${color.border}`
  });
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInFromRight {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOutToRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutToRight 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 4000);
}

