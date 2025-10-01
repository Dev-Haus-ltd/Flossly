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
        primary: "#0061FB",
        "primary-dark": "#0061FB",
        "primary-light": "#008AFE",
        secondary: "#171952",
        "secondary-dark": "#171952",
        "secondary-light": "#263AAD", 
        tertiary: "#7D77FF",      
        "tertiary-dark": "#6C63E7",
        "tertiary-light": "#8A82FF"
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
