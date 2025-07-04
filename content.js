// Content script for LinkedIn post filtering
class LockedInFilter {
  constructor() {
    this.isEnabled = false;
    this.processedPosts = new Set();
    this.observer = null;
    this.init();
  }

  async init() {
    // Load saved state
    const result = await chrome.storage.sync.get(['lockedInEnabled']);
    this.isEnabled = result.lockedInEnabled || false;
    
    if (this.isEnabled) {
      this.startFiltering();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'restoreAllPosts') {
        this.restoreAllPosts();
      }
    });
  }

  startFiltering() {
    this.isEnabled = true;
    this.processExistingPosts();
    this.startObserver();
  }

  stopFiltering() {
    this.isEnabled = false;
    this.restoreAllPosts();
    this.stopObserver();
  }

  startObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new MutationObserver((mutations) => {
      if (!this.isEnabled) return;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processNewPosts(node);
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  processExistingPosts() {
    const posts = this.getLinkedInPosts();
    posts.forEach(post => this.processPost(post));
  }

  processNewPosts(container) {
    const posts = container.querySelectorAll ? 
      container.querySelectorAll('[data-urn*="activity:"]') : 
      [];
    
    posts.forEach(post => this.processPost(post));
  }

  getLinkedInPosts() {
    // LinkedIn post selectors - they use data-urn attributes for posts
    return document.querySelectorAll('[data-urn*="activity:"]');
  }

  async processPost(postElement) {
    if (!this.isEnabled || this.processedPosts.has(postElement)) {
      return;
    }

    this.processedPosts.add(postElement);
    
    try {
      const postContent = this.extractPostContent(postElement);
      if (!postContent || postContent.trim().length < 10) {
        return; // Skip posts with minimal content
      }

      const analysis = await this.analyzePost(postContent);
      
      if (!analysis.isOpportunity) {
        this.filterPost(postElement, analysis);
      }
    } catch (error) {
      console.error('Error processing post:', error);
    }
  }

  extractPostContent(postElement) {
    // Try multiple selectors to find post content
    const selectors = [
      '.feed-shared-text',
      '.feed-shared-update-v2__description',
      '.feed-shared-text__text',
      '[data-test-id="post-text"]',
      '.break-words'
    ];

    for (const selector of selectors) {
      const contentElement = postElement.querySelector(selector);
      if (contentElement) {
        return contentElement.textContent.trim();
      }
    }

    return null;
  }

  extractUserName(postElement) {
    // Try multiple selectors to find the user's name
    const nameSelectors = [
      '.feed-shared-actor__name',
      '.feed-shared-actor__title',
      '[data-test-id="post-actor-name"]',
      '.feed-shared-post-meta__name',
      '.feed-shared-actor__name-link',
      'a[data-control-name="actor_profile"] span',
      '.feed-shared-actor__name span'
    ];

    for (const selector of nameSelectors) {
      const nameElement = postElement.querySelector(selector);
      if (nameElement) {
        const name = nameElement.textContent.trim();
        if (name && name.length > 0) {
          return name;
        }
      }
    }

    // Fallback: try to find any link that might contain the name
    const nameLinks = postElement.querySelectorAll('a[href*="/in/"]');
    for (const link of nameLinks) {
      const nameElement = link.querySelector('span');
      if (nameElement) {
        const name = nameElement.textContent.trim();
        if (name && name.length > 0 && name.length < 100) {
          return name;
        }
      }
    }

    return 'User';
  }

  async analyzePost(content) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'analyzePost',
        content: content
      }, (response) => {
        if (response && response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response?.error || 'Analysis failed'));
        }
      });
    });
  }

  filterPost(postElement, analysis) {
    // Store original content
    const originalContent = postElement.innerHTML;
    postElement.setAttribute('data-lockedin-original', originalContent);
    
    // Extract user name before filtering
    const userName = this.extractUserName(postElement);
    postElement.setAttribute('data-lockedin-username', userName);
    
    // Create filter overlay
    const filterOverlay = this.createFilterOverlay(analysis, postElement, userName);
    
    // Replace post content with filter overlay
    postElement.innerHTML = '';
    postElement.appendChild(filterOverlay);
    
    // Add filtered class for styling
    postElement.classList.add('lockedin-filtered');
  }

  createFilterOverlay(analysis, postElement, userName) {
    const overlay = document.createElement('div');
    overlay.className = 'lockedin-filter-overlay';
    overlay.style.cssText = `
      padding: 20px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin: 10px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const category = analysis.category || 'other';
    const reason = analysis.reason || 'Non-career content';
    
    overlay.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="color: #6c757d; font-size: 12px; text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">
            [${category}] | ${userName.toLowerCase().replace("1st", "").replace("2nd", "").replace("3rd", "").toUpperCase()} | Stay LockedIn™️
          </div>
          <div style="color: #6c757d; font-size: 12px; margin-top: 4px;">
            Summary: ${reason}
          </div>
        </div>
        <button class="lockedin-show-btn" style="
          background: #0077b5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
        ">Show</button>
      </div>
    `;

    // Add click handler to restore post
    const showBtn = overlay.querySelector('.lockedin-show-btn');
    showBtn.addEventListener('click', () => {
      this.restorePost(postElement);
    });

    return overlay;
  }

  restorePost(postElement) {
    const originalContent = postElement.getAttribute('data-lockedin-original');
    if (originalContent) {
      postElement.innerHTML = originalContent;
      postElement.removeAttribute('data-lockedin-original');
      postElement.removeAttribute('data-lockedin-username');
      postElement.classList.remove('lockedin-filtered');
    }
  }

  restoreAllPosts() {
    const filteredPosts = document.querySelectorAll('.lockedin-filtered');
    filteredPosts.forEach(post => this.restorePost(post));
  }
}

// Initialize the filter when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LockedInFilter();
  });
} else {
  new LockedInFilter();
} 