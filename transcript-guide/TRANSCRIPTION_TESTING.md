# Testing the Transcription Component

## Quick Test Guide

### 1. Access the Test Page

Navigate to the test page in your browser:
```
http://localhost:3000/test-transcription
```

Or if your dev server is running on a different port, use:
```
http://localhost:YOUR_PORT/test-transcription
```

### 2. Testing Steps

1. **Open the Transcription Editor**
   - Click the "Open Transcription Editor" button
   - The transcription component should open in a dialog

2. **Grant Microphone Permissions**
   - Your browser will prompt you to allow microphone access
   - Click "Allow" or "Yes" to grant permissions
   - If you see an error, check browser permissions in settings

3. **Start Recording**
   - Click the microphone button (circular button with microphone icon)
   - The button should turn red and show "Recording..."
   - A timer will start showing the recording duration

4. **Speak Clearly**
   - Speak clearly into your microphone
   - Try saying something like: "Hello, this is a test of the transcription feature. I am testing the Google Speech-to-Text API integration."
   - Speak for at least 3-5 seconds for best results

5. **Stop Recording**
   - Click the stop button (same button, now red)
   - The recording will stop
   - You should see a "Audio recorded" message with the duration

6. **Wait for Transcription**
   - The component will automatically send the audio to the backend
   - You'll see a "Transcribing audio..." message
   - Wait for the transcription to complete (usually 2-5 seconds)

7. **Review Transcribed Text**
   - The transcribed text should appear in the editor below
   - You can edit the text if needed using the editor tools

8. **Save the Transcription**
   - Click the "Save" button
   - The transcribed text will be displayed on the test page
   - You should see a success message

### 3. Troubleshooting

#### Error: "Failed to access microphone"
- **Solution**: Check browser permissions
  - Chrome/Edge: Settings > Privacy and security > Site settings > Microphone
  - Firefox: Settings > Privacy & Security > Permissions > Microphone
  - Safari: Safari > Settings > Websites > Microphone

#### Error: "GOOGLE_APPLICATION_CREDENTIALS not configured"
- **Solution**: 
  1. Check your `.env` file has the correct path
  2. Restart your development server after adding the environment variable
  3. Verify the JSON file exists at the specified path

#### Error: "Failed to transcribe audio"
- **Possible causes**:
  - Google Cloud credentials are invalid
  - Speech-to-Text API is not enabled in Google Cloud Console
  - Network connectivity issues
  - Audio format not supported

#### No transcription results
- **Possible causes**:
  - Audio was too short or silent
  - Microphone didn't capture audio properly
  - Speak louder and ensure microphone is working

#### Backend errors in console
- Check server logs for detailed error messages
- Verify the `@google-cloud/speech` package is installed
- Check that the Google Cloud credentials file is valid JSON

### 4. Testing Checklist

- [ ] Test page loads without errors
- [ ] Transcription dialog opens
- [ ] Microphone permission prompt appears
- [ ] Recording starts when clicking microphone button
- [ ] Recording timer works correctly
- [ ] Recording stops when clicking stop button
- [ ] Audio is sent to backend (check network tab)
- [ ] Transcription appears in editor
- [ ] Text can be edited in the editor
- [ ] Save button works and displays result

### 5. Browser Compatibility

The transcription component uses:
- **MediaRecorder API** - Supported in modern browsers
- **getUserMedia API** - Requires HTTPS in production (HTTP works in localhost)

**Supported Browsers:**
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest, requires HTTPS in production)

### 6. Testing Different Scenarios

1. **Short audio** (< 2 seconds)
   - Should still work but may have lower accuracy

2. **Long audio** (> 30 seconds)
   - Should work, but may take longer to transcribe

3. **Multiple recordings**
   - Record, stop, record again
   - Each recording should replace the previous one

4. **Editing transcribed text**
   - Try editing the text in the editor
   - Use formatting options (headers, lists)

5. **Cancel without saving**
   - Click cancel button
   - Should close without saving

### 7. Expected Behavior

- **Recording**: Button turns red, timer starts, "Recording..." chip appears
- **Stopped**: Button returns to normal, "Audio recorded" chip appears
- **Processing**: Blue info alert with "Transcribing audio..." message
- **Success**: Text appears in editor, can be edited
- **Error**: Red error alert with error message

### 8. Next Steps After Testing

Once testing is successful, you can:
1. Integrate the component into other parts of your application
2. Customize the save handler to save to your database
3. Add additional features like language selection
4. Style the component to match your app's design better

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Speech-to-Text API is enabled
5. Check that the service account has proper permissions

