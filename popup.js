console.log('This is a popup!');

document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  const apiKeyInput = document.getElementById('apiKey');
  const customPromptInput = document.getElementById('customPrompt');

  // Default prompt
  const defaultPrompt = `Analyze the following to determine if it offers any value professionally. 

Analyze the post content and respond with a JSON object containing:
{
  "isOpportunity": boolean,
  "category": string,
  "reason": string
}

Categories for non-opportunities:
- "social": Personal updates, celebrations, social content
- "blog": Blog posts, articles, thought leadership
- "non-career": Content unrelated to professional development
- "promotional": Company/product promotions
- "other": Other non-opportunity content

Only mark as opportunity if the post explicitly mentions:
- Job openings
- Internship opportunities
- Hiring announcements
- Career development programs
- Mentorship opportunities
- Networking events with career focus
- classes or workshops
`;

  // Load saved state
  chrome.storage.sync.get(['lockedInEnabled', 'openaiApiKey', 'customPrompt'], function(result) {
    if (result.lockedInEnabled) {
      toggleSwitch.classList.add('active');
      status.textContent = 'Filtering enabled';
    } else {
      status.textContent = 'Filtering disabled';
    }
    
    if (result.openaiApiKey) {
      apiKeyInput.value = result.openaiApiKey;
    }
    
    if (result.customPrompt) {
      customPromptInput.value = result.customPrompt;
    } else {
      customPromptInput.value = defaultPrompt;
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

    // Handle toggle action
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('linkedin.com/feed')) {
        if (!isActive) {
          // Enabling filtering - refresh the page
          chrome.tabs.reload(tabs[0].id);
        } else {
          // Disabling filtering - just restore all posts
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'restoreAllPosts'
          });
        }
      }
    });
  });

  // Save API key
  apiKeyInput.addEventListener('blur', function() {
    chrome.storage.sync.set({ openaiApiKey: apiKeyInput.value });
  });

  // Save custom prompt
  customPromptInput.addEventListener('blur', function() {
    chrome.storage.sync.set({ customPrompt: customPromptInput.value });
  });
});
