import type { I18n } from '@nuxtjs/i18n'

declare module '#app' {
  interface NuxtApp {
    $i18n: I18n
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $i18n: I18n
    $t: I18n['t']
  }
}

export {}
