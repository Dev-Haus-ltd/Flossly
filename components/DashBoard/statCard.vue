<template>
  <div class="task-div">
    <div class="card-header">
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

    <p class="card-label">{{ label }}</p>
    <h1 class="card-value">{{ value }}</h1>
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
  padding: 16px;
  background: white;
  min-height: 170px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 8px;
  }

  img {
    width: 52px;
    height: 52px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .lft-img {
    width: 48px;
    height: 48px;
  }

  .link-icon {
    width: 32px;
    height: 32px;
  }

  .card-label {
    font-size: 13px;
    color: #1e1e1e;
    font-weight: 400;
    margin: 0;
    line-height: 1.2;
    word-break: break-word;
  }

  .card-value {
    font-size: 32px;
    color: #101010;
    font-weight: 700;
    margin: 0;
    line-height: 1;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .task-div {
    padding: 14px;
    min-height: 160px;
    gap: 10px;

    img {
      width: 48px;
      height: 48px;
    }

    .lft-img {
      width: 44px;
      height: 44px;
    }

    .link-icon {
      width: 28px;
      height: 28px;
    }

    .card-label {
      font-size: 12px;
    }

    .card-value {
      font-size: 28px;
    }
  }
}

@media (max-width: 960px) {
  .task-div {
    padding: 12px;
    min-height: 150px;
    gap: 8px;

    img {
      width: 44px;
      height: 44px;
    }

    .lft-img {
      width: 40px;
      height: 40px;
    }

    .link-icon {
      width: 24px;
      height: 24px;
    }

    .card-label {
      font-size: 11px;
    }

    .card-value {
      font-size: 24px;
    }
  }
}

@media (max-width: 600px) {
  .task-div {
    padding: 12px;
    min-height: 140px;
    gap: 8px;

    img {
      width: 40px;
      height: 40px;
    }

    .lft-img {
      width: 36px;
      height: 36px;
    }

    .link-icon {
      width: 20px;
      height: 20px;
    }

    .card-label {
      font-size: 10px;
    }

    .card-value {
      font-size: 20px;
    }
  }
}
</style>