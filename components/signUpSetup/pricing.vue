<template>
  <PricingModal ref="pricingModalRef" />
</template>

<script setup>
import PricingModal from "./PricingModal.vue";

const pricingModalRef = ref(null);

// Expose all the interface that signUpSetup.vue expects
const isPaymentOpen = computed(() => {
  return pricingModalRef.value?.isPaymentOpen || false;
});

const selectedPriceId = computed(() => {
  return pricingModalRef.value?.selectedPriceId || null;
});

const isPaymentCompleted = computed(() => {
  return pricingModalRef.value?.isPaymentCompleted || false;
});

const loading = computed(() => {
  return pricingModalRef.value?.loading || false;
});

const error = computed(() => {
  return pricingModalRef.value?.error || null;
});

const confirmPayment = () => {
  return pricingModalRef.value?.confirmPayment();
};

const startCheckout = () => {
  return pricingModalRef.value?.startCheckout();
};

const handleSubscribe = (priceId) => {
  return pricingModalRef.value?.handleSubscribe(priceId);
};

const cancelPaymentFlow = () => {
  return pricingModalRef.value?.cancelPaymentFlow();
};

const resetModal = () => {
  return pricingModalRef.value?.resetModal();
};

defineExpose({
  isPaymentOpen,
  selectedPriceId,
  isPaymentCompleted,
  loading,
  error,
  confirmPayment,
  startCheckout,
  handleSubscribe,
  cancelPaymentFlow,
  resetModal,
});
</script>