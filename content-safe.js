// Gmail AI Assistant Content Script - Safe Version
console.log('Gmail AI Assistant loaded - Safe version');

(function() {
  'use strict';

  // Extension state
  let isExtensionActive = true;
  let currentSettings = {};

  // Gmail selectors (minimal set)
  const GMAIL_SELECTORS = {
    composeToolbar: ['.btC', '.aDh', '[role="toolbar"]'],
    composeTextArea: ['[role="textbox"][g_editable="true"]']
  };

  // Available tone options
  const TONE_OPTIONS = [
    { id: 'professional', name: 'Professional', icon: '💼', desc: 'Formal' },
    { id: 'friendly', name: 'Friendly', icon: '😊', desc: 'Warm' },
    { id: 'casual', name: 'Casual', icon: '👋', desc: 'Relaxed' },
    { id: 'formal', name: 'Formal', icon: '🎩', desc: 'Official' },
    { id: 'concise', name: 'Concise', icon: '⚡', desc: 'Brief' }
  ];

  // Load settings safely
  async function loadSettings() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
      if (response && response.success) {
        currentSettings = {
          ...response.settings,
          replyTone: response.settings.replyTone || 'professional',
          maxTokens: response.settings.maxTokens || 500,
          temperature: response.settings.temperature || 0.7,
          customInstructions: response.settings.customInstructions || '',
          autoReplyEnabled: response.settings.autoReplyEnabled !== false
        };
        console.log('Settings loaded successfully');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      currentSettings = {
        replyTone: 'professional',
        maxTokens: 500,
        temperature: 0.7,
        customInstructions: '',
        autoReplyEnabled: true
      };
    }
  }

  // Create simple AI button without dropdown for now
  function createAIButton() {
    try {
      const button = document.createElement('div');
      button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-btn';
      button.style.cssText = `
        margin-right: 8px;
        cursor: pointer;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;
      `;
      
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L18.5 7.75L12 11L5.5 7.75L12 4.5ZM4 9.5L11 12.75V19.5L4 16.25V9.5ZM13 12.75L20 9.5V16.25L13 19.5V12.75Z"/>
        </svg>
        AI Reply
      `;
      
      button.setAttribute('role', 'button');
      button.setAttribute('title', 'Generate AI Reply');
      
      return button;
    } catch (error) {
      console.error('Error creating AI button:', error);
      return null;
    }
  }

  // Simple button injection
  function injectAIButton() {
    try {
      // Remove existing buttons first
      document.querySelectorAll('.ai-reply-btn').forEach(btn => btn.remove());
      
      // Find toolbar
      const toolbar = document.querySelector('.btC, .aDh, [role="toolbar"]');
      if (toolbar && !toolbar.querySelector('.ai-reply-btn')) {
        const button = createAIButton();
        if (button) {
          button.addEventListener('click', handleAIButtonClick);
          
          // Insert at beginning
          const firstChild = toolbar.firstElementChild;
          if (firstChild) {
            toolbar.insertBefore(button, firstChild);
          } else {
            toolbar.appendChild(button);
          }
          
          console.log('AI button injected successfully');
        }
      }
    } catch (error) {
      console.error('Error injecting AI button:', error);
    }
  }

  // Handle button click
  async function handleAIButtonClick(event) {
    try {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('AI Reply button clicked');
      
      const button = event.target.closest('.ai-reply-btn');
      if (!button) return;
      
      // Load fresh settings
      await loadSettings();
      
      if (!currentSettings.geminiApiKey) {
        showNotification('Please set your Gemini API key in the extension popup', 'error');
        return;
      }

      // Show loading state
      const originalContent = button.innerHTML;
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
        </svg>
        Generating...
      `;
      button.style.pointerEvents = 'none';

      // Generate reply
      const response = await chrome.runtime.sendMessage({
        action: 'generateReply',
        emailContent: 'Generate a professional email response.',
        settings: currentSettings
      });

      if (response.success && response.reply) {
        // Find compose textarea
        const textArea = document.querySelector('[role="textbox"][g_editable="true"]');
        if (textArea) {
          textArea.focus();
          
          if (textArea.contentEditable === 'true') {
            textArea.innerHTML = response.reply.replace(/\n/g, '<br>');
          } else {
            textArea.value = response.reply;
          }
          
          // Trigger events
          const inputEvent = new Event('input', { bubbles: true });
          textArea.dispatchEvent(inputEvent);
          
          showNotification('AI reply generated successfully!', 'success');
        } else {
          showNotification('Could not find compose area', 'error');
        }
      } else {
        showNotification(response.error || 'Failed to generate reply', 'error');
      }

    } catch (error) {
      console.error('Error in AI button click:', error);
      showNotification('Error generating reply: ' + error.message, 'error');
    } finally {
      // Restore button
      if (event.target.closest('.ai-reply-btn')) {
        const button = event.target.closest('.ai-reply-btn');
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L18.5 7.75L12 11L5.5 7.75L12 4.5ZM4 9.5L11 12.75V19.5L4 16.25V9.5ZM13 12.75L20 9.5V16.25L13 19.5V12.75Z"/>
          </svg>
          AI Reply
        `;
        button.style.pointerEvents = 'auto';
      }
    }
  }

  // Simple notification function
  function showNotification(message, type = 'info') {
    try {
      if (!document.body) return;
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 4000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Message handler
  function handleMessages(request, sender, sendResponse) {
    try {
      if (request.action === 'updateSettings') {
        loadSettings();
        sendResponse({ success: true });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Safe initialization
  function initializeExtension() {
    try {
      console.log('Initializing Gmail AI Assistant (Safe Mode)...');
      
      // Check if we're on Gmail
      if (!window.location.href.includes('mail.google.com')) {
        return;
      }
      
      // Add minimal CSS
      try {
        const style = document.createElement('style');
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        if (document.head) {
          document.head.appendChild(style);
        }
      } catch (styleError) {
        console.error('Error adding CSS:', styleError);
      }

      // Load settings and setup
      loadSettings().then(() => {
        // Try to inject button after delay
        setTimeout(() => {
          injectAIButton();
          
          // Set up periodic check for compose windows
          setInterval(() => {
            try {
              if (document.querySelector('.btC, .aDh, [role="toolbar"]') && 
                  !document.querySelector('.ai-reply-btn')) {
                injectAIButton();
              }
            } catch (intervalError) {
              // Ignore interval errors
            }
          }, 3000);
        }, 2000);
      });

      // Listen for messages
      chrome.runtime.onMessage.addListener(handleMessages);

      console.log('Gmail AI Assistant initialized successfully (Safe Mode)');
      
    } catch (error) {
      console.error('Error in safe initialization:', error);
    }
  }

  // Wait for DOM and initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initializeExtension, 1000);
    });
  } else {
    setTimeout(initializeExtension, 1000);
  }

})();