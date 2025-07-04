// Background service worker for handling OpenAI API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePost') {
    analyzePostWithGPT(request.content)
      .then(result => {
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error analyzing post:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

async function analyzePostWithGPT(content) {
  try {
    // Get API key from storage
    const result = await chrome.storage.sync.get(['openaiApiKey']);
    const apiKey = result.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add it in the extension popup.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant that analyzes LinkedIn posts to determine if they offer career opportunities or internships. 
            
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
            - Networking events with career focus`
          },
          {
            role: 'user',
            content: `Analyze this LinkedIn post: "${content}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;
    
    try {
      return JSON.parse(analysis);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return {
        isOpportunity: false,
        category: 'other',
        reason: 'Unable to parse analysis'
      };
    }
  } catch (error) {
    console.error('Error in analyzePostWithGPT:', error);
    throw error;
  }
} 