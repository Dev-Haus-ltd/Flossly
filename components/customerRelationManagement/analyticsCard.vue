<template>
  <div class="campaign-card">
    <div v-if="statusConfig" class="status-chip" :style="{ color: statusConfig.color, background: statusConfig.bg }">
      <span class="status-dot" :style="{ background: statusConfig.color }"></span>
      {{ statusConfig.label }}
    </div>
    <div class="card-header">
      <div class="platform-badge">
        <img src="@/assets/crm/flossly-analytics.png" alt="Flossly Analytics" class="flossly-icon" />
      </div>
      <div class="meta-info">
        <div class="title-row">
          <img :src="platformIcon" :alt="platform" class="small-platform-icon" />
          <v-tooltip location="top" :text="title" max-width="360" open-on-click :open-on-hover="false">
            <template #activator="{ props: tipProps }">
              <span v-bind="tipProps" class="campaign-title title-clamp">{{ title }}</span>
            </template>
          </v-tooltip>
        </div>
        <span class="campaign-date">{{ date }}</span>
      </div>
    </div>

    <div class="description-block">
      <p class="campaign-description">{{ description }}</p>
      <v-tooltip
        v-if="showDescriptionToggle"
        location="top"
        :text="description"
        max-width="360"
        open-on-click
        :open-on-hover="false"
      >
        <template #activator="{ props: tipProps }">
          <button v-bind="tipProps" type="button" class="see-more-btn">Read more</button>
        </template>
      </v-tooltip>
    </div>

    <div class="campaign-preview">
      <!-- Video player — shown once source URL is fetched -->
      <video
        v-if="videoSrc"
        :src="videoSrc"
        class="preview-image"
        controls
        autoplay
        playsinline
        preload="metadata"
        @error="handleVideoPlaybackError"
        @ended="videoSrc = null"
      />
      <!-- Thumbnail + overlays -->
      <template v-else>
        <!-- Image: wrap in viewer for fullscreen zoom on click (non-video only) -->
        <viewer
          v-if="!hasVideo"
          :options="{ toolbar: false, navbar: false, title: false, movable: true, zoomable: true }"
          class="preview-viewer"
        >
          <img :src="resolvedPreviewImage" :alt="title" class="preview-image preview-image--clickable" @error="handleImageError" />
        </viewer>
        <img v-else :src="resolvedPreviewImage" :alt="title" class="preview-image" @error="handleImageError" />

        <div v-if="hasVideo && !videoSrc" class="play-button-overlay" @click="playVideo">
          <v-progress-circular v-if="videoLoading" indeterminate color="white" size="48" />
          <img v-else src="@/assets/crm/play.svg" alt="Play" class="play-button-svg" />
        </div>
        <div v-if="videoError" class="video-error-overlay">
          <span>{{ videoError }}</span>
        </div>
        <!-- Permalink overlay — shown when inline playback is unavailable -->
      </template>
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

    <div class="card-actions">
      <v-btn
        v-if="videoPermalink"
        variant="outlined"
        rounded="lg"
        size="small"
        class="view-leads-btn"
        :href="videoPermalink"
        target="_blank"
        rel="noopener noreferrer"
        append-icon="mdi-open-in-new"
      >
        Open Video Link
      </v-btn>
      <v-btn
        v-if="leads > 0 && viewLeadsHref"
        color="primary"
        variant="flat"
        rounded="lg"
        size="small"
        class="view-leads-btn"
        :href="viewLeadsHref"
        target="_blank"
        append-icon="mdi-open-in-new"
      >
        View {{ leads }} Lead{{ leads === 1 ? '' : 's' }}
      </v-btn>
      <v-btn
        v-if="drillLabel"
        variant="outlined"
        rounded="lg"
        size="small"
        class="view-leads-btn"
        append-icon="mdi-chevron-right"
        @click="emit('drill')"
      >
        {{ drillLabel }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import crmService from '@/services/crmService';
import previewFallback from '@/assets/crm/placeholder/reference-1.png';

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
  videoId: {
    type: String,
    default: null,
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
  adSetId: {
    type: String,
    default: null,
  },
  adId: {
    type: String,
    default: null,
  },
  drillLabel: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['drill']);

const statusConfig = computed(() => {
  const s = String(props.status || '').toUpperCase();
  if (s === 'ACTIVE') return { label: 'Active', color: '#16a34a', bg: '#dcfce7' };
  if (s === 'PAUSED') return { label: 'Paused', color: '#d97706', bg: '#fef3c7' };
  if (s === 'WITH_ISSUES') return { label: 'Issues', color: '#dc2626', bg: '#fee2e2' };
  if (s === 'ARCHIVED') return { label: 'Archived', color: '#6b7280', bg: '#f3f4f6' };
  if (s === 'DELETED') return { label: 'Deleted', color: '#6b7280', bg: '#f3f4f6' };
  if (s === 'IN_PROCESS') return { label: 'Processing', color: '#2563eb', bg: '#dbeafe' };
  return null;
});

const showDescriptionToggle = computed(() => String(props.description || '').trim().length > 120);

const viewLeadsHref = computed(() => {
  const name = encodeURIComponent(props.title || '');
  if (props.adId) return `/crm/leads?adId=${props.adId}&adName=${name}`;
  if (props.adSetId) return `/crm/leads?adSetId=${props.adSetId}&adSetName=${name}`;
  if (props.campaignId) return `/crm/leads?campaignId=${props.campaignId}&campaignName=${name}`;
  return null;
});

const imageLoadFailed = ref(false);
const resolvedPreviewImage = computed(() => {
  if (imageLoadFailed.value) return previewFallback;
  const raw = String(props.previewImage || '').trim();
  return raw || previewFallback;
});

watch(() => props.previewImage, () => {
  imageLoadFailed.value = false;
});

const videoSrc = ref(null);
const videoPermalink = ref(null);
const videoLoading = ref(false);
const videoError = ref(null);

const handleImageError = () => {
  imageLoadFailed.value = true;
};

const handleVideoPlaybackError = () => {
  videoSrc.value = null;
  videoError.value = 'Inline playback failed for this video.';
};

const playVideo = async () => {
  if (!props.videoId || videoLoading.value) return;
  if (videoSrc.value) { videoSrc.value = null; videoPermalink.value = null; return; }
  videoError.value = null;
  videoPermalink.value = null;
  videoLoading.value = true;
  try {
    const res = await crmService.getMetaVideoSource(props.videoId);
    if (res?.code === 0 && res.data?.source) {
      videoSrc.value = res.data.source;
    } else if (res?.code === 0 && res.data?.permalink) {
      videoPermalink.value = res.data.permalink;
      videoError.value = 'Direct playback is unavailable for this video.';
    } else {
      videoError.value = res?.error || res?.message || 'Video not available';
    }
  } catch (e) {
    videoError.value = e?.message || 'Failed to load video';
  } finally {
    videoLoading.value = false;
  }
};

watch(() => props.videoId, () => {
  videoSrc.value = null;
  videoPermalink.value = null;
  videoError.value = null;
});
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
  width: 100%;
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

.status-chip {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1.4;
  pointer-events: none;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-height: 72px;
  padding-right: 72px; /* prevent title overlapping status chip */
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
  min-width: 0;
}

.small-platform-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  margin-top: 2px;
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: flex-start;
  min-width: 0;
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
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
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
  /* Fixed height = 3 lines × 18px line-height */
  height: 54px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.title-clamp {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
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
  line-clamp: 3;
  -webkit-line-clamp: 3;
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

.preview-viewer {
  width: 100%;
  height: 100%;
  display: block;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-image--clickable {
  cursor: zoom-in;
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
  cursor: pointer;
  background: rgba(0, 0, 0, 0.15);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

.video-error-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 11px;
  padding: 6px 10px;
  text-align: center;
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

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
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

@media (max-width: 959px) {
  .campaign-card {
    padding: 18px;
    border-radius: 20px;
  }

  .card-header {
    min-height: unset;
    padding-right: 64px;
  }
}

@media (max-width: 600px) {
  .campaign-card {
    padding: 16px;
    gap: 14px;
  }

  .card-header {
    gap: 10px;
    padding-right: 0;
  }

  .status-chip {
    top: 12px;
    right: 12px;
  }

  .platform-badge,
  .flossly-icon {
    width: 44px;
    height: 44px;
  }

  .campaign-title {
    font-size: 13px;
    line-height: 1.45;
  }
}
</style>
