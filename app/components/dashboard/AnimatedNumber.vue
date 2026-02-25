<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { formatBytes as formatBytesHelper } from '~/lib/api-helpers'

const props = withDefaults(defineProps<{
  value: number
  duration?: number
  formatBytes?: boolean
  formatter?: (value: number) => string
  locale?: string
  formatOptions?: Intl.NumberFormatOptions
}>(), {
  duration: 1000,
  formatBytes: false,
  locale: 'en-US'
})

const displayValue = ref(0)
const animationFrame = ref<number>()

function animateValue(start: number, end: number, duration: number) {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
  }

  const startTime = Date.now()
  const difference = end - start

  const step = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    
    displayValue.value = Math.floor(start + difference * easeOutQuart)

    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(step)
    } else {
      displayValue.value = end
    }
  }

  animationFrame.value = requestAnimationFrame(step)
}

watch(() => props.value, (newValue, oldValue) => {
  animateValue(oldValue ?? 0, newValue, props.duration)
}, { immediate: false })

onMounted(() => {
  animateValue(0, props.value, props.duration)
})

const formattedDisplayValue = computed(() => {
  const value = displayValue.value

  if (props.formatter) {
    return props.formatter(value)
  }

  if (props.formatBytes) {
    return formatBytesHelper(value)
  }

  if (props.formatOptions) {
    return value.toLocaleString(props.locale, props.formatOptions)
  }

  return value.toLocaleString(props.locale)
})
</script>

<template>
  <span class="tabular-nums">
    {{ formattedDisplayValue }}
  </span>
</template>
