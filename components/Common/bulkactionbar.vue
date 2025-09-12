<template>
  <transition name="fade">
    <div v-if="isOpen" class="bulk-bar">
      <div class="bar-content">
        <!-- Left Section -->
        <div class="left">
          <div class="circle-icon">
            <span class="count">{{ count }}</span>
          </div>
          <span class="context-text">Items Selected</span>
        </div>

        <!-- Right Section -->
        <div class="right">
          <!-- First Action Button -->
          <div class="action-button first" @click="$emit('action1')">
            <div class="action-icon-wrap">
              <v-icon>{{ icon1 }}</v-icon>
            </div>
            <span class="action-text">{{ action1Label }}</span>
          </div>

          <!-- Second Action Button -->
          <div class="action-button second" @click="$emit('action2')">
            <div class="action-icon-wrap">
              <v-icon>{{ icon2 }}</v-icon>
            </div>
            <span class="action-text">{{ action2Label }}</span>
          </div>

          <!-- Divider -->
          <div class="solid-line"></div>

          <!-- Close Button -->
          <div class="close-icon" @click="$emit('close')">
            <v-icon>mdi-close</v-icon>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
  count: number
  icon1: string
  icon2: string
  action1Label: string
  action2Label: string
}>()

defineEmits<{
  (e: 'action1'): void
  (e: 'action2'): void
  (e: 'close'): void
}>()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.bulk-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: #ffffff;
  border: 1px solid #E6E6E6;
  border-radius: 12px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05), 
              0px 3px 6px -4px rgba(0, 0, 0, 0.25);
  padding: 8px 12px;
  min-width: 320px;
  max-width: calc(100vw - 32px);
}

.bar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Poppins', sans-serif;
  color: #1e1e1e;
}

.circle-icon {
  width: 32px;
  height: 32px;
  background: #213536;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count {
  font-weight: 600;
  color: #ffffff;
}

.context-text {
  font-weight: 400;
  font-size: 14px;
}

.right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 8px;
  border-radius: 8px;
  background: #F5F5F5;
  cursor: pointer;
}

.first {
  width: 150px;
}

.second {
  width: 120px;
}

.action-text {
  font-family: Poppins, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #1E1E1E;
  margin-left: 6px;
}

.solid-line {
  width: 44px;
  height: 0;
  border: 1px solid #DBDBDB;
  transform: rotate(-90deg);
}

.close-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.action-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
