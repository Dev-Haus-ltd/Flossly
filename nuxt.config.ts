import vuetify from "vite-plugin-vuetify";

export default defineNuxtConfig({
  // @ts-ignore
  serverMiddleware: [
    { path: "/api", handler: "@/server/api.js" },
    { path: "/api/**", handler: "@/server/api.js" },
  ],
  runtimeConfig: {
    public: {
      BASE_URL: process.env.BASE_URL,
      colors: {
        primary: "#60E5A3",
        "primary-dark": "#39C487",
        "primary-light": "#C8F6E5",
        secondary: "#213536",
        "secondary-dark": "#162627",
        "secondary-light": "#334A4A",
      },
      Stripe_PK: process.env.STRIPE_PK,
    },
    API_AUTH: "BasicAuth",
    JWT_SECRET: process.env.JWT_SECRET,
    Stripe_PK: process.env.STRIPE_PK,
    Sripte_SK: process.env.STRIPE_SK,
    StripeWS: process.env.STRIPE_WS,
  },
  modules: [
    async (options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) =>
        // @ts-ignore
        config.plugins.push(vuetify())
      );
    },
    "@pinia/nuxt",
    "nuxt-scheduler",
    // "vue-social-sharing/nuxt"
  ],
  css: ["vuetify/lib/styles/main.sass", "@/assets/css/fonts.css"],
  app: {
    head: {
      title: "Flossly",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          hid: "description",
          name: "description",
          content: process.env.npm_package_description || "",
        },
      ],
      script: [{ src: "https://js.stripe.com/v3/", defer: true }
      ],
    },
  },
  imports: {
    dirs: ["./stores"],
  },
  pinia: {
    autoImports: ["defineStore", "acceptHMRUpdate"],
  },
  vite: {
    ssr: {
      noExternal: ["vuetify"], // add the vuetify vite plugin
    },
  },
  devServer: {
    port: 3000,
    host: "0.0.0.0",
  },
});
