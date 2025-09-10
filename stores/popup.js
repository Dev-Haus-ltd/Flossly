import { defineStore } from 'pinia'

export const usePopupStore = defineStore('popup', {
  state: () => ({
    open: false,
    title: '',
    text: '',
    confirmLabel: 'Yes',
    cancelLabel: 'No',
    loading: false,
    logo: null,      // string URL or null
    logoAlt: 'Logo',
    _resolver: null,
  }),
  actions: {
    // note: default = {} so it's safe if called with no args
    ask({
      title = '',
      text = '',
      confirmLabel = 'Yes',
      cancelLabel = 'No',
      logo = null,
      logoAlt = 'Logo',
    } = {}) {
      this.title = title
      this.text = text
      this.confirmLabel = confirmLabel
      this.cancelLabel = cancelLabel
      this.logo = logo
      this.logoAlt = logoAlt
      this.open = true
      return new Promise((resolve) => { this._resolver = resolve })
    },
    confirm() {
      if (this._resolver) this._resolver(true)
      this._reset()
    },
    cancel() {
      if (this._resolver) this._resolver(false)
      this._reset()
    },
    setLoading(v) { this.loading = v },
    _reset() {
      this.open = false
      this.loading = false
      this._resolver = null
      this.title = ''
      this.text = ''
      this.confirmLabel = 'Yes'
      this.cancelLabel = 'No'
      this.logo = null
      this.logoAlt = 'Logo'
    },
  },
})
