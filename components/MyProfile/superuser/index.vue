<template>
  <div class="mt-5">
    <!-- Section heading -->
    <div class="super-heading mb-3">Super User</div>

    <!-- Button group -->
    <div
      class="btn-group mb-4 pa-1 rounded-lg"
      style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); width: fit-content"
    >
      <v-btn
        class="toggle-btn"
        :class="{ active: activeTab === 'active' }"
        @click="activeTab = 'active'"
        flat
        :elevation="0"
      >
        Active
      </v-btn>
      <v-btn
        class="toggle-btn"
        :class="{ active: activeTab === 'deactive' }"
        @click="activeTab = 'deactive'"
        flat
        :elevation="0"
      >
        Deactive
      </v-btn>
    </div>

    <!-- Table container -->
    <div
      style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 6px; overflow: hidden"
    >
      <v-table class="super-table" density="comfortable">
        <thead>
          <tr>
            <!-- First col header -->
            <th class="left-head">
              <div class="head-left-wrap">
                <div class="head-title">Controls</div>
              </div>
            </th>

            <!-- Full Access header + dropdown -->
            <th class="mid-head">
              <div class="head-right-wrap">
                <span>Full Access</span>
                <v-menu
                  v-model="menus.full"
                  :close-on-content-click="false"
                  location="bottom"
                  offset="6"
                >
                  <template #activator="{ props }">
                    <v-icon v-bind="props" class="chev"
                      >mdi-chevron-down</v-icon
                    >
                  </template>
                  <v-card class="pa-2">
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="fullAll"
                      :indeterminate="!fullAll && !fullNone"
                      label="Select All"
                      hide-details
                      @click.prevent="setAll(true)"
                    />
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="fullNone"
                      :indeterminate="!fullAll && !fullNone"
                      label="Select None"
                      hide-details
                      @click.prevent="setAll(null)"
                    />
                  </v-card>
                </v-menu>
              </div>
            </th>

            <!-- Not Access header + dropdown -->
            <th class="right-head">
              <div class="head-right-wrap">
                <span>Not Access</span>
                <v-menu
                  v-model="menus.none"
                  :close-on-content-click="false"
                  location="bottom"
                  offset="6"
                >
                  <template #activator="{ props }">
                    <v-icon v-bind="props" class="chev"
                      >mdi-chevron-down</v-icon
                    >
                  </template>
                  <v-card class="pa-2">
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="noneAll"
                      :indeterminate="!noneAll && !noneNone"
                      label="Select All"
                      hide-details
                      @click.prevent="setAll(false)"
                    />
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="noneNone"
                      :indeterminate="!noneAll && !noneNone"
                      label="Select None"
                      hide-details
                      @click.prevent="setAll(null)"
                    />
                  </v-card>
                </v-menu>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <!-- Control name -->
            <td class="col-label">
              <div class="item-label" :title="row.label">{{ row.label }}</div>
            </td>

            <!-- Full Access radio -->
            <td class="col-center">
              <v-radio
                :model-value="row.access === true"
                class="row-radio"
                @click="setRow(row, true)"
              />
            </td>

            <!-- Not Access radio -->
            <td class="col-center">
              <v-radio
                :model-value="row.access === false"
                class="row-radio"
                @click="setRow(row, false)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from "vue";

const activeTab = ref("active"); // "active" | "deactive"

// table data (example)
const rows = reactive([
  { id: 1, label: "Manage Users", access: true },
  { id: 2, label: "View Reports", access: false },
  { id: 3, label: "System Settings", access: null }, // null = no selection yet
]);

const menus = reactive({ full: false, none: false });

// Header menu computed states
const fullAll = computed(
  () => rows.length > 0 && rows.every((r) => r.access === true)
);
const fullNone = computed(() => rows.every((r) => r.access !== true)); // none are true
const noneAll = computed(
  () => rows.length > 0 && rows.every((r) => r.access === false)
);
const noneNone = computed(() => rows.every((r) => r.access !== false)); // none are false

function setAll(value) {
  rows.forEach((r) => {
    r.access = value;
  });
  console.log("Set all rows access =", value);
}

function setRow(row, value) {
  row.access = value;
  console.log(
    `Row ${row.id} (${row.label}) -> ${value ? "Full Access" : "Not Access"}`
  );
}
</script>

<style scoped>
/* Heading style (Super User) */
.super-heading {
  font-weight: 600;
  font-style: SemiBold;
  font-size: 13px;
}

/* Toggle buttons */
.btn-group {
  display: flex;
}
.toggle-btn {
  text-transform: none;
  font-weight: 500;
  font-size: 13px;
  border-radius: 6px;
}
.toggle-btn.active {
}

/* Make table 100% width and match your notif-table look */
:deep(.v-table__wrapper table) {
  width: 100% !important;
  border-collapse: separate;
  table-layout: fixed;
}
.super-table th,
.super-table td {
  border: 0;
  padding: 12px 16px;
  vertical-align: middle;
  
  font-weight: 400;
  font-size: 14px;
}
.super-table thead th {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important; /* header line only */
}

/* Column widths and alignment */
.left-head {
  width: auto;
}
.mid-head,
.right-head {
  width: 160px;
}
.col-label {
  width: auto;
}
.col-center {
  width: 160px;
  text-align: center;
  padding: 0 !important;
}

/* Row radios centered & no extra margins */
.row-radio {
  display: flex;
  justify-content: center;
  align-items: center;
}
:deep(.row-radio .v-selection-control) {
  margin: 0;
}

/* Text styles copied from your notification table */
.head-left-wrap {
  display: flex;
  flex-direction: column;
}
.head-title {
  font-weight: 600;
  font-style: SemiBold;
  font-size: 13px;
}
.head-right-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  font-weight: 500;
  font-size: 14px;
}
.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 16px;
}
.chev {
  cursor: pointer;
}

/* Header menu labels (visual match) */
.menu-checkbox :deep(.v-label) {
  font-size: 14px;
}
/* Remove all default td/th borders */
:deep(.super-table td),
:deep(.super-table th) {
  border-bottom: none !important;
}

/* Add only header bottom border */
:deep(.super-table thead th) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}
</style>
