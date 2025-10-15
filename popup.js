// Gmail AI Assistant Popup Script
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Popup loaded');
    
    // Get DOM elements
    const elements = {
        apiKey: document.getElementById('apiKey'),
        maxTokens: document.getElementById('maxTokens'),
        toggleApiKey: document.getElementById('toggleApiKey'),
        testConnection: document.getElementById('testConnection'),
        saveSettings: document.getElementById('saveSettings'),
        statusMessage: document.getElementById('statusMessage')
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
            elements.toggleApiKey.textContent = isPassword ? '🙈' : '👁️';
        });
        
        // Test API connection
        elements.testConnection.addEventListener('click', testApiConnection);
        
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
                maxTokens: parseInt(elements.maxTokens.value),
                autoReplyEnabled: elements.autoReplyEnabled.checked,
                temperature: parseFloat(elements.temperature.value)
            };
            
            // Validate settings
            if (settings.maxTokens < 50 || settings.maxTokens > 2000) {
                throw new Error('Max tokens must be between 50 and 2000');
            }
            
            if (settings.temperature < 0 || settings.temperature > 1) {
                throw new Error('Temperature must be between 0 and 1');
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
                } else {
                    showStatus('✅ Settings saved successfully!', 'success');
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
                maxTokens: parseInt(elements.maxTokens.value),
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