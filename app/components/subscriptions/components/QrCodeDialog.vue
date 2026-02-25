<script setup lang="ts">
import { buildSubscriptionLink, createQrCodeUrl } from '@/lib/api-helpers'
import type { SubscriptionResponse } from '~/types/api'

const props = defineProps<{
  subscription: SubscriptionResponse | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const subscriptionLink = computed(() => {
  if (!props.subscription) return ''
  return buildSubscriptionLink(props.subscription).link
})

const qrCodeUrl = computed(() => {
  if (!subscriptionLink.value) return ''
  return createQrCodeUrl(subscriptionLink.value)
})

const imageLoaded = ref(false)
const imageError = ref(false)

watch(() => props.open, (newVal: boolean) => {
  if (newVal) {
    imageLoaded.value = false
    imageError.value = false
  }
})

function handleImageLoad() {
  imageLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="max-w-md max-h-[90vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>بارکد اشتراک</DialogTitle>
        <DialogDescription class="text-right">
          این بارکد را اسکن کنید تا اشتراک اضافه شود
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col items-center justify-center py-8 space-y-4">
        <div v-if="!imageError" class="relative w-80 h-80 bg-muted rounded-lg flex items-center justify-center">
          <div v-if="!imageLoaded" class="absolute inset-0 flex items-center justify-center">
            <Icon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <img 
            v-if="qrCodeUrl"
            :src="qrCodeUrl" 
            alt="QR Code"
            class="w-full h-full object-contain rounded-lg"
            :class="{ 'opacity-0': !imageLoaded }"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>
        <div v-else class="w-80 h-80 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-center">
          <div class="text-center space-y-2">
            <Icon name="i-lucide-alert-circle" class="h-8 w-8 text-destructive mx-auto" />
            <p class="text-sm text-destructive">بارگذاری بارکد ناموفق بود</p>
          </div>
        </div>

        <div v-if="subscription" class="text-center space-y-1">
          <p class="text-sm font-medium">{{ subscription.username }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          بستن
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
