import {
  autocompletePhoneCountryInput,
  createVPhoneInput,
  VPhoneCountryFlagSvg,
} from 'v-phone-input'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(
    createVPhoneInput({
      ...autocompletePhoneCountryInput,
      countryDisplayComponent: VPhoneCountryFlagSvg,
      displayFormat: 'international',
      defaultCountry: 'gb',
    })
  )
})
