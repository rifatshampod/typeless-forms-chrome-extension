# Extension Architecture

A detailed overview of how the Custom Form Auto-Filler extension works.

## 📊 Component Overview

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERFACE                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │           popup.html + popup.css                 │  │
│  │  • Input fields for Label/Value                  │  │
│  │  • Display saved pairs                           │  │
│  │  • "Fill Form" trigger button                    │  │
│  └────────────────┬─────────────────────────────────┘  │
│                   │                                      │
│                   v                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │              popup.js                            │  │
│  │  • Handle UI interactions                        │  │
│  │  • CRUD operations                               │  │
│  │  • Trigger form filling                          │  │
│  └────────────────┬─────────────────────────────────┘  │
└───────────────────┼──────────────────────────────────────┘
                    │
                    v
        ┌───────────────────────┐
        │  chrome.storage.local │
        │                       │
        │  [{ id, label, value }]│
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        v                       v
┌───────────────┐       ┌──────────────────┐
│ background.js │       │   content.js     │
│               │       │                  │
│ • Service     │       │ • Runs on web    │
│   worker      │       │   pages          │
│ • Context     │◄──────┤ • Smart matching │
│   menu        │       │ • Fill inputs    │
│ • Inject      │       │ • Dispatch events│
│   scripts     │       │ • Notifications  │
└───────────────┘       └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    v
            ┌───────────────┐
            │   utils.js    │
            │               │
            │ • Shared      │
            │   functions   │
            │ • Normalize   │
            │ • Match logic │
            │ • Events      │
            └───────────────┘
```

## 🔄 Data Flow

### 1. Adding Data (Storage)

```
User Input (popup) 
    → popup.js validates 
    → saveData() in utils.js 
    → chrome.storage.local 
    → UI updates
```

### 2. Filling Forms (Execution)

```
User Clicks "Fill Form" OR Right-clicks → "Auto-fill Form"
    ↓
popup.js OR background.js
    ↓
chrome.scripting.executeScript()
    ↓
Inject utils.js + content.js into active tab
    ↓
content.js:
    1. Load data from chrome.storage.local
    2. Query all input/textarea elements
    3. For each input:
        a. Check if already filled (skip if yes)
        b. Match against saved labels (heuristic)
        c. If match found:
            - Set value
            - Dispatch events
            - Highlight field
    4. Show notification with results
```

## 🧩 File Responsibilities

### manifest.json
```json
{
  "manifest_version": 3,
  "permissions": [...],
  "action": { "popup": "popup.html" },
  "background": { "service_worker": "background.js" }
}
```
- **Role**: Extension configuration
- **Key Features**: 
  - Defines permissions
  - Links popup and background worker
  - Sets up extension metadata

### popup.html & popup.css
```html
<input id="label-input">
<input id="value-input">
<button id="add-btn">Add Pair</button>
<div id="pairs-list"><!-- saved pairs --></div>
<button id="fill-form-btn">Fill Form</button>
```
- **Role**: User interface
- **Key Features**:
  - Label/value input fields
  - Display saved pairs
  - Delete functionality
  - Trigger form fill

### popup.js
```javascript
// Main functions:
- init()                 // Initialize popup
- handleAddPair()        // Add/update pair
- handleDeletePair()     // Remove pair
- handleFillForm()       // Trigger filling
- renderPairsList()      // Update UI
```
- **Role**: UI logic and data management
- **Key Features**:
  - Input validation
  - CRUD operations
  - Chrome API interaction
  - Script injection trigger

### background.js
```javascript
// Service Worker
chrome.contextMenus.create(...)  // Add right-click menu
chrome.contextMenus.onClicked    // Handle menu clicks
fillFormInTab()                  // Inject content script
```
- **Role**: Background process
- **Key Features**:
  - Context menu creation
  - Script injection coordination
  - Event handling

### utils.js
```javascript
// Shared utilities:
- normalizeText()        // Lowercase, trim, cleanup
- saveData()             // Store to chrome.storage
- loadData()             // Retrieve from storage
- triggerInputEvents()   // Dispatch DOM events
- isMatchingInput()      // Heuristic matching
- findLabelForInput()    // Label element detection
```
- **Role**: Shared helper functions
- **Key Features**:
  - Text normalization
  - Storage abstraction
  - Event dispatching
  - Matching algorithm

### content.js
```javascript
// Immediately invoked:
1. loadData()            // Get saved pairs
2. fillFormFields()      // Main filling logic
3. showNotification()    // User feedback

// Helper functions:
- findMatchingPair()     // Find match for input
- fillInput()            // Set value + events
- highlightInput()       // Visual feedback
```
- **Role**: Form filling engine (runs on web pages)
- **Key Features**:
  - Input detection
  - Smart matching
  - React/framework compatibility
  - User notifications

## 🔍 Matching Algorithm (Priority Order)

```javascript
Input: <input id="user_email" name="email" placeholder="Enter email">
Label: <label>Email Address</label>
Saved: { label: "email", value: "john@example.com" }

Matching Process:
┌─────────────────────────────────────┐
│ 1. Check ID attribute               │
│    "user_email" includes "email"?   │  ✓ MATCH
│    → YES                            │
├─────────────────────────────────────┤
│ 2. Check NAME attribute             │
│    "email" includes "email"?        │  ✓ MATCH
│    → YES                            │
├─────────────────────────────────────┤
│ 3. Check LABEL text                 │
│    "email address" includes "email"?│  ✓ MATCH
│    → YES                            │
├─────────────────────────────────────┤
│ 4. Check PLACEHOLDER                │
│    "enter email" includes "email"?  │  ✓ MATCH
│    → YES                            │
└─────────────────────────────────────┘

Result: Fill with "john@example.com"
```

### Normalization
All comparisons use `normalizeText()`:
```javascript
"Email Address" → "email address"
"user_email"    → "user_email"
"Enter Email"   → "enter email"
```

## 🎯 Event Dispatching (React Compatibility)

When filling an input, multiple events are dispatched:

```javascript
// Direct value setter (bypasses React)
Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype, 
  'value'
).set.call(input, value);

// Events for React/Vue/Angular:
1. input event (bubbles: true)
2. change event (bubbles: true)
3. InputEvent (inputType: 'insertText')
4. focus()
5. blur() [after delay]
```

This ensures frameworks detect the change and update their internal state.

## 🛡️ Security Measures

### XSS Prevention
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;  // Auto-escapes
  return div.innerHTML;
}
```

### Validation
- Check for restricted URLs (chrome://, about:, etc.)
- Skip hidden/disabled/readonly inputs
- Never overwrite existing values
- Type checking for input elements

## 📦 Storage Structure

```javascript
chrome.storage.local = {
  formData: [
    {
      id: 1700000000000,      // timestamp (unique)
      label: "email",          // field identifier
      value: "john@example.com" // value to fill
    },
    {
      id: 1700000000001,
      label: "phone",
      value: "555-1234"
    }
  ]
}
```

## 🔄 Extension Lifecycle

### Installation
```
User installs extension
    → chrome.runtime.onInstalled fires
    → background.js creates context menu
    → Extension ready
```

### User Interaction
```
1. User clicks icon → popup.html opens
2. User adds data → saved to chrome.storage.local
3. User clicks "Fill Form" → executeScript injects content.js
4. content.js fills form → shows notification
5. Popup closes automatically
```

### Context Menu
```
1. User right-clicks on page
2. Sees "Auto-fill Form" option
3. Clicks it
4. background.js injects content.js
5. Form fills automatically
```

## ⚡ Performance Considerations

### Efficient Querying
```javascript
// Get all inputs once
const inputs = document.querySelectorAll('input, textarea');

// Cache normalized labels
const normalizedLabels = formData.map(p => ({
  ...p,
  normalizedLabel: normalizeText(p.label)
}));
```

### Lazy Loading
- Content script only runs when triggered
- Popup only loads saved data when opened
- No constant background processing

### Memory Management
- Content script runs and completes (doesn't persist)
- Popup script terminates when popup closes
- Service worker is event-driven

## 🔧 Extension Points

Want to customize? Here are the key areas:

### Add New Matching Logic
**File**: `utils.js` → `isMatchingInput()`
```javascript
// Add Priority 4: Check aria-label
const ariaLabel = normalizeText(input.getAttribute('aria-label'));
if (ariaLabel && ariaLabel.includes(normalizedLabel)) {
  return true;
}
```

### Change Notification Style
**File**: `content.js` → `showNotification()`
```javascript
// Modify colors, position, duration
Object.assign(notification.style, {
  top: '20px',    // Change position
  right: '20px',  // Change position
  // ... other styles
});
```

### Add Export/Import
**File**: `popup.js`
```javascript
// Add buttons to popup.html
// Implement exportData() and importData()
async function exportData() {
  const data = await loadData();
  const json = JSON.stringify(data, null, 2);
  // Download as file
}
```

### Support Shadow DOM
**File**: `content.js` → `fillFormFields()`
```javascript
// Query shadow roots
function getAllInputs() {
  const inputs = [...document.querySelectorAll('input, textarea')];
  
  // Add shadow DOM inputs
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      inputs.push(...el.shadowRoot.querySelectorAll('input, textarea'));
    }
  });
  
  return inputs;
}
```

## 🎓 Learning Resources

Understanding the extension requires knowledge of:

1. **Chrome Extension APIs**
   - chrome.storage
   - chrome.scripting
   - chrome.contextMenus
   - chrome.tabs

2. **DOM Manipulation**
   - querySelector/querySelectorAll
   - Element properties (id, name, placeholder)
   - Event dispatching

3. **Async JavaScript**
   - Promises
   - async/await
   - Callbacks

4. **Chrome Manifest V3**
   - Service workers (vs background pages)
   - Programmatic injection (vs content_scripts)
   - Permissions model


