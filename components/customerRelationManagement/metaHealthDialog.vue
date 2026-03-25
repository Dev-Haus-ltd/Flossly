<template>
  <v-dialog v-model="dialog" max-width="760" :content-class="'mh-dialog-wrapper'">
    <v-card class="mh-card">
      <!-- Header -->
      <div class="mh-header">
        <div class="mh-header__left">
          <div class="mh-icon-wrap">
            <v-icon size="15" color="#0061FB">mdi-heart-pulse</v-icon>
          </div>
          <div>
            <div class="mh-header__title">Meta Health</div>
            <div class="mh-header__sub">Connection overview</div>
          </div>
        </div>
        <v-btn icon variant="text" size="x-small" @click="close">
          <v-icon size="17">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="mh-body">
        <div v-if="loading" class="mh-loading">
          <v-progress-circular indeterminate size="22" color="#0061FB" />
        </div>
        <template v-else>
          <v-alert v-if="data?.error" type="error" variant="tonal" density="compact" class="mb-3">
            {{ data.error }}
          </v-alert>
          <template v-else>

            <!-- Stats bar -->
            <div class="mh-stats-bar">
              <div class="mh-stat">
                <div class="mh-stat__key">Pages</div>
                <div class="mh-stat__val mh-stat__val--big">{{ activePages.length || 0 }}</div>
              </div>
              <div class="mh-divider" />
              <div class="mh-stat">
                <div class="mh-stat__key">Status</div>
                <v-chip
                  size="x-small"
                  :color="activePages.length ? 'success' : 'warning'"
                  label variant="tonal"
                  class="mh-stat__chip"
                >
                  {{ activePages.length ? 'Connected' : 'Not Connected' }}
                </v-chip>
              </div>
              <div class="mh-divider" />
              <div class="mh-stat">
                <div class="mh-stat__key">Webhook Token</div>
                <v-chip
                  size="x-small"
                  :color="data?.verifyTokenSet ? 'success' : 'warning'"
                  label variant="tonal"
                  class="mh-stat__chip"
                >
                  {{ data?.verifyTokenSet ? 'Set' : 'Missing' }}
                </v-chip>
              </div>
              <div class="mh-divider" />
              <div class="mh-stat">
                <div class="mh-stat__key">App ID</div>
                <div class="mh-stat__val">{{ data?.appId || '—' }}</div>
              </div>
            </div>

            <!-- Pages list -->
            <div class="mh-pages">
              <div class="mh-pages__head">
                <span>Connected Meta Pages</span>
                <span class="mh-pages__hint">Lead activity &amp; connection health</span>
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
                      <th>Connected At</th>
                      <th>Leads</th>
                      <th>Last Lead</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in activePages" :key="row.pageId">
                      <td class="page-cell">
                        <span class="status-dot" :class="row.status === 'Active' ? 'ok' : 'warn'"></span>
                        <span class="page-name">{{ row.pageName || row.pageId }}</span>
                        <span v-if="row.pageName && row.pageId" class="page-id">- {{ row.pageId }}</span>
                      </td>
                      <td>
                        <v-chip size="x-small" color="primary" variant="tonal" label>
                          {{ row.status || '-' }}
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
                      <td class="text-nowrap">{{ formatMetaLeadDate(row.connectedAt) }}</td>
                      <td class="text-center">{{ row.leadCount || 0 }}</td>
                      <td class="text-nowrap">{{ formatMetaLeadDate(row.lastLeadAt) }}</td>
                      <td class="error-cell">{{ row.error || '-' }}</td>
                    </tr>
                    <tr v-if="!activePages.length">
                      <td colspan="9" class="text-center py-6 text-medium-emphasis">No pages found.</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </div>

          </template>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { formatDateOnly, parsedDate } from '~/lib/dateFormatter';

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

const close = () => emit('update:modelValue', false);

const activePages = computed(() => {
  const pages = Array.isArray(props.data?.pages) ? props.data.pages : [];
  return pages.filter((row) => String(row?.status || '').toLowerCase() === 'active');
});

const formatMetaLeadDate = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '-';
  return parsed.toLocaleString();
};
</script>

<style scoped lang="scss">
::v-deep(.mh-dialog-wrapper) {
  border-radius: 26px !important;
  overflow: hidden;
}

.mh-card {
  border-radius: 26px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 56px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

/* Header */
.mh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
  margin-bottom: 12px;
}

.mh-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mh-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(0, 97, 251, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mh-header__title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.mh-header__sub {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 1px;
}

/* Body */
.mh-body {
  padding: 0 16px 16px;
}

.mh-loading {
  padding: 32px 0;
  text-align: center;
}

/* Stats bar */
.mh-stats-bar {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  padding: 10px 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  row-gap: 10px;
}

.mh-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0 16px;
  flex: 1;
  min-width: 90px;
}

.mh-stat:first-child {
  padding-left: 0;
}

.mh-stat:last-child {
  padding-right: 0;
}

.mh-stat__val {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  line-height: 1;
  word-break: break-all;
}

.mh-stat__val--big {
  font-size: 22px;
}

.mh-stat__chip {
  align-self: flex-start;
}

.mh-stat__key {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.42);
  font-weight: 500;
  white-space: nowrap;
}

.mh-divider {
  width: 1px;
  height: 32px;
  background: rgba(15, 23, 42, 0.08);
  flex-shrink: 0;
}

/* Pages section */
.mh-pages {
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.mh-pages__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.mh-pages__hint {
  font-size: 10px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
}

/* Page row */
.mh-page-row {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  align-items: flex-start;
}

.mh-page-row--last {
  border-bottom: none;
}

.mh-page-row__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mh-page-row__name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mh-page-info-icon {
  color: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover {
    color: #0061FB;
  }
}

.mh-page-row__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.mh-page-row__error {
  border-radius: 8px;
  padding: 6px 8px;
  background: rgba(249, 115, 22, 0.08);
  color: rgba(124, 45, 18, 0.9);
  font-size: 11px;
  line-height: 1.4;
}

/* Right mini stats */
.mh-page-row__stats {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.mh-mini-stat {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 10px;
  padding: 7px 10px;
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
  text-align: center;
}

.mh-mini-stat__val {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}

.mh-mini-stat__val--date {
  cursor: default;
  text-decoration: underline dotted rgba(0, 0, 0, 0.25);
  text-underline-offset: 2px;
}

.mh-mini-stat__key {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.4);
}

.mh-pages__empty {
  padding: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

@media (max-width: 600px) {
  .mh-page-row {
    flex-direction: column;
  }
  .mh-page-row__stats {
    flex-wrap: wrap;
    width: 100%;
  }
  .mh-mini-stat {
    flex: 1;
  }
  .mh-divider {
    display: none;
  }
  .mh-stats-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 12px;
  }
  .mh-stat {
    padding: 0;
  }
}
</style>
