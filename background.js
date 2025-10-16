// Background Service Worker for Gmail AI Assistant
console.log('Gmail AI Assistant Background Script Loaded');

// Configuration for Gemini AI API (Updated to new format)
const GEMINI_CONFIG = {
  apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
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
  
  // Setup context menu
  setupContextMenu();
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

  if (request.action === 'updateCustomInstructions') {
    const instructions = request.customInstructions || '';
    console.log('Saving custom instructions to storage:', instructions === '' ? '(empty string)' : instructions);
    
    chrome.storage.sync.set({ customInstructions: instructions }, () => {
      console.log('Custom instructions saved successfully');
      sendResponse({ success: true });
      
      // Notify all content scripts to update their dropdowns
      chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'updateSettings' }).catch(() => {
            // Ignore errors for inactive tabs
          });
        });
      });
    });
    return true;
  }
});

// Generate email reply using Gemini AI
async function generateEmailReply(emailContent, settings = {}) {
  try {
    // Get API key from storage (user enters via popup)
    const storage = await chrome.storage.sync.get(['apiKey']);
    const apiKey = storage.apiKey;
    
    if (!apiKey) {
      throw new Error('Please set your Gemini API key in the extension popup');
    }
    
    // Build the prompt for email reply generation
    const prompt = buildEmailPrompt(emailContent, settings);
    
    // Prepare the request body for new Gemini API
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
        topK: 10,
        candidateCount: 1,
        stopSequences: []
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    // Try different models (updated for new Gemini API)
    const models = [
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
      'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
    ];
    
    let response;
    let lastError;
    
    for (const modelUrl of models) {
      try {
        console.log(`Trying model: ${modelUrl}`);
        
        response = await fetch(`${modelUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          console.log(`Success with model: ${modelUrl}`);
          break; // Success! Use this model
        } else {
          const errorText = await response.text();
          lastError = `${response.status} ${errorText}`;
          console.log(`Model ${modelUrl} failed:`, lastError);
        }
      } catch (error) {
        lastError = error.message;
        console.log(`Model ${modelUrl} error:`, error);
      }
    }
    
    if (!response || !response.ok) {
      throw new Error(`All models failed. Last error: ${lastError}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    
    // Extract the generated text from the response (handle multiple formats)
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      
      // Check for content in the response
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const generatedText = candidate.content.parts[0].text;
        if (generatedText) {
          return generatedText.trim();
        }
      }
      
      // Check for direct text in parts
      if (candidate.parts && candidate.parts.length > 0 && candidate.parts[0].text) {
        return candidate.parts[0].text.trim();
      }
    }
    
    // Check for direct text response
    if (data.text) {
      return data.text.trim();
    }
    
    // If no valid response found
    console.error('Unexpected API response format:', data);
    throw new Error(`No valid response received. Response: ${JSON.stringify(data).substring(0, 200)}...`);
    
  } catch (error) {
    console.error('Error in generateEmailReply:', error);
    throw error;
  }
}

// Build the prompt for email reply generation
function buildEmailPrompt(emailContent, settings) {
  const tone = settings.replyTone || 'professional';
  const customInstructions = settings.customInstructions || '';
  
  console.log(`Building prompt with tone: ${tone}, custom instructions: ${customInstructions}`);
  
  let prompt = `You are an AI assistant helping to write email replies. Please generate a ${tone.toUpperCase()} email reply to the following email content.

IMPORTANT TONE REQUIREMENTS:
- Use a ${tone} tone throughout the entire response
- Match the writing style that fits "${tone}" perfectly
- Make sure the language and approach reflects a ${tone} manner

FORMATTING GUIDELINES:
- Keep the response concise and relevant
- Don't include subject lines or email headers
- Don't include sender/recipient information
- Focus only on the reply content
- Be helpful and appropriate for the context

${customInstructions ? `CUSTOM INSTRUCTIONS:
${customInstructions}

Follow these custom instructions carefully while maintaining the ${tone} tone.

` : ''}

ORIGINAL EMAIL TO RESPOND TO:
${emailContent}

Generate a ${tone} email reply now:`;

  return prompt;
}

// Context menu setup (optional enhancement)
function setupContextMenu() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: "generateReply",
        title: "Generate AI Reply",
        contexts: ["selection"],
        documentUrlPatterns: ["*://mail.google.com/*"]
      });
    });
  } catch (error) {
    console.log('Context menu setup skipped:', error);
  }
}



// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generateReply" && info.selectionText) {
    chrome.tabs.sendMessage(tab.id, {
      action: "generateReplyFromSelection",
      selectedText: info.selectionText
    }).catch(error => {
      console.log('Could not send message to tab:', error);
    });
  }
});