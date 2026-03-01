<template>
  <div class="site-selection">
    <template v-if="!loading">
      <v-alert v-if="error" type="error" variant="tonal" class="gsc-alert mb-5">{{ error }}</v-alert>

      <div v-if="!sites.length" class="site-selection-empty">
        <div class="empty-icon-wrap">
          <v-icon size="28" color="grey-lighten-1">mdi-web-off</v-icon>
        </div>
        <p class="empty-title">No sites found</p>
        <p class="empty-sub">Make sure you have verified properties in Google Search Console.</p>
      </div>

      <template v-else>
        <div class="site-selection-header">
          <p class="header-label">GSC Property</p>
          <h3 class="header-title">Select a site to track</h3>
        </div>

        <div class="site-selection-list">
          <div
            v-for="(site, index) in sites"
            :key="site.siteUrl"
            class="site-item"
            :class="{
              'site-item--selected': selectedSiteUrl === site.siteUrl,
              'site-item--disabled': !canSelectSite(site),
            }"
            :style="{ '--i': index }"
            @click="canSelectSite(site) && (selectedSiteUrl = site.siteUrl)"
          >
            <div class="site-item-radio">
              <div class="radio-outer">
                <div class="radio-inner" :class="{ visible: selectedSiteUrl === site.siteUrl }" />
              </div>
            </div>

            <div class="site-icon-wrap">
              <v-icon size="15" class="site-icon">
                {{ site.siteUrl?.startsWith('sc-domain:') ? 'mdi-domain' : 'mdi-web' }}
              </v-icon>
            </div>

            <div class="site-item-content">
              <span class="site-item-url">{{ formatSiteUrl(site.siteUrl) }}</span>
              <div class="site-item-meta">
                <span class="perm-badge" :class="getPermissionClass(site.permissionLevel)">
                  {{ formatPermission(site.permissionLevel) }}
                </span>
                <span v-if="!canSelectSite(site)" class="insufficient-label">Insufficient permissions</span>
              </div>
            </div>

            <div v-if="selectedSiteUrl === site.siteUrl" class="site-item-check">
              <v-icon size="16" color="white">mdi-check</v-icon>
            </div>
          </div>
        </div>

        <div class="site-selection-actions">
          <span class="selection-hint" v-if="selectedSiteUrl">
            <v-icon size="13" class="mr-1" style="opacity:.6">mdi-check-circle-outline</v-icon>
            {{ formatSiteUrl(selectedSiteUrl) }}
          </span>
          <button
            class="continue-btn"
            :class="{ 'continue-btn--active': !!selectedSiteUrl }"
            :disabled="!selectedSiteUrl"
            @click="onContinue"
          >
            Continue
            <v-icon size="16" class="btn-arrow">mdi-arrow-right</v-icon>
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  sites: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(['select']);
const selectedSiteUrl = ref('');

const canSelectSite = (site) =>
  ['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(site.permissionLevel);

const getPermissionClass = (p) => ({
  'perm--owner': p === 'siteOwner',
  'perm--full': p === 'siteFullUser',
  'perm--restricted': p === 'siteRestrictedUser',
  'perm--none': !['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(p),
});

const formatPermission = (p) => {
  const map = { siteOwner: 'Owner', siteFullUser: 'Full Access', siteRestrictedUser: 'Restricted' };
  return map[p] || 'No Access';
};

const formatSiteUrl = (url) =>
  url?.startsWith('sc-domain:') ? url.replace('sc-domain:', '') : url || '—';

const onContinue = () => { if (selectedSiteUrl.value) emit('select', selectedSiteUrl.value); };

watch(
  () => props.sites,
  (s) => { if (s?.length === 1 && canSelectSite(s[0])) selectedSiteUrl.value = s[0].siteUrl; },
  { immediate: true }
);
</script>

<style scoped lang="scss">
// ─── Tokens ───────────────────────────────────────────────────
$accent:     #2563EB;
$accent-lt:  #EFF6FF;
$radius-card: 14px;
$radius-item: 10px;
$border:      rgba(0, 0, 0, 0.08);
$border-sel:  rgba(37, 99, 235, 0.25);
$transition:  0.18s cubic-bezier(0.4, 0, 0.2, 1);

// ─── Root ─────────────────────────────────────────────────────
.site-selection {
  padding: 4px 0 8px;
  font-family: 'DM Sans', 'Inter', sans-serif;
}

// ─── Empty ────────────────────────────────────────────────────
.site-selection-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;

  .empty-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  .empty-sub {
    font-size: 13px;
    color: #8a8a8a;
    max-width: 280px;
    line-height: 1.55;
  }
}

// ─── Header ───────────────────────────────────────────────────
.site-selection-header {
  margin-bottom: 18px;

  .header-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 4px;
  }

  .header-title {
    font-size: 17px;
    font-weight: 650;
    color: #111827;
    letter-spacing: -0.02em;
  }
}

// ─── List ─────────────────────────────────────────────────────
.site-selection-list {
  border: 1px solid $border;
  border-radius: $radius-card;
  overflow: hidden;
  background: #ffffff;
  max-height: 340px;
  overflow-y: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
}

// ─── Item ─────────────────────────────────────────────────────
.site-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid $border;
  cursor: pointer;
  transition: background $transition;
  position: relative;
  animation: fadeSlideIn 0.25s ease both;
  animation-delay: calc(var(--i, 0) * 0.05s);

  &:last-child { border-bottom: none; }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity $transition;
  }

  &:hover:not(.site-item--disabled) {
    background: #fafafa;
  }

  &.site-item--selected {
    background: $accent-lt;
    border-color: $border-sel;

    &::before { opacity: 1; }

    .site-item-url { color: $accent; }
    .site-icon { color: $accent !important; }
    .site-icon-wrap { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.15); }
  }

  &.site-item--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ─── Custom Radio ─────────────────────────────────────────────
.site-item-radio {
  flex-shrink: 0;

  .radio-outer {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color $transition;

    .site-item--selected & { border-color: $accent; }
  }

  .radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $accent;
    transform: scale(0);
    transition: transform $transition;

    &.visible { transform: scale(1); }
  }
}

// ─── Site Icon ────────────────────────────────────────────────
.site-icon-wrap {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #f4f4f5;
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background $transition, border-color $transition;

  .site-icon { color: #6b7280; transition: color $transition; }
}

// ─── Content ──────────────────────────────────────────────────
.site-item-content {
  flex: 1;
  min-width: 0;
}

.site-item-url {
  display: block;
  font-size: 13.5px;
  font-weight: 580;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color $transition;
  letter-spacing: -0.01em;
}

.site-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

// ─── Permission Badge ─────────────────────────────────────────
.perm-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 2px 7px;
  border-radius: 5px;

  &.perm--owner      { background: #dcfce7; color: #15803d; }
  &.perm--full       { background: $accent-lt; color: $accent; }
  &.perm--restricted { background: #fff7ed; color: #c2410c; }
  &.perm--none       { background: #f4f4f5; color: #9ca3af; }
}

.insufficient-label {
  font-size: 11px;
  color: #ef4444;
}

// ─── Check Mark ───────────────────────────────────────────────
.site-item-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $accent;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  box-shadow: 0 2px 8px rgba(37,99,235,0.35);
}

// ─── Actions ──────────────────────────────────────────────────
.site-selection-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  gap: 12px;
}

.selection-hint {
  display: flex;
  align-items: center;
  font-size: 12.5px;
  color: #6b7280;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.continue-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  border: none;
  cursor: pointer;
  transition: all $transition;
  white-space: nowrap;
  flex-shrink: 0;

  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;

  &--active {
    background: $accent;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(37,99,235,0.28);

    &:hover {
      background: darken(#2563EB, 5%);
      box-shadow: 0 4px 18px rgba(37,99,235,0.38);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 6px rgba(37,99,235,0.2);
    }

    .btn-arrow { transition: transform $transition; }
    &:hover .btn-arrow { transform: translateX(3px); }
  }
}

// ─── Alert ────────────────────────────────────────────────────
.gsc-alert { border-radius: $radius-item !important; font-size: 13px; }

// ─── Animations ───────────────────────────────────────────────
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
</style>