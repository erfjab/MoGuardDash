<script setup lang="ts">
import { Button } from '@/components/ui/button'

const route = useRoute()
const { t } = useI18n()

// Map of route paths to translation keys
const routeNameMap: Record<string, string> = {
  'subscriptions': 'nav.subscriptions',
  'services': 'nav.services',
  'nodes': 'nav.nodes',
  'admins': 'nav.admins',
  'config': 'nav.config',
  'security': 'nav.security',
  'access': 'nav.links',
  'placeholders': 'nav.placeholders',
  'notifications': 'nav.notifications',
  'telegram': 'nav.telegramBot',
  'discord': 'nav.discordWebhook',
  'backup': 'nav.backup',
  'api': 'nav.apiAccess',
  'faq': 'nav.faqHelp',
}

function setLinks() {
  if (route.fullPath === '/') {
    return [{ title: t('common.home'), href: '/' }]
  }

  const segments = route.fullPath.split('/').filter(item => item !== '')

  const breadcrumbs = segments.map((item, index) => {
    const translationKey = routeNameMap[item]
    const title = translationKey ? t(translationKey) : item
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    return {
      title,
      href: `/${segments.slice(0, index + 1).join('/')}`,
    }
  })

  return [{ title: t('common.home'), href: '/' }, ...breadcrumbs]
}

const links = ref<{
  title: string
  href: string
}[]>(setLinks())

watch(() => route.fullPath, (val) => {
  if (val) {
    links.value = setLinks()
  }
})
</script>

<template>
  <header class="sticky top-0 z-10 h-(--header-height) flex items-center gap-4 border-b bg-background px-4 md:px-6">
    <div class="w-full flex items-center gap-4 h-4">
      <SidebarTrigger />
      <Separator orientation="vertical" />
      <BaseBreadcrumbCustom :links="links" />
    </div>
    <div class="ml-auto flex items-center gap-2">
      <slot />
    </div>
  </header>
</template>

<style scoped>
@keyframes shine {
  0% {
    left: -100%;
    opacity: 0;
  }
  1% {
    left: -100%;
    opacity: 1;
  }
  10% {
    left: 200%;
    opacity: 1;
  }
  100% {
    left: 200%;
    opacity: 0;
  }
}

.help-btn {
  position: relative;
  overflow: hidden;
}

.help-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  transform: skewX(-25deg);
  animation: shine 10s infinite ease-in-out;
  pointer-events: none;
}
</style>
