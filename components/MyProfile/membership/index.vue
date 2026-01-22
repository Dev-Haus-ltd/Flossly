<template>
  <div class="mt-5 pb-5">
    <div class="pricing-section">
      <SignUpSetupPricing />
    </div>  
    <div class="mb-5">
      <!-- Invoices Table -->
      <MyProfileMembershipInvoicesTable
        :invoices="invoiceList"
        @open-terms="showTerms = true"
        @download-invoice="handleDownload"
      />

      <!-- Terms & Conditions Dialog -->
      <MyProfileMembershipTermsDialog
        v-model="showTerms"
        @download="handleDownloadTerms"
      />
    </div>
  </div>
</template>

<script setup>
import { downloadFile } from "~/lib/misc";

import { ref } from "vue";

const showTerms = ref(false);

const invoiceList = ref([
  {
    invoiceId: "INV-1001",
    paymentId: "PAY-5001",
    dueDate: "2025-08-01",
    payment: "$200",
    status: "Paid",
  },
  {
    invoiceId: "INV-1002",
    paymentId: "PAY-5002",
    dueDate: "2025-09-01",
    payment: "$150",
    status: "Pending",
  },
]);

function handleDownload(invoice) {
  console.log("Download invoice:", invoice);
  downloadFile(invoice);

  // Replace with actual API call or file download logic
}
function handleDownloadTerms() {
  console.log("Download terms pdf clicked");
  // implement API/pdf download here
}
</script>

<style scoped>
:deep(.pricing-grid) {
  justify-content: flex-start;
  align-items: flex-start;
}
.pricing-section {
  padding-bottom: 40px; /* adjust as needed */
}
</style>