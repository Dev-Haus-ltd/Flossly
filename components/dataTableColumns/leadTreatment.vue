<template>
  <div class="pa-1 d-flex align-center" style="height: 100%;">
    <v-menu
      v-model="selected.treatmentMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <p v-bind="props" class="px-2" style="width: 100%;">
          {{ selected?.treatment?.name || 'N/A' }}
        </p>
      </template>

      <v-card width="250" class="pa-4" style="border-radius: 12px;">
        <v-list class="pa-0">
          <!-- List existing treatment sources -->
          <v-list-item
            v-for="(t, i) in treatmentSources"
            :key="i"
            style="margin-bottom: 6px; min-height: 30px; cursor: pointer"
            class="rounded-sm"
            @click="
              () => {
                selected.treatmentId = t.id;
                selected.treatment = t;
                selected.treatmentMenu = false;
                emit('update');
              }
            "
          >
            <v-list-item-title>{{ t.name }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <br />
        <v-divider class="mb-2"></v-divider>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
import { useOrganisationStore } from '@/stores/organisation'
import { onMounted, ref } from 'vue'

const organisationStore = useOrganisationStore()
const { selected, column } = defineProps(["selected", "column"])
const emit = defineEmits(["update"])

const treatmentSources = ref([])

onMounted(async () => {
  try {
    const res = await organisationStore.listTreatments()
    if (res?.code === 0) {
      treatmentSources.value = (res.data || []).map(r => ({
        id: r.id,
        name: r.name,
      }))
    }
  } catch (e) {
    console.error('Failed to load treatments', e)
  }
})
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  border-radius: 8px;
}
</style>
