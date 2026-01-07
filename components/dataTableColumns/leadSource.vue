<template>
    <div class="pa-1 d-flex align-center" style="height: 100%;">
      <v-menu
        v-model="selected.leadSourceMenu"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{ props }">
          <p v-bind="props" class="px-2" style="width: 100%;">
            {{ selected?.leadSource?.name  || 'N/A' }}
          </p>
        </template>
  
        <v-card width="250" class="pa-4" style="border-radius: 12px;">
          <v-list class="pa-0">
            <template v-if="!toggleEdit">
              <!-- List existing lead sources -->
              <v-list-item
                v-for="(s, i) in leadSources"
                :key="i"
                style="margin-bottom: 6px; min-height: 30px; cursor: pointer"
                class="rounded-sm"
                @click="
                  () => {
                    selected.leadSourceId = s.id;
                    selected.leadSource = s;
                    selected.leadSourceMenu = false;
                    emit('update');
                  }
                "
              >
                <v-list-item-title>{{ s.name }}</v-list-item-title>
              </v-list-item>
            </template>
  
            <template v-else>
              <!-- Editable mode -->
              <v-list-item v-for="(s, i) in leadSources" :key="i">
                <v-text-field
                  v-model="s.name"
                  density="compact"
                  variant="solo"
                  hide-details
                  class="w-100 input-bordered"
                  flat
                />
              </v-list-item>
  
              <!-- Add new lead source -->
              <v-list-item style="cursor: pointer">
                <v-btn
                  class="add-label-btn"
                  density="default"
                  variant="plain"
                  @click="addLeadSourceAndEdit"
                >
                  + New Lead Source
                </v-btn>
              </v-list-item>
            </template>
          </v-list>
  
          <br />
          <v-divider class="mb-2"></v-divider>
          <div class="pa-2 d-flex justify-center">
            <v-btn
              @click="toggleEdit = !toggleEdit"
              variant="flat"
              color="primary"
            >
              {{ toggleEdit ? "Apply" : "Edit Sources" }}
            </v-btn>
          </div>
        </v-card>
      </v-menu>
    </div>
  </template>
  
  <script setup>
  import crmService from '@/services/crmService'
  const { selected, column, leadSources } = defineProps([
    "selected",
    "column",
    "leadSources",
  ]);
  const emit = defineEmits(["update"]);

  const toggleEdit = ref(false);

  const addLeadSourceAndEdit = () => {
    if (!toggleEdit.value) {
      toggleEdit.value = true;
    }
    leadSources.push({
      id: Date.now(), // temp unique id
      name: "",
    });
  };

  watch(toggleEdit, async (val, old) => {
    // when toggling off (Apply), persist any new rows without real id
    if (old === true && val === false) {
      const toCreate = leadSources.filter(s => (!s.id || String(s.id).length > 10) && (s.name || '').trim().length)
      for (const s of toCreate) {
        try {
          const res = await crmService.addOption('lead_source', s.name)
          if (res?.code === 0) {
            s.id = res.data.id
          }
        } catch(e){}
      }
    }
  })
  </script>
  
  <style scoped>
  .add-label-btn {
    width: 100%;
    border: 1px solid #dfdfdf !important;
    min-height: 40px;
    border-radius: 8px;
  }
  .input-bordered :deep(.v-field) {
    border: 1px solid #dfdfdf !important;
    background-color: white !important;
    min-height: 40px;
    font-size: 14px;
    
    border-radius: 8px;
  }
  </style>
  
