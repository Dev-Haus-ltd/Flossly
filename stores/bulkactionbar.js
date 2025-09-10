import { defineStore } from 'pinia'
import { useBus } from '~/composables/useBus'

export const useMyBulkactionbarStore = defineStore('myBulkactionbarStore', {
  state: () => ({
    visible: false,
    context: null,      // e.g., 'rota'
    ids: [],            // selected ids
    label: '',          // label for the action buttons
    action1Label: '',   // first action button label
    action2Label: '',   // second action button label
    icon1: '',          // icon for the first action button
    icon2: '',          // icon for the second action button
  }),
  getters: {
    count: (state) => state.ids?.length || 0,
    isOpen: (state) => state.visible && (state.ids?.length > 0),
  },
  actions: {
    open({ context, ids = [], label = '', action1Label = '', action2Label = '', icon1 = '', icon2 = '' } = {}) {
      this.context = context
      this.ids = Array.isArray(ids) ? ids : []
      this.label = label
      this.action1Label = action1Label
      this.action2Label = action2Label
      this.icon1 = icon1
      this.icon2 = icon2
      this.visible = this.ids.length > 0
    },
    updateSelection(ids = []) {
      this.ids = Array.isArray(ids) ? ids : []
      this.visible = this.ids.length > 0
      // You no longer need to keep 'action' for next open, as it's not part of the state anymore.
      if (!this.visible) {
        this.action1Label = this.action1Label // you can keep action1Label for the next open if needed
        this.action2Label = this.action2Label // you can keep action2Label for the next open if needed
      }
    },    
    close() {
      this.visible = false
    },
    clear() {
      this.visible = false
      this.context = null
      this.ids = []
      this.label = ''
      this.action1Label = ''
      this.action2Label = ''
      this.icon1 = ''
      this.icon2 = ''
    },
    cancel() {
      const bus = useBus()
      if (this.context) {
        bus.emit('bulk:clear-selection', { context: this.context })
      }
      this.clear()
    },
    confirm() {
      const bus = useBus()
      if (!this.isOpen) return
      bus.emit('bulk:execute', {
        context: this.context,
        ids: this.ids,
        action1Label: this.action1Label,
        icon1: this.icon1,
        label: this.label,
      })
    },
    extraActionHandler() {
      const bus = useBus()
      if (!this.isOpen) return
      bus.emit('bulk:extra-action', {
        context: this.context,
        ids: this.ids,
        action1Label: this.action1Label,
        action2Label: this.action2Label,
        icon1: this.icon1,
        icon2: this.icon2,
      })
    },
  }
})
