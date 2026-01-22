<template>
  <div class="pb-5">
    <v-row align="stretch" class="mb-8">
      <v-col v-for="card in cards" :key="card.id" cols="12" sm="6" md="3">
        <MyProfileLoyaltyPointsRewardsContentRewardPointsCard
          :id="card.id"
          :img="card.img"
          :points="card.points"
          :title="card.title"
          :detail="card.detail"
          :link-label="card.linkLabel"
          @emit-card-id="handleCardClick"
        />
      </v-col>
    </v-row>
    <MyProfileRewardPointsRewardItem
      :tasks="history"
    />
    <MyProfileLoyaltyPointsRewardsContentRecommendPracticeDialog
      v-model="showReferralDialog"
    />
    <MyProfileLoyaltyPointsRewardsContentFeedBackDialog
      v-model="openFeedbackDialog"
      @onSubmit="handleSubmit"
    />
  </div>
</template>

<script setup>
import RecommendImg from "@/assets/images/myProfile/loyalty/recommend.svg";
import GoogleImg from "@/assets/images/myProfile/loyalty/review.svg";
import SocialImg from "@/assets/images/myProfile/loyalty/social.svg";
import FeedBackImg from "@/assets/images/myProfile/loyalty/feedback.svg";

const showReferralDialog = ref(false);
const openFeedbackDialog = ref(false);
const pointStore = usePointStore()
const history = ref([])
onMounted(() => {
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
  if (!history.value?.length) return 0;

  return history.value.reduce((total, item) => {
    return total + (item?.points ?? 0);
  }, 0);
});
const cards = [
  {
    id: 1,
    img: RecommendImg,
    points: "2000",
    title: "Recommend a Practice",
    detail:
      "Invite a friend to experience Flossly's powerful tools, and you'll get 2000 points as soon as the join Flossly. Using these point you can redeem many prizes",
    linkLabel: "Refer a business",
  },
  {
    id: 2,
    img: GoogleImg,
    points: "500",
    title: "Google Review",
    detail:
      "Invite a friend to experience Flossly's powerful tools, and you'll get 2000 points. Using these point you can redeem many prizes",
    linkLabel: "Add google review",
  },
  {
    id: 3,
    img: SocialImg,
    points: "10",
    title: "Refer a Friend",
    detail:
      "Invite a friend to experience Flossly's powerful tools, and you'll get 2000 points. Using these point you can redeem many prizes",
    linkLabel: "Share",
  },
  {
    id: 4,
    img: FeedBackImg,
    points: "50",
    title: "Feedback Submission",
    detail:
      "Invite a friend to experience Flossly's powerful tools, and you'll get 2000 points. Using these point you can redeem many prizes",
    linkLabel: "Send Feedback",
  },
];
const handleCardClick = (id) => {
  if (id === 1) {
    showReferralDialog.value = true;
  } else if (id === 4) {
    openFeedbackDialog.value = true;
  }
};
const handleSubmit=()=>{
  getRewardHistory()
}
</script>
