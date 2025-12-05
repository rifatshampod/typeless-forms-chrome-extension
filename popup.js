/**
 * Popup UI Logic
 * Handles CRUD operations for label/value pairs
 */

// DOM Elements
const labelInput = document.getElementById('label-input');
const valueInput = document.getElementById('value-input');
const addBtn = document.getElementById('add-btn');
const pairsList = document.getElementById('pairs-list');
const countBadge = document.getElementById('count-badge');
const fillFormBtn = document.getElementById('fill-form-btn');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');

// State
let formData = [];
let searchQuery = '';
let filteredData = [];

/**
 * Initialize the popup
 */
async function init() {
  await loadAndRender();
  attachEventListeners();
}

/**
 * Load data from storage and render
 */
async function loadAndRender() {
  try {
    formData = await loadData();
    filteredData = formData; // Initialize filtered data
    renderPairsList();
    updateCountBadge();
  } catch (error) {
    console.error('Error loading data:', error);
    showError('Failed to load saved data');
  }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  addBtn.addEventListener('click', handleAddPair);
  fillFormBtn.addEventListener('click', handleFillForm);
  
  // Search functionality
  searchInput.addEventListener('input', handleSearchInput);
  clearSearchBtn.addEventListener('click', handleClearSearch);
  
  // Allow Enter key to add pair
  labelInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      valueInput.focus();
    }
  });
  
  valueInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddPair();
    }
  });
}

/**
 * Handle adding a new label/value pair
 */
async function handleAddPair() {
  const label = labelInput.value.trim();
  const value = valueInput.value.trim();
  
  // Validation
  if (!label) {
    showError('Please enter a label');
    labelInput.focus();
    return;
  }
  
  if (!value) {
    showError('Please enter a value');
    valueInput.focus();
    return;
  }
  
  // Check for duplicate labels
  const existingPair = formData.find(
    pair => normalizeText(pair.label) === normalizeText(label)
  );
  
  if (existingPair) {
    // Update existing pair
    existingPair.value = value;
    showSuccess('Updated existing pair');
  } else {
    // Add new pair
    const newPair = {
      id: generateId(),
      label: label,
      value: value
    };
    formData.push(newPair);
    showSuccess('Pair added successfully');
  }
  
  // Save and render
  try {
    await saveData(formData);
    performSearch(); // Re-apply search filter
    
    // Clear inputs
    labelInput.value = '';
    valueInput.value = '';
    labelInput.focus();
  } catch (error) {
    console.error('Error saving data:', error);
    showError('Failed to save data');
  }
}

/**
 * Handle deleting a pair
 * @param {number} id - The ID of the pair to delete
 */
async function handleDeletePair(id) {
  // Find the pair to get its details for the confirmation message
  const pair = formData.find(p => p.id === id);
  if (!pair) return;
  
  // Show confirmation dialog
  const confirmed = confirm(
    `Delete this field?\n\nLabel: ${pair.label}\nValue: ${pair.value}\n\nThis action cannot be undone.`
  );
  
  if (!confirmed) {
    return; // User cancelled, don't delete
  }
  
  // Proceed with deletion
  formData = formData.filter(pair => pair.id !== id);
  
  try {
    await saveData(formData);
    performSearch(); // Re-apply search filter
    showSuccess('Pair deleted');
  } catch (error) {
    console.error('Error deleting pair:', error);
    showError('Failed to delete pair');
  }
}

/**
 * Handle copying a value to clipboard
 * @param {string} value - The value to copy
 * @param {HTMLElement} button - The button element that was clicked
 */
async function handleCopyValue(value, button) {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      showCopyFeedback(button, true);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopyFeedback(button, success);
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showCopyFeedback(button, false);
  }
}

/**
 * Show visual feedback for copy action
 * @param {HTMLElement} button - The copy button element
 * @param {boolean} success - Whether the copy was successful
 */
function showCopyFeedback(button, success) {
  const originalHTML = button.innerHTML;
  const originalBackground = button.style.background;
  
  if (success) {
    button.innerHTML = '✓';
    button.style.background = '#48bb78';
    button.style.color = 'white';
  } else {
    button.innerHTML = '✗';
    button.style.background = '#f56565';
    button.style.color = 'white';
  }
  
  setTimeout(() => {
    button.innerHTML = originalHTML;
    button.style.background = originalBackground;
    button.style.color = '';
  }, 1500);
}

/**
 * Handle search input
 */
function handleSearchInput(e) {
  const query = e.target.value;
  searchQuery = query.toLowerCase().trim();
  
  // Show/hide clear button
  if (query) {
    clearSearchBtn.style.display = 'block';
  } else {
    clearSearchBtn.style.display = 'none';
  }
  
  // Filter data
  performSearch();
}

/**
 * Handle clear search button click
 */
function handleClearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.style.display = 'none';
  performSearch();
  searchInput.focus();
}

/**
 * Perform search and update UI
 */
function performSearch() {
  if (!searchQuery) {
    filteredData = formData;
  } else {
    filteredData = formData.filter(pair => 
      pair.label.toLowerCase().includes(searchQuery) ||
      pair.value.toLowerCase().includes(searchQuery)
    );
  }
  
  renderPairsList();
  updateCountBadge();
}

/**
 * Handle filling form on current page
 */
async function handleFillForm() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      showError('No active tab found');
      return;
    }
    
    // Check if it's a valid URL (not chrome:// or other restricted pages)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      showError('Cannot fill forms on this page');
      return;
    }
    
    // Inject and execute content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['utils.js', 'content.js']
    });
    
    showSuccess('Form filling triggered!');
    
    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 800);
  } catch (error) {
    console.error('Error filling form:', error);
    showError('Failed to fill form. Make sure you have permission for this page.');
  }
}

/**
 * Render the pairs list
 */
function renderPairsList() {
  // Show empty state if no data at all
  if (formData.length === 0) {
    pairsList.innerHTML = '<p class="empty-state">No saved pairs yet. Add one above!</p>';
    return;
  }
  
  // Show "no results" if search returned nothing
  if (filteredData.length === 0) {
    pairsList.innerHTML = `<p class="empty-state">No fields match "${escapeHtml(searchQuery)}"</p>`;
    return;
  }
  
  // Render filtered data
  pairsList.innerHTML = filteredData
    .map(pair => createPairItemHTML(pair))
    .join('');
  
  // Attach copy event listeners
  const copyButtons = pairsList.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const value = e.target.dataset.value;
      handleCopyValue(value, e.target);
    });
  });
  
  // Attach delete event listeners
  const deleteButtons = pairsList.querySelectorAll('.delete-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      handleDeletePair(id);
    });
  });
}

/**
 * Create HTML for a single pair item
 * @param {Object} pair - The pair object
 * @returns {string} HTML string
 */
function createPairItemHTML(pair) {
  return `
    <div class="pair-item">
      <div class="pair-content">
        <div class="pair-label">${escapeHtml(pair.label)}</div>
        <div class="pair-value">${escapeHtml(pair.value)}</div>
      </div>
      <div class="pair-actions">
        <button class="copy-btn" data-value="${escapeHtml(pair.value)}" title="Copy value to clipboard">⧉</button>
        <button class="delete-btn" data-id="${pair.id}" title="Delete">×</button>
      </div>
    </div>
  `;
}

/**
 * Update the count badge
 */
function updateCountBadge() {
  if (searchQuery) {
    // Show "X of Y" when searching
    countBadge.textContent = `${filteredData.length} of ${formData.length}`;
  } else {
    // Show total count when not searching
    countBadge.textContent = formData.length;
  }
}

/**
 * Show success message
 * @param {string} message
 */
function showSuccess(message) {
  // Simple visual feedback - could be enhanced with a toast notification
  addBtn.textContent = '✓ ' + message;
  addBtn.style.background = '#48bb78';
  
  setTimeout(() => {
    addBtn.textContent = 'Add Pair';
    addBtn.style.background = '';
  }, 2000);
}

/**
 * Show error message
 * @param {string} message
 */
function showError(message) {
  // Simple visual feedback - could be enhanced with a toast notification
  addBtn.textContent = '✗ ' + message;
  addBtn.style.background = '#f56565';
  
  setTimeout(() => {
    addBtn.textContent = 'Add Pair';
    addBtn.style.background = '';
  }, 2000);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}


