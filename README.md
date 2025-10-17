# Gmail AI Assistant - Complete Chrome Extension

A fully self-contained Chrome extension that provides AI-powered auto-reply functionality for Gmail using Google's Gemini AI. **No backend server required!**

## 🌟 Features

- **🤖 AI-Powered Replies**: Generate intelligent email replies using Google's Gemini AI
- **🔧 No Backend Required**: All functionality runs directly in the browser
- **⚡ One-Click Integration**: Adds an "AI Reply" button to Gmail compose windows
- **🎨 Customizable Tones**: Professional, friendly, casual, formal, and concise reply styles
- **📝 Context-Aware**: Analyzes the email thread to generate relevant responses
- **🔒 Secure**: API key stored locally in your browser
- **🎯 Smart Detection**: Automatically detects Gmail compose windows and reply contexts
- **📱 Modern UI**: Clean, intuitive popup interface for configuration

## 🚀 Installation

### Step 1: Get Your Gemini AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key (keep it secure!)

### Step 2: Install the Extension
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `gmail-ai-assistant-ext` folder
6. The extension should now appear in your Chrome toolbar

### Step 3: Configure the Extension
1. Click the Gmail AI Assistant icon in your Chrome toolbar
2. Paste your Gemini AI API key in the settings
3. Choose your preferred reply tone and settings
4. Click "Save Settings"
5. Test the API connection with the "Test API Key" button

## 📖 Usage

### Basic Usage
1. Open Gmail in Chrome
2. Open any email or start composing a new email
3. Click the "Reply" or "Compose" button in Gmail
4. Look for the purple "AI Reply" button in the compose toolbar
5. Click "AI Reply" to generate an intelligent response
6. Edit the generated text as needed
7. Send your email!

### Advanced Features
- **Custom Instructions**: Add specific instructions for how AI should respond
- **Tone Selection**: Choose from professional, friendly, casual, formal, or concise
- **Response Length**: Control how long or short the replies should be
- **Context Menu**: Right-click on selected text to generate replies from specific content

## ⚙️ Configuration Options

### Reply Settings
- **Reply Tone**: Adjust the style of generated responses
- **Response Length**: Control token count (300-800 tokens)
- **Custom Instructions**: Add personalized guidelines for AI responses
- **Creativity Level**: Adjust how creative vs. conservative the AI should be

### Advanced Settings
- **Auto-Reply Button**: Enable/disable the AI button in Gmail
- **Temperature Control**: Fine-tune AI creativity (0 = conservative, 1 = creative)

## 🔧 Technical Details

### Architecture
- **Content Script**: Injects AI button into Gmail interface and handles email parsing
- **Background Script**: Manages API calls to Gemini AI and settings storage
- **Popup Interface**: Provides user-friendly configuration panel

### Gmail Integration
- **Selective Injection**: Only loads in Gmail domains for optimal performance
- **Dynamic Detection**: Automatically detects new compose windows
- **Context Parsing**: Extracts email content and thread context for intelligent replies
- **Multiple Compose Support**: Works with multiple open compose windows

### Security Features
- **Local Storage**: API keys stored securely in Chrome's sync storage
- **HTTPS Only**: All API communications use secure HTTPS
- **No Data Collection**: Extension doesn't collect or transmit personal data
- **Minimal Permissions**: Only requests necessary permissions for Gmail integration



## 🛠️ Development

### Project Structure
```
gmail-ai-assistant-ext/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Gmail integration script
├── popup.html            # Settings interface
├── popup.js              # Settings functionality  
├── popup-styles.css      # Popup styling
├── styles.css            # Content script styling
└── icons/               # Extension icons
    └── icon128.svg       # Main icon
```

### Key Components
1. **Manifest V3**: Latest Chrome extension format
2. **Service Worker**: Handles API communication with Gemini AI
3. **Content Script**: Integrates seamlessly with Gmail's interface
4. **Dynamic Injection**: Detects Gmail compose windows automatically
5. **Settings Management**: Persistent configuration storage

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Clone the repository
2. Make your changes
3. Test in Chrome developer mode
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**"API Key Required" Error**
- Make sure you've entered a valid Gemini AI API key in the extension popup
- Test the API key using the "Test API Key" button

**AI Button Not Appearing**
- Refresh the Gmail page after installing the extension
- Check if the extension is enabled in `chrome://extensions/`
- Make sure you're on the correct Gmail domain (mail.google.com)

**Generated Reply Not Inserting**
- Try clicking in the compose text area first
- Check Gmail's compose window is fully loaded
- Refresh the page and try again

**Extension Not Working After Update**
- Go to `chrome://extensions/` and click the refresh icon for the extension
- Clear browser cache and reload Gmail

### Debug Mode
1. Right-click on the extension icon → "Inspect popup"
2. In Gmail, press F12 → Console tab to see content script logs
3. Check for any error messages and report them

## 🔗 Related Links

- [Google AI Studio](https://makersuite.google.com/app/apikey) - Get your API key
- [Gemini AI Documentation](https://ai.google.dev/) - Learn about Gemini AI
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/) - Extension development

---

**Made with ❤️ for Gmail productivity**