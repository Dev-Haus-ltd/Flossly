<template>
  <v-dialog v-model="dialog" max-width="980">
    <v-card class="meta-health-card">
      <v-card-title class="meta-health-title">
        <div class="d-flex align-center">
          <v-icon size="18" class="mr-2">mdi-heart-pulse</v-icon>
          Meta Health
          <span class="meta-health-subtitle">Connection overview</span>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text class="meta-health-body">
        <div v-if="loading" class="meta-health-loading">
          <v-progress-circular indeterminate size="28" />
        </div>
        <template v-else>
          <v-alert
            v-if="data?.error"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ data.error }}
          </v-alert>
          <template v-else>
            <div class="meta-health-top">
              <div class="meta-health-score">
                <div class="score-title">Overall</div>
                <div class="score-value">
                  {{ data?.activePages || 0 }}/{{ data?.totalPages || 0 }}
                </div>
                <div class="score-subtitle">Active pages</div>
              </div>
              <div class="meta-health-summary">
                <div class="summary-card">
                  <div class="summary-label">App ID</div>
                  <div class="summary-value">{{ data?.appId || '—' }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Verify Token</div>
                  <div class="summary-value">
                    <v-chip
                      size="x-small"
                      :color="data?.verifyTokenSet ? 'success' : 'warning'"
                      label
                      variant="tonal"
                    >
                      {{ data?.verifyTokenSet ? 'Set' : 'Missing' }}
                    </v-chip>
                  </div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Total Pages</div>
                  <div class="summary-value">{{ data?.totalPages || 0 }}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Active Pages</div>
                  <div class="summary-value">{{ data?.activePages || 0 }}</div>
                </div>
              </div>
            </div>

            <div class="meta-health-permissions">
              <div class="meta-health-table-head">
                <div class="table-title">Token Permissions</div>
                <div class="table-hint">Granted or declined permissions for this Meta connection</div>
              </div>
              <v-alert
                v-if="data?.permissionsError"
                type="warning"
                variant="tonal"
                class="mb-3"
              >
                {{ data.permissionsError }}
              </v-alert>
              <div v-else-if="(data?.permissions || []).length" class="permission-chips">
                <v-chip
                  v-for="perm in data.permissions"
                  :key="perm?.permission || perm?.name || perm?.key || perm?.id || perm"
                  size="x-small"
                  :color="(perm?.status || '').toLowerCase() === 'granted' ? 'success' : 'warning'"
                  label
                  variant="tonal"
                >
                  {{ perm?.permission || perm?.name || perm?.key || perm }}
                  <span v-if="perm?.status">: {{ perm.status }}</span>
                </v-chip>
              </div>
              <div v-else class="text-caption text-medium-emphasis">
                No permissions data available.
              </div>
            </div>

            <div class="meta-health-table-wrap">
              <div class="meta-health-table-head">
                <div class="table-title">Pages</div>
                <div class="table-hint">Status, subscriptions, and lead activity</div>
              </div>
              <div class="meta-health-table-scroll">
                <v-table density="compact" class="meta-health-table">
                  <thead>
                    <tr>
                      <th>Page</th>
                      <th>Status</th>
                      <th>Token</th>
                      <th>Subscribed</th>
                      <th>App Match</th>
                      <th>Leads</th>
                      <th>Last Lead</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in (data?.pages || [])" :key="row.pageId">
                      <td class="page-cell">
                        <span class="status-dot" :class="row.status === 'Active' ? 'ok' : 'warn'"></span>
                        <span class="page-name">{{ row.pageName || row.pageId }}</span>
                        <span v-if="row.pageName && row.pageId" class="page-id">· {{ row.pageId }}</span>
                      </td>
                      <td>
                        <v-chip size="x-small" color="primary" variant="tonal" label>
                          {{ row.status || '—' }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip size="x-small" :color="row.tokenPresent ? 'success' : 'error'" variant="tonal" label>
                          {{ row.tokenPresent ? 'Yes' : 'No' }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip size="x-small" :color="row.subscribed ? 'success' : 'error'" variant="tonal" label>
                          {{ row.subscribed ? 'Yes' : 'No' }}
                        </v-chip>
                      </td>
                      <td>
                        <v-chip size="x-small" :color="row.appMatched ? 'success' : 'error'" variant="tonal" label>
                          {{ row.appMatched ? 'Yes' : 'No' }}
                        </v-chip>
                      </td>
                      <td class="text-center">{{ row.leadCount || 0 }}</td>
                      <td class="text-nowrap">{{ formatMetaLeadDate(row.lastLeadAt) }}</td>
                      <td class="error-cell">{{ row.error || '—' }}</td>
                    </tr>
                    <tr v-if="!(data?.pages || []).length">
                      <td colspan="8" class="text-center py-6 text-medium-emphasis">No pages found.</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </div>
          </template>
        </template>
      </v-card-text>
      <v-card-actions class="meta-health-actions">
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

const formatMetaLeadDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '—';
  return parsed.toLocaleString();
};
</script>

<style scoped lang="scss">
.meta-health-card {
  border-radius: 16px;
  padding: 18px 20px 16px;
  background: linear-gradient(180deg, rgba(250, 250, 250, 0.9), rgba(255, 255, 255, 0.98));
}

.meta-health-title {
  padding: 0;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 18px;
  gap: 12px;
}

.meta-health-subtitle {
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
  color: rgba(0, 0, 0, 0.55);
}

.meta-health-body {
  padding: 0;
}

.meta-health-loading {
  padding: 40px 0;
  text-align: center;
}

.meta-health-top {
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.meta-health-score {
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 97, 251, 0.12), rgba(0, 97, 251, 0.04));
  border: 1px solid rgba(0, 97, 251, 0.2);
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
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.score-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.meta-health-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
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
  font-size: 14px;
}

.meta-health-table-wrap {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.meta-health-permissions {
  margin-bottom: 16px;
}

.permission-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-health-table-head {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.table-title {
  font-weight: 600;
  font-size: 14px;
}

.table-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}

.meta-health-table-scroll {
  max-height: 320px;
  overflow: auto;
}

.meta-health-table :deep(thead th) {
  background: #f6f6f6;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.65);
  position: sticky;
  top: 0;
  z-index: 1;
}

.meta-health-table :deep(tbody tr:nth-child(odd)) {
  background: rgba(0, 0, 0, 0.015);
}

.meta-health-table :deep(tbody td) {
  font-size: 13px;
  padding: 10px 12px;
  vertical-align: middle;
  white-space: nowrap;
}

.page-cell {
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-cell .page-name {
  font-weight: 600;
  font-size: 13px;
}

.page-cell .page-id {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: #cbd5e1;
}

.status-dot.ok {
  background: #16a34a;
}

.status-dot.warn {
  background: #f97316;
}

.error-cell {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.65);
}

.meta-health-actions {
  padding: 10px 0 0;
}

@media (max-width: 960px) {
  .meta-health-top {
    grid-template-columns: 1fr;
  }
  .meta-health-summary {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 600px) {
  .meta-health-summary {
    grid-template-columns: 1fr;
  }
  .meta-health-card {
    padding: 16px;
  }
}
</style>
