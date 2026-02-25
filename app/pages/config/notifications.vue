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
  expire_warning_days: undefined as number | undefined,
  usage_warning_percent: undefined as number | undefined,
})

// Load current admin data
const loadCurrentAdmin = async () => {
  isLoadingData.value = true
  try {
    const response = await fetchAdmin()
    form.value.expire_warning_days = response.expire_warning_days ?? undefined
    form.value.usage_warning_percent = response.usage_warning_percent ?? undefined
  }
  catch (error: any) {
    toast.error('بارگذاری پیکربندی اعلان‌ها ناموفق بود', {
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
    const expireWarningDays = toNumberOrZero(form.value.expire_warning_days)
    const usageWarningPercent = toNumberOrZero(form.value.usage_warning_percent)

    const response = await api.admins.updateCurrent({
      expire_warning_days: expireWarningDays,
      usage_warning_percent: usageWarningPercent,
    })
    setAdmin(response)
    toast.success('پیکربندی اعلان‌ها با موفقیت به‌روز شد')
    form.value.expire_warning_days = response.expire_warning_days ?? undefined
    form.value.usage_warning_percent = response.usage_warning_percent ?? undefined
  }
  catch (error: any) {
    toast.error('به‌روزرسانی پیکربندی اعلان‌ها ناموفق بود', {
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
          تنظیمات اعلان‌ها
        </h1>
        <p class="text-muted-foreground mt-2">
          پیکربندی تنظیمات عمومی اعلان‌ها
        </p>
      </div>
    </div>

    <!-- Warning Settings -->
    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات هشدار</CardTitle>
        <CardDescription>
          پیکربندی آستانه‌های هشدار برای اعلان‌های انقضا و مصرف.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Expire Warning Days -->
              <div class="space-y-2">
                <Label for="expire_warning_days">روزهای هشدار انقضا</Label>
                <Input
                  id="expire_warning_days"
                  v-model.number="form.expire_warning_days"
                  type="number"
                  placeholder="مثال: 3"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                  تعداد روز قبل از انقضا برای ارسال هشدار.
                </p>
              </div>

              <!-- Usage Warning Percent -->
              <div class="space-y-2">
                <Label for="usage_warning_percent">درصد هشدار مصرف</Label>
                <Input
                  id="usage_warning_percent"
                  v-model.number="form.usage_warning_percent"
                  type="number"
                  placeholder="مثال: 80"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                  درصد مصرف برای فعال‌سازی هشدار.
                </p>
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
