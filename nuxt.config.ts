import { resolve } from "pathe";
import vuetify from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2026-04-14",
  alias: {
    "@shared": resolve(__dirname, "shared"),
  },
  router: {
    prefetchLinks: true,
  },
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
  },
  runtimeConfig: {
    public: {
      BASE_URL: process.env.NUXT_PUBLIC_BASE_URL || process.env.BASE_URL,
      CHATBOT_URL: process.env.NUXT_PUBLIC_CHATBOT_URL || process.env.CHATBOT_URL,
      META_APP_ID: process.env.NUXT_PUBLIC_META_APP_ID || process.env.META_APP_ID,
      META_WA_EMBEDDED_CONFIG_ID: process.env.NUXT_PUBLIC_META_WA_EMBEDDED_CONFIG_ID || process.env.META_WA_EMBEDDED_CONFIG_ID,
      ONBOARDING_WELCOME_VIDEO_URL: process.env.ONBOARDING_WELCOME_VIDEO_URL || "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC",
      ONBOARDING_FOUNDER_NAME: process.env.ONBOARDING_FOUNDER_NAME || "Saba",
      ONBOARDING_SUCCESS_MANAGER_NAME: process.env.ONBOARDING_SUCCESS_MANAGER_NAME || "FlosslyOS Team",
      ONBOARDING_QUIET_HOUR_START: process.env.ONBOARDING_QUIET_HOUR_START,
      ONBOARDING_QUIET_HOUR_END: process.env.ONBOARDING_QUIET_HOUR_END,
      ONBOARDING_QUIET_APPLIES_TO: process.env.ONBOARDING_QUIET_APPLIES_TO,
      ONBOARDING_WELCOME_CAP_HOURS: process.env.ONBOARDING_WELCOME_CAP_HOURS,
      ONBOARDING_VIDEO_CAP_HOURS: process.env.ONBOARDING_VIDEO_CAP_HOURS,
      ONBOARDING_INAPP_CAP_HOURS: process.env.ONBOARDING_INAPP_CAP_HOURS,
      // Firebase configuration for FCM
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
      firebaseVapidKey: process.env.NUXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY,
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
      Stripe_PK:
        process.env.NUXT_PUBLIC_STRIPE_PK ||
        process.env.NUXT_STRIPE_PK ||
        process.env.STRIPE_PK,
      MAX_FILE_SIZE_FOR_LOGO: process.env.MAX_FILE_SIZE_FOR_LOGO || 5 * 1024 * 1024, // Default 5MB in bytes
    },
    API_AUTH: "BasicAuth",
    JWT_SECRET: process.env.JWT_SECRET,
    Stripe_PK:
      process.env.NUXT_PUBLIC_STRIPE_PK ||
      process.env.NUXT_STRIPE_PK ||
      process.env.STRIPE_PK,
    Stripe_SK: process.env.NUXT_STRIPE_SK || process.env.STRIPE_SK,
    StripeWS: process.env.NUXT_STRIPE_WS || process.env.STRIPE_WS,
    stripeWebhookSecret: process.env.NUXT_STRIPE_WS || process.env.STRIPE_WS,
    // Meta (Facebook) App Credentials
    META_APP_ID: process.env.META_APP_ID,
    META_APP_SECRET: process.env.META_APP_SECRET,
    META_REDIRECT_URI: process.env.META_REDIRECT_URI,
    META_VERIFY_TOKEN: process.env.META_VERIFY_TOKEN,
    // WhatsApp / Whapi
    WHATSAPP_PROVIDER: process.env.NUXT_WHATSAPP_PROVIDER || process.env.WHATSAPP_PROVIDER,
    WHAPI_BASE_URL: process.env.NUXT_WHAPI_BASE_URL || process.env.WHAPI_BASE_URL,
    WHAPI_TOKEN: process.env.NUXT_WHAPI_TOKEN || process.env.WHAPI_TOKEN,
    WHAPI_WEBHOOK_URL: process.env.NUXT_WHAPI_WEBHOOK_URL || process.env.WHAPI_WEBHOOK_URL,
    WHAPI_PARTNER_TOKEN: process.env.NUXT_WHAPI_PARTNER_TOKEN || process.env.WHAPI_PARTNER_TOKEN,
    WHAPI_PROJECT_ID: process.env.NUXT_WHAPI_PROJECT_ID || process.env.WHAPI_PROJECT_ID,
    WHAPI_MANAGER_BASE_URL: process.env.NUXT_WHAPI_MANAGER_BASE_URL || process.env.WHAPI_MANAGER_BASE_URL,
    WHAPI_CHANNEL_MODE: process.env.NUXT_WHAPI_CHANNEL_MODE || process.env.WHAPI_CHANNEL_MODE,
    WHAPI_ALLOW_CREATE_CHANNEL: process.env.NUXT_WHAPI_ALLOW_CREATE_CHANNEL || process.env.WHAPI_ALLOW_CREATE_CHANNEL,
    WHAPI_EXTEND_DAYS: process.env.NUXT_WHAPI_EXTEND_DAYS || process.env.WHAPI_EXTEND_DAYS,
    //file size
    MAX_FILE_SIZE_FOR_TASK_SHEET: process.env.MAX_FILE_SIZE_FOR_TASK_SHEET,
    MAX_FILE_SIZE_FOR_LOGO: process.env.MAX_FILE_SIZE_FOR_LOGO || 5 * 1024 * 1024, // Default 5MB in bytes
    // Google Cloud Speech-to-Text credentials
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    // AI / LLM Configuration
    AI_LLM_PROVIDER: process.env.NUXT_AI_LLM_PROVIDER || process.env.AI_LLM_PROVIDER || "openai",
    OPENAI_API_KEY: process.env.NUXT_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    AI_OPENAI_MODEL: process.env.NUXT_AI_OPENAI_MODEL || process.env.AI_OPENAI_MODEL || "gpt-4o-mini",
    ANTHROPIC_API_KEY: process.env.NUXT_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
    AI_ANTHROPIC_MODEL: process.env.NUXT_AI_ANTHROPIC_MODEL || process.env.AI_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
    CLAUDE_API_KEY: process.env.NUXT_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY,

    // Redis connection URL for centralized session management
    REDIS_URL: process.env.REDIS_URL,

    // Database configuration
    DATABASE_URL: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL,
    DB_NAME: process.env.NUXT_DB_NAME || process.env.DB_NAME,
    DB_USER: process.env.NUXT_DB_USER || process.env.DB_USER,
    DB_PASSWORD: process.env.NUXT_DB_PASSWORD || process.env.DB_PASSWORD,
    DB_HOST: process.env.NUXT_DB_HOST || process.env.DB_HOST,
    DB_PORT: process.env.NUXT_DB_PORT || process.env.DB_PORT,
    DB_SCHEMA: process.env.NUXT_DB_SCHEMA || process.env.DB_SCHEMA,
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
    manifest: {
      name: "Flossly",
      short_name: "Flossly",
      description: "Dental practice management software",
      theme_color: "#0061FB",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      icons: [
        {
          src: "/pwa-64x64.png",
          sizes: "64x64",
          type: "image/png",
        },
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-maskable-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      navigateFallback: null,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      globPatterns: ["**/*.{js,css,html,png,svg,ico,woff,woff2}"],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/i,
          handler: "NetworkOnly",
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
  build: {
    transpile: ["v-phone-input"],
  },
  css: [
    "vuetify/lib/styles/main.sass",
    "@/assets/css/fonts.css",
    "@/assets/css/global.css",
    "v-phone-input/styles",
    "flag-icons/css/flag-icons.min.css",
  ],
  // Add loading indicator for page transitions
  loading: {
    color: '#0061FB',
    height: '3px',
    continuous: true,
    duration: 3000
  },
  app: {
    head: {
      title: "Flossly",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#0061FB" },
        {
          hid: "description",
          name: "description",
          content: process.env.npm_package_description || "",
        },
      ],
      link: [
        // Favicon
        { rel: "icon", type: "image/png", href: "/Logoicon2.svg" },
        // PWA manifest
        { rel: "manifest", href: "/manifest.webmanifest" },

      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon-180x180.png" },
      { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-touch-icon-152x152.png" },
      { rel: "apple-touch-icon", sizes: "120x120", href: "/apple-touch-icon-120x120.png" },
      { rel: "apple-touch-icon", sizes: "76x76", href: "/apple-touch-icon-76x76.png" },
    ],
      script: [
        { src: "https://js.stripe.com/v3/", defer: true },
        // Load lottie-player synchronously in head - no defer so it loads immediately
        { src: "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js", body: false }
      ],
      style: [
        {
          children: `
            /* Critical CSS - Loaded immediately to prevent FOUC */
            #__nuxt {
              visibility: hidden;
            }
            #app-loader {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 99999;
              transition: opacity 0.3s ease-out;
            }
            #app-loader.hide {
              opacity: 0;
              pointer-events: none;
            }
            body.app-loaded #__nuxt {
              visibility: visible;
            }
            /* Placeholder styles while lottie loads */
            #loader-container:empty::before {
              content: '';
              display: block;
              width: 200px;
              height: 200px;
              background-image: url('/Logoicon2.svg');
              background-size: 80px 80px;
              background-repeat: no-repeat;
              background-position: center;
              animation: fadeInOut 1.5s ease-in-out infinite;
            }
            @keyframes fadeInOut {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `,
          type: 'text/css'
        }
      ],
      bodyAttrs: {
        class: ''
      }
    },
  },
  imports: {
    dirs: ["./stores"],
  },
  pinia: {
    autoImports: ["defineStore", "acceptHMRUpdate"],
  },
  nitro: {
    externals: {
      inline: ['xlsx', '@anthropic-ai/sdk'],
    },
  },
  vue: {
    compilerOptions: {
      // Treat registered web components as custom elements during SSR/component resolution.
      isCustomElement: (tag) =>
        tag === "emoji-picker" ||
        tag === "lord-icon" ||
        tag === "lottie-player",
    },
  },
  vite: {
    ssr: {
      noExternal: ["vuetify", "v-phone-input", "@anthropic-ai/sdk"], // add the vuetify vite plugin
    },
  },
  devServer: {
    port: 3000,
    host: "0.0.0.0",
  },
});
