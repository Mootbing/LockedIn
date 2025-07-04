console.log('This is a popup!');

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  const apiKeyInput = document.getElementById('apiKey');

  // Load saved state
  chrome.storage.sync.get(['lockedInEnabled', 'openaiApiKey'], function(result) {
    if (result.lockedInEnabled) {
      toggleSwitch.classList.add('active');
      status.textContent = 'Filtering enabled';
    } else {
      status.textContent = 'Filtering disabled';
    }
    
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
  });

  // Toggle functionality
  toggleSwitch.addEventListener('click', function() {
    const isActive = toggleSwitch.classList.contains('active');
    
    if (isActive) {
      toggleSwitch.classList.remove('active');
      status.textContent = 'Filtering disabled';
      chrome.storage.sync.set({ lockedInEnabled: false });
    } else {
      toggleSwitch.classList.add('active');
      status.textContent = 'Filtering enabled';
      chrome.storage.sync.set({ lockedInEnabled: true });
    }

    // Refresh the page when toggle is flipped
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('linkedin.com/feed')) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });

  // Save API key
  apiKeyInput.addEventListener('blur', function() {
    chrome.storage.sync.set({ openaiApiKey: apiKeyInput.value });
  });
});
