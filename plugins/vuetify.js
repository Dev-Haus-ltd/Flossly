import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import { VCalendar } from 'vuetify/labs/VCalendar'
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import 'vuetify/styles' // Ensure global styles are loaded

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  let defaultTheme = 'light'
  if (process.client) {
    const saved = localStorage.getItem('flossly_theme')
    if (saved === 'dark' || saved === 'light') defaultTheme = saved
  }
  const light = { dark: false, colors: { ...config.public.colors, background: '#FFFFFF', surface: '#FFFFFF' } }
  const dark = { dark: true, colors: { ...config.public.colors, background: '#121212', surface: '#1E1E1E' } }
  const vuetify = createVuetify({
    ssr: true,
    components: {
      VCalendar
    },
    directives,
    theme: {
      options: {
        customProperties: true,
      },
      defaultTheme,
      themes: {
        light,
        dark,
      },
    },
    icons: {
      defaultSet: "mdi",
      aliases,
      sets: {
        mdi,
      },
    },
  });
  nuxtApp.vueApp.use(vuetify);
});
