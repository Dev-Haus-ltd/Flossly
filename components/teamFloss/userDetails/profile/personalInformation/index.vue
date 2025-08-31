<template>

    <MyProfileProfile
    :user="user"
    />
</template>

<script setup>
const { user } = defineProps({
  user: Object
})
</script>