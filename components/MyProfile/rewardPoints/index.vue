<template>
  <div class="mt-5">
    <div class="rewards-card d-flex align-center rounded-xl pa-4">
      <!-- Icon -->
      <lord-icon
        src="https://cdn.lordicon.com/uihwbzln.json"
        trigger="hover"
        style="width: 86px; height: 86px"
      >
      </lord-icon>

      <!-- Text -->
      <div class="ml-4 mt-2">
        <div class="rewards-title">My Rewards Points</div>
        <div class="rewards-points">{{ userBalance }}</div>
      </div>
    </div>
    <h5 class="sub-head mt-5">Points History</h5>
    <div class="mt-5">
      <MyProfileRewardPointsRewardItem
        :tasks="history"
      />
    </div>
  </div>
</template>

<script setup>
const pointStore = usePointStore()
const history = ref([])
const user = ref({})
onMounted(() => {
  user.value = JSON.parse(localStorage.getItem('user'))
  getRewardHistory()
})
const getRewardHistory = () => {
  pointStore.getPointHistory().then((res) => {
    if (res.code === 0) {
      history.value = res.data
    }
  })
}
const userBalance = computed(() => {
  return user?.userPoints?.[0]?.balance ?? 0;
});
</script>

<style scoped>
.rewards-card {
  width: 100%;
  background: linear-gradient(to right, #2f4d4e 0%, #213536 10%, #213536 100%);
  color: #fff;
}

.rewards-title {
  font-family: Poppins;
  font-weight: 400;
  font-size: 16px;
  color: #ffffff;
}

.rewards-points {
  font-family: Poppins;
  font-weight: 600;
  font-size: 32px;
  color: #ffffff;
}
.sub-head {
  font-family: "Poppins";
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
}
</style>
