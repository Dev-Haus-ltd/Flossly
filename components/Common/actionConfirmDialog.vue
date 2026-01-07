<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="500" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <img
          v-if="icon === 'mdi-delete'"
          src="@/assets/tasks/delete.svg"
          alt="Delete"
          width="28"
          height="28"
          class="mr-3"
          :style="{ filter: iconColor === 'red' ? 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);' : '' }"
        />
        <v-icon
          v-else
          :color="iconColor" 
          class="mr-3"
          size="28"
        >
          {{ icon }}
        </v-icon>
        {{ title }}
      </v-card-title>
      
      <v-card-text>
        <p class="mb-3">{{ message }}</p>
        <div v-if="showUserInfo && userInfo" class="user-info pa-3 bg-grey-lighten-4 rounded">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-3">
              <img v-if="userInfo.photo" :src="userInfo.photo" :alt="userInfo.fullName">
              <v-icon v-else>mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ userInfo.fullName }}</div>
              <div class="text-caption text-grey-darken-1">{{ userInfo.email }}</div>
            </div>
          </div>
        </div>
        <v-alert v-if="warningText" type="warning" variant="tonal" class="mt-3">
          {{ warningText }}
        </v-alert>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="$emit('update:modelValue', false)"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          :color="confirmButtonColor"
          variant="flat"
          @click="handleConfirm"
          :loading="loading"
        >
          {{ confirmButtonText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmButtonText: {
    type: String,
    default: 'Confirm'
  },
  confirmButtonColor: {
    type: String,
    default: 'primary'
  },
  icon: {
    type: String,
    default: 'mdi-help-circle'
  },
  iconColor: {
    type: String,
    default: 'orange'
  },
  userInfo: {
    type: Object,
    default: null
  },
  showUserInfo: {
    type: Boolean,
    default: true
  },
  warningText: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm']);

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped>
.user-info {
  border-left: 4px solid #1976d2;
}
</style>