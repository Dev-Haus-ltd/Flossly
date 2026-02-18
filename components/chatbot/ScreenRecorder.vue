<template>
  <!-- Draggable Floating Recorder Toolbar -->
  <div
    v-if="isOpen"
    ref="recorderToolbar"
    class="recorder-toolbar"
    :style="toolbarStyle"
    @mousedown="startDrag"
  >
    <div class="toolbar-content">
      <!-- Drag Handle -->
      <div class="drag-handle" @mousedown.stop="startDrag">
        <v-icon size="22" color="grey-darken-1">mdi-drag-vertical</v-icon>
      </div>

      <!-- REC Badge -->
      <button
        v-if="!recordedBlob"
        class="rec-badge"
        :class="{ 'rec-pulse': isRecording }"
        @click="isRecording ? stopRecording() : startRecording()"
        :aria-label="isRecording ? 'Stop recording' : 'Start recording'"
      >
        <span>REC</span>
      </button>

      <!-- Timer and error icon if any -->
      <div v-if="isRecording || errorMessage" class="timer-display">
        <span v-if="isRecording">{{ formattedDuration }}</span>
        <v-icon v-else-if="errorMessage" size="20" color="error" :title="errorMessage">mdi-alert-circle</v-icon>
      </div>

      <!-- Cursor (turn off annotation overlay to use app normally) -->
      <v-btn
        icon
        variant="text"
        :color="selectedTool === 'cursor' ? 'primary' : 'grey-darken-1'"
        @click="selectTool('cursor')"
      >
        <v-icon size="26">mdi-cursor-default-outline</v-icon>
      </v-btn>

      <!-- Pen tool -->
      <v-btn
        icon
        variant="text"
        :color="selectedTool === 'pen' ? 'primary' : 'grey-darken-1'"
        @click="selectTool('pen')"
      >
        <v-icon size="26">mdi-draw</v-icon>
      </v-btn>

      <!-- Rectangle tool -->
      <v-btn
        icon
        variant="text"
        :color="selectedTool === 'rectangle' ? 'primary' : 'grey-darken-1'"
        @click="selectTool('rectangle')"
      >
        <v-icon size="26">mdi-vector-rectangle</v-icon>
      </v-btn>

      <!-- Color picker -->
      <v-menu location="bottom" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            :style="{ color: selectedColor }"
            :aria-label="`Color ${selectedColor}`"
          >
            <v-icon size="26">mdi-palette</v-icon>
          </v-btn>
        </template>
        <div class="color-menu">
          <v-color-picker
            v-model="selectedColor"
            hide-inputs
            show-swatches
            elevation="0"
            mode="rgba"
            width="260"
          />
        </div>
      </v-menu>

      <!-- Mic toggle -->
      <v-btn
        class="mic-btn"
        :class="{ active: isMicActive }"
        icon
        variant="text"
        :color="isMicActive ? 'error' : 'grey-darken-1'"
        @click="toggleMic"
        :aria-label="isMicActive ? 'Mute microphone' : 'Unmute microphone'"
        :title="isMicActive ? 'Mute microphone' : 'Unmute microphone'"
      >
        <v-icon size="26" :color="isMicActive ? 'error' : 'grey-darken-1'">{{ isMicActive ? 'mdi-microphone' : 'mdi-microphone-off' }}</v-icon>
      </v-btn>

      <!-- Eraser/Clear All -->
      <v-btn
        v-if="isRecording"
        icon
        variant="text"
        color="grey-darken-1"
        @click="clearCanvas"
        aria-label="Clear all annotations"
      >
        <v-icon size="26">mdi-eraser-variant</v-icon>
      </v-btn>

      <!-- Undo -->
      <v-btn
        v-if="isRecording"
        icon
        variant="text"
        color="grey-darken-1"
        @click="undoLast"
        aria-label="Undo last annotation"
      >
        <v-icon size="26">mdi-undo</v-icon>
      </v-btn>

      <!-- Delete/Trash -->
      <v-btn
        v-if="recordedBlob"
        icon
        variant="text"
        color="grey-darken-1"
        @click="resetRecording"
        aria-label="Discard recording"
      >
        <v-icon size="26">mdi-delete-outline</v-icon>
      </v-btn>

      <!-- Save Button -->
      <v-btn
        v-if="recordedBlob"
        icon
        variant="text"
        color="success"
        @click="saveRecording"
        aria-label="Save recording"
      >
        <v-icon size="26">mdi-check</v-icon>
      </v-btn>

      <!-- Close Button -->
      <v-btn
        icon
        variant="text"
        color="grey-darken-1"
        @click="cancel"
        :disabled="isRecording"
        aria-label="Close recorder"
      >
        <v-icon size="26">mdi-close</v-icon>
      </v-btn>
    </div>
  </div>

  <!-- Annotation overlay (kept visible during recording; pointer-events off in cursor mode) -->
  <div
    v-if="isRecording"
    class="annotation-overlay"
    :style="{ cursor: selectedTool === 'pen' || selectedTool === 'rectangle' ? 'crosshair' : 'default' }"
  >
    <canvas
      ref="annotationCanvas"
      class="annotation-canvas"
      :class="{ 'canvas-interactive': selectedTool !== 'cursor' }"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
    />
  </div>

  <!-- Fullscreen Dark Overlay Preview (shown after recording) -->
  <div v-if="showPreview" class="preview-overlay" @click.self="closePreview">
    <div class="preview-dialog">
      <video
        ref="previewVideo"
        controls
        autoplay
        class="preview-video"
        :src="previewUrl"
      ></video>
      <!-- Simple confirm/cancel controls for preview (below video) -->
      <div class="preview-actions">
        <v-btn color="success" class="mr-2" variant="flat" @click="confirmPreview">Confirm</v-btn>
        <v-btn color="white" variant="outlined" @click="cancelPreview">Cancel</v-btn>
      </div>
      <div v-if="recordedBlob" class="preview-meta">Recording size: {{ formatFileSize(recordedBlob.size) }}</div>
    </div>
  </div>

  <!-- Error Snackbar -->
  <v-snackbar v-model="showError" color="error" timeout="3000">
    {{ errorMessage }}
  </v-snackbar>
</template>

<script>
export default {
  name: 'ScreenRecorder',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    maxDuration: {
      type: Number,
      default: 120 // 2 minutes in seconds
    }
  },
  emits: ['update:modelValue', 'save', 'error'],
  data() {
    return {
      isRecording: false,
      mediaRecorder: null,
      recordedChunks: [],
      recordedBlob: null,
      previewUrl: null,
      stream: null,
      micStream: null,
      startTime: null,
      duration: 0,
      durationInterval: null,
      errorMessage: null,
      showError: false,
      showPreview: false,
      // UI state
      selectedTool: 'cursor',
      selectedColor: '#ff3b30',
      micEnabled: false,
      // Annotation canvas
      isDrawing: false,
      canvasEl: null,
      ctx: null,
      startX: 0,
      startY: 0,
      tempImageData: null,
      undoStack: [],
      // Dragging state
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      toolbarX: window.innerWidth / 2 - 200, // Center horizontally initially
      toolbarY: 100, // Position near top
    };
  },
  computed: {
    isOpen: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    isMicActive() {
      if (this.isRecording && this.stream) {
        return this.stream.getAudioTracks().some(t => t.enabled !== false);
      }
      return this.micEnabled;
    },
    formattedDuration() {
      const minutes = Math.floor(this.duration / 60);
      const seconds = this.duration % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    toolbarStyle() {
      return {
        left: `${this.toolbarX}px`,
        top: `${this.toolbarY}px`,
      };
    },
    annotationActive() {
      // no longer used; overlay is always visible during recording
      return this.isRecording;
    }
  },
  watch: {
    modelValue(newVal) {
      if (!newVal) {
        this.cleanup();
      } else {
        // ensure annotation canvas matches viewport when opened
        this.$nextTick(this.ensureCanvasSize);
      }
    }
  },
  methods: {
    selectTool(tool) {
      this.selectedTool = tool;
      if (this.isRecording) {
        // Ensure canvas exists during recording, but do not clear drawings when switching tools
        if (!this.canvasEl) {
          this.$nextTick(this.ensureCanvasSize);
        }
      }
    },

    async ensureMicStream() {
      if (!this.micStream) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          this.errorMessage = 'Microphone permission denied.';
          this.showError = true;
          this.micEnabled = false;
        }
      }
      return this.micStream;
    },

    async toggleMic() {
      this.micEnabled = !this.micEnabled;
      if (this.isRecording) {
        // Do not add/remove tracks after MediaRecorder has started (causes InvalidModificationError)
        // Instead, enable/disable existing audio tracks if any
        const audioTracks = this.stream?.getAudioTracks?.() || [];
        if (audioTracks.length > 0) {
          audioTracks.forEach(t => (t.enabled = this.micEnabled));
        } else if (this.micEnabled) {
          // No audio track present; show guidance to stop and re-start with mic enabled
          this.errorMessage = 'Audio track cannot be added mid-recording. Stop and start again with mic enabled to include audio.';
          this.showError = true;
        }
      }
    },

    ensureCanvasSize() {
      const canvas = this.$refs.annotationCanvas;
      if (!canvas) return;
      this.canvasEl = canvas;
      this.ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    detachAnnotationCanvas() {
      if (this.canvasEl && this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
      }
    },

    clearCanvas() {
      if (this.canvasEl && this.ctx) {
        this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        this.undoStack = [];
      }
    },

    onCanvasMouseDown(e) {
      if (!(this.selectedTool === 'pen' || this.selectedTool === 'rectangle')) return;
      this.isDrawing = true;
      const rect = this.canvasEl.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
      // push current canvas state for undo
      try {
        const snapshot = this.ctx.getImageData(0, 0, this.canvasEl.width, this.canvasEl.height);
        this.undoStack.push(snapshot);
        // limit undo history to avoid memory bloat
        if (this.undoStack.length > 20) this.undoStack.shift();
      } catch (err) {
        // ignore if canvas not ready
      }
      if (this.selectedTool === 'rectangle') {
        // snapshot for live preview of rectangle
        this.tempImageData = this.ctx.getImageData(0, 0, this.canvasEl.width, this.canvasEl.height);
      } else {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
      }
    },
    onCanvasMouseMove(e) {
      if (!this.isDrawing) return;
      const rect = this.canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.ctx.strokeStyle = this.selectedColor;
      this.ctx.lineWidth = 8;
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';
      if (this.selectedTool === 'pen') {
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      } else if (this.selectedTool === 'rectangle') {
        // restore snapshot, then draw preview rect
        if (this.tempImageData) this.ctx.putImageData(this.tempImageData, 0, 0);
        const w = x - this.startX;
        const h = y - this.startY;
        this.ctx.strokeRect(this.startX, this.startY, w, h);
      }
    },
    onCanvasMouseUp() {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.tempImageData = null;
      this.ctx.closePath?.();
    },

    undoLast() {
      if (!this.canvasEl || !this.ctx) return;
      const last = this.undoStack.pop();
      if (last) {
        this.ctx.putImageData(last, 0, 0);
      }
    },

    async startRecording() {
      try {
        // Check browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          this.errorMessage = 'Screen recording is not supported in this browser. Please use Chrome, Firefox, or Edge.';
          return;
        }

        // Request screen capture (video only); we will build a combined stream
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: 'screen', cursor: 'always', displaySurface: 'monitor' },
          audio: false
        });

        // Optionally get microphone
        let mic = null;
        if (this.micEnabled) {
          mic = await this.ensureMicStream();
        }

        // Build combined stream (avoid adding tracks after MediaRecorder starts)
        const combined = new MediaStream();
        displayStream.getVideoTracks().forEach(t => combined.addTrack(t));
        if (mic) {
          mic.getAudioTracks().forEach(t => {
            t.enabled = true;
            combined.addTrack(t);
          });
        }
        this.stream = combined;

        // Set up MediaRecorder
        const options = { mimeType: 'video/webm;codecs=vp9' };
        
        // Fallback to vp8 if vp9 not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm;codecs=vp8';
        }
        
        // Fallback to default if webm not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }

        this.mediaRecorder = new MediaRecorder(this.stream, options);
        this.recordedChunks = [];

        // Handle data available
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        // Handle stop
        this.mediaRecorder.onstop = () => {
          this.handleRecordingStopped();
        };

        // Handle errors
        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
          this.errorMessage = 'Recording error occurred. Please try again.';
          this.stopRecording();
        };

        // Handle stream ended (user stopped sharing)
        this.stream.getVideoTracks()[0].onended = () => {
          if (this.isRecording) {
            this.stopRecording();
          }
        };

        // Start recording
        this.mediaRecorder.start(1000); // Collect data every second
        this.isRecording = true;
        this.startTime = Date.now();

        // Prepare annotation canvas if a drawing tool is selected
        if (this.selectedTool !== 'cursor') {
          this.$nextTick(this.ensureCanvasSize);
        }
        window.addEventListener('resize', this.ensureCanvasSize);

        // Start duration counter
        this.durationInterval = setInterval(() => {
          this.duration = Math.floor((Date.now() - this.startTime) / 1000);
          
          // Auto-stop recording at 2 minutes (120 seconds)
          if (this.duration >= 120) {
            this.stopRecording();
          }
          
          // Auto-stop at max duration
          if (this.duration >= this.maxDuration) {
            this.stopRecording();
          }
        }, 1000);

      } catch (error) {
        console.error('Error starting recording:', error);
        
        if (error.name === 'NotAllowedError') {
          this.errorMessage = 'Permission denied. Please allow screen recording.';
        } else if (error.name === 'NotFoundError') {
          this.errorMessage = 'No screen available to record.';
        } else {
          this.errorMessage = 'Failed to start recording. Please try again.';
        }
        
        this.cleanup();
      }
    },

    stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // Clear interval
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }

      // Clear annotation overlay
      this.detachAnnotationCanvas();
      window.removeEventListener('resize', this.ensureCanvasSize);
      this.isRecording = false;
    },

    handleRecordingStopped() {
      // Create blob from recorded chunks
      const mimeType = this.mediaRecorder?.mimeType || 'video/webm';
      this.recordedBlob = new Blob(this.recordedChunks, { type: mimeType });
      
      // Create preview URL
      this.previewUrl = URL.createObjectURL(this.recordedBlob);

      // Show overlay preview
      this.showPreview = true;

      // Load video in preview
      this.$nextTick(() => {
        if (this.$refs.previewVideo) {
          this.$refs.previewVideo.load();
        }
      });
    },

    resetRecording() {
      // Revoke old preview URL
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }

      this.recordedBlob = null;
      this.previewUrl = null;
      this.recordedChunks = [];
      this.duration = 0;
      this.errorMessage = null;
      this.showPreview = false;
    },

    async saveRecording() {
      if (!this.recordedBlob) return;

      try {
        // Determine file extension based on mime type
        const mimeType = this.recordedBlob.type;
        let extension = 'webm';
        if (mimeType.includes('mp4')) extension = 'mp4';

        // Create file from blob
        const file = new File(
          [this.recordedBlob],
          `screen-recording-${Date.now()}.${extension}`,
          { type: mimeType }
        );

        this.$emit('save', file);
        // Close preview and reopen chatbot (parent listens to v-model change)
        this.showPreview = false;
        this.isOpen = false;
      } catch (error) {
        console.error('Error saving recording:', error);
        this.errorMessage = 'Failed to save recording. Please try again.';
      }
    },

    confirmPreview() {
      // Alias to save action for clarity
      this.saveRecording();
    },

    cancelPreview() {
      // Discard recording and close preview; reopen chatbot handled by parent
      this.resetRecording();
      this.closePreview();
      this.isOpen = false;
    },

    cancel() {
      if (this.isRecording) {
        this.stopRecording();
      }
      this.isOpen = false;
    },

    closePreview() {
      this.showPreview = false;
      // After preview closes, reopen the main recorder toolbar so user can re-record if desired
      if (!this.isRecording && !this.recordedBlob) {
        this.isOpen = true;
      }
    },
    
    // Dragging methods
    startDrag(e) {
      if (e.target.closest('.v-btn:not(.drag-handle)') || e.target.closest('.rec-badge')) {
        // Don't drag if clicking a control button (except drag handle)
        return;
      }
      
      this.isDragging = true;
      this.dragStartX = e.clientX - this.toolbarX;
      this.dragStartY = e.clientY - this.toolbarY;
      
      document.addEventListener('mousemove', this.drag);
      document.addEventListener('mouseup', this.stopDrag);
      e.preventDefault();
    },
    
    drag(e) {
      if (!this.isDragging) return;
      
      e.preventDefault();
      this.toolbarX = e.clientX - this.dragStartX;
      this.toolbarY = e.clientY - this.dragStartY;
    },
    
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.drag);
      document.removeEventListener('mouseup', this.stopDrag);
    },

    cleanup() {
      // Stop recording if in progress
      if (this.isRecording) {
        this.stopRecording();
      }

      // Revoke preview URL
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }

      // Clear state
      this.recordedBlob = null;
      this.previewUrl = null;
      this.recordedChunks = [];
      this.duration = 0;
      this.errorMessage = null;
      this.stream = null;
      this.mediaRecorder = null;

      // Clear interval
      if (this.durationInterval) {
        clearInterval(this.durationInterval);
        this.durationInterval = null;
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
  },

  beforeUnmount() {
    this.cleanup();
  }
};
</script>

<style scoped>
/* Floating Draggable Toolbar */
.recorder-toolbar {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 50px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 10px 14px;
  cursor: move;
  user-select: none;
}

.toolbar-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-content .v-icon {
  color: #2d3a4a;
}

.toolbar-content .v-btn.v-btn--icon {
  width: 36px;
  height: 36px;
}

.drag-handle {
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 0 6px;
}

.drag-handle:active {
  cursor: grabbing;
}

/* REC Badge */
.rec-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ff3b30;
  color: #fff;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.rec-badge span {
  font-size: 12px;
}

.rec-pulse {
  animation: rec-pulse 1.5s ease-in-out infinite;
}

@keyframes rec-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.6);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(255, 59, 48, 0);
  }
}

/* Timer Display */
.timer-display {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  padding: 0 8px;
  min-width: 56px;
  text-align: center;
}

/* Annotation overlay */
.annotation-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none; /* canvas toggles pointer-events via class */
}
.annotation-canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  pointer-events: none; /* default off to allow cursor mode */
}
.annotation-canvas.canvas-interactive {
  pointer-events: auto; /* capture drawing in pen/rectangle */
}

/* Preview Overlay */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-dialog {
  position: relative;
  width: min(90vw, 1000px);
  height: min(80vh, 700px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.preview-video {
  width: 100%;
  max-height: 100%;
  border-radius: 8px;
  background-color: #000;
}
.preview-meta {
  margin-top: 10px;
  color: #e0e0e0;
  font-size: 12px;
}

/* Quick review toolbar positioned at top-right of preview */
.review-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32px;
  padding: 6px 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

/* Hover effects for icon buttons */
.toolbar-content .v-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}

/* Meet-style mic active ring */
.mic-btn.active {
  position: relative;
}
.mic-btn.active::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid #ff3b30; /* red ring when active */
}
</style>
