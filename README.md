![Typeless Forms](/screenshots/header.png "Typeless Forms")
# Typeless Forms : Custom Form Auto-Filler - Chrome Extension

A powerful Chrome extension that allows you to save custom label/value pairs and automatically fill forms on any web page. Built with Vanilla JavaScript and Chrome Manifest V3.

<div align="center">
  
[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Add%20to%20Chrome-4285F4?logo=google-chrome&logoColor=white&style=for-the-badge)](https://chromewebstore.google.com/detail/typeless-form-auto-filler/dcmojhifgeaddhpliklgfdfdedmflgmj)

</div>

## ✨ Features

- **Save Custom Data**: Store unlimited label/value pairs (e.g., email, phone, name)
- **Search & Filter**: Instantly search through your saved fields in real-time
- **Copy to Clipboard**: Quickly copy any saved value with one click using the ⧉ button
- **Delete Confirmation**: Prevent accidental deletions with confirmation dialog
- **Smart Matching**: Intelligent heuristic engine matches fields by ID, name, label, and placeholder
- **React Compatible**: Properly dispatches events for modern frameworks (React, Vue, Angular)
- **Multiple Trigger Methods**: 
  - Manual button in popup
  - Right-click context menu
- **Non-Invasive**: Only fills empty fields, never overwrites existing data
- **Beautiful UI**: Modern, clean interface with smooth animations
- **Persistent Storage**: All data saved locally using chrome.storage.local

## 📁 Project Structure

```
typeless-forms-chrome-extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html            # Extension popup UI
├── popup.css             # Popup styling
├── popup.js              # Popup logic and CRUD operations
├── content.js            # Form filling logic (runs on web pages)
├── background.js         # Service worker for context menus
├── utils.js              # Shared helper functions
└── README.md             # This file
```

## 🚀 Local Installation

### Load Unpacked (Development)

1. **Clone or download** this repository to your local machine

2. **Open Chrome** and navigate to `chrome://extensions/`

3. **Enable Developer Mode** (toggle in top-right corner)

4. **Click "Load unpacked"**

5. **Select the project folder** containing `manifest.json`

6. **Add Icons** (Optional but recommended):
   - Create three PNG icons: `icon16.png`, `icon48.png`, `icon128.png`
   - Place them in the `icons` directory
   - Or download free icons from [Icons8](https://icons8.com/) or [Flaticon](https://www.flaticon.com/)

the last update is added in the chrome store for review. waiting for publishing. 

## 📖 How to Use

### Adding Form Data
![Typeless Forms Add Data](/screenshots/add_data.jpg "Typeless Forms")

1. **Click the extension icon** in your Chrome toolbar
2. **Enter a Label** (e.g., "email", "phone", "first name")
3. **Enter a Value** (e.g., "john@example.com", "555-1234")
4. **Click "Add Pair"** or press enter
5. Repeat for all fields you want to auto-fill 

**Tip**: Use descriptive labels that match common form field names for better matching!

### Filling Forms
![Typeless Forms fill Data](/screenshots/fill_data.jpg "Typeless Forms")
#### Method 1: Manual Button
1. Navigate to any web page with a form
2. Click the extension icon
3. Click **"Fill Form on This Page"**
4. Watch your form fields populate automatically! ✨

#### Method 2: Context Menu
1. Navigate to any web page with a form
2. **Right-click** anywhere on the page
3. Select **"Auto-fill Form"** from the context menu

### Managing Data

- **Search**: Type in the search bar to filter fields by label or value in real-time
- **Copy**: Click the **⧉** (copy) button to copy a value to your clipboard
- **Update**: Add a pair with the same label to update its value
- **Delete**: Click the **×** button to delete a pair (with confirmation dialog)
- **View**: All saved pairs are displayed in the popup with a count badge

## 🧠 How It Works

### Intelligent Matching Algorithm

The extension uses a **priority-based heuristic engine** to match your saved labels with form fields:

1. **Priority 1 - ID & Name Attributes**
   - Checks if the input's `id` or `name` contains your saved label
   - Example: Saved "email" matches `<input id="user_email">`

2. **Priority 2 - Label Elements**
   - Searches for associated `<label>` elements
   - Example: Saved "phone" matches `<label>Phone Number</label>`

3. **Priority 3 - Placeholder Text**
   - Checks the `placeholder` attribute
   - Example: Saved "address" matches `<input placeholder="Enter your address">`

All comparisons are **case-insensitive** and **normalized** for maximum compatibility.

### Framework Compatibility

The extension is compatible with modern JavaScript frameworks:

- **React**: Dispatches synthetic events properly
- **Vue**: Triggers v-model updates
- **Angular**: Works with ngModel bindings
- **Vanilla JS**: Standard input/change events

### Event Dispatching

After filling a field, the extension dispatches:
- `input` event (bubbles: true)
- `change` event (bubbles: true)
- `InputEvent` (for enhanced compatibility)
- Focus/blur events (for validation triggers)

## 🛡️ Privacy & Security

- ✅ **All data stored locally** on your device
- ✅ **No external servers** or network requests
- ✅ **No data collection** or analytics
- ✅ **XSS protection** with HTML escaping
- ✅ **Open source** - inspect the code yourself!

## ⚙️ Permissions Explained

The extension requests the following permissions:

- **storage**: Save your label/value pairs locally
- **activeTab**: Access the current tab to fill forms
- **scripting**: Inject the form-filling script
- **contextMenus**: Add right-click menu option
- **host_permissions**: Execute on any website (only when triggered)

## 🎨 Customization

### Modify Matching Logic

Edit `utils.js` → `isMatchingInput()` function to customize how fields are matched.

### Change UI Styling

Edit `popup.css` to customize colors, sizes, and animations.

### Adjust Notification Display

Edit `content.js` → `showNotification()` to change notification appearance and duration.

## 🐛 Troubleshooting

### Extension doesn't fill any fields
- Check that you've saved some label/value pairs
- Ensure the labels roughly match field names on the page
- Try more generic labels (e.g., "email" instead of "work_email")

### Some fields aren't filled
- Fields with existing values are skipped intentionally
- Hidden, disabled, or readonly fields are skipped
- Some custom form implementations may not be compatible

### Extension doesn't work on certain pages
- Chrome restricts extensions on chrome://, edge://, and extension pages
- Some sites use Shadow DOM or iframes which require special handling

### Icons not showing
- Add icon files: `icon16.png`, `icon48.png`, `icon128.png`
- Or remove icon references from `manifest.json`

## 🔧 Technical Details

- **Manifest Version**: V3 (latest Chrome extension standard)
- **Storage**: chrome.storage.local API
- **Scripting**: Programmatic injection with chrome.scripting API
- **Service Worker**: background.js runs as persistent service worker
- **Content Security Policy**: Complies with default CSP

## 📝 Data Structure

Saved data is stored as an array of objects:

```javascript
[
  {
    id: 1700000000000,        // Timestamp
    label: "email",            // Field identifier
    value: "john@example.com"  // Value to fill
  },
  {
    id: 1700000000001,
    label: "phone",
    value: "555-1234"
  }
]
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests! Some ideas for enhancement:

- Import/export data functionality
- Multiple profiles (personal, work, etc.)
- Field type detection (email, phone, date, etc.)
- Dark mode toggle
- Keyboard shortcuts
- Form template detection

## 📄 License

See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ using:
- Vanilla JavaScript (no frameworks!)
- Chrome Extension Manifest V3
- Modern CSS with animations

---

**Enjoy auto-filling your forms!** 🚀

If you find this useful, please star the repository and share it with others!


