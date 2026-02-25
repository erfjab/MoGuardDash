<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { SubscriptionCreate, AutoRenewalCreate } from '~/types/api'
import ServiceSelector from './ServiceSelector.vue'
import AutoRenewalManager from './AutoRenewalManager.vue'

const props = defineProps<{
  open: boolean
  initialValues?: Partial<typeof form.value>
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
}>()

const api = useApi()
const isLoading = ref(false)
const autoDeleteOpen = ref(false)
const extraOpen = ref(false)

const form = ref({
  username: '',
  limit_usage_gb: 20,
  limit_expire: 30,
  expire_on_first_connect: false,
  auto_delete_days: 0,
  bulk_count: 1,
  start_number: 1,
  service_ids: [] as number[],
  note: '',
  telegram_id: '',
  discord_webhook_url: '',
  auto_renewals: [] as AutoRenewalCreate[],
})

watch(() => props.initialValues, (newValues) => {
  if (newValues) {
    form.value = { ...form.value, ...newValues }
  }
}, { deep: true, immediate: true })

const usernameSuggestion = ref('')

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const usernameError = computed(() => {
  const username = form.value.username
  if (!username) return null

  if (username.length < 3) {
    return 'نام کاربری باید حداقل ۳ کاراکتر باشد'
  }

  if (username.length > 30) {
    return 'نام کاربری باید حداکثر ۳۰ کاراکتر باشد'
  }

  const regex = /^[a-z0-9_]+$/
  if (!regex.test(username)) {
    return 'نام کاربری فقط می‌تواند شامل حروف کوچک، اعداد و زیرخط باشد'
  }

  return null
})

const errors = computed(() => {
  const e = {
    limit_usage_gb: '',
    limit_expire: '',
    auto_delete_days: '',
    bulk_count: '',
    start_number: ''
  }

  if (form.value.limit_usage_gb < 20) {
    e.limit_usage_gb = 'حداقل میزان حجم ۲۰ گیگابایت است'
  }

  if (form.value.limit_expire === '' || form.value.limit_expire === null || form.value.limit_expire === undefined) {
    e.limit_expire = 'لطفاً زمان را وارد کنید'
  } else if (form.value.limit_expire < 0) {
    e.limit_expire = 'محدودیت زمان نمی‌تواند منفی باشد'
  } else if (form.value.limit_expire > 1000) {
    e.limit_expire = 'محدودیت زمان نمی‌تواند بیشتر از ۱۰۰۰ روز باشد'
  }

  if (form.value.auto_delete_days < 0) {
    e.auto_delete_days = 'روز حذف خودکار نمی‌تواند منفی باشد'
  }

  if (form.value.bulk_count < 1 || form.value.bulk_count > 20) {
    e.bulk_count = 'تعداد باید بین ۱ تا ۲۰ باشد'
  }

  if (form.value.start_number < 1) {
    e.start_number = 'عدد شروع باید حداقل ۱ باشد'
  }

  return e
})

function resetForm() {
  form.value = {
    username: '',
    limit_usage_gb: 20,
    limit_expire: 30,
    expire_on_first_connect: false,
    auto_delete_days: 0,
    bulk_count: 1,
    start_number: 1,
    service_ids: [],
    note: '',
    telegram_id: '',
    discord_webhook_url: '',
    auto_renewals: [],
  }
}

function randomUsername(len = 5) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_'
  let result = ''
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function refreshUsernameSuggestion() {
  let suggestion = randomUsername()
  if (suggestion === form.value.username) suggestion = randomUsername()
  usernameSuggestion.value = suggestion
}

function generateRandomUsername() {
  const generated = randomUsername()
  form.value.username = generated
}

onMounted(() => {
  refreshUsernameSuggestion()
})

async function handleCreate() {
  if (!form.value.username) {
    toast.error('نام کاربری ضروری است')
    return
  }

  if (usernameError.value) {
    toast.error(usernameError.value)
    return
  }

  if (form.value.service_ids.length === 0) {
    toast.error('لطفاً حداقل یک سرویس انتخاب کنید')
    return
  }

  if (
    errors.value.limit_usage_gb ||
    errors.value.limit_expire ||
    errors.value.auto_delete_days ||
    errors.value.bulk_count ||
    errors.value.start_number
  ) {
    toast.error('لطفاً خطاهای فرم را برطرف کنید')
    return
  }

  isLoading.value = true
  try {
    const limitUsageBytes = Math.floor(form.value.limit_usage_gb * 1024 * 1024 * 1024)
    
    let limitExpire = form.value.limit_expire
    if (form.value.expire_on_first_connect && limitExpire > 0) {
      limitExpire = -(limitExpire * 86400)
    } else if (limitExpire > 0) {
      limitExpire = Math.floor(Date.now() / 1000) + (limitExpire * 86400)
    }
    
    const subscriptions: SubscriptionCreate[] = []
    for (let i = 0; i < form.value.bulk_count; i++) {
      const username = form.value.bulk_count > 1 
        ? `${form.value.username}${form.value.start_number + i}`
        : form.value.username
      
      const rawAutoDelete = Number(form.value.auto_delete_days)
      const autoDeleteDays = Number.isFinite(rawAutoDelete) && rawAutoDelete > 0 ? Math.floor(rawAutoDelete) : 0
      
      subscriptions.push({
        username,
        limit_usage: limitUsageBytes,
        limit_expire: limitExpire,
        service_ids: [...form.value.service_ids],
        note: form.value.note || undefined,
        telegram_id: form.value.telegram_id || undefined,
        discord_webhook_url: form.value.discord_webhook_url || undefined,
        auto_delete_days: autoDeleteDays,
        auto_renewals: form.value.auto_renewals.length > 0 ? form.value.auto_renewals : undefined,
      })
    }
    
    await api.subscriptions.create(subscriptions)
    
    const message = form.value.bulk_count > 1 
      ? `${form.value.bulk_count} اشتراک با موفقیت ایجاد شد`
      : 'اشتراک با موفقیت ایجاد شد'
    toast.success(message)
    
    emit('created')
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || 'ایجاد اشتراک ناموفق بود')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-md sm:w-full sm:max-w-lg max-h-[70vh] sm:max-h-[75vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle class="text-right w-full">ایجاد اشتراک جدید</DialogTitle>
        <DialogDescription class="text-right w-full">
          ایجاد اشتراک جدید با محدودیت‌های سفارشی
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="username">نام کاربری *</Label>
          <div class="flex items-center gap-2">
            <Input
              id="username"
              v-model="form.username"
              placeholder="نام کاربری را وارد کنید"
              :disabled="isLoading"
              class="flex-1"
              :class="{ 'border-red-500 focus-visible:ring-red-500': usernameError }"
            />
            <Button
              type="button"
              variant="outline"
              @click="generateRandomUsername"
              :disabled="isLoading"
              class="shrink-0"
            >
              <Icon name="i-radix-icons-shuffle" class="mr-2 h-4 w-4" />
              تصادفی
            </Button>
          </div>
          <div v-if="usernameError" class="text-xs text-red-500">
            {{ usernameError }}
          </div>
          <div v-else class="text-xs text-muted-foreground">
            <template v-if="form.bulk_count > 1 && form.username">
              مثال: <span class="font-mono">{{ form.username }}{{ form.start_number }}, {{ form.username }}{{ form.start_number + 1 }}, ... {{ form.username }}{{ form.start_number + form.bulk_count - 1 }}</span>
            </template>
            <template v-else>
              مثال: <span class="font-mono">{{ usernameSuggestion }}</span>
            </template>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="limit_usage_gb">محدودیت حجم (گیگابایت) *</Label>
          <Input
            id="limit_usage_gb"
            v-model.number="form.limit_usage_gb"
            type="number"
            step="0.1"
            min="20"
            :disabled="isLoading"
            class="flex-1"
            :class="{ 'border-red-500 focus-visible:ring-red-500': errors.limit_usage_gb }"
            placeholder="حداقل ۲۰"
          />
          <div class="flex items-center justify-between">
            <div class="text-xs" :class="errors.limit_usage_gb ? 'text-red-500' : 'text-muted-foreground'">
              {{ errors.limit_usage_gb || 'حداقل ۲۰ گیگابایت' }}
            </div>
            <div class="flex gap-1">
              <Button
                v-for="val in [0.1, 1, 10, 50]"
                :key="val"
                type="button"
                variant="ghost"
                size="sm"
                class="px-2 py-1 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                @click="form.limit_usage_gb = +((form.limit_usage_gb || 0) + val).toFixed(2)"
                :disabled="isLoading"
              >
                +{{ val }}
              </Button>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="limit_expire">محدودیت زمان (روز) *</Label>
          <div class="flex gap-2 items-center">
            <Input
              id="limit_expire"
              v-model.number="form.limit_expire"
              type="number"
              min="0"
              max="1000"
              :disabled="isLoading"
              class="flex-1"
              :class="{ 'border-red-500 focus-visible:ring-red-500': errors.limit_expire }"
              placeholder="۰ = نامحدود"
            />
            <Button
              type="button"
              :variant="form.expire_on_first_connect ? 'default' : 'outline'"
              @click="form.expire_on_first_connect = !form.expire_on_first_connect"
              :disabled="isLoading || form.limit_expire === 0"
            >
              <Icon name="i-radix-icons-timer" class="mr-2 h-4 w-4" />
              پس از اولین اتصال
            </Button>
          </div>
          <div class="flex items-center justify-between">
            <div class="text-xs" :class="errors.limit_expire ? 'text-red-500' : 'text-muted-foreground'">
              {{ errors.limit_expire || `${form.expire_on_first_connect ? 'پس از اولین اتصال شروع می‌شود' : 'فوراً شروع می‌شود'}. ۰ = نامحدود.` }}
            </div>
            <div class="flex gap-1">
              <Button
                v-for="val in [1, 5, 10]"
                :key="val"
                type="button"
                variant="ghost"
                size="sm"
                class="px-2 py-1 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                @click="form.limit_expire = +((form.limit_expire || 0) + val)"
                :disabled="isLoading"
              >
                +{{ val }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Bulk Controls -->
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="bulk_count">تعداد اشتراک *</Label>
            <Input
              id="bulk_count"
              v-model.number="form.bulk_count"
              type="number"
              min="1"
              max="20"
              :disabled="isLoading"
              :class="['flex-1', errors.bulk_count ? 'border-red-500 focus-visible:ring-red-500' : '']"
              placeholder="1"
            />
            <div class="flex items-center justify-between">
              <div class="text-xs" :class="errors.bulk_count ? 'text-red-500' : 'text-muted-foreground'">
                {{ errors.bulk_count || 'حداکثر ۲۰' }}
              </div>
              <div class="flex gap-1">
                <Button
                  v-for="val in [1, 2, 5]"
                  :key="val"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="px-2 py-1 text-xs text-muted-foreground border border-muted rounded hover:bg-muted/40"
                  @click="form.bulk_count = Math.min(20, form.bulk_count + val)"
                  :disabled="isLoading"
                >
                  +{{ val }}
                </Button>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="start_number">عدد شروع *</Label>
            <Input
              id="start_number"
              v-model.number="form.start_number"
              type="number"
              min="1"
              :disabled="isLoading || form.bulk_count === 1"
              class="w-full"
              :class="{ 'border-red-500 focus-visible:ring-red-500': errors.start_number }"
              placeholder="1"
            />
            <div class="text-xs" :class="errors.start_number ? 'text-red-500' : 'text-muted-foreground'">
              {{ errors.start_number || 'عدد شروع در ساخت چندتایی' }}
            </div>
          </div>
        </div>

        <!-- Services Selection -->
        <ServiceSelector 
          v-model="form.service_ids" 
          :disabled="isLoading"
          select-all-by-default
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
              <span class="font-medium text-sm">حذف خودکار</span>
              <Badge v-if="form.auto_delete_days > 0" variant="secondary" class="ml-1">
                {{ form.auto_delete_days }} روز
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-4 py-3 space-y-2 overflow-hidden">
              <p class="text-xs text-muted-foreground">
                پس از اتمام یا رسیدن به محدودیت، اشتراک را به‌صورت خودکار حذف می‌کند. وقتی صفر باشد، اشتراک حذف نخواهد شد.
              </p>
              <div class="space-y-1.5">
                <Label for="auto_delete_days" class="text-xs">روز پس از انقضا</Label>
                <Input
                  id="auto_delete_days"
                  v-model.number="form.auto_delete_days"
                  type="number"
                  min="0"
                  :disabled="isLoading"
                  class="h-9"
                  :class="{ 'border-red-500 focus-visible:ring-red-500': errors.auto_delete_days }"
                  placeholder="۰ = غیرفعال"
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
          :disabled="isLoading"
          mode="create"
        />

        <!-- Extra Data Collapsible -->
        <Collapsible v-model:open="extraOpen" class="mt-2 w-full border rounded-lg">
          <CollapsibleTrigger class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
            <div class="flex items-center gap-2">
              <Icon 
                name="i-lucide-chevron-right" 
                class="h-4 w-4 transition-transform duration-200"
                :class="{ 'rotate-90': extraOpen }"
              />
              <span class="font-medium text-sm">سایر اطلاعات</span>
              <Badge v-if="form.note || form.telegram_id" variant="secondary" class="ml-1">
                {{ (form.note ? 1 : 0) + (form.telegram_id ? 1 : 0) }}
              </Badge>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div class="px-4 py-3 space-y-3 overflow-hidden">
              <p class="text-xs text-muted-foreground">
                اطلاعات اختیاری برای این اشتراک.
              </p>
              <!-- Note Field -->
              <div class="space-y-1.5">
                <Label for="note" class="text-xs">یادداشت</Label>
                <Textarea
                  id="note"
                  v-model="form.note"
                  placeholder="یادداشت یا توضیحی اضافه کنید"
                  :disabled="isLoading"
                  rows="2"
                  class="resize-y min-h-[60px]"
                />
              </div>
              <!-- Telegram ID Field -->
              <div class="space-y-1.5">
                <Label for="telegram_id" class="text-xs">چت آیدی تلگرام (اختیاری)</Label>
                <Input
                  id="telegram_id"
                  v-model="form.telegram_id"
                  placeholder="چت آیدی تلگرام"
                  :disabled="isLoading"
                  class="h-9"
                />
              </div>
              <!-- Discord Webhook URL Field -->
              <div class="space-y-1.5">
                <Label for="discord_webhook_url" class="text-xs">وب‌هوک دیسکورد (اختیاری)</Label>
                <Input
                  id="discord_webhook_url"
                  v-model="form.discord_webhook_url"
                  placeholder="آدرس وب‌هوک دیسکورد"
                  :disabled="isLoading"
                  class="h-9"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          لغو
        </Button>
        <Button 
          @click="handleCreate"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="i-radix-icons-update" class="mr-2 h-4 w-4 animate-spin" />
          ایجاد اشتراک
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
