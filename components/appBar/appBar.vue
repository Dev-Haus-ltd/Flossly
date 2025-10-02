<template>
  <v-app-bar dark elevation="0" height="70" class="pr-5 cust-border bg-secondary">
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
        <img
          :src="!rail ? headerLogo : logoIcon"
          alt="My Logo"
          max-height="40"
          :width="!rail ? '107px' : '30px'"
          height="100%"
          contain
        />
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
import headerLogo from "@/assets/logos/headerLogo.svg";
import logoIcon from "@/assets/logos/Logoicon2.svg";
const emit = defineEmits(["small-screen-drawer"]);

const props = defineProps({
  drawer: Boolean,
  user: Object,
  rail: Boolean,
});
const handleDrawer = () => {
  emit("small-screen-drawer",!props.rail);
};
console.log(props.drawer);
watch(
  () => props.drawer,
  (newVal) => {
    console.log("Drawer changed:", newVal);
  }
);
</script>

<style scoped>
.logo-parent {
  width: 255px;
  /* background-color: black; */
  height: 100%;
}
.logo-parent-sm {
  width: 56px;
  /* background-color: black; */
  height: 100%;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
}
::v-deep(.v-toolbar__prepend) {
  margin-inline: 0 !important;
}
</style>
