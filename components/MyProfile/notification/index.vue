<template>
  <div class="mt-5">
    <v-card
      elevation="0"
      class="notif-desktop-card pa-4 mb-4"
      v-if="isDesktopNotification"
    >
      <div class="card-content">
        <!-- Left Side -->
        <div class="left">
          <img
            src="@/assets/icons/myProfile/notification/desktop-icon.svg"
            alt="desktop icon"
            class="icon"
          />
          <div class="text-wrap">
            <div class="head-title">Desktop notifications</div>
            <div class="head-subtitle">
              Receive notifications directly on this computer
            </div>
          </div>
        </div>

        <!-- Right Side -->
        <div class="right">
          <v-btn variant="text" class="dismiss-btn" @click="onDismiss">
            Dismiss
          </v-btn>
          <v-btn color="primary" class="enable-btn px-6" @click="onEnable">
            Enable desktop notifications
          </v-btn>
        </div>
      </div>
    </v-card>
    <div
      class="mt-5"
      style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 6px; overflow: hidden"
    >
      <v-table class="notif-table" density="comfortable" divider>
        <thead>
          <tr>
            <!-- First col header -->
            <th class="left-head py-5">
              <div class="head-left-wrap">
                <div class="head-title">Notifications</div>
                <div class="head-subtitle">
                  Manage your notification preferences
                </div>
              </div>
            </th>

            <!-- Email col header -->
            <th class="mid-head py-5">
              <div class="head-right-wrap">
                <span>Email</span>
                <v-menu
                  v-model="menus.email"
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
                      :model-value="emailAll"
                      :indeterminate="!emailAll && !emailNone"
                      label="Select All"
                      hide-details
                      @click.prevent="setAll('email', true)"
                    />
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="emailNone"
                      :indeterminate="!emailAll && !emailNone"
                      label="Select None"
                      hide-details
                      @click.prevent="setAll('email', false)"
                    />
                  </v-card>
                </v-menu>
              </div>
            </th>

            <!-- Push col header -->
            <th class="right-head py-5">
              <div class="head-right-wrap">
                <span>Push</span>
                <v-menu
                  v-model="menus.push"
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
                      :model-value="pushAll"
                      :indeterminate="!pushAll && !pushNone"
                      label="Select All"
                      hide-details
                      @click.prevent="setAll('push', true)"
                    />
                    <v-checkbox
                      class="menu-checkbox"
                      :model-value="pushNone"
                      :indeterminate="!pushAll && !pushNone"
                      label="Select None"
                      hide-details
                      @click.prevent="setAll('push', false)"
                    />
                  </v-card>
                </v-menu>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(row, i) in state" :key="i">
            <td class="col-label">
              <div class="item-label" :title="row.label">{{ row.label }}</div>
            </td>

            <td class="col-center">
              <v-checkbox
                v-model="row.email"
                class="row-checkbox"
                hide-details
                @update:model-value="onToggle(row, 'email')"
              />
            </td>

            <td class="col-center">
              <v-checkbox
                v-model="row.push"
                class="row-checkbox"
                hide-details
                @update:model-value="onToggle(row, 'push')"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue";
const isDesktopNotification = ref(true);
const state = reactive([
  { id: 1, label: "New hire alerts", email: false, push: true },
  { id: 2, label: "Policy updates", email: true, push: false },
  { id: 3, label: "Timesheet approvals", email: true, push: true },
]);

const menus = reactive({ email: false, push: false });

const emailAll = computed(
  () => state.length > 0 && state.every((r) => !!r.email)
);
const emailNone = computed(() => state.every((r) => !r.email));
const pushAll = computed(
  () => state.length > 0 && state.every((r) => !!r.push)
);
const pushNone = computed(() => state.every((r) => !r.push));
function onDismiss() {
  isDesktopNotification.value = false;
  console.log("Dismiss clicked");
}

function onEnable() {
  console.log("Enable desktop notifications clicked");
}
function setAll(channel, value) {
  state.forEach((r) => {
    r[channel] = value;
  });
  console.log(`Set all ${channel} = ${value}`);
}

function onToggle(row, key) {
  console.log(row.id);
  console.log("Toggle:", row.label, key, row[key]);
}
</script>

<style scoped>
.notif-desktop-card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
}

.card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  width: 40px;
  height: 40px;
}

.text-wrap {
  display: flex;
  flex-direction: column;
}

.head-title {
  font-weight: 600;
  font-size: 14px;
}

.head-subtitle {
  font-weight: 400;
  font-size: 12px;
  margin-top: 2px;
}

.right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dismiss-btn {
  text-transform: none;
  font-weight: 500;
}

.enable-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
}
:deep(.v-table__wrapper table) {
  width: 100% !important;
  border-collapse: separate;
  table-layout: fixed;
}
.notif-table th,
.notif-table td {
  border: 0;
  padding: 12px 16px;
  vertical-align: middle;
  
  font-weight: 400;
  font-size: 14px;
}
.notif-table thead th {
}

.left-head {
  width: auto;
}
.mid-head,
.right-head {
  width: 140px;
}
.col-label {
  width: auto;
}
.col-center {
  width: 140px;
  text-align: center;
  padding: 0 !important;
}

.row-checkbox {
  margin-right: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.row-checkbox .v-selection-control) {
  margin: 0;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px 16px;
}
.head-left-wrap {
  display: flex;
  flex-direction: column;
}
.head-title {
  font-weight: 600;
  font-size: 14px;
}
.head-subtitle {
  font-weight: 400;
  font-size: 12px;
  margin-top: 2px;
}

.head-right-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}
.chev {
  cursor: pointer;
}

.menu-checkbox :deep(.v-label) {
  font-size: 14px;
}
/* Remove all default td/th borders */
:deep(.notif-table td),
:deep(.notif-table th) {
  border-bottom: none !important;
}

/* Add only header bottom border */
:deep(.notif-table thead th) {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
}
</style>
