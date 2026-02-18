<template>
  <div class="site-selection">
    <div v-if="loading" class="site-selection-loading">
      <v-progress-circular indeterminate size="32" />
      <p class="mt-3 text-medium-emphasis">Loading sites...</p>
    </div>
    <template v-else>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
      <div v-if="!sites.length" class="site-selection-empty">
        <v-icon size="48" color="grey-lighten-1">mdi-web-off</v-icon>
        <p class="mt-3 text-medium-emphasis">No Google Search Console sites found.</p>
        <p class="text-caption text-medium-emphasis">Make sure you have verified sites in GSC.</p>
      </div>
      <template v-else>
        <div class="site-selection-header">
          <h3 class="text-subtitle-1 font-weight-medium">Select a Site</h3>
          <p class="text-caption text-medium-emphasis">Choose a GSC property to track.</p>
        </div>
        <div class="site-selection-list">
          <v-radio-group v-model="selectedSiteUrl" hide-details>
            <div v-for="site in sites" :key="site.siteUrl" class="site-item"
              :class="{ 'site-item--selected': selectedSiteUrl === site.siteUrl, 'site-item--disabled': !canSelectSite(site) }"
              @click="canSelectSite(site) && (selectedSiteUrl = site.siteUrl)">
              <v-radio :value="site.siteUrl" :disabled="!canSelectSite(site)" hide-details />
              <div class="site-item-content">
                <div class="site-item-url">
                  <v-icon size="16" class="mr-2">{{ site.siteUrl?.startsWith('sc-domain:') ? 'mdi-domain' : 'mdi-web' }}</v-icon>
                  {{ formatSiteUrl(site.siteUrl) }}
                </div>
                <div class="site-item-meta">
                  <v-chip size="x-small" :color="getPermissionColor(site.permissionLevel)" variant="tonal" label>
                    {{ site.permissionLevel || 'Unknown' }}
                  </v-chip>
                  <span v-if="!canSelectSite(site)" class="text-caption text-error ml-2">Insufficient permissions</span>
                </div>
              </div>
            </div>
          </v-radio-group>
        </div>
        <div class="site-selection-actions">
          <v-btn color="primary" variant="flat" rounded="lg" :disabled="!selectedSiteUrl" :loading="saving" @click="onContinue">
            Continue
          </v-btn>
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
const canSelectSite = (site) => ['siteOwner', 'siteFullUser', 'siteRestrictedUser'].includes(site.permissionLevel);
const getPermissionColor = (p) => p === 'siteOwner' ? 'success' : p === 'siteFullUser' ? 'primary' : p === 'siteRestrictedUser' ? 'warning' : 'grey';
const formatSiteUrl = (url) => url?.startsWith('sc-domain:') ? url.replace('sc-domain:', '') : (url || '—');
const onContinue = () => { if (selectedSiteUrl.value) emit('select', selectedSiteUrl.value); };
watch(() => props.sites, (s) => { if (s?.length === 1 && canSelectSite(s[0])) selectedSiteUrl.value = s[0].siteUrl; }, { immediate: true });
</script>

<style scoped lang="scss">
.site-selection { padding: 16px 0; }
.site-selection-loading, .site-selection-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; text-align: center; }
.site-selection-header { margin-bottom: 16px; }
.site-selection-list { border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; background: #fff; max-height: 320px; overflow-y: auto; }
.site-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); cursor: pointer; transition: background 0.15s; &:last-child { border-bottom: none; } &:hover:not(.site-item--disabled) { background: rgba(66,133,244,0.04); } &.site-item--selected { background: rgba(66,133,244,0.08); } &.site-item--disabled { opacity: 0.6; cursor: not-allowed; } }
.site-item-content { flex: 1; margin-left: 8px; }
.site-item-url { display: flex; align-items: center; font-weight: 500; font-size: 14px; margin-bottom: 4px; }
.site-item-meta { display: flex; align-items: center; }
.site-selection-actions { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>
