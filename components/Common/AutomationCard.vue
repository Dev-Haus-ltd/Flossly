<template>
  <v-card
    class="automation-card rounded-xl"
    :class="{ 'automation-card--active': selected }"
    variant="text"
    @click="$emit('select')"
  >
    <div class="automation-illustration mb-3">
      <img src="@/assets/images/taskpool/operational.svg" alt="automation" class="illustration-img" />
    </div>
    <div class="automation-title-row">
      <CommonTruncatedText
        :text="title"
        :max-width="160"
        text-class="automation-title"
      />
      <div v-if="showActions" class="automation-actions">
        <v-btn
          icon
          variant="text"
          size="x-small"
          class="action-btn"
          :disabled="disableActions"
          @click.stop="$emit('edit')"
        >
          <v-icon size="16">mdi-pencil-outline</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="text"
          size="x-small"
          class="action-btn"
          :disabled="disableActions"
          @click.stop="$emit('delete')"
        >
          <v-icon size="16">mdi-delete-outline</v-icon>
        </v-btn>
      </div>
    </div>
    <span class="automation-sub mb-1 d-block">by {{ authorLabel }}</span>
    <div class="automation-desc clamp-2">{{ description }}</div>
    <div class="d-flex align-center justify-space-between mt-3">
      <div class="d-flex align-center text-grey">
        <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
        <span class="count">{{ count }}</span>
      </div>
      <v-switch
        v-if="showToggle"
        density="compact"
        inset
        hide-details
        color="primary"
        :model-value="enabled"
        @click.stop="$emit('toggle', !enabled)"
      />
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import CommonTruncatedText from '@/components/Common/TruncatedText.vue'

const props = defineProps({
  title: String,
  description: String,
  count: [Number, String],
  enabled: Boolean,
  selected: Boolean,
  author: {
    type: String,
    default: '',
  },
  showToggle: {
    type: Boolean,
    default: true,
  },
  showActions: {
    type: Boolean,
    default: false,
  },
  disableActions: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['select', 'toggle', 'edit', 'delete'])

const authorLabel = computed(() => {
  const raw = typeof props.author === 'string' ? props.author.trim() : ''
  return raw || 'Flossly'
})
</script>

<style scoped>
.automation-card { border:1px solid #dfdfdf; padding:16px; cursor:pointer; transition: all .2s ease; min-height: 260px; display:flex; flex-direction:column; position: relative; }
.automation-card:hover { box-shadow:0 6px 22px rgba(0,0,0,0.06); }
.automation-card--active { border-color:#5a3fc0; box-shadow:0 6px 24px rgba(90,63,192,0.12); }
.automation-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}
.automation-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.action-btn { color: #6b7280; }
.action-btn:hover { color: #111827; }
.automation-illustration { height: 110px; border-radius: 10px; background: linear-gradient(135deg, #f3f4ff, #eef2ff); display:flex; align-items:center; justify-content:center; }
.illustration-img { max-height: 90px; object-fit: contain; }
.automation-title { font-weight:600; font-size:14px; }
.automation-desc { font-size:12px; color:#636363; }
.automation-sub { font-size:11px; color:#8b8b8b; }
.count { color:#737373; font-size:14px; }
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}
</style>
