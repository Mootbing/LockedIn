# LockedIn - LinkedIn Post Filter

A Chrome extension that filters LinkedIn posts to show only career opportunities and internships, powered by GPT-3.5.

## Features

- **Smart Filtering**: Uses GPT-3.5 to analyze LinkedIn posts and identify career opportunities
- **Real-time Processing**: Filters posts as they load on scroll
- **Easy Toggle**: Simple on/off switch in the extension popup
- **Post Restoration**: Click "Show" to restore any filtered post
- **Category Classification**: Posts are categorized by why they were filtered (social, blog, promotional, etc.)

## Installation

1. **Download the Extension Files**
   - Clone or download this repository to your local machine

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the folder containing the extension files

3. **Set Up OpenAI API Key**
   - Click the LockedIn extension icon in your toolbar
   - Enter your OpenAI API key in the popup
   - Get an API key from [OpenAI's website](https://platform.openai.com/api-keys)

## Usage

1. **Navigate to LinkedIn Feed**
   - Go to `https://www.linkedin.com/feed/`

2. **Enable Filtering**
   - Click the LockedIn extension icon
   - Toggle the switch to enable filtering
   - The extension will start analyzing and filtering posts

3. **View Filtered Posts**
   - Posts that don't contain career opportunities will be replaced with a filter overlay
   - Each overlay shows the category and reason for filtering
   - Click "Show" to restore any filtered post

## How It Works

The extension:
1. Scrapes LinkedIn post content from the feed
2. Sends post text to GPT-3.5 for analysis
3. Determines if the post offers career opportunities or internships
4. Filters out non-opportunity posts and replaces them with informative overlays
5. Monitors for new posts loaded via infinite scroll

## Categories

Posts are filtered into these categories:
- **social**: Personal updates, celebrations, social content
- **blog**: Blog posts, articles, thought leadership
- **non-career**: Content unrelated to professional development
- **promotional**: Company/product promotions
- **other**: Other non-opportunity content

## Requirements

- Chrome browser
- OpenAI API key
- Active LinkedIn account

## Privacy

- Post content is sent to OpenAI for analysis
- No data is stored locally except your API key and toggle preference
- The extension only works on LinkedIn feed pages

## Troubleshooting

- **Posts not filtering**: Make sure you're on the LinkedIn feed page and the toggle is enabled
- **API errors**: Verify your OpenAI API key is correct and has sufficient credits
- **Extension not working**: Try refreshing the LinkedIn page after enabling the extension

## Files

- `manifest.json`: Extension configuration
- `popup.html/js`: Extension popup interface
- `content.js`: Main content script for LinkedIn page interaction
- `background.js`: Service worker for API calls
- `hello_extensions.png`: Extension icon 