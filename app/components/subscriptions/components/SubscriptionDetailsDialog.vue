<script setup lang="ts">
import type { SubscriptionResponse, AutoRenewalUpdate } from '~/types/api'
import { getSubscriptionMetrics } from '../data/schema'
import { buildSubscriptionLink, copyToClipboard } from '@/lib/api-helpers'
import { smartToast as toast } from '~/lib/smart-toast'
import QrCodeDialog from './QrCodeDialog.vue'
import ServiceSelector from './ServiceSelector.vue'
import AutoRenewalManager from './AutoRenewalManager.vue'
import { useI18n } from '#imports'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const props = defineProps<{
  subscription: SubscriptionResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
  (e: 'updated', subscription: SubscriptionResponse): void
}>()

const open = computed({
  get: () => !!props.subscription,
  set: (value: boolean) => {
    if (!value) emit('close')
  },
})

const api = useApi()
const { t } = useI18n()
const isLoading = ref(false)
const form = ref({
  username: '',
  limit_usage_gb: 0,
  limit_expire_days: 0,
  expire_on_first_connect: false,
  auto_delete_days: 0,
  service_ids: [] as number[],
  note: '',
  telegram_id: '',
  discord_webhook_url: '',
  auto_renewals: [] as AutoRenewalUpdate[],
})

// UI state
const copiedLink = ref(false)
const confirmOpen = ref(false)
const confirmAction = ref<'enable' | 'disable' | 'reset' | 'revoke' | 'remove' | ''>('')
const qrCodeOpen = ref(false)
const autoDeleteOpen = ref(false)
const extraOpen = ref(false)

const usernameError = computed(() => {
  const username = form.value.username
  if (!username) return null
  
  if (username.length < 3) {
    return t('subscriptions.usernameMin')
  }
  
  if (username.length > 30) {
    return t('subscriptions.usernameMax')
  }
  
  const regex = /^[a-z0-9_]+$/
  if (!regex.test(username)) {
    return t('subscriptions.usernamePattern')
  }
  
  return null
})

const metrics = computed(() => {
  if (!props.subscription) return null
  return getSubscriptionMetrics(props.subscription)
})

const leftUsageText = computed(() => {
  const sub = props.subscription
  if (!sub) return '-'
  if (sub.limit_usage === 0) return t('subscriptions.unlimited')
  const left = Math.max(0, sub.limit_usage - sub.current_usage)
  return formatBytes(left)
})

const statusEmoji = computed(() => {
  if (!props.subscription) return { color: 'bg-gray-400', pulse: false }
  const sub = props.subscription
  if (!sub.enabled) return { color: 'bg-gray-400', pulse: false } // disabled
  if (sub.limited) return { color: 'bg-red-500', pulse: false } // limited
  if (sub.expired) return { color: 'bg-yellow-500', pulse: false } // expired
  if (sub.limit_expire < 0) return { color: 'bg-purple-500', pulse: false } // on first connect
  return { color: 'bg-green-500', pulse: true } // active
})

const statusAlerts = computed(() => {
  if (!props.subscription) return []
  const alerts = []
  const sub = props.subscription

  if (sub.limited) {
    alerts.push({
      message: t('subscriptions.statusLimitedMessage'),
      class: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
      icon: 'i-lucide-alert-triangle'
    })
  }
  
  if (sub.expired) {
    alerts.push({
      message: t('subscriptions.statusExpiredMessage'),
      class: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
      icon: 'i-lucide-clock'
    })
  }

  if (!sub.enabled) {
    alerts.push({
      message: t('subscriptions.statusDisabledMessage'),
      class: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400',
      icon: 'i-lucide-ban'
    })
  }

  return alerts
})

const subscriptionLink = computed(() => {
  if (!props.subscription) return ''
  return buildSubscriptionLink(props.subscription).link
})

const lastOnlineText = computed(() => {
  if (!props.subscription?.online_at) return t('subscriptions.neverOnline')
  const date = new Date(props.subscription.online_at)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return t('subscriptions.justNow')
  if (diffMins < 60) return t('subscriptions.minsAgo', { count: diffMins })
  if (diffHours < 24) return t('subscriptions.hoursAgo', { count: diffHours })
  return t('subscriptions.daysAgo', { count: diffDays })
})

watch(() => props.subscription, (sub: SubscriptionResponse | null) => {
  if (sub) {
    // Set username
    form.value.username = sub.username
    
    // Convert bytes to GB
    form.value.limit_usage_gb = sub.limit_usage / (1024 * 1024 * 1024)
    
    // Determine if on first connect and convert to days
    if (sub.limit_expire < 0) {
      form.value.expire_on_first_connect = true
      form.value.limit_expire_days = Math.abs(sub.limit_expire) / 86400
    } else if (sub.limit_expire === 0) {
      form.value.expire_on_first_connect = false
      form.value.limit_expire_days = 0
    } else {
      form.value.expire_on_first_connect = false
      // Convert timestamp to remaining days
      const now = Math.floor(Date.now() / 1000)
      const remainingSeconds = sub.limit_expire - now
      form.value.limit_expire_days = Math.max(0, Math.ceil(remainingSeconds / 86400))
    }
    
    // Set service IDs from subscription
    form.value.service_ids = [...sub.service_ids]
    
    // Set note
    form.value.note = sub.note || ''
    
    // Set telegram_id
    form.value.telegram_id = sub.telegram_id || ''

    // Set discord_webhook_url
    form.value.discord_webhook_url = sub.discord_webhook_url || ''

    form.value.auto_delete_days = sub.auto_delete_days ?? 0

    // Set auto_renewals - the AutoRenewalManager will handle conversion from existingRenewals prop
    form.value.auto_renewals = []
  }
  copiedLink.value = false
}, { immediate: true })

async function handleToggleStatus() {
  if (!props.subscription) return
  confirmAction.value = props.subscription.enabled ? 'disable' : 'enable'
  confirmOpen.value = true
}

async function handleResetUsage() {
  if (!props.subscription) return
  confirmAction.value = 'reset'
  confirmOpen.value = true
}

async function handleRevoke() {
  if (!props.subscription) return
  confirmAction.value = 'revoke'
  confirmOpen.value = true
}

async function handleRemove() {
  if (!props.subscription) return
  confirmAction.value = 'remove'
  confirmOpen.value = true
}

async function handleUpdate() {
  if (!props.subscription) return

  // Validate username if changed
  if (usernameError.value) {
    toast.error(usernameError.value)
    return
  }

  if (form.value.auto_delete_days < 0) {
    toast.error(t('subscriptions.autoDeleteNegative'))
    return
  }

  isLoading.value = true
  try {
    // Convert GB to bytes
    const limitUsageBytes = Math.floor(form.value.limit_usage_gb * 1024 * 1024 * 1024)
    
    // Calculate limit_expire based on expire_on_first_connect
    let limitExpire = form.value.limit_expire_days
    if (form.value.expire_on_first_connect && limitExpire > 0) {
      // Convert days to negative seconds
      limitExpire = -(limitExpire * 86400)
    } else if (limitExpire > 0) {
      // Convert to timestamp
      limitExpire = Math.floor(Date.now() / 1000) + (limitExpire * 86400)
    }

    const autoDeleteDays = Math.max(0, Math.floor(form.value.auto_delete_days || 0))

    // Only include username in update if it changed
    const updateData: any = {
      limit_usage: limitUsageBytes,
      limit_expire: limitExpire,
      service_ids: form.value.service_ids,
      note: form.value.note,
      telegram_id: form.value.telegram_id || null,
      discord_webhook_url: form.value.discord_webhook_url || null,
      auto_delete_days: autoDeleteDays,
      auto_renewals: form.value.auto_renewals.length > 0 ? form.value.auto_renewals : [],
    }
    
    const usernameChanged = form.value.username !== props.subscription.username
    if (usernameChanged) {
      updateData.username = form.value.username
    }

    // API returns the updated subscription
    const updatedSub = await api.subscriptions.update(props.subscription.username, updateData)
    toast.success(t('subscriptions.updateSuccess'))
    
    // Emit updated subscription with new data
    emit('updated', updatedSub)
  } catch (error: any) {
    toast.error(error.message || t('subscriptions.updateFailed'))
  } finally {
    isLoading.value = false
  }
}

async function handleCopyLink() {
  const link = subscriptionLink.value?.trim()
  if (!link) {
    toast.error(t('subscriptions.noLink'))
    return
  }

  const copied = await copyToClipboard(link)
  if (copied) {
    toast.success(t('subscriptions.copySuccess'))
    copiedLink.value = true
    setTimeout(() => (copiedLink.value = false), 2000)
  } else {
    toast.error(t('subscriptions.clipboardBlocked'))
  }
}

const { formatDateAgo } = useFormatTime()

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ${t('subscriptions.gbUnit')}`
}

function formatDate(dateString?: string | null): string {
  return formatDateAgo(dateString)
}

// Perform confirmed actions
async function performConfirmedAction() {
  if (!props.subscription) return
  const username = props.subscription.username
  isLoading.value = true
  
  try {
    let updatedSub: SubscriptionResponse | null = null
    let result: SubscriptionResponse[] | null = null
    
    switch (confirmAction.value) {
      case 'enable':
        result = await api.subscriptions.enable([username])
        updatedSub = result?.[0] ?? null
        toast.success(t('subscriptions.enableSuccess'))
        break
      case 'disable':
        result = await api.subscriptions.disable([username])
        updatedSub = result?.[0] ?? null
        toast.success(t('subscriptions.disableSuccess'))
        break
      case 'reset':
        result = await api.subscriptions.reset([username])
        updatedSub = result?.[0] ?? null
        toast.success(t('subscriptions.resetSuccess'))
        break
      case 'revoke':
        result = await api.subscriptions.revoke([username])
        updatedSub = result?.[0] ?? null
        toast.success(t('subscriptions.revokeSuccess'))
        break
      case 'remove':
        await api.subscriptions.delete([username])
        toast.success(t('subscriptions.removeSuccess'))
        confirmOpen.value = false
        confirmAction.value = ''
        isLoading.value = false
        emit('close')
        emit('refresh')
        return
    }
    
    // Send updated subscription to parent
    if (updatedSub) {
      emit('updated', updatedSub)
    }
    
  } catch (error: any) {
    const map: Record<string, string> = {
      enable: t('subscriptions.enableFailed'),
      disable: t('subscriptions.disableFailed'),
      reset: t('subscriptions.resetFailed'),
      revoke: t('subscriptions.revokeFailed'),
      remove: t('subscriptions.removeFailed'),
    }
    const key = confirmAction.value as keyof typeof map
    toast.error(error?.message || map[key] || t('subscriptions.actionFailed'))
  } finally {
    isLoading.value = false
    confirmOpen.value = false
    confirmAction.value = ''
  }
}

const confirmMessages: Record<string, { title: string; description: string; variant: 'default' | 'destructive' }> = {
  enable: {
    title: t('subscriptions.enableTitle'),
    description: t('subscriptions.enableDescription'),
    variant: 'default',
  },
  disable: {
    title: t('subscriptions.disableTitle'),
    description: t('subscriptions.disableDescription'),
    variant: 'destructive',
  },
  reset: {
    title: t('subscriptions.resetTitle'),
    description: t('subscriptions.resetDescription'),
    variant: 'default',
  },
  revoke: {
    title: t('subscriptions.revokeTitle'),
    description: t('subscriptions.revokeDescription'),
    variant: 'destructive',
  },
  remove: {
    title: t('subscriptions.removeTitle'),
    description: t('subscriptions.removeDescription'),
    variant: 'destructive',
  },
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-md sm:w-full sm:max-w-lg max-h-[70vh] sm:max-h-[75vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle class="text-right w-full">{{ t('subscriptions.editSubscription') }}</DialogTitle>
        <DialogDescription class="text-right w-full">
          {{ t('subscriptions.editSubscriptionDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="subscription" class="space-y-3 py-4">
        <!-- Status Alerts -->
        <div v-if="statusAlerts.length" class="space-y-2">
          <div 
            v-for="(alert, index) in statusAlerts" 
            :key="index"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            :class="alert.class"
          >
            <Icon :name="alert.icon" class="h-4 w-4 shrink-0" />
            <span>{{ alert.message }}</span>
          </div>
        </div>

        <!-- Username with status dot and last online -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="relative flex items-center">
              <span v-if="statusEmoji.pulse" class="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full opacity-75" :class="statusEmoji.color" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="statusEmoji.color" />
            </div>
            <Label for="username">{{ t('common.username') }}</Label>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="username"
              v-model="form.username"
              :disabled="isLoading"
              class="flex-1 min-w-0"
              :class="{ 'border-red-500 focus-visible:ring-red-500': usernameError }"
            />
            <Button
              variant="outline"
              @click="handleToggleStatus"
              :disabled="isLoading"
              class="shrink-0 whitespace-nowrap"
            >
              <Icon :name="subscription.enabled ? 'i-lucide-pause' : 'i-lucide-play'" class="mr-1.5 h-3.5 w-3.5" />
              <span class="text-xs">{{ subscription.enabled ? t('subscriptions.disable') : t('subscriptions.enable') }}</span>
            </Button>
          </div>
          <div v-if="usernameError" class="text-xs text-red-500">
            {{ usernameError }}
          </div>
          <div v-else class="text-xs text-muted-foreground/60">
            {{ lastOnlineText }}
          </div>
        </div>

        <!-- Data Limit with Reset button -->
        <div class="space-y-2">
          <Label for="limit_usage_gb">{{ t('subscriptions.dataLimitGb') }}</Label>
          <div class="flex items-center gap-2">
            <Input
              id="limit_usage_gb"
              v-model.number="form.limit_usage_gb"
              type="number"
              step="0.1"
              min="0"
              :disabled="isLoading"
              :placeholder="t('subscriptions.zeroUnlimited')"
              class="flex-1 min-w-0"
            />
            <div class="shrink-0 w-auto h-10 border rounded-md flex items-center px-3 text-xs bg-muted/30">
              <span class="font-medium">{{ formatBytes(subscription.current_usage) }}</span>
            </div>
            <Button
              variant="outline"
              @click="handleResetUsage"
              :disabled="isLoading"
              class="shrink-0 whitespace-nowrap"
            >
              <Icon name="i-radix-icons-reset" class="mr-1.5 h-3.5 w-3.5" />
              <span class="text-xs">{{ t('subscriptions.resetUsed') }}</span>
            </Button>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs text-muted-foreground/60">
              {{ t('subscriptions.leftLabel') }}: {{ leftUsageText }}
            </div>
            <div class="flex gap-1">
              <Button
                v-for="val in [0.1, 1, 10, 50]"
                :key="val"
                type="button"
                variant="ghost"
                class="h-9 px-3 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                @click="form.limit_usage_gb = +((form.limit_usage_gb || 0) + val).toFixed(2)"
                :disabled="isLoading"
              >
                +{{ val }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Time Limit -->
        <div class="space-y-2">
          <Label for="limit_expire_days">{{ t('subscriptions.timeLimitDays') }}</Label>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Input
              id="limit_expire_days"
              v-model.number="form.limit_expire_days"
              type="number"
              min="0"
              :disabled="isLoading"
              class="flex-1 min-w-0"
              :placeholder="t('subscriptions.zeroUnlimited')"
            />
            <div class="flex flex-col gap-2 sm:w-auto">
              <Button
                type="button"
                :variant="form.expire_on_first_connect ? 'default' : 'outline'"
                @click="form.expire_on_first_connect = !form.expire_on_first_connect"
                :disabled="isLoading || form.limit_expire_days === 0"
                class="whitespace-nowrap"
              >
                <Icon name="i-radix-icons-timer" class="mr-1.5 h-3.5 w-3.5" />
                <span class="text-xs">{{ t('subscriptions.onFirstConnect') }}</span>
              </Button>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground/60">
            <div>
              <template v-if="form.limit_expire_days === 0">
                {{ t('subscriptions.noTimeLimit') }}
              </template>
              <template v-else-if="form.expire_on_first_connect">
                {{ t('subscriptions.startsAfterFirst') }}
              </template>
              <template v-else>
                {{ t('subscriptions.expiresInDays', { count: form.limit_expire_days }) }}
              </template>
            </div>
            <div class="flex flex-wrap gap-1">
              <Button
                v-for="val in [1, 5, 10]"
                :key="val"
                type="button"
                variant="ghost"
                class="h-9 px-3 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                @click="form.limit_expire_days = +((form.limit_expire_days || 0) + val)"
                :disabled="isLoading"
              >
                +{{ val }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Subscription Link Actions -->
        <div class="space-y-2">
          <Label>{{ t('subscriptions.linkActions') }}</Label>
          <div class="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              @click="handleCopyLink"
              :disabled="isLoading"
              class="w-full"
              :title="subscriptionLink || t('subscriptions.noLink')"
            >
              <Icon :name="copiedLink ? 'i-lucide-check' : 'i-lucide-link'" class="mr-1.5 h-3.5 w-3.5" />
              <span class="text-xs">{{ copiedLink ? t('common.copied') : t('common.copy') }}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="qrCodeOpen = true"
              :disabled="isLoading"
              class="w-full"
            >
              <Icon name="i-lucide-qr-code" class="mr-1.5 h-3.5 w-3.5" />
              <span class="text-xs">{{ t('subscriptions.qrCode') }}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="handleRevoke"
              :disabled="isLoading"
              class="w-full"
            >
              <Icon name="i-radix-icons-lock-closed" class="mr-1.5 h-3.5 w-3.5" />
              <span class="text-xs">{{ t('subscriptions.revoke') }}</span>
            </Button>
          </div>
          <div class="text-xs text-muted-foreground/60 text-center">
            {{ t('subscriptions.manageLinkAccess') }}
          </div>
        </div>

        <!-- Services Selection -->
        <ServiceSelector 
          v-model="form.service_ids" 
          :disabled="isLoading"
        />

        <!-- Auto Delete Collapsible -->
        <Collapsible v-model:open="autoDeleteOpen" class="mt-2 w-full border rounded-lg">
          <CollapsibleTrigger class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <Icon 
                name="i-lucide-chevron-right" 
                class="h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-90': autoDeleteOpen }"
              />
              <span class="font-medium text-sm">{{ t('subscriptions.autoDelete') }}</span>
              <Badge v-if="form.auto_delete_days > 0" variant="secondary" class="ml-1">
                {{ t('subscriptions.daysValue', { count: form.auto_delete_days }) }}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-4 py-3 space-y-2 overflow-hidden">
              <p class="text-xs text-muted-foreground">
                {{ t('subscriptions.autoDeleteDescription') }} وقتی صفر باشد، اشتراک حذف نخواهد شد.
              </p>
              <div class="space-y-1.5">
                <Label for="auto_delete_days" class="text-xs">{{ t('subscriptions.autoDeleteDays') }}</Label>
                <Input
                  id="auto_delete_days"
                  v-model.number="form.auto_delete_days"
                  type="number"
                  min="0"
                  :disabled="isLoading"
                  class="h-9"
                  :placeholder="t('subscriptions.zeroDisabled')"
                />
              </div>
              <div class="flex flex-wrap justify-end gap-1">
                <Button
                  v-for="val in [1, 7, 30, 60]"
                  :key="val"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="px-2 py-1 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                  @click="form.auto_delete_days = +(form.auto_delete_days || 0) + val"
                  :disabled="isLoading"
                >
                  +{{ val }}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- Auto Renewals -->
        <AutoRenewalManager
          v-model="form.auto_renewals"
          :existing-renewals="subscription?.auto_renewals"
          :disabled="isLoading"
          mode="edit"
        />

        <!-- Extra Info Collapsible -->
        <Collapsible v-model:open="extraOpen" class="mt-2 w-full border rounded-lg">
          <CollapsibleTrigger class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <Icon 
                name="i-lucide-chevron-right" 
                class="h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-90': extraOpen }"
              />
              <span class="font-medium text-sm">{{ t('subscriptions.extraData') }}</span>
              <Badge v-if="form.note || form.telegram_id" variant="secondary" class="ml-1">
                {{ (form.note ? 1 : 0) + (form.telegram_id ? 1 : 0) }}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-4 py-3 space-y-3 overflow-hidden">
              <p class="text-xs text-muted-foreground">
                {{ t('subscriptions.extraDataDescription') }}
              </p>
              <!-- Note Field -->
              <div class="space-y-1.5">
                <Label for="note" class="text-xs">{{ t('subscriptions.note') }}</Label>
                <Textarea
                  id="note"
                  v-model="form.note"
                  :placeholder="t('subscriptions.notePlaceholder')"
                  :disabled="isLoading"
                  rows="2"
                  class="resize-y min-h-[60px]"
                />
              </div>
              <!-- Telegram ID Field -->
              <div class="space-y-1.5">
                <Label for="telegram_id" class="text-xs">{{ t('subscriptions.telegramId') }}</Label>
                <Input
                  id="telegram_id"
                  v-model="form.telegram_id"
                  :placeholder="t('subscriptions.telegramPlaceholder')"
                  :disabled="isLoading"
                  class="h-9"
                />
              </div>
              <!-- Discord Webhook URL Field -->
              <div class="space-y-1.5">
                <Label for="discord_webhook_url" class="text-xs">{{ t('subscriptions.discordWebhook') }}</Label>
                <Input
                  id="discord_webhook_url"
                  v-model="form.discord_webhook_url"
                  :placeholder="t('subscriptions.discordPlaceholder')"
                  :disabled="isLoading"
                  class="h-9"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- <Separator /> -->

        <!-- Additional Information -->
        <!-- <div class="space-y-2">
          <h4 class="text-xs font-semibold text-muted-foreground">Information</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Owner</div>
              <div class="font-medium truncate">{{ subscription.owner_username }}</div>
            </div>
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Created</div>
              <div>{{ formatDate(subscription.created_at) }}</div>
            </div>
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Last Online</div>
              <div>{{ formatDate(subscription.online_at) }}</div>
            </div>
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Last Revoke</div>
              <div>{{ formatDate(subscription.last_revoke_at) }}</div>
            </div>
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Last Reset</div>
              <div>{{ formatDate(subscription.last_reset_at) }}</div>
            </div>
            <div class="grid grid-cols-[100px_1fr] gap-x-4 items-center">
              <div class="text-muted-foreground/70">Last Request</div>
              <div>{{ formatDate(subscription.last_request_at) }}</div>
            </div>
          </div>
        </div> -->
      </div>

      <DialogFooter class="gap-2">
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button 
          variant="outline"
          @click="handleRemove"
          :disabled="isLoading"
        >
          {{ t('subscriptions.remove') }}
        </Button>
        <Button 
          @click="handleUpdate"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="i-radix-icons-update" class="mr-2 h-4 w-4 animate-spin" />
          {{ t('common.update') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog for actions -->
  <AlertDialog v-model:open="confirmOpen">
    <AlertDialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <AlertDialogHeader class="items-start text-right space-y-1.5">
        <AlertDialogTitle>{{ confirmMessages[confirmAction]?.title }}</AlertDialogTitle>
        <AlertDialogDescription class="text-right">
          {{ confirmMessages[confirmAction]?.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter class="gap-2">
        <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
        <AlertDialogAction
          @click="performConfirmedAction"
          :class="confirmMessages[confirmAction]?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
        >
          {{ t('common.confirm') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- QR Code Dialog -->
  <QrCodeDialog
    :subscription="subscription"
    v-model:open="qrCodeOpen"
  />
</template>