// Gmail AI Assistant Popup Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');
    
    // Get DOM elements
    const elements = {
        apiKey: document.getElementById('apiKey'),
        maxTokens: document.getElementById('maxTokens'),
        toggleApiKey: document.getElementById('toggleApiKey'),
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
                elements.maxTokens.value = settings.maxTokens || '500';
                
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
                'M2 4.27L3.28 3L20 19.72L18.73 21L15.65 17.92C14.5 18.3 13.28 18.5 12 18.5C7 18.5 2.7 15.4 1 11C2.1 8.84 3.84 7.11 6 6.19L2 2.27ZM12 5.5C10.5 5.5 9.26 6.24 8.46 7.35L10.69 9.58C11.09 9.23 11.53 9 12 9C13.66 9 15 10.34 15 12C15 12.47 14.77 12.91 14.42 13.31L16.65 15.54C17.81 14.74 18.77 13.61 19.5 12.3C18.2 8.61 15.3 5.5 12 5.5Z' :
                'M12 4.5C7 4.5 2.7 7.6 1 12C2.7 16.4 7 19.5 12 19.5S21.3 16.4 23 12C21.3 7.6 17 4.5 12 4.5ZM12 17C9.2 17 7 14.8 7 12S9.2 7 12 7S17 9.2 17 12S14.8 17 12 17ZM12 9C10.3 9 9 10.3 9 12S10.3 15 12 15S15 13.7 15 12S13.7 9 12 9Z'
            );
        });
        
        // Save settings
        elements.saveSettings.addEventListener('click', saveSettings);
        
        // Auto-save on input changes
        const inputElements = [
            elements.apiKey,
            elements.maxTokens
        ];
        
        inputElements.forEach(element => {
            element.addEventListener('change', debounce(autoSave, 1000));
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.addEventListener('input', debounce(autoSave, 2000));
            }
        });
    }
    

    
    // Save settings
    async function saveSettings() {
        elements.saveSettings.classList.add('loading');
        elements.saveSettings.disabled = true;
        
        try {
            const settings = {
                apiKey: elements.apiKey.value.trim(),
                maxTokens: parseInt(elements.maxTokens.value),
                autoReplyEnabled: true, // Always enabled by default
                temperature: 0.7 // Default balanced creativity
            };
            
            // Validate settings
            if (settings.maxTokens < 50 || settings.maxTokens > 2000) {
                throw new Error('Max tokens must be between 50 and 2000');
            }
            

            
            // Warning for missing API key (but don't prevent saving)
            if (!settings.apiKey) {
                console.warn('API key not provided - extension functionality will be limited');
            }
            
            // Save to storage
            const response = await chrome.runtime.sendMessage({
                action: 'saveSettings',
                settings: settings
            });
            
            if (response.success) {
                if (!settings.apiKey) {
                    showStatus('⚠️ Settings saved! Please add API key to enable AI features.', 'warning');
                    elements.statusText.textContent = 'API Key Required';
                    elements.statusDot.className = 'status-dot error';
                } else {
                    showStatus('✅ Settings saved successfully!', 'success');
                    // Test API connection automatically after saving with API key (with small delay)
                    setTimeout(() => {
                        testApiQuickly(settings.apiKey).then(() => {
                            // Close popup after connection test completes
                            setTimeout(() => window.close(), 1000);
                        });
                    }, 500);
                }
                
                // If no API key, close popup immediately after showing message
                if (!settings.apiKey) {
                    setTimeout(() => window.close(), 1500);
                }
                
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
                maxTokens: parseInt(elements.maxTokens.value),
                autoReplyEnabled: true,
                temperature: 0.7,
                apiKeyValid: null // Clear validation when API key changes
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

    // Quick API test (simplified version without UI blocking)
    async function testApiQuickly(apiKey) {
        try {
            console.log('Testing API connection with key:', apiKey.substring(0, 10) + '...');
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: 'Hello'
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50,
                    topP: 0.8,
                    topK: 10
                }
            };
            
            // Try different models (same as background.js)
            const models = [
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
                'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
            ];
            
            for (const modelUrl of models) {
                try {
                    console.log('Trying model:', modelUrl);
                    
                    const response = await fetch(`${modelUrl}?key=${apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody)
                    });
                    
                    console.log('Response status:', response.status, 'for model:', modelUrl);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('API Response:', JSON.stringify(data, null, 2));
                        
                        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
                            console.log('✅ API test successful with model:', modelUrl);
                            await updateConnectionStatus(true);
                            showStatus('✅ Connected! Popup will close automatically.', 'success');
                            // Store successful test result
                            await chrome.storage.sync.set({ 
                                apiKeyValid: true,
                                lastApiTest: Date.now()
                            });
                            return true;
                        }
                    } else {
                        const errorText = await response.text();
                        console.log('Model failed:', modelUrl, 'Status:', response.status, 'Error:', errorText);
                        continue; // Try next model
                    }
                } catch (modelError) {
                    console.log('Model error:', modelUrl, modelError.message);
                    continue; // Try next model
                }
            }
            
            // If we get here, all models failed
            console.log('❌ All models failed');
            await updateConnectionStatus(false);
            showStatus('❌ Connection failed - Check API key', 'error');
            await chrome.storage.sync.set({ apiKeyValid: false });
            return false;
            
        } catch (error) {
            console.error('❌ Quick API test failed with exception:', error);
            showStatus('❌ Connection test failed', 'error');
            await updateConnectionStatus(false);
            await chrome.storage.sync.set({ apiKeyValid: false });
            return false;
        }
    }

    // Check extension status
    async function checkStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
            if (response.success) {
                const hasApiKey = response.settings.apiKey && response.settings.apiKey.trim().length > 0;
                const isEnabled = response.settings.autoReplyEnabled !== false;
                const apiKeyValid = response.settings.apiKeyValid;
                
                if (!hasApiKey) {
                    elements.statusText.textContent = 'API Key Required';
                    elements.statusDot.className = 'status-dot error';
                } else if (!isEnabled) {
                    elements.statusText.textContent = 'Disabled';
                    elements.statusDot.className = 'status-dot';
                } else if (apiKeyValid === false) {
                    // API key exists but validation failed
                    elements.statusText.textContent = 'Connection Failed';
                    elements.statusDot.className = 'status-dot error';
                } else if (apiKeyValid === true) {
                    // API key exists and validation succeeded
                    elements.statusText.textContent = 'Connected';
                    elements.statusDot.className = 'status-dot connected';
                } else {
                    // API key exists but not tested yet
                    elements.statusText.textContent = 'Not Tested';
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
    async function updateConnectionStatus(connected) {
        if (connected) {
            elements.statusText.textContent = 'Connected';
            elements.statusDot.className = 'status-dot connected';
        } else {
            elements.statusText.textContent = 'Connection Failed';
            elements.statusDot.className = 'status-dot error';
        }
        
        // Store the validation result
        try {
            await chrome.storage.sync.set({ 
                apiKeyValid: connected,
                lastApiTest: Date.now()
            });
        } catch (error) {
            console.error('Error storing API validation result:', error);
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