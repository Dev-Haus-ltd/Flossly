<template>
  <div class="campaign-card">
    <div class="card-header">
      <div class="platform-badge">
        <img src="@/assets/crm/flossly-analytics.png" alt="Flossly Analytics" class="flossly-icon" />
      </div>
      <div class="meta-info">
        <div class="d-flex align-start">
          <img :src="platformIcon" :alt="platform" class="small-platform-icon" />
          <v-tooltip location="top" :text="title" max-width="360">
            <template #activator="{ props }">
              <span v-bind="props" class="campaign-title title-clamp">{{ title }}</span>
            </template>
          </v-tooltip>
        </div>
        <span class="campaign-date">{{ date }}</span>
      </div>
    </div>

    <div class="description-block">
      <v-tooltip location="top" :text="description" max-width="420">
        <template #activator="{ props }">
          <p
            v-bind="props"
            class="campaign-description"
            :class="{ 'description-clamp': !showFullDescription }"
          >
            {{ description }}
          </p>
        </template>
      </v-tooltip>
      <button
        v-if="showDescriptionToggle"
        type="button"
        class="see-more-btn"
        @click="showFullDescription = !showFullDescription"
      >
        {{ showFullDescription ? 'See less' : 'See more' }}
      </button>
    </div>

    <div class="campaign-preview">
      <img :src="previewImage" :alt="title" class="preview-image" />
      <div v-if="hasVideo" class="play-button-overlay">
        <img src="@/assets/crm/play.svg" alt="Play" class="play-button-svg" />
      </div>
    </div>

    <div class="campaign-stats">
      <div class="stat-item">
        <span class="stat-label">Cost</span>
        <span class="stat-value">{{ cost }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Impressions</span>
        <span class="stat-value">{{ impressions }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Link click</span>
        <span class="stat-value">{{ linkClicks }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Reach</span>
        <span class="stat-value">{{ reach }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Leads</span>
        <span class="stat-value">{{ leads }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Cost Per Lead</span>
        <span class="stat-value">{{ cpl }}</span>
      </div>
    </div>

    <v-btn
      v-if="leads > 0"
      color="primary"
      variant="flat"
      rounded="lg"
      size="small"
      class="view-leads-btn"
      :href="`/crm/leads?campaignId=${campaignId}`"
      target="_blank"
      append-icon="mdi-open-in-new"
    >
      View {{ leads }} Lead{{ leads === 1 ? '' : 's' }}
    </v-btn>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  platform: {
    type: String,
    required: true,
  },
  platformIcon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  previewImage: {
    type: String,
    required: true,
  },
  hasVideo: {
    type: Boolean,
    default: false,
  },
  cost: {
    type: String,
    required: true,
  },
  impressions: {
    type: [String, Number],
    required: true,
  },
  linkClicks: {
    type: [String, Number],
    required: true,
  },
  reach: {
    type: [String, Number],
    required: true,
  },
  leads: {
    type: [String, Number],
    default: 0,
  },
  cpl: {
    type: String,
    default: '—',
  },
  campaignId: {
    type: String,
    default: null,
  },
});

const showFullDescription = ref(false);
const showDescriptionToggle = computed(() => String(props.description || '').trim().length > 140);
</script>

<style scoped lang="scss">
.campaign-card {
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 24px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 0.3s ease;
  height: 100%;
  position: relative;
  background-clip: padding-box;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(43.6deg, #68ECE6 8.01%, #7D77FF 34.47%, #FF85DA 64.25%, #FFA977 90.72%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  &:hover {
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 72px;
}

.platform-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.flossly-icon {
  width: 48px;
  height: 48px;
  object-fit: cover;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.small-platform-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.campaign-title {
  font-family: Inter;
  font-weight: 700;
  font-style: normal;
  font-size: 14px;
  line-height: 150%;
  letter-spacing: 0%;
  color: hsla(0, 0%, 0%, 1);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.campaign-date {
  font-family: Inter;
  font-weight: 400;
  font-style: normal;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: 0%;
  color: hsla(0, 0%, 45%, 1);
}

.campaign-description {
  font-family: Inter;
  font-weight: 400;
  font-style: normal;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: 0%;
  color: hsla(0, 0%, 45%, 1);
  margin: 0;
  min-height: 72px;
}

.title-clamp {
  line-clamp: 3;
  -webkit-line-clamp: 3;
}

.description-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.description-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  overflow: hidden;
}

.see-more-btn {
  border: 0;
  background: transparent;
  padding: 0;
  color: #3f51b5;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.campaign-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button-svg {
  width: 56px;
  height: 56px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.campaign-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.view-leads-btn {
  width: 100%;
  text-transform: none;
  font-size: 13px;
  font-weight: 600;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-family: Inter;
  font-weight: 500;
  font-style: normal;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: 0%;
  color: hsla(0, 0%, 0%, 1);
}

.stat-value {
  font-family: Inter;
  font-weight: 500;
  font-style: normal;
  font-size: 12px;
  line-height: 150%;
  letter-spacing: 0%;
  color: hsla(0, 0%, 0%, 1);
}
</style>
