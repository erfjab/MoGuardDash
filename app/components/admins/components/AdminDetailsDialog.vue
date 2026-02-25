<script setup lang="ts">
import type { AdminResponse, AdminUpdate } from '~/types/api'
import { Badge } from '@/components/ui/badge'
import { smartToast as toast } from '~/lib/smart-toast'
import { formatBytes } from '~/lib/utils'
import { Icon } from '#components'
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
  admin: AdminResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const api = useApi()
const { services, fetchServices } = useAdmin()
const isLoading = ref(false)

// Confirmation state
const confirmOpen = ref(false)
const confirmAction = ref<'enable' | 'disable' | 'delete' | 'delete-subscriptions' | 'activate-subscriptions' | 'deactivate-subscriptions' | 'revoke-api-key' | ''>('')

const form = ref({
  password: '',
  role: 'seller' as 'owner' | 'seller' | 'reseller',
  service_ids: [] as number[],
  create_access: false,
  update_access: false,
  remove_access: false,
  count_limit: 0,
  usage_limit: 0,
  // Access / Link settings
  access_tag: 'guards',
  access_prefix: '',
  access_title: '',
  access_description: '',
  config_rename: '',
  max_links: 0,
  shuffle_links: false,
  username_tag: false,
  support_url: '',
  update_interval: 0,
  announce: '',
  announce_url: '',
  // Notifications
  telegram_id: '',
  telegram_token: '',
  telegram_logger_id: '',
  telegram_topic_id: '',
  telegram_status: false,
  telegram_send_subscriptions: false,
  discord_webhook_status: false,
  discord_webhook_url: '',
  discord_send_subscriptions: false,
  expire_warning_days: 0,
  usage_warning_percent: 0,
})

const open = computed({
  get: () => !!props.admin,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
    }
  }
})

watch(() => props.admin, (admin) => {
  if (admin) {
    form.value = {
      password: '',
      role: admin.role,
      service_ids: admin.service_ids || [],
      create_access: admin.create_access || false,
      update_access: admin.update_access || false,
      remove_access: admin.remove_access || false,
      count_limit: admin.count_limit || 0,
      usage_limit: admin.usage_limit ? Math.round(admin.usage_limit / (1024 ** 3)) : 0,
      access_tag: admin.access_tag || 'guards',
      access_prefix: admin.access_prefix || '',
      access_title: admin.access_title || '',
      access_description: admin.access_description || '',
      config_rename: admin.config_rename || '',
      max_links: admin.max_links || 0,
      shuffle_links: admin.shuffle_links || false,
      username_tag: admin.username_tag || false,
      support_url: admin.support_url || '',
      update_interval: admin.update_interval || 0,
      announce: admin.announce || '',
      announce_url: admin.announce_url || '',
      telegram_id: admin.telegram_id || '',
      telegram_token: admin.telegram_token || '',
      telegram_logger_id: admin.telegram_logger_id || '',
      telegram_topic_id: admin.telegram_topic_id || '',
      telegram_status: admin.telegram_status || false,
      telegram_send_subscriptions: admin.telegram_send_subscriptions || false,
      discord_webhook_status: admin.discord_webhook_status || false,
      discord_webhook_url: admin.discord_webhook_url || '',
      discord_send_subscriptions: admin.discord_send_subscriptions || false,
      expire_warning_days: admin.expire_warning_days || 0,
      usage_warning_percent: admin.usage_warning_percent || 0,
    }
  }
}, { immediate: true })

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = password
}

async function handleUpdate() {
  if (!props.admin) return
  
  isLoading.value = true
  try {
    const usageLimitBytes = form.value.usage_limit > 0 ? form.value.usage_limit * (1024 ** 3) : null

    const updateData: AdminUpdate = {
      password: form.value.password || undefined,
      create_access: form.value.create_access,
      update_access: form.value.update_access,
      remove_access: form.value.remove_access,
      count_limit: form.value.count_limit ?? null,
      usage_limit: usageLimitBytes,
      service_ids: form.value.service_ids,
      access_prefix: form.value.access_prefix || null,
      access_title: form.value.access_title || null,
      access_description: form.value.access_description || null,
      access_tag: form.value.access_tag || null,
      config_rename: form.value.config_rename || null,
      max_links: form.value.max_links > 0 ? form.value.max_links : null,
      shuffle_links: form.value.shuffle_links,
      username_tag: form.value.username_tag,
      support_url: form.value.support_url || null,
      update_interval: form.value.update_interval > 0 ? form.value.update_interval : null,
      announce: form.value.announce || null,
      announce_url: form.value.announce_url || null,
      telegram_id: form.value.telegram_id || null,
      telegram_token: form.value.telegram_token || null,
      telegram_logger_id: form.value.telegram_logger_id || null,
      telegram_topic_id: form.value.telegram_topic_id || null,
      telegram_status: form.value.telegram_status,
      telegram_send_subscriptions: form.value.telegram_send_subscriptions,
      discord_webhook_status: form.value.discord_webhook_status,
      discord_webhook_url: form.value.discord_webhook_url || null,
      discord_send_subscriptions: form.value.discord_send_subscriptions,
      expire_warning_days: form.value.expire_warning_days > 0 ? form.value.expire_warning_days : null,
      usage_warning_percent: form.value.usage_warning_percent > 0 ? form.value.usage_warning_percent : null,
    }
    
    await api.admins.update(props.admin.username, updateData)
    toast.success('ادمین با موفقیت به‌روز شد')
    emit('refresh')
    emit('close')
  } catch (error: any) {
    toast.error(error.message || 'به‌روزرسانی ادمین ناموفق بود')
  } finally {
    isLoading.value = false
  }
}

function handleToggleStatus() {
  if (!props.admin) return
  confirmAction.value = props.admin.enabled ? 'disable' : 'enable'
  confirmOpen.value = true
}

function handleDelete() {
  confirmAction.value = 'delete'
  confirmOpen.value = true
}

function handleDeleteSubscriptions() {
  confirmAction.value = 'delete-subscriptions'
  confirmOpen.value = true
}

function handleActivateSubscriptions() {
  confirmAction.value = 'activate-subscriptions'
  confirmOpen.value = true
}

function handleDeactivateSubscriptions() {
  confirmAction.value = 'deactivate-subscriptions'
  confirmOpen.value = true
}

async function handleRevokeApiKey() {
  if (!props.admin) return
  isLoading.value = true
  try {
    await api.admins.revokeApiKey(props.admin.username)
    toast.success('کلید API لغو شد')
    emit('refresh')
  } catch (error: any) {
    toast.error(error?.message || 'لغو کلید API ناموفق بود')
  } finally {
    isLoading.value = false
  }
}

async function performConfirmedAction() {
  if (!props.admin) return
  
  isLoading.value = true
  try {
    switch (confirmAction.value) {
      case 'enable':
        await api.admins.enable(props.admin.username)
        toast.success('ادمین فعال شد')
        break
      case 'disable':
        await api.admins.disable(props.admin.username)
        toast.success('ادمین غیرفعال شد')
        break
      case 'delete':
        await api.admins.delete(props.admin.username)
        toast.success('ادمین حذف شد')
        emit('close')
        break
      case 'delete-subscriptions':
        await api.admins.deleteSubscriptions(props.admin.username)
        toast.success('کاربران ادمین حذف شدند')
        break
      case 'activate-subscriptions':
        await api.admins.activateSubscriptions(props.admin.username)
        toast.success('اشتراک‌های ادمین فعال شدند')
        break
      case 'deactivate-subscriptions':
        await api.admins.deactivateSubscriptions(props.admin.username)
        toast.success('اشتراک‌های ادمین غیرفعال شدند')
        break
      case 'revoke-api-key':
        await api.admins.revokeApiKey(props.admin.username)
        toast.success('کلید API لغو شد')
        break
    }
    emit('refresh')
  } catch (error: any) {
    toast.error(error.message || 'عملیات ناموفق بود')
  } finally {
    isLoading.value = false
    confirmOpen.value = false
    confirmAction.value = ''
  }
}

const confirmMessages: Record<string, { title: string; description: string; variant: 'default' | 'destructive' }> = {
  enable: {
    title: 'فعال کردن ادمین',
    description: 'آیا مطمئن هستید که می‌خواهید این ادمین را فعال کنید؟',
    variant: 'default'
  },
  disable: {
    title: 'غیرفعال کردن ادمین',
    description: 'آیا مطمئن هستید که می‌خواهید این ادمین را غیرفعال کنید؟',
    variant: 'destructive'
  },
  delete: {
    title: 'حذف ادمین',
    description: 'آیا مطمئن هستید که می‌خواهید این ادمین را حذف کنید؟ این عملیات قابل بازگشت نیست.',
    variant: 'destructive'
  },
  'delete-subscriptions': {
    title: 'حذف کاربران ادمین',
    description: 'این عملیات تمام اشتراک‌های متعلق به این ادمین را حذف می‌کند. این عملیات قابل بازگشت نیست.',
    variant: 'destructive'
  },
  'activate-subscriptions': {
    title: 'فعال کردن اشتراک‌ها',
    description: 'تمام اشتراک‌های این ادمین فعال خواهند شد.',
    variant: 'default'
  },
  'deactivate-subscriptions': {
    title: 'غیرفعال کردن اشتراک‌ها',
    description: 'تمام اشتراک‌های این ادمین غیرفعال خواهند شد.',
    variant: 'destructive'
  },
  'revoke-api-key': {
    title: 'لغو کلید API',
    description: 'کلید API این ادمین لغو و یک کلید جدید صادر می‌شود.',
    variant: 'destructive'
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent v-if="admin" dir="rtl" class="w-[95vw] max-w-2xl sm:w-auto max-h-[85vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>ویرایش ادمین: {{ admin.username }}</DialogTitle>
        <DialogDescription>مدیریت تنظیمات و دسترسی ادمین</DialogDescription>
      </DialogHeader>

      <Tabs default-value="basic" dir="rtl">
        <TabsList class="w-full grid grid-cols-3">
          <TabsTrigger value="basic">اساسی</TabsTrigger>
          <TabsTrigger value="notifications">اعلان‌ها</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <!-- ====== Basic Tab ====== -->
        <TabsContent value="basic" class="space-y-4 py-2">
          <!-- Status + Username -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="relative flex items-center">
                <span v-if="admin.enabled" class="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-green-500 opacity-75" />
                <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="admin.enabled ? 'bg-green-500' : 'bg-gray-400'" />
              </div>
              <Label>نام کاربری</Label>
            </div>
            <div class="flex items-center justify-between gap-3">
              <div class="flex-1 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-semibold tracking-tight">
                {{ admin.username }}
              </div>
              <Button variant="outline" size="sm" @click="handleToggleStatus" :disabled="isLoading">
                <Icon :name="admin.enabled ? 'i-lucide-pause' : 'i-lucide-play'" class="ml-2 h-3.5 w-3.5" />
                {{ admin.enabled ? 'غیرفعال' : 'فعال' }}
              </Button>
            </div>
            <div class="text-sm text-muted-foreground capitalize text-right">نقش: {{ admin.role }}</div>
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <Label for="password">رمز عبور (برای حفظ خالی بگذارید)</Label>
            <div class="flex gap-2">
              <Input id="password" v-model="form.password" type="text" placeholder="مثال: sEcUrEp@ssw0rd" :disabled="isLoading" autocomplete="new-password" class="flex-1 text-right" dir="rtl" />
              <Button type="button" variant="outline" class="h-10 gap-2 shrink-0 px-4" title="تولید رمز عبور تصادفی" @click="generatePassword" :disabled="isLoading">
                <Icon name="i-lucide-key" class="h-4 w-4" />
                تصادفی
              </Button>
            </div>
          </div>

          <!-- Services -->
          <div class="space-y-2">
            <Label>سرویس‌ها</Label>
            <div class="space-y-2">
              <div
                v-for="service in services"
                :key="service.id"
                class="flex items-center justify-between border rounded-md p-3 cursor-pointer transition-all hover:bg-muted/50"
                :class="{ 'bg-primary/10 border-primary': form.service_ids.includes(service.id) }"
                @click="() => {
                  if (form.service_ids.includes(service.id)) {
                    form.service_ids = form.service_ids.filter(id => id !== service.id)
                  } else {
                    form.service_ids.push(service.id)
                  }
                }"
              >
                <span class="text-sm font-medium truncate flex-1 min-w-0 ml-4">{{ service.remark }}</span>
                <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <div class="flex items-center gap-1.5 w-14" title="نودها">
                    <Icon name="i-lucide-server" class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ service.node_ids.length }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 w-14" title="کاربران">
                    <Icon name="i-lucide-users" class="w-3.5 h-3.5 shrink-0" />
                    <span>{{ service.users_count ?? 0 }}</span>
                  </div>
                </div>
              </div>
              <div v-if="services.length === 0" class="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                سرویسی موجود نیست
              </div>
            </div>
          </div>

          <!-- Limits -->
          <div class="space-y-4">
            <div class="space-y-2">
              <Label for="count_limit">محدودیت تعداد</Label>
              <Input id="count_limit" v-model.number="form.count_limit" type="number" min="0" placeholder="0 برای نامحدود" :disabled="isLoading" class="flex-1 text-right" dir="rtl" />
              <div class="text-xs text-muted-foreground text-right">حداکثر کاربران (0 برای نامحدود)</div>
            </div>
            <div class="space-y-2">
              <Label for="usage_limit">محدودیت مصرف (گیگابایت)</Label>
              <Input id="usage_limit" v-model.number="form.usage_limit" type="number" min="0" placeholder="0 برای نامحدود" :disabled="isLoading" class="text-right" dir="rtl" />
              <div class="text-xs text-muted-foreground text-right">
                {{ form.usage_limit > 0 ? formatBytes(form.usage_limit * (1024 ** 3)) : 'نامحدود' }}
              </div>
            </div>
          </div>

          <!-- Permissions -->
          <div class="space-y-2">
            <Label>دسترسی‌ها</Label>
            <div class="grid grid-cols-3 gap-2">
              <div class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12" :class="{ 'bg-primary/10 border-primary': form.create_access }" @click="form.create_access = !form.create_access">
                <Icon name="i-lucide-plus-circle" class="h-4 w-4" :class="form.create_access ? 'text-primary' : 'text-muted-foreground'" />
                <span class="text-sm font-medium">ایجاد</span>
              </div>
              <div class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12" :class="{ 'bg-primary/10 border-primary': form.update_access }" @click="form.update_access = !form.update_access">
                <Icon name="i-lucide-edit" class="h-4 w-4" :class="form.update_access ? 'text-primary' : 'text-muted-foreground'" />
                <span class="text-sm font-medium">ویرایش</span>
              </div>
              <div class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12" :class="{ 'bg-primary/10 border-primary': form.remove_access }" @click="form.remove_access = !form.remove_access">
                <Icon name="i-lucide-trash-2" class="h-4 w-4" :class="form.remove_access ? 'text-destructive' : 'text-muted-foreground'" />
                <span class="text-sm font-medium">حذف</span>
              </div>
            </div>
          </div>

          <!-- Subscription Actions -->
          <div class="space-y-2">
            <Label>عملیات اشتراک‌ها</Label>
            <div class="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" class="gap-2 text-xs" @click="handleActivateSubscriptions" :disabled="isLoading">
                <Icon name="i-lucide-play-circle" class="h-3.5 w-3.5 text-green-500" />
                فعال‌سازی
              </Button>
              <Button type="button" variant="outline" size="sm" class="gap-2 text-xs" @click="handleDeactivateSubscriptions" :disabled="isLoading">
                <Icon name="i-lucide-pause-circle" class="h-3.5 w-3.5 text-amber-500" />
                غیرفعال‌سازی
              </Button>
              <Button type="button" variant="outline" size="sm" class="gap-2 text-xs text-destructive hover:text-destructive" @click="handleDeleteSubscriptions" :disabled="isLoading">
                <Icon name="i-lucide-user-minus" class="h-3.5 w-3.5" />
                حذف کاربران
              </Button>
            </div>
          </div>
        </TabsContent>

        <!-- ====== Notifications Tab ====== -->
        <TabsContent value="notifications" class="space-y-4 py-2">
          <!-- Telegram -->
          <div class="space-y-3 border rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="i-lucide-send" class="h-4 w-4 text-sky-400" />
                <span class="font-medium text-sm">تلگرام</span>
              </div>
              <div class="flex items-center gap-2 cursor-pointer" @click="form.telegram_status = !form.telegram_status">
                <span class="text-xs text-muted-foreground">{{ form.telegram_status ? 'فعال' : 'غیرفعال' }}</span>
                <Icon :name="form.telegram_status ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'" class="h-6 w-6" :class="form.telegram_status ? 'text-primary' : 'text-muted-foreground'" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="d_telegram_id" class="text-xs">Chat ID</Label>
                <Input id="d_telegram_id" v-model="form.telegram_id" placeholder="-100..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_telegram_token" class="text-xs">Bot Token</Label>
                <Input id="d_telegram_token" v-model="form.telegram_token" placeholder="123456:ABC..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_telegram_logger_id" class="text-xs">Logger Chat ID</Label>
                <Input id="d_telegram_logger_id" v-model="form.telegram_logger_id" placeholder="-100..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_telegram_topic_id" class="text-xs">Topic ID</Label>
                <Input id="d_telegram_topic_id" v-model="form.telegram_topic_id" placeholder="123..." :disabled="isLoading" dir="ltr" />
              </div>
            </div>
            <div class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm" :class="{ 'bg-primary/10 border-primary': form.telegram_send_subscriptions }" @click="form.telegram_send_subscriptions = !form.telegram_send_subscriptions">
              <span>ارسال اشتراک‌ها به تلگرام</span>
              <Icon :name="form.telegram_send_subscriptions ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="h-4 w-4" :class="form.telegram_send_subscriptions ? 'text-primary' : 'text-muted-foreground'" />
            </div>
          </div>

          <!-- Discord -->
          <div class="space-y-3 border rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="i-lucide-message-square" class="h-4 w-4 text-indigo-400" />
                <span class="font-medium text-sm">دیسکورد</span>
              </div>
              <div class="flex items-center gap-2 cursor-pointer" @click="form.discord_webhook_status = !form.discord_webhook_status">
                <span class="text-xs text-muted-foreground">{{ form.discord_webhook_status ? 'فعال' : 'غیرفعال' }}</span>
                <Icon :name="form.discord_webhook_status ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'" class="h-6 w-6" :class="form.discord_webhook_status ? 'text-primary' : 'text-muted-foreground'" />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="d_discord_webhook_url" class="text-xs">Webhook URL</Label>
              <Input id="d_discord_webhook_url" v-model="form.discord_webhook_url" placeholder="https://discord.com/api/webhooks/..." :disabled="isLoading" dir="ltr" />
            </div>
            <div class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm" :class="{ 'bg-primary/10 border-primary': form.discord_send_subscriptions }" @click="form.discord_send_subscriptions = !form.discord_send_subscriptions">
              <span>ارسال اشتراک‌ها به دیسکورد</span>
              <Icon :name="form.discord_send_subscriptions ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="h-4 w-4" :class="form.discord_send_subscriptions ? 'text-primary' : 'text-muted-foreground'" />
            </div>
          </div>

          <!-- Warning thresholds -->
          <div class="space-y-3 border rounded-lg p-4">
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-bell" class="h-4 w-4 text-amber-400" />
              <span class="font-medium text-sm">آستانه هشدار</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="d_expire_warning_days" class="text-xs">روزهای هشدار انقضا</Label>
                <Input id="d_expire_warning_days" v-model.number="form.expire_warning_days" type="number" min="0" placeholder="0 = غیرفعال" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_usage_warning_percent" class="text-xs">درصد هشدار مصرف</Label>
                <Input id="d_usage_warning_percent" v-model.number="form.usage_warning_percent" type="number" min="0" max="100" placeholder="0 = غیرفعال" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
            </div>
          </div>
        </TabsContent>

        <!-- ====== Settings Tab ====== -->
        <TabsContent value="settings" class="space-y-4 py-2">
          <!-- Access / Link settings -->
          <div class="space-y-3 border rounded-lg p-4">
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-link" class="h-4 w-4 text-green-400" />
              <span class="font-medium text-sm">تنظیمات لینک</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="d_access_tag" class="text-xs">Access Tag</Label>
                <Input id="d_access_tag" v-model="form.access_tag" placeholder="guards" :disabled="isLoading" dir="ltr" />
                <p class="text-xs text-muted-foreground">تگ لینک‌ها (پیش‌فرض: guards)</p>
              </div>
              <div class="space-y-1.5">
                <Label for="d_access_prefix" class="text-xs">Access Prefix</Label>
                <Input id="d_access_prefix" v-model="form.access_prefix" placeholder="my-prefix" :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_access_title" class="text-xs">عنوان سرویس</Label>
                <Input id="d_access_title" v-model="form.access_title" placeholder="عنوان..." :disabled="isLoading" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_config_rename" class="text-xs">تغییر نام کانفیگ</Label>
                <Input id="d_config_rename" v-model="form.config_rename" placeholder="{remark} - {username}" :disabled="isLoading" dir="ltr" />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="d_access_description" class="text-xs">توضیحات سرویس</Label>
              <Textarea id="d_access_description" v-model="form.access_description" placeholder="..." :disabled="isLoading" dir="rtl" class="resize-none" :rows="2" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="d_max_links" class="text-xs">حداکثر لینک‌ها</Label>
                <Input id="d_max_links" v-model.number="form.max_links" type="number" min="0" placeholder="0 = نامحدود" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="d_update_interval" class="text-xs">بازه به‌روزرسانی (ثانیه)</Label>
                <Input id="d_update_interval" v-model.number="form.update_interval" type="number" min="0" placeholder="0 = پیش‌فرض" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm" :class="{ 'bg-primary/10 border-primary': form.shuffle_links }" @click="form.shuffle_links = !form.shuffle_links">
                <span>ترتیب تصادفی لینک‌ها</span>
                <Icon :name="form.shuffle_links ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="h-4 w-4" :class="form.shuffle_links ? 'text-primary' : 'text-muted-foreground'" />
              </div>
              <div class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm" :class="{ 'bg-primary/10 border-primary': form.username_tag }" @click="form.username_tag = !form.username_tag">
                <span>تگ نام کاربری</span>
                <Icon :name="form.username_tag ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="h-4 w-4" :class="form.username_tag ? 'text-primary' : 'text-muted-foreground'" />
              </div>
            </div>
          </div>

          <!-- Announce / Support -->
          <div class="space-y-3 border rounded-lg p-4">
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-megaphone" class="h-4 w-4 text-orange-400" />
              <span class="font-medium text-sm">اعلانیه و پشتیبانی</span>
            </div>
            <div class="space-y-1.5">
              <Label for="d_announce" class="text-xs">متن اعلانیه</Label>
              <Textarea id="d_announce" v-model="form.announce" placeholder="متن پیام برای همه کاربران..." :disabled="isLoading" dir="rtl" class="resize-none" :rows="2" />
            </div>
            <div class="space-y-1.5">
              <Label for="d_announce_url" class="text-xs">لینک اعلانیه</Label>
              <Input id="d_announce_url" v-model="form.announce_url" placeholder="https://..." :disabled="isLoading" dir="ltr" />
            </div>
            <div class="space-y-1.5">
              <Label for="d_support_url" class="text-xs">آدرس پشتیبانی</Label>
              <Input id="d_support_url" v-model="form.support_url" placeholder="https://t.me/support" :disabled="isLoading" dir="ltr" />
            </div>
          </div>

          <!-- Danger zone -->
          <div class="space-y-2 border border-destructive/20 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="i-lucide-shield-alert" class="h-4 w-4 text-destructive" />
              <span class="font-medium text-sm text-destructive">منطقه خطر</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" class="gap-2 text-xs text-destructive hover:text-destructive border-destructive/30" @click="() => { confirmAction = 'revoke-api-key'; confirmOpen = true }" :disabled="isLoading">
                <Icon name="i-lucide-key" class="h-3.5 w-3.5" />
                لغو کلید API
              </Button>
              <Button type="button" variant="outline" size="sm" class="gap-2 text-xs text-destructive hover:text-destructive border-destructive/30" @click="handleDelete" :disabled="isLoading">
                <Icon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
                حذف ادمین
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="flex flex-row justify-end gap-2 pt-2">
        <Button variant="outline" @click="open = false" :disabled="isLoading">
          انصراف
        </Button>
        <Button @click="handleUpdate" :disabled="isLoading">
          <Icon v-if="isLoading" name="i-radix-icons-update" class="ml-2 h-4 w-4 animate-spin" />
          به‌روزرسانی
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Confirmation Dialog -->
  <AlertDialog v-model:open="confirmOpen">
    <AlertDialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <AlertDialogHeader class="items-start text-right space-y-1.5">
        <AlertDialogTitle>{{ confirmMessages[confirmAction]?.title }}</AlertDialogTitle>
        <AlertDialogDescription class="text-right">
          {{ confirmMessages[confirmAction]?.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>انصراف</AlertDialogCancel>
        <AlertDialogAction
          @click="performConfirmedAction"
          :class="confirmMessages[confirmAction]?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
        >
          تأیید
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
