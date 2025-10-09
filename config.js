// Configuration file for Gmail AI Assistant
// DO NOT commit this file with real API keys!

const CONFIG = {
  // Replace with your actual Gemini API key
  GEMINI_API_KEY: '', // Leave empty to use popup method
  
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
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    model: 'gemini-1.5-flash'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}