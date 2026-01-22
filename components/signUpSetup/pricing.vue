<template>
  <PricingModal ref="pricingModalRef" :show-back="true" />
</template>

<script setup>
import PricingModal from "./PricingModal.vue";

const pricingModalRef = ref(null);

const isPaymentOpen = computed(() => {
  const exposed = pricingModalRef.value?.isPaymentOpen;
  if (typeof exposed === "object" && exposed && "value" in exposed) {
    return Boolean(exposed.value);
  }
  return Boolean(exposed);
});

const selectedPriceId = computed(() => {
  return pricingModalRef.value?.selectedPriceId || null;
});

const isPaymentCompleted = computed(() => {
  return pricingModalRef.value?.isPaymentCompleted || false;
});

const loading = computed(() => {
  const exposed = pricingModalRef.value?.loading;
  if (typeof exposed === "object" && exposed && "value" in exposed) {
    return Boolean(exposed.value);
  }
  return Boolean(exposed);
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
