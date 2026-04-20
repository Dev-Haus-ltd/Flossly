<template>
  <div class="integration-card">
    <div class="card-top">
      <div class="icon-wrap" :class="iconClass">
        <img v-if="icon" :src="icon" :alt="title" />
        <slot v-else name="icon" />
      </div>
      <v-chip
        :color="statusColor"
        variant="flat"
        size="small"
        class="status-chip"
      >
        {{ statusLabel }}
      </v-chip>
    </div>
    <div class="card-title">{{ title }}</div>
    <div class="card-sub">{{ subtitlePrimary || '-' }}</div>
    <div class="card-sub">{{ subtitleSecondary || '-' }}</div>
    <slot name="toggle" />
    <div class="card-divider"></div>
    <div class="card-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitlePrimary: { type: String, default: '' },
  subtitleSecondary: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  statusColor: { type: String, default: 'grey-lighten-1' },
  icon: { type: String, default: '' },
  iconClass: { type: String, default: '' },
})
</script>

<style scoped>
.integration-card {
  border: 1px solid #dbdbdb;
  border-radius: 12px;
  padding: 18px;
  background: #ffffff;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
}

.icon-wrap img {
  width: 40px;
  height: 40px;
}

.icon-wrap.whatsapp {
  background: #eaf7ef;
}

.icon-wrap.meta {
  background: #eef2ff;
}

.icon-wrap.chatbot {
  background: #eef2ff;
}

.status-chip {
  font-weight: 500;
}

.card-title {
  font-weight: 600;
  font-size: 18px;
  color: #111827;
}

.card-sub {
  font-size: 13px;
  color: #6b7280;
}

.card-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 8px 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
