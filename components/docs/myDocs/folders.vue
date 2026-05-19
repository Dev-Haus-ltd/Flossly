<template>
  <div style="border: 1px solid #dbdbdb; border-radius: 12px">
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
        <v-btn class="py-2 ml-2 folder-btn" color="primary" flat @click="$emit('add-folder')" v-if="!hideAddFolderButton">
          <v-icon start>mdi-plus-circle-outline</v-icon>
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
          class="pa-3 d-flex align-center folder-cards"
          style="border: 1px solid #dbdbdb; cursor: pointer"
          @click="$emit('open-folder', folder)"
          flat
        >
          <!-- Folder Image -->
          <img
            src="@/assets/images/flosslydocs/folder.svg"
            style="height: 60px; width: 60px"
            class="mr-3"
          />

          <!-- Folder Details -->
          <div class="flex-grow-1" style="min-width: 0; overflow: hidden;">
            <div class="folder-name">
              {{ folder.name }}
            </div>
            <div class="folder-file-count">
              Files: {{ folder.documentCount }}
            </div>
          </div>
          <v-spacer />
          <!-- Menu -->
          <v-menu 
            location="bottom start"
            origin="top start"
            content-class="folder-menu"
          >
            <template #activator="{ props: menuProps }">
              <img
                v-bind="menuProps"
                src="@/assets/icons/menu.svg"
                alt="Menu"
                width="24"
                height="24"
                style="cursor: pointer"
                @click.stop
              />
            </template>
            <v-list density="compact" class="pa-0">
              <v-list-item
                @click.stop="$emit('edit-folder', folder)"
              >
                <template #prepend>
                  <img
                    src="@/assets/icons/edit_1.svg"
                    width="20"
                    height="20"
                    class="mr-3"
                  />
                </template>
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click.stop="$emit('move-folder', { folder, event: $event })"
              >
                <template #prepend>
                  <img
                    src="@/assets/icons/move.svg"
                    width="20"
                    height="20"
                    class="mr-3"
                  />
                </template>
                <v-list-item-title>Move</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click.stop="$emit('delete-folder', folder)"
                class="text-error"
              >
                <template #prepend>
                  <img
                    src="@/assets/icons/delete_1.svg"
                    width="20"
                    height="20"
                    class="mr-3"
                  />
                </template>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
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
  border: 1px solid #FAFAFA !important;
  border-radius: 8px !important;
  min-height: 46px;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  background-color: #F3F4F6 !important;
  font-style: normal;
  width: 105px;
}
.cust-border {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  font-size: 14px;
  font-weight: 400;
  line-height: 130%;
  color: #1E1E1E;
  font-style: normal;
}

:deep(.folder-menu) {
  width: 220px;
  height: 133px;
}

:deep(.folder-menu > .v-list) {
  box-shadow: 0 8px 14px rgba(0, 0, 0, 0.15) !important;
}

.folder-cards {
  border-radius: 12px !important;
}

.folder-name {
  font-weight: 400;
  font-size: 13px;
  color: #1E1E1E;
  font-style: normal;
  font-family: Poppins, sans-serif;
  line-height: 130%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.folder-file-count {
  font-weight: 400;
  font-size: 13px;
  color: #737373;
  font-style: normal;
  font-family: Poppins, sans-serif;
  line-height: 130%;
}
.folder-btn {
  font-weight: 400;
  font-size: 14px;
  color: #1E1E1E;
  font-style: normal;
  font-family: Inter, sans-serif;
  line-height: 130%;
  align-items: center;
  border-radius: 8px;
  height: 46px;
  min-height: 46px;
  width: 135px;

}

</style>
