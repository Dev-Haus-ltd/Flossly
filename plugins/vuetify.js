import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import { VCalendar } from "vuetify/labs/VCalendar";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "vuetify/styles"; // Ensure global styles are loaded

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const light = {
    dark: false,
    colors: {
      ...config.public.colors,
      background: "#FFFFFF",
      surface: "#FFFFFF",
    },
  };

  const vuetify = createVuetify({
    ssr: true,
    components: {
      VCalendar,
    },
    directives,
    theme: {
      options: {
        customProperties: true,
      },
      defaultTheme: "light",
      themes: {
        light,
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
