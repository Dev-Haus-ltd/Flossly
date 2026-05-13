const _showPricing = ref(false)

export const usePricingModal = () => {
  const open = () => { _showPricing.value = true }
  const close = () => { _showPricing.value = false }
  return { showPricing: _showPricing, open, close }
}
