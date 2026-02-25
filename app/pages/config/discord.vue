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
  discord_webhook_status: false,
  discord_webhook_url: '',
  discord_send_subscriptions: false,
})

// Load current admin data
const loadCurrentAdmin = async () => {
  isLoadingData.value = true
  try {
    const response = await fetchAdmin()
    form.value.discord_webhook_status = response.discord_webhook_status ?? false
    form.value.discord_webhook_url = response.discord_webhook_url ?? ''
    form.value.discord_send_subscriptions = response.discord_send_subscriptions ?? false
  }
  catch (error: any) {
    toast.error('بارگذاری پیکربندی دیسکورد ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoadingData.value = false
  }
}

// Update discord configuration
const handleSubmit = async () => {
  isLoading.value = true
  try {
    const discordWebhookUrl = String(form.value.discord_webhook_url ?? '').trim()

    const response = await api.admins.updateCurrent({
      discord_webhook_status: form.value.discord_webhook_status,
      discord_webhook_url: discordWebhookUrl || null,
      discord_send_subscriptions: form.value.discord_send_subscriptions,
    })
    setAdmin(response)
    toast.success('پیکربندی دیسکورد با موفقیت به‌روز شد')
    form.value.discord_webhook_status = response.discord_webhook_status ?? false
    form.value.discord_webhook_url = response.discord_webhook_url ?? ''
    form.value.discord_send_subscriptions = response.discord_send_subscriptions ?? false
  }
  catch (error: any) {
    toast.error('به‌روزرسانی پیکربندی دیسکورد ناموفق بود', {
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
          پیکربندی Webhook دیسکورد
        </h1>
        <p class="text-muted-foreground mt-2">
          پیکربندی تنظیمات Webhook دیسکورد برای حساب کاربری شما
        </p>
      </div>
    </div>

    <!-- Discord Webhook Settings -->
    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات Webhook دیسکورد</CardTitle>
        <CardDescription>
          پیکربندی آدرس Webhook دیسکورد برای اعلان‌ها.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Discord Webhook URL -->
              <div class="space-y-2">
                <Label for="discord_webhook_url">آدرس Webhook دیسکورد</Label>
                <Input
                  id="discord_webhook_url"
                  v-model="form.discord_webhook_url"
                  placeholder="آدرس Webhook دیسکورد را وارد کنید"
                  :disabled="isLoading || isLoadingData"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  class="text-right"
                  dir="rtl"
                />
                <p class="text-sm text-muted-foreground text-right">
                  آدرس Webhook کانال دیسکورد که اعلان‌ها را دریافت خواهد کرد.
                </p>
              </div>
            </div>

            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <!-- Discord Webhook Status -->
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5 text-right flex-1">
                  <Label for="discord_webhook_status">فعال‌سازی اعلان‌های دیسکورد</Label>
                  <p class="text-sm text-muted-foreground">
                    روشن/خاموش کردن اعلان‌های دیسکورد.
                  </p>
                </div>
                <Switch
                  id="discord_webhook_status"
                  v-model="form.discord_webhook_status"
                  :disabled="isLoading || isLoadingData"
                  class="mr-4"
                />
              </div>

              <!-- Discord Send Subscriptions -->
              <div class="flex items-center justify-between rounded-lg border p-4">
                <div class="space-y-0.5 text-right flex-1">
                  <Label for="discord_send_subscriptions">ارسال هشدار به کاربران</Label>
                  <p class="text-sm text-muted-foreground">
                    ارسال مستقیم هشدارهای انقضا و مصرف به کاربران از طریق دیسکورد.
                  </p>
                </div>
                <Switch
                  id="discord_send_subscriptions"
                  v-model="form.discord_send_subscriptions"
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
