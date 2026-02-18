<template>
  <div class="analytics-view">
    <div v-if="loading" class="analytics-loading">
      <v-progress-circular indeterminate size="32" />
      <p class="mt-3 text-medium-emphasis">Loading pages...</p>
    </div>
    <template v-else>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
      <div v-if="!pages || pages.length === 0" class="analytics-empty">
        <v-icon size="48" color="grey-lighten-1">mdi-file-document-outline</v-icon>
        <p class="mt-3 text-medium-emphasis">No pages found for this site.</p>
        <p class="text-caption text-medium-emphasis">Pages will appear after analytics sync.</p>
      </div>
      <template v-else>
        <v-table class="analytics-table" density="comfortable">
          <thead>
            <tr>
              <th class="text-left">Page URL</th>
              <th class="text-right">Impressions</th>
              <th class="text-right">Clicks</th>
              <th class="text-right">CTR</th>
              <th class="text-right">Position</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="page in pages" :key="page.id || page.pageUrl">
              <td class="page-url-cell">
                <div class="page-url-content">
                  <v-icon size="14" class="mr-2" color="grey">mdi-link-variant</v-icon>
                  <span class="page-url-text" :title="page.pageUrl">{{ formatUrl(page.pageUrl) }}</span>
                </div>
              </td>
              <td class="text-right">
                {{ formatNumber(page.analytics?.totalImpressions ?? 0) }}
              </td>
              <td class="text-right">
                {{ formatNumber(page.analytics?.totalClicks ?? 0) }}
              </td>
              <td class="text-right">
                {{ formatCtr(page.analytics?.avgCtr ?? 0) }}
              </td>
              <td class="text-right">
                {{ formatPosition(page.analytics?.avgPosition ?? 0) }}
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-if="pagination && pagination.totalPages > 1" class="analytics-pagination">
          <v-pagination v-model="currentPage" :length="pagination.totalPages" :total-visible="5" density="comfortable" rounded="lg" @update:model-value="onPageChange" />
          <span class="pagination-info">Showing {{ paginationStart }}-{{ paginationEnd }} of {{ pagination.totalCount  }}</span>
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
const formatUrl = (url) => { if (!url) return '—'; try { const u = new URL(url); return u.pathname + (u.search || ''); } catch { return url.length > 60 ? url.slice(0, 57) + '...' : url; } };
const formatNumber = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : num.toLocaleString(); };
const formatCtr = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : (num * 100).toFixed(2) + '%'; };
const formatPosition = (val) => { if (val == null) return '—'; const num = Number(val); return Number.isNaN(num) ? '—' : num.toFixed(1); };
const onPageChange = (page) => { emit('page-change', page); };
</script>

<style scoped lang="scss">
.analytics-view { padding: 0; }
.analytics-loading, .analytics-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 0; text-align: center; }
.analytics-table { width: 100%; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; background: #fff; }
.analytics-table th { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(0,0,0,0.6); background: #fafafa; }
.analytics-table td { font-size: 13px; }
.page-url-cell { max-width: 400px; }
.page-url-content { display: flex; align-items: center; }
.page-url-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.analytics-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
.pagination-info { font-size: 12px; color: rgba(0,0,0,0.55); }
</style>