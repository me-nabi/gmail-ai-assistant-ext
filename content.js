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
          geminiApiKey: response.settings.apiKey || response.settings.geminiApiKey || '',
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
        geminiApiKey: '',
        replyTone: 'professional',
        maxTokens: 500,
        temperature: 0.7,
        customInstructions: '',
        autoReplyEnabled: true
      };
    }
  }

  // Create AI button with tone dropdown
  function createAIButton() {
    try {
      const container = document.createElement('div');
      container.className = 'ai-reply-container';
      container.style.cssText = `
        margin-right: 8px;
        position: relative;
        display: inline-flex;
      `;
      
      // Main button
      const button = document.createElement('div');
      button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-btn ai-reply-btn-main';
      button.style.cssText = `
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
      
      const currentTone = currentSettings.replyTone || 'professional';
      const toneOption = TONE_OPTIONS.find(t => t.id === currentTone) || TONE_OPTIONS[0];
      
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L18.5 7.75L12 11L5.5 7.75L12 4.5ZM4 9.5L11 12.75V19.5L4 16.25V9.5ZM13 12.75L20 9.5V16.25L13 19.5V12.75Z"/>
        </svg>
        <span>AI Reply</span>
        <span class="ai-current-tone">(${toneOption.name})</span>
        <svg class="ai-dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10L12 15L17 10H7Z"/>
        </svg>
      `;
      
      button.setAttribute('role', 'button');
      button.setAttribute('title', 'Generate AI Reply - Click arrow for tone options');
      
      // Create dropdown
      const dropdown = createToneDropdown();
      
      container.appendChild(button);
      container.appendChild(dropdown);
      
      return container;
    } catch (error) {
      console.error('Error creating AI button:', error);
      return null;
    }
  }

  // Create tone selection dropdown
  function createToneDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'ai-tone-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 220px;
      display: none;
      overflow: hidden;
    `;
    
    // Add tone options
    TONE_OPTIONS.forEach(tone => {
      const option = document.createElement('div');
      option.className = 'ai-tone-option';
      option.dataset.tone = tone.id;
      option.style.cssText = `
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        transition: background-color 0.2s ease;
        ${tone.id === (currentSettings.replyTone || 'professional') ? 'background-color: #f0f0f0;' : ''}
      `;
      
      option.innerHTML = `
        <span style="font-size: 16px;">${tone.icon}</span>
        <span style="color: #333;">${tone.name}</span>
      `;
      
      option.addEventListener('mouseenter', () => {
        option.style.backgroundColor = '#f5f5f5';
      });
      
      option.addEventListener('mouseleave', () => {
        if (tone.id === (currentSettings.replyTone || 'professional')) {
          option.style.backgroundColor = '#f0f0f0';
        } else {
          option.style.backgroundColor = 'transparent';
        }
      });
      
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTone(tone.id, dropdown);
      });
      
      dropdown.appendChild(option);
    });
    
    // Add separator if custom instructions exist
    if (currentSettings.customInstructions && currentSettings.customInstructions.trim()) {
      const separator = document.createElement('div');
      separator.style.cssText = `
        height: 1px;
        background: #e1e5e9;
        margin: 4px 0;
      `;
      dropdown.appendChild(separator);
      
      // Add custom instructions section
      const customSection = document.createElement('div');
      customSection.style.cssText = `
        padding: 8px 12px;
        background: #f8f9fa;
        border-top: 1px solid #e1e5e9;
      `;
      
      const customLabel = document.createElement('div');
      customLabel.style.cssText = `
        font-size: 11px;
        font-weight: 600;
        color: #666;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
      `;
      customLabel.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
        Custom Instructions
      `;
      
      const customText = document.createElement('div');
      customText.style.cssText = `
        font-size: 12px;
        color: #444;
        line-height: 1.3;
        max-height: 60px;
        overflow-y: auto;
        padding: 4px 0;
      `;
      customText.textContent = currentSettings.customInstructions.trim();
      
      customSection.appendChild(customLabel);
      customSection.appendChild(customText);
      dropdown.appendChild(customSection);
    }
    
    return dropdown;
  }

  // Handle tone selection
  async function selectTone(toneId, dropdown) {
    try {
      console.log('Tone selected:', toneId);
      
      // Update settings
      currentSettings.replyTone = toneId;
      await chrome.storage.sync.set({ replyTone: toneId });
      
      // Update UI
      const container = dropdown.parentElement;
      const button = container.querySelector('.ai-reply-btn-main');
      const toneOption = TONE_OPTIONS.find(t => t.id === toneId) || TONE_OPTIONS[0];
      
      // Update button text
      const toneSpan = button.querySelector('.ai-current-tone');
      if (toneSpan) {
        toneSpan.textContent = `(${toneOption.name})`;
      }
      
      // Update selected option in dropdown
      dropdown.querySelectorAll('.ai-tone-option').forEach(opt => {
        if (opt.dataset.tone === toneId) {
          opt.style.backgroundColor = '#f0f0f0';
        } else {
          opt.style.backgroundColor = 'transparent';
        }
      });
      
      // Hide dropdown
      dropdown.style.display = 'none';
      
      showNotification(`Tone changed to ${toneOption.name}`, 'success');
    } catch (error) {
      console.error('Error selecting tone:', error);
    }
  }

  // Refresh dropdown content when settings change
  function refreshDropdown(container) {
    try {
      const oldDropdown = container.querySelector('.ai-tone-dropdown');
      if (oldDropdown) {
        const newDropdown = createToneDropdown();
        container.replaceChild(newDropdown, oldDropdown);
        return newDropdown;
      }
    } catch (error) {
      console.error('Error refreshing dropdown:', error);
    }
    return null;
  }

  // Toggle dropdown visibility
  function toggleDropdown(dropdown) {
    try {
      if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        // Hide all other dropdowns first
        document.querySelectorAll('.ai-tone-dropdown').forEach(d => {
          if (d !== dropdown) d.style.display = 'none';
        });
        dropdown.style.display = 'block';
      } else {
        dropdown.style.display = 'none';
      }
    } catch (error) {
      console.error('Error toggling dropdown:', error);
    }
  }

  // Simple button injection
  function injectAIButton() {
    try {
      // Remove existing buttons first
      document.querySelectorAll('.ai-reply-btn, .ai-reply-container').forEach(btn => btn.remove());
      
      // Find compose toolbar more specifically
      // Look for compose windows first, then find toolbars within them
      const composeWindows = document.querySelectorAll('[role="dialog"], .dw, .aDh');
      let toolbar = null;
      
      // Check each compose window for a toolbar
      for (const window of composeWindows) {
        // Look for toolbars within compose windows that have formatting tools
        const potentialToolbar = window.querySelector('.btC, [role="toolbar"]');
        if (potentialToolbar) {
          // Verify it's a compose toolbar by checking for send button or formatting tools nearby
          const hasSendButton = window.querySelector('[data-tooltip*="Send"], .T-I-atl');
          const hasFormatting = window.querySelector('[data-tooltip*="Bold"], [data-tooltip*="Italic"]');
          
          if (hasSendButton || hasFormatting) {
            toolbar = potentialToolbar;
            break;
          }
        }
      }
      
      // Fallback: look for any toolbar that has formatting controls
      if (!toolbar) {
        const allToolbars = document.querySelectorAll('.btC, [role="toolbar"]');
        for (const tb of allToolbars) {
          if (tb.querySelector('[data-tooltip*="Bold"], [data-tooltip*="Italic"], [data-tooltip*="Underline"], [aria-label*="Bold"], [aria-label*="Italic"]')) {
            toolbar = tb;
            break;
          }
        }
      }
      
      // Final fallback: look for toolbar near text editor
      if (!toolbar) {
        const textAreas = document.querySelectorAll('[role="textbox"][contenteditable="true"]');
        for (const textArea of textAreas) {
          const nearbyToolbar = textArea.parentElement?.querySelector('.btC') || 
                               textArea.closest('.dw')?.querySelector('.btC') ||
                               textArea.closest('[role="dialog"]')?.querySelector('.btC');
          if (nearbyToolbar) {
            toolbar = nearbyToolbar;
            break;
          }
        }
      }
      
      if (toolbar && !toolbar.querySelector('.ai-reply-btn')) {
        const buttonContainer = createAIButton();
        if (buttonContainer) {
          const button = buttonContainer.querySelector('.ai-reply-btn-main');
          const dropdown = buttonContainer.querySelector('.ai-tone-dropdown');
          
          // Add click handlers
          button.addEventListener('click', (e) => {
            // Check if click was on dropdown arrow
            if (e.target.closest('.ai-dropdown-arrow')) {
              e.preventDefault();
              e.stopPropagation();
              toggleDropdown(dropdown);
              return;
            }
            
            // Check if dropdown is open - if so, close it and return
            if (dropdown.style.display === 'block') {
              dropdown.style.display = 'none';
              return;
            }
            
            // Generate AI reply
            handleAIButtonClick(e);
          });
          
          // Insert at beginning
          const firstChild = toolbar.firstElementChild;
          if (firstChild) {
            toolbar.insertBefore(buttonContainer, firstChild);
          } else {
            toolbar.appendChild(buttonContainer);
          }
          
          console.log('AI button with tone dropdown injected successfully into compose toolbar');
        }
      } else {
        console.log('No suitable compose toolbar found');
      }
    } catch (error) {
      console.error('Error injecting AI button:', error);
    }
  }

  // Handle button click
  async function handleAIButtonClick(event) {
    let button = null;
    
    try {
      event.preventDefault();
      event.stopPropagation();
      
      console.log('AI Reply button clicked');
      
      button = event.target.closest('.ai-reply-btn-main');
      if (!button) return;
      
      // Load fresh settings
      await loadSettings();
      
      if (!currentSettings.geminiApiKey) {
        showNotification('Please set your Gemini API key in the extension popup', 'error');
        return;
      }

      // Get email context from the original message
      const emailContent = getEmailContentForReply();
      console.log('Email context:', emailContent);

      // Show loading state
      const currentTone = currentSettings.replyTone || 'professional';
      const toneOption = TONE_OPTIONS.find(t => t.id === currentTone) || TONE_OPTIONS[0];
      
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
          <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
        </svg>
        <span>Generating...</span>
      `;
      button.style.pointerEvents = 'none';

      // Generate reply with proper email context
      const response = await chrome.runtime.sendMessage({
        action: 'generateReply',
        emailContent: emailContent || 'Please generate a professional email reply.',
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
          
          // Trigger events to notify Gmail
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          textArea.dispatchEvent(inputEvent);
          textArea.dispatchEvent(changeEvent);
          
          showNotification(`AI reply generated with ${toneOption.name} tone!`, 'success');
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
      // Always restore button state
      if (button) {
        const currentTone = currentSettings.replyTone || 'professional';
        const toneOption = TONE_OPTIONS.find(t => t.id === currentTone) || TONE_OPTIONS[0];
        
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L18.5 7.75L12 11L5.5 7.75L12 4.5ZM4 9.5L11 12.75V19.5L4 16.25V9.5ZM13 12.75L20 9.5V16.25L13 19.5V12.75Z"/>
          </svg>
          <span>AI Reply</span>
          <span class="ai-current-tone">(${toneOption.name})</span>
          <svg class="ai-dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 10L12 15L17 10H7Z"/>
          </svg>
        `;
        button.style.pointerEvents = 'auto';
      }
    }
  }

  // Get email content for better context
  function getEmailContentForReply() {
    try {
      // Look for the original email content in various places
      const emailSelectors = [
        '.h7', // Gmail conversation
        '.a3s.aiL', // Email body
        '.ii.gt .a3s.aiL', // Nested email content
        '.gmail_quote', // Quoted text
        '[role="listitem"] .a3s' // List item content
      ];
      
      for (const selector of emailSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Get the last email content (most recent)
          const latestEmail = elements[elements.length - 1];
          const content = latestEmail.textContent.trim();
          if (content && content.length > 20) {
            return content;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting email content:', error);
      return null;
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
              // Only inject if we have compose windows but no AI button
              const composeWindows = document.querySelectorAll('[role="dialog"], .dw, .aDh');
              const hasComposeWindow = composeWindows.length > 0;
              const hasAIButton = document.querySelector('.ai-reply-btn');
              
              if (hasComposeWindow && !hasAIButton) {
                console.log('Compose window detected, injecting AI button...');
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

      // Add global click handler to close dropdowns when clicking outside
      document.addEventListener('click', (e) => {
        try {
          if (!e.target.closest('.ai-reply-container')) {
            document.querySelectorAll('.ai-tone-dropdown').forEach(dropdown => {
              dropdown.style.display = 'none';
            });
          }
        } catch (clickError) {
          // Ignore click handler errors
        }
      });

      console.log('Gmail AI Assistant initialized successfully with tone selection');
      
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