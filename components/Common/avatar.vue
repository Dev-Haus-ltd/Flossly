<template>
  <div class="">
    <v-avatar :color="getRandomHexColor()" :size="props.size">
      <!-- <v-icon v-if="!props?.user?.photo" icon="mdi-account-circle"></v-icon> -->
      <v-img
        v-if="(props?.user?.photo || props?.user?.logo) && !imageError"
        alt="John"
        :src="props?.user?.photo || props?.user?.logo"
        @error="handleImageError"
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

const imageError = ref(false)

const handleImageError = () => {
  imageError.value = true
}

const getInitials = () => {
  const name = props?.user?.fullName || props.user.name || props.user.title; 
  if (!name) return '?'
  const splittedName = name?.split(" ");
  if (splittedName[1]) {
    return (
      splittedName[0].charAt(0).toUpperCase() +
      splittedName[1].charAt(0).toUpperCase()
    );
  } else return splittedName[0].charAt(0).toUpperCase();
};

const getRandomHexColor = () => {
  const name = props?.user?.fullName || props.user.name || props.user.title; 
  if (!name) return '#999999'
  const firstChar = name.trim().charAt(0).toUpperCase()
  const colors = [
    '#FF6B6B', '#FF8E72', '#FFD93D', '#6BCB77', '#4D96FF', '#8358E8',
    '#FF6EC7', '#00B8A9', '#F15BB5', '#FF7F11', '#FF9F1C', '#2EC4B6',
    '#6A4C93', '#8338EC', '#3A86FF', '#FF006E', '#FB5607', '#FFBE0B',
    '#06D6A0', '#118AB2', '#073B4C', '#EF476F', '#06AED5', '#4CC9F0',
    '#8AC926', '#FF595E'
  ]
  const index = firstChar.charCodeAt(0) - 65
  return index >= 0 && index < 26 ? colors[index] : '#999999'
}

// Reset imageError when user or photo changes
watch(() => [props?.user?.photo, props?.user?.logo], () => {
  imageError.value = false
})

</script>
