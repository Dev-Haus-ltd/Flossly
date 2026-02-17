<template>
  <!-- Direct Screen Annotation Overlay -->
  <div v-if="isOpen" class="screen-annotation-overlay">
    <!-- Annotation Toolbar (Always Visible) -->
    <div class="annotation-toolbar-top">
      <div class="toolbar-content">
        <div class="toolbar-tools">
          <v-btn-toggle v-model="selectedTool" mandatory dense color="primary" class="mr-3">
            <v-btn value="pen" size="small">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
            <v-btn value="highlighter" size="small">
              <v-icon small>mdi-marker</v-icon>
            </v-btn>
            <v-btn value="arrow" size="small">
              <v-icon small>mdi-arrow-top-right</v-icon>
            </v-btn>
            <v-btn value="rectangle" size="small">
              <v-icon small>mdi-rectangle-outline</v-icon>
            </v-btn>
            <v-btn value="circle" size="small">
              <v-icon small>mdi-circle-outline</v-icon>
            </v-btn>
          </v-btn-toggle>

          <v-btn size="small" @click="undo" class="mr-2">
            <v-icon small>mdi-undo</v-icon>
          </v-btn>

          <v-btn size="small" @click="clearAll" class="mr-4">
            <v-icon small>mdi-eraser</v-icon>
          </v-btn>

          <v-btn color="error" size="small" @click="cancel" class="mr-2">
            Cancel
          </v-btn>
          <v-btn color="success" size="small" @click="captureWithAnnotations">
            <v-icon small class="mr-1">mdi-camera</v-icon>
            Capture
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Drawing Canvas Overlay (Transparent) -->
    <canvas 
      ref="drawingCanvas" 
      class="drawing-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @click.stop
    ></canvas>
  </div>
</template>

<script>
import * as fabric from 'fabric';

export default {
  name: 'BugAnnotation',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'save', 'error'],
  data() {
    return {
      drawingCanvas: null,
      drawingContext: null,
      selectedTool: 'pen',
      selectedColor: '#FF0000',
      isDrawing: false,
      lastX: 0,
      lastY: 0,
      shapeStartX: 0,
      shapeStartY: 0,
      tempCanvasState: null,
      strokes: [], // Store all drawing strokes for undo
      colors: [
        { name: 'Red', value: '#FF0000' },
        { name: 'Blue', value: '#0000FF' },
        { name: 'Green', value: '#00FF00' },
        { name: 'Yellow', value: '#FFFF00' },
        { name: 'Orange', value: '#FFA500' },
        { name: 'Purple', value: '#800080' },
        { name: 'Black', value: '#000000' },
        { name: 'White', value: '#FFFFFF' }
      ]
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
  },
  watch: {
    modelValue(newVal) {
      if (newVal) {
        // Initialize drawing canvas
        this.$nextTick(() => {
          this.initializeDrawingCanvas();
        });
      }
    },
  },
  methods: {
    initializeDrawingCanvas() {
      console.log('Initializing drawing canvas...');
      const canvas = this.$refs.drawingCanvas;
      if (!canvas) return;

      // Set canvas to full screen size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      this.drawingCanvas = canvas;
      this.drawingContext = canvas.getContext('2d');
      
      // Set drawing properties
      this.drawingContext.lineCap = 'round';
      this.drawingContext.lineJoin = 'round';
      console.log('Drawing canvas ready!');
    },

    startDrawing(e) {
      this.isDrawing = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      
      if (this.selectedTool === 'pen' || this.selectedTool === 'highlighter') {
        this.drawingContext.beginPath();
        this.drawingContext.moveTo(this.lastX, this.lastY);
      }
      
      // For shapes, save the starting point and current canvas state
      if (['arrow', 'rectangle', 'circle'].includes(this.selectedTool)) {
        this.shapeStartX = this.lastX;
        this.shapeStartY = this.lastY;
        // Save canvas state before drawing preview
        this.tempCanvasState = this.drawingContext.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
      }
    },

    draw(e) {
      if (!this.isDrawing) return;
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      
      if (this.selectedTool === 'pen') {
        this.drawingContext.strokeStyle = this.selectedColor;
        this.drawingContext.lineWidth = 3;
        this.drawingContext.globalCompositeOperation = 'source-over';
        
        this.drawingContext.lineTo(currentX, currentY);
        this.drawingContext.stroke();
        
      } else if (this.selectedTool === 'highlighter') {
        this.drawingContext.strokeStyle = this.selectedColor + '40'; // 25% opacity
        this.drawingContext.lineWidth = 20;
        this.drawingContext.globalCompositeOperation = 'multiply';
        
        this.drawingContext.lineTo(currentX, currentY);
        this.drawingContext.stroke();
        
      } else if (['arrow', 'rectangle', 'circle'].includes(this.selectedTool)) {
        // Restore canvas to state before preview
        if (this.tempCanvasState) {
          this.drawingContext.putImageData(this.tempCanvasState, 0, 0);
        }
        
        // Draw preview of shape
        this.drawingContext.strokeStyle = this.selectedColor;
        this.drawingContext.lineWidth = 3;
        this.drawingContext.globalCompositeOperation = 'source-over';
        
        if (this.selectedTool === 'rectangle') {
          const width = currentX - this.shapeStartX;
          const height = currentY - this.shapeStartY;
          this.drawingContext.strokeRect(this.shapeStartX, this.shapeStartY, width, height);
          
        } else if (this.selectedTool === 'circle') {
          // Draw circle from corner (like rectangle)
          const width = Math.abs(currentX - this.shapeStartX);
          const height = Math.abs(currentY - this.shapeStartY);
          const radius = Math.sqrt(width * width + height * height) / 2;
          const centerX = (this.shapeStartX + currentX) / 2;
          const centerY = (this.shapeStartY + currentY) / 2;
          
          this.drawingContext.beginPath();
          this.drawingContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          this.drawingContext.stroke();
          
        } else if (this.selectedTool === 'arrow') {
          this.drawArrow(this.shapeStartX, this.shapeStartY, currentX, currentY);
        }
      }
      
      this.lastX = currentX;
      this.lastY = currentY;
    },

    stopDrawing() {
      if (this.isDrawing) {
        this.isDrawing = false;
        // Save current state for undo
        const currentState = this.drawingContext.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.strokes.push(currentState);
        console.log('Saved stroke, total strokes:', this.strokes.length);
        this.tempCanvasState = null;
      }
    },

    drawArrow(fromX, fromY, toX, toY) {
      const headLength = 15;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      // Draw line
      this.drawingContext.beginPath();
      this.drawingContext.moveTo(fromX, fromY);
      this.drawingContext.lineTo(toX, toY);
      this.drawingContext.stroke();
      
      // Draw arrowhead
      this.drawingContext.beginPath();
      this.drawingContext.moveTo(toX, toY);
      this.drawingContext.lineTo(
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6)
      );
      this.drawingContext.moveTo(toX, toY);
      this.drawingContext.lineTo(
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
      );
      this.drawingContext.stroke();
    },

    changeColor(color) {
      console.log('Changing color to:', color);
      this.selectedColor = color;
    },

    undo() {
      console.log('Undo clicked, strokes:', this.strokes.length);
      if (!this.drawingContext) {
        console.error('No drawing context!');
        return;
      }
      
      if (this.strokes.length > 0) {
        this.strokes.pop(); // Remove current state
        console.log('Remaining strokes:', this.strokes.length);
        
        if (this.strokes.length > 0) {
          // Restore previous state
          const previousState = this.strokes[this.strokes.length - 1];
          this.drawingContext.putImageData(previousState, 0, 0);
          console.log('Restored previous state');
        } else {
          // No more history, clear canvas
          this.clearAll();
          console.log('Cleared canvas');
        }
      } else {
        console.log('No strokes to undo');
      }
    },

    clearAll() {
      console.log('Clearing all drawings');
      if (!this.drawingContext) return;
      this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
      this.strokes = [];
    },

    async captureWithAnnotations() {
      try {
        console.log('Capturing screen with annotations...');
        
        // Request screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
          preferCurrentTab: true
        });

        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            setTimeout(resolve, 200);
          };
        });

        // Capture frame to canvas
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        
        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop stream
        stream.getTracks().forEach(track => track.stop());

        // Convert to file and emit
        const dataUrl = captureCanvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `annotated-screenshot-${Date.now()}.png`, {
          type: 'image/png'
        });

        console.log('Screenshot captured with annotations!');
        
        // Temporarily download the screenshot to user's computer
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = `bug-screenshot-${Date.now()}.png`;
        downloadLink.click();
        
        this.$emit('save', file);
        this.isOpen = false;

      } catch (error) {
        console.error('Error capturing with annotations:', error);
        if (error.name === 'NotAllowedError') {
          this.$emit('error', 'Permission denied. Please allow screen capture.');
        } else {
          this.$emit('error', 'Failed to capture screenshot.');
        }
      }
    },

    async startCapture() {
      try {
        console.log('=== STARTING FULL SCREEN CAPTURE ===');

        // Request screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
          preferCurrentTab: true
        });

        console.log('Stream obtained:', stream);

        // Create video element to capture a single frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            video.play();
            setTimeout(resolve, 200);
          };
        });

        console.log('Video ready, capturing frame...');

        // Capture current frame to canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop the stream immediately
        stream.getTracks().forEach(track => track.stop());

        console.log('Frame captured successfully!');

        // Use the full captured image
        this.capturedImage = canvas.toDataURL('image/png');

        // Move to annotation step
        this.currentStep = 'annotating';
        
        // Single attempt with proper timing
        setTimeout(() => {
          console.log('Initializing canvas...');
          this.initializeCanvas();
        }, 1000);

      } catch (error) {
        console.error('Error capturing screen:', error);
        
        if (error.name === 'NotAllowedError') {
          this.$emit('error', 'Screen capture permission denied. Please allow access to capture screenshots.');
        } else if (error.name === 'NotSupportedError') {
          this.$emit('error', 'Screen capture is not supported in this browser. Please use Chrome, Edge, or Firefox.');
        } else {
          this.$emit('error', 'Failed to capture screenshot. Please try again.');
        }
        this.cancel();
      }
    },

    async captureSelectedRegion() {
      console.log('=== CAPTURE STARTED ===');
      try {
        const rect = this.selectionRect;
        console.log('Selection rect:', rect);
        if (!rect) {
          console.error('No selection rect!');
          return;
        }

        // Hide overlay completely
        const overlay = document.querySelector('.snipping-overlay');
        if (overlay) overlay.style.display = 'none';

        // Wait a moment for overlay to disappear
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Requesting display media...');
        // Use native browser Screen Capture API (same as screen recording)
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: 'browser',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
          preferCurrentTab: true
        });
        console.log('Stream obtained:', stream);

        // Create video element to capture a single frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            video.play();
            // Wait a bit to ensure the frame is rendered
            setTimeout(resolve, 200);
          };
        });
        console.log('Video ready');

        // Capture current frame to canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // Stop the stream immediately (we only needed one frame)
        stream.getTracks().forEach(track => track.stop());

        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('Window dimensions:', window.innerWidth, 'x', window.innerHeight);
        console.log('Selection rect:', rect);

        // Calculate scale factor between captured video and viewport
        const scaleX = video.videoWidth / window.innerWidth;
        const scaleY = video.videoHeight / window.innerHeight;

        console.log('Scale factors:', scaleX, scaleY);

        // If scale is way off, just use the full capture (user captured full screen instead of tab)
        if (scaleX > 2 || scaleY > 2 || scaleX < 0.5 || scaleY < 0.5) {
          console.warn('Scale mismatch - using full capture');
          this.capturedImage = canvas.toDataURL('image/png');
        } else {
          // Crop to the selected region
          const croppedCanvas = document.createElement('canvas');
          const cropWidth = Math.min(rect.width * scaleX, video.videoWidth);
          const cropHeight = Math.min(rect.height * scaleY, video.videoHeight);
          const cropX = Math.min(rect.x * scaleX, video.videoWidth - cropWidth);
          const cropY = Math.min(rect.y * scaleY, video.videoHeight - cropHeight);

          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          
          const croppedCtx = croppedCanvas.getContext('2d');
          croppedCtx.drawImage(
            canvas,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          this.capturedImage = croppedCanvas.toDataURL('image/png');
          console.log('Cropped successfully');
        }

        // Show overlay again
        if (overlay) overlay.style.display = 'block';

        // Move to annotation step
        this.currentStep = 'annotating';
        this.$nextTick(() => {
          this.initializeCanvas();
        });
      } catch (error) {
        console.error('Error capturing region:', error);
        
        // Show overlay on error
        const overlay = document.querySelector('.snipping-overlay');
        if (overlay) overlay.style.display = 'block';
        
        if (error.name === 'NotAllowedError') {
          this.$emit('error', 'Screen capture permission denied. Please allow access to capture screenshots.');
        } else if (error.name === 'NotSupportedError') {
          this.$emit('error', 'Screen capture is not supported in this browser. Please use Chrome, Edge, or Firefox.');
        } else {
          this.$emit('error', 'Failed to capture screenshot. Please try again.');
        }
        this.cancel();
      }
    },

    async initializeCanvas() {
      try {
        console.log('=== INITIALIZING CANVAS ===');
        const canvasElement = this.$refs.canvasElement;
        console.log('Canvas element:', canvasElement);
        console.log('Captured image exists:', !!this.capturedImage);
        console.log('Canvas already exists:', !!this.canvas);
        
        if (!canvasElement) {
          console.error('No canvas element found!');
          return;
        }
        
        if (!this.capturedImage) {
          console.error('No captured image!');
          return;
        }

        // IMPORTANT: Dispose existing canvas first
        if (this.canvas) {
          console.log('Disposing existing canvas...');
          this.canvas.dispose();
          this.canvas = null;
        }

        // Set canvas size to match captured image
        const img = new Image();
        img.onload = () => {
          console.log('Image loaded - dimensions:', img.width, 'x', img.height);
          
          const width = img.width;
          const height = img.height;

          // Make canvas responsive if image is too big
          const maxWidth = window.innerWidth - 100;
          const maxHeight = window.innerHeight - 200;
          
          let canvasWidth = width;
          let canvasHeight = height;
          
          if (width > maxWidth) {
            const scale = maxWidth / width;
            canvasWidth = maxWidth;
            canvasHeight = height * scale;
          }
          
          if (canvasHeight > maxHeight) {
            const scale = maxHeight / canvasHeight;
            canvasHeight = maxHeight;
            canvasWidth = canvasWidth * scale;
          }

          console.log('Canvas size:', canvasWidth, 'x', canvasHeight);

          // Initialize Fabric canvas
          this.canvas = new fabric.Canvas(canvasElement, {
            width: canvasWidth,
            height: canvasHeight
          });

          console.log('Fabric canvas created');

          // Add captured image as background
          fabric.Image.fromURL(this.capturedImage, (fabricImg) => {
            console.log('Fabric image loaded successfully');
            if (!fabricImg) {
              console.error('Fabric image is null!');
              return;
            }
            
            fabricImg.scaleToWidth(canvasWidth);
            fabricImg.scaleToHeight(canvasHeight);
            fabricImg.selectable = false;
            fabricImg.evented = false;
            
            console.log('Setting as background image...');
            this.canvas.setBackgroundImage(fabricImg, () => {
              this.canvas.renderAll();
              console.log('Background image set and canvas rendered!');
            });
          }, {
            // Add error handling
            crossOrigin: 'anonymous'
          }).then(() => {
            console.log('Fabric.Image.fromURL completed');
          }).catch((error) => {
            console.error('Fabric.Image.fromURL failed:', error);
            // Fallback: try adding as regular object instead
            this.tryAlternativeImageLoad(canvasWidth, canvasHeight);
          });

          // Set up event listeners
          this.setupCanvasEvents();
        };
        
        img.onerror = () => {
          console.error('Failed to load captured image');
          this.$emit('error', 'Failed to load screenshot');
        };
        
        img.src = this.capturedImage;
      } catch (error) {
        console.error('Error initializing canvas:', error);
        this.$emit('error', 'Failed to initialize annotation canvas');
      }
    },

    tryAlternativeImageLoad(canvasWidth, canvasHeight) {
      console.log('Trying alternative image loading method...');
      const img = new Image();
      img.onload = () => {
        const fabricImg = new fabric.Image(img);
        fabricImg.scaleToWidth(canvasWidth);
        fabricImg.scaleToHeight(canvasHeight);
        fabricImg.selectable = false;
        fabricImg.evented = false;
        
        this.canvas.setBackgroundImage(fabricImg, () => {
          this.canvas.renderAll();
          console.log('Alternative method: Background image set!');
        });
      };
      img.onerror = () => {
        console.error('Alternative method also failed');
      };
      img.src = this.capturedImage;
    },

    setupCanvasEvents() {
      let startX, startY;

      this.canvas.on('mouse:down', (options) => {
        if (this.selectedTool === 'pen' || this.selectedTool === 'highlighter') return;

        const pointer = this.canvas.getPointer(options.e);
        startX = pointer.x;
        startY = pointer.y;
        this.isDrawing = true;

        switch (this.selectedTool) {
          case 'rectangle':
            this.currentShape = new fabric.Rect({
              left: startX,
              top: startY,
              width: 0,
              height: 0,
              stroke: this.selectedColor,
              strokeWidth: 3,
              fill: 'transparent',
              selectable: false
            });
            break;

          case 'circle':
            this.currentShape = new fabric.Circle({
              left: startX,
              top: startY,
              radius: 0,
              stroke: this.selectedColor,
              strokeWidth: 3,
              fill: 'transparent',
              selectable: false
            });
            break;

          case 'arrow':
            this.currentShape = this.createArrow(startX, startY, startX, startY);
            break;

          case 'text':
            const text = new fabric.IText('Type here...', {
              left: startX,
              top: startY,
              fill: this.selectedColor,
              fontSize: 20,
              selectable: false
            });
            this.canvas.add(text);
            this.canvas.setActiveObject(text);
            text.enterEditing();
            this.isDrawing = false;
            return;
        }

        if (this.currentShape) {
          this.canvas.add(this.currentShape);
        }
      });

      this.canvas.on('mouse:move', (options) => {
        if (!this.isDrawing || !this.currentShape) return;

        const pointer = this.canvas.getPointer(options.e);

        switch (this.selectedTool) {
          case 'rectangle':
            const width = pointer.x - startX;
            const height = pointer.y - startY;
            this.currentShape.set({
              width: Math.abs(width),
              height: Math.abs(height),
              left: width < 0 ? pointer.x : startX,
              top: height < 0 ? pointer.y : startY
            });
            break;

          case 'circle':
            const radius = Math.sqrt(
              Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
            ) / 2;
            this.currentShape.set({ radius: radius });
            break;

          case 'arrow':
            this.canvas.remove(this.currentShape);
            this.currentShape = this.createArrow(startX, startY, pointer.x, pointer.y);
            this.canvas.add(this.currentShape);
            break;
        }

        this.canvas.renderAll();
      });

      this.canvas.on('mouse:up', () => {
        this.isDrawing = false;
        this.currentShape = null;
      });
    },

    createArrow(fromX, fromY, toX, toY) {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLength = 20;

      const points = [
        fromX, fromY,
        toX, toY,
        toX - headLength * Math.cos(angle - Math.PI / 6),
        toY - headLength * Math.sin(angle - Math.PI / 6),
        toX, toY,
        toX - headLength * Math.cos(angle + Math.PI / 6),
        toY - headLength * Math.sin(angle + Math.PI / 6)
      ];

      return new fabric.Polyline(
        [
          { x: points[0], y: points[1] },
          { x: points[2], y: points[3] },
          { x: points[4], y: points[5] },
          { x: points[6], y: points[7] },
          { x: points[8], y: points[9] }
        ],
        {
          stroke: this.selectedColor,
          strokeWidth: 3,
          fill: 'transparent',
          selectable: true
        }
      );
    },


    cancel() {
      this.isOpen = false;
      this.clearAll();
      this.drawingCanvas = null;
      this.drawingContext = null;
      this.strokes = [];
    }
  },

  beforeUnmount() {
    if (this.canvas) {
      this.canvas.dispose();
    }
  }
};
</script>

<style scoped>
.screen-annotation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.05);
}

.annotation-toolbar-top {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  padding: 16px;
}

.toolbar-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.toolbar-title {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.toolbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
  pointer-events: auto;
  z-index: 9998; /* Below toolbar */
}

.annotation-toolbar-top {
  pointer-events: auto !important;
}

.annotation-toolbar-top * {
  pointer-events: auto !important;
}

/* Tool-specific cursors */
.screen-annotation-overlay[data-tool="pen"] .drawing-canvas {
  cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="2" fill="black"/></svg>') 8 8, crosshair;
}

.screen-annotation-overlay[data-tool="highlighter"] .drawing-canvas {
  cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect x="5" y="8" width="10" height="4" fill="yellow" opacity="0.7"/></svg>') 10 10, crosshair;
}
</style>
