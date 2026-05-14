<template>
  <v-app-bar
    elevation="0"
    height="70"
    class="pr-5 cust-border bg-secondary"
    :style="{ top: 'var(--trial-banner-height, 0px)' }"
  >
    <v-btn icon class="d-md-none" @click="handleDrawer">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
    <template v-slot:prepend>
      <div 
        :class="
          !rail
            ? 'logo-parent pl-5 bg-secondary'
            : 'logo-parent-sm pl-3 bg-secondary'
        "
      >
        <div class="logo-wrapper">
          <!-- Expanded state: plan-specific logo -->
          <template v-if="!rail">
            <img
              v-if="!smAndDown"
              :src="planLogo"
              :alt="planLogoAlt"
              height="36"
              style="max-width: 160px; object-fit: contain"
            />
            <img
              v-else
              :src="logoIcon"
              alt="Flossly"
              width="30"
              height="100%"
            />
          </template>

          <!-- Collapsed state: only icon -->
          <template v-else>
            <img
              :src="logoIcon"
              alt="My Logo"
              width="30"
              height="100%"
            />
          </template>
        </div>
      </div>
    </template>
    <!-- Middle: Spacer to push icons right -->
    <!-- <CommonDashboardHeaderContent
      title="Flossy Dashboard"
      subTitle=" Stay organized, track progress, and collaborate seamlessly with your team. Your tasks, simplified"
    /> -->
    <v-spacer />

    <!-- Right: Icon -->
    <div class="d-flex align-center">
      <CommonRewardChip
        :text="user?.userPoints?.balance"
        tooltip="Reward points"
      />
      <!-- <v-text-field
        placeholder="Search..."
        append-inner-icon="mdi-magnify"
        variant="solo"
        flat
        hide-details
        density="compact"
        bg-color="#F3F6FA"
        rounded="xl"
        class="mx-3"
        style="width: 202px"
      /> -->
      <AppBarNottficationMenu />
      <appBarRightMenu :user="props.user" />
    </div>
  </v-app-bar>
</template>

<script setup>
const { user } = useUser();
import { useDisplay } from "vuetify";
import logoIcon from "@/assets/logos/Logoicon2.svg";
import logoLiteSvg from "/logo-appbar/lite.svg";
import logoCrmSvg from "/logo-appbar/crm.svg";
import logoProSvg from "/logo-appbar/pro.svg";
const emit = defineEmits(["small-screen-drawer"]);
const { smAndDown } = useDisplay();
const authStore = useAuthStore();

const LEGACY_MAP = { System: 'Pro', Trial: 'Lite', Drift: 'Lite', Glide: 'CRM', Soar: 'Pro' };
const resolvedPlan = computed(() => {
  const lt = authStore.loggedUser?.licenseType ?? 'Lite';
  return LEGACY_MAP[lt] ?? lt;
});

const planLogo = computed(() => {
  if (resolvedPlan.value === 'CRM') return logoCrmSvg;
  if (resolvedPlan.value === 'Pro') return logoProSvg;
  return logoLiteSvg;
});

const planLogoAlt = computed(() => {
  if (resolvedPlan.value === 'CRM') return 'Flossly CRM';
  if (resolvedPlan.value === 'Pro') return 'Flossly Pro';
  return 'Flossly Lite';
});

const props = defineProps({
  drawer: Boolean,
  user: Object,
  rail: Boolean,
});

const handleDrawer = () => {
  emit("small-screen-drawer",!props.rail);
};

</script>

<style scoped>
.logo-parent {
  width: 255px;
  /* background-color: black; */
  height: 100%;
  margin-left: 20px; /* spacing from logo */
}
.logo-parent-sm {
  width: 70px;
  /* background-color: black; */
  height: 100%;
}
.cust-border { border-bottom: 1px solid rgba(0,0,0,0.08); }
::v-deep(.v-toolbar__prepend) {
  margin-inline: 0 !important;
}
.logo-wrapper {
  display: flex;
  align-items: center; /* align title vertically with logo */
  height: 100%;
}
</style>
