<template>
  <div class="task-div"  >
    <div class="d-flex justify-space-between w-100">
      <!-- Left image -->
      <img :src="resolvedImage" alt="Main icon" class="lft-img"/>

      <!-- Right clickable image -->
      <img
        src="@/assets/icons/dashBoard/link.svg"
        alt="Link icon"
        class="link-icon"
        @click="openLink"
      />
    </div>

    <p class="mt-2">{{ label }}</p>
    <h1>{{ value }} </h1>
  </div>
</template>

<script setup>
import upcoming from  "@/assets/icons/dashBoard/upcoming.svg"
import completed from  "@/assets/icons/dashBoard/completed.svg"
import overdue from  "@/assets/icons/dashBoard/overdue.svg"
import progress from  "@/assets/icons/dashBoard/progress.svg"
const router =useRouter()
const props = defineProps({
  cols: { type: Number, default: 3 },
  image: { type: String, required: true },
  linkIcon: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  link: { type: String, required: true },
  keyName:{type:String, required:true}
});

const openLink = () => {
  router.push(props.link)
};
const imageMap = {
  upcoming,
  completed,
  overdue,
  progress
};

// Dynamically choose the correct image based on keyName
const resolvedImage = computed(() => {
  if (props.keyName === "todo" || props.keyName === "upcoming") return upcoming;
  if (props.keyName === "completed") return completed;
  if (props.keyName === "overdue") return overdue;
  if (props.keyName === "progress") return progress;
  return upcoming; // fallback
});

</script>

<style scoped lang="scss">
.task-div {
  border: 1px solid #dbdbdb;
  border-radius: 20px;
  padding: 20px;
  background: white;
  height: 170px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  img {
    width: 52px;
    height: 52px;
    cursor: pointer;
  }

  p {
    font-size: 14px;
    color: #1e1e1e;
    font-weight: 400;
  }

  h1 {
    font-size: 30px;
    color: #101010;
    font-weight: 700;
  }

  .link-icon {
    width: 36px;
    height: 36px;
    align-self: center;
  }
}
</style>
