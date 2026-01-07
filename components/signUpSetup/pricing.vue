<template>
    <v-row v-if="prices && !selectedPriceId" class="pricing-row">
      <v-col
        v-for="(plan, index) in prices"
        :key="index"
        cols="12"
        sm="12"
        md="6"
        lg="6"
        xl="6"
        class="d-flex"
      >
        <v-card
          class="pa-6 pa-md-8 d-flex flex-column justify-space-between pricing-card"
          :elevation="0"
          :style="{
            border: '1px solid #DCDCDC',
            borderRadius: '24px',
            backgroundColor: plan.product.name === 'Flossly - Glide Package' ? '#EFF5F5' : plan.bgColor
          }"
        >
          <div class="card-content flex-grow-1">
            <div class="font-title mb-2">{{ plan.product.name }}</div>
            <div class="font-subtitle text-grey-darken-1 mb-5">
              {{ plan.description }}
            </div>

            <!-- Price -->
            <div class="font-price mb-1">
              {{ formatPrice(plan.unit_amount, plan.currency) }}
            </div>
            <div class="font-price-desc mb-5">
              Per user/month, billed monthly
            </div>

            <!-- Core Features -->
            <div class="font-section-title mb-3">Core Features</div>
            <div
              v-for="(feature, i) in features.find(
                (x) => x.type === plan.product.name
              )?.features"
              :key="i"
              class="feature-item mb-2"
            >
              <div class="d-flex align-start">
                <img
                  src="@/assets/icons/checkbox.svg"
                  alt="checkbox"
                  class="mr-3 mt-1 flex-shrink-0"
                  style="width: 18px; height: 18px;"
                />

                <!-- Label with tooltip -->
                <v-tooltip v-if="feature.length > 30" location="top">
                  <template #activator="{ props }">
                    <span
                      v-bind="props"
                      class="feature-text"
                      :title="feature"
                    >
                      {{ feature }}
                    </span>
                  </template>

                  <!-- Tooltip text goes here -->
                  {{ feature }}
                </v-tooltip>

                <span v-else class="feature-text">
                  {{ feature }}
                </span>
              </div>
              <!-- Checkbox image -->
            </div>
          </div>
          <div class="card-footer mt-6">
            <v-btn
              variant="flat"
              rounded="lg" size="x-large"
              color="primary"
              class="font-button"
              block
              :disabled="licenseType === plan.product.id"
              @click="handleSubscribe(plan.id)"
            >
              <span v-if="licenseType === plan.product.id">Active</span>
              <span v-else-if="!licenseType">Start Now</span>

              <span v-else>Upgrade</span>
            </v-btn>
          </div>
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
const licenseType = user?.preferences[0]?.licenseType || null;

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

// Expose helpers for parent (onboarding) to manage back navigation
const isPaymentOpen = computed(() => {
  return Boolean(selectedPriceId.value) && !isPaymentCompleted.value;
});

const cancelPaymentFlow = () => {
  // Reset the selection to go back to pricing cards
  selectedPriceId.value = null;
  // Also clear any previous error state
  if (error.value) error.value = "";
};

defineExpose({ isPaymentOpen, cancelPaymentFlow });
</script>

<style scoped>
.pricing-row {
  margin: 0 -12px;
}

.pricing-row > .v-col {
  padding: 12px;
}

.pricing-card {
  width: 100%;
  min-height: 600px;
  height: auto;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

/* Ensure equal height cards in the same row */
.d-flex > .pricing-card {
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-footer {
  flex-shrink: 0;
  margin-top: auto;
}

.font-title {
  
  font-weight: 400;
  font-size: 20px;
  line-height: 100%;
}

.font-subtitle {
  
  font-weight: 400;
  font-size: 12px;
  line-height: 100%;
}

.font-price {
  
  font-weight: 700;
  font-size: 30px;
  line-height: 100%;
}

.font-price-desc {
  
font-weight: 400;
font-style: Regular;
font-size: 14px;
color: #878787;

}

.font-section-title {
  
  font-weight: 700;
  font-size: 14px;
  line-height: 100%;
}

.font-feature {
  
  font-weight: 400;
  font-size: 14px;
}

.font-button {
  font-weight: 500;
  font-size: 14px;
  text-transform: none;
  height: 44px !important;
  letter-spacing: 0.5px;
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

/* Style Stripe payment element error messages consistently */
/* Target Stripe Elements error messages - these are the classes Stripe uses */
#payment-element :deep(.p-Input--empty),
#payment-element :deep(.p-ErrorMessage),
#payment-element :deep(.p-InputError),
#payment-element :deep(.FieldError),
#payment-element :deep([class*="error"]),
#payment-element :deep([class*="ErrorMessage"]),
#payment-element :deep([class*="InputError"]),
#payment-element :deep([class*="FieldError"]) {
  font-family: inherit !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #d32f2f !important;
  line-height: 1.4 !important;
}

/* Target all error text elements within Stripe payment element */
#payment-element :deep(.p-InputError::before),
#payment-element :deep(.FieldError::before),
#payment-element :deep([class*="error"]::before) {
  display: none;
}

/* Ensure consistent styling for all field error messages - comprehensive selectors */
#payment-element :deep(span[class*="error"]),
#payment-element :deep(div[class*="error"]),
#payment-element :deep(p[class*="error"]),
#payment-element :deep(label[class*="error"]),
#payment-element :deep(*[class*="ErrorMessage"]),
#payment-element :deep(*[class*="InputError"]),
#payment-element :deep(*[class*="FieldError"]) {
  font-family: inherit !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  color: #d32f2f !important;
  line-height: 1.4 !important;
}
.feature-item {
  line-height: 1.5;
}

.feature-text {
  font-weight: 400;
  font-size: 14px;
  line-height: 1.6;
  color: #414141;
  display: block;
}

/* For responsive screens */
@media (max-width: 1280px) {
  .pricing-row {
    margin: 0 -8px;
  }
  
  .pricing-row > .v-col {
    padding: 8px;
  }
  
  .pricing-card {
    min-height: 550px;
  }
}

@media (max-width: 960px) {
  .pricing-card {
    min-height: auto;
  }
  
  .pricing-row {
    margin: 0 -4px;
  }
  
  .pricing-row > .v-col {
    padding: 4px;
  }
}

@media (max-width: 600px) {
  .pricing-card {
    min-height: auto;
    padding: 20px !important;
  }
}
</style>
