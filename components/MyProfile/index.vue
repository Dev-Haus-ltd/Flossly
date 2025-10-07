<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      My Profile
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
    </v-card-title>

    <v-divider />

    <v-card-text class="px-5 py-0" style="max-height: 100%; overflow: auto">
      <div class="d-flex">
        <!-- Sidebar -->
        <CommonSideBar
          :items="menuItems"
          :selected="selectedSection"
          @select="selectedSection = $event"
          class="mr-4 sidebar"
        />

        <!-- Main Content -->
        <div class="flex-grow-1" style="margin-left: 200px; height: 85vh">
          <component v-if="selectedSection" :is="currentComponent" :user="user" :bankDetails="acccoutDetails" :contractDetails="contractDetails" />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
// Dummy components for each section
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

const { user } = defineProps({
  user: Object
})
console.log(user)
const authStore = useAuthStore()
const acccoutDetails = ref({})
const contractDetails = ref({})

// Sidebar menu items
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
  { key: "loyalty", label: "Loaylty Points", icon: LoyaltyImg },
  { key: "hrDocs", label: "Hr Documents", icon: PaymentImg },
]);
const addMembership=()=>{
  if (user?.roleId === 1 || user?.roleId === 8) {
  menuItems.value.splice(4, 0, { 
    key: "membership", 
    label: "Membership", 
    icon: MembershipImg 
  })
}
}

onMounted(() => {
  getAccount()
  getContract()
addMembership()


})

const getAccount = () => {
  authStore.getAccountDetails().then((res) => {
    if (res.code === 0) {
      acccoutDetails.value = res.data
    }
  })
}
const getContract = () => {
  authStore.getContractDetails().then((res) => {
    if (res.code === 0) {
      contractDetails.value = res.data
    }
  })
}
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
</script>
<style scoped>
.sidebar {
  height: 85vh;
  min-width: 200px;
  top: 65px;
  left: 0;
  position: fixed;
}
</style>
