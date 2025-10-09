// Configuration template for Gmail AI Assistant
// Copy this file to config.js and add your actual API key

const CONFIG = {
  // Get your free API key from: https://makersuite.google.com/app/apikey
  // Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API key
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',
  
  // Default settings
  DEFAULT_SETTINGS: {
    apiKey: '', // Will be overridden by GEMINI_API_KEY above
    autoReplyEnabled: true,
    replyTone: 'professional',
    maxTokens: 500,
    temperature: 0.7
  },
  
  // API Configuration
  GEMINI_CONFIG: {
    apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}