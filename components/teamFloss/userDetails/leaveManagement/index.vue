<template>
  <div class="mt-5">
    <v-row>
      <v-col cols="4">
        <team-floss-user-details-leave-management-holiday-card
          :iconImg="Annual"
          title="Annual Leaves"
          :total="entitlementStats.allowedAnnualLeaves"
          :taken="entitlementStats.takenAnnualLeaves"
          color="#E8FAE8"
        />
      </v-col>
      <v-col cols="4">
        <team-floss-user-details-leave-management-holiday-card
          :iconImg="Sick"
          title="Sick Leaves"
          :total="entitlementStats.allowedSickLeaves"
          :taken="entitlementStats.takenSickLeaves"
          color="#FDE8E8"
        />
      </v-col>
      <v-col cols="4">
        <team-floss-user-details-leave-management-holiday-card
          :iconImg="Training"
          title="Other Leaves"
          :total="entitlementStats.allowedOtherLeaves"
          :taken="entitlementStats.takenOtherLeaves"
          color="#FFF3E8"
        />
      </v-col>
    </v-row>
    <div
      style="border: 1px solid #dbdbdb; border-radius: 6px; overflow: auto"
      class="my-5"
    >
      <!-- Header -->
      <div
        style="border-bottom: 1px solid #dbdbdb"
        class="d-flex align-center justify-space-between px-4 py-2"
      >
        <h3
          style="
            font-family: Poppins;
            font-weight: 600;
            font-size: 14px;
            color: #1e1e1e;
            margin: 0;
          "
        >
          Leaves
        </h3>

        <!-- Actions: Add + Search -->
        <div class="d-flex align-center">
          <v-btn
            color="primary"
            class="mr-3"
            variant="flat"
            @click="openDrawer = true"
          >
            Add Leave
          </v-btn>

          <v-text-field
            v-model="search"
            density="compact"
            placeholder="Search leaves"
            hide-details
            variant="solo"
            class="input-bordered"
            flat
            append-inner-icon="mdi-magnify"
            style="width: 260px"
          />
        </div>
      </div>

      <!-- Table -->
      <v-table class="leave-table" density="comfortable">
        <thead>
          <tr>
            <th>Date From</th>
            <th>Date To</th>
            <th>Hours</th>
            <th>Pay</th>
            <th>Type</th>
            <th>Status</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(leave, index) in filteredLeaves" :key="index">
            <td>
              <div class="px-4">
                {{ formatDate(leave.startDate) }}
              </div>
            </td>

            <td>
              <div class="px-4">
                {{ formatDate(leave.endDate) }}
              </div>
            </td>
            <td>
              <div class="px-4">
                {{ leave.totalHours }}
              </div>
            </td>

            <td>
              <div>
                <div class="px-4">{{ leave.isPaid ? "Yes" : "No" }}</div>
              </div>
            </td>
            <td>
              <div class="px-4">
                {{ leave.leaveType }}
              </div>
            </td>
            <td>
              <div class="px-4">
                <v-chip :class="statusChipClass(leave.status)" label>
                  {{ leave.status }}
                </v-chip>
              </div>
            </td>
            <td>
              <div class="px-4">
                {{ leave.reason }}
              </div>
            </td>
          </tr>

          <tr v-if="filteredLeaves.length === 0">
            <td colspan="7" class="text-center" style="padding: 20px">
              No leave history found
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>
    <TeamFlossUserDetailsLeaveManagementHolidayRequestDrawer
      v-model="openDrawer"
      :user="user"
      @close="openDrawer = false"
      @success="handleSuccess"
    />
  </div>
</template>
<script setup>
import Annual from "@/assets/icons/teamfloss/total.svg";
import Sick from "@/assets/icons/teamfloss/birthday.svg";
import Training from "@/assets/icons/teamfloss/pending.svg";
import { parsedDate } from "~/lib/dateFormatter";

const { user } = defineProps({
  user: Object,
});

const entitlementStats = ref({});
const leaveHistory = ref([]);
const openDrawer = ref(false);
const userStore = useUserStore();

onMounted(() => {
  getLeaveStats();
});

const getLeaveStats = () => {
  userStore
    .getUserLeaveHistory({
      userId: user.id,
      organisationId: user.organisationId,
    })
    .then((res) => {
      if (res.code === 0) {
        entitlementStats.value = res.data.entitlement;
        leaveHistory.value = res.data.leaveHistory;
      }
    });
};

const search = ref("");

const filteredLeaves = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return leaveHistory.value;
  return leaveHistory.value.filter((l) => {
    return (
      (l.leaveType || "").toLowerCase().includes(q) ||
      (l.status || "").toLowerCase().includes(q) ||
      (l.reason || "").toLowerCase().includes(q)
    );
  });
});

const formatDate = (date) => {
  return parsedDate(date);
};
// status chip styling
const statusChipClass = (status) => {
  if (!status) return "";
  if (status.toLowerCase() === "approved") return "status-chip-accepted";
  if (status.toLowerCase() === "pending") return "status-chip-pending";
  if (status.toLowerCase() === "rejected") return "status-chip-rejected";
  return "";
};
const handleSuccess = (data) => {
  openDrawer.value = false;
  getLeaveStats();
};
</script>

<style scoped>
.leave-table th {
  background-color: #f6f6f6;
  font-weight: 500;
}

.status-chip-accepted {
  background-color: #33b93c1a !important;
  color: #33b93c !important;
}
.status-chip-pending {
  background-color: #fdd8351a !important;
  color: #fbc02d !important;
}
.status-chip-rejected {
  background-color: #ff52521a !important;
  color: #ff5252 !important;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
}
:deep(.v-table__wrapper table) {
  width: 100% !important;
  table-layout: fixed;
}

:deep() .v-table .v-table__wrapper > table > thead > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep() .v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child),
.v-table .v-table__wrapper > table > tbody > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
:deep(.v-data-table .v-table__wrapper tbody tr:hover) {
  background-color: #f5f5f5;
  transition: background-color 0.2s ease;
}
</style>
