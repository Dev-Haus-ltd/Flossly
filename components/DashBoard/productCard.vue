<template>
  <div
    class="flossly-card"
    :id="`flossly-card-${uid}`"
    :class="{ clickable: !isLocked }"
    :style="{ backgroundColor: !isLocked ? '#FFFFFF' : '#F2F2F2' }"
    @click="handleClick(uid)"
  >
    <div v-if="isLocked" class="lock-icon">
      <img :src="lockImg" alt="Locked" />
    </div>
    <div class="content">
      <!-- <img :src="img" alt="Card Image" class="main-img" /> -->
      <lord-icon
        :src="img"
        trigger="hover"
        :target="`#flossly-card-${uid}`"
        :colors="colors || ''"
        class="main-img"
      />
      <p class="title">{{ title }}</p>
    </div>
  </div>
</template>

<script setup>
import lockImg from "@/assets/icons/dashBoard/lock.svg";
import { useRouter } from "vue-router";
const emit= defineEmits(['handleClick']);
const router = useRouter();

const props = defineProps({
  title: { type: String, required: true },
  img: { type: String, required: true },
  colors: { type: String, default: "" },
  isLocked: { type: Boolean, default: false },
  route: { type: String, required:false }, // route to navigate
  uid: { type: [String, Number], required: true },
  isHovered: Boolean,
});
console.log(props);
const handleClick = () => {
  if (!props.isLocked && props.route) {
    router.push(props.route);
  }
  else{
    emit('handleClick', props.uid)
  }
};
</script>

<style scoped>
.flossly-card {
  position: relative;
  border-radius: 12px;
  padding: 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  height: 200px;
  width: 100%;
  z-index: 0; /* ensures pseudo-element stays behind content */
}

.flossly-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 12px;
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


.flossly-card.clickable {
  cursor: pointer;
}

.lock-icon {
  position: absolute;
  top: 10px;
  right: 10px;
}

.lock-icon img {
  width: 24px;
  height: 24px;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.main-img {
  width: 100px;
  height: 100px;
}

.title {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

</style>
