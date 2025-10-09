// Gmail AI Assistant Popup Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');
    
    // Get DOM elements
    const elements = {
        apiKey: document.getElementById('apiKey'),
        replyTone: document.getElementById('replyTone'),
        maxTokens: document.getElementById('maxTokens'),
        customInstructions: document.getElementById('customInstructions'),
        autoReplyEnabled: document.getElementById('autoReplyEnabled'),
        temperature: document.getElementById('temperature'),
        toggleApiKey: document.getElementById('toggleApiKey'),
        testConnection: document.getElementById('testConnection'),
        saveSettings: document.getElementById('saveSettings'),
        statusMessage: document.getElementById('statusMessage'),
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText')
    };
    
    // Load existing settings
    await loadSettings();
    
    // Event listeners
    setupEventListeners();
    
    // Initial status check
    checkStatus();
    
    // Load settings from storage
    async function loadSettings() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (response.success) {
                const settings = response.settings;
                
                // Populate form fields
                elements.apiKey.value = settings.apiKey || '';
                elements.replyTone.value = settings.replyTone || 'professional';
                elements.maxTokens.value = settings.maxTokens || '500';
                elements.customInstructions.value = settings.customInstructions || '';
                elements.autoReplyEnabled.checked = settings.autoReplyEnabled !== false;
                elements.temperature.value = settings.temperature || '0.7';
                
                console.log('Settings loaded:', settings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            showStatus('Failed to load settings', 'error');
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // API key toggle visibility
        elements.toggleApiKey.addEventListener('click', () => {
            const isPassword = elements.apiKey.type === 'password';
            elements.apiKey.type = isPassword ? 'text' : 'password';
            
            const eyeIcon = document.getElementById('eyeIcon');
            eyeIcon.setAttribute('d', isPassword ? 
                'M12 4.5C7 4.5 2.7 7.6 1 12C2.7 16.4 7 19.5 12 19.5S21.3 16.4 23 12C21.3 7.6 17 4.5 12 4.5ZM12 17C9.2 17 7 14.8 7 12S9.2 7 12 7S17 9.2 17 12S14.8 17 12 17ZM12 9C10.3 9 9 10.3 9 12S10.3 15 12 15S15 13.7 15 12S13.7 9 12 9Z' :
                'M2 4.27L3.28 3L20 19.72L18.73 21L15.65 17.92C14.5 18.3 13.28 18.5 12 18.5C7 18.5 2.7 15.4 1 11C2.1 8.84 3.84 7.11 6 6.19L2 2.27ZM12 5.5C10.5 5.5 9.26 6.24 8.46 7.35L10.69 9.58C11.09 9.23 11.53 9 12 9C13.66 9 15 10.34 15 12C15 12.47 14.77 12.91 14.42 13.31L16.65 15.54C17.81 14.74 18.77 13.61 19.5 12.3C18.2 8.61 15.3 5.5 12 5.5Z'
            );
        });
        
        // Test API connection
        elements.testConnection.addEventListener('click', testApiConnection);
        
        // Save settings
        elements.saveSettings.addEventListener('click', saveSettings);
        
        // Auto-save on input changes
        const inputElements = [
            elements.apiKey,
            elements.replyTone,
            elements.maxTokens,
            elements.customInstructions,
            elements.autoReplyEnabled,
            elements.temperature
        ];
        
        inputElements.forEach(element => {
            element.addEventListener('change', debounce(autoSave, 1000));
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.addEventListener('input', debounce(autoSave, 2000));
            }
        });
    }
    
    // Test API connection
    async function testApiConnection() {
        const apiKey = elements.apiKey.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key first', 'warning');
            return;
        }
        
        // Show loading state
        elements.testConnection.classList.add('loading');
        elements.testConnection.disabled = true;
        showStatus('Testing API connection...', 'info');
        
        try {
            // Test with a simple prompt
            const testPrompt = 'Say "API connection successful" if you can read this message.';
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: testPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50
                }
            };
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'API request failed';
                
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.error && errorData.error.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch (e) {
                    // Use default error message
                }
                
                throw new Error(`${response.status}: ${errorMessage}`);
            }
            
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                showStatus('✅ API connection successful!', 'success');
                updateConnectionStatus(true);
            } else {
                throw new Error('Unexpected API response format');
            }
            
        } catch (error) {
            console.error('API test failed:', error);
            showStatus(`❌ API test failed: ${error.message}`, 'error');
            updateConnectionStatus(false);
        } finally {
            elements.testConnection.classList.remove('loading');
            elements.testConnection.disabled = false;
        }
    }
    
    // Save settings
    async function saveSettings() {
        elements.saveSettings.classList.add('loading');
        elements.saveSettings.disabled = true;
        
        try {
            const settings = {
                apiKey: elements.apiKey.value.trim(),
                replyTone: elements.replyTone.value,
                maxTokens: parseInt(elements.maxTokens.value),
                customInstructions: elements.customInstructions.value.trim(),
                autoReplyEnabled: elements.autoReplyEnabled.checked,
                temperature: parseFloat(elements.temperature.value)
            };
            
            // Validate settings
            if (!settings.apiKey) {
                throw new Error('API key is required');
            }
            
            if (settings.maxTokens < 50 || settings.maxTokens > 2000) {
                throw new Error('Max tokens must be between 50 and 2000');
            }
            
            if (settings.temperature < 0 || settings.temperature > 1) {
                throw new Error('Temperature must be between 0 and 1');
            }
            
            // Save to storage
            const response = await chrome.runtime.sendMessage({
                action: 'saveSettings',
                settings: settings
            });
            
            if (response.success) {
                showStatus('✅ Settings saved successfully!', 'success');
                
                // Notify content script about settings change
                try {
                    const tabs = await chrome.tabs.query({ 
                        url: '*://mail.google.com/*' 
                    });
                    
                    for (const tab of tabs) {
                        chrome.tabs.sendMessage(tab.id, { 
                            action: 'refreshSettings' 
                        }).catch(() => {
                            // Ignore errors for inactive tabs
                        });
                    }
                } catch (error) {
                    console.log('Could not notify content scripts:', error);
                }
                
                // Update status
                checkStatus();
            } else {
                throw new Error('Failed to save settings');
            }
            
        } catch (error) {
            console.error('Error saving settings:', error);
            showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            elements.saveSettings.classList.remove('loading');
            elements.saveSettings.disabled = false;
        }
    }
    
    // Auto-save settings (without UI feedback)
    async function autoSave() {
        try {
            const settings = {
                apiKey: elements.apiKey.value.trim(),
                replyTone: elements.replyTone.value,
                maxTokens: parseInt(elements.maxTokens.value),
                customInstructions: elements.customInstructions.value.trim(),
                autoReplyEnabled: elements.autoReplyEnabled.checked,
                temperature: parseFloat(elements.temperature.value)
            };
            
            await chrome.runtime.sendMessage({
                action: 'saveSettings',
                settings: settings
            });
            
            console.log('Settings auto-saved');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    // Check extension status
    async function checkStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (response.success) {
                const hasApiKey = response.settings.apiKey && response.settings.apiKey.trim().length > 0;
                const isEnabled = response.settings.autoReplyEnabled !== false;
                
                if (hasApiKey && isEnabled) {
                    updateConnectionStatus(true);
                } else if (!hasApiKey) {
                    elements.statusText.textContent = 'API Key Required';
                    elements.statusDot.className = 'status-dot error';
                } else {
                    elements.statusText.textContent = 'Disabled';
                    elements.statusDot.className = 'status-dot';
                }
            }
        } catch (error) {
            console.error('Error checking status:', error);
            elements.statusText.textContent = 'Error';
            elements.statusDot.className = 'status-dot error';
        }
    }
    
    // Update connection status indicator
    function updateConnectionStatus(connected) {
        if (connected) {
            elements.statusText.textContent = 'Connected';
            elements.statusDot.className = 'status-dot connected';
        } else {
            elements.statusText.textContent = 'Connection Failed';
            elements.statusDot.className = 'status-dot error';
        }
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status-message show ${type}`;
        
        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                elements.statusMessage.classList.remove('show');
            }, 5000);
        }
    }
    
    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Handle extension icon clicks and keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveSettings();
        }
        
        if (e.key === 'Escape') {
            window.close();
        }
    });
});

// Handle popup lifecycle
window.addEventListener('beforeunload', () => {
    console.log('Popup closing');
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // Export functions for testing
    };
}