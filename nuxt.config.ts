import tailwindcss from '@tailwindcss/vite'
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  devServer: {
    host: '0.0.0.0',
    port: 8080,
  },


  css: ['~/assets/css/tailwind.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
    build: {
      minify: 'esbuild',
      cssCodeSplit: true,
      cssMinify: 'esbuild',
      rollupOptions: {
        treeshake: 'recommended',
        output: {
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'charts': ['lucide-vue-next'],
          },
        },
      },
    },
  },

  sourcemap: {
    server: false,
    client: false
  },
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
    },
  ],

  modules: [
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/fonts',
    '@nuxtjs/i18n',
  ],

  i18n: {
    locales: [
      {
        code: 'fa',
        name: 'فارسی',
        file: 'fa.json',
        dir: 'rtl',
      },
    ],
    lazy: true,
    langDir: '../i18n/locales/',
    defaultLocale: 'fa',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "~/components/ui"
     */
    componentDir: '~/components/ui',
  },

  colorMode: {
    classSuffix: '',
  },

  eslint: {
    config: {
      standalone: false,
    },
  },

  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700, 800],
    },
  },

  routeRules: {
    '/backend/**': { proxy: (process.env.NUXT_PUBLIC_API_TARGET || 'https://my.solidlayerco.com') + '/**' },
    '/': { ssr: false, prerender: false },
    '/subscriptions': { ssr: false, prerender: false },
    '/settings': { ssr: false, prerender: false },
    '/api': { ssr: false, prerender: false },
    '/nodes': { ssr: false, prerender: false },
    '/services': { ssr: false, prerender: false },
    '/admins': { ssr: false, prerender: false },
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://my.solidlayerco.com' },
        { rel: 'dns-prefetch', href: 'https://my.solidlayerco.com' },
      ],
    },
  },

  imports: {
    dirs: [],
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: '/backend',
    },
  },

  compatibilityDate: '2024-12-14',
})
