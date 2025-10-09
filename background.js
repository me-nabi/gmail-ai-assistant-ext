// Background Service Worker for Gmail AI Assistant
console.log('Gmail AI Assistant Background Script Loaded');

// Configuration for Gemini AI API
const GEMINI_CONFIG = {
  apiUrl: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
  model: 'gemini-pro'
};

// Store API key and user settings
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    apiKey: '',
    autoReplyEnabled: true,
    replyTone: 'professional',
    maxTokens: 500,
    temperature: 0.7
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateReply') {
    generateEmailReply(request.emailContent, request.settings)
      .then(response => {
        sendResponse({ success: true, reply: response });
      })
      .catch(error => {
        console.error('Error generating reply:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ success: true, settings: settings });
    });
    return true;
  }
});

// Generate email reply using Gemini AI
async function generateEmailReply(emailContent, settings = {}) {
  try {
    // Get API key from storage
    const storage = await chrome.storage.sync.get(['apiKey']);
    const apiKey = storage.apiKey;
    
    if (!apiKey) {
      throw new Error('Please set your Gemini API key in the extension popup');
    }
    
    // Build the prompt for email reply generation
    const prompt = buildEmailPrompt(emailContent, settings);
    
    // Prepare the request body for Gemini API
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: settings.temperature || 0.7,
        maxOutputTokens: settings.maxTokens || 500,
        topP: 0.8,
        topK: 10
      }
    };
    
    // Make API call to Gemini
    const response = await fetch(`${GEMINI_CONFIG.apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract the generated text from the response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      return generatedText.trim();
    } else {
      throw new Error('Unexpected API response format');
    }
    
  } catch (error) {
    console.error('Error in generateEmailReply:', error);
    throw error;
  }
}

// Build the prompt for email reply generation
function buildEmailPrompt(emailContent, settings) {
  const tone = settings.replyTone || 'professional';
  const customInstructions = settings.customInstructions || '';
  
  let prompt = `You are an AI assistant helping to write email replies. Please generate a ${tone} email reply to the following email content.

Guidelines:
- Keep the response concise and relevant
- Match the tone requested: ${tone}
- Don't include subject lines
- Don't include sender/recipient information
- Focus on addressing the key points in the original email
- Be helpful and courteous
${customInstructions ? `- Additional instructions: ${customInstructions}` : ''}

Original Email Content:
${emailContent}

Please generate an appropriate reply:`;

  return prompt;
}

// Context menu setup (optional enhancement)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generateReply",
    title: "Generate AI Reply",
    contexts: ["selection"],
    documentUrlPatterns: ["*://mail.google.com/*"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateReply" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "generateReplyFromSelection",
      selectedText: info.selectionText
    });
  }
});