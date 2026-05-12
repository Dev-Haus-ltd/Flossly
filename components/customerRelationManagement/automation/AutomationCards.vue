<template>
  <div>
    <div class="automation-card-grid">
      <div
        v-for="card in cards"
        :key="card.key"
        class="automation-card-cell"
      >
        <AutomationCard
          :title="card.title"
          :description="card.description"
          :count="card.itemCount"
          :enabled="card.enabled"
          :author="card.author"
          :created-at="card.createdAt"
          :show-toggle="showCardToggle"
          :show-actions="allowGroupEdit"
          :disable-actions="card.isDefault"
          :selected="activeKey === card.key"
          :whatsapp-warning="!whatsappEnabled && !!card.hasWhatsApp"
          :bulk-state="card.bulkState || null"
          @select="$emit('select', card)"
          @toggle="(val) => $emit('toggle', card, val)"
          @edit="$emit('edit', card)"
          @delete="$emit('delete', card)"
        />
      </div>
    </div>

    <div v-if="!cards.length" class="automation-empty">
      <div class="automation-empty__icon" @click="$emit('go-to-automations')">
        <img :src="addFolderIcon" alt="Add automation group" />
      </div>
      <div class="automation-empty__title">Add your Automation group</div>
      <div class="automation-empty__subtitle">No Automation</div>
    </div>
  </div>
</template>

<script setup>
import AutomationCard from '@/components/Common/AutomationCard.vue'

defineProps({
  cards: {
    type: Array,
    default: () => [],
  },
  addFolderIcon: {
    type: String,
    default: '',
  },
  showCardToggle: {
    type: Boolean,
    default: true,
  },
  allowGroupEdit: {
    type: Boolean,
    default: false,
  },
  activeKey: {
    type: String,
    default: '',
  },
  whatsappEnabled: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['select', 'toggle', 'edit', 'delete', 'go-to-automations'])
</script>

<style scoped>
.automation-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 240px);
  gap: 16px;
  justify-content: flex-start;
}

.automation-card-cell {
  width: 240px;
  max-width: 240px;
}

.automation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 16px 72px;
}

.automation-empty__icon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #eaf1ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
}

.automation-empty__icon img {
  width: 32px;
  height: 32px;
}

.automation-empty__title {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.automation-empty__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}
</style>
