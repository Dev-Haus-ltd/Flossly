import { ref, onBeforeUnmount } from 'vue';

export const useWebSpeechTranscription = () => {
  // State
  const isRecording = ref(false);
  const isSummarizing = ref(false);
  const error = ref(null);
  const recordingTime = ref(0);
  const transcribedText = ref('');
  const originalTranscribedText = ref('');
  const summarizedText = ref('');
  const shouldAutoSummarize = ref(false);
  const isSupported = ref(false);

  let recognition = null;
  let recordingInterval = null;
  let interimTranscript = '';
  let finalTranscript = '';

  // Check browser support
  if (typeof window !== 'undefined') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    isSupported.value = !!SpeechRecognition;
  }

  // Reset all state
  const reset = () => { 
    transcribedText.value = '';
    originalTranscribedText.value = '';
    summarizedText.value = '';
    error.value = null;
    interimTranscript = '';
    finalTranscript = '';
    recordingTime.value = 0;
  };


  // Start recording with Web Speech API
  const startRecording = async () => {
    if (!isSupported.value) {
      error.value = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.';
      return;
    }

    try {
      console.log('[WebSpeech] Starting recording...');

      // Clear previous transcription
      reset();

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      // Configure for real-time continuous recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Handle results in real-time
      recognition.onresult = async (event) => {
        interimTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            // Final result - add to permanent transcript
            finalTranscript += transcript + ' ';
            console.log('[WebSpeech] Final result:', transcript);
          } else {
            // Interim result - show in real-time
            interimTranscript += transcript;
            console.log('[WebSpeech] Interim result:', transcript);
          }
        }

        // Combine final and interim text for display
        const displayText = (finalTranscript + interimTranscript).trim();
        transcribedText.value = displayText;
        console.log('[WebSpeech] Display text:', displayText);
      };

      recognition.onerror = (event) => {
        console.error('[WebSpeech] Recognition error:', event.error);
        if (event.error === 'no-speech') {
          error.value = 'No speech detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          error.value = 'No microphone found. Please check your audio settings.';
        } else if (event.error === 'not-allowed') {
          error.value = 'Microphone permission denied. Please allow access.';
        } else {
          error.value = `Speech recognition error: ${event.error}`;
        }
        stopRecording();
      };

      recognition.onend = () => {
        console.log('[WebSpeech] Recognition ended');
        if (isRecording.value) {
          // Restart if still recording (to continue listening)
          try {
            recognition.start();
          } catch (err) {
            console.error('[WebSpeech] Error restarting recognition:', err);
          }
        }
      };

      // Start recognition
      recognition.start();
      isRecording.value = true;
      recordingTime.value = 0;

      // Start timer
      recordingInterval = setInterval(() => {
        recordingTime.value++;
      }, 1000);

    } catch (err) {
      error.value = 'Failed to start speech recognition. Please check permissions.';
      console.error('[WebSpeech] Error starting recognition:', err);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    if (recognition && isRecording.value) {
      recognition.stop();
      isRecording.value = false;

      if (recordingInterval) {
        clearInterval(recordingInterval);
        recordingInterval = null;
      }

      // Finalize the transcript
      transcribedText.value = finalTranscript.trim();
      
      // Auto-summarize if needed
      shouldAutoSummarize.value = true;
      setTimeout(async () => {
        if (shouldAutoSummarize.value && transcribedText.value && !summarizedText.value) {
          await handleSummarize();
        }
        shouldAutoSummarize.value = false;
      }, 500);
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording.value) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clear transcription
  const clearTranscription = () => {
    reset();
    shouldAutoSummarize.value = false;
  };

  // Strip HTML tags
  const stripHtml = (html) => {
    if (typeof window === 'undefined') {
      return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent || div.innerText || '';
  };

  // Summarize transcription
  const handleSummarize = async () => {
    if (!transcribedText.value) return;

    isSummarizing.value = true;
    error.value = null;

    try {
      if (!originalTranscribedText.value) {
        originalTranscribedText.value = transcribedText.value;
      }

      const textToSummarize = originalTranscribedText.value || transcribedText.value;
      const plainText = stripHtml(textToSummarize);

      if (!plainText.trim()) {
        error.value = 'No text content to summarize.';
        isSummarizing.value = false;
        return;
      }

      const APIURL = '/api';
      const response = await fetch(`${APIURL}/transcription/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: plainText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        error.value = result.message || result.data?.message || 'Failed to summarize transcription.';
        return;
      }

      if (result.code === 0 && result.data?.summary) {
        summarizedText.value = result.data.summary;
      } else {
        error.value = result.message || result.data?.message || 'Failed to summarize transcription.';
      }
    } catch (err) {
      error.value = 'Failed to summarize transcription. Please try again.';
      console.error('[WebSpeech] Summarization error:', err);
    } finally {
      isSummarizing.value = false;
    }
  };

  // Cleanup
  onBeforeUnmount(() => {
    if (isRecording.value) {
      stopRecording();
    }
    if (recognition) {
      recognition.stop();
      recognition = null;
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
    }
  });

  return {
    isRecording,
    isSummarizing,
    isSupported,
    error,
    recordingTime,
    transcribedText,
    originalTranscribedText,
    summarizedText,
    toggleRecording,
    formatTime,
    clearTranscription,
    handleSummarize,
    stopRecording,
    reset,
  };
};
