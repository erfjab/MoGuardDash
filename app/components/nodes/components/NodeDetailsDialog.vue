<script setup lang="ts">
import type { NodeResponse, NodeUpdate } from '~/types/api'
import { Badge } from '@/components/ui/badge'
import { smartToast as toast } from '~/lib/smart-toast'
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
  node: NodeResponse | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const api = useApi()
const isLoading = ref(false)
const showPassword = ref(false)
const showHost = ref(false)
const showUsername = ref(false)

// Confirmation state
const confirmOpen = ref(false)
const confirmAction = ref<'enable' | 'disable' | 'delete' | ''>('')

const form = ref({
  remark: '',
  host: '',
  username: '',
  password: '',
  offset_link: 0,
  batch_size: 1,
  priority: 0,
  usage_rate: 1.0,
  script_url: '',
  script_secret: '',
  show_configs: true,
})

const open = computed({
  get: () => !!props.node,
  set: (value: boolean) => {
    if (!value) {
      emit('close')
      // Reset visibility states
      showHost.value = false
      showUsername.value = false
      showPassword.value = false
    }
  }
})

watch(() => props.node, (node) => {
  if (node) {
    form.value = {
      remark: node.remark,
      host: node.host,
      username: node.username,
      password: node.password,
      offset_link: node.offset_link,
      batch_size: node.batch_size,
      priority: node.priority,
      usage_rate: node.usage_rate ?? 1.0,
      script_url: node.script_url ?? '',
      script_secret: node.script_secret ?? '',
      show_configs: node.show_configs ?? true,
    }
  }
}, { immediate: true })

async function handleUpdate() {
  if (!props.node) return
  
  isLoading.value = true
  try {
    const updateData: NodeUpdate = {
      remark: form.value.remark,
      host: form.value.host,
      username: form.value.username,
      password: form.value.password,
      offset_link: form.value.offset_link,
      batch_size: form.value.batch_size,
      priority: form.value.priority,
      usage_rate: form.value.usage_rate,
      script_url: form.value.script_url,
      script_secret: form.value.script_secret,
      show_configs: form.value.show_configs,
    }
    
    await api.nodes.update(props.node.id, updateData)
    toast.success('نود با موفقیت به‌روزرسانی شد')
    emit('refresh')
    emit('close')
  } catch (error: any) {
    toast.error(error.message || 'به‌روزرسانی نود ناموفق بود')
  } finally {
    isLoading.value = false
  }
}

function handleToggleStatus() {
  if (!props.node) return
  confirmAction.value = props.node.enabled ? 'disable' : 'enable'
  confirmOpen.value = true
}

function handleDelete() {
  confirmAction.value = 'delete'
  confirmOpen.value = true
}

async function performConfirmedAction() {
  if (!props.node) return
  
  isLoading.value = true
  try {
    switch (confirmAction.value) {
      case 'enable':
        await api.nodes.enable(props.node.id)
        toast.success('نود فعال شد')
        break
      case 'disable':
        await api.nodes.disable(props.node.id)
        toast.success('نود غیرفعال شد')
        break
      case 'delete':
        await api.nodes.delete(props.node.id)
        toast.success('نود حذف شد')
        emit('close')
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
    title: 'فعال کردن نود',
    description: 'آیا مطمئن هستید که می‌خواهید این نود را فعال کنید؟',
    variant: 'default'
  },
  disable: {
    title: 'غیرفعال کردن نود',
    description: 'آیا مطمئن هستید که می‌خواهید این نود را غیرفعال کنید؟',
    variant: 'destructive'
  },
  delete: {
    title: 'حذف نود',
    description: 'آیا مطمئن هستید که می‌خواهید این نود را حذف کنید؟ این عمل قابل بازگشت نیست.',
    variant: 'destructive'
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" v-if="node" class="w-[95vw] max-w-md sm:w-auto sm:max-w-lg max-h-[85vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle class="text-right w-full">ویرایش نود</DialogTitle>
        <DialogDescription class="text-right w-full">
          مدیریت پیکربندی و دسترسی نود
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- Header Info -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <div class="relative flex items-center">
              <span v-if="node.enabled" class="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-green-500 opacity-75" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full" :class="node.enabled ? 'bg-green-500' : 'bg-gray-400'" />
            </div>
            <Label>نام</Label>
          </div>
          <div class="flex items-center gap-2">
            <Input
              id="remark"
              v-model="form.remark"
              :disabled="isLoading"
              class="flex-1"
            />
            <Button
              variant="outline"
              @click="handleToggleStatus"
              :disabled="isLoading"
              class="shrink-0"
            >
              <Icon :name="node.enabled ? 'i-lucide-pause' : 'i-lucide-play'" class="ml-2 h-3.5 w-3.5" />
              {{ node.enabled ? 'غیرفعال' : 'فعال' }}
            </Button>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span class="capitalize">دسته‌بندی: {{ node.category }}</span>
            <span>•</span>
            <span>مصرف: {{ (node.current_usage / (1024 ** 3)).toFixed(2) }} GB</span>
          </div>
        </div>

        <!-- Connection Info -->
        <div class="space-y-2">
          <Label for="host">آدرس میزبان</Label>
          <div class="relative">
            <Input
              id="host"
              v-model="form.host"
              :type="showHost ? 'text' : 'password'"
              :disabled="isLoading"
              placeholder="https://panel.example.com"
              class="pl-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="absolute left-0 top-0 h-full px-2 hover:bg-transparent"
              @click="showHost = !showHost"
            >
              <Icon :name="showHost ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="username">نام کاربری</Label>
            <div class="relative">
              <Input
                id="username"
                v-model="form.username"
                :type="showUsername ? 'text' : 'password'"
                :disabled="isLoading"
                class="pl-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="absolute left-0 top-0 h-full px-2 hover:bg-transparent"
                @click="showUsername = !showUsername"
              >
                <Icon :name="showUsername ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="password">رمز عبور</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :disabled="isLoading"
                class="pl-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="absolute left-0 top-0 h-full px-2 hover:bg-transparent"
                @click="showPassword = !showPassword"
              >
                <Icon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Configuration -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="offset_link">آفست لینک</Label>
            <Input
              id="offset_link"
              v-model.number="form.offset_link"
              type="number"
              min="0"
              :disabled="isLoading"
            />
          </div>
          <div class="space-y-2">
            <Label for="batch_size">اندازه دسته</Label>
            <Input
              id="batch_size"
              v-model.number="form.batch_size"
              type="number"
              min="1"
              :disabled="isLoading"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="priority">اولویت</Label>
            <Input
              id="priority"
              v-model.number="form.priority"
              type="number"
              min="0"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              اولویت نود (بالاتر = مهم‌تر)
            </div>
          </div>
          <div class="space-y-2">
            <Label for="usage_rate">نرخ مصرف</Label>
            <Input
              id="usage_rate"
              v-model.number="form.usage_rate"
              type="number"
              step="0.1"
              min="0"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              ضریب مصرف (پیش‌فرض: 1.0)
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="script_url">اسکریپت</Label>
          <Input
            id="script_url"
            v-model="form.script_url"
            placeholder="https://example.com/script.sh"
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-2">
          <Label for="script_secret">سکرت اسکریپت</Label>
          <Input
            id="script_secret"
            v-model="form.script_secret"
            placeholder="my-secret"
            :disabled="isLoading"
          />
        </div>

        <div
          class="flex items-center justify-between border rounded-md px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50"
          :class="{ 'bg-primary/10 border-primary': form.show_configs }"
          @click="form.show_configs = !form.show_configs"
        >
          <div>
            <div class="text-sm font-medium">نمایش کانفیگ‌ها</div>
            <div class="text-xs text-muted-foreground">کانفیگ‌های این نود برای کاربران نمایش داده شود</div>
          </div>
          <Icon
            :name="form.show_configs ? 'i-lucide-toggle-right' : 'i-lucide-toggle-left'"
            class="h-6 w-6"
            :class="form.show_configs ? 'text-primary' : 'text-muted-foreground'"
          />
        </div>
      </div>

      <DialogFooter class="flex flex-row justify-end gap-2">
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          لغو
        </Button>
        <Button 
          variant="outline"
          class="text-destructive hover:text-destructive hover:bg-destructive/10"
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
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmMessages[confirmAction]?.title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ confirmMessages[confirmAction]?.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>لغو</AlertDialogCancel>
        <AlertDialogAction 
          @click="performConfirmedAction"
          :class="confirmMessages[confirmAction]?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
        >
          تایید
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
