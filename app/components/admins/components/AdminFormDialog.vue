<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { AdminCreate, AdminResponse, AdminUpdate } from '~/types/api'
import { formatBytes } from '~/lib/utils'
import { Icon } from '#components'
import { useI18n } from '#imports'

const props = defineProps<{
  open: boolean
  admin?: AdminResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const api = useApi()
const { services, fetchServices } = useAdmin()
const isLoading = ref(false)
const { t } = useI18n()

const form = ref({
  // Basic
  username: '',
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
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const isEditMode = computed(() => !!props.admin)

watch(() => props.admin, (admin) => {
  if (admin) {
    form.value = {
      username: admin.username,
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
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    username: '',
    password: '',
    role: 'seller',
    service_ids: [],
    create_access: true,
    update_access: true,
    remove_access: false,
    count_limit: 0,
    usage_limit: 0,
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
  }
}

function generateUsername() {
  const random = Math.random().toString(36).substring(2, 8)
  form.value.username = random
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = password
}

async function handleSubmit() {
  if (!form.value.username) {
    toast.error(t('admins.usernameRequired'))
    return
  }
  
  if (!isEditMode.value && !form.value.password) {
    toast.error(t('admins.passwordRequired'))
    return
  }

  isLoading.value = true
  try {
    const usageLimitBytes = form.value.usage_limit > 0 ? form.value.usage_limit * (1024 ** 3) : null

    if (isEditMode.value && props.admin) {
      // Update existing admin
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
      toast.success(t('admins.updateSuccess'))
      emit('updated')
    } else {
      // Create new admin
      const createData: AdminCreate = {
        username: form.value.username,
        password: form.value.password,
        role: form.value.role,
        service_ids: form.value.service_ids,
        create_access: form.value.create_access,
        update_access: form.value.update_access,
        remove_access: form.value.remove_access,
        count_limit: form.value.count_limit ?? null,
        usage_limit: usageLimitBytes,
        access_tag: form.value.access_tag || null,
        access_prefix: form.value.access_prefix || null,
        access_title: form.value.access_title || null,
        access_description: form.value.access_description || null,
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
      
      await api.admins.create(createData)
      toast.success(t('admins.createSuccess'))
      emit('created')
    }
    
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || t('admins.saveFailed'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-2xl sm:w-auto max-h-[85vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>{{ isEditMode ? t('admins.editAdmin') : t('admins.createAdmin') }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? t('admins.editAdminDescription') : t('admins.createAdminDescription') }}
        </DialogDescription>
      </DialogHeader>

      <Tabs default-value="basic" dir="rtl">
        <TabsList class="w-full grid grid-cols-3">
          <TabsTrigger value="basic">اساسی</TabsTrigger>
          <TabsTrigger value="notifications">اعلان‌ها</TabsTrigger>
          <TabsTrigger value="settings">تنظیمات</TabsTrigger>
        </TabsList>

        <!-- ====== Basic Tab ====== -->
        <TabsContent value="basic" class="space-y-4 py-2">
        <div class="space-y-2">
          <Label for="username">{{ t('common.username') }} *</Label>
          <div class="flex gap-2">
            <Input
              id="username"
              v-model="form.username"
              :placeholder="t('admins.usernamePlaceholder')"
              :disabled="isLoading || isEditMode"
              autocomplete="off"
              class="flex-1 text-right"
              dir="rtl"
            />
            <Button
              v-if="!isEditMode"
              type="button"
              variant="outline"
              class="h-10 gap-2 shrink-0 px-4"
              :title="t('admins.generateUsername')"
              @click="generateUsername"
              :disabled="isLoading"
            >
              <Icon name="i-lucide-wand-2" class="h-4 w-4" />
              {{ t('admins.random') }}
            </Button>
          </div>
        </div>

        <div v-if="!isEditMode" class="space-y-2">
          <Label for="role">{{ t('admins.role') }} *</Label>
          <Select
            v-model="form.role"
            :disabled="isLoading"
          >
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="$t('admins.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">{{ $t('admins.seller') }}</SelectItem>
              <SelectItem value="reseller">{{ $t('admins.reseller') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="password">{{ isEditMode ? t('admins.passwordKeep') : `${t('common.password')} *` }}</Label>
          <div class="flex gap-2">
            <Input
              id="password"
              v-model="form.password"
              type="text"
              :placeholder="t('admins.passwordPlaceholder')"
              :disabled="isLoading"
              autocomplete="new-password"
              class="flex-1 text-right"
              dir="rtl"
            />
            <Button
              type="button"
              variant="outline"
              class="h-10 gap-2 shrink-0 px-4"
              :title="t('admins.generatePassword')"
              @click="generatePassword"
              :disabled="isLoading"
            >
              <Icon name="i-lucide-key" class="h-4 w-4" />
              {{ t('admins.random') }}
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t('admins.services') }}</Label>
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
              <!-- Service info -->
              <span class="text-sm font-medium truncate flex-1 min-w-0 ml-4">{{ service.remark }}</span>
              
              <!-- Stats -->
              <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <div class="flex items-center gap-1.5 w-14" :title="t('admins.nodes')">
                  <Icon name="i-lucide-server" class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ service.node_ids.length }}</span>
                </div>
                <div class="flex items-center gap-1.5 w-14" :title="t('admins.users')">
                  <Icon name="i-lucide-users" class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ service.users_count ?? 0 }}</span>
                </div>
              </div>
            </div>
            <div v-if="services.length === 0" class="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
              {{ t('admins.noServices') }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="count_limit">{{ t('admins.countLimit') }}</Label>
            <Input
              id="count_limit"
              v-model.number="form.count_limit"
              type="number"
              min="0"
              :placeholder="t('admins.unlimitedPlaceholder')"
              :disabled="isLoading"
              class="text-right"
              dir="rtl"
            />
            <div class="text-xs text-muted-foreground text-right">
              {{ t('admins.maxUsersHint') }}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="usage_limit">{{ t('admins.usageLimitGb') }}</Label>
            <Input
              id="usage_limit"
              v-model.number="form.usage_limit"
              type="number"
              min="0"
              :placeholder="t('admins.unlimitedPlaceholder')"
              :disabled="isLoading"
              class="text-right"
              dir="rtl"
            />
            <div class="text-xs text-muted-foreground text-right">
              {{ form.usage_limit > 0 ? formatBytes(form.usage_limit * (1024 ** 3)) : t('dashboard.unlimited') }}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t('admins.permissions') }}</Label>
          <div class="grid grid-cols-3 gap-2">
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.create_access }"
              @click="form.create_access = !form.create_access"
            >
              <Icon name="i-lucide-plus-circle" class="h-4 w-4" :class="form.create_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionCreate') }}</span>
            </div>
            
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.update_access }"
              @click="form.update_access = !form.update_access"
            >
              <Icon name="i-lucide-edit" class="h-4 w-4" :class="form.update_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionUpdate') }}</span>
            </div>

            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.remove_access }"
              @click="form.remove_access = !form.remove_access"
            >
              <Icon name="i-lucide-trash-2" class="h-4 w-4" :class="form.remove_access ? 'text-destructive' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionRemove') }}</span>
            </div>
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
                <Label for="telegram_id" class="text-xs">Chat ID</Label>
                <Input id="telegram_id" v-model="form.telegram_id" placeholder="-100..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="telegram_token" class="text-xs">Bot Token</Label>
                <Input id="telegram_token" v-model="form.telegram_token" placeholder="123456:ABC..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="telegram_logger_id" class="text-xs">Logger Chat ID</Label>
                <Input id="telegram_logger_id" v-model="form.telegram_logger_id" placeholder="-100..." :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="telegram_topic_id" class="text-xs">Topic ID</Label>
                <Input id="telegram_topic_id" v-model="form.telegram_topic_id" placeholder="123..." :disabled="isLoading" dir="ltr" />
              </div>
            </div>
            <div
              class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
              :class="{ 'bg-primary/10 border-primary': form.telegram_send_subscriptions }"
              @click="form.telegram_send_subscriptions = !form.telegram_send_subscriptions"
            >
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
              <Label for="discord_webhook_url" class="text-xs">Webhook URL</Label>
              <Input id="discord_webhook_url" v-model="form.discord_webhook_url" placeholder="https://discord.com/api/webhooks/..." :disabled="isLoading" dir="ltr" />
            </div>
            <div
              class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
              :class="{ 'bg-primary/10 border-primary': form.discord_send_subscriptions }"
              @click="form.discord_send_subscriptions = !form.discord_send_subscriptions"
            >
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
                <Label for="expire_warning_days" class="text-xs">روزهای هشدار انقضا</Label>
                <Input id="expire_warning_days" v-model.number="form.expire_warning_days" type="number" min="0" placeholder="0 = غیرفعال" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="usage_warning_percent" class="text-xs">درصد هشدار مصرف</Label>
                <Input id="usage_warning_percent" v-model.number="form.usage_warning_percent" type="number" min="0" max="100" placeholder="0 = غیرفعال" :disabled="isLoading" class="text-right" dir="rtl" />
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
                <Label for="access_tag" class="text-xs">Access Tag</Label>
                <Input id="access_tag" v-model="form.access_tag" placeholder="guards" :disabled="isLoading" dir="ltr" />
                <p class="text-xs text-muted-foreground">تگ لینک‌ها (پیش‌فرض: guards)</p>
              </div>
              <div class="space-y-1.5">
                <Label for="access_prefix" class="text-xs">Access Prefix</Label>
                <Input id="access_prefix" v-model="form.access_prefix" placeholder="my-prefix" :disabled="isLoading" dir="ltr" />
              </div>
              <div class="space-y-1.5">
                <Label for="access_title" class="text-xs">عنوان سرویس</Label>
                <Input id="access_title" v-model="form.access_title" placeholder="عنوان..." :disabled="isLoading" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="config_rename" class="text-xs">تغییر نام کانفیگ</Label>
                <Input id="config_rename" v-model="form.config_rename" placeholder="{remark} - {username}" :disabled="isLoading" dir="ltr" />
              </div>
            </div>
            <div class="space-y-1.5">
              <Label for="access_description" class="text-xs">توضیحات سرویس</Label>
              <Textarea id="access_description" v-model="form.access_description" placeholder="..." :disabled="isLoading" dir="rtl" class="resize-none" :rows="2" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <Label for="max_links" class="text-xs">حداکثر لینک‌ها</Label>
                <Input id="max_links" v-model.number="form.max_links" type="number" min="0" placeholder="0 = نامحدود" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
              <div class="space-y-1.5">
                <Label for="update_interval" class="text-xs">بازه به‌روزرسانی (ثانیه)</Label>
                <Input id="update_interval" v-model.number="form.update_interval" type="number" min="0" placeholder="0 = پیش‌فرض" :disabled="isLoading" class="text-right" dir="rtl" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
                :class="{ 'bg-primary/10 border-primary': form.shuffle_links }"
                @click="form.shuffle_links = !form.shuffle_links"
              >
                <span>ترتیب تصادفی لینک‌ها</span>
                <Icon :name="form.shuffle_links ? 'i-lucide-check-circle' : 'i-lucide-circle'" class="h-4 w-4" :class="form.shuffle_links ? 'text-primary' : 'text-muted-foreground'" />
              </div>
              <div
                class="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
                :class="{ 'bg-primary/10 border-primary': form.username_tag }"
                @click="form.username_tag = !form.username_tag"
              >
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
              <Label for="announce" class="text-xs">متن اعلانیه</Label>
              <Textarea id="announce" v-model="form.announce" placeholder="متن پیام برای همه کاربران..." :disabled="isLoading" dir="rtl" class="resize-none" :rows="2" />
            </div>
            <div class="space-y-1.5">
              <Label for="announce_url" class="text-xs">لینک اعلانیه</Label>
              <Input id="announce_url" v-model="form.announce_url" placeholder="https://..." :disabled="isLoading" dir="ltr" />
            </div>
            <div class="space-y-1.5">
              <Label for="support_url" class="text-xs">آدرس پشتیبانی</Label>
              <Input id="support_url" v-model="form.support_url" placeholder="https://t.me/support" :disabled="isLoading" dir="ltr" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="pt-2">
        <Button
          variant="outline"
          @click="open = false"
          :disabled="isLoading"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button
          @click="handleSubmit"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="i-radix-icons-update" class="ml-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? t('common.update') : t('admins.createAdmin') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
