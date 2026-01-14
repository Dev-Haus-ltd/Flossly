<template>
  <div style="border: 1px solid #dbdbdb; border-radius: 6px">
    <!-- Header -->
    <div
      style="border-bottom: 1px solid #dbdbdb"
      class="d-flex align-center justify-space-between px-4 py-2"
    >
      <h3
        style="
          
          font-weight: 600;
          font-size: 14px;
          margin: 0;
        "
      >
        Folders
      </h3>
      <div class="d-flex align-center gap-3">
        <!-- Search -->
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search folders"
          hide-details
          variant="solo"
          class="input-bordered"
          flat
          append-inner-icon="mdi-magnify"
        />
        <!-- Add Folder Button -->
        <v-btn class="py-2 ml-2" color="primary" flat @click="$emit('add-folder')" v-if="!hideAddFolderButton">
          <v-icon start>mdi-plus</v-icon>
          Add Folder
        </v-btn>
      </div>
    </div>

    <!-- Grid -->
    <v-row class="pa-4">
      <v-col
        v-for="(folder, index) in visibleFolders"
        :key="index"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          class="pa-3 d-flex align-center rounded-lg"
          style="border: 1px solid #dbdbdb; cursor: pointer"
          @click="$emit('open-folder', folder)"
          flat
        >
          <!-- Folder Image -->
          <img
            src="@/assets/images/flosslydocs/folder.svg" 
            style="height: 50px; width: 50px"
            class="mr-3"
          />

          <!-- Folder Details -->
          <div>
            <div
              style="
                
                font-weight: 400;
                font-size: 13px;
                font-style: Regular;
              "
            >
              {{ folder.name }}
            </div>
            <div
              style="
                color: #737373;
                
                font-weight: 400;
                font-size: 13px;
                font-style: Regular;
              "
            >
              Files: {{ folder.documentCount }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Show All / Show Less -->
    <div v-if="filteredFolders.length > 8" class="d-flex justify-center pb-4">
      <v-btn variant="solo" flat class="cust-border" @click="toggleShowAll">
        {{ showAll ? "Show Less" : "Show All" }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  folders: {
    type: Array,
    default: () => [],
  },
  hideAddFolderButton:{
    type:Boolean,
    default:false
  }
});

const search = ref("");
const showAll = ref(false);

const filteredFolders = computed(() =>
  props.folders.filter((f) =>
    f.name.toLowerCase().includes(search.value.toLowerCase())
  )
);

const visibleFolders = computed(() =>
  showAll.value ? filteredFolders.value : filteredFolders.value.slice(0, 8)
);

const toggleShowAll = () => {
  showAll.value = !showAll.value;
};
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
  width: 200px;
}
.cust-border {
  border: 1px solid #dfdfdf !important;
}
</style>
