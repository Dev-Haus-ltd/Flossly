export const useUIStore = defineStore('uiStore', {
  state: () => ({
    theme: 'light', // 'light' | 'dark'
  }),
  actions: {
    initTheme() {
      if (process.client) {
        const saved = localStorage.getItem('flossly_theme')
        if (saved === 'dark' || saved === 'light') this.theme = saved
        else this.theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
    },
    setTheme(name) {
      this.theme = name === 'dark' ? 'dark' : 'light'
      if (process.client) localStorage.setItem('flossly_theme', this.theme)
    },
    toggleTheme() { this.setTheme(this.theme === 'dark' ? 'light' : 'dark') },
  },
})

