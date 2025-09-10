<template>
    <v-dialog v-model="popup.open" :scrim="true" transition="dialog-transition" persistent>
      <v-card class="popup-card elevation-0">
        <div class="popup-inner">
          <!-- Logo -->
          <div v-if="popup.logo" class="logo-wrap">
            <v-img :src="popup.logo" :alt="popup.logoAlt || 'Logo'" width="60" height="60" cover />
          </div>
  
          <!-- Optional title -->
          <div v-if="popup.title" class="popup-title">
            {{ popup.title }}
          </div>
  
          <!-- Message -->
          <div class="popup-text">
            {{ popup.text }}
          </div>
  
          <!-- Buttons -->
          <div class="btn-row">
            <v-btn
              class="btn-cancel"
              variant="flat"
              height="44"
              :disabled="popup.loading"
              @click="popup.cancel()"
            >
              {{ popup.cancelLabel || 'No' }}
            </v-btn>
            <v-btn
              class="btn-confirm"
              variant="flat"
              height="44"
              :loading="popup.loading"
              @click="popup.confirm()"
            >
              {{ popup.confirmLabel || 'Yes' }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </template>  
  
  <script setup>
  import { usePopupStore } from '~/stores/popup'
  const popup = usePopupStore()
  </script>
  
  <style scoped>
    /* Center the overlay content (undo previous inline-block override) */
    :deep(.v-overlay__content) {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    }

    /* Outer card = container (318 x 218) */
    .popup-card {
    width: 318px;
    height: 218px;
    border-radius: 12px !important;
    padding: 20px;
    background: #ffffff;
    box-shadow:
        0px 9px 28px 8px rgba(0, 0, 0, 0.05),
        0px 3px 6px -4px rgba(0, 0, 0, 0.25);
    display: flex;
    overflow: hidden;              /* prevent inner scrollbar */
    }

    /* Inner bordered area: fixed size to avoid overflow */
    .popup-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    }

    /* Optional title */
    .popup-title {
    margin-top: 6px;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
    color: #252525;
    text-align: center;
    }

    /* Message */
    .popup-text {
    height: 40px;   
    width: 278px;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 20px;
    color: #252525;
    margin-top: 6px;
    padding: 0 12px;
    flex: 1;                       /* fill remaining space */
    display: flex;
    align-items: center;
    justify-content: center;
    }

    /* Buttons row */
    .btn-row {
    width: 176px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* no bottom margin; fits exact 178px inner height */
    }

    /* No button */
    .btn-cancel {
    width: 79px;
    height: 44px;
    border-radius: 8px;
    background: #ffffff !important;
    border: 1px solid #d9d9d9 !important;
    box-shadow: none !important;
    text-transform: none;
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #1e1e1e !important;
    padding: 12px 30px;
    }

    /* Yes button */
    .btn-confirm {
    width: 85px;
    height: 44px;
    border-radius: 8px;
    background: #3adf8d !important;
    border: 1px solid #3adf8d !important;
    box-shadow: none !important;
    text-transform: none;
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #1e1e1e !important;
    padding: 12px 30px;
    }
  </style>
  