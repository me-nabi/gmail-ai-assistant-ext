// Gmail AI Assistant Content Script
console.log('Gmail AI Assistant Content Script Loaded');

// Gmail selectors and utilities
const GMAIL_SELECTORS = {
  // Compose window elements
  composeWindows: ['.aDh', '.btC', '[role="dialog"]', '.dw'],
  composeToolbar: ['.btC', '.aDh', '[role="toolbar"]', '.gU.Up', '.Am.Al.editable'],
  composeTextArea: [
    '[role="textbox"][g_editable="true"]', 
    '.Am.Al.editable [g_editable="true"]',
    '.editable[role="textbox"]',
    'div[contenteditable="true"][role="textbox"]'
  ],
  
  // Email content elements
  emailContent: [
    '.h7', 
    '.a3s.aiL', 
    '.ii.gt .a3s.aiL',
    '.gmail_quote',
    '[role="listitem"] .a3s'
  ],
  
  // Reply/Forward context
  replyContext: ['.h7', '.adP', '.adO'],
  
  // Send button
  sendButton: ['.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3', '[role="button"][data-tooltip*="Send"]']
};

// Extension state
let isExtensionActive = true;
let currentSettings = {};

// Initialize extension
initialize();

async function initialize() {
  console.log('Initializing Gmail AI Assistant...');
  
  // Load settings
  await loadSettings();
  
  // Setup observers
  setupMutationObserver();
  
  // Initial injection (in case compose is already open)
  setTimeout(() => {
    injectAIButton();
  }, 1000);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessages);
}

// Load settings from storage
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response.success) {
      currentSettings = response.settings;
      console.log('Settings loaded:', currentSettings);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Handle messages from background script or popup
function handleMessages(request, sender, sendResponse) {
  switch (request.action) {
    case 'generateReplyFromSelection':
      handleSelectionReply(request.selectedText);
      break;
    
    case 'refreshSettings':
      loadSettings();
      break;
      
    case 'toggleExtension':
      isExtensionActive = request.enabled;
      if (isExtensionActive) {
        injectAIButton();
      } else {
        removeAIButtons();
      }
      break;
  }
}

// Setup mutation observer to detect compose windows
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    if (!isExtensionActive) return;
    
    let shouldInject = false;
    
    mutations.forEach((mutation) => {
      // Check if new nodes were added
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if it's a compose window or contains compose elements
          const isComposeElement = GMAIL_SELECTORS.composeWindows.some(selector => 
            node.matches && (node.matches(selector) || node.querySelector(selector))
          );
          
          if (isComposeElement) {
            shouldInject = true;
          }
        }
      });
    });
    
    if (shouldInject) {
      // Delay injection to ensure DOM is ready
      setTimeout(() => {
        injectAIButton();
      }, 300);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Mutation observer setup complete');
}

// Create AI reply button
function createAIButton() {
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
  button.setAttribute('data-tooltip', 'Generate AI Reply');
  button.setAttribute('title', 'Generate AI Reply');
  
  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = 'none';
  });
  
  return button;
}

// Inject AI button into compose toolbar
function injectAIButton() {
  // Remove existing buttons first
  removeAIButtons();
  
  // Find all compose toolbars
  const toolbars = findElements(GMAIL_SELECTORS.composeToolbar);
  
  toolbars.forEach((toolbar, index) => {
    if (toolbar.querySelector('.ai-reply-btn')) return; // Skip if already exists
    
    const button = createAIButton();
    button.addEventListener('click', (e) => handleAIButtonClick(e, toolbar));
    
    // Insert button at the beginning of toolbar
    const firstChild = toolbar.firstElementChild;
    if (firstChild) {
      toolbar.insertBefore(button, firstChild);
    } else {
      toolbar.appendChild(button);
    }
  });
  
  console.log(`AI buttons injected into ${toolbars.length} compose window(s)`);
}

// Remove all AI buttons
function removeAIButtons() {
  document.querySelectorAll('.ai-reply-btn').forEach(btn => btn.remove());
}

// Handle AI button click
async function handleAIButtonClick(event, toolbar) {
  event.preventDefault();
  event.stopPropagation();
  
  const button = event.target.closest('.ai-reply-btn');
  if (!button) return;
  
  // Find the compose text area
  const composeArea = findNearestComposeArea(toolbar);
  if (!composeArea) {
    showNotification('Could not find compose area', 'error');
    return;
  }
  
  // Get email content for context
  const emailContent = getEmailContentForReply();
  
  if (!emailContent && !currentSettings.allowEmptyContext) {
    showNotification('No email context found. Please open an email thread first.', 'warning');
    return;
  }
  
  try {
    // Update button state
    updateButtonState(button, 'loading');
    
    // Generate reply
    const reply = await generateReply(emailContent || 'Generate a professional email response.');
    
    if (reply) {
      // Insert reply into compose area
      insertTextIntoCompose(composeArea, reply);
      showNotification('AI reply generated successfully!', 'success');
    } else {
      throw new Error('Empty response from AI');
    }
    
  } catch (error) {
    console.error('Error generating reply:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    updateButtonState(button, 'default');
  }
}

// Find nearest compose area relative to toolbar
function findNearestComposeArea(toolbar) {
  // Look in the same compose window
  const composeWindow = toolbar.closest('[role="dialog"], .aDh, .dw');
  if (composeWindow) {
    const textArea = findElements(GMAIL_SELECTORS.composeTextArea, composeWindow)[0];
    if (textArea) return textArea;
  }
  
  // Fallback: find any compose area
  return findElements(GMAIL_SELECTORS.composeTextArea)[0];
}

// Generate reply using background script
async function generateReply(emailContent) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateReply',
      emailContent: emailContent,
      settings: currentSettings
    });
    
    if (response.success) {
      return response.reply;
    } else {
      throw new Error(response.error || 'Failed to generate reply');
    }
  } catch (error) {
    throw new Error(`Communication error: ${error.message}`);
  }
}

// Get email content for context
function getEmailContentForReply() {
  const contentElements = findElements(GMAIL_SELECTORS.emailContent);
  
  let emailText = '';
  contentElements.forEach(element => {
    const text = element.innerText || element.textContent || '';
    if (text.trim()) {
      emailText += text.trim() + '\n\n';
    }
  });
  
  // Clean up the text
  emailText = emailText
    .replace(/\n{3,}/g, '\n\n')  // Remove excessive line breaks
    .replace(/^\s+|\s+$/g, '')   // Trim whitespace
    .substring(0, 3000);         // Limit length
  
  console.log('Extracted email content:', emailText.substring(0, 200) + '...');
  return emailText;
}

// Insert generated text into compose area
function insertTextIntoCompose(composeArea, text) {
  if (!composeArea) return;
  
  try {
    // Focus the compose area
    composeArea.focus();
    
    // Clear existing content if it's just placeholder
    const existingText = (composeArea.innerText || composeArea.textContent || '').trim();
    if (!existingText || existingText.length < 10) {
      composeArea.innerHTML = '';
    }
    
    // Insert text
    if (composeArea.contentEditable === 'true') {
      // For contenteditable divs
      document.execCommand('insertHTML', false, text.replace(/\n/g, '<br>'));
    } else {
      // For textareas
      composeArea.value = text;
      composeArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Trigger change events
    composeArea.dispatchEvent(new Event('input', { bubbles: true }));
    composeArea.dispatchEvent(new Event('change', { bubbles: true }));
    
  } catch (error) {
    console.error('Error inserting text:', error);
    
    // Fallback: try direct innerHTML
    try {
      composeArea.innerHTML = text.replace(/\n/g, '<br>');
    } catch (e) {
      console.error('Fallback insertion also failed:', e);
    }
  }
}

// Update button visual state
function updateButtonState(button, state) {
  switch (state) {
    case 'loading':
      button.style.opacity = '0.7';
      button.innerHTML = `
        <div style="width: 14px; height: 14px; border: 2px solid currentColor; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Generating...
      `;
      button.disabled = true;
      break;
      
    case 'success':
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"/>
        </svg>
        Done!
      `;
      setTimeout(() => updateButtonState(button, 'default'), 2000);
      break;
      
    case 'default':
    default:
      button.style.opacity = '1';
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L18.5 7.75L12 11L5.5 7.75L12 4.5ZM4 9.5L11 12.75V19.5L4 16.25V9.5ZM13 12.75L20 9.5V16.25L13 19.5V12.75Z"/>
        </svg>
        AI Reply
      `;
      button.disabled = false;
      break;
  }
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `ai-assistant-notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-family: 'Roboto', sans-serif;
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Set background color based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  notification.textContent = message;
  
  // Add close button
  const closeBtn = document.createElement('span');
  closeBtn.innerHTML = '×';
  closeBtn.style.cssText = `
    margin-left: 10px;
    cursor: pointer;
    font-weight: bold;
    float: right;
  `;
  closeBtn.onclick = () => notification.remove();
  notification.appendChild(closeBtn);
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Utility function to find elements with multiple selectors
function findElements(selectors, parent = document) {
  const elements = [];
  selectors.forEach(selector => {
    try {
      const found = parent.querySelectorAll(selector);
      elements.push(...found);
    } catch (e) {
      console.warn('Invalid selector:', selector, e);
    }
  });
  return [...new Set(elements)]; // Remove duplicates
}

// Handle selection-based reply generation
function handleSelectionReply(selectedText) {
  const composeAreas = findElements(GMAIL_SELECTORS.composeTextArea);
  if (composeAreas.length > 0) {
    generateReply(selectedText)
      .then(reply => {
        insertTextIntoCompose(composeAreas[0], reply);
        showNotification('AI reply generated from selection!', 'success');
      })
      .catch(error => {
        showNotification(`Error: ${error.message}`, 'error');
      });
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  
  .ai-reply-btn:active {
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);

console.log('Gmail AI Assistant Content Script Ready!');