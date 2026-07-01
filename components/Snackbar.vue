<template>
    <div>
      <!-- v-snackbar for toast messages -->
      <v-snackbar
        v-model="visible"
        :color="typeColor"
        location="top"
        :timeout="timeout"
        class="snackbar-container rounded-xl"
      >
        <!-- Toast message content -->
        <div class="snackbar-body">
          <div class="snackbar-icon-wrap">
            <div class="icn-cntnr">
             <v-icon v-if="iconMdi" class="toast-icon" :style="{ color: iconAndTitleColor }">{{ iconMdi }}</v-icon>
             <img v-else :src="typeImage" alt="" class="snackbar-image">
            </div>
          </div>
          <div class="snackbar-copy">
            <div class="d-block text-left cust-ma">
              <strong class="header-txt" :style="{ color:iconAndTitleColor }">{{
              capitalizeWords(type)
            }}</strong>
            <p class="message-txt">{{ title }}</p>

            </div>
          </div>
          <div class="snackbar-close">
            <v-icon class="snackbar-close-icon" right @click.stop="visible = false"
              >mdi-close</v-icon
            >
          </div>
        </div>
        <!-- <v-divider class="divider-cls"></v-divider> -->
        <!-- <v-row class="pa-1">
          <v-col>
          </v-col>
        </v-row> -->
        <div v-if="progress" class="snackbar-progress">
          <v-progress-linear indeterminate rounded height="6"></v-progress-linear>
        </div>
      </v-snackbar>
    </div>
  </template>
  
  <script setup>
  import successImg from "@/assets/icons/snackbar/success.svg"
  import errorImg from "@/assets/icons/snackbar/error.svg"
  import warningImg from "@/assets/icons/snackbar/warning.svg"
  import infoImg from "@/assets/icons/snackbar/information.svg"
  import pendingImg from "@/assets/icons/snackbar/pending.svg"
  import { nextTick } from "vue"

  const mainStore = useMainStore();
  const visible = ref(false); 
  const title = ref("");
  const subtitle = ref("");
  const type = ref("");
  const iconMdi = ref(null);
  const timeout = ref(3000); 
  const progress = ref(false);
  
  watch(
  () => mainStore.getToast,
  async (toast) => {
    if (toast !== null && toast.title) {
      visible.value = false;
      title.value = toast.title;       // <- Corrected
      subtitle.value = toast.subtitle; // <- Corrected
      progress.value = toast.progress || false;
      type.value = toast.type;
      iconMdi.value = toast.iconMdi || null;
      await nextTick();
      visible.value = true;
    }
  },
  { deep: true }
);
  
  // Computed property for typeColor
  const typeColor = computed(() => {
    return type.value === "success"
      ? "#EBFBEE"
      : type.value === "error"
      ? "#FFF5F4"
      : type.value === "warning"
      ? "#FFF8DE"
      : type.value === "information"
      ? "#E7F5FF"
      : type.value === "notification"
      ? "#E7F5FF" // Brand blue tint
        : type.value === "pending"
      ? "#F8EFFF"
      : "#F8EFFF"; 
  });
  const iconAndTitleColor = computed(() => {
    return type.value === "success"
      ? "#37A757"
      : type.value === "error"
      ? "#F96351"
      : type.value === "warning"
      ? "#EFB42D"
      : type.value === "information"
      ? "#0E99F6"
      : type.value === "notification"
      ? "#0E99F6" // Brand blue
        : type.value === "pending"
      ? "#5D2684"
      : "#5D2684"; 
  });
  const typeImage = computed(() => {
  switch (type.value.toLowerCase()) {
    case "success":
      return successImg;
    case "error":
      return errorImg;
    case "warning":
      return warningImg;
    case "information":
      return infoImg;
    case "pending":
      return pendingImg;
    default:
      return infoImg; // fallback
  }
});
  function capitalizeWords(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
  </script>
  <style lang="scss" scoped>
  .custom-snackbar {
    margin-top: 28px;
  }
  .message-txt {
    font-size: 14px;
    text-align: left;
    color: #000000 !important;
    margin: 2px 0 0;
    word-break: break-word;
  }
  
  .header-txt {
    font-size: 16px;
    font-weight: bold;
    line-height: 1.2;
    text-align: left;
  }
  .cust-ma{
    margin-top: 2px;
  }
  .icn-cntnr {
    height: 28px;
    width: 28px;
    padding: 2px;
    border-radius: 4px;
  
    display: flex;
    justify-content: center;
    align-items: center;
    .toast-icon {
      font-size: 24px !important;
    }
  }
  .snackbar-image {
    width: 24px;
    height: 24px;
    object-fit: contain;
    display: block;
  }
  .snackbar-body {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 100%;
    padding: 4px 2px;
  }
  .snackbar-icon-wrap {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 2px;
  }
  .snackbar-copy {
    flex: 1 1 auto;
    min-width: 0;
  }
  .snackbar-close {
    flex: 0 0 auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .snackbar-close-icon {
    color: #cfd3d7;
    cursor: pointer;
  }
  .snackbar-progress {
    margin-top: 8px;
  }
  .v-overlay__content{
    border-radius: 12px !important;
  }
  :deep(.snackbar-container) {
    width: min(560px, calc(100vw - 24px));
    max-width: calc(100vw - 24px);
  }
  :deep(.snackbar-container .v-snackbar__wrapper) {
    width: 100%;
    min-width: 0 !important;
    max-width: 100%;
    min-height: 0 !important;
    padding: 12px 14px;
  }
  :deep(.snackbar-container .v-snackbar__content) {
    width: 100%;
    padding: 0;
  }
  @media (min-width: 601px) {
    .snackbar-body {
      align-items: center;
      gap: 14px;
      padding: 6px 2px;
    }
    .message-txt {
      font-size: 14px;
    }
    :deep(.snackbar-container) {
      width: 500px;
      max-width: 500px;
    }
    :deep(.snackbar-container .v-snackbar__wrapper) {
      min-height: 96px !important;
      padding: 14px 16px;
    }
  }
  @media (max-width: 600px) {
    .snackbar-body {
      gap: 10px;
      align-items: flex-start;
    }
    .header-txt {
      font-size: 15px;
    }
    .message-txt {
      font-size: 13px;
    }
    :deep(.snackbar-container) {
      width: calc(100vw - 16px);
      max-width: calc(100vw - 16px);
    }
    :deep(.snackbar-container .v-snackbar__wrapper) {
      padding: 10px 12px;
    }
  }
  </style>
  <style lang="scss">
  .v-snackbar__wrapper {
  border-radius: 12px !important;
}
  .custom-snackbar {
    .v-snack__content {
      display: inline-flex;
      align-items: center;
    }
  }
  .divider-cls {
    border-color: grey !important;
  }
 
  </style>
  
