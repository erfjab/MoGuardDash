<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'

const { t } = useI18n()

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const api = useApi()
const { admin, fetchAdmin, setAdmin } = useAdmin()

const isLoading = ref(false)
const isLoadingData = ref(false)

const form = ref({
  telegram_id: undefined as string | undefined,
  telegram_token: '',
  telegram_topic_id: '',
  telegram_logger_id: '',
  telegram_status: false,
  telegram_send_subscriptions: false,
})

// Load current admin data
const loadCurrentAdmin = async () => {
  isLoadingData.value = true
  try {
    const response = await fetchAdmin()
    form.value.telegram_id = response.telegram_id ?? undefined
    form.value.telegram_token = response.telegram_token ?? ''
    form.value.telegram_topic_id = response.telegram_topic_id ?? ''
    form.value.telegram_logger_id = response.telegram_logger_id ?? ''
    form.value.telegram_status = response.telegram_status ?? false
    form.value.telegram_send_subscriptions = response.telegram_send_subscriptions ?? false
  }
  catch (error: any) {
    toast.error('بارگذاری پیکربندی تلگرام ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoadingData.value = false
  }
}

// Helper to convert value to number or 0 if empty/invalid
const toNumberOrZero = (val: any): number => {
  if (val === '' || val === null || val === undefined || Number.isNaN(val)) {
    return 0
  }
  const num = Number(val)
  return Number.isNaN(num) ? 0 : num
}

// Update notification configuration
const handleSubmit = async () => {
  isLoading.value = true
  try {
    // For clearing: send empty string for text fields, 0 for numeric fields
    const telegramId = String(form.value.telegram_id ?? '').trim()
    const telegramToken = String(form.value.telegram_token ?? '').trim()
    const telegramTopicId = String(form.value.telegram_topic_id ?? '').trim()
    const telegramLoggerId = String(form.value.telegram_logger_id ?? '').trim()

    const response = await api.admins.updateCurrent({
      telegram_id: telegramId,
      telegram_token: telegramToken,
      telegram_topic_id: telegramTopicId || null,
      telegram_logger_id: telegramLoggerId || null,
      telegram_status: form.value.telegram_status,
      telegram_send_subscriptions: form.value.telegram_send_subscriptions,
    })
    setAdmin(response)
    toast.success('پیکربندی تلگرام با موفقیت به‌روز شد')
    form.value.telegram_id = response.telegram_id ?? undefined
    form.value.telegram_token = response.telegram_token ?? ''
    form.value.telegram_topic_id = response.telegram_topic_id ?? ''
    form.value.telegram_logger_id = response.telegram_logger_id ?? ''
    form.value.telegram_status = response.telegram_status ?? false
    form.value.telegram_send_subscriptions = response.telegram_send_subscriptions ?? false
  }
  catch (error: any) {
    toast.error('به‌روزرسانی پیکربندی تلگرام ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoading.value = false
  }
}

const handleReset = async () => {
  await loadCurrentAdmin()
}

onMounted(() => {
  loadCurrentAdmin()
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <div class="text-right">
        <h1 class="text-3xl font-bold tracking-tight">
          پیکربندی ربات تلگرام
        </h1>
        <p class="text-muted-foreground mt-2">
          پیکربندی تنظیمات ربات تلگرام برای حساب کاربری شما
        </p>
      </div>
    </div>

    <!-- Telegram Bot Settings -->
    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات ربات تلگرام</CardTitle>
        <CardDescription>
          پیکربندی اعتبارنامه‌های ربات تلگرام برای اعلان‌ها.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Telegram Admin ID -->
              <div class="space-y-2">
                <Label for="telegram_id">چت‌آیدی ادمین تلگرام</Label>
                <Input
                  id="telegram_id"
                  v-model="form.telegram_id"
                  placeholder="چت‌آیدی تلگرام ادمین را وارد کنید"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                 چت‌آیدی ادمین تلگرام را وارد کنید.
                </p>
              </div>

              <!-- Telegram Token -->
              <div class="space-y-2">
                <Label for="telegram_token">توکن ربات تلگرام</Label>
                <Input
                  id="telegram_token"
                  v-model="form.telegram_token"
                  placeholder="توکن ربات تلگرام را وارد کنید"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                  توکن ربات تلگرامی که اعلان‌ها را ارسال می‌کند.
                </p>
              </div>
            </div>

            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Telegram Logger ID -->
              <div class="space-y-2">
                <Label for="telegram_logger_id">چت‌آیدی Logger تلگرام</Label>
                <Input
                  id="telegram_logger_id"
                  v-model="form.telegram_logger_id"
                  placeholder="چت‌آیدی چت مدنظر برای دریافت اعلان‌ها در تلگرام (اختیاری)"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                    چت‌آیدی کانال یا گروه یا کاربری را وارد کنید.
                </p>
              </div>

              <!-- Telegram Topic ID -->
              <div class="space-y-2">
                <Label for="telegram_topic_id">چت‌آیدی تاپیک تلگرام</Label>
                <Input
                  id="telegram_topic_id"
                  v-model="form.telegram_topic_id"
                  placeholder="چت‌آیدی تاپیک تلگرام رو وارد کنید. (اختیاری)"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                 چت‌آیدی تاپیک مدنظرتون رو وارد کنید.
                </p>
              </div>
            </div>

            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Telegram Status -->
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5 text-right flex-1">
                  <Label for="telegram_status">فعال‌سازی اعلان‌های تلگرام</Label>
                  <p class="text-sm text-muted-foreground">
                    روشن/خاموش کردن اعلان‌های تلگرام.
                  </p>
                </div>
                <Switch
                  id="telegram_status"
                  v-model="form.telegram_status"
                  :disabled="isLoading || isLoadingData"
                  class="mr-4"
                />
              </div>

              <!-- Telegram Send Subscriptions -->
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5 text-right flex-1">
                  <Label for="telegram_send_subscriptions">ارسال هشدار به کاربران</Label>
                  <p class="text-sm text-muted-foreground">
                    ارسال مستقیم هشدارهای انقضا و مصرف به کاربران از طریق تلگرام.
                  </p>
                </div>
                <Switch
                  id="telegram_send_subscriptions"
                  v-model="form.telegram_send_subscriptions"
                  :disabled="isLoading || isLoadingData"
                  class="mr-4"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <Button type="submit" :disabled="isLoading || isLoadingData">
              <Icon v-if="isLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
              ذخیره تغییرات
            </Button>
            <Button
              type="button"
              variant="outline"
              :disabled="isLoading || isLoadingData"
              @click="handleReset"
            >
              بازنشانی
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
