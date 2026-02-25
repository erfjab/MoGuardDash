<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const api = useApi()
const { admin, fetchAdmin, setAdmin } = useAdmin()
const { t } = useI18n()

const isLoadingLinks = ref(false)
const isLoadingAnnounce = ref(false)
const isLoadingData = ref(false)

const form = ref({
  max_links: 0,
  access_title: '',
  access_description: '',
  username_tag: false,
  shuffle_links: false,
  support_url: '',
  update_interval: 1,
  announce: '',
  announce_url: '',
})

// Load current admin data
const loadCurrentAdmin = async () => {
  isLoadingData.value = true
  try {
    const response = await fetchAdmin()
    form.value.max_links = response.max_links ?? 0
    form.value.access_title = response.access_title ?? ''
    form.value.access_description = response.access_description ?? ''
    form.value.username_tag = response.username_tag ?? false
    form.value.shuffle_links = response.shuffle_links ?? false
    form.value.support_url = response.support_url ?? ''
    form.value.update_interval = response.update_interval ?? 1
    form.value.announce = response.announce ?? ''
    form.value.announce_url = response.announce_url ?? ''
  }
  catch (error: any) {
    toast.error('بارگذاری پیکربندی دسترسی ناموفق بود', {
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

// Update links configuration
const handleLinksSubmit = async () => {
  isLoadingLinks.value = true
  try {
    const supportUrl = String(form.value.support_url ?? '').trim()
    const updateInterval = toNumberOrZero(form.value.update_interval)
    const maxLinks = toNumberOrZero(form.value.max_links)

    const response = await api.admins.updateCurrent({
      max_links: maxLinks,
      access_title: form.value.access_title,
      access_description: form.value.access_description,
      username_tag: form.value.username_tag,
      shuffle_links: form.value.shuffle_links,
      support_url: supportUrl,
      update_interval: updateInterval,
    })
    setAdmin(response)
    toast.success('پیکربندی لینک‌ها با موفقیت به‌روز شد')
    form.value.max_links = response.max_links ?? 0
    form.value.access_title = response.access_title ?? ''
    form.value.access_description = response.access_description ?? ''
    form.value.username_tag = response.username_tag ?? false
    form.value.shuffle_links = response.shuffle_links ?? false
    form.value.support_url = response.support_url ?? ''
    form.value.update_interval = response.update_interval ?? 1
  }
  catch (error: any) {
    toast.error('به‌روزرسانی پیکربندی لینک‌ها ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoadingLinks.value = false
  }
}

// Update announcement configuration
const handleAnnounceSubmit = async () => {
  isLoadingAnnounce.value = true
  try {
    const announce = String(form.value.announce ?? '').trim()
    const announceUrl = String(form.value.announce_url ?? '').trim()

    const response = await api.admins.updateCurrent({
      announce: announce,
      announce_url: announceUrl,
    })
    setAdmin(response)
    toast.success('پیکربندی اطلاعیه با موفقیت به‌روز شد')
    form.value.announce = response.announce ?? ''
    form.value.announce_url = response.announce_url ?? ''
  }
  catch (error: any) {
    toast.error('به‌روزرسانی پیکربندی اطلاعیه ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoadingAnnounce.value = false
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
          پیکربندی لینک‌ها
        </h1>
        <p class="text-muted-foreground mt-2">
          پیکربندی تنظیمات لینک برای اشتراک‌ها
        </p>
      </div>
    </div>

    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات لینک</CardTitle>
        <CardDescription>
          مدیریت حداکثر لینک‌ها و نمایش اطلاعات دسترسی.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLinksSubmit" class="space-y-6">
          <!-- Max Links & Access Title Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Max Links -->
            <div class="space-y-2">
              <Label for="max_links">حداکثر لینک‌ها</Label>
              <Input
                id="max_links"
                v-model.number="form.max_links"
                type="number"
                placeholder="0"
                :disabled="isLoadingLinks || isLoadingData"
                class="text-right"
                dir="rtl"
              />
              <p class="text-sm text-muted-foreground text-right">
                حداکثر تعداد لینک‌ها در هر اشتراک (0 = نامحدود).
              </p>
            </div>

            <!-- Access Title -->
            <div class="space-y-2">
              <Label for="access_title">عنوان دسترسی</Label>
              <div class="flex gap-2">
                <Input
                  id="access_title"
                  v-model="form.access_title"
                  placeholder="عنوان دسترسی را وارد کنید"
                  :disabled="isLoadingLinks || isLoadingData"
                  class="flex-1 text-right"
                  dir="rtl"
                />
                <FormatPicker v-model="form.access_title" :disabled="isLoadingLinks || isLoadingData" />
              </div>
              <p class="text-sm text-muted-foreground text-right">
                عنوان سفارشی نمایش داده شده در صفحه دسترسی. از <Icon name="lucide:braces" class="inline h-3 w-3" /> برای متغیرها استفاده کنید.
              </p>
            </div>
          </div>

          <!-- Support URL & Update Interval Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Support URL -->
            <div class="space-y-2">
              <Label for="support_url">لینک پشتیبانی</Label>
              <Input
                id="support_url"
                v-model="form.support_url"
                placeholder="https://t.me/support"
                :disabled="isLoadingLinks || isLoadingData"
                class="text-right"
                dir="rtl"
              />
              <p class="text-sm text-muted-foreground text-right">
                لینک پشتیبانی نمایش داده شده به کاربران (مثلاً کانال تلگرام).
              </p>
            </div>

            <!-- Update Interval -->
            <div class="space-y-2">
              <Label for="update_interval">بازه به‌روزرسانی (ساعت)</Label>
              <Input
                id="update_interval"
                v-model.number="form.update_interval"
                type="number"
                placeholder="1"
                min="1"
                :disabled="isLoadingLinks || isLoadingData"
                class="text-right"
                dir="rtl"
              />
              <p class="text-sm text-muted-foreground text-right">
                هر چند ساعت یکبار کلاینت‌ها باید اشتراک را به‌روز کنند.
              </p>
            </div>
          </div>

          <!-- Access Description -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="access_description">توضیحات دسترسی</Label>
              <FormatPicker v-model="form.access_description" :disabled="isLoadingLinks || isLoadingData" size="sm" />
            </div>
            <Textarea
              id="access_description"
              v-model="form.access_description"
              placeholder="توضیحات دسترسی را وارد کنید"
              rows="4"
              :disabled="isLoadingLinks || isLoadingData"
              class="text-right"
              dir="rtl"
            />
            <p class="text-sm text-muted-foreground text-right">
              توضیحات یا دستورالعمل‌های سفارشی نمایش داده شده به کاربران. از <Icon name="lucide:braces" class="inline h-3 w-3" /> برای متغیرها استفاده کنید.
            </p>
          </div>

          <!-- Toggle Options Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Username Tag -->
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5 text-right flex-1">
                <Label class="text-base">برچسب نام کاربری</Label>
                <p class="text-sm text-muted-foreground">
                  اگر فعال باشد، #username به لینک اضافه می‌شود برای شناسایی کاربر و پشتیبانی از v2rayng.
                </p>
              </div>
              <Switch
                v-model="form.username_tag"
                :disabled="isLoadingLinks || isLoadingData"
                class="mr-4"
              />
            </div>

            <!-- Shuffle Links -->
            <div class="flex items-center justify-between rounded-lg border p-4">
              <div class="space-y-0.5 text-right flex-1">
                <Label class="text-base">تصادفی‌سازی لینک‌ها</Label>
                <p class="text-sm text-muted-foreground">
                  اگر فعال باشد، ترتیب لینک‌ها در هر درخواست اشتراک به صورت تصادفی مرتب می‌شود.
                </p>
              </div>
              <Switch
                v-model="form.shuffle_links"
                :disabled="isLoadingLinks || isLoadingData"
                class="mr-4"
              />
            </div>
          </div>

          <div class="flex gap-4">
            <Button type="submit" :disabled="isLoadingLinks || isLoadingData">
              <Icon v-if="isLoadingLinks" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
              ذخیره تغییرات
            </Button>
            <Button
              type="button"
              variant="outline"
              :disabled="isLoadingLinks || isLoadingData"
              @click="handleReset"
            >
              بازنشانی
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Announcement Card -->
    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات اطلاعیه</CardTitle>
        <CardDescription>
          پیکربندی پیام‌های اطلاعیه نمایش داده شده به کاربران در happ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleAnnounceSubmit" class="space-y-6">
          <!-- Announce & Announce URL Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Announce -->
            <div class="space-y-2">
              <Label for="announce">اطلاعیه</Label>
              <div class="flex gap-2">
                <Input
                  id="announce"
                  v-model="form.announce"
                  placeholder="متن اطلاعیه را وارد کنید"
                  :disabled="isLoadingAnnounce || isLoadingData"
                  class="flex-1 text-right"
                  dir="rtl"
                />
                <FormatPicker v-model="form.announce" :disabled="isLoadingAnnounce || isLoadingData" />
              </div>
              <p class="text-sm text-muted-foreground text-right">
                پیام اطلاعیه نمایش داده شده به کاربران در happ. از <Icon name="lucide:braces" class="inline h-3 w-3" /> برای متغیرها استفاده کنید.
              </p>
            </div>

            <!-- Announce URL -->
            <div class="space-y-2">
              <Label for="announce_url">لینک اطلاعیه</Label>
              <Input
                id="announce_url"
                v-model="form.announce_url"
                placeholder="https://example.com/announcement"
                :disabled="isLoadingAnnounce || isLoadingData"
                class="text-right"
                dir="rtl"
              />
              <p class="text-sm text-muted-foreground text-right">
                لینک URL برای اطلاعیه.
              </p>
            </div>
          </div>

          <div class="flex gap-4">
            <Button type="submit" :disabled="isLoadingAnnounce || isLoadingData">
              <Icon v-if="isLoadingAnnounce" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
              ذخیره تغییرات
            </Button>
            <Button
              type="button"
              variant="outline"
              :disabled="isLoadingAnnounce || isLoadingData"
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
