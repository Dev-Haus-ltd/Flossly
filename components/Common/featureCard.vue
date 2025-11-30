<template>
    <div>
      <!-- Feature Card -->
      <v-card
        class="feature-card d-flex align-center pa-4"
        :class="{ 'card-expanded': isHovered }"
        elevation="0"
        bg-color="#171952"
      >
        <div 
          class="hover-zone"
          @mouseenter="isHovered = true"
          @mouseleave="isHovered = false"
        >
          <div class="content-wrapper">
            <img
              src="@/assets/dashboard/demo-video-thumbnail.svg"
              alt="thumbnail"
              class="feature-img"
              :class="{ 'img-hidden': isHovered }"
            />

            <div class="sub-heading" :class="{ 'text-expanded': isHovered }">
              {{ subheading }}
            </div>

            <div v-if="isHovered" class="play-button-container">
              <img 
                src="@/assets/dashboard/play-button.svg"
                alt="play"
                class="play-button"
                @click="openModal"
              />
            </div>
          </div>
        </div>

        <v-icon 
          class="close-icon"
          :class="{ 'close-icon-expanded': isHovered }"
          @click="$emit('close')"
        >
          mdi-close
        </v-icon>

        <div v-if="isHovered" class="expanded-inner-layer"></div>
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
                :src="`https://www.youtube.com/embed/gEuICxXisnw?autoplay=1`"
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
    transition: all 0.5s ease;
    cursor: pointer;
    min-height: 68px;
    overflow: hidden;
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

  .feature-card.card-expanded {
    height: 225px;
    padding: 4px;
    animation: slideExpand 0.6s ease forwards;
  }

  @keyframes slideExpand {
    from {
      height: 68px;
    }
    to {
      height: 225px;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .feature-card.card-expanded {
      height: 200px;
    }
  }

  @media (max-width: 768px) {
    .feature-card.card-expanded {
      height: 180px;
    }
  }

  @media (max-width: 480px) {
    .feature-card.card-expanded {
      height: 150px;
    }
  }

  /* Inner expanded layer - respects border padding */
  .expanded-inner-layer {
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
        background-image: 
        url("@/assets/dashboard/demo-video-thumbnail-expanded.png"),
        linear-gradient(180deg, #263388 0%, rgba(173, 124, 243, 0.08) 100%);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: #030826;
    border-radius: 20px;
    z-index: 2;
    pointer-events: none;
    border-image-slice: 1%;
  }

  .feature-card.card-expanded::before {
    background: linear-gradient(180deg, #263388 0%, rgba(173, 124, 243, 0.08) 100%);
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 24px;
    z-index: 1;
  }

  .content-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    z-index: 3;
    position: relative;
    flex: 1;
    transition: all 0.4s ease;
  }

  .feature-card.card-expanded .content-wrapper {
    flex-direction: column;
    height: 225px;
    padding: 0;
    justify-content: center;
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
    transition: all 0.4s ease;
  }

  .feature-img.img-hidden {
    display: none;
  }
  
  /* Text styles */
  .sub-heading {
    font-weight: 600;
    font-size: 20px;
    color: #ffffff;
    transition: all 0.4s ease;
    position: relative;
    z-index: 3;
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
    z-index: 4;
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
    z-index: 5;
    position: relative;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .close-icon.close-icon-expanded {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 6;
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
  .hover-zone {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

  </style>