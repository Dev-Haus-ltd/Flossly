<!--
  Universal TruncatedText Component
  
  Usage:
  Basic:
  <CommonTruncatedText 
    :text="longTextString"
    :max-width="200"
    text-class="custom-class"
  />
  
  With custom slot (for links, etc):
  <CommonTruncatedText :text="linkText" :max-width="150">
    <template #default="{ truncatedText, style }">
      <a :href="url" :style="style">{{ truncatedText }}</a>
    </template>
  </CommonTruncatedText>
  
  Features:
  - Truncates text with ellipsis (...) when it exceeds maxWidth
  - Shows tooltip ONLY when text is actually truncated
  - Tooltip is hidden when full text is visible
  - Fully customizable styling via textClass prop or slot
  
  Props:
  - text: The text to display (String)
  - maxWidth: Maximum width in pixels or CSS string (Number|String, default: '200px')
  - textClass: CSS class for custom styling (String)
-->
<template>
  <v-tooltip 
    :disabled="!showTooltip" 
    location="top"
    :open-delay="100"
    content-class="truncated-text-tooltip"
  >
    <template v-slot:activator="{ props: tooltipProps }">
      <span 
        ref="textElement" 
        v-bind="tooltipProps"
        :style="truncatedStyle"
        :class="textClass"
      >
        <slot 
          :truncatedText="text"
          :style="truncatedStyle"
        >
          {{ text }}
        </slot>
      </span>
    </template>
    <template v-slot:default>
      <div class="tooltip-content">{{ text }}</div>
    </template>
  </v-tooltip>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: [String, Number],
    default: '200px',
  },
  textClass: {
    type: String,
    default: '',
  },
});

const textElement = ref(null);
// Always show tooltip for links
const showTooltip = ref(true);

const truncatedStyle = computed(() => ({
  maxWidth: typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'inline-block',
}));

// Simplified: Always show tooltip
// No need for overflow detection since we show tooltip for all links
</script>

<style scoped>
.truncated-text-tooltip {
  background: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  font-size: 12px !important;
  padding: 8px 12px !important;
  border-radius: 4px !important;
  max-width: 400px !important;
  word-break: break-all !important;
  z-index: 9999 !important;
}

.tooltip-content {
  max-width: 400px;
  word-break: break-all;
}
</style>
