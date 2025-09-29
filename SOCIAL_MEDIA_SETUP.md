# Social Media Setup Guide

This guide explains how to configure the Content Agent to automatically post content to social media platforms.

## Overview

The Content Agent can automatically post generated content to:
- **YouTube** - For long-form videos and shorts
- **Instagram** - For photos and reels
- **TikTok** - For short-form videos

## Setup Instructions

### 1. YouTube Setup

1. **Create a Google Cloud Project:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the YouTube Data API v3

2. **Create OAuth 2.0 Credentials:**
   - Go to "Credentials" in the Google Cloud Console
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Desktop application"
   - Download the JSON file as `youtube_credentials.json`

3. **Set Environment Variables:**
   ```bash
   export YOUTUBE_CREDENTIALS_PATH="credentials/youtube_credentials.json"
   export YOUTUBE_TOKEN_PATH="credentials/youtube_token.json"
   ```

4. **First Run:**
   - The first time you run the content agent, it will open a browser window
   - Sign in to your Google account and authorize the application
   - The token will be saved for future use

### 2. Instagram Setup

1. **Create Instagram App:**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Instagram Basic Display product
   - Generate an access token

2. **Set Environment Variable:**
   ```bash
   export INSTAGRAM_ACCESS_TOKEN="your_instagram_access_token"
   ```

### 3. TikTok Setup

1. **Create TikTok for Business Account:**
   - Go to [TikTok for Business](https://business.tiktok.com/)
   - Create a developer account
   - Generate API credentials

2. **Set Environment Variable:**
   ```bash
   export TIKTOK_ACCESS_TOKEN="your_tiktok_access_token"
   ```

## Environment Configuration

Create a `.env` file in the content agent directory:

```env
# YouTube Configuration
YOUTUBE_CREDENTIALS_PATH=credentials/youtube_credentials.json
YOUTUBE_TOKEN_PATH=credentials/youtube_token.json

# Instagram Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_token_here

# TikTok Configuration
TIKTOK_ACCESS_TOKEN=your_tiktok_token_here
```

## Testing the Setup

1. **Check Posting Status:**
   ```bash
   curl http://localhost:8030/v1/content/posting-status
   ```

2. **Test Content Posting:**
   ```bash
   curl -X POST http://localhost:8030/v1/content/post \
     -H "Content-Type: application/json" \
     -d '{
       "content_metadata": {
         "youtube": {
           "caption": "Test video from our farm",
           "hashtags": ["#farming", "#drone", "#agriculture"]
         }
       },
       "media_files": {
         "youtube": "/path/to/video.mp4"
       }
     }'
   ```

## Content Workflow

1. **Drone Records Video** → Content Agent processes it
2. **Content Agent Generates** → Platform-specific clips and captions
3. **Content Agent Posts** → Automatically to configured platforms
4. **Dashboard Shows** → Posting results and engagement metrics

## Troubleshooting

### YouTube Issues
- **"Credentials not found"**: Check `YOUTUBE_CREDENTIALS_PATH` environment variable
- **"Token expired"**: Delete `youtube_token.json` and re-authenticate
- **"Quota exceeded"**: Check YouTube API quota in Google Cloud Console

### Instagram Issues
- **"Access token invalid"**: Regenerate token in Facebook Developers
- **"Rate limit exceeded"**: Wait and retry, or upgrade Instagram API plan

### TikTok Issues
- **"Access token invalid"**: Check TikTok for Business credentials
- **"Video too large"**: Ensure video meets TikTok size requirements

## Security Notes

- Never commit credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate access tokens
- Monitor API usage and quotas

## Production Deployment

For production deployment:

1. **Use Docker secrets** for credential management
2. **Set up monitoring** for API quotas and errors
3. **Implement retry logic** for failed posts
4. **Add content moderation** before posting
5. **Set up analytics** to track engagement

## Support

If you encounter issues:
1. Check the content agent logs: `docker logs content-agent`
2. Verify environment variables are set correctly
3. Test API credentials individually
4. Check platform-specific API documentation
