import { ref } from "vue";
import { loadStripe } from "@stripe/stripe-js";

export const useStripe = () => {
  const prices = ref([]);
  const selectedPriceId = ref(null);
  const loading = ref(false);
  const error = ref("");
  const elementsRef = ref(null);
  const paymentElementRef = ref(null);
  const paymentElementMounted = ref(false);
  const isPaymentElementComplete = ref(false);
  const subscription = ref(null);
  const currSubscription = ref(null)
  const isPaymentCompleted = ref(false)
  const config = useRuntimeConfig();
  const stripePromise = loadStripe(config.public.Stripe_PK);

  const fetchPrices = async () => {
    try {
      const res = await $fetch("/api/stripe/prices");
      if (res.code === 0) {
        const all = Array.isArray(res.data) ? res.data : [];
        const monthly = all.filter((p) => p?.recurring?.interval === "month");
        const candidates = monthly.length ? monthly : all;
        const sorted = [...candidates].sort(
          (a, b) => Number(b?.created || 0) - Number(a?.created || 0)
        );
        const deduped = [];
        const seen = new Set();
        sorted.forEach((p) => {
          const key = p?.product?.id || p?.product?.name || p?.id;
          if (!key || seen.has(key)) return;
          seen.add(key);
          deduped.push(p);
        });
        prices.value = deduped;
      } else {
        console.error("Failed to fetch prices", res.error);
      }
    } catch (err) {
      console.error("fetchPrices error", err);
    }
  };
  const formatPrice = (amount, currency) => {
    if (!amount) return "";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency?.toUpperCase() || "GBP",
    }).format((amount || 0) / 100);
  };

  const mountPaymentElement = async (clientSecret) => {
    const stripe = await stripePromise;
    elementsRef.value = stripe.elements({ 
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorText: '#1e1e1e',
          colorDanger: '#d32f2f',
          fontFamily: '"Inter", sans-serif',
          fontSizeBase: '14px',
          spacingUnit: '4px',
        },
        rules: {
          '.Input': {
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
          },
          '.Input--invalid': {
            color: '#F44336',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
          },
          '.Error': {
            color: '#F44336',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: '400',
            lineHeight: '1.4',
          },
          '.ErrorMessage': {
            color: '#F44336',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: '400',
            lineHeight: '1.4',
          },
          '.InputError': {
            color: '#F44336',
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
            fontWeight: '400',
            lineHeight: '1.4',
          },
          '.Label': {
            fontSize: '14px',
            fontFamily: '"Inter", sans-serif',
          },
        }
      }
    });
    const paymentEl = elementsRef.value.create("payment");
    paymentElementRef.value = paymentEl;
    const mountNode = document.getElementById("payment-element");
    if (mountNode) {
      mountNode.innerHTML = "";
      paymentEl.mount(mountNode);
      
      // Listen to Stripe Element changes to track completeness and errors
      paymentEl.on('change', (event) => {
        // Track if the payment element is complete and valid
        // The element is complete when it's not empty, has no errors, and is marked as complete
        const isComplete = !event.empty && !event.error && (event.complete === true);
        isPaymentElementComplete.value = isComplete;
        
        // Clear any previous errors when fields are being filled and valid
        if (isComplete) {
          error.value = "";
        }
        
        if (event.error) {
          console.log('Stripe Element change event:', event);
          console.log('Error message:', event.error?.message);
          console.log('Error type:', event.error?.type);
          // Reset completeness when there's an error
          isPaymentElementComplete.value = false;
        }
      });
    }
    paymentElementMounted.value = true;
    loading.value = false
  };

  const handleSubscribe = async (priceId) => {
    selectedPriceId.value = priceId;
    if (paymentElementMounted.value) {
      const mountNode = document.getElementById("payment-element");
      if (mountNode) mountNode.innerHTML = "";
      paymentElementMounted.value = false;
      paymentElementRef.value = null;
      isPaymentElementComplete.value = false;
    }
    loading.value = true;
    error.value = "";

    try {
      const res = await $fetch("/api/stripe/create-subscription", {
        method: "POST",
        body: { priceId: selectedPriceId.value },
      });

      if (res.code !== 0) {
        error.value = res.error || "Failed to create subscription";
        loading.value = false;
        return;
      }

      const clientSecret = res.data.clientSecret;
      subscription.value = res.data.subscription;

      if (!clientSecret) {
        loading.value = false;
        error.value =
          "No payment required — subscription created. Check your account.";
        return;
      }
      await mountPaymentElement(clientSecret);
    } catch (err) {
      console.error("subscribe err", err);
      error.value = err.message || "Something went wrong";
      loading.value = false;
    }
  };

  const confirmPayment = async () => {
    // Clear previous errors
    error.value = "";
    
    // Check if payment element is mounted
    if (!paymentElementRef.value || !elementsRef.value) {
      error.value = "Payment form is not ready. Please wait a moment and try again.";
      return;
    }

    loading.value = true;
    const stripe = await stripePromise;
    
    try {
      const result = await stripe.confirmPayment({
        elements: elementsRef.value,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.href,
        },
      });

      if (result.error) {
        // Stripe will return an error if the form is incomplete or invalid
        // This handles cases where the change event didn't catch the incomplete state
        error.value = result.error.message || "Payment confirmation failed";
        loading.value = false;
        return;
      } else {
        const res = await $fetch("/api/stripe/confirmPayment", {
          method: "POST",
          body: { subscriptionId: subscription.value.id },
        });
        loading.value = false;
        if (res.code !== 0) {
          error.value = res.data.message || res.error || "Payment confirmation failed";
        } else {
          isPaymentCompleted.value = true;
        }
      }
    } catch (err) {
      console.error("confirmPayment error:", err);
      error.value = err.message || "An error occurred during payment confirmation";
      loading.value = false;
    }
  };
  const getCurrentSubscription = async () => {
    console.log('herere')
    try {
      loading.value = true
      error.value = null
      currSubscription.value = null

      const { data, error: fetchError } = await useFetch('/api/stripe/subscription')

      if (fetchError.value) {
        throw new Error(fetchError.value.message || 'Unable to fetch subscription')
      }

      currSubscription.value = data.value
      return currSubscription.value
    } catch (err) {
      error.value = err.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    prices,
    selectedPriceId,
    loading,
    error,
    fetchPrices,
    currSubscription,
    confirmPayment,
    isPaymentCompleted,
    getCurrentSubscription,
    formatPrice,
    handleSubscribe,
  };
};
