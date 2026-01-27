<template>
    <div>
      <!-- Feature Card with debounced hover -->
      <div 
        class="card-container"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousemove="handleMouseMove"
      >
        <v-card
          class="feature-card d-flex align-center pa-4"
          :class="{ 'card-expanded': isHovered }"
          elevation="0"
          bg-color="#171952"
          ref="cardRef"
        >
          <div class="content-wrapper">
            <img
              src="https://img.youtube.com/vi/my_5J6E-4RU/hqdefault.jpg"
              alt="YouTube thumbnail"
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

          <v-icon 
            class="close-icon"
            :class="{ 'close-icon-expanded': isHovered }"
            @click="$emit('close')"
          >
            mdi-close
          </v-icon>

          <div v-if="isHovered" class="expanded-inner-layer"></div>
        </v-card>
      </div>

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
                :src="`https://www.youtube.com/embed/my_5J6E-4RU?autoplay=1`"
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
  const cardRef = ref(null);
  let hoverTimeout = null;
  let leaveTimeout = null;

  const handleMouseEnter = () => {
    // Clear any pending leave timeout
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
      leaveTimeout = null;
    }
    
    // Debounce enter with small delay to prevent rapid toggles
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    hoverTimeout = setTimeout(() => {
      isHovered.value = true;
      hoverTimeout = null;
    }, 50);
  };

  const handleMouseLeave = () => {
    // Clear any pending enter timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    
    // Debounce leave with delay to prevent rapid toggles at edges
    if (leaveTimeout) {
      clearTimeout(leaveTimeout);
    }
    
    leaveTimeout = setTimeout(() => {
      isHovered.value = false;
      leaveTimeout = null;
    }, 100);
  };

  const handleMouseMove = (e) => {
    // If the card is expanded and cursor is still within container, keep hover state
    if (isHovered.value && cardRef.value) {
      const rect = cardRef.value.$el.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      // Add 10px buffer zone beyond card bounds
      if (x < rect.left - 10 || x > rect.right + 10 || 
          y < rect.top - 10 || y > rect.bottom + 10) {
        handleMouseLeave();
      }
    }
  };

  const openModal = () => {
    showModal.value = true;
  };

  const closeModal = () => {
    showModal.value = false;
  };
  </script>
  
  <style scoped>
  .card-container {
    position: relative;
  }

  .feature-card {
    border-radius: 24px;
    position: relative;
    background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: clamp(8px, 2vw, 16px);
    padding-right: clamp(8px, 2vw, 16px);
    transition: all 0.5s ease;
    cursor: pointer;
    min-height: clamp(56px, 5vw, 68px);
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
      url("https://img.youtube.com/vi/my_5J6E-4RU/maxresdefault.jpg"),
      linear-gradient(180deg, #263388 0%, rgba(173, 124, 243, 0.08) 100%);
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    background-color: #030826;
    border-radius: 20px;
    z-index: 2;
    pointer-events: none;
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

  /* Responsive image sizing */
  @media (max-width: 1920px) {
    .feature-img {
      width: clamp(60px, 5vw, 83px);
      height: clamp(45px, 3.75vw, 60px);
    }
  }

  @media (max-width: 1440px) {
    .feature-img {
      width: clamp(55px, 4.5vw, 75px);
      height: clamp(40px, 3.3vw, 55px);
    }
  }

  @media (max-width: 1024px) {
    .feature-img {
      width: clamp(50px, 4vw, 65px);
      height: clamp(37px, 3vw, 48px);
    }
  }

  @media (max-width: 768px) {
    .feature-img {
      width: clamp(45px, 3.5vw, 55px);
      height: clamp(33px, 2.6vw, 40px);
    }
  }

  @media (max-width: 480px) {
    .feature-img {
      width: clamp(35px, 3vw, 45px);
      height: clamp(26px, 2.2vw, 33px);
    }
  }

  .feature-img.img-hidden {
    display: none;
  }
  
  /* Text styles */
  .sub-heading {
    font-weight: 600;
    font-size: clamp(16px, 1.5vw, 20px);
    color: #ffffff;
    transition: all 0.4s ease;
    position: relative;
    z-index: 3;
    white-space: nowrap;
  }

  .sub-heading.text-expanded {
    font-weight: 600;
    font-size: clamp(18px, 2vw, 24px);
    text-align: center;
    width: 100%;
    white-space: normal;
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

  .close-icon:hover {
    transform: scale(1.2);
  }

  .close-icon.close-icon-expanded {
    position: absolute;
    top: 8px;
    right: 12px;
    z-index: 6;
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