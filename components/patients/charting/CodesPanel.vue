<template>
  <div class="codes-panel">

    <!-- Header row: filter dropdown -->
    <div class="codes-panel__header">
      <span class="codes-panel__title">Treatment Codes</span>
      <v-select
        v-model="selectedCategory"
        :items="categoryOptions"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 100px; min-width: 80px;"
      />
    </div>

    <!-- Search -->
    <div class="codes-panel__search">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search codes..."
        density="compact"
        variant="outlined"
        hide-details
        prepend-inner-icon="mdi-magnify"
        clearable
      />
    </div>

    <!-- Codes list -->
    <div class="codes-panel__list">
      <div
        v-for="(code, idx) in filteredCodes"
        :key="code.id"
        class="code-item"
        :class="{
          'code-item--active': activeCodeId === code.id,
          'code-item--first': idx === 0 && !searchQuery && selectedCategory === 'All',
        }"
        @click="onCodeClick(code)"
      >
        <v-icon
          size="16"
          class="code-item__star"
          :color="favoriteCodeIds.includes(code.id) ? 'amber-darken-2' : 'grey-lighten-1'"
          @click.stop="toggleFavorite(code.id)"
        >{{ favoriteCodeIds.includes(code.id) ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
        <span
          class="code-item__code"
          :class="{
            'code-item__code--active': activeCodeId === code.id,
            'code-item__code--first': idx === 0 && !searchQuery && selectedCategory === 'All',
          }"
        >{{ code.code }}</span>
        <span
          class="code-item__name"
          :class="{
            'code-item__name--active': activeCodeId === code.id,
            'code-item__name--first': idx === 0 && !searchQuery && selectedCategory === 'All',
          }"
        >{{ code.name }}</span>
      </div>

      <div v-if="filteredCodes.length === 0" class="codes-panel__empty">
        No codes found
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  activeCodeId: { type: [Number, String], default: null },
  favoriteCodeIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['code-select', 'toggle-favorite'])

const searchQuery = ref('')
const selectedCategory = ref('All')

const categoryOptions = ['All', 'Restorations', 'Prosthetics', 'Endodontics', 'Implantology', 'Surgical', 'Preventive', 'Other']

const CODES = [
  { id: 1,  code: '0000',  name: 'Digital Planning',    conditionKey: 'crown',            category: 'Prosthetics' },
  { id: 2,  code: '0001',  name: 'Spark Moderate',      conditionKey: null,               category: 'Other' },
  { id: 3,  code: '011',   name: 'SCAN',                conditionKey: null,               category: 'Other' },
  { id: 4,  code: '012',   name: 'SCAN',                conditionKey: null,               category: 'Other' },
  { id: 5,  code: '00022', name: 'Crown Fit',           conditionKey: 'crown',            category: 'Prosthetics' },
  { id: 6,  code: '00000', name: 'Smile Trail',         conditionKey: null,               category: 'Other' },
  { id: 7,  code: '0007',  name: 'Direct Access',       conditionKey: null,               category: 'Surgical' },
  { id: 8,  code: '001',   name: 'FTA Clinician',       conditionKey: null,               category: 'Other' },
  { id: 9,  code: '006',   name: 'Whitening Trays',     conditionKey: null,               category: 'Preventive' },
  { id: 10, code: '002',   name: 'Composite Filling',   conditionKey: 'composite',        category: 'Restorations' },
  { id: 11, code: '003',   name: 'Extraction',          conditionKey: 'extraction-planned', category: 'Surgical' },
  { id: 12, code: '004',   name: 'Root Canal',          conditionKey: 'rct',              category: 'Endodontics' },
  { id: 13, code: '005',   name: 'Scale & Polish',      conditionKey: null,               category: 'Preventive' },
  { id: 14, code: '007',   name: 'Metal Crown',         conditionKey: 'crown',            category: 'Prosthetics' },
  { id: 15, code: '008',   name: 'Zirconia Crown',      conditionKey: 'crown-zirconia',   category: 'Prosthetics' },
  { id: 16, code: '009',   name: 'Veneer',              conditionKey: 'veneer',           category: 'Prosthetics' },
  { id: 17, code: '010',   name: 'Implant',             conditionKey: 'implant',          category: 'Implantology' },
  { id: 18, code: '013',   name: 'Amalgam Filling',     conditionKey: 'amalgam',          category: 'Restorations' },
  { id: 19, code: '014',   name: 'Cavity',              conditionKey: 'caries',           category: 'Restorations' },
  { id: 20, code: '015',   name: 'Missing Tooth',       conditionKey: 'missing',          category: 'Surgical' },
]

const filteredCodes = computed(() => {
  let list = CODES
  if (selectedCategory.value !== 'All') {
    list = list.filter(c => c.category === selectedCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    )
  }
  return list.slice().sort((a, b) => {
    const aFav = props.favoriteCodeIds.includes(a.id) ? 1 : 0
    const bFav = props.favoriteCodeIds.includes(b.id) ? 1 : 0
    return bFav - aFav
  })
})

function onCodeClick(code) {
  emit('code-select', code.id, code.conditionKey)
}
function toggleFavorite(codeId) {
  emit('toggle-favorite', codeId)
}
</script>

<style scoped>
.codes-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  max-height: 600px;
}

/* ── Header ─────────────────────────────────────────────────────── */
.codes-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  gap: 8px;
  border-bottom: 1px solid #f2f2f2;
  flex-shrink: 0;
}

.codes-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: #222;
  white-space: nowrap;
}

/* ── Search ─────────────────────────────────────────────────────── */
.codes-panel__search {
  padding: 8px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid #f2f2f2;
}

/* ── List ───────────────────────────────────────────────────────── */
.codes-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* ── Item ───────────────────────────────────────────────────────── */
.code-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #fafafa;
}

.code-item:hover {
  background: #f5f8ff;
}

.code-item--active {
  background: #f0f6ff;
}

.code-item__star {
  flex-shrink: 0;
  opacity: 0.5;
}

.code-item:hover .code-item__star,
.code-item--active .code-item__star {
  opacity: 1;
  color: #0061FB !important;
}

.code-item__code {
  font-size: 11px;
  color: #9e9e9e;
  min-width: 44px;
  flex-shrink: 0;
}

.code-item__code--first,
.code-item__code--active {
  color: #0061FB;
}

.code-item__name {
  font-size: 13px;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.code-item__name--first,
.code-item__name--active {
  font-weight: 600;
  color: #0061FB;
}

/* ── Empty ──────────────────────────────────────────────────────── */
.codes-panel__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 13px;
  color: #bbb;
}
</style>
