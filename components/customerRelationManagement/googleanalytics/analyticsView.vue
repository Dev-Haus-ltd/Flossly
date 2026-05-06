<template>
  <div class="analytics-view">
    <template v-if="!loading">
      <v-alert v-if="error" type="error" variant="tonal" class="gsc-alert mb-5">{{ error }}</v-alert>

      <div v-if="!pages || pages.length === 0" class="analytics-empty">
        <div class="empty-icon-wrap">
          <v-icon size="26" color="grey-lighten-1">mdi-file-document-outline</v-icon>
        </div>
        <p class="empty-title">No pages found</p>
        <p class="empty-sub">Pages will appear here after your analytics sync completes.</p>
      </div>

      <template v-else>
        <div class="table-wrap">
          <table class="analytics-table">
            <thead>
              <tr>
                <th class="col-url">Page URL</th>
                <th class="col-metric">Impressions</th>
                <th class="col-metric">Clicks</th>
                <th class="col-metric">CTR</th>
                <th class="col-metric">Position</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(page, index) in pages"
                :key="page.id || page.pageUrl"
                class="table-row"
                :style="{ '--i': index }"
              >
                <td class="col-url">
                  <div class="url-cell">
                    <div class="url-icon-wrap">
                      <v-icon size="13">mdi-link-variant</v-icon>
                    </div>
                    <span class="url-text" :title="page.pageUrl">{{ formatUrl(page.pageUrl) }}</span>
                  </div>
                </td>
                <td class="col-metric">
                  <span class="metric-value">{{ formatNumber(page.analytics?.totalImpressions ?? 0) }}</span>
                </td>
                <td class="col-metric">
                  <span class="metric-value metric-clicks">{{ formatNumber(page.analytics?.totalClicks ?? 0) }}</span>
                </td>
                <td class="col-metric">
                  <span class="metric-value ctr-badge">{{ formatCtr(page.analytics?.avgCtr ?? 0) }}</span>
                </td>
                <td class="col-metric">
                  <span class="metric-value position-badge">{{ formatPosition(page.analytics?.avgPosition ?? 0) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pagination && pagination.totalPages > 1" class="analytics-pagination">
          <span class="pagination-info">
            <strong>{{ paginationStart }}–{{ paginationEnd }}</strong> of {{ pagination.totalCount.toLocaleString() }}
          </span>
          <v-pagination
            v-model="currentPage"
            :length="pagination.totalPages"
            :total-visible="5"
            density="comfortable"
            rounded="lg"
            @update:model-value="onPageChange"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  pages: { type: Array, default: () => [] },
  pagination: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits(['page-change']);
const currentPage = ref(props.pagination?.page || 1);
watch(() => props.pagination?.page, (p) => { if (p) currentPage.value = p; });

const paginationStart = computed(() => props.pagination ? ((props.pagination.page - 1) * props.pagination.limit) + 1 : 1);
const paginationEnd = computed(() => props.pagination ? Math.min(props.pagination.page * props.pagination.limit, props.pagination.totalCount) : props.pages.length);

const formatUrl = (url) => {
  if (!url) return '—';
  try { const u = new URL(url); return u.pathname + (u.search || ''); }
  catch { return url.length > 60 ? url.slice(0, 57) + '...' : url; }
};
const formatNumber = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : num.toLocaleString(); };
const formatCtr = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : (num * 100).toFixed(2) + '%'; };
const formatPosition = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : num.toFixed(1); };
const onPageChange = (page) => { emit('page-change', page); };
</script>

<style scoped lang="scss">
$accent:      #2563EB;
$accent-lt:   #EFF6FF;
$border:      rgba(0, 0, 0, 0.07);
$text-head:   #6b7280;
$text-main:   #111827;
$text-muted:  #9ca3af;
$radius:      14px;
$transition:  0.16s cubic-bezier(0.4, 0, 0.2, 1);

// ─── Root ─────────────────────────────────────────────────────
.analytics-view {
  padding: 0;
  font-family: 'DM Sans', 'Inter', sans-serif;
}

// ─── Empty ────────────────────────────────────────────────────
.analytics-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;
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
    color: $text-main;
    margin-bottom: 6px;
  }

  .empty-sub {
    font-size: 13px;
    color: $text-muted;
    max-width: 280px;
    line-height: 1.55;
  }
}

// ─── Table Wrap ───────────────────────────────────────────────
.table-wrap {
  border: 1px solid $border;
  border-radius: $radius;
  overflow: hidden;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 4px 16px rgba(0, 0, 0, 0.03);
  background: #fff;
  overflow-x: auto;
}

// ─── Table ────────────────────────────────────────────────────
.analytics-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  // ── Header ────────────────────────────────────────────────
  thead tr {
    background: #f9fafb;
    border-bottom: 1px solid $border;
  }

  th {
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: $text-head;
    white-space: nowrap;
    user-select: none;

    &.col-url   { text-align: left; width: 44%; }
    &.col-metric { text-align: right; width: 14%; }
  }

  // ── Body ──────────────────────────────────────────────────
  tbody tr {
    border-bottom: 1px solid $border;
    transition: background $transition;
    animation: rowIn 0.22s ease both;
    animation-delay: calc(var(--i, 0) * 0.035s);

    &:last-child { border-bottom: none; }
    &:hover { background: #f9fafb; }
  }

  td {
    padding: 13px 16px;
    font-size: 13px;
    color: $text-main;
    vertical-align: middle;

    &.col-url    { text-align: left; }
    &.col-metric { text-align: right; }
  }
}

// ─── URL Cell ─────────────────────────────────────────────────
.url-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.url-icon-wrap {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #f4f4f5;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;

  .table-row:hover & {
    background: $accent-lt;
    border-color: rgba(37, 99, 235, 0.15);
    color: $accent;
  }

  transition: background $transition, color $transition, border-color $transition;
}

.url-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  letter-spacing: -0.01em;
}

// ─── Metric Values ────────────────────────────────────────────
.metric-value {
  display: inline-block;
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #374151;
}

.metric-clicks {
  color: $accent;
  font-weight: 600;
}

.ctr-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #f0fdf4;
  color: #16a34a;
}

.position-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: #fafaf9;
  color: #78716c;
  border: 1px solid rgba(0,0,0,0.07);
}

// ─── Pagination ───────────────────────────────────────────────
.analytics-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  flex-wrap: wrap;
  gap: 12px;

  .pagination-info {
    font-size: 12.5px;
    color: $text-muted;

    strong {
      color: #374151;
      font-weight: 600;
    }
  }
}

// ─── Alert ────────────────────────────────────────────────────
.gsc-alert {
  border-radius: 10px !important;
  font-size: 13px;
}

// ─── Animations ───────────────────────────────────────────────
@keyframes rowIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>