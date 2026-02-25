<script setup lang="ts">
import type { ThemeColor, ThemeRadius } from '@/constants/themes'
import { THEME_COLORS, THEME_RADII } from '@/constants/themes'

const { theme, sidebar, updateAppSettings } = useAppSettings()

const allColors: ThemeColor[] = THEME_COLORS.map(color => color.name)
const allRadii: ThemeRadius[] = THEME_RADII.map(radius => radius.name)

const colorClasses = allColors.map(color => `color-${color}`)
const radiusClasses = allRadii.map(radius => `theme-rounded-${radius}`)

const DEFAULT_RADIUS: ThemeRadius = 'medium'

const isValidRadius = (value?: string | null): value is ThemeRadius =>
  !!value && allRadii.includes(value as ThemeRadius)

const currentRadius = computed<ThemeRadius>(() => (
  isValidRadius(theme.value?.radius) ? (theme.value?.radius as ThemeRadius) : DEFAULT_RADIUS
))

watch(
  () => theme.value?.radius,
  (value) => {
    if (!isValidRadius(value)) {
      updateAppSettings({ theme: { radius: DEFAULT_RADIUS } })
    }
  },
  { immediate: true },
)

watch(
  () => [theme.value?.color, currentRadius.value],
  () => setThemeClasses(),
)

function setThemeClasses() {
  if (typeof document === 'undefined') return
  document.body.classList.remove(...colorClasses, ...radiusClasses)
  document.body.classList.add(
    `color-${theme.value?.color || 'blue'}`,
    `theme-rounded-${currentRadius.value}`,
  )
}

function backgroundColor(color: ThemeColor) {
  const bg = THEME_COLORS.find(theme => theme.name === color)
  return bg?.value
}

function radiusLabel(radius: ThemeRadius) {
  return THEME_RADII.find(option => option.name === radius)?.label || radius
}

function colorLabel(color: ThemeColor) {
  const colorNames: Record<ThemeColor, string> = {
    'blue': 'آبی',
    'green': 'سبز',
    'violet': 'بنفش',
    'rose': 'صورتی',
    'red': 'قرمز',
    'teal': 'فیروزه‌ای',
    'yellow': 'زرد',
    'orange': 'نارنجی',
    'default': 'پیش‌فرض'
  }
  return colorNames[color] || color
}

const colorMode = useColorMode()
</script>

<template>
  <div class="grid gap-6" dir="rtl">
    <div class="space-y-1.5">
      <Label class="text-right">رنگ</Label>
      <div class="grid grid-cols-3 gap-2">
        <template v-for="col in allColors" :key="col">
          <Button
            class="justify-start gap-2"
            variant="outline"
            :class="{ '!border-primary border-2 !bg-primary/10': theme?.color === col }"
            @click="updateAppSettings({ theme: { color: col } })"
          >
            <span class="h-5 w-5 flex items-center justify-center rounded-full border border-white" :style="{ backgroundColor: backgroundColor(col) }">
              <Icon v-if="col === theme?.color" name="i-radix-icons-check" size="16" class="text-white" />
            </span>
            <span class="text-xs">{{ colorLabel(col) }}</span>
          </Button>
        </template>
      </div>
    </div>
    <!-- <div class="space-y-1.5">
      <Label>Border Radius</Label>
      <div class="grid grid-cols-2 gap-2">
        <template v-for="radius in allRadii" :key="radius">
          <Button
            class="justify-between gap-2"
            variant="outline"
            :class="{ '!border-primary border-2 !bg-primary/10': currentRadius === radius }"
            @click="updateAppSettings({ theme: { radius } })"
          >
            <span class="text-xs capitalize">{{ radiusLabel(radius) }}</span>
            <span
              class="flex h-6 w-10 items-center justify-center border border-muted-foreground/30 bg-muted/30"
              :class="{
                'rounded-none': radius === 'none',
                'rounded-[4px]': radius === 'medium',
                'rounded-[8px]': radius === 'large',
                'rounded-full': radius === 'full',
              }"
            ></span>
          </Button>
        </template>
      </div>
    </div> -->
    <div class="space-y-1.5">
      <Label class="text-right">تم</Label>
      <div class="grid grid-cols-3 gap-2">
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': colorMode.preference === 'light' }"
          @click="colorMode.preference = 'light'"
        >
          <Icon name="i-ph-sun-dim-duotone" size="16" />
          <span class="text-xs">روشن</span>
        </Button>
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': colorMode.preference === 'dark' }"
          @click="colorMode.preference = 'dark'"
        >
          <Icon name="i-ph-moon-stars-duotone" size="16" />
          <span class="text-xs">تاریک</span>
        </Button>
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': colorMode.preference === 'system' }"
          @click="colorMode.preference = 'system'"
        >
          <Icon name="i-lucide-monitor" size="16" />
          <span class="text-xs">سیستم</span>
        </Button>
      </div>
    </div>
    <div class="space-y-1.5">
      <Label class="text-right">نوع سایدبار</Label>
      <div class="grid grid-cols-3 gap-2">
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': sidebar?.variant === 'sidebar' }"
          @click="updateAppSettings({ sidebar: { variant: 'sidebar' } })"
        >
          <Icon name="i-lucide-panel-left" size="16" />
          <span class="text-xs">سایدبار</span>
        </Button>
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': sidebar?.variant === 'floating' }"
          @click="updateAppSettings({ sidebar: { variant: 'floating' } })"
        >
          <Icon name="i-lucide-copy" size="16" />
          <span class="text-xs">شناور</span>
        </Button>
        <Button
          class="justify-center gap-2"
          variant="outline"
          :class="{ '!border-primary border-2 !bg-primary/10': sidebar?.variant === 'inset' }"
          @click="updateAppSettings({ sidebar: { variant: 'inset' } })"
        >
          <Icon name="i-lucide-layout-dashboard" size="16" />
          <span class="text-xs">توکار</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
