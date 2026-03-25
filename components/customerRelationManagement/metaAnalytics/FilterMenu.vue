<template>
  <v-menu
    v-model="filterMenu"
    :close-on-content-click="false"
    transition="fade-transition"
    offset-y
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="flat"
        density="compact"
        class="tbl-top-btn ml-2"
        style="width: 110px"
        :loading="loading"
      >
        <span>Filter</span>
        <img v-if="!loading" :src="filtericon" alt="filtericon" class="ml-2" width="14" height="14" />
        <v-badge
          v-if="activeFiltersCount > 0"
          :content="activeFiltersCount"
          color="primary"
          inline
          class="ml-1"
        />
      </v-btn>
    </template>

    <v-card style="min-width: 300px; border-radius: 12px; padding: 16px">
      <v-list class="pa-0">
        <div class="pa-0 d-flex align-center justify-space-between">
          <div style="font-weight: 500; font-size: 14px">Filters by</div>
          <v-btn
            variant="text"
            density="comfortable"
            color="primary"
            style="text-transform: none; font-weight: 500; font-size: 13px"
            @click="clearFilters"
          >
            Clear filters
          </v-btn>
        </div>

        <v-divider style="background-color: #dbdbdb" class="my-3" />

        <!-- Active filter chips -->
        <div
          v-if="activeFiltersCount > 0"
          class="mb-3 d-flex align-center flex-wrap"
          style="gap: 8px"
        >
          <v-chip
            v-if="selectedPlatform"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="selectedPlatform = null"
          >
            Platform: {{ selectedPlatform }}
          </v-chip>
          <v-chip
            v-if="dateFrom"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="dateFrom = null"
          >
            From: {{ formatDate(dateFrom) }}
          </v-chip>
          <v-chip
            v-if="dateTo"
            size="small"
            variant="tonal"
            color="primary"
            closable
            @click:close="dateTo = null"
          >
            To: {{ formatDate(dateTo) }}
          </v-chip>
        </div>

        <!-- Platform -->
        <v-label class="my-1" style="font-size: 14px">Platform</v-label>
        <v-select
          v-model="selectedPlatform"
          :items="platformOptions"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="input-bordered mb-3"
          clearable
          @click:clear="selectedPlatform = null"
        />

        <!-- Date From -->
        <v-label class="my-1" style="font-size: 14px">Date From</v-label>
        <v-menu
          v-model="dateFromMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="formattedDateFrom"
              v-bind="props"
              variant="solo"
              density="compact"
              class="mb-3 input-bordered"
              bg-color="white"
              flat
              readonly
              hide-details
              clearable
              @click:clear="dateFrom = null"
            >
              <template #append-inner>
                <v-icon class="cursor-pointer" @click.stop="dateFromMenu = true">
                  mdi-calendar
                </v-icon>
              </template>
            </v-text-field>
          </template>
          <v-date-picker v-model="dateFrom" @update:model-value="dateFromMenu = false" />
        </v-menu>

        <!-- Date To -->
        <v-label class="my-1" style="font-size: 14px">Date To</v-label>
        <v-menu
          v-model="dateToMenu"
          :close-on-content-click="false"
          transition="scale-transition"
          offset-y
          min-width="auto"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="formattedDateTo"
              v-bind="props"
              variant="solo"
              density="compact"
              class="input-bordered"
              bg-color="white"
              flat
              readonly
              hide-details
              clearable
              @click:clear="dateTo = null"
            >
              <template #append-inner>
                <v-icon class="cursor-pointer" @click.stop="dateToMenu = true">
                  mdi-calendar
                </v-icon>
              </template>
            </v-text-field>
          </template>
          <v-date-picker v-model="dateTo" @update:model-value="dateToMenu = false" />
        </v-menu>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import filtericon from '@/assets/icons/listView/filter-icon.svg';

defineProps({
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['update:filters']);

const filterMenu = ref(false);
const selectedPlatform = ref(null);
const dateFrom = ref(null);
const dateTo = ref(null);
const dateFromMenu = ref(false);
const dateToMenu = ref(false);

const platformOptions = ['Facebook', 'Instagram'];

const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formattedDateFrom = computed(() => formatDate(dateFrom.value));
const formattedDateTo = computed(() => formatDate(dateTo.value));

const activeFiltersCount = computed(() => {
  let c = 0;
  if (selectedPlatform.value) c++;
  if (dateFrom.value) c++;
  if (dateTo.value) c++;
  return c;
});

watch([selectedPlatform, dateFrom, dateTo], () => {
  emit('update:filters', {
    platform: selectedPlatform.value || null,
    dateFrom: dateFrom.value || null,
    dateTo: dateTo.value || null,
  });
});

const clearFilters = () => {
  selectedPlatform.value = null;
  dateFrom.value = null;
  dateTo.value = null;
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border-radius: 8px !important;
  min-height: 40px;
  font-size: 14px;
}

.tbl-top-btn {
  height: 46px;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6 !important;
  text-transform: none;
  box-shadow: none;
  color: #737373;
  margin-left: 16px !important;
  align-items: center;
}
</style>
