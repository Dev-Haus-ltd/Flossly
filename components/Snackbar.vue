<template>
    <div>
      <!-- v-snackbar for toast messages -->
      <v-snackbar
        v-model="visible"
        :color="typeColor"
        center
        location="top"
        :timeout="timeout"
        :min-width="500" 
        :min-height="100"
        class="snackbar-container rounded-xl"
      >
        <!-- Toast message content -->
        <v-row class="text-center pa-1"> 
          <v-col cols="1" class="d-flex">
            <div class="icn-cntnr">
             <img :src="typeImage" alt="">
            </div>
          </v-col>
          <v-col cols="9">
            <div class="d-block text-left cust-ma">
              <strong class="header-txt" :style="{ color:iconAndTitleColor }">{{
              capitalizeWords(type)
            }}</strong>
            <p class="message-txt">{{ title }}</p>
  
            </div>
          </v-col>
          <v-col cols="2" class="text-right">
            <v-icon right style="color: #cfd3d7" @click.stop="visible = false"
              >mdi-close</v-icon
            >
          </v-col>
        </v-row>
        <!-- <v-divider class="divider-cls"></v-divider> -->
        <!-- <v-row class="pa-1">
          <v-col>
          </v-col>
        </v-row> -->
        <v-row v-if="progress">
          <v-progress-linear indeterminate rounded height="6"></v-progress-linear>
        </v-row>
      </v-snackbar>
    </div>
  </template>
  
  <script setup>
  import successImg from "@/assets/icons/snackbar/success.svg"
  import errorImg from "@/assets/icons/snackbar/error.svg"
  import warningImg from "@/assets/icons/snackbar/warning.svg"
  import infoImg from "@/assets/icons/snackbar/information.svg"
  import pendingImg from "@/assets/icons/snackbar/pending.svg"

  const mainStore = useMainStore();
  const visible = ref(false); 
  const title = ref("");
  const subtitle = ref("");
  const type = ref("");
  const timeout = ref(3000); 
  const progress = ref(false);
  
  watch(
  () => mainStore.getToast,
  (toast) => {
    console.log('SNACKBAR TRIGGERED:', toast);
    if (toast !== null) {
      visible.value = true;
      title.value = toast.title;       // <- Corrected
      subtitle.value = toast.subtitle; // <- Corrected
      progress.value = toast.progress || false;
      type.value = toast.type;
    }
  }
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

  }
  
  .header-txt {
    font-size: 16px;
    font-weight: bold;
    height: 20px;
    text-align: left;
    
  }
  .cust-ma{
    margin-top: 2.5px;
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
  .v-overlay__content{
    border-radius: 12px !important;
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
  