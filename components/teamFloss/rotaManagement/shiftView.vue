<template>
  <v-card
    class="rounded-lg parent-card mt-6"
    :elevation="0"
    style="overflow-x: auto"
  >
    <!-- Header controls -->
    <div
      class="d-flex align-center head pa-4 pos-sticky-left"
      style="position: sticky; left: 0px"
    >
      <v-btn
        icon
        variant="text"
        class="no-bg-btn"
        density="comfortable"
        @click="prevWeek"
        :disabled="weekStartIndex === 0"
      >
        <v-icon color="#000000">mdi-chevron-left</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        class="no-bg-btn"
        density="comfortable"
        @click="nextWeek"
        :disabled="weekStartIndex + 7 >= allDays.length"
      >
        <v-icon color="#000000">mdi-chevron-right</v-icon>
      </v-btn>
      <div class="date-text">
        {{ rota?.name }} ({{ formatDate(rota?.startDate, "dd MMM") }} -
        {{ formatDate(rota?.endDate, "dd MMM") }})
      </div>
    </div>

    <!-- Header (dates of current visible week) -->
    <div class="rota-grid" :style="gridStyle">
      <div
        class="staff-col first-col-color d-flex align-center pa-4 pos-sticky-left"
      >
        <div class="d-flex flex-column align-center ml-2">
          <v-icon color="#000000" size="small" style="cursor: pointer"
            >mdi-chevron-up</v-icon
          >
          <v-icon color="#000000" size="small" style="cursor: pointer"
            >mdi-chevron-down</v-icon
          >
        </div>
        <h3 class="fst-col-title ml-2">Staff custom order</h3>
      </div>
      <div
        v-for="day in visibleDays"
        :key="day.date"
        class="day-col d-flex align-center justify-center"
      >
        <div>
          <h3 class="head-date text-center">
            {{ formatDate(day.date, "dd MMM") }}
          </h3>
          <h3 class="head-date text-center mt-2">
            {{ formatDate(day.date, "EEE") }}
          </h3>
        </div>
      </div>
      <div
        class="total-col d-flex align-center justify-center pos-sticky-right"
      >
        <h3 class="head-date">Total Hours</h3>
      </div>
    </div>

    <!-- Rows: staff × days -->
     <div  v-if="selectedView !== 0 ">
       <div
         v-for="(user) in users"
         :key="user.id"
         class="rota-grid row"
         :style="gridStyle"
       >
         <!-- Staff Info -->
         <div
           class="staff-col first-col-color d-flex align-center pa-4 pos-sticky-left"
         >
           <CommonAvatar :user="user?.user" class="mr-2" size="45" />
           <div>
             <h3 class="fst-col-title">{{ user?.user.fullName }}</h3>
             <small class="fst-col--subtit">{{ user?.user.role.title }}</small>
           </div>
         </div>
   
         <!-- Days Cells -->
         <div
           v-for="day in visibleDays"
           :key="day.date + '-' + user.id"
           class="day-col shift-cell"
           @click="addShift(user, day)"
         >
           <div
             v-for="(shift, i) in getShifts(user.user.id, day.date)"
             :key="shift.id"
             class="w-100 mx-auto"
             :style="{ marginTop: i > 0 ? '10px' : '', maxWidth: '220px' }"
           >
             <!-- Hover menu wrapping the chip -->
             <v-menu open-on-hover location="bottom" :z-index="5" :attach="true" >
               <template #activator="{ props }">
                 <div
                   v-bind="props"
                   class="shift-chip"
                   @click="viewShift(shift)"
                   :style="{
                     backgroundColor: shift.color + '1A',
                     borderBottom: `4px solid ${shift.color}`,
                   }"
                 >
                   <!-- Top row -->
                   <div class="chip-header">
                     <span class="chip-text mx-auto mt-2">
                       {{ formatTime(shift.startDate) }} -
                       {{ formatTime(shift.endDate) }}
                     </span>
   
                     <!-- Existing three-dot menu -->
                     <v-menu>
                       <template #activator="{ props }">
                         <v-btn
                           v-bind="props"
                           icon
                           variant="text"
                           size="small"
                           class="menu-btn"
                         >
                           <v-icon color="#6D6D6D">mdi-dots-vertical</v-icon>
                         </v-btn>
                       </template>
   
                       <v-list width="220" class="rounded-xl" :elevation="2">
                         <v-list-item @click="editShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/edit.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Info / Edit</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="copyShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/copy.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Copy</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="addShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/add.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Add Shift</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="deleteShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/delete.svg"
                               class="menu-icon"
                             />
                             <span class="text-red menu-item-title">Delete</span>
                           </div>
                         </v-list-item>
                       </v-list>
                     </v-menu>
                   </div>
   
                   <!-- File icon under text -->
                   <div class="chip-footer mt-2">
                     <v-icon size="30" :color="shift.color"
                       >mdi-file-outline</v-icon
                     >
                   </div>
                 </div>
               </template>
   
               <!-- Hover menu content (read-only) -->
               <v-list width="320" class="rounded-lg px-4 py-3" :elevation="2" >
                 <!-- Top row: start-end time + shift label chip -->
                 <div class="d-flex justify-space-between align-center mb-2">
                   <span class="hover-menu-item">
                     {{ formatTime(shift.startDate) }} -
                     {{ formatTime(shift.endDate) }}
                   </span>
                   <v-chip
                     small
                     class="ma-0"
                     :style="{
                       backgroundColor: shift.color,
                       color: '#ffffff',
                     }"
                   >
                     {{ shift.label }}
                   </v-chip>
                 </div>
   
                 <div class="mb-3 hover-menu-item" v-if="shift.surgeryId">
                   Surgery: {{ getSurgeryName(shift.surgeryId) }}
                 </div>
                 <div class="mb-3 hover-menu-item" v-if="shift.dentistId">
                   Dentist name: {{ getDentistName(shift.dentistId) }}
                 </div>
                 <div class="mb-3 hover-menu-item" v-if="shift.nurseId">
                   Nurse name: {{ getNurseName(shift.nurseId) }}
                 </div>
   
                 <!-- Bottom row: file icon + text -->
                 <div class="d-flex align-center">
                   <v-icon :color="shift.color" size="28">mdi-file-outline</v-icon>
                   <span class="ml-2 hover-menu-item">
                     Complete Cross Infection Audit
                   </span>
                 </div>
               </v-list>
             </v-menu>
           </div>
         </div>
   
         <!-- Weekly total per user -->
         <div
           class="total-col d-flex align-center justify-center pos-sticky-right"
         >
           <h3 class="total-hrs">
             {{ getUserTotalHours(user.user.id, visibleDays) }} hrs
           </h3>
         </div>
       </div>

     </div>
     <div  v-else>
       <div
      
         v-for="(surg) in surgries"
         :key="surg.id"
         class="rota-grid row"
         :style="gridStyle"
       >
         <!-- Staff Info -->
         <div
           class="staff-col first-col-color d-flex align-center pa-4 pos-sticky-left"
         >
           <CommonAvatar :user="surg" class="mr-2" size="45" /> 
           <div>
             <h3 class="fst-col-title">{{ surg?.name}}</h3>
           
           </div>
         </div>
   
         <!-- Days Cells -->
         <div
           v-for="day in visibleDays"
           :key="day.date + '-' + surg.id"
           class="day-col shift-cell"
         
         >
           <div
             v-for="(shift, i) in getSurgeryShifts(surg.id, day.date)"
             :key="shift.id"
             class="w-100 mx-auto"
             :style="{ marginTop: i > 0 ? '10px' : '', maxWidth: '220px' }"
           >
             <!-- Hover menu wrapping the chip -->
             <v-menu open-on-hover location="bottom" :z-index="5" :attach="true" >
               <template #activator="{ props }">
                 <div
                   v-bind="props"
                   class="shift-chip"
                   @click="viewShift(shift)"
                   :style="{
                     backgroundColor: shift.color + '1A',
                     borderBottom: `4px solid ${shift.color}`,
                   }"
                 >
                   <!-- Top row -->
                   <div class="chip-header">
                     <span class="chip-text mx-auto mt-2">
                       {{ formatTime(shift.startDate) }} -
                       {{ formatTime(shift.endDate) }}
                     </span>
   
                     <!-- Existing three-dot menu -->
                     <v-menu>
                       <template #activator="{ props }">
                         <v-btn
                           v-bind="props"
                           icon
                           variant="text"
                           size="small"
                           class="menu-btn"
                         >
                           <v-icon color="#6D6D6D">mdi-dots-vertical</v-icon>
                         </v-btn>
                       </template>
   
                       <v-list width="220" class="rounded-xl" :elevation="2">
                         <v-list-item @click="editShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/edit.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Info / Edit</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="copyShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/copy.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Copy</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="addShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/add.svg"
                               class="menu-icon"
                             />
                             <span class="menu-item-title">Add Shift</span>
                           </div>
                         </v-list-item>
   
                         <v-list-item @click="deleteShift(shift)">
                           <div class="menu-item">
                             <img
                               src="@/assets/icons/teamfloss/shifts/delete.svg"
                               class="menu-icon"
                             />
                             <span class="text-red menu-item-title">Delete</span>
                           </div>
                         </v-list-item>
                       </v-list>
                     </v-menu>
                   </div>
   
                   <!-- File icon under text -->
                   <div class="chip-footer mt-2">
                     <v-icon size="30" :color="shift.color"
                       >mdi-file-outline</v-icon
                     >
                   </div>
                 </div>
               </template>
   
               <!-- Hover menu content (read-only) -->
               <v-list width="320" class="rounded-lg px-4 py-3" :elevation="2" >
                 <!-- Top row: start-end time + shift label chip -->
                 <div class="d-flex justify-space-between align-center mb-2">
                   <span class="hover-menu-item">
                     {{ formatTime(shift.startDate) }} -
                     {{ formatTime(shift.endDate) }}
                   </span>
                   <v-chip
                     small
                     class="ma-0"
                     :style="{
                       backgroundColor: shift.color,
                       color: '#ffffff',
                     }"
                   >
                     {{ shift.label }}
                   </v-chip>
                 </div>
   
                 <div class="mb-3 hover-menu-item" v-if="shift.surgeryId">
                   Surgery: {{ getSurgeryName(shift.surgeryId) }}
                 </div>
                 <div class="mb-3 hover-menu-item" v-if="shift.dentistId">
                   Dentist name: {{ getDentistName(shift.dentistId) }}
                 </div>
                 <div class="mb-3 hover-menu-item" v-if="shift.nurseId">
                   Nurse name: {{ getNurseName(shift.nurseId) }}
                 </div>
   
                 <!-- Bottom row: file icon + text -->
                 <div class="d-flex align-center">
                   <v-icon :color="shift.color" size="28">mdi-file-outline</v-icon>
                   <span class="ml-2 hover-menu-item">
                     Complete Cross Infection Audit
                   </span>
                 </div>
               </v-list>
             </v-menu>
           </div>
         </div>
   
         <!-- Weekly total per user -->
         <div
           class="total-col d-flex align-center justify-center pos-sticky-right"
         >
           <h3 class="total-hrs">
             {{ getSurgeryTotalHours(surg.id, visibleDays) }} hrs
           </h3>
         </div>
       </div>
       
     </div>
    <div class="rota-grid row" :style="gridStyle">
      <div
        class="staff-col first-col-color d-flex align-center justify-center pa-4 pos-sticky-left"
      >
        <v-btn
          class="add-staff-btn"
          color="#3ADF8D"
          rounded="lg"
          width="100%"
          style="background-color: white; color: #1e1e1e"
          flat
          @click="manageStaffDialogOpen=true"
        >
          <template #prepend>
            <v-icon size="20" style="color: #1e1e1e">
              mdi-plus-circle-outline
            </v-icon>
          </template>
   Manage Staff
        </v-btn>
      </div>
    </div>

    <!-- Footer daily totals -->
    <div class="rota-grid footer" :style="gridStyle">
      <div
        class="staff-col day-total-box d-flex align-center justify-center pos-sticky-left"
      >
        <h3 class="day-total-row-item">Daily total</h3>
      </div>
      <div
        v-for="day in visibleDays"
        :key="day.date"
        class="day-col d-flex justify-center align-center day-total-box"
      >
        <h3 class="day-total-row-item">{{ getDayTotalHours(day.date) }} hrs</h3>
      </div>
      <div class="total-col pos-sticky-right"></div>
    </div>
    <TeamFlossRotaManagementManageStaffDialog
      v-model="manageStaffDialogOpen"
        :employees="employees"
        :selectedUsers="slecteduserIds "
        :rota="rota"
        @onAddUser="emit('onAddUser')"
    />
  </v-card>

</template>

<script setup>
import { differenceInCalendarDays, addDays, parseISO, format } from "date-fns";

const { shifts, rota, users, selectedView } = defineProps({
  shifts: Array,
  rota: Object,
  users: Array,
  selectedView: Number
});
const emit = defineEmits(["onAddShift", "updateShifts","onAddUser"]);

const mainStore = useMainStore();
const rotaStore = useRotaStore();
const orgStore = useOrgStore();
const userStore= useUserStore();
const surgries = ref([]);
const manageStaffDialogOpen=ref(false);
const employees= ref([]);

const slecteduserIds = computed(() => users.map((ru) => ru.userId));
onMounted(() => {
  getSurgeries();
  getAllUsers()
});

const getAllUsers = () => {
  userStore.getUserList({ roleId: null, orgId:rota.organisationId }).then((res) => {
    if (res.code === 0) {
      employees.value = res.data;
    }
  });
};
const getSurgeries = () => {
  orgStore.getSurgeries({ organisationId: rota.organisationId }).then((res) => {
    if (res.code === 0) {
      surgries.value = res.data;
    }
  });
};


// Build full day list
const start = parseISO(rota.startDate);
const end = parseISO(rota.endDate);
const totalDays = differenceInCalendarDays(end, start) + 1;
const allDays = Array.from({ length: totalDays }).map((_, i) => ({
  date: addDays(start, i),
}));

// Track visible range
const weekStartIndex = ref(0);
const visibleDays = computed(() =>
  allDays.slice(weekStartIndex.value, weekStartIndex.value + 7)
);

// Slide navigation
const prevWeek = () => {
  if (weekStartIndex.value > 0) weekStartIndex.value -= 7;
};
const nextWeek = () => {
  if (weekStartIndex.value + 7 < allDays.length) weekStartIndex.value += 7;
};

function formatDate(date, pattern) {
  return format(typeof date === "string" ? parseISO(date) : date, pattern);
}

// Dynamic grid style (200px staff + N days + 120px total col)
const gridStyle = computed(() => ({
  display: "grid",
  gridTemplateColumns: `280px repeat(${visibleDays.value.length}, ${
    visibleDays.value.length >= 7 ? "300px" : "1fr"
  }) 147px`,
  borderBottom: "1px solid #DBDBDB",
  width: visibleDays.value.length >= 7 ? "max-content" : "",
}));

// Helpers
const getShifts = (userId, date) =>
  shifts.filter(
    (s) =>
      s.userId === userId &&
      format(s.startDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
const getSurgeryShifts=(surgId, date) =>
  shifts.filter(
    (s) =>
      s.surgeryId === surgId &&
      format(s.startDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
  );
const getUserTotalHours = (userId, days) =>
  shifts
    .filter(
      (s) =>
        s.userId === userId &&
        days.some(
          (d) =>
            format(new Date(s.startDate), "yyyy-MM-dd") ===
            format(new Date(d.date), "yyyy-MM-dd")
        )
    )
    .reduce((acc, s) => acc + getShiftDuration(s), 0);
    const getSurgeryTotalHours = (surgId, days) =>
  shifts
    .filter(
      (s) =>
        s.surgeryId === surgId &&
        days.some(
          (d) =>
            format(new Date(s.startDate), "yyyy-MM-dd") ===
            format(new Date(d.date), "yyyy-MM-dd")
        )
    )
    .reduce((acc, s) => acc + getShiftDuration(s), 0);

// total hours per day across all users
const getDayTotalHours = (date) =>
  shifts
    .filter(
      (s) =>
        format(new Date(s.startDate), "yyyy-MM-dd") ===
        format(new Date(date), "yyyy-MM-dd")
    )
    .reduce((acc, s) => acc + getShiftDuration(s), 0);

const addShift = (user, day) => {
  emit("onAddShift", { user, day });
};

const viewShift = (shift) => {
  console.log(shift);
};

const getShiftDuration = (shift) => {
  if (!shift.startDate || !shift.endDate) return 0;

  const diffMs =
    new Date(shift.endDate).getTime() - new Date(shift.startDate).getTime();
  const diffHours = diffMs / (1000 * 60 * 60); // convert ms → hours

  return diffHours;
};
function formatTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d)) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
const deleteShift = async (shift) => {
  try {
    const res = await rotaStore.deleteRotaShift({
      rotaId: rota.id,
      shiftId: shift.id,
    });

    if (res.code === 0) {
      // Show success snackbar
      mainStore.setSnackbar({
        title: "Shift deleted successfully",
        type: "success",
      });
      // const updatedShifts = shifts.filter((s) => s.id !== shift.id);
      emit("updateShifts", rota);
    } else {
      mainStore.setSnackbar({
        title: res.message || "Failed to delete shift",
        type: "error",
      });
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: "Something went wrong while deleting the shift",
      type: "error",
    });
  }
};


const getSurgeryName = (shiftId) => {
  const surgeryName = surgries.value?.find((s) => s.id === shiftId)?.name;
  return surgeryName;
};
const getDentistName = (dentistId) => {
  const dentistName = users.find(
    (d) => d.userId === dentistId
  )?.user?.fullName;
  return dentistName;
};
const getNurseName = (nurseId) => {
  const nurseName = users.find((n) => n.userId === nurseId)?.user?.fullName;
  return nurseName;
};
</script>

<style scoped>
.parent-card {
  border: 1px solid #dbdbdb;
}
.head {
  border-bottom: 1px solid #dbdbdb;
}
.date-text {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
}
.fst-col-title {
  font-family: "Poppins";
  font-weight: 600;
  font-style: "SemiBold";
  font-size: 14px;
  color: #1e1e1e;
}
.fst-col--subtit {
  font-family: "Poppins";
  font-weight: 400;
  font-style: Regular;
  font-size: 14px;
  color: #1e1e1e;
}
.head-date {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #737373;
}
.day-total-row-item {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #000000;
}
/* .rota-grid.header,
.rota-grid.footer {
  background: #EFEFEF;
} */
.day-total-box {
  background: #efefef;
  height: 60px;
}
.rota-grid.row {
  min-height: 64px;
  align-items: center;
}
.first-col-color {
  background-color: #f3f6fa;
}
.staff-col {
  height: 100%;
}
.total-col {
  background-color: #f3f6fa;
  height: 100%;
}
.total-hrs {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #737373;
}
.staff-col,
.day-col,
.total-col {
  padding: 8px;
  border-right: 1px solid #dbdbdb;
}
.pos-sticky-left {
  position: sticky;
  left: 0px;
  z-index: 10;

}
.pos-sticky-right {
  position: sticky;
  right: 0px;
  z-index: 10;
}
.shift-cell {
  cursor: pointer;
  min-height: 48px;
  height: 100%;
}

.shift-chip {
  border-radius: 12px; /* lg rounded */
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  min-width: 120px;
  width: 100%;
}

.chip-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.chip-text {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #1e1e1e;
}

.menu-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px; /* space between icon & text */
}

.menu-icon {
  width: 20px;
  height: 20px;
}

.text-red {
  color: #ff010b;
}
.menu-item-title {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #1e1e1e;
  margin-left: 5px;
}
.chip-footer {
  margin-top: 6px;
  display: flex;
  justify-content: center;
  width: 100%;
}
.hover-menu-item {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;

  color: #1e1e1e;
}
.add-staff-btn {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  border: 1px solid #3adf8d;
  height: 50px;
}
</style>
