<template>
  <div class="legend">
    <div class="legend-title">Legend</div>
    <div class="legend-grid">
      <div
        v-for="[key, cond] in legendItems"
        :key="key"
        class="legend-item"
      >
        <span class="legend-dot" :style="{ background: cond.color }" />
        <span class="legend-label">{{ cond.label }}</span>
      </div>
    </div>
    <div class="legend-statuses">
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--planned" />
        <span class="legend-label">Planned</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--completed" />
        <span class="legend-label">Completed</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch legend-swatch--missing" />
        <span class="legend-label">Missing</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CONDITIONS } from './toothData.js'

const legendItems = computed(() =>
  Object.entries(CONDITIONS).filter(([, c]) => c.color !== '#9e9e9e')
)
</script>

<style scoped>
.legend {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 10px 12px;
}

.legend-title {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.legend-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
  margin-bottom: 8px;
}

.legend-statuses {
  display: flex;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #eee;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 11px;
  color: #555;
}

.legend-swatch {
  width: 16px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-swatch--planned {
  background: repeating-linear-gradient(
    45deg,
    rgba(30,136,229,0.3),
    rgba(30,136,229,0.3) 2px,
    #fff 2px,
    #fff 5px
  );
  border: 1px solid #1e88e5;
}

.legend-swatch--completed {
  background: #43a047bb;
  border: 1px solid #43a047;
}

.legend-swatch--missing {
  background: #fff;
  border: 1px solid #9e9e9e;
  position: relative;
  overflow: hidden;
}

.legend-swatch--missing::before,
.legend-swatch--missing::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #555;
}

.legend-swatch--missing::before {
  transform: rotate(35deg);
}

.legend-swatch--missing::after {
  transform: rotate(-35deg);
}
</style>
