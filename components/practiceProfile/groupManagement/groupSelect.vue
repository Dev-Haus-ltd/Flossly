<template>
  <v-menu
    v-model="open"
    :close-on-content-click="false"
    max-height="360"
    :width="menuWidth"
  >
    <template #activator="{ props }">
      <div class="role-field" v-bind="props">
        {{ modelValue?.title || placeholder }}
      </div>
    </template>

    <v-card class="role-menu rounded-lg">
      <!-- Sticky Search -->
      <div class="search-wrapper">
        <v-text-field
          v-model="search"
          density="compact"
          placeholder="Search groups"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          class="input-bordered"
          flat
        />
      </div>

      <!-- List -->
      <div class="list-wrapper">
        <v-list>
          <v-list-item
            v-for="item in filtered"
            :key="item[idKey]"
            class="role-list-item"
            @click="select(item)"
          >
            <v-list-item-title>{{ item[titleKey] }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>

      <!-- Footer action -->
      <div class="footer-action">
        <v-btn
          variant="text"
          color="#266DF0"
          class="link-btn"
          prepend-icon="mdi-plus"
          @click="onAdd"
        >
          {{ addActionLabel }}
        </v-btn>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: { type: Object, default: null },
  items: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Select Group" },
  addActionLabel: { type: String, default: "Add a Substitute Lead Name" },
  idKey: { type: String, default: "id" },
  titleKey: { type: String, default: "title" },
  menuWidth: { type: [Number, String], default: 320 },
});

const emit = defineEmits(["update:modelValue", "select", "add"]);

const open = ref(false);
const search = ref("");

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.items;
  return props.items.filter((it) =>
    String(it[props.titleKey] || "")
      .toLowerCase()
      .includes(q)
  );
});

function select(item) {
  emit("update:modelValue", item);
  emit("select", item);
  open.value = false;
}

function onAdd() {
  emit("add");
  open.value = false;
}
</script>

<style scoped>
.role-field {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  min-height: 40px;
  font-size: 14px;
  
  cursor: pointer;
  color: #101010;
}
.role-field:hover {
  border: 1px solid #dfdfdf;
}

.role-menu {
  display: flex;
  flex-direction: column;
  max-height: 360px;
  overflow: hidden;
  padding: 0;
}

.search-wrapper {
  padding: 12px;
  border-bottom: 1px solid #eee;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-wrapper {
  overflow-y: auto;
  flex: 1;
}

.role-list-item {
  padding: 0px 16px !important; /* your spec */
  min-height: 40px;
}

.footer-action {
  border-top: 1px solid #eee;
  padding: 6px 8px;
  display: flex;
  justify-content: flex-start;
}

.link-btn {
  text-transform: none;
  
  font-size: 14px;
  font-weight: 500;
  padding-left: 4px;
}

/* Make icon same color/size as text */
.link-btn :deep(.v-icon) {
  font-size: 18px;
  color: #266df0;
  margin-right: 6px;
}

/* input style */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
</style>
