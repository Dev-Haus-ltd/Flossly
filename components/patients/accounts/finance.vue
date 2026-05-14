<template>
  <div class="finance-view">
    <div class="finance-form-card">
      <div class="finance-form-card__title">Choose Payment Plan with Tabeo</div>
      <p class="finance-form-card__subtitle">
        Select your preferred payment option. You will be redirected securely to Tabeo to complete payment.
      </p>

      <div class="finance-grid finance-grid--top">
        <div class="field-group field-group--wide">
          <label>Treatment Plan</label>
          <button type="button" class="field-shell">
            <span>Implant</span>
            <v-icon size="18">mdi-chevron-down</v-icon>
          </button>
        </div>

        <div class="field-group">
          <label>Treatment Cost</label>
          <div class="field-shell field-shell--static">&#163;3,200</div>
        </div>

        <div class="field-group">
          <label>Finance terms</label>
          <button type="button" class="field-shell">
            <span>3 months</span>
            <v-icon size="18">mdi-chevron-down</v-icon>
          </button>
        </div>
      </div>

      <div class="finance-grid finance-grid--clinician">
        <div class="field-group field-group--wide">
          <label>Clinician</label>
          <button type="button" class="field-shell">
            <span>Dr. Johnson</span>
            <v-icon size="18">mdi-chevron-down</v-icon>
          </button>
        </div>
      </div>

      <div class="patient-info">
        <div class="patient-info__title">Patient Information</div>

        <div class="patient-info__grid">
          <div class="info-item">
            <span class="info-item__label">Full Name</span>
            <span class="info-item__value">Kane</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Date of Birth</span>
            <span class="info-item__value">Crosfill</span>
          </div>

          <div class="info-item">
            <span class="info-item__label">Postcode</span>
            <span class="info-item__value">LS14 6BH</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Email Address</span>
            <span class="info-item__value">lisa.crosfil@hotmail.co.uk</span>
          </div>

          <div class="info-item">
            <span class="info-item__label">Mobile Number</span>
            <span class="info-item__value">+44 07984977353</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">Address</span>
            <span class="info-item__value">20 Somerville Drive</span>
          </div>
        </div>
      </div>
    </div>

    <div class="finance-actions">
      <button type="button" class="secondary-btn">
        <img :src="newWindowIcon" alt="" />
        <span>Apply with patient</span>
      </button>

      <button type="button" class="primary-btn">Send Finance Link</button>
    </div>
  </div>
</template>

<script setup>

import newWindowIcon from "@/assets/diary/new_window_icon.svg";

</script>

<style scoped lang="scss">
.finance-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.finance-form-card {
  border: 1px solid #e8edf3;
  border-radius: 16px;
  background: #ffffff;
  padding: 14px 14px 18px;
}

.finance-form-card__title {
  font-size: 13px;
  font-weight: 700;
  color: #2a2f3a;
  margin-bottom: 6px;
}

.finance-form-card__subtitle {
  font-size: 11px;
  color: #697386;
  margin-bottom: 12px;
}

.finance-grid {
  display: grid;
  gap: 12px;
}

.finance-grid--top {
  grid-template-columns: minmax(0, 2.1fr) minmax(124px, 0.9fr) minmax(0, 1.9fr);
}

.finance-grid--clinician {
  grid-template-columns: minmax(0, 2.1fr);
  margin-top: 10px;
  margin-bottom: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group label,
.patient-info__title,
.info-item__label {
  font-size: 11px;
  font-weight: 700;
  color: #394150;
}

.field-shell {
  height: 40px;
  border: 1px solid #dfe5ec;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #4b5563;
  width: 100%;
}

.field-shell--static {
  justify-content: flex-start;
}

.patient-info {
  margin-top: 6px;
}

.patient-info__title {
  margin-bottom: 10px;
}

.patient-info__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 44px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item__value {
  font-size: 12px;
  color: #7b8494;
}

.finance-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.secondary-btn,
.primary-btn {
  height: 30px;
  border-radius: 6px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.secondary-btn {
  border: 0;
  background: #8b79ff;
  color: #ffffff;
}

.primary-btn {
  border: 0;
  background: #0061fb;
  color: #ffffff;
}

@media (max-width: 1100px) {
  .finance-grid--top {
    grid-template-columns: 1fr;
  }

  .patient-info__grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 700px) {
  .finance-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .secondary-btn,
  .primary-btn {
    justify-content: center;
  }
}
</style>
