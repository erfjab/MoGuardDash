<script setup lang="ts">
import { ConfigProvider } from 'reka-ui'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'

const colorMode = useColorMode()
const color = computed(() => colorMode.value === 'dark' ? '#09090b' : '#ffffff')
const { theme } = useAppSettings()
const { locale } = useI18n()

// Force RTL/FA globally
const dir = computed(() => 'rtl')
const lang = computed(() => 'fa')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'apple-mobile-web-app-title', content: 'Dashboard' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'manifest', href: '/site.webmanifest' }
  ],
  htmlAttrs: {
    lang,
    dir,
  },
  bodyAttrs: {
    class: computed(() => `color-${theme.value?.color || 'blue'} theme-scaled theme-rounded-${theme.value?.radius || 'medium'}`),
  },
})

const { t } = useI18n()
const title = computed(() => t('appInfo.title'))
const description = computed(() => t('appInfo.description'))

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})

const router = useRouter()

defineShortcuts({
  'G-H': () => router.push('/'),
})
</script>

<template>
  <Body class="overscroll-none antialiased bg-background text-foreground">
    <ConfigProvider dir="rtl">
      <div id="app" vaul-drawer-wrapper class="relative">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

      <Toaster :theme="colorMode.preference as any || 'system'" />
    </ConfigProvider>
  </Body>
</template>
