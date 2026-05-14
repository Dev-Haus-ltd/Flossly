<template>
  <div class="mt-5">
    <!-- Leave summary cards — stack to 1 col on xs/sm, 3 cols on md+ -->
    <v-row>
      <v-col
        v-for="card in leaveCards"
        :key="card.title"
        cols="12"
        sm="6"
        md="4"
      >
        <team-floss-user-details-leave-management-holiday-card
          :iconImg="card.icon"
          :title="card.title"
          :total="card.stats.total"
          :taken="card.stats.taken"
          :color="card.color"
        />
      </v-col>
    </v-row>

    <div
      style="border: 1px solid rgba(var(--v-theme-on-surface), 0.12); border-radius: 6px;"
      class="my-5"
    >
      <!-- Header -->
      <div
        style="border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12)"
        class="d-flex flex-wrap align-center justify-space-between gap-2 px-4 py-2"
      >
        <h3 class="leave-table-title">Leaves</h3>

        <div class="d-flex flex-wrap align-center gap-2">
          <v-btn
            color="primary"
            variant="flat"
            @click="handleAddLeave"
          >
            Add Leave
          </v-btn>

          <v-text-field
            v-model="search"
            density="compact"
            placeholder="Search leaves"
            hide-details
            variant="solo"
            class="input-bordered leave-search"
            flat
            append-inner-icon="mdi-magnify"
          />
        </div>
      </div>

      <!-- Scrollable table wrapper -->
      <div class="leave-table-scroll">
        <v-table class="leave-table" density="comfortable">
          <thead>
            <tr>
              <th class="col-date">Date From</th>
              <th class="col-date">Date To</th>
              <th class="col-hours">Hours</th>
              <th class="col-pay">Pay</th>
              <th class="col-type">Type</th>
              <th class="col-status">Status</th>
              <th class="col-comment">Comment</th>
              <th class="col-doc">Document</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(leave, index) in filteredLeaves" :key="index">
              <td><div class="cell-pad">{{ formatDate(leave.startDate) }}</div></td>
              <td><div class="cell-pad">{{ formatDate(leave.endDate) }}</div></td>
              <td><div class="cell-pad">{{ leave.totalHours }}</div></td>
              <td><div class="cell-pad">{{ leave.isPaid ? "Yes" : "No" }}</div></td>
              <td><div class="cell-pad">{{ leave.leaveType }}</div></td>
              <td>
                <div class="cell-pad">
                  <v-chip :class="statusChipClass(leave.status)" size="small" label>
                    {{ leave.status }}
                  </v-chip>
                </div>
              </td>
              <td><div class="cell-pad">{{ leave.reason }}</div></td>
              <td>
                <div class="cell-pad">
                  <a v-if="leave.document" :href="leave.document" target="_blank" rel="noopener" class="text-primary">View</a>
                  <span v-else class="text-grey">-</span>
                </div>
              </td>
            </tr>

            <tr v-if="filteredLeaves.length === 0">
              <td colspan="8" class="text-center" style="padding: 20px">
                No leave history found
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </div>
    <TeamFlossUserDetailsLeaveManagementHolidayRequestDrawer
      v-model="openDrawer"
      :user="user"
      @close="handleClose"
      @success="handleSuccess"
    />
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Annual from "@/assets/icons/teamfloss/total.svg";
import Sick from "@/assets/icons/teamfloss/birthday.svg";
import Training from "@/assets/icons/teamfloss/pending.svg";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter";

const { user } = defineProps({
  user: Object,
});

const entitlementStats = ref({});
const leaveHistory = ref([]);
const openDrawer = ref(false);
const userStore = useUserStore();

const getLeaveStats = (u = user) => {
  if (!u?.id || !u?.organisationId) return;
  userStore
    .getUserLeaveHistory({
      userId: u.id,
      organisationId: u.organisationId,
    })
    .then((res) => {
      if (res.code === 0) {
        entitlementStats.value = res.data.entitlement;
        leaveHistory.value = res.data.leaveHistory;
      }
    });
};

// user prop may arrive async; fetch when available
watch(
  () => user,
  (u) => {
    getLeaveStats(u);
  },
  { immediate: true, deep: false }
);

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
  return formatDateDDMMYYYY(date);
};
// status chip styling
const statusChipClass = (status) => {
  if (!status) return "";
  if (status.toLowerCase() === "approved") return "status-chip-accepted";
  if (status.toLowerCase() === "pending") return "status-chip-pending";
  if (status.toLowerCase() === "rejected") return "status-chip-rejected";
  return "";
};
const leaveCards = computed(() => [
  { title: "Annual Leaves", icon: Annual, color: "success", stats: dynamicLeaveStats.value.annualLeaves },
  { title: "Sick Leaves",   icon: Sick,   color: "error",   stats: dynamicLeaveStats.value.sickLeaves },
  { title: "Other Leaves",  icon: Training, color: "warning", stats: dynamicLeaveStats.value.otherLeaves },
]);

// Dynamic stats calculated from actual leave history
const dynamicLeaveStats = computed(() => {
  if (!leaveHistory.value || leaveHistory.value.length === 0) {
    return {
      annualLeaves: { total: entitlementStats.value.allowedAnnualLeaves || 0, taken: 0, approved: 0 },
      sickLeaves: { total: entitlementStats.value.allowedSickLeaves || 0, taken: 0, approved: 0 },
      otherLeaves: { total: entitlementStats.value.allowedOtherLeaves || 0, taken: 0, approved: 0 }
    };
  }

  const stats = {
    annualLeaves: { total: entitlementStats.value.allowedAnnualLeaves || 0, taken: 0, approved: 0 },
    sickLeaves: { total: entitlementStats.value.allowedSickLeaves || 0, taken: 0, approved: 0 },
    otherLeaves: { total: entitlementStats.value.allowedOtherLeaves || 0, taken: 0, approved: 0 }
  };

  leaveHistory.value.forEach((leave) => {
    const leaveType = (leave.leaveType || "").toLowerCase();
    const status = (leave.status || "").toLowerCase();

    // Calculate leave taken in "days" based on date range.
    // totalHours is treated as hours-per-day selection (8 => full day, 4 => half day).
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const diffDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const hoursPerDay = Number(leave.totalHours) || 8;
    const dayUnitsRaw = diffDays * (hoursPerDay / 8);
    const dayUnits = Number.isFinite(dayUnitsRaw) ? dayUnitsRaw : 0;

    // Categorize leave types
    let category = "otherLeaves";
    if (
      leaveType.includes("annual") ||
      leaveType.includes("holiday") ||
      leaveType.includes("vacation")
    ) {
      category = "annualLeaves";
    } else if (leaveType.includes("sick") || leaveType.includes("illness")) {
      category = "sickLeaves";
    }

    // Count all leaves that are not rejected
    if (status !== "rejected") {
      stats[category].taken += dayUnits;
    }

    // Count only approved leaves
    if (status === "approved") {
      stats[category].approved += dayUnits;
    }
  });

  // Round to 1 decimal to avoid ugly floating point values (e.g. 0.30000000004)
  Object.keys(stats).forEach((k) => {
    stats[k].taken = Math.round(stats[k].taken * 10) / 10;
    stats[k].approved = Math.round(stats[k].approved * 10) / 10;
  });

  return stats;
});

// Watch for changes and force reactivity
watch([leaveHistory, entitlementStats], () => {
  nextTick(() => {
    // Force re-render of cards
  });
}, { deep: true });

watch(
  () => userStore.currentLeaveEntitlement,
  (newEntitlement) => {
    if (newEntitlement && newEntitlement.userId === user?.id) {
      entitlementStats.value = { ...entitlementStats.value, ...newEntitlement };
    }
  },
  { deep: true }
);

const handleSuccess = (data) => {
  openDrawer.value = false;
  getLeaveStats();
};

const handleAddLeave = () => {
  openDrawer.value = true;
};

const handleClose = () => {
  openDrawer.value = false;
};
</script>

<style scoped>
/* ── Table container ── */
.leave-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.leave-table .v-table__wrapper table) {
  min-width: 700px;
  width: 100% !important;
  table-layout: auto;
}

/* Column min-widths */
.col-date    { min-width: 100px; white-space: nowrap; }
.col-hours   { min-width: 70px; }
.col-pay     { min-width: 60px; }
.col-type    { min-width: 100px; }
.col-status  { min-width: 110px; }
.col-comment { min-width: 120px; }
.col-doc     { min-width: 80px; }

.leave-table th {
  background-color: #F6F6F6;
  font-weight: 500;
  font-size: 14px;
}

.cell-pad {
  padding: 0 12px;
}

/* ── Header ── */
.leave-table-title {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}

.leave-search {
  width: 220px;
}

@media (max-width: 480px) {
  .leave-search {
    width: 100%;
  }
}

/* ── Status chips ── */
.status-chip-accepted {
  background-color: rgba(var(--v-theme-success), 0.12) !important;
  color: rgb(var(--v-theme-success)) !important;
}
.status-chip-pending {
  background-color: rgba(var(--v-theme-warning), 0.12) !important;
  color: rgb(var(--v-theme-warning)) !important;
}
.status-chip-rejected {
  background-color: rgba(var(--v-theme-error), 0.12) !important;
  color: rgb(var(--v-theme-error)) !important;
}

.input-bordered :deep(.v-field) {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12) !important;
  border-radius: 8px !important;
}

.gap-2 { gap: 8px; }
</style>
