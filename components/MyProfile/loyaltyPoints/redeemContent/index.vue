<template>
  <div>
    <h3 class="head mb-5">Redeem Prizes</h3>
    <v-row>
      <v-col cols="12" sm="6" md="2" v-for="item in redeemCards" :key="item.id">
        <MyProfileLoyaltyPointsRedeemContentRedeemCard
          :id="item.id"
          :img="item.img"
          :points="item.points"
          :title="item.title"
          @emitCardId="handleRedeem"
        />
      </v-col>
    </v-row>

    <v-row class="mt-5" v-if="isRedeem">
      <!-- Left Column -->
      <v-col cols="12" md="5" class="d-flex">
        <MyProfileLoyaltyPointsRedeemContentSummaryCard
          :img="AmazoneImg"
          title="Nandos Gift Card"
          :points="500"
          description="Enjoy Nandos Gift Card, avail it at any Nandos branch."
          :remainingPoints="1200"
        />
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="7" class="d-flex">
        <v-card class="custom-card pa-4 flex-grow-1" :elevation="0">
          <v-row class="mt-3">
            <v-col cols="12" md="7" class="pr-2">
              <v-label class="mb-1 field-label">Delivery Address</v-label>
              <v-text-field
                v-model="deliveryAddress"
                hide-details
                variant="solo"
                density="compact"
                class="input-bordered"
                flat
              />
            </v-col>

            <v-col cols="12" md="5">
              <v-label class="mb-1 field-label">Postal Code</v-label>
              <v-text-field
                v-model="postalCode"
                hide-details
                variant="solo"
                density="compact"
                class="input-bordered"
                flat
              />
            </v-col>
          </v-row>

          <v-btn
            color="primary"
            class="mt-4 w-100"
            style="font-weight: 500; text-transform: none"
            @click="redeem"
          >
            Redeem
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup>
import AmazoneImg from "@/assets/images/myProfile/redeem/amazon.svg";
import NandosImg from "@/assets/images/myProfile/redeem/nandos.svg";
import IpadImg from "@/assets/images/myProfile/redeem/ipad.svg";
import SpaImg from "@/assets/images/myProfile/redeem/spa.svg";
import MacImg from "@/assets/images/myProfile/redeem/macbook.svg";
const isRedeem = ref(false);
const deliveryAddress = ref("");
const postalCode = ref("");

const redeem = () => {
  console.log("Redeem request:", {
    deliveryAddress: deliveryAddress.value,
    postalCode: postalCode.value,
  });
  // Use global snackbar instead of alert
  try {
    const store = useMainStore && useMainStore();
    if (store && store.setSnackbar) {
      store.setSnackbar({ title: 'Redeem request submitted', type: 'success' });
      return;
    }
  } catch (e) {}
  alert("Redeem request submitted ✅");
};

const redeemCards = [
  {
    id: 1,
    img: AmazoneImg,
    title: "Amazon Gift Card",
    points: "500",
  },
  {
    id: 2,
    img: NandosImg,
    title: "Starbucks Voucher",
    points: "300",
  },
  {
    id: 3,
    img: IpadImg,
    title: "Spotify Premium",
    points: "700",
  },
  {
    id: 4,
    img: SpaImg,
    title: "Uber Credits",
    points: "450",
  },
  {
    id: 5,
    img: MacImg,
    title: "Uber Credits",
    points: "450",
  },
];
const handleRedeem = (id) => {
  console.log("Redeem clicked for card id:", id);
  if (id) {
    isRedeem.value = true;
  }
};
</script>

<style scoped>
.head {
  
  font-weight: 600;
  font-style: SemiBold;
  font-size: 16px;
  color: #1e1e1e;
}
.custom-card {
  border: 1px solid #60e5a3;
  border-radius: 12px;
  background: #fff;
}

.card-title {
  
  font-weight: 600;
  font-size: 16px;
  color: #1e1e1e;
}

.card-detail {
  
  font-size: 14px;
  color: #737373;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}

.field-label {
  
  font-size: 13px;
  font-weight: 500;
  color: #1e1e1e;
  display: block;
}
</style>
