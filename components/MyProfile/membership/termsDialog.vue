<!-- components/TermsDialog.vue -->
<template>
  <v-dialog v-model="internalValue" max-width="1100px" persistent>
    <v-card
      class="rounded-lg"
      style="max-height: 80vh; display: flex; flex-direction: column"
    >
      <!-- Sticky Header -->
      <div
        class="d-flex align-center justify-space-between px-4 py-3"
        style="
          border-bottom: 1px solid #dbdbdb;
          position: sticky;
          top: 0;
          z-index: 10;
          background: #fff;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        "
      >
        <h3 class="dialog-title">Terms & Conditions</h3>
        <div class="d-flex align-center gap-2">
          <div
            style="
              
              font-weight: 400;
              font-size: 14px;
              color: #737373;
            "
          >
            Effective Date: 07-Mar-2023
          </div>
          <v-btn
            prepend-icon="mdi-download"
            class="text-white mx-5"
            style="background-color: #213536; text-transform: none"
            @click="$emit('download')"
          >
            Download
          </v-btn>
          <v-btn icon flat @click="$emit('update:modelValue', false)">
            <v-icon size="20px">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Scrollable Content -->
      <v-card-text
        style="
          
          font-weight: 400;
          font-size: 14px;
          color: #1e1e1e;
          overflow-y: auto;
          flex: 1;
          padding-bottom: 32px;
        "
      >
        <p>
          This Transfer Agreement ("Agreement") is entered into between Smart
          Compliance Training Limited (“Smart Dental”), Compliance Health
          Limited (“Dental Compliance Made Easier”, or “DCME”) and the
          undersigned client ("Client") as of the date signed below.
        </p>
        <p>
          Smart Dental has entered into an arrangement with DCME and is
          transferring all subscriptions and customer data to DCME as part of a
          service migration. THEREFORE, in consideration of the mutual promises
          and covenants set forth herein, the parties agree as follows:
        </p>

        <!-- Section 1 -->
        <h3 class="terms-heading mt-6">
          1. Transfer of Subscription & Services
        </h3>
        <p>
          Effective immediately upon signing this Agreement and a DCME agreement
          (provided separately to this document), Client's subscription to the
          services provided by Smart Dental will be transferred to DCME.
          However, Smart Dental will continue to provide services on a
          business-as-usual basis until the Client is fully onboarded to DCME
          systems and processes.
        </p>
        <p>
          The Client acknowledges and agrees that DCME will handle all future
          subscription payments, billing, and service management. DCME and Smart
          Dental will continue to provide the same services to the Client, as
          per the existing subscription plan, including all features associated
          with the Platinum plan, if applicable.
        </p>
        <p>
          Clients will continue to have access to all documents stored in Smart
          Dental until the migration and onboarding to the DCME platform is
          complete. Smart Dental will continue to support Client information and
          data migration until onboarding to DCME is complete. Clients will have
          access to all their information on the Smart Dental platform until the
          migration to DCME has been completed.
        </p>

        <!-- Section 2 -->
        <h3 class="terms-heading mt-6">
          2. Data Privacy & Compliance with UK Law
        </h3>
        <p>The Client acknowledges and agrees that:</p>
        <p>
          All personal data transferred by the Client to DCME will be processed
          in compliance with the UK General Data Protection Regulation (GDPR)
          and other relevant data protection laws applicable in the United
          Kingdom.
        </p>
        <p>
          The Client will update its consent wording and notices to ensure that
          it reflects the transfer of the personal data to DCME. DCME will act
          as the data processor and will adhere to all relevant legal
          obligations concerning data protection, including implementing
          appropriate security measures to protect the personal data during and
          after the transfer process.
        </p>
        <p>
          The Client agrees to the continued storage and processing of their
          personal data by DCME as necessary for the provision of services, in
          accordance with the terms of the GDPR and UK Data Protection Act 2018.
        </p>
        <p>
          The Client, as controller, has the right to request access to,
          rectify, or request deletion of relevant personal data, as per the
          rights granted under GDPR. For the purposes of GDPR, DCME will provide
          a Data Processing Agreement (DPA) outlining the specific terms under
          which Client's data will be handled, which the Client agrees to upon
          migration to the DCME platform.
        </p>

        <!-- Section 3 -->
        <h3 class="terms-heading mt-6">3. Migration</h3>
        <p>
          Once this Transfer Agreement as well as a DCME agreement has been
          signed and executed, the DCME Onboarding Team and Smart Dental will
          facilitate the onboarding to the DCME platform.
        </p>
        <p>
          Flossly will support this process by providing Clients with support
          and assistance if required with regards to the downloading of
          information from the Smart Dental platform, such that this information
          can be submitted to DCME as part of the DCME onboarding process.
        </p>
        <p>
          The Client agrees to cooperate fully with DCME during this migration
          by providing DCME with any requested information or assistance to
          complete the onboarding process to the DCME platform
        </p>
        <p>
          Upon signing this Agreement, the Client agrees to allow the DCME
          Onboarding Team to begin the migration process immediately. This will
          cover the following:
        </p>
        <ul class="ml-6 list-disc">
          <li>
            DCME Onboarding team to share new 12 month contract agreement
            confirming client agreement to join DCME.
          </li>
          <li>
            DCME Onboarding team to share onboarding information collection
            sheet to set up your DCME platform
          </li>
          <li>
            Once you have been fully onboarded to the DCME platform you and your
            nominated team members will be invited to a training session to go
            through all parts, features of your new DCME platform
          </li>
          <li>
            Your access to your smart dental platform will continue until the
            onboarding process with DCME is complete
          </li>
        </ul>
      </v-card-text>
    </v-card>
  </v-dialog>
</template> 

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "download"]);

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<style scoped>
.terms-heading {
  
  font-weight: 600;
  font-size: 20px;
  color: #1e1e1e;
}
.dialog-title {
  
  font-weight: 600;
  font-size: 18px;
}
</style>
