# Transcription Module Setup Guide

This guide explains how to set up the microphone transcription feature using Google Speech-to-Text API.

## Overview

The transcription module is a standalone component (`components/Common/transcriptionEditor.vue`) that can be used throughout the application. It provides:
- Microphone recording functionality
- Real-time transcription using Google Speech-to-Text API
- Text editor with save functionality
- Reusable across different components

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Google Cloud Project**: Create a project in Google Cloud Console
3. **Speech-to-Text API**: Enable the Speech-to-Text API in your Google Cloud project

## Setup Steps

### 1. Enable Google Speech-to-Text API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Cloud Speech-to-Text API"
5. Click on it and press **Enable**

### 2. Create Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - **Service account name**: `speech-to-text-service`
   - **Service account ID**: (auto-generated)
   - **Description**: Service account for Speech-to-Text API
4. Click **Create and Continue**
5. Grant the role: **Cloud Speech-to-Text API User**
6. Click **Continue** and then **Done**

### 3. Create and Download JSON Key

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file
6. **Important**: Keep this file secure and never commit it to version control

### 4. Install Google Cloud Speech-to-Text Package

Run the following command in your project root:

```bash
npm install @google-cloud/speech
```

**Note**: This package will be added to your `package.json` dependencies. Make sure to run `npm install` after adding it.

### 5. Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add the following:

```env
# Google Cloud Speech-to-Text Credentials
# Path to your service account JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

**Important Notes:**
- Use an **absolute path** to the JSON key file
- On Windows, use forward slashes or double backslashes: `C:/path/to/key.json` or `C:\\path\\to\\key.json`
- On macOS/Linux: `/Users/username/path/to/key.json`
- The path should point to the JSON file you downloaded in step 3

### 6. Example .env File

```env
# Existing environment variables
BASE_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
# ... other variables ...

# Google Cloud Speech-to-Text
# Use absolute path to your JSON key file
GOOGLE_APPLICATION_CREDENTIALS=/Users/mac/Flossly/config/google-cloud-key.json
```

**Note**: The file has been moved to `config/google-cloud-key.json` in your project. Use the absolute path as shown above.

### 7. Security Best Practices

1. **Never commit the JSON key file to Git**
   - The file has already been added to `.gitignore`:
     ```
     # Google Cloud credentials
     config/google-cloud-key.json
     **/google-cloud-key.json
     **/*-service-account*.json
     **/*-credentials*.json
     ```

2. **Store credentials securely**
   - For production, use environment variables or secret management services
   - Consider using Google Cloud Secret Manager for production deployments

3. **Restrict API access**
   - Only grant necessary permissions to the service account
   - Regularly rotate service account keys

## Usage

### Basic Usage

```vue
<template>
  <div>
    <TranscriptionEditor
      v-model="showTranscription"
      @save="handleSave"
      @close="showTranscription = false"
    />
  </div>
</template>

<script setup>
import TranscriptionEditor from '@/components/Common/transcriptionEditor.vue'

const showTranscription = ref(false)

const handleSave = (transcribedText) => {
  console.log('Transcribed text:', transcribedText)
  // Handle the saved transcription text
  // e.g., save to database, update form field, etc.
}
</script>
```

### Component Props

- `modelValue` (Boolean): Controls the visibility of the component

### Component Events

- `@save`: Emitted when the user clicks the Save button
  - Payload: `transcribedText` (String) - The transcribed text content
- `@close`: Emitted when the user closes the component

## API Endpoint

The transcription API endpoint is available at:
- **POST** `/api/transcription/transcribe`

### Request Format

- Content-Type: `multipart/form-data`
- Body: Form data with `audio` field containing the audio file

### Response Format

```json
{
  "code": 0,
  "success": true,
  "data": {
    "text": "Transcribed text here...",
    "confidence": 0.95
  }
}
```

## Troubleshooting

### Error: "GOOGLE_APPLICATION_CREDENTIALS not configured"

- Check that the environment variable is set correctly
- Verify the path to the JSON key file is correct
- Ensure the file exists at the specified path
- Restart your development server after setting the environment variable

### Error: "Failed to initialize Google Speech-to-Text client"

- Verify the JSON key file is valid
- Check that the Speech-to-Text API is enabled in your Google Cloud project
- Ensure the service account has the correct permissions

### Error: "No transcription results found"

- Check that the audio file contains clear speech
- Verify the audio format is supported (WebM Opus is used by default)
- Ensure the microphone permissions are granted in the browser

### Audio Format Issues

The component records audio in WebM Opus format. If you need to support other formats, you can modify the `transcribeAudio` function in `server/controllers/transcription.js` to handle different encoding types.

## Cost Considerations

Google Speech-to-Text API pricing:
- First 60 minutes per month: Free
- After that: $0.006 per 15 seconds

Monitor your usage in the Google Cloud Console to avoid unexpected charges.

## Support

For issues or questions:
1. Check the [Google Cloud Speech-to-Text documentation](https://cloud.google.com/speech-to-text/docs)
2. Review the component code in `components/Common/transcriptionEditor.vue`
3. Check the backend controller in `server/controllers/transcription.js`

