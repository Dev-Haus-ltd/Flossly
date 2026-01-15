<template>
  <v-container style="min-height: 100vh">
    <v-card class="pa-4" rounded="xl" :elevation="0" flat>
      <v-card-text>
        <SignUpSetupPricing ref="pricingRef" :show-cta="false" />
      </v-card-text>
    </v-card>
    <div class="subscription-actions" v-if="!isPaymentOpen">
      <v-btn class="subscription-back" variant="tonal" color="grey-darken-1" @click="goBack">
        Back
      </v-btn>
      <v-btn class="subscription-checkout" color="primary" variant="flat" @click="startCheckout">
        Checkout
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { useStripe } from "@/composables/useStripe";
const router = useRouter();
const pricingRef = ref(null);

const { currSubscription, getCurrentSubscription } = useStripe();

onMounted(getCurrentSubscription)

const goBack = () => {
  router.back();
};

const isPaymentOpen = computed(() => {
  return Boolean(pricingRef.value?.isPaymentOpen);
});

const startCheckout = () => {
  pricingRef.value?.startCheckout?.();
};

</script>

<style scoped>
.subscription-actions {
  display: flex;
  justify-content: flex-start;
  gap: 12px;
  margin-top: 16px;
}

.subscription-back,
.subscription-checkout {
   height: 36px;
  min-width: 120px;
  font-size: 13px;
}
</style>

