import vuetify from "vite-plugin-vuetify";

export default defineNuxtConfig({
  // @ts-ignore
  serverMiddleware: [
    { path: "/api", handler: "@/server/api.js" },
    { path: "/api/**", handler: "@/server/api.js" },
  ],
  router: {
    prefetchLinks: true,
  },
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
  },
  runtimeConfig: {
    public: {
      BASE_URL: process.env.BASE_URL,
      CHATBOT_URL: process.env.CHATBOT_URL,
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
      MAX_FILE_SIZE_FOR_LOGO: process.env.MAX_FILE_SIZE_FOR_LOGO || 5 * 1024 * 1024, // Default 5MB in bytes
    },
    API_AUTH: "BasicAuth",
    JWT_SECRET: process.env.JWT_SECRET,
    Stripe_PK: process.env.STRIPE_PK,
    Sripte_SK: process.env.STRIPE_SK,
    StripeWS: process.env.STRIPE_WS,
    // Meta (Facebook) App Credentials
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
    //file size
    MAX_FILE_SIZE_FOR_TASK_SHEET: process.env.MAX_FILE_SIZE_FOR_TASK_SHEET,
    MAX_FILE_SIZE_FOR_LOGO: process.env.MAX_FILE_SIZE_FOR_LOGO || 5 * 1024 * 1024, // Default 5MB in bytes
    // Google Cloud Speech-to-Text credentials
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // OpenAI API key for summarization
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    // Redis connection URL for centralized session management
    REDIS_URL: process.env.REDIS_URL,
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
       link: [
      // Favicon
      { rel: "icon", type: "image/png", href: "/Logoicon2.svg" },

      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }
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