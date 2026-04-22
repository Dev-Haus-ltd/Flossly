<template>
  <div class="carousel-container">
    <!-- Carousel wrapper -->
    <div class="carousel-wrapper">
      <!-- Cards Container -->
      <div class="cards-container">
        <transition-group
          name="slide-fade"
          tag="div"
          class="cards-inner"
        >
          <div
            v-for="(card, index) in cards"
            v-show="index === currentIndex"
            :key="`card-${index}`"
            class="card-wrapper"
          >
            <v-card
              class="event-card"
              elevation="0"
              ref="cardRef"
            >
              <!-- Gradient border outer layer -->
              <div class="card-border-gradient"></div>

              <!-- Inner content background -->
              <div class="card-inner-bg">
                <!-- Image Section (Left) -->
                <div class="image-section">
                  <img
                    :src="card.imageSrc"
                    :alt="card.heading"
                    class="event-image"
                  />
                </div>

                <!-- Content Section (Right) -->
                <div class="content-section">
                  <!-- Close icon -->
                  <v-icon
                    class="close-icon"
                    @click="closeCard"
                  >
                    mdi-close
                  </v-icon>

                  <!-- Heading -->
                  <h2 class="event-heading">{{ card.heading }}</h2>

                  <!-- Date with Calendar Icon -->
                  <div class="event-date">
                    <img
                      :src="calendarIcon"
                      alt="Calendar icon"
                      class="calendar-icon"
                    />
                    <span class="date-text">{{ card.date }}</span>
                  </div>

                  <!-- Subheading/Description -->
                  <!-- <p class="event-subheading">{{ card.subheading }}</p> -->

                  <!-- Book Ticket Button -->
                  <button
                    class="book-ticket-btn"
                    @click="openBooking"
                  >
                    {{ card.buttonText }}
                  </button>
                </div>

                <!-- Navigation: Left Arrow -->
                <button
                  class="nav-arrow nav-arrow--left"
                  @click="previousCard"
                  aria-label="Previous card"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                </button>

                <!-- Navigation: Right Arrow -->
                <button
                  class="nav-arrow nav-arrow--right"
                  @click="nextCard"
                  aria-label="Next card"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                </button>
              </div>
            </v-card>
          </div>
        </transition-group>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import event1 from '@/assets/dashboard/events/event_1.png'
import event2 from '@/assets/dashboard/events/event_2.png'
import event3 from '@/assets/dashboard/events/event_3.png'
import calendarIcon from '@/assets/dashboard/events/event-calender-icon.svg'


const emit = defineEmits(["close"]);
const currentIndex = ref(0);
let autoPlayInterval = null;

const cards = ref([
  {
    imageSrc: event1,
    heading: 'The Dream Squat Conference',
    date: 'April 17th, 2026',
    buttonText: 'Book Ticket',
    bookingUrl: 'https://www.eventbrite.co.uk/e/dream-squat-mastermind-build-launch-grow-tickets-1976588662899?aff=oddtdtcreator'
  },
  {
    imageSrc: event2,
    heading: 'The Dental Owners Club',
    date: 'April 23rd, 2026',
    buttonText: 'Book Ticket',
    bookingUrl: 'https://dentist-times.co.uk/events'
  },
  {
    imageSrc: event3,
    heading: 'The Dentistry Show',
    date: 'May 15th and 16th, 2026',
    buttonText: 'Book Ticket',
    bookingUrl: 'https://birmingham.dentistryshow.co.uk/?utm_term=dental%20show&utm_campaign=BDCDS26+%7C+S+%7C+NB&utm_source=adwords&utm_medium=ppc&hsa_acc=9118698844&hsa_cam=23431771172&hsa_grp=194018610680&hsa_ad=792439144061&hsa_src=g&hsa_tgt=kwd-317483273222&hsa_kw=dental%20show&hsa_mt=e&hsa_net=adwords&hsa_ver=3&gad_source=1&gad_campaignid=23431771172&gbraid=0AAAAAqkB2GPGjHTvQex96jookuABDH1h7&gclid=CjwKCAjw46HPBhAMEiwASZpLRIA_hhpp1vLVzqEXYGokA5ldJ4pReI8ewv7HtHiroHNbBvkoKbBtXhoCy2QQAvD_BwE'
  },
]);

// Navigation functions
const nextCard = () => {
  currentIndex.value = (currentIndex.value + 1) % cards.value.length;
  resetAutoPlay();
};

const previousCard = () => {
  currentIndex.value =
    (currentIndex.value - 1 + cards.value.length) % cards.value.length;
  resetAutoPlay();
};

const openBooking = () => {
  const url = cards.value[currentIndex.value]?.bookingUrl;
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
};


const goToCard = (index) => {
  currentIndex.value = index;
  resetAutoPlay();
};

const closeCard = () => {
  emit("close");
};

// Auto-play functions
const startAutoPlay = () => {
  autoPlayInterval = setInterval(() => {
    nextCard();
  }, 5000); // 5 seconds
};

const resetAutoPlay = () => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
  }
  startAutoPlay();
};

onMounted(() => {
  startAutoPlay();
});

onUnmounted(() => {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
  }
});
</script>

<style scoped>
/* Carousel Container */
.carousel-container {
  width: 100%;
}

/* Carousel Wrapper */
.carousel-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 100%;
}

/* Cards Container */
.cards-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

.cards-inner {
  position: relative;
  width: 100%;
  height: 225px;
}

.card-wrapper {
  position: absolute;
  width: 100%;
  height: 100%;
}

/* Event Card */
.event-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  padding: 4px;
  background: linear-gradient(90deg, #FFA977, #FF85DA, #7D77FF, #68ECE6) !important;
  overflow: hidden;
}

/* Gradient border effect */
.card-border-gradient {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
  z-index: 1;
}

/* Inner background */
.card-inner-bg {
  position: absolute;
  inset: 4px;
  border-radius: 20px;
  background: linear-gradient(90deg, #263388, #3247A4, #AD7CF3);
  z-index: 2;
  display: flex;
  overflow: hidden;
}

/* Image Section */
.image-section {
  flex: 0 0 35%;
  position: relative;
  overflow: hidden;
  padding: 12px; 
  box-sizing: border-box;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 10px;
}

/* Content Section */
.content-section {
  flex: 1;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 3;
  color: white;
}

/* Event Heading */
.event-heading {
  font-size: 40px;
  font-weight: 700;
  margin: 0;
  color: #FFFFFF;
  line-height: 1.2;
}

/* Event Date with Calendar Icon */
.event-date {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #FFFFFF;
}

.calendar-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
}

.date-text {
  letter-spacing: 0.3px;
}

/* Event Subheading */
.event-subheading {
  font-size: 13px;
  font-weight: 400;
  margin: 0;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.4;
}

/* Book Ticket Button */
.book-ticket-btn {
  align-self: flex-start;
  padding: 10px 24px;
  margin-top: 8px;
  background-color: #FFFFFF;
  color: #6D60CA;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.3s ease;
}

.book-ticket-btn:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.book-ticket-btn:active {
  transform: translateY(0);
}

/* Close Icon */
.close-icon {
  position: absolute;
  top: 12px;
  right: 16px;
  color: white;
  cursor: pointer;
  transition: 0.3s ease;
  z-index: 4;
}

.close-icon:hover {
  transform: scale(1.2);
}

/* Navigation Arrows */
.nav-arrow {
  position: absolute;
  z-index: 5;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.6);
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  top: 50%;
  transform: translateY(-50%);
}

.nav-arrow--left {
  left: 16px;
}

.nav-arrow--right {
  right: 16px;
}

.nav-arrow:hover {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: white;
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow:active {
  transform: translateY(-50%) scale(0.95);
}

/* Carousel Indicators */
.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #3247A4;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator--active {
  background-color: #3247A4;
  border-color: #3247A4;
}

.indicator:hover {
  background-color: #3247A4;
  opacity: 0.7;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.5s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 768px) {

  .content-section {
    padding: 16px 20px;
    gap: 8px;
  }

  .event-heading {
    font-size: 20px;
  }

  .event-subheading {
    font-size: 12px;
  }

  .nav-arrow {
    width: 40px;
    height: 40px;
  }

  .nav-arrow--left {
    left: 12px;
  }

  .nav-arrow--right {
    right: 12px;
  }

  .image-section {
    flex: 0 0 30%;
  }
}

@media (max-width: 480px) {
  .cards-inner {
    height: 200px;
  }

  .content-section {
    padding: 12px 16px;
  }

  .event-heading {
    font-size: 16px;
  }

  .book-ticket-btn {
    padding: 8px 16px;
    font-size: 12px;
  }

  .nav-arrow {
    width: 36px;
    height: 36px;
    border-width: 1.5px;
    font-size: 18px;
  }

  .nav-arrow--left {
    left: 8px;
  }

  .nav-arrow--right {
    right: 8px;
  }
}
</style>
