<template>
  <v-card class="profile-card h-100">
    <v-card-title class="d-flex justify-space-between align-center px-4 py-3">
      <div class="d-flex align-center gap-2">
        <v-btn
          v-if="mdAndDown"
          icon="mdi-menu"
          variant="text"
          size="small"
          @click="toggleSidebar"
        />
        <span>My Profile</span>
      </div>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" />
    </v-card-title>

    <v-divider />

    <div class="profile-body">
      <!-- Desktop Sidebar -->
      <div v-if="!mdAndDown" class="sidebar-wrapper-desktop">
        <CommonSideBar
          :items="menuItems"
          :selected="selectedSection"
          @select="handleSidebarSelect"
        />
      </div>

      <!-- Mobile/Tablet Sidebar with Backdrop -->
      <template v-if="mdAndDown">
        <!-- Backdrop -->
        <div
          v-if="showMobileSidebar"
          class="mobile-backdrop"
          @click="closeSidebar"
        />
        
        <!-- Sidebar Drawer -->
        <div
          v-if="showMobileSidebar"
          class="sidebar-wrapper-mobile"
        >
          <CommonSideBar
            :items="menuItems"
            :selected="selectedSection"
            @select="handleSidebarSelect"
          />
        </div>
      </template>

      <!-- Main Content -->
      <div class="main-content">
        <component
          v-if="selectedSection"
          :is="currentComponent"
          :user="user"
          :bankDetails="acccoutDetails"
          :contractDetails="contractDetails"
          @update="handleChildUpdate"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { useDisplay } from "vuetify";
import { ref, computed, onMounted } from "vue";

const { mdAndDown } = useDisplay();

// Import components
import ProfileDetails from "./profile/index.vue";
import HRDetails from "./hrDetails/index.vue";
import PaymentDetails from "./paymentDetails/index.vue";
import Password from "./password/index.vue";
// import Notification from "./notification/index.vue";
// import SuperUser from "./superuser/index.vue";
import Membership from "./membership/index.vue";
import RewardPoints from "./rewardPoints/index.vue";
import LoyaltyPoints from "./loyaltyPoints/index.vue";
import { TeamFlossUserDetailsDocuments } from "#components";


// imgs
import ProfileImg from "@/assets/icons/myProfile/profile.svg"; 
import HrImg from "@/assets/icons/myProfile/hr.svg";
import PaymentImg from "@/assets/icons/myProfile/payment.svg";
import PasswordImg from "@/assets/icons/myProfile/password.svg";
// import NotificationImg from "@/assets/icons/myProfile/notification.svg";
// import SuperImg from "@/assets/icons/myProfile/super.svg";
import MembershipImg from "@/assets/icons/myProfile/membership.svg";
import RewardImg from "@/assets/icons/myProfile/rewards.svg";
import LoyaltyImg from "@/assets/icons/myProfile/loyalty.svg";

const showMobileSidebar = ref(false);
const { user } = defineProps({
  user: Object
});

const authStore = useAuthStore();
const acccoutDetails = ref({});
const contractDetails = ref({});

const menuItems = ref([
  { key: "profile", label: "Profile Details", icon: ProfileImg },
  { key: "hr", label: "HR Details", icon: HrImg },
  { key: "payment", label: "Payment Details", icon: PaymentImg },
  { key: "password", label: "Password", icon: PasswordImg },
  // {
  //   key: "notification",
  //   label: "Notification",
  //   icon: NotificationImg,
  // },
  // { key: "super", label: "Super User", icon: SuperImg },
  { key: "reward", label: "Reward Points", icon: RewardImg },
  { key: "loyalty", label: "Loyalty Points", icon: LoyaltyImg },
  { key: "hrDocs", label: "Hr Documents", icon: PaymentImg },
]);

const addMembership = () => {
  if (user?.roleId === 1 || user?.roleId === 8) {
    menuItems.value.splice(4, 0, {
      key: "membership",
      label: "Membership",
      icon: MembershipImg
    });
  }
};

onMounted(() => {
  getAccount();
  getContract();
  addMembership();
});

const getAccount = () => {
  authStore.getAccountDetails().then((res) => {
    if (res.code === 0) {
      acccoutDetails.value = res.data;
    }
  });
};

const getContract = () => {
  authStore.getContractDetails().then((res) => {
    if (res.code === 0) {
      contractDetails.value = res.data;
    }
  });
};

const selectedSection = ref("profile");

// Map key → component
const componentsMap = {
  profile: ProfileDetails,
  hr: HRDetails,
  payment: PaymentDetails,
  password: Password,
  // notification: Notification,
  // super: SuperUser,
  membership: Membership,
  reward: RewardPoints,
  loyalty: LoyaltyPoints,
  hrDocs: TeamFlossUserDetailsDocuments
};

const currentComponent = computed(() => componentsMap[selectedSection.value]);

// Toggle sidebar
const toggleSidebar = () => {
  showMobileSidebar.value = !showMobileSidebar.value;
};

// Close sidebar
const closeSidebar = () => {
  showMobileSidebar.value = false;
};

// Handle sidebar selection and auto-close on mobile/tablet
const handleSidebarSelect = (selected) => {
  selectedSection.value = selected;
  
  // Auto-close mobile sidebar after selection
  if (mdAndDown.value) {
    closeSidebar();
  }
};

// Handle updates from child components
const handleChildUpdate = (updatedData) => {
  if (selectedSection.value === "payment" || selectedSection.value === "bank") {
    acccoutDetails.value = { ...acccoutDetails.value, ...updatedData };
  } else if (selectedSection.value === "hr" || selectedSection.value === "contract") {
    contractDetails.value = { ...contractDetails.value, ...updatedData };
  }
};
</script>

<style scoped>
.profile-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.profile-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* Desktop Sidebar - Always visible side-by-side */
.sidebar-wrapper-desktop {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
  background: white;
}

/* Mobile/Tablet Backdrop */
.mobile-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

/* Mobile/Tablet Sidebar - Overlay drawer */
.sidebar-wrapper-mobile {
  position: absolute;
  top: 0;
  left: 0;
  width: 280px;
  max-width: 80vw;
  height: 100%;
  background: white;
  border-right: 1px solid #e0e0e0;
  z-index: 101;
  overflow-y: auto;
  animation: slideInLeft 0.3s ease-in-out;
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Main Content Area */
.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  min-width: 0;
}

/* Scrollbar styling */
.sidebar-wrapper-desktop::-webkit-scrollbar,
.sidebar-wrapper-mobile::-webkit-scrollbar,
.main-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-track,
.sidebar-wrapper-mobile::-webkit-scrollbar-track,
.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-thumb,
.sidebar-wrapper-mobile::-webkit-scrollbar-thumb,
.main-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.sidebar-wrapper-desktop::-webkit-scrollbar-thumb:hover,
.sidebar-wrapper-mobile::-webkit-scrollbar-thumb:hover,
.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Responsive padding adjustments */
@media (max-width: 600px) {
  .main-content {
    padding: 0.75rem;
  }
}

@media (max-width: 960px) {
  .main-content {
    padding: 1rem;
  }
}
</style>