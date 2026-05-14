<template>
  <v-dialog
    :model-value="dialogModel"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="560"
    scrollable
    :persistent="isProcessing"
  >
    <v-card rounded="xl" elevation="4" style="overflow: hidden">
      <!-- Header -->
      <v-toolbar flat color="white" height="56">
        <v-toolbar-title class="title-text pl-2">
          GoCardless Payment
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="closeDialog"
          class="mr-2"
          :disabled="isProcessing"
        >
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-divider />

      <!-- Body -->
      <v-card-text
        class="pa-5"
        style="background: #f9fafb; max-height: 60vh; overflow-y: auto"
      >
        <!-- Invoice Info Card -->
        <v-card
          elevation="0"
          rounded="xl"
          class="pa-4 mb-4"
          color="white"
          style="border: 1px solid #e5e7eb"
        >
          <v-row dense>
            <v-col cols="12">
              <div class="invoice-info">
                <div class="invoice-info__row">
                  <span class="invoice-info__label">Invoice</span>
                  <strong>{{ invoice?.invoiceNumber }}</strong>
                </div>
                <div class="invoice-info__row">
                  <span class="invoice-info__label">Amount Due</span>
                  <strong class="amount-due">
                    £{{ Number(invoice?.balance ?? 0).toFixed(2) }}
                  </strong>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>

        <!-- Customer Details Form -->
        <v-card
          elevation="0"
          rounded="xl"
          class="pa-4"
          color="white"
          style="border: 1px solid #e5e7eb"
        >
          <v-row dense>
            <!-- First Name -->
            <v-col cols="6">
              <label class="fld-lbl">
                First Name <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.firstName"
                placeholder="John"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.firstName"
                :error-messages="errors.firstName ? [errors.firstName] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- Last Name -->
            <v-col cols="6">
              <label class="fld-lbl">
                Last Name <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.lastName"
                placeholder="Doe"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.lastName"
                :error-messages="errors.lastName ? [errors.lastName] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- Email -->
            <v-col cols="12">
              <label class="fld-lbl">
                Email
                <span v-if="sendVia !== 'whatsapp'" class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.email"
                type="email"
                placeholder="john@example.com"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.email"
                :error-messages="errors.email ? [errors.email] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- Send Method -->
            <v-col cols="12">
              <label class="fld-lbl">Send Payment Via</label>
              <v-select
                v-model="sendVia"
                :items="sendMethodOptions"
                item-title="label"
                item-value="value"
                :item-disabled="(item) => item.disabled"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.sendVia"
                :error-messages="errors.sendVia ? [errors.sendVia] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
              <div class="text-caption mt-2" style="color: #64748b">
                {{
                  isWhatsAppAvailable
                    ? "Send the GoCardless link using Email, WhatsApp, or both."
                    : "WhatsApp is not configured. Only Email is available."
                }}
              </div>
              <v-alert
                v-if="
                  !resolvedPatientPhone &&
                  (sendVia === 'whatsapp' || sendVia === 'both')
                "
                type="warning"
                variant="tonal"
                class="mt-3"
                rounded="lg"
              >
                Patient phone number is required to send WhatsApp.
              </v-alert>
            </v-col>

            <!-- Address -->
            <v-col cols="12">
              <label class="fld-lbl">
                Address Line 1 <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.addressLine1"
                placeholder="27 Acer Road"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.addressLine1"
                :error-messages="
                  errors.addressLine1 ? [errors.addressLine1] : []
                "
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- City -->
            <v-col cols="6">
              <label class="fld-lbl">
                City <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.city"
                placeholder="London"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.city"
                :error-messages="errors.city ? [errors.city] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- Postal Code -->
            <v-col cols="6">
              <label class="fld-lbl">
                Postal Code <span class="req-star">*</span>
              </label>
              <v-text-field
                v-model="form.postalCode"
                placeholder="E8 3GX"
                variant="outlined"
                density="compact"
                class="mt-1"
                :error="!!errors.postalCode"
                :error-messages="errors.postalCode ? [errors.postalCode] : []"
                hide-details="auto"
                :disabled="isProcessing"
              />
            </v-col>

            <!-- Info Message -->
            <v-col cols="12" class="mt-2">
              <v-alert
                type="info"
                variant="tonal"
                closable
                class="text-caption"
                rounded="lg"
              >
                <template v-if="sendVia === 'email'">
                  A secure payment link will be emailed to the patient to
                  complete payment.
                </template>
                <template v-else-if="sendVia === 'whatsapp'">
                  A secure payment link will be sent to the patient via
                  WhatsApp.
                </template>
                <template v-else>
                  A secure payment link will be sent via Email and WhatsApp.
                </template>
              </v-alert>
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>

      <v-divider />

      <!-- Footer actions -->
      <v-card-actions class="pa-4" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="#6b7280"
          style="flex: 1; border-radius: 10px"
          @click="cancelAndClose"
          :disabled="isProcessing"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          style="flex: 1; border-radius: 10px"
          :loading="isProcessing"
          :disabled="isProcessing"
          @click="proceedToPayment"
        >
          Send payment link
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

<InvoiceDetailDialog
  v-if="invoice"
  ref="invoicePdfDialogRef"
  :invoice="invoice"
  :patient="patient"
  :printMode="true"
  class="hidden-invoice-generator"
/>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useAccountsStore } from "@/stores/accounts";
import { useMainStore } from "@/stores/index";
import { useWhapiStream } from "@/composables/useWhapiStream";
import goCardlessService from "@/services/goCardlessService";
import InvoiceDetailDialog from "@/components/patients/accounts/InvoiceDetailDialog.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  invoice: {
    type: Object,
    default: null,
  },
  patientName: {
    type: String,
    default: "",
  },
  patientEmail: {
    type: String,
    default: "",
  },
  patientPhone: {
    type: String,
    default: "",
  },
  patient: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "payment-link-sent"]);

const store = useAccountsStore();
const mainStore = useMainStore();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const { isWhatsAppConnected, loadWhapiStatus } = useWhapiStream();
console.log("WhatsApp connected:", isWhatsAppConnected.value);
const sendVia = ref("email");
const sendMethodOptions = computed(() => {
  const disabled = !isWhatsAppConnected.value;

  return [
    { label: "Email", value: "email", disabled: false },
    { label: "WhatsApp", value: "whatsapp", disabled },
    { label: "Email & WhatsApp", value: "both", disabled },
  ];
});

const resolvedPatientPhone = computed(() =>
  String(
    props.patientPhone ||
      props.patient?.preferredPhone ||
      props.patient?.mobile ||
      props.patient?.telephone ||
      props.patient?.phone ||
      "",
  ).trim(),
);

const patient = computed(() => {
  if (props.patient) return props.patient;
  const [firstName = "", ...rest] = String(props.patientName || "").split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    email: String(props.patientEmail || "").trim(),
    phone: String(props.patientPhone || "").trim(),
  };
});

const isWhatsAppAvailable = computed(() => isWhatsAppConnected.value);

const blankForm = () => {
  const [firstName = "", lastName = ""] = (props.patientName || "").split(" ");
  return {
    firstName,
    lastName,
    email: String(props.patientEmail || "").trim(),
    addressLine1: "",
    city: "London",
    postalCode: "",
  };
};

const form = ref(blankForm());
const errors = ref({});
const isProcessing = ref(false);
const invoicePdfDialogRef = ref(null);
const hiddenInvoiceVisible = ref(true);

const closeDialog = () => {
  emit("update:modelValue", false);
};

const cancelAndClose = () => {
  resetForm();
  closeDialog();
};

const resetForm = () => {
  form.value = blankForm();
  errors.value = {};
  sendVia.value = "email";
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      form.value = blankForm();
      errors.value = {};
      sendVia.value = "email";
    }
  },
);
watch(sendVia, (val) => {
  if (!isWhatsAppConnected.value && (val === "whatsapp" || val === "both")) {
    sendVia.value = "email";
  }
});
onMounted(async () => {
  await loadWhapiStatus();
});

const toBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return window.btoa(binary);
};

const generateInvoicePdfPayload = async () => {
  if (!invoicePdfDialogRef.value?.generateInvoicePdfBlob) {
    throw new Error("Invoice PDF generator not available.");
  }

  const blob = await invoicePdfDialogRef.value.generateInvoicePdfBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return {
    name: `Invoice-${props.invoice?.invoiceNumber || "invoice"}.pdf`,
    mimeType: "application/pdf",
    data: toBase64(arrayBuffer),
  };
};

const validate = () => {
  errors.value = {};

  if (!form.value.firstName?.trim()) {
    errors.value.firstName = "First name is required";
  }
  if (!form.value.lastName?.trim()) {
    errors.value.lastName = "Last name is required";
  }
  if (
    (sendVia.value === "email" || sendVia.value === "both") &&
    !form.value.email?.trim()
  ) {
    errors.value.email = "Email is required";
  } else if (
    (sendVia.value === "email" || sendVia.value === "both") &&
    !isValidEmail(form.value.email)
  ) {
    errors.value.email = "Enter a valid email";
  }
  if (!form.value.addressLine1?.trim()) {
    errors.value.addressLine1 = "Address is required";
  }
  if (!form.value.city?.trim()) {
    errors.value.city = "City is required";
  }
  if (!form.value.postalCode?.trim()) {
    errors.value.postalCode = "Postal code is required";
  }
  if (
    (sendVia.value === "whatsapp" || sendVia.value === "both") &&
    !resolvedPatientPhone.value
  ) {
    errors.value.sendVia = "Patient phone is required for WhatsApp delivery";
  }

  return !Object.keys(errors.value).length;
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const proceedToPayment = async () => {
  if (!validate()) return;

  isProcessing.value = true;

  try {
    // Step 1: Create customer in GoCardless
    const customerRes = await goCardlessService.createCustomer({
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      addressLine1: form.value.addressLine1,
      city: form.value.city,
      postalCode: form.value.postalCode,
      countryCode: "GB",
    });

    if (!customerRes?.success) {
      throw new Error(customerRes?.error || "Failed to create customer");
    }

    const customerId = customerRes.customer.id;
    console.log("✓ Customer created:", customerId);

    // Step 2: Create billing request with customer details (including address)
    const amount = Number(props.invoice?.balance ?? 0) * 100;
    const billingRes = await goCardlessService.createBillingRequest({
      customerId,
      amount,
      description: `Invoice ${props.invoice?.invoiceNumber}`,
      patientId: store.patientId,
      invoiceId: props.invoice.id,
      customerEmail: form.value.email,
      customerName: `${form.value.firstName} ${form.value.lastName}`,
      addressLine1: form.value.addressLine1,
      city: form.value.city,
      postalCode: form.value.postalCode,
      redirect_uri: `${window.location.origin}/payment-success`,
      exit_uri: `${window.location.origin}/payment-cancelled`,
    });

    if (!billingRes?.success) {
      throw new Error(billingRes?.error || "Failed to create billing request");
    }

    const paymentLink = billingRes.redirect_url;
    const billingRequestId = billingRes.billing_request_id;
    console.log("✓ Billing request created:", billingRequestId);

    // Step 3: Store billing request for tracking
    await store.recordGoCardlessPayment({
      billingRequestId,
      customerId,
      invoiceId: props.invoice.id,
      patientId: store.patientId,
      amount: Number(props.invoice?.balance ?? 0),
      customerEmail: form.value.email,
      customerName: `${form.value.firstName} ${form.value.lastName}`,
    });

    let invoicePdfPayload = null;
    try {
      invoicePdfPayload = await generateInvoicePdfPayload();
    } catch (pdfError) {
      console.warn("Invoice PDF generation failed:", pdfError);
      mainStore.setSnackbar({
        title: "Invoice PDF unavailable",
        message: "Payment link will still be sent without invoice attachment.",
        type: "warning",
      });
    }

    // Step 4: Dispatch payment link via selected channels
    const sendRes = await goCardlessService.sendPaymentRequestEmail({
      patientId: store.patientId,
      patientEmail: form.value.email,
      patientName: `${form.value.firstName} ${form.value.lastName}`,
      patientPhone: resolvedPatientPhone.value || undefined,
      invoiceId: props.invoice.id,
      invoiceNumber: props.invoice?.invoiceNumber,
      invoiceAmount: Number(props.invoice?.balance ?? 0),
      billingRequestId,
      paymentLink,
      sendVia: sendVia.value,
      invoicePdf: invoicePdfPayload,
    });

    if (!sendRes?.success) {
      const message =
        sendRes?.error ||
        "Failed to send payment link via selected delivery method.";
      throw new Error(message);
    }

    const deliveredVia = Array.isArray(sendRes?.sentVia)
      ? sendRes.sentVia
      : ["email"];

    let successMessage =
      deliveredVia.length === 2
        ? "Payment link sent via Email and WhatsApp"
        : deliveredVia[0] === "whatsapp"
          ? "Payment link sent via WhatsApp"
          : "Payment link sent via Email";

    if (sendRes?.invoicePdfAttached) {
      successMessage += " with invoice attachment";
    } else if (invoicePdfPayload) {
      successMessage += " without invoice attachment";
    }

    mainStore.setSnackbar({
      title: "Payment link sent",
      message: successMessage,
      type: "success",
    });

    emit("payment-link-sent", {
      billingRequestId,
      customerId,
      invoiceId: props.invoice.id,
      sendVia: sendVia.value,
      invoicePdfAttached: sendRes?.invoicePdfAttached === true,
    });

    resetForm();
    closeDialog();
  } catch (error) {
    console.error("Payment error:", error);
    mainStore.setSnackbar({
      title: "Payment Error",
      message: error?.message || "Failed to initiate payment",
      type: "error",
    });
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style scoped>
.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.invoice-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invoice-info__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.invoice-info__label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.amount-due {
  color: #0061fb;
  font-size: 18px;
  font-weight: 600;
}

.fld-lbl {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  display: block;
}

.req-star {
  color: #ef4444;
}

.text-caption {
  font-size: 12px;
  color: #6b7280;
}

.mt-1 {
  margin-top: 4px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mr-2 {
  margin-right: 8px;
}

.pl-2 {
  padding-left: 8px;
}

.pa-4 {
  padding: 16px;
}

.pa-5 {
  padding: 20px;
}

.hidden-invoice-generator {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 0;
  height: 0;
  overflow: hidden;
}</style>