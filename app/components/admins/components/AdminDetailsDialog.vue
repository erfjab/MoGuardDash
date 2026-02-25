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
const confirmAction = ref<'enable' | 'disable' | 'delete' | 'delete-subscriptions' | ''>('')

const form = ref({
  password: '',
  role: 'seller' as 'owner' | 'seller' | 'reseller',
  service_ids: [] as number[],
  create_access: false,
  update_access: false,
  remove_access: false,
  count_limit: 0,
  usage_limit: 0,
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
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent v-if="admin" dir="rtl" class="w-[95vw] max-w-md sm:w-auto sm:max-w-lg max-h-[85vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>ویرایش ادمین: {{ admin.username }}</DialogTitle>
        <DialogDescription>
          مدیریت تنظیمات و دسترسی ادمین
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Header Info -->
        <div class="space-y-3">
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
              <Button
                variant="outline"
                size="sm"
                @click="handleToggleStatus"
                :disabled="isLoading"
              >
                <Icon :name="admin.enabled ? 'i-lucide-pause' : 'i-lucide-play'" class="ml-2 h-3.5 w-3.5" />
                {{ admin.enabled ? 'غیرفعال' : 'فعال' }}
              </Button>
            </div>
            <div class="text-sm text-muted-foreground capitalize text-right">
              نقش: {{ admin.role }}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="password">رمز عبور (برای حفظ خالی بگذارید)</Label>
          <div class="flex gap-2">
            <Input
              id="password"
              v-model="form.password"
              type="text"
              placeholder="مثال: sEcUrEp@ssw0rd"
              :disabled="isLoading"
              autocomplete="new-password"
              class="flex-1 text-right"
              dir="rtl"
            />
            <Button
              type="button"
              variant="outline"
              class="h-10 gap-2 shrink-0 px-4"
              title="تولید رمز عبور تصادفی"
              @click="generatePassword"
              :disabled="isLoading"
            >
              <Icon name="i-lucide-key" class="h-4 w-4" />
              تصادفی
            </Button>
          </div>
        </div>

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
              <!-- Service info -->
              <span class="text-sm font-medium truncate flex-1 min-w-0 ml-4">{{ service.remark }}</span>
              
              <!-- Stats -->
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

        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="count_limit">محدودیت تعداد</Label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <Input
                id="count_limit"
                v-model.number="form.count_limit"
                type="number"
                min="0"
                placeholder="0 برای نامحدود"
                :disabled="isLoading"
                class="flex-1 text-right"
                dir="rtl"
              />
              <Button
                type="button"
                variant="outline"
                class="justify-center"
                @click="handleDeleteSubscriptions"
                :disabled="isLoading"
              >
                <Icon name="i-lucide-user-minus" class="h-4 w-4" />
                حذف کاربران ادمین
              </Button>
            </div>
            <div class="text-xs text-muted-foreground text-right">
              حداکثر کاربران (0 برای نامحدود)
            </div>
          </div>

          <div class="space-y-2">
            <Label for="usage_limit">محدودیت مصرف (گیگابایت)</Label>
            <Input
              id="usage_limit"
              v-model.number="form.usage_limit"
              type="number"
              min="0"
              placeholder="0 برای نامحدود"
              :disabled="isLoading"
              class="text-right"
              dir="rtl"
            />
            <div class="text-xs text-muted-foreground text-right">
              {{ form.usage_limit > 0 ? formatBytes(form.usage_limit * (1024 ** 3)) : 'نامحدود' }}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label>دسترسی‌ها</Label>
          <div class="grid grid-cols-3 gap-2">
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.create_access }"
              @click="form.create_access = !form.create_access"
            >
              <Icon name="i-lucide-plus-circle" class="h-4 w-4" :class="form.create_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">ایجاد</span>
            </div>
            
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.update_access }"
              @click="form.update_access = !form.update_access"
            >
              <Icon name="i-lucide-edit" class="h-4 w-4" :class="form.update_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">ویرایش</span>
            </div>

            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.remove_access }"
              @click="form.remove_access = !form.remove_access"
            >
              <Icon name="i-lucide-trash-2" class="h-4 w-4" :class="form.remove_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">حذف</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="flex flex-row justify-end gap-2">
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          انصراف
        </Button>
        <Button 
          variant="outline"
          class="justify-center"
          @click="handleDelete"
          :disabled="isLoading"
        >
          حذف
        </Button>
        <Button 
          @click="handleUpdate"
          :disabled="isLoading"
        >
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
