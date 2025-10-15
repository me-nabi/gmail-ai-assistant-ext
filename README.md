# Gmail AI Assistant - Advanced Chrome Extension

A sophisticated Chrome extension that seamlessly integrates AI-powered email assistance directly into Gmail using Google's latest Gemini AI models. **No backend server required!**

## 🌟 Key Features

- **🤖 Latest Gemini AI Integration**: Uses cutting-edge Gemini 2.5 Flash and other latest models
- **🔧 Zero Setup Backend**: All functionality runs directly in your browser
- **⚡ Intelligent Button Placement**: Smart AI Reply button with integrated tone selection dropdown
- **🎨 Advanced Tone Control**: Professional, friendly, casual, formal, and enthusiastic styles with inline selection
- **📝 Context-Aware Generation**: Analyzes email threads for highly relevant responses
- **🔒 Secure & Private**: API key stored locally, no data collection
- **🎯 Smart Gmail Detection**: Automatically detects compose windows and reply contexts
- **📱 Beautiful Modern UI**: Glassmorphism design with professional Gemini color scheme
- **⚙️ Dual-Button Design**: Separate AI Reply and Custom Instructions buttons for streamlined workflow
- **🔄 Auto-Fallback Models**: Multiple model support with automatic fallback for reliability

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
2. Enter your Gemini AI API key in the settings
3. Select your preferred response length (Short/Medium/Long)
4. Click "Save" - the popup will auto-close and show connection status
5. Green "Connected" status confirms successful API setup

## 📖 Usage

### Basic Usage
1. Open Gmail in Chrome
2. Open any email or start composing a new email
3. Click the "Reply" or "Compose" button in Gmail
4. Look for the **AI Reply** button with dropdown in the compose toolbar
5. **Select your tone** from the dropdown (Professional, Friendly, Casual, Formal, Enthusiastic)
6. Click **"AI Reply"** to generate an intelligent response in your selected tone
7. Edit the generated text as needed and send!

### Advanced Features
- **🎯 Inline Tone Selection**: Choose tone directly from the AI Reply button dropdown
- **⚙️ Custom Instructions Button**: Separate button for adding personalized AI instructions
- **📊 Multi-Model Fallback**: Automatically tries multiple Gemini models for best results
- **🔄 Auto-Connection Testing**: Real-time API connection status in popup
- **💾 Auto-Save Settings**: Settings save automatically with visual confirmation
- **🎨 Professional UI**: Modern glassmorphism design matching Gmail's interface

## ⚙️ Configuration Options

### Popup Settings
- **🔑 API Key**: Your Google Gemini AI API key (stored securely locally)
- **📏 Response Length**: Short (300 tokens), Medium (500 tokens), Long (800 tokens)
- **✅ Connection Status**: Real-time API connection verification
- **💾 Auto-Save**: Settings automatically save and popup closes

### In-Gmail Controls
- **🎨 Tone Dropdown**: Select from 5 different response tones directly in Gmail
  - **Professional**: Formal, business-appropriate language
  - **Friendly**: Warm, approachable, personable tone
  - **Casual**: Relaxed, informal, conversational style
  - **Formal**: Highly structured, sophisticated language
  - **Enthusiastic**: Energetic, positive, motivating tone
- **⚙️ Custom Instructions**: Separate button for adding specific AI guidelines
- **🔄 Smart Button Placement**: Automatically detects and integrates with Gmail toolbar

## 🔧 Technical Details

### Latest AI Integration
- **🚀 Gemini 2.5 Flash**: Uses Google's newest and fastest model as primary
- **🔄 Multi-Model Fallback**: Automatically tries Gemini 2.0 Flash Exp, 1.5 Flash, and 1.5 Pro
- **📈 Enhanced Prompting**: Advanced prompt engineering for professional email generation
- **⚡ Optimized Performance**: Smart token management and response handling

### Advanced Architecture  
- **📱 Modern Content Script**: Sophisticated Gmail integration with dual-button design
- **🔧 Service Worker Background**: Efficient API management with error handling
- **🎨 Glassmorphism Popup**: Beautiful modern UI with professional color scheme
- **💾 Smart Storage**: Efficient settings management with auto-save functionality

### Gmail Integration Excellence
- **🎯 Intelligent Injection**: Advanced selector logic for reliable button placement
- **🔍 Smart Detection**: Robust compose window detection with mutation observers  
- **📝 Context Analysis**: Deep email thread parsing for contextual responses
- **🖱️ Interactive Dropdowns**: Seamless tone selection and custom instructions UI
- **📱 Responsive Design**: Works across different Gmail layouts and screen sizes

### Security & Privacy
- **🔒 Local-Only Storage**: API keys never leave your browser
- **🛡️ HTTPS Encryption**: All API communications secured with HTTPS
- **🚫 Zero Data Collection**: No personal data collected or transmitted
- **⚡ Minimal Permissions**: Only essential Gmail integration permissions
- **🔐 Secure API Handling**: Robust error handling and API key validation

## 🎯 Comparison with Previous Versions

| Feature | Java Backend Version | React Web App | **New Chrome Extension** |
|---------|---------------------|---------------|-------------------------|
| Backend Required | ✅ Spring Boot | ✅ Spring Boot | ❌ **No Backend** |
| Setup Complexity | High | Medium | **Low** |
| Gmail Integration | External | External | **Native** |
| Offline Capable | ❌ | ❌ | **✅ (after setup)** |
| Installation | Multiple steps | Multiple steps | **One-click install** |
| Auto-detection | Manual | Manual | **Automatic** |
| Updates | Manual restart | Manual restart | **Auto-update** |

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

**❌ "Connection Failed" Status**
- Verify your Gemini AI API key is correct and active
- Check your internet connection
- The extension automatically tests multiple Gemini models
- Green "Connected" status confirms successful setup

**🔘 AI Button Not Appearing**
- Refresh Gmail after installing the extension
- Ensure extension is enabled in `chrome://extensions/`
- Verify you're on mail.google.com (not other Google domains)
- Try opening a new compose window

**📝 Generated Reply Issues**
- Click in the compose text area before generating
- Wait for Gmail compose window to fully load
- Try selecting a different tone from the dropdown
- Check browser console (F12) for any error messages

**⚙️ Popup Not Opening**
- Right-click extension icon → "Inspect popup" to debug
- Check if Chrome has blocked the extension
- Try reloading the extension in developer mode

**🔄 "All Models Failed" Error**
- This indicates API connectivity issues or invalid API key
- Check your API key at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Verify your API key has Gemini access enabled
- Try again after a few minutes (rate limiting)

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