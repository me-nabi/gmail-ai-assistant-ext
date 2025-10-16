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
        // Explicitly handle custom instructions to avoid caching issues
        const customInstructions = response.settings.customInstructions;
        currentSettings = {
          ...response.settings,
          geminiApiKey: response.settings.apiKey || response.settings.geminiApiKey || '',
          replyTone: response.settings.replyTone || 'professional',
          maxTokens: response.settings.maxTokens || 500,
          temperature: response.settings.temperature || 0.7,
          customInstructions: (customInstructions === undefined || customInstructions === null) ? '' : customInstructions,
          autoReplyEnabled: response.settings.autoReplyEnabled !== false
        };
        console.log('Settings loaded successfully. Custom instructions:', currentSettings.customInstructions);
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
        gap: 6px;
      `;
      
      // Main AI Reply button
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
      
      // Custom Instructions button
      const customButton = document.createElement('div');
      customButton.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-custom-btn';
      customButton.style.cssText = `
        cursor: pointer;
        background: linear-gradient(135deg, #00b894 0%, #00a085 100%);
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
      
      customButton.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 2px;">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        <span>Custom</span>
        <svg class="ai-dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10L12 15L17 10H7Z"/>
        </svg>
      `;
      
      customButton.setAttribute('role', 'button');
      customButton.setAttribute('title', 'Edit Custom Instructions');
      
      // Create dropdowns
      const toneDropdown = createToneDropdown();
      const customDropdown = createCustomInstructionsDropdown();
      
      container.appendChild(button);
      container.appendChild(customButton);
      container.appendChild(toneDropdown);
      container.appendChild(customDropdown);
      
      return container;
    } catch (error) {
      console.error('Error creating AI button:', error);
      return null;
    }
  }

  // Create tone selection dropdown
  function createToneDropdown() {
    console.log('Creating tone dropdown with custom instructions...');
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
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.cssText = `
      height: 1px;
      background: #e1e5e9;
      margin: 4px 0;
    `;
    dropdown.appendChild(separator);
    
    // Add custom instructions option (like a tone option)
    console.log('Adding custom instructions option...');
    const customOption = document.createElement('div');
    customOption.className = 'ai-custom-option';
    customOption.style.cssText = `
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #e1e5e9;
    `;
    
    customOption.innerHTML = `
      <span style="font-size: 16px;">📝</span>
      <span style="color: #333;">Custom Instructions</span>
      <span style="margin-left: auto; color: #666; font-size: 11px;">Click to edit</span>
    `;
    
    customOption.addEventListener('mouseenter', () => {
      customOption.style.backgroundColor = '#f5f5f5';
    });
    
    customOption.addEventListener('mouseleave', () => {
      customOption.style.backgroundColor = 'transparent';
    });
    
    customOption.addEventListener('click', (e) => {
      e.stopPropagation();
      showCustomInstructionsEditor(dropdown);
    });
    
    dropdown.appendChild(customOption);
    
    console.log('Custom instructions option added to dropdown');
    return dropdown;
  }

  // Create custom instructions dropdown
  function createCustomInstructionsDropdown() {
    console.log('Creating custom instructions dropdown...');
    const dropdown = document.createElement('div');
    dropdown.className = 'ai-custom-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 320px;
      display: none;
      overflow: hidden;
      padding: 16px;
    `;
    
    dropdown.innerHTML = `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
          📝 Custom Instructions
        </div>
        <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
          Add specific instructions for AI replies (e.g., tone, style, length preferences)
        </div>
      </div>
      
      <textarea 
        class="custom-instructions-textarea"
        placeholder="Example: Always be polite and professional. Keep responses under 100 words. Use bullet points when listing items."
        style="
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          line-height: 1.4;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        "
      ></textarea>
      
      <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
        <button class="custom-cancel-btn" style="
          padding: 6px 12px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          color: #666;
        ">Cancel</button>
        <button class="custom-save-btn" style="
          padding: 6px 12px;
          border: none;
          background: #00b894;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        ">Save</button>
      </div>
    `;
    
    // Get elements
    const textarea = dropdown.querySelector('.custom-instructions-textarea');
    const saveBtn = dropdown.querySelector('.custom-save-btn');
    const cancelBtn = dropdown.querySelector('.custom-cancel-btn');
    
    // Load current instructions
    textarea.value = currentSettings.customInstructions || '';
    
    // Event handlers
    textarea.addEventListener('focus', () => {
      textarea.style.borderColor = '#00b894';
    });
    
    textarea.addEventListener('blur', () => {
      textarea.style.borderColor = '#e1e5e9';
    });
    
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const instructions = textarea.value.trim();
        console.log('Saving custom instructions:', instructions === '' ? '(empty)' : instructions);
        
        await chrome.runtime.sendMessage({
          action: 'updateCustomInstructions',
          customInstructions: instructions
        });
        
        // Force update current settings immediately
        currentSettings.customInstructions = instructions;
        console.log('Current settings updated. Custom instructions now:', currentSettings.customInstructions);
        
        showNotification(instructions === '' ? 'Custom instructions cleared!' : 'Custom instructions saved!', 'success');
        dropdown.style.display = 'none';
      } catch (error) {
        console.error('Error saving custom instructions:', error);
        showNotification('Error saving instructions', 'error');
      }
    });
    
    cancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      textarea.value = currentSettings.customInstructions || '';
      dropdown.style.display = 'none';
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    return dropdown;
  }

  // Show custom instructions editor
  function showCustomInstructionsEditor(dropdown) {
    console.log('Opening custom instructions editor...');
    
    // Create editor overlay
    const editor = document.createElement('div');
    editor.className = 'ai-custom-editor';
    editor.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const editorContent = document.createElement('div');
    editorContent.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    
    editorContent.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">
        📝 Custom Instructions
      </h3>
      <textarea 
        id="customInstructionsEditor" 
        placeholder="Add specific instructions for AI replies..."
        style="
          width: 100%;
          min-height: 120px;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          line-height: 1.4;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        "
      ></textarea>
      <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelCustom" style="
          padding: 8px 16px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        ">Cancel</button>
        <button id="saveCustom" style="
          padding: 8px 16px;
          border: none;
          background: #1a73e8;
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        ">Save</button>
      </div>
    `;
    
    const textarea = editorContent.querySelector('#customInstructionsEditor');
    textarea.value = currentSettings.customInstructions || '';
    
    // Event handlers
    editorContent.querySelector('#cancelCustom').addEventListener('click', () => {
      document.body.removeChild(editor);
      dropdown.style.display = 'none';
    });
    
    editorContent.querySelector('#saveCustom').addEventListener('click', async () => {
      try {
        const newInstructions = textarea.value.trim();
        await chrome.runtime.sendMessage({
          action: 'updateCustomInstructions',
          customInstructions: newInstructions
        });
        
        currentSettings.customInstructions = newInstructions;
        console.log('Custom instructions saved:', newInstructions);
        
        // Show success notification
        showNotification('Custom instructions saved!', 'success');
        
        document.body.removeChild(editor);
        dropdown.style.display = 'none';
      } catch (error) {
        console.error('Error saving custom instructions:', error);
        showNotification('Error saving instructions', 'error');
      }
    });
    
    // Close on overlay click
    editor.addEventListener('click', (e) => {
      if (e.target === editor) {
        document.body.removeChild(editor);
        dropdown.style.display = 'none';
      }
    });
    
    editor.appendChild(editorContent);
    document.body.appendChild(editor);
    
    // Focus textarea
    setTimeout(() => textarea.focus(), 100);
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
          const customButton = buttonContainer.querySelector('.ai-custom-btn');
          const customDropdown = buttonContainer.querySelector('.ai-custom-dropdown');
          
          // Add click handlers for AI Reply button
          button.addEventListener('click', async (e) => {
            // Check if click was on dropdown arrow
            if (e.target.closest('.ai-dropdown-arrow')) {
              e.preventDefault();
              e.stopPropagation();
              
              // Hide custom dropdown if open
              if (customDropdown) customDropdown.style.display = 'none';
              
              // Refresh settings and dropdown before showing
              await loadSettings();
              const refreshedDropdown = refreshDropdown(buttonContainer) || dropdown;
              toggleDropdown(refreshedDropdown);
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
          
          // Add click handlers for Custom Instructions button
          if (customButton && customDropdown) {
            customButton.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Hide tone dropdown if open
              if (dropdown) dropdown.style.display = 'none';
              
              // Toggle custom dropdown
              if (customDropdown.style.display === 'block') {
                customDropdown.style.display = 'none';
              } else {
                // Refresh current settings
                await loadSettings();
                const textarea = customDropdown.querySelector('.custom-instructions-textarea');
                if (textarea) {
                  textarea.value = currentSettings.customInstructions || '';
                }
                customDropdown.style.display = 'block';
              }
            });
          }
          
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
        console.log('Received updateSettings message, reloading settings...');
        loadSettings().then(() => {
          console.log('Settings reloaded. Custom instructions:', currentSettings.customInstructions);
          // Refresh all existing dropdowns with new settings
          document.querySelectorAll('.ai-reply-container').forEach(container => {
            refreshDropdown(container);
          });
        });
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
            document.querySelectorAll('.ai-custom-dropdown').forEach(dropdown => {
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