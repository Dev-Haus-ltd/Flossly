<template>
  <div class="">
    <v-avatar :color="getRandomHexColor()" :size="props.size">
      <!-- <v-icon v-if="!props?.user?.photo" icon="mdi-account-circle"></v-icon> -->
      <v-img
        v-if="props?.user?.photo || props?.user?.logo"
        alt="John"
        :src="props?.user?.photo || props?.user?.logo"
      ></v-img>
      <span v-else>{{ getInitials() }}</span> 
    </v-avatar>
  </div>
</template>
<script setup> 
const props = defineProps({
  user: Object,
  size: {
    type: String,
    default: '34px'
  }
})
const getInitials = () => {
  const name = props?.user?.fullName || props.user.name || props.user.title; 
  const splittedName = name.split(" ");
  if (splittedName[1]) {
    return (
      splittedName[0].charAt(0).toUpperCase() +
      splittedName[1].charAt(0).toUpperCase()
    );
  } else return splittedName[0].charAt(0).toUpperCase();
};

const getRandomHexColor = () => {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}
</script>
