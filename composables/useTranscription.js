// composables/useTranscription.js
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter';

export const useTranscription = (editorEl) => {
  // State
  const isRecording = ref(false);
  const isProcessing = ref(false);
  const isSaving = ref(false);
  const isSummarizing = ref(false);
  const error = ref(null);
  const audioBlob = ref(null);
  const audioDuration = ref(0);
  const recordingTime = ref(0);
  const transcribedText = ref('');
  const originalTranscribedText = ref(''); // Store original text before summarization
  const summarizedText = ref('');
  const shouldAutoSummarize = ref(false); // Flag to track if we should auto-summarize after recording
  const mediaRecorder = ref(null);
  const audioChunks = ref([]);
  const recordingInterval = ref(null);
  const eventSource = ref(null);
  const currentStream = ref(null);
  const mediaStream = ref(null);
  const lastFinalText = ref(''); // Track last final text to prevent duplicates
  const lastInterimText = ref(''); // Track last interim text
  const processedFinalTexts = ref(new Set()); // Track all final texts that have been added
  const lastWords = ref([]); // Track last N words to detect overlapping results (sliding window approach)

  // Editor
  let EditorCtor = null;
  let Header = null;
  let List = null;
  let editor = null;

  // Initialize editor
  const initEditor = async () => {
    if (typeof window === 'undefined' || !editorEl.value) return;

    if (!EditorCtor || !Header || !List) {
      const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
        import('@editorjs/list'),
      ]);
      EditorCtor = E;
      Header = H;
      List = L;
    }

    if (editor) {
      editor.destroy();
      editor = null;
    }

    // Always show summarized text if available, otherwise show original
    const currentText = summarizedText.value || transcribedText.value;

    editor = new EditorCtor({
      holder: editorEl.value,
      tools: { header: Header, list: List },
      data: htmlToBlocks(currentText || ''),
      placeholder: 'Transcribed text will appear here...',
      onChange: async (api) => {
        const saved = await api.saver.save();
        const updatedText = blocksToHtml(saved);
        if (summarizedText.value) {
          summarizedText.value = updatedText;
        } else {
          transcribedText.value = updatedText;
        }
      },
    });
  };

  // Recording functions
  const startRecording = async () => {
    try {
      console.log('[Transcription] Starting new recording...');
      
      // Clear previous transcription text and reset editor for new recording
      transcribedText.value = '';
      originalTranscribedText.value = '';
      summarizedText.value = '';
      error.value = null;
      
      // Destroy and recreate editor to ensure clean state
      await nextTick();
      if (editor) {
        console.log('[Transcription] Destroying old editor');
        try {
          editor.destroy();
        } catch (destroyErr) {
          console.warn('[Transcription] Error destroying editor:', destroyErr);
        }
        editor = null;
      }
      
      // Reinitialize editor with empty state
      await initEditor();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.value = stream;
      audioChunks.value = [];

      // Start streaming transcription
      await startStreamingTranscription(stream);

      mediaRecorder.value = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.value.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data);
          // Send chunk to server for streaming transcription
          await sendAudioChunk(event.data);
        }
      };

      mediaRecorder.value.onstop = async () => {
        const blob = new Blob(audioChunks.value, { type: 'audio/webm' });
        audioBlob.value = blob;

        // Close streaming connection
        if (eventSource.value) {
          eventSource.value.close();
          eventSource.value = null;
        }

        stream.getTracks().forEach((track) => track.stop());

        // Calculate duration
        const audio = new Audio();
        audio.src = URL.createObjectURL(blob);
        audio.onloadedmetadata = () => {
          audioDuration.value = audio.duration;
        };
      };

      // Start recording with timeslice to get chunks periodically
      mediaRecorder.value.start(500); // Get chunks every 0.5 second
      isRecording.value = true;
      recordingTime.value = 0;

      recordingInterval.value = setInterval(() => {
        recordingTime.value++;
      }, 1000);
    } catch (err) {
      error.value = 'Failed to access microphone. Please check permissions.';
      console.error('Error accessing microphone:', err);
    }
  };

    // Start streaming transcription connection
  const startStreamingTranscription = async (stream) => {
    try {
      // Clean up any existing EventSource before creating a new one
      if (eventSource.value) {
        eventSource.value.close();
        eventSource.value = null;
      }

      // Reset state for new stream
      currentStream.value = null;
      lastFinalText.value = '';
      lastInterimText.value = '';
      processedFinalTexts.value.clear();
      lastWords.value = [];

      const APIURL = '/api';
      const chunkQueue = [];
      let sessionIdReceived = false;
      let connectionError = null;

      // Create EventSource for receiving transcription results (GET request)
      const newEventSource = new EventSource(`${APIURL}/transcription/stream`);
      eventSource.value = newEventSource;

      // Set up connection error handler BEFORE onmessage
      newEventSource.onerror = (err) => {
        console.error('EventSource error:', err);
        console.error('EventSource readyState:', newEventSource?.readyState);
        
        // Check if connection failed to open
        if (newEventSource?.readyState === EventSource.CONNECTING) {
          connectionError = 'Failed to connect to transcription service';
        } else if (newEventSource?.readyState === EventSource.CLOSED) {
          connectionError = 'Connection to transcription service closed';
          if (eventSource.value === newEventSource) {
            eventSource.value.close();
            eventSource.value = null;
          }
        }
      };

      newEventSource.onopen = () => {
        console.log('EventSource connection opened');
        connectionError = null;
      };

      newEventSource.onmessage = async (event) => {
        // Only process messages from the current EventSource
        if (eventSource.value !== newEventSource) {
          console.log('Ignoring message from old EventSource');
          return;
        }
        try {
          const data = JSON.parse(event.data);
          console.log('[Transcription] Received message:', { 
            hasSessionId: !!data.sessionId, 
            hasText: !!data.text, 
            isFinal: data.isFinal,
            textPreview: data.text?.substring(0, 50) 
          });

          // First message contains sessionId
          if (data.sessionId && !currentStream.value?.sessionId) {
            console.log('[Transcription] Received sessionId:', data.sessionId);
            // Preserve chunkQueue if it exists, otherwise create new object
            if (currentStream.value) {
              currentStream.value.sessionId = data.sessionId;
            } else {
              currentStream.value = { sessionId: data.sessionId, chunkQueue: chunkQueue };
            }
            sessionIdReceived = true;
            connectionError = null; // Clear any connection errors

            // Process any queued chunks
            while (chunkQueue.length > 0) {
              const chunk = chunkQueue.shift();
              await sendAudioChunk(chunk);
            }
            return;
          }

          if (data.error) {
            error.value = data.error;
            connectionError = data.error;
            return;
          }

          if (data.text) {
            isProcessing.value = true;

            // Normalize text for comparison (remove punctuation, lowercase, trim)
            const normalizeText = (text) => {
              if (!text) return '';
              return text
                .toLowerCase()
                .replace(/[.,!?;:]/g, '') // Remove punctuation
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
            };

            // Update transcription text
            if (data.isFinal) {
              // Final result - only append if it's truly new text
              const trimmedText = data.text.trim();

              if (!trimmedText) {
                console.log('[Transcription] Empty text, skipping');
                return;
              }

              const normalizedNew = normalizeText(trimmedText);
              console.log('[Transcription] Processing final text:', { 
                trimmedText: trimmedText.substring(0, 50),
                normalizedNew: normalizedNew.substring(0, 50),
                alreadyProcessed: processedFinalTexts.value.has(normalizedNew),
                currentTranscriptionLength: transcribedText.value?.length || 0
              });

              // Check if we've already processed this exact text (normalized)
              if (processedFinalTexts.value.has(normalizedNew)) {
                console.log('[Transcription] Duplicate detected, skipping');
                return;
              }

              const currentTranscription = transcribedText.value || '';
              const normalizedCurrent = normalizeText(currentTranscription);

              // Check if this is a continuation (new text extends the last final text)
              const lastFinalNormalized = lastFinalText.value
                ? normalizeText(lastFinalText.value)
                : '';
              const isContinuation = 
                lastFinalNormalized && 
                normalizedNew.startsWith(lastFinalNormalized + ' ');

              // Check if this is a refinement (last text is a subset of new text)
              // This happens when Google Cloud refines/extends a previous result
              const isRefinement = 
                lastFinalNormalized && 
                normalizedNew.startsWith(lastFinalNormalized) && 
                normalizedNew.length > lastFinalNormalized.length && 
                !isContinuation;

              // Industry-standard approach: Use sliding window to detect overlapping words
              // Split into words and check if the last N words overlap
              const newWords = normalizedNew.split(/\s+/).filter((w) => w.length > 0);
              const lastNWords = lastWords.value.slice(-10); // Check last 10 words
              const overlappingWords = newWords.filter((word) =>
                lastNWords.includes(word)
              );

              // If most of the new words overlap with recent words, it's likely a duplicate/refinement
              const overlapRatio = 
                newWords.length > 0 ? overlappingWords.length / newWords.length : 0;
              const isLikelyDuplicate = 
                overlapRatio > 0.7 && newWords.length <= lastNWords.length;

              // Industry-standard approach: Check for duplicates using multiple strategies
              if (normalizedCurrent && normalizedNew) {
                // Strategy 1: Exact duplicate at the end
                const endsWithNew = 
                  normalizedCurrent.endsWith(normalizedNew) || 
                  normalizedCurrent.endsWith(' ' + normalizedNew);

                if (endsWithNew) {
                  processedFinalTexts.value.add(normalizedNew);
                  return;
                }

                // Strategy 2: Sliding window - check if most words overlap with recent words
                if (isLikelyDuplicate && !isRefinement && !isContinuation) {
                  processedFinalTexts.value.add(normalizedNew);
                  return;
                }

                // Strategy 3: Shorter version already contained (unless it's a refinement)
                if (
                  normalizedNew.length < normalizedCurrent.length &&
                  normalizedCurrent.includes(normalizedNew)
                ) {
                  if (!isRefinement) {
                    processedFinalTexts.value.add(normalizedNew);
                    return;
                  }
                  // If it's a refinement, continue to handle it below
                }

                // Strategy 4: New text contains entire transcription (superset)
                if (
                  normalizedNew.includes(normalizedCurrent) &&
                  normalizedCurrent.length > 0 &&
                  !isRefinement
                ) {
                  transcribedText.value = trimmedText;
                  lastFinalText.value = trimmedText;
                  lastWords.value = newWords;
                  processedFinalTexts.value.add(normalizedNew);
                  await nextTick();
                  await initEditor();
                  return;
                }
              }

              if (isRefinement && transcribedText.value && lastFinalText.value) {
                // Replace the last final text with the refined/extended version
                // Find the last occurrence of the last final text in the transcription
                const lastText = lastFinalText.value.trim();
                const lastTextLower = normalizeText(lastText);
                const lastIndex = normalizedCurrent.lastIndexOf(lastTextLower);

                if (lastIndex !== -1) {
                  // Find the actual position in the original text
                  // Count normalized characters to find the actual position
                  let actualIndex = 0;
                  let normalizedCount = 0;
                  for (
                    let i = 0;
                    i < currentTranscription.length && normalizedCount < lastIndex;
                    i++
                  ) {
                    const char = currentTranscription[i].toLowerCase();
                    if (/[a-z0-9]/.test(char)) {
                      normalizedCount++;
                    } else if (char === ' ') {
                      normalizedCount++;
                    } else if (/[.,!?;:]/.test(char)) {
                      // Skip punctuation in normalized count
                    }
                    actualIndex = i + 1;
                  }

                  // Replace from that position with the new extended text
                  const beforeLast = currentTranscription.substring(0, actualIndex);
                  // Find where the last text actually ends in the original text
                  let endIndex = actualIndex;
                  let normalizedEndCount = 0;
                  for (
                    let i = actualIndex;
                    i < currentTranscription.length &&
                    normalizedEndCount < lastTextLower.length;
                    i++
                  ) {
                    const char = currentTranscription[i].toLowerCase();
                    if (/[a-z0-9]/.test(char)) {
                      normalizedEndCount++;
                    } else if (char === ' ') {
                      normalizedEndCount++;
                    } else if (/[.,!?;:]/.test(char)) {
                      // Skip punctuation
                    }
                    endIndex = i + 1;
                  }
                  const afterLast = currentTranscription.substring(endIndex);
                  transcribedText.value = beforeLast + trimmedText + afterLast;
                  lastFinalText.value = trimmedText;
                  lastWords.value = [...lastWords.value, ...newWords].slice(-20); // Keep last 20 words
                  processedFinalTexts.value.add(normalizedNew);
                } else {
                  // Fallback: just append
                  transcribedText.value = transcribedText.value + ' ' + trimmedText;
                  lastFinalText.value = trimmedText;
                  lastWords.value = [...lastWords.value, ...newWords].slice(-20);
                  processedFinalTexts.value.add(normalizedNew);
                }
              } else if (isContinuation && transcribedText.value) {
                // Extract only the new part (text after the last final text)
                // Use normalized comparison to find the new part
                const newPartNormalized = normalizedNew.substring(
                  lastFinalNormalized.length + 1
                );
                // Find the actual new part in the original text
                const lastTextLength = lastFinalText.value.trim().length;
                const newPart = trimmedText.substring(lastTextLength + 1);
                if (newPart) {
                  transcribedText.value = transcribedText.value + ' ' + newPart;
                  lastFinalText.value = trimmedText;
                  const newPartWords = normalizeText(newPart)
                    .split(/\s+/) 
                    .filter((w) => w.length > 0);
                  lastWords.value = [...lastWords.value, ...newPartWords].slice(
                    -20
                  );
                  processedFinalTexts.value.add(normalizedNew);
                }
              } else {
                // Completely new text - append it
                // But first check if it's not already in the transcription
                if (normalizedCurrent && normalizedNew) {
                  // Check if it's already at the end
                  if (
                    normalizedCurrent.endsWith(normalizedNew) ||
                    normalizedCurrent.endsWith(' ' + normalizedNew)
                  ) {
                    processedFinalTexts.value.add(normalizedNew);
                    return;
                  }

                  // Check if the new text is already contained anywhere in the transcription
                  // This catches duplicates that might appear in the middle
                  if (normalizedCurrent.includes(normalizedNew)) {
                    // Check if it's a complete phrase (surrounded by word boundaries or at start/end)
                    const textAsPhrase = new RegExp(
                      `(^|\\s)${normalizedNew.replace(
                        /[.*+?^${'{}'}()|[\]\\]/g,
                        '\\$&'
                      )}(\\s|$)
                    `, 'i'
                    );
                    if (textAsPhrase.test(normalizedCurrent)) {
                      processedFinalTexts.value.add(normalizedNew);
                      return;
                    }
                  }
                }

                if (transcribedText.value) {
                  transcribedText.value = transcribedText.value + ' ' + trimmedText;
                } else {
                  transcribedText.value = trimmedText;
                }
                lastFinalText.value = trimmedText;
                lastWords.value = [...lastWords.value, ...newWords].slice(-20); // Keep last 20 words
                processedFinalTexts.value.add(normalizedNew);
              }

              // Update editor with final text (only show final results, not interim)
              // Only update if we haven't summarized yet (show original during transcription)
              if (!summarizedText.value) {
                console.log('[Transcription] Updating editor with text length:', transcribedText.value?.length || 0);
                await nextTick();
                if (editor) {
                  // Update editor content without recreating it
                  try {
                    const blocks = htmlToBlocks(transcribedText.value || '');
                    console.log('[Transcription] Rendering blocks:', blocks.length);
                    editor.render(blocks);
                  } catch (renderErr) {
                    console.error('[Transcription] Error rendering editor:', renderErr);
                    // Fallback: reinitialize editor
                    await initEditor();
                  }
                } else {
                  console.log('[Transcription] Editor not initialized, initializing now');
                  await initEditor();
                }
              }

              // Reset interim text when we get a final result
              lastInterimText.value = '';
            } else {
              // Interim result - don't show in editor to avoid duplicates
              // Only track it to prevent showing duplicate interim results
              const trimmedText = data.text.trim();
              if (trimmedText !== lastInterimText.value) {
                lastInterimText.value = trimmedText;
                // Don't render interim results to avoid duplicates
                // They will be shown when they become final
              }
            }
          }
        } catch (err) {
          console.error('Error parsing transcription data:', err);
        }
      };


      // Store sessionId reference and chunk queue
      currentStream.value = {
        sessionId: null,
        chunkQueue: chunkQueue,
        sessionIdReceived: false,
      };

      // Wait for sessionId (with timeout)
      let attempts = 0;
      while (!sessionIdReceived && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
        
        // Check for connection errors
        if (connectionError) {
          throw new Error(connectionError);
        }
        
        // Check if EventSource failed to connect
        if (newEventSource?.readyState === EventSource.CLOSED && attempts > 5) {
          throw new Error('Failed to establish connection to transcription service');
        }
        
        if (currentStream.value?.sessionId) {
          sessionIdReceived = true;
        }
      }

      if (!sessionIdReceived) {
        // Clean up EventSource if it exists
        if (eventSource.value === newEventSource) {
          newEventSource.close();
          eventSource.value = null;
        }
        const errorMsg = connectionError || 'Failed to receive sessionId. The connection may have timed out or failed.';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error starting streaming transcription:', err);
      error.value = 'Failed to start streaming transcription';
    }
  };

  // Send audio chunk to server
  const sendAudioChunk = async (chunk) => {
    try {
      // If sessionId not ready, queue the chunk
      if (!currentStream.value || !currentStream.value.sessionId) {
        if (currentStream.value && currentStream.value.chunkQueue) {
          currentStream.value.chunkQueue.push(chunk);
        }
        return;
      }

      const APIURL = '/api';

      // Convert Blob to base64
      const arrayBuffer = await chunk.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send chunk via POST request
      await fetch(`${APIURL}/transcription/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentStream.value.sessionId,
          chunk: base64,
        }),
      }).catch((err) => {
        // Ignore errors for chunk sending
        console.warn('Chunk send error:', err);
      });
    } catch (err) {
      console.error('Error sending audio chunk:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop();
      isRecording.value = false;

      if (recordingInterval.value) {
        clearInterval(recordingInterval.value);
        recordingInterval.value = null;
      }

      // Set flag to auto-summarize after transcription completes
      shouldAutoSummarize.value = true;

      // Close streaming connection after a delay to allow final transcription results
      setTimeout(() => {
        if (eventSource.value) {
          eventSource.value.close();
          eventSource.value = null;
        }

        // Stop all tracks
        if (mediaStream.value) {
          mediaStream.value.getTracks().forEach((track) => track.stop());
          mediaStream.value = null;
        }
        currentStream.value = null;

        // Reset tracking variables
        lastFinalText.value = '';
        lastInterimText.value = '';
        processedFinalTexts.value.clear();
        lastWords.value = [];

        // Set processing to false after allowing time for final transcription
        setTimeout(async () => {
          isProcessing.value = false;

          // Automatically summarize after transcription is complete
          if (
            shouldAutoSummarize.value &&
            transcribedText.value &&
            transcribedText.value.trim() &&
            !summarizedText.value
          ) {
            // Wait a bit more to ensure all transcription results are fully processed
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Double-check we still have text and haven't summarized yet
            if (
              shouldAutoSummarize.value &&
              transcribedText.value &&
              transcribedText.value.trim() &&
              !summarizedText.value
            ) {
              await handleSummarize();
            }
            shouldAutoSummarize.value = false;
          }
        }, 100);
      }, 500);
    }
  };

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

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Clear editor
  const clearEditor = async () => {
    console.log('Before clearing:', transcribedText.value);
    transcribedText.value = '';
    originalTranscribedText.value = '';
    summarizedText.value = '';
    shouldAutoSummarize.value = false;
    audioBlob.value = null;
    audioDuration.value = 0;
    lastFinalText.value = '';
    lastInterimText.value = '';
    processedFinalTexts.value.clear();
    lastWords.value = [];
    await nextTick();
    await initEditor();
    console.log('After clearing:', transcribedText.value);
  };

  // Strip HTML tags from text
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
      // Store original text if not already stored
      if (!originalTranscribedText.value) {
        originalTranscribedText.value = transcribedText.value;
      }

      // Use original text for re-summarization to ensure consistency
      // If user wants to summarize edited text, they can edit first then summarize
      const textToSummarize =
        originalTranscribedText.value || transcribedText.value;

      // Strip HTML tags before sending to API
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
        // Handle HTTP errors
        error.value =
          result.message ||
          result.data?.message ||
          'Failed to summarize transcription.';
        return;
      }

      if (result.code === 0 && result.data?.summary) {
        // Store the summary (it will be plain text, which htmlToBlocks can handle)
        summarizedText.value = result.data.summary;

        // Update editor with summarized text (this replaces the original)
        await nextTick();
        if (editor) {
          editor.render(htmlToBlocks(summarizedText.value));
        } else {
          await initEditor();
        }
      } else {
        error.value =
          result.message ||
          result.data?.message ||
          'Failed to summarize transcription.';
      }
    } catch (err) {
      error.value = 'Failed to summarize transcription. Please try again.';
      console.error('Summarization error:', err);
    } finally {
      isSummarizing.value = false;
    }
  };

  // Lifecycle hooks
  onMounted(async () => {
    await nextTick();
    await initEditor();
  });

  onBeforeUnmount(() => {
    if (isRecording.value) {
      stopRecording();
    }
    if (eventSource.value) {
      eventSource.value.close();
      eventSource.value = null;
    }
    if (editor) {
      editor.destroy();
      editor = null;
    }
    if (recordingInterval.value) {
      clearInterval(recordingInterval.value);
    }
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop());
      mediaStream.value = null;
    }
    if (currentStream.value) {
      currentStream.value = null;
    }
  });

  return {
    isRecording,
    isProcessing,
    isSaving,
    isSummarizing,
    error,
    audioBlob,
    audioDuration,
    recordingTime,
    transcribedText,
    originalTranscribedText,
    summarizedText,
    shouldAutoSummarize,
    toggleRecording,
    formatTime,
    formatDuration,
    clearEditor,
    handleSummarize,
    initEditor,
    stopRecording,
  };
};
