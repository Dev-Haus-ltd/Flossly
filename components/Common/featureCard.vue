<template>
    <div>
      <!-- Feature Card -->
      <v-card
        class="feature-card d-flex align-center pa-4"
        elevation="0"
        bg-color="#171952"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Left image and text content -->
        <div class="center-row" :class="{ expanded: isHovered }">
          <img
            src="https://img.youtube.com/vi/ivTYvriUWhY/maxresdefault.jpg"
            alt="thumbnail"
            class="feature-img"
            :class="{ 'img-expanded': isHovered }"
          />
    
          <!-- Text content -->
          <div class="sub-heading" :class="{ 'text-expanded': isHovered }">
            {{ subheading }}
          </div>

          <!-- Play button on hover -->
          <div v-if="isHovered" class="play-button-container">
            <img 
              src="@/assets/dashboard/play-button.svg"
              alt="play"
              class="play-button"
              @click="openModal"
            />
          </div>
        </div>

        <!-- Close icon -->
        <v-icon class="close-icon" @click="$emit('close')">mdi-close</v-icon>
      </v-card>

      <!-- Modal Dialog -->
      <v-dialog 
        v-model="showModal" 
        max-width="900"
        persistent
      >
        <v-card class="modal-card" elevation="0">
          <!-- Modal gradient border -->
          <div class="modal-gradient-bg"></div>

          <!-- Modal content -->
          <div class="modal-content">
            <!-- Close button -->
            <v-icon 
              class="modal-close-btn"
              @click="closeModal"
            >
              mdi-close
            </v-icon>

            <!-- YouTube embed - shows immediately on modal open -->
            <div class="video-container">
              <iframe
                width="100%"
                height="500"
                :src="`https://www.youtube.com/embed/ivTYvriUWhY?autoplay=1`"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </v-card>
      </v-dialog>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';

  defineProps({
    heading: {
      type: String,
      required: true
    },
    subheading: {
      type: String,
      required: true
    }
  });
  
  defineEmits(['close']);

  const isHovered = ref(false);
  const showModal = ref(false);

  const openModal = () => {
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
  };
  </script>
  
  <style scoped>
  .feature-card {
    border-radius: 24px;
    position: relative;
    background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-right: 16px;
    transition: all 0.4s ease;
    cursor: pointer;
    min-height: 68px;
  }

  .feature-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
    border-radius: 20px;
    z-index: 1;
  }

  .center-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 2;
    position: relative;
    flex: 1;
    transition: all 0.4s ease;
    padding: 12px;
    height: 60px;
  }

  .center-row.expanded {
    background-image: url('https://img.youtube.com/vi/ivTYvriUWhY/maxresdefault.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 20px;
    padding: 0 20px;
    height: 280px;
    position: relative;
    flex-direction: column;
    min-height: unset;
  }

  .center-row.expanded::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 20px;
    z-index: 1;
  }
  
  /* Left image */
  .feature-img {
    width: 83px;
    height: 60px;
    border-radius: 5px;
    object-fit: fill;
    flex-shrink: 0;
    z-index: 2;
    position: relative;
  }

  .feature-img.img-expanded {
    display: none;
  }
  
  /* Text styles */
  .sub-heading {
    font-weight: 600;
    font-size: 20px;
    color: #ffffff;
    transition: all 0.4s ease;
    position: relative;
    z-index: 2;
  }

  .sub-heading.text-expanded {
    font-weight: 600;
    font-size: 24px;
    text-align: center;
    width: 100%;
  }

  /* Play button container */
  .play-button-container {
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;
    position: relative;
    margin-top: 12px;
  }

  .play-button {
    width: 79px;
    height: 79px;
    cursor: pointer;
    transition: all 0.3s ease;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }

  .play-button:hover {
    transform: scale(1.1);
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.6));
  }
  
  /* Close icon */
  .close-icon {
    color: #fff;
    cursor: pointer;
    z-index: 3;
    position: relative;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }
  .feature-card:hover .close-icon {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 4;
}


  .close-icon:hover {
    transform: scale(1.2);
  }

  /* Modal styles */
  .modal-card {
    border-radius: 24px;
    position: relative;
    background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
    overflow: hidden;
  }

  .modal-gradient-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
    padding: 4px;
    z-index: 1;
    pointer-events: none;
  }

  .modal-content {
    position: relative;
    z-index: 2;
    background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
    padding: 32px;
  }

  .modal-close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    color: #fff;
    cursor: pointer;
    z-index: 10;
    font-size: 32px;
    transition: all 0.3s ease;
  }

  .modal-close-btn:hover {
    transform: scale(1.2);
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
  }

  .video-container {
    border-radius: 12px;
    overflow: hidden;
  }

  .video-container iframe {
    border-radius: 12px;
    display: block;
  }
  </style>