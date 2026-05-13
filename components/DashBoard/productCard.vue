<template>
  <div
    class="flossly-card"
    :class="{ 'flossly-card-thick': isToolBox, 'flossly-card-locked': locked }"
    :id="`flossly-card-${uid}`"
    :style="{ backgroundColor: isToolBox ? '#1E2B80' : '#F1F9FF' }"
    @click="handleClick(uid)"
  >
    <v-icon v-if="locked" size="18" color="warning" class="lock-icon">mdi-lock-outline</v-icon>
    <div class="content">
       <div class="pa-5 rounded-xl" :class="[{ 'blur-card': isToolBox }]" :style="{backgroundColor: colors || '',height:'80px',width:'80px'}">
         <lord-icon
           :src="img"
           trigger="hover"
           :target="`#flossly-card-${uid}`"
           colors="primary:#ffffff"
           class="main-img"
         />
       </div>
      <p class="title" :style="{color: isToolBox ? '#ffffff' : '#000000'}">{{ title }}</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const emit= defineEmits(['handleClick']);
const router = useRouter();

const props = defineProps({
  title: { type: String, required: true },
  img: { type: String, required: true },
  colors: { type: String, default: "" },
  isToolBox: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  lockedFeature: { type: String, default: '' },
  route: { type: String, required: false },
  uid: { type: [String, Number], required: true },
  isHovered: Boolean,
});
const handleClick = () => {
  if (props.locked) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('upgrade-required', {
        detail: { feature: props.lockedFeature || 'diary', code: 'FEATURE_NOT_AVAILABLE' },
      }));
    }
    return;
  }
  if (!props.isToolBox && props.route) {
    router.push(props.route);
  } else {
    emit('handleClick', props.uid);
  }
};
</script>

<style scoped>
.flossly-card {
  position: relative;
  border-radius: 24px;
  padding: 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  height: 200px;
  width: 100%;
  z-index: 0; /* ensures pseudo-element stays behind content */
  cursor: pointer;
  z-index: 0;
  transition: box-shadow 0.3s ease;
}
.flossly-card:hover {
  box-shadow: 0px 8px 28px 0px #FF85DA3D; /* hover glow */
}
.flossly-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 24px;
  padding: 1px; /* thickness of the border */
  background: linear-gradient(
    90deg,
    #ffa977,
    #ff85da,
    #7d77ff,
    #68ece6
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  z-index: -1; /* keep it behind the content */
}

.flossly-card-thick::before {
  padding: 4px; /* thickness of the border */
}
.flossly-card-thick:hover {
  box-shadow: 0px 8px 28px 0px #FF85DA3D; /* hover glow */
}
.lock-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.flossly-card-locked {
  opacity: 0.75;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
 
}

.main-img {
  width: 40px;
  height: 40px;
}

.title {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}
.blur-card {
  background: rgba(255, 255, 255, 0.2); /* semi-transparent */
  backdrop-filter: blur(10px);          /* blur effect */
  -webkit-backdrop-filter: blur(10px);  /* Safari support */
  border: 1px solid #ffffff;
}


</style>
