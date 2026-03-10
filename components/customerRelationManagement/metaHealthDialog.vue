<template>
  <v-dialog v-model="dialog" max-width="820">
    <v-card class="mh-card">

      <!-- Header -->
      <div class="mh-header">
        <div class="mh-header-left">
          <div class="mh-icon-wrap">
            <v-icon size="15" color="white">mdi-heart-pulse</v-icon>
          </div>
          <div>
            <div class="mh-title">Meta Health</div>
            <div class="mh-subtitle">Connection diagnostics</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" density="compact" @click="close">
          <v-icon size="17">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Body -->
      <div class="mh-body">

        <!-- Loading -->
        <div v-if="loading" class="mh-loading">
          <v-progress-circular indeterminate size="22" width="2" color="primary" />
          <span class="mh-loading-label">Checking connection…</span>
        </div>

        <!-- API Error -->
        <div v-else-if="data?.error" class="mh-api-error">
          <v-icon size="15" color="error">mdi-alert-circle</v-icon>
          {{ data.error }}
        </div>

        <template v-else>

          <!-- Status bar -->
          <div class="mh-status-bar" :class="`mh-status--${healthStatus.type}`">
            <v-icon size="15" :color="healthStatus.iconColor" class="flex-shrink-0">{{ healthStatus.icon }}</v-icon>
            <span class="mh-status-main">{{ healthStatus.text }}</span>
            <template v-if="healthIssues.length">
              <span class="mh-status-sep">·</span>
              <div class="mh-issue-tags">
                <span v-for="(issue, i) in healthIssues" :key="i" class="mh-issue-badge">{{ issue }}</span>
              </div>
            </template>
          </div>

          <!-- Stats strip -->
          <div class="mh-stats-strip">
            <div class="mh-stat">
              <span class="mh-stat-lbl">App ID</span>
              <span class="mh-stat-val mono">{{ data?.appId || '—' }}</span>
            </div>
            <div class="mh-stat-divider" />
            <div class="mh-stat">
              <span class="mh-stat-lbl">Verify Token</span>
              <span class="mh-stat-val" :style="{ color: data?.verifyTokenSet ? '#16a34a' : '#f97316' }">
                <v-icon size="12" style="margin-right: 2px; vertical-align: middle;"
                  :color="data?.verifyTokenSet ? '#16a34a' : '#f97316'">
                  {{ data?.verifyTokenSet ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                </v-icon>{{ data?.verifyTokenSet ? 'Set' : 'Missing' }}
              </span>
            </div>
            <div class="mh-stat-divider" />
            <div class="mh-stat">
              <span class="mh-stat-lbl">Active Pages</span>
              <span class="mh-stat-val">{{ allPages.length }}</span>
            </div>
          </div>

          <!-- Pages -->
          <div class="mh-section">
            <div class="mh-section-hd">
              <span class="mh-section-title">Active Pages</span>
              <span class="mh-section-count">{{ allPages.length }}</span>
            </div>

            <!-- Column labels -->
            <div class="mh-table-head">
              <div class="mhc-page">Page</div>
              <div class="mhc-status">Status</div>
              <div class="mhc-token">Token</div>
              <div class="mhc-webhook">Webhook</div>
              <div class="mhc-num">Leads</div>
              <div class="mhc-date">Last Lead</div>
            </div>

            <div class="mh-table-body">
              <div
                v-for="row in allPages"
                :key="row.pageId"
                class="mh-row"
                :class="{ 'mh-row--warn': rowHasIssue(row) }"
              >
                <!-- col 1: page -->
                <div class="mhc-page mh-page-cell">
                  <span class="mh-dot" :class="row.status === 'Active' ? 'mh-dot--ok' : 'mh-dot--warn'" />
                  <div class="mh-page-info">
                    <span class="mh-page-name">{{ row.pageName || row.pageId }}</span>
                    <span v-if="row.pageName && row.pageId" class="mh-page-id">{{ row.pageId }}</span>
                  </div>
                </div>

                <!-- col 2: status -->
                <div class="mhc-status">
                  <span class="mh-pill" :class="row.status === 'Active' ? 'mh-pill--green' : 'mh-pill--grey'">
                    {{ row.status || '—' }}
                  </span>
                </div>

                <!-- col 3: token -->
                <div class="mhc-token mh-center">
                  <v-icon size="16" :color="row.tokenPresent ? '#16a34a' : '#ef4444'">
                    {{ row.tokenPresent ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                </div>

                <!-- col 4: webhook/subscribed -->
                <div class="mhc-webhook mh-center">
                  <v-icon size="16" :color="row.subscribed ? '#16a34a' : '#ef4444'">
                    {{ row.subscribed ? 'mdi-check-circle' : 'mdi-close-circle' }}
                  </v-icon>
                </div>

                <!-- col 5: leads -->
                <div class="mhc-num mh-center mh-num-val">{{ row.leadCount || 0 }}</div>

                <!-- col 6: last lead -->
                <div class="mhc-date mh-date-val">{{ formatMetaLeadDate(row.lastLeadAt) }}</div>

                <!-- issue tag — row 2, spans all cols -->
                <div v-if="rowHasIssue(row)" class="mh-row-issue">
                  <v-icon size="11" color="#f97316">mdi-alert</v-icon>
                  {{ rowIssueText(row) }}
                </div>
              </div>

              <div v-if="!allPages.length" class="mh-empty">No active pages found.</div>
            </div>
          </div>

          <!-- Permissions (collapsible) -->
          <div
            v-if="(data?.permissions || []).length || data?.permissionsError"
            class="mh-section mh-section--last"
          >
            <button class="mh-section-hd mh-section-hd--btn" @click="showPerms = !showPerms">
              <span class="mh-section-title">Token Permissions</span>
              <v-icon size="15" class="mh-chevron" :class="{ 'mh-chevron--open': showPerms }">
                mdi-chevron-down
              </v-icon>
            </button>
            <div v-if="showPerms" class="mh-perms">
              <div v-if="data?.permissionsError" class="mh-perms-err">
                <v-icon size="13" color="warning">mdi-alert</v-icon>
                {{ data.permissionsError }}
              </div>
              <div v-else class="mh-perm-chips">
                <span
                  v-for="perm in data.permissions"
                  :key="perm?.permission || perm?.name || perm?.key || perm?.id || perm"
                  class="mh-perm"
                  :class="(perm?.status || '').toLowerCase() === 'granted' ? 'mh-perm--ok' : 'mh-perm--warn'"
                >
                  {{ perm?.permission || perm?.name || perm?.key || perm }}
                </span>
              </div>
            </div>
          </div>

        </template>
      </div>

      <!-- Footer -->
      <div class="mh-footer">
        <v-btn variant="text" size="small" @click="close">Close</v-btn>
      </div>

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

const showPerms = ref(false);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const close = () => emit('update:modelValue', false);

const allPages = computed(() => {
  const pages = Array.isArray(props.data?.pages) ? props.data.pages : [];
  return pages.filter((p) => String(p?.status || '').toLowerCase() === 'active');
});

const healthIssues = computed(() => {
  const issues = [];
  if (!props.data) return issues;
  if (!props.data.verifyTokenSet) issues.push('Verify token missing');
  if (props.data.permissionsError) issues.push('Permission error');
  const pages = allPages.value;
  const noToken = pages.filter((p) => !p.tokenPresent).length;
  const noSub = pages.filter((p) => !p.subscribed).length;
  if (noToken) issues.push(`${noToken} page${noToken > 1 ? 's' : ''} missing token`);
  if (noSub) issues.push(`${noSub} page${noSub > 1 ? 's' : ''} not subscribed`);
  return issues;
});

const healthStatus = computed(() => {
  if (!props.data) return { type: 'info', icon: 'mdi-information', iconColor: '#6b7280', text: 'No data' };
  if (healthIssues.value.length) {
    return {
      type: 'warn',
      icon: 'mdi-alert',
      iconColor: '#f59e0b',
      text: `${healthIssues.value.length} issue${healthIssues.value.length > 1 ? 's' : ''} detected`,
    };
  }
  return {
    type: 'ok',
    icon: 'mdi-check-circle',
    iconColor: '#16a34a',
    text: 'All pages healthy',
  };
});

const rowHasIssue = (row) => !row.tokenPresent || !row.subscribed || !!row.error;

const rowIssueText = (row) => {
  if (row.error) return row.error;
  if (!row.tokenPresent) return 'Access token missing — reconnect this page to receive leads';
  if (!row.subscribed) return 'Not subscribed to webhooks — new leads from this page will not arrive';
  return '';
};

const formatMetaLeadDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return '—';
  const now = Date.now();
  const diff = now - parsed.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return parsed.toLocaleDateString();
};
</script>

<style scoped lang="scss">
/* ── Card shell ──────────────────────────────────────── */
.mh-card {
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  background: #ffffff;
}

/* ── Header ──────────────────────────────────────────── */
.mh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
}

.mh-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mh-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #0061fb, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mh-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.mh-subtitle {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.2;
  margin-top: 1px;
}

/* ── Scrollable body ─────────────────────────────────── */
.mh-body {
  overflow-y: auto;
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Loading / API error ─────────────────────────────── */
.mh-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
}

.mh-loading-label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.5);
}

.mh-api-error {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.07);
  color: #b91c1c;
  font-size: 13px;
}

/* ── Status bar ──────────────────────────────────────── */
.mh-status-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-radius: 8px;
  flex-wrap: wrap;

  &.mh-status--ok {
    background: rgba(22, 163, 74, 0.07);
    border: 1px solid rgba(22, 163, 74, 0.2);
  }

  &.mh-status--warn {
    background: rgba(245, 158, 11, 0.07);
    border: 1px solid rgba(245, 158, 11, 0.2);
  }

  &.mh-status--info {
    background: rgba(99, 102, 241, 0.06);
    border: 1px solid rgba(99, 102, 241, 0.15);
  }
}

.mh-status-main {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.mh-status-sep {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.3);
}

.mh-issue-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mh-issue-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 20px;
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  font-weight: 500;
}

/* ── Stats strip ─────────────────────────────────────── */
.mh-stats-strip {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f8fafc;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 8px 14px;
}

.mh-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 14px;

  &:first-child { padding-left: 0; }
}

.mh-stat-divider {
  width: 1px;
  height: 28px;
  background: rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.mh-stat-lbl {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 500;
}

.mh-stat-val {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;

  &.mono {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 11px;
    letter-spacing: 0.02em;
  }
}

/* ── Section ─────────────────────────────────────────── */
.mh-section {
  border: 1px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  overflow: hidden;
}

.mh-section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &.mh-section-hd--btn {
    cursor: pointer;
    width: 100%;
    background: #f8fafc;
    border: none;
    text-align: left;

    &:hover { background: #f1f5f9; }
  }
}

.mh-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.mh-section-count {
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 7px;
  border-radius: 20px;
}

.mh-chevron {
  transition: transform 0.2s ease;
  color: rgba(0, 0, 0, 0.4) !important;

  &.mh-chevron--open { transform: rotate(180deg); }
}

/* ── Table grid ──────────────────────────────────────── */
/* Columns: page | status | token | webhook | leads | last lead */
.mh-table-head,
.mh-row {
  display: grid;
  grid-template-columns: 1fr 72px 58px 68px 52px 90px;
  align-items: center;
  gap: 0 6px;
  padding: 0 12px;
}

.mh-table-head {
  padding-top: 5px;
  padding-bottom: 5px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  > div {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(0, 0, 0, 0.4);
    white-space: nowrap;
  }
}

/* ── Column slot assignments ─────────────────────────── */
.mhc-page    { grid-column: 1; grid-row: 1; }
.mhc-status  { grid-column: 2; grid-row: 1; }
.mhc-token   { grid-column: 3; grid-row: 1; }
.mhc-webhook { grid-column: 4; grid-row: 1; }
.mhc-num     { grid-column: 5; grid-row: 1; }
.mhc-date    { grid-column: 6; grid-row: 1; }

/* issue tag spans all cols in row 2 */
.mh-row-issue {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0 5px 18px;
  font-size: 11px;
  color: #c2410c;
}

/* ── Page row ────────────────────────────────────────── */
.mh-table-body { max-height: 280px; overflow-y: auto; }

.mh-row {
  grid-template-rows: auto auto;
  padding-top: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.12s;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(0, 0, 0, 0.018); }

  &.mh-row--warn {
    background: rgba(245, 158, 11, 0.04);
    &:hover { background: rgba(245, 158, 11, 0.07); }
  }
}

.mh-page-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.mh-dot {
  width: 7px;
  height: 7px;
  min-width: 7px;
  border-radius: 50%;
  background: #cbd5e1;

  &.mh-dot--ok   { background: #16a34a; }
  &.mh-dot--warn { background: #f97316; }
}

.mh-page-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.mh-page-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mh-page-id {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.38);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mh-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mh-num-val {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.mh-date-val {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.mh-pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.02em;

  &.mh-pill--green {
    background: rgba(22, 163, 74, 0.1);
    color: #15803d;
  }

  &.mh-pill--grey {
    background: rgba(0, 0, 0, 0.07);
    color: rgba(0, 0, 0, 0.55);
  }
}

.mh-empty {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.4);
}

/* ── Permissions ─────────────────────────────────────── */
.mh-perms { padding: 10px 12px; }

.mh-perms-err {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #b45309;
}

.mh-perm-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.mh-perm {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  font-family: 'SFMono-Regular', Consolas, monospace;

  &.mh-perm--ok   { background: rgba(22, 163, 74, 0.09); color: #15803d; }
  &.mh-perm--warn { background: rgba(245, 158, 11, 0.1);  color: #92400e; }
}

/* ── Footer ──────────────────────────────────────────── */
.mh-footer {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.07);
  flex-shrink: 0;
}
</style>
