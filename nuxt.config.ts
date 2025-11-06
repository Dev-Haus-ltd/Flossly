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
    "@vite-pwa/nuxt",
    // "vue-social-sharing/nuxt"
  ],
    pwa: {
    registerType: "autoUpdate",
    injectRegister: 'auto',
    manifest: {
      name: "Flossly",
      short_name: "Flossly",
      description: "Flossly web application",
      theme_color: "#0061FB",
      background_color: "#FFFFFF",
      display: "standalone",
      start_url: "/",
      scope: "/",
      orientation: "portrait",
      icons: [
        // Standard icons
        { 
          src: "/pwa-64x64.png", 
          sizes: "64x64", 
          type: "image/png" 
        },
        { 
          src: "/pwa-192x192.png", 
          sizes: "192x192", 
          type: "image/png",
          purpose: "any" 
        },
        { 
          src: "/pwa-512x512.png", 
          sizes: "512x512", 
          type: "image/png",
          purpose: "any" 
        },
        // Maskable icon (for Android adaptive icons)
        { 
          src: "/pwa-maskable-512x512.png", 
          sizes: "512x512", 
          type: "image/png",
          purpose: "maskable" 
        },
        // Apple Touch Icons
        { 
          src: "/apple-touch-icon-180x180.png", 
          sizes: "180x180", 
          type: "image/png",
          purpose: "any"
        },
      ],
    },
    devOptions: { 
      enabled: true,
      suppressWarnings: false,
      navigateFallback: '/',
      type: 'module',
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json,vue,txt,woff2}'],
      navigateFallback: '/',
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
  },
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
        { name: "theme-color", content: "#0061FB" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", href: "/pwa-192x192.png" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon-180x180.png" },
        { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-touch-icon-152x152.png" },
        { rel: "apple-touch-icon", sizes: "120x120", href: "/apple-touch-icon-120x120.png" },
        { rel: "apple-touch-icon", sizes: "76x76", href: "/apple-touch-icon-76x76.png" },
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
