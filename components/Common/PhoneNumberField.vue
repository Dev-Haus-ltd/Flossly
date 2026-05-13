<template>
  <div>
    <div class="phone-input" :class="{ 'phone-input--error': !!errorMessage }">
      <v-phone-input
        v-model="model"
        variant="solo"
        density="comfortable"
        flat
        default-country="gb"
        :prefer-countries="['gb']"
        :country-props="countryProps"
        :phone-props="phoneProps"
        @update:phone-object="onPhoneObjectUpdate"
      />
    </div>
    <div v-if="errorMessage" class="phone-error-msg">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
const model = defineModel({ default: "" })

const props = defineProps({
  errorMessage: { type: String, default: "" },
})

const emit = defineEmits(["update:phone-object"])

const countryProps = {
  label: "",
  hideDetails: true,
  flat: true,
  variant: "solo",
  bgColor: "white",
}

const phoneProps = {
  label: "",
  hideDetails: true,
  flat: true,
  variant: "solo",
  bgColor: "white",
}

const onPhoneObjectUpdate = (value) => {
  emit("update:phone-object", value)
}
</script>

<style scoped>
.phone-input :deep(.v-phone-input) {
  display: flex;
  width: 100%;
  border: 1px solid #dfdfdf;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
}

.phone-input :deep(.v-phone-input__country__input .v-field),
.phone-input :deep(.v-phone-input__phone__input .v-field) {
  border: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  background-color: transparent !important;
  min-height: 40px;
  font-size: 14px;
}

.phone-input :deep(.v-phone-input__country__input.v-input) {
  min-width: 88px;
  max-width: 88px;
  flex: 0 0 88px;
  cursor: pointer;
}

.phone-input :deep(.v-phone-input__phone__input.v-input) {
  flex: 1 1 auto;
  min-width: 0;
}

.phone-input :deep(.v-phone-input__country__input .v-field) {
  border-right: 1px solid #dfdfdf !important;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.phone-input :deep(.v-phone-input__country__input:hover .v-field) {
  background-color: #f0f4ff !important;
}

.phone-input :deep(.v-phone-input__phone__input .v-field__input) {
  padding-left: 10px;
}

.phone-input--error :deep(.v-phone-input) {
  border-color: rgb(var(--v-theme-error)) !important;
}

.phone-error-msg {
  font-size: 12px;
  color: rgb(var(--v-theme-error));
  padding: 4px 16px 0;
}
</style>
