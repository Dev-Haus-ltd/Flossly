<template>
  <div class="payment-success-page">
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="10" md="7" lg="5">
          
          <v-card
            rounded="xl"
            elevation="6"
            class="success-card"
          >
            <!-- Top Success Section -->
            <div class="success-top">
              <div class="success-badge">
                <v-icon size="52" color="white">
                  mdi-check
                </v-icon>
              </div>

              <h1 class="success-title">
                Payment Successful
              </h1>

              <p class="success-subtitle">
                Your payment has been processed successfully.
              </p>
            </div>

            <!-- Content -->
            <v-card-text class="pa-6">
              
              <!-- Status Card -->
              <div class="info-box">
                <div class="info-row">
                  <span class="info-label">Status</span>
                  <span class="info-value success-text">
                    Completed
                  </span>
                </div>

                <v-divider class="my-4" />

                <div class="info-row">
                  <span class="info-label">Confirmation</span>
                  <span class="info-value">
                    Receipt sent to your email
                  </span>
                </div>
              </div>

              <!-- Next Steps -->
              <div class="steps-box mt-5">
                <p class="steps-title">
                  What happens next?
                </p>

                <div class="step-item">
                  <v-icon size="18" color="success">
                    mdi-check-circle
                  </v-icon>
                  <span>Check your email for confirmation</span>
                </div>

                <div class="step-item">
                  <v-icon size="18" color="success">
                    mdi-check-circle
                  </v-icon>
                  <span>Your payment receipt has been generated</span>
                </div>

                
              </div>

              <!-- Help Alert -->
              <v-alert
                class="mt-5"
                type="info"
                variant="tonal"
                rounded="lg"
                border="start"
              >
                Need help? Please contact the practice directly if you have any questions regarding your payment.
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


</script>

<style scoped>
.payment-success-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(99, 102, 241, 0.15), transparent 40%),
    #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.success-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.success-top {
  padding: 42px 24px 30px;
  text-align: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.success-badge {
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-title {
  font-size: 30px;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.2;
}

.success-subtitle {
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

.success-text {
  color: #059669;
}

.steps-box {
  border-radius: 14px;
  padding: 18px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.steps-title {
  font-size: 14px;
  font-weight: 600;
  color: #166534;
  margin-bottom: 14px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #166534;
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
  .payment-success-page {
    padding: 16px;
  }

  .success-title {
    font-size: 24px;
  }

  .success-subtitle {
    font-size: 14px;
  }

  .success-top {
    padding: 34px 20px 24px;
  }

  .success-badge {
    width: 74px;
    height: 74px;
  }
}
</style>