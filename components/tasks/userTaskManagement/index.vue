<template>
  <div>
    <!-- Breadcrumb -->
    <div class="cust-border d-flex align-center">
      <p class="mr-1" @click="goBack()" style="color: #0165B9; cursor: pointer;">
        Flossy Tasks
      </p>
      <p v-if="userName">
        {{ " / " + userName }}
      </p>
    </div>

    <!-- Show My Tasks component if it's the current user, otherwise Team Tasks -->
    <TasksMyTasks v-if="isCurrentUser" />
    <TasksTeamTasks v-else :specificUserId="userId" />
  </div>
</template>

<script setup>
definePageMeta({
  layout: "home",
});

const route = useRoute();
const router = useRouter();
const user = ref({});
const userId = ref(null);
const userName = ref('');

// Check if viewing current user's tasks
const isCurrentUser = computed(() => {
  return user.value?.id && userId.value && user.value.id === userId.value;
});

onMounted(() => {
  if (localStorage.getItem("user")) {
    user.value = JSON.parse(localStorage.getItem("user"));
  }
  
  // Get the user ID from route params
  userId.value = parseInt(route.params.id);
  
  // Optionally get user name from query params if passed
  if (route.query.name) {
    userName.value = route.query.name;
  }
});

const goBack = () => {
  router.push('/tasks');
};
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  background-color: white;
}

.cust-border p {
  font-size: 12px;
  color: #c3c3c3;
}
</style>
