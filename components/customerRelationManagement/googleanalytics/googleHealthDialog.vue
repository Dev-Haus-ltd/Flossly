<template>
  <v-dialog v-model="dialog" max-width="720">
    <v-card class="google-health-card">
      <v-card-title class="google-health-title">
        <div class="d-flex align-center">
          <v-icon size="18" class="mr-2">mdi-heart-pulse</v-icon>
          Google Health
          <span class="google-health-subtitle">Connection overview</span>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="google-health-body">
        <div v-if="loading" class="google-health-loading">
          <v-progress-circular indeterminate size="28" />
        </div>
        <template v-else>
          <v-alert v-if="data?.error" type="error" variant="tonal" class="mb-3">
            {{ data.error }}
          </v-alert>
          <template v-else-if="!data?.connected">
            <v-alert type="info" variant="tonal" class="mb-3">
              No Google account connected. Click "Connect Google" to get started.
            </v-alert>
          </template>
          <template v-else>
            <div class="google-health-top">
              <div class="google-health-score">
                <div class="score-title">Status</div>
                <div class="score-value">
                  <v-chip :color="data?.tokenValid ? 'success' : 'error'" label>
                    {{ data?.tokenValid ? 'Connected' : 'Expired' }}
                  </v-chip>
                </div>
                <div class="score-subtitle">{{ data?.email || 'Unknown account' }}</div>
              </div>
              <div class="google-health-summary">
                <div class="summary-card">
                  <div class="summary-label">Account Email</div>
                  <div class="summary-value">{{ data?.email || '—' }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Token Status</div>
                  <div class="summary-value">
                    <v-chip size="x-small" :color="data?.tokenValid ? 'success' : 'error'" label variant="tonal">
                      {{ data?.tokenValid ? 'Valid' : 'Expired' }}
                    </v-chip>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Connected At</div>
                  <div class="summary-value">{{ formatDate(data?.connectedAt) }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Token Expires</div>
                  <div class="summary-value">{{ formatDate(data?.expiresAt) }}</div>
                </div>
              </div>
            </div>

            <div class="google-health-scopes">
              <div class="scopes-title">Granted Scopes</div>
              <div class="scopes-list">
                <v-chip
                  v-for="scope in (data?.scopes || [])"
                  :key="scope"
                  size="small"
                  color="primary"
                  variant="tonal"
                  label
                  class="mr-2 mb-2"
                >
                  {{ formatScope(scope) }}
                </v-chip>
                <span v-if="!(data?.scopes || []).length" class="text-medium-emphasis">
                  No scopes granted
                </span>
              </div>
            </div>

            <div v-if="data?.selectedSite" class="google-health-site">
              <div class="site-title">Selected Site</div>
              <div class="site-info">
                <v-icon size="16" class="mr-2">mdi-web</v-icon>
                {{ data.selectedSite.siteUrl || data.selectedSite.url || '—' }}
              </div>
            </div>
          </template>
        </template>
      </v-card-text>
      <v-card-actions class="google-health-actions">
        <v-spacer />
        <v-btn variant="text" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  data: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const close = () => {
  emit('update:modelValue', false);
};

const formatDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '—';
  return parsed.toLocaleString();
};

const formatScope = (scope) => {
  if (!scope) return '—';
  // Extract readable name from scope URL
  if (scope.includes('webmasters')) return 'Search Console';
  if (scope.includes('business.manage')) return 'Business Profile';
  if (scope.includes('userinfo.email')) return 'Email';
  if (scope.includes('userinfo.profile')) return 'Profile';
  // Fallback: show last part of scope
  const parts = scope.split('/');
  return parts[parts.length - 1] || scope;
};
</script>

<style scoped lang="scss">
.google-health-card {
  border-radius: 16px;
  padding: 18px 20px 16px;
  background: linear-gradient(180deg, rgba(250, 250, 250, 0.9), rgba(255, 255, 255, 0.98));
}

.google-health-title {
  padding: 0;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 18px;
  gap: 12px;
}

.google-health-subtitle {
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
  color: rgba(0, 0, 0, 0.55);
}

.google-health-body {
  padding: 0;
}

.google-health-loading {
  padding: 40px 0;
  text-align: center;
}

.google-health-top {
  display: grid;
  grid-template-columns: minmax(160px, 200px) 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.google-health-score {
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(66, 133, 244, 0.12), rgba(66, 133, 244, 0.04));
  border: 1px solid rgba(66, 133, 244, 0.2);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.score-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.55);
}

.score-value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.score-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  word-break: break-all;
}

.google-health-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.9);
}

.summary-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 6px;
}

.summary-value {
  font-weight: 600;
  font-size: 13px;
  word-break: break-all;
}

.google-health-scopes {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  background: #fff;
}

.scopes-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 10px;
}

.scopes-list {
  display: flex;
  flex-wrap: wrap;
}

.google-health-site {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 14px;
  background: #fff;
}

.site-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}

.site-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
}

.google-health-actions {
  padding: 10px 0 0;
}

@media (max-width: 600px) {
  .google-health-top {
    grid-template-columns: 1fr;
  }
  .google-health-summary {
    grid-template-columns: 1fr;
  }
  .google-health-card {
    padding: 16px;
  }
}
</style>