<template>
  <div class="account-selection">
    <template v-if="!loading">
      <v-alert v-if="error" type="error" variant="tonal" class="ads-alert mb-5">{{ error }}</v-alert>

      <div v-if="!customers.length" class="account-selection-empty">
        <div class="empty-icon-wrap">
          <v-icon size="28" color="grey-lighten-1">mdi-account-off-outline</v-icon>
        </div>
        <p class="empty-title">No Ads accounts found</p>
        <p class="empty-sub">Make sure your Google account has access to Google Ads customer accounts.</p>
      </div>

      <template v-else>
        <div class="account-selection-header">
          <p class="header-label">Google Ads Account</p>
          <h3 class="header-title">Select an account to track</h3>
        </div>

        <div class="account-selection-list">
          <div
            v-for="(customer, index) in customers"
            :key="customer.id"
            class="account-item"
            :class="{
              'account-item--selected': selectedCustomerId === customer.id,
            }"
            :style="{ '--i': index }"
            @click="selectedCustomerId = customer.id"
          >
            <div class="account-item-radio">
              <div class="radio-outer">
                <div class="radio-inner" :class="{ visible: selectedCustomerId === customer.id }" />
              </div>
            </div>

            <div class="account-icon-wrap">
              <v-icon size="15" class="account-icon">mdi-account-details-outline</v-icon>
            </div>

            <div class="account-item-content">
              <span class="account-item-name">{{ customer.descriptiveName || 'Unnamed Account' }}</span>
              <div class="account-item-meta">
                <span class="id-badge">{{ formatCustomerId(customer.id) }}</span>
                <span v-if="customer.currencyCode" class="currency-badge">{{ customer.currencyCode }}</span>
              </div>
            </div>

            <div v-if="selectedCustomerId === customer.id" class="account-item-check">
              <v-icon size="16" color="white">mdi-check</v-icon>
            </div>
          </div>
        </div>

        <div class="account-selection-actions">
          <span class="selection-hint" v-if="selectedCustomerId">
            <v-icon size="13" class="mr-1" style="opacity:.6">mdi-check-circle-outline</v-icon>
            {{ getSelectedAccountName() }}
          </span>
          <v-btn
            class="continue-btn"
            :class="{ 'continue-btn--active': !!selectedCustomerId }"
            :disabled="!selectedCustomerId || selecting"
            :loading="selecting"
            @click="onContinue"
            flat
          >
            Continue
            <v-icon size="16" class="ml-2">mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </template>
    </template>
    
    <div v-else class="d-flex align-center justify-center py-10">
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  customers: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  selecting: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);
const selectedCustomerId = ref('');

const formatCustomerId = (id) => {
  if (!id) return '';
  const s = String(id);
  if (s.length === 10) {
    return `${s.slice(0, 3)}-${s.slice(3, 6)}-${s.slice(6)}`;
  }
  return s;
};

const getSelectedAccountName = () => {
  const acc = props.customers.find(c => c.id === selectedCustomerId.value);
  return acc ? (acc.descriptiveName || acc.id) : '';
};

const onContinue = () => {
  if (selectedCustomerId.value) {
    emit('select', selectedCustomerId.value);
  }
};

watch(() => props.customers, (newCustomers) => {
  if (newCustomers?.length === 1) {
    selectedCustomerId.value = newCustomers[0].id;
  }
}, { immediate: true });
</script>

<style scoped lang="scss">
$accent:     #2563EB;
$accent-lt:  #EFF6FF;
$radius-card: 14px;
$radius-item: 10px;
$border:      rgba(0, 0, 0, 0.08);
$border-sel:  rgba(37, 99, 235, 0.25);
$transition:  0.18s cubic-bezier(0.4, 0, 0.2, 1);

.account-selection {
  padding: 4px 0 8px;
  font-family: 'DM Sans', 'Inter', sans-serif;
}

.account-selection-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;

  .empty-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  .empty-sub {
    font-size: 13px;
    color: #8a8a8a;
    max-width: 280px;
    line-height: 1.55;
  }
}

.account-selection-header {
  margin-bottom: 18px;

  .header-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 4px;
  }

  .header-title {
    font-size: 17px;
    font-weight: 650;
    color: #111827;
    letter-spacing: -0.02em;
  }
}

.account-selection-list {
  border: 1px solid $border;
  border-radius: $radius-card;
  overflow: hidden;
  background: #ffffff;
  max-height: 340px;
  overflow-y: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 10px; }
}

.account-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid $border;
  cursor: pointer;
  transition: background $transition;
  position: relative;
  animation: fadeSlideIn 0.25s ease both;
  animation-delay: calc(var(--i, 0) * 0.05s);

  &:last-child { border-bottom: none; }

  &:hover { background: #fafafa; }

  &.account-item--selected {
    background: $accent-lt;
    border-color: $border-sel;

    .account-item-name { color: $accent; }
    .account-icon { color: $accent !important; }
    .account-icon-wrap { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.15); }
  }
}

.account-item-radio {
  flex-shrink: 0;

  .radio-outer {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color $transition;

    .account-item--selected & { border-color: $accent; }
  }

  .radio-inner {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $accent;
    transform: scale(0);
    transition: transform $transition;

    &.visible { transform: scale(1); }
  }
}

.account-icon-wrap {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: #f4f4f5;
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background $transition, border-color $transition;

  .account-icon { color: #6b7280; transition: color $transition; }
}

.account-item-content {
  flex: 1;
  min-width: 0;
}

.account-item-name {
  display: block;
  font-size: 13.5px;
  font-weight: 580;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color $transition;
  letter-spacing: -0.01em;
}

.account-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.id-badge {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 2px 7px;
  border-radius: 5px;
  background: #f4f4f5;
  color: #6b7280;
}

.currency-badge {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
}

.account-item-check {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $accent;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  box-shadow: 0 2px 8px rgba(37,99,235,0.35);
}

.account-selection-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  gap: 12px;
}

.selection-hint {
  display: flex;
  align-items: center;
  font-size: 12.5px;
  color: #6b7280;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.continue-btn {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: 9px;
  
  &:not(.continue-btn--active) {
    background: #e5e7eb !important;
    color: #9ca3af !important;
  }

  &.continue-btn--active {
    background: $accent !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(37,99,235,0.25) !important;
  }
}

.ads-alert { border-radius: $radius-item !important; font-size: 13px; }

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}
</style>
