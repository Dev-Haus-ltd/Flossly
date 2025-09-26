<template>
  <v-container>
    <v-row v-if="prices && !selectedPriceId">
      <v-col
        v-for="(plan, index) in prices"
        :key="index"
        cols="12"
        sm="6"
        :md="col"
        :lg="col"
      >
        <v-card
          class="pa-7 d-flex flex-column justify-space-between"
          height="510"
          :elevation="0"
          :style="{
            border: '1px solid #DCDCDC',
            borderRadius: '40px',
            backgroundColor: plan.product.name === 'Flossly - Glide Package' ? '#EFF5F5' : plan.bgColor
          }"
        >
          <div>
            <div class="font-title mb-1">{{ plan.product.name }}</div>
            <div class="font-subtitle text-grey-darken-1 mb-4">
              {{ plan.description }}
            </div>

            <!-- Price -->
            <div class="font-price mb-1">
              {{ formatPrice(plan.unit_amount, plan.currency) }}
            </div>
            <div class="font-price-desc mb-6">
              Per user/month, billed monthly
            </div>

            <!-- Core Features -->
            <div class="font-section-title mb-2">Core Features</div>
            <div
              v-for="(feature, i) in features.find(
                (x) => x.type === plan.product.name
              )?.features"
              :key="i"
              class="flex items-start gap-2 mt-2"
            >
              <div class="d-flex align-center mt-3">
                <img
                  src="@/assets/icons/checkbox.svg"
                  alt="checkbox"
                  class="mr-2"
                style="width: 20px; height: 20px;"
                />

                <!-- Label with tooltip -->
                <v-tooltip v-if="feature.length > 30" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      class="feature-statement"
                      :title="feature"
                    >
                      {{ feature }}
                    </span>
                  </template>

                  <!-- Tooltip text goes here -->
                  {{ feature }}
                </v-tooltip>

                <span v-else style="font-size: 14px">
                  {{ feature }}
                </span>
              </div>
              <!-- Checkbox image -->
            </div>
          </div>
          <v-btn
            color="primary"
            class="font-button mt-4"
            :disabled="licenseType === plan.product.id"
            @click="handleSubscribe(plan.id)"
          >
            <span v-if="licenseType === plan.product.id">Active</span>
            <span v-else-if="!licenseType">Start Now</span>

            <span v-else>Upgrade</span>
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
    <v-card
      v-else-if="selectedPriceId && !isPaymentCompleted"
      :elevation="0"
      flat
      rouneded="lg"
      class="pa-4"
    >
      <v-card-title>Payment Details</v-card-title>

      <v-card-text>
        <div id="payment-element" class="pa-2" />
        <div v-if="error" class="text-red">{{ error }}</div>
      </v-card-text>
      <br />

      <v-btn @click="confirmPayment" flat color="primary"> Checkout </v-btn>
    </v-card>
    <v-card
      v-else-if="selectedPriceId && isPaymentCompleted"
      class="pa-5"
      :elevation="0"
      rouneded="lg"
      flat
    >
      <h1>Thankyou for choosing Flossly...</h1>
      <p>
        You can safely navigate to your flossly dashboard and start using the
        application
      </p>
      <v-btn @click="gotoHome" flat color="primary"> Dashboard </v-btn>
    </v-card>
    <v-overlay
      v-model="loading"
      contained
      class="justify-center align-center full-page"
    >
      <div class="loader">
        <lottie-player
          src="/loader.json"
          background="transparent"
          speed="1"
          style="width: 200px; height: 200px"
          loop
          autoplay
        />
      </div>
    </v-overlay>
  </v-container>
</template>
<script setup>
import { useStripe } from "@/composables/useStripe";

const {
  prices,
  selectedPriceId,
  loading,
  isPaymentCompleted,
  error,
  fetchPrices,
  confirmPayment,
  formatPrice,
  handleSubscribe,
} = useStripe();
console.log(prices)
const props = defineProps({
  col: {
    type: String,
    default: "4",
  },
});

// get license type from localStorage
const user = JSON.parse(localStorage.getItem("user") || "{}");
const licenseType = user?.preferences?.licenseType || null;

const features = ref([
  {
    type: "Flossly - Drift Package",
    features: [
      "Secure User Auth (Login, Registration, Profile, Forgot Password)",
      "Task Management (Assign, Track, Complete - for you & your staff)",
      "HR Essentials(Time-off tracking,Staff list,Profile & policy docs)",
      "Document Management (Folders, Uploads)",
      "Basic Notifications (task updates, onboarding emails)",
    ],
    licenseType: "drift",
  },
  {
    type: "Flossly - Glide Package",
    features: [
      "Full HR Management (Onboarding workflows, policies, reviews)",
      "Organisation Management (Multi-org login, Role-based views)",
      "Staff Management (Add/manage staff, assign tasks)",
      "Advanced Notifications (promos, approvals)",
      "Rota Scheduling (assign/view staff shifts)",
      "Holiday Approvals (by manager)",
      "Team Payroll Overview",
      "Invoicing (Manual, pre-QB)",
    ],
    licenseType: "Monthly",
  },
  {
    type: "Flossly - Soar Package",
    features: [
      "Everything in Glide PLUS",
      "AI Assistant(AI-generated task suggestions,Smart staff scheduling suggestions)",
      "HR document assistant (AI-generated policies, templates)",
      "Email & social content writing (coming soon)",
      "Full Payroll + Invoice Management(Integrated with QuickBooks)",
      "Dedicated Onboarding + Migration",
      "Dedicated Account Manager",
      "API & Integration Support",
    ],
    licenseType: "soar",
  },
]);

const gotoHome = () => {
  const router = useRouter();
  router.push("/");
};

onMounted(fetchPrices);
</script>

<style scoped>
.font-title {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 20px;
  line-height: 100%;
}

.font-subtitle {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 12px;
  line-height: 100%;
}

.font-price {
  font-family: "Poppins";
  font-weight: 700;
  font-size: 30px;
  line-height: 100%;
}

.font-price-desc {
  font-family: Poppins;
font-weight: 400;
font-style: Regular;
font-size: 14px;
color: #878787;

}

.font-section-title {
  font-family: "Poppins";
  font-weight: 700;
  font-size: 14px;
  line-height: 100%;
}

.font-feature {
  font-family: "Poppins";
  font-weight: 400;
  font-size: 14px;
}

.font-button {
  font-family: "Poppins";
  font-weight: 500;
  font-size: 14px;
  text-transform: none;
  height: 42px;
}
::v-deep(.v-selection-control) {
  align-items: baseline !important;
}
#payment-element {
  min-height: 50px;
  border: 1px solid #e0e0e0;
  padding: 12px;
  border-radius: 6px;
}
.feature-statement {
  max-width: 250px;
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: #414141;
  font-family: Poppins;
font-weight: 400;
font-style: Regular;
font-size: 14px;


}
</style>
