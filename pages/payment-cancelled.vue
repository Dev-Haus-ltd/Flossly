<template>
  <div class="payment-cancelled-page">
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="10" md="7" lg="5">

          <v-card
            rounded="xl"
            elevation="6"
            class="cancelled-card"
          >
            <!-- Top Section -->
            <div class="cancelled-top">
              <div class="cancelled-badge">
                <v-icon size="50" color="white">
                  mdi-close
                </v-icon>
              </div>

              <h1 class="cancelled-title">
                Payment Cancelled
              </h1>

              <p class="cancelled-subtitle">
                Your payment was not completed and no charges were made.
              </p>
            </div>

            <!-- Content -->
            <v-card-text class="pa-6">

              <!-- Status Box -->
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Status</span>

                  <span class="info-value cancelled-text">
                    Cancelled
                  </span>
                </div>

                <v-divider class="my-4" />

                <div class="info-row">
                  <span class="info-label">Payment</span>

                  <span class="info-value">
                    No transaction processed
                  </span>
                </div>
              </div>

              <!-- Next Steps -->
              <div class="steps-box mt-5">
                <p class="steps-title">
                  What can you do next?
                </p>

                <div class="step-item">
                  <v-icon size="18" color="error">
                    mdi-alert-circle-outline
                  </v-icon>
                  <span>Retry the payment if needed</span>
                </div>

                <div class="step-item">
                  <v-icon size="18" color="error">
                    mdi-alert-circle-outline
                  </v-icon>
                  <span>Contact the practice for assistance</span>
                </div>

                
              </div>

              <!-- Warning Alert -->
              <v-alert
                class="mt-5"
                type="warning"
                variant="tonal"
                rounded="lg"
                border="start"
              >
                If this cancellation happened by mistake, please contact the practice to request a new payment link.
              </v-alert>

            </v-card-text>

            
          </v-card>

          <!-- Footer -->
          <p class="footer-text mt-6">
            © {{ currentYear }} Flossly. All rights reserved.
          </p>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { computed } from "vue";

definePageMeta({
  layout: "blank",
});

const currentYear = computed(() => new Date().getFullYear());

const goHome = () => {
  window.location.href = "/";
};

const closeWindow = () => {
  window.close();
};
</script>

<style scoped>
.payment-cancelled-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(239, 68, 68, 0.12), transparent 40%),
    #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.cancelled-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.cancelled-top {
  padding: 42px 24px 30px;
  text-align: center;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.cancelled-badge {
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancelled-title {
  font-size: 30px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.cancelled-subtitle {
  margin-top: 10px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
}

.info-box {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
  background: #f9fafb;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.info-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.cancelled-text {
  color: #dc2626;
}

.steps-box {
  border-radius: 14px;
  padding: 18px;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 14px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #991b1b;
  padding: 6px 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

@media (max-width: 600px) {
  .payment-cancelled-page {
    padding: 16px;
  }

  .cancelled-title {
    font-size: 24px;
  }

  .cancelled-subtitle {
    font-size: 14px;
  }

  .cancelled-top {
    padding: 34px 20px 24px;
  }

  .cancelled-badge {
    width: 74px;
    height: 74px;
  }
}
</style>