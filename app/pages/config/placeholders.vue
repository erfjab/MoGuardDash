<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { AdminPlaceHolder, AdminPlaceHolderCategory } from '~/types/api'

const { t } = useI18n()

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const api = useApi()
const { admin, fetchAdmin, setAdmin } = useAdmin()

const isLoading = ref(false)
const isLoadingData = ref(false)

// Available categories
const CATEGORIES: AdminPlaceHolderCategory[] = ['info', 'limited', 'expired', 'disabled']

const placeholders = ref<AdminPlaceHolder[]>([])
const showAddDialog = ref(false)
const editingIndex = ref<number | null>(null)
const isExtraDataOpen = ref(false)

// Form for adding/editing placeholder
const placeholderForm = ref<AdminPlaceHolder>({
  remark: '',
  uuid: '',
  address: '',
  port: 0,
  categories: [],
})

// Generate random UUID
function generateRandomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Generate random domain
function generateRandomAddress() {
  const prefixes = ['server', 'node', 'proxy', 'cdn', 'edge', 'cloud', 'net', 'vpn', 'gate', 'hub']
  const domains = ['example.com', 'myserver.net', 'cloudservice.io', 'network.org', 'service.cloud']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${prefix}${num}.${domain}`
}

// Generate random port
function generateRandomPort() {
  const commonPorts = [443, 8443, 2053, 2083, 2087, 2096, 8080, 8880]
  return commonPorts[Math.floor(Math.random() * commonPorts.length)]
}

// Copy format helper
// Load current admin data
const loadCurrentAdmin = async () => {
  isLoadingData.value = true
  try {
    const response = await fetchAdmin()
    placeholders.value = response.placeholders || []
  }
  catch (error: any) {
    toast.error('بارگذاری کانفیگ‌های آماری ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoadingData.value = false
  }
}

// Save placeholders to server
const savePlaceholders = async () => {
  isLoading.value = true
  try {
    const response = await api.admins.updateCurrent({
      placeholders: placeholders.value,
    })
    setAdmin(response)
    toast.success('کانفیگ‌های آماری با موفقیت به‌روز شد')
    placeholders.value = response.placeholders || []
  }
  catch (error: any) {
    toast.error('به‌روزرسانی کانفیگ‌های آماری ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoading.value = false
  }
}

// Add new placeholder
const handleAdd = () => {
  placeholderForm.value = {
    remark: '',
    uuid: generateRandomUUID(),
    address: generateRandomAddress(),
    port: generateRandomPort(),
    categories: [],
  }
  editingIndex.value = null
  showAddDialog.value = true
}

// Edit existing placeholder
const handleEdit = (index: number) => {
  const ph = placeholders.value[index]
  if (!ph)
    return

  placeholderForm.value = {
    remark: ph.remark,
    uuid: ph.uuid,
    address: ph.address,
    port: ph.port,
    categories: [...ph.categories],
  }
  editingIndex.value = index
  showAddDialog.value = true
}

// Edit existing placeholder - REMOVED, only delete is allowed
// const handleEdit = (index: number) => { ... }

// Delete placeholder
const handleDelete = (index: number) => {
  placeholders.value.splice(index, 1)
}

// Delete from dialog
const handleDeleteFromDialog = () => {
  if (editingIndex.value !== null) {
    handleDelete(editingIndex.value)
    showAddDialog.value = false
  }
}

// Save add/edit dialog
const handleSaveDialog = () => {
  if (!placeholderForm.value.remark) {
    toast.error('نام کانفیگ الزامی است')
    return
  }

  if (!placeholderForm.value.uuid) {
    toast.error('UUID الزامی است')
    return
  }

  if (!placeholderForm.value.address) {
    toast.error('آدرس الزامی است')
    return
  }
  
  if (placeholderForm.value.categories.length === 0) {
    toast.error('حداقل یک دسته‌بندی الزامی است')
    return
  }
  
  if (editingIndex.value !== null && editingIndex.value >= 0) {
    placeholders.value.splice(editingIndex.value, 1, {
      remark: placeholderForm.value.remark,
      uuid: placeholderForm.value.uuid,
      address: placeholderForm.value.address,
      port: placeholderForm.value.port,
      categories: [...placeholderForm.value.categories],
    })
    toast.success('کانفیگ آماری به‌روز شد', {
      description: 'برای اعمال تغییرات روی "ذخیره همه تغییرات" کلیک کنید',
    })
  }
  else {
    // Add new
    placeholders.value.push({
      remark: placeholderForm.value.remark,
      uuid: placeholderForm.value.uuid,
      address: placeholderForm.value.address,
      port: placeholderForm.value.port,
      categories: [...placeholderForm.value.categories],
    })
    toast.info('کانفیگ آماری اضافه شد', {
      description: 'فراموش نکنید روی "ذخیره همه تغییرات" کلیک کنید',
    })
  }

  showAddDialog.value = false
  editingIndex.value = null
}

// Toggle category selection
const toggleCategory = (category: AdminPlaceHolderCategory) => {
  const index = placeholderForm.value.categories.indexOf(category)
  if (index > -1) {
    placeholderForm.value.categories.splice(index, 1)
  } else {
    placeholderForm.value.categories.push(category)
  }
}

onMounted(() => {
  loadCurrentAdmin()
})

watch(showAddDialog, (open) => {
  if (!open) {
    editingIndex.value = null
  }
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <div class="text-right space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">
          پیکربندی کانفیگ‌های آماری
        </h1>
        <p class="text-muted-foreground">
          کانفیگ‌های آماری صرفاً برای نمایش اطلاعات به کاربران (مانند نام کاربری، حجم مصرفی مانده، تاریخ انقضا و...) طراحی شده‌اند و قابلیت اتصال ندارند. شما می‌توانید برای وضعیت‌های مختلف (فعال، محدود، منقضی، غیرفعال) به تعداد دلخواه کانفیگ آماری تعریف کنید.
        </p>
      </div>
    </div>

    <div class="rounded-xl border bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="text-sm text-right space-y-1">
        <p class="font-semibold">راهنمای کانفیگ آماری</p>
        <p class="text-muted-foreground">پاسخ سوالات رایج درباره نحوه ساخت و استفاده از کانفیگ‌های آماری را در بخش سوالات متداول ببینید.</p>
      </div>
      <Button as-child>
        <NuxtLink :to="{ path: '/faq', query: { category: 'کانفیگ‌های آماری' } }" class="whitespace-nowrap">
          سوالات متداول کانفیگ آماری
          <Icon name="i-lucide-arrow-left" class="mr-2 h-4 w-4" />
        </NuxtLink>
      </Button>
    </div>

    <Card>
      <CardHeader class="text-right">
        <CardTitle>تنظیمات کانفیگ‌های آماری</CardTitle>
        <CardDescription>
          پیکربندی قالب‌های نمایشی سفارشی و دسته‌بندی‌های مرتبط با آن‌ها.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Placeholders List -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label class="text-base">کانفیگ‌های آماری تنظیم شده</Label>
            <Button size="sm" @click="handleAdd" :disabled="isLoadingData">
              <Icon name="lucide:plus" class="ml-2 h-4 w-4" />
              افزودن کانفیگ آماری
            </Button>
          </div>

          <div v-if="placeholders.length === 0" class="text-center py-8 text-muted-foreground">
            هیچ کانفیگ آماری تنظیم نشده است. برای ایجاد یکی روی "افزودن کانفیگ آماری" کلیک کنید.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="(placeholder, index) in placeholders"
              :key="index"
              class="group relative flex flex-col justify-between gap-3 p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              @click="handleEdit(index)"
            >
              <div class="flex-1 space-y-1.5 min-w-0">
                <div class="font-mono text-sm font-medium break-all">
                  {{ placeholder.remark }}
                </div>
                <div class="text-xs text-muted-foreground break-all font-mono">
                  {{ placeholder.uuid }} <span class="text-muted-foreground/30 mx-1">|</span> {{ placeholder.address }}:{{ placeholder.port }}
                </div>
                <div class="flex gap-1.5 flex-wrap">
                  <Badge
                    v-for="category in placeholder.categories"
                    :key="category"
                    variant="secondary"
                    class="text-[10px] px-1.5 py-0 h-5 font-normal"
                  >
                    {{ category }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex gap-4 pt-4">
          <Button @click="savePlaceholders" :disabled="isLoading || isLoadingData">
            <Icon v-if="isLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
            ذخیره همه تغییرات
          </Button>
          <Button
            variant="outline"
            @click="loadCurrentAdmin"
            :disabled="isLoading || isLoadingData"
          >
            بازنشانی
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Add Dialog -->
    <Dialog v-model:open="showAddDialog">
      <DialogContent class="w-[95vw] max-w-md sm:w-full sm:max-w-lg max-h-[70vh] sm:max-h-[75vh] overflow-y-auto overflow-x-hidden [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto" dir="rtl">
        <DialogHeader class="items-start text-right space-y-1.5">
          <DialogTitle class="text-base sm:text-lg">{{ editingIndex !== null ? 'ویرایش کانفیگ آماری' : 'افزودن کانفیگ آماری' }}</DialogTitle>
          <DialogDescription class="text-xs sm:text-sm">
            یک کانفیگ آماری سفارشی با قالب نمایشی و دسته‌بندی‌ها پیکربندی کنید
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4 overflow-x-hidden">
          <!-- Remark -->
          <div class="space-y-2">
            <Label for="remark" class="text-xs sm:text-sm">قالب نمایشی</Label>
            <div class="flex gap-2">
              <Input
                id="remark"
                v-model="placeholderForm.remark"
                placeholder="مثال: {username} - {expire_date}"
                class="text-xs sm:text-sm flex-1 text-right"
                dir="rtl"
              />
              <FormatPicker v-model="placeholderForm.remark" />
            </div>
            <p class="text-[10px] sm:text-xs text-muted-foreground text-right">
              روی <Icon name="lucide:braces" class="inline h-3 w-3" /> کلیک کنید تا متغیرهای قالب را وارد کنید
            </p>
          </div>

          <!-- Categories -->
          <div class="space-y-2">
            <Label class="text-xs sm:text-sm">دسته‌بندی‌ها</Label>
            <div class="grid grid-cols-4 gap-2">
              <Button
                v-for="category in CATEGORIES"
                :key="category"
                type="button"
                :variant="placeholderForm.categories.includes(category) ? 'default' : 'outline'"
                size="sm"
                @click="toggleCategory(category)"
                class="text-xs sm:text-sm h-8 sm:h-9"
              >
                {{ category === 'info' ? 'فعال' : category === 'limited' ? 'محدود' : category === 'expired' ? 'منقضی' : 'غیرفعال' }}
              </Button>
            </div>
            <p class="text-[10px] sm:text-xs text-muted-foreground text-right">
              حداقل یک دسته‌بندی را انتخاب کنید که این کانفیگ آماری در آن استفاده شود
            </p>
          </div>

          <!-- Extra Data -->
          <Collapsible v-model:open="isExtraDataOpen" class="w-full border rounded-lg">
            <CollapsibleTrigger class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
              <div class="flex items-center gap-2">
                <Icon 
                  name="lucide:chevron-right" 
                  class="h-4 w-4 transition-transform duration-200"
                  :class="{ 'rotate-90': isExtraDataOpen }"
                />
                <span class="font-medium text-sm">داده‌های اضافی</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="px-4 py-3 space-y-4 border-t">
                <!-- UUID -->
                <div class="space-y-2">
                  <Label for="uuid" class="text-xs sm:text-sm">UUID</Label>
                  <div class="flex gap-2">
                    <Input
                      id="uuid"
                      v-model="placeholderForm.uuid"
                      placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                      class="text-xs sm:text-sm flex-1 text-right"
                      dir="rtl"
                    />
                    <FormatPicker v-model="placeholderForm.uuid" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <!-- Address -->
                  <div class="space-y-2">
                    <Label for="address" class="text-xs sm:text-sm">آدرس</Label>
                    <div class="flex gap-2">
                      <Input
                        id="address"
                        v-model="placeholderForm.address"
                        placeholder="185.92.174.231"
                        class="text-xs sm:text-sm flex-1 text-right"
                        dir="rtl"
                      />
                      <FormatPicker v-model="placeholderForm.address" />
                    </div>
                  </div>

                  <!-- Port -->
                  <div class="space-y-2">
                    <Label for="port" class="text-xs sm:text-sm">پورت</Label>
                    <Input
                      id="port"
                      v-model.number="placeholderForm.port"
                      type="number"
                      placeholder="443"
                      class="text-xs sm:text-sm text-right"
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter class="gap-2 sm:gap-2">
          <Button variant="outline" @click="showAddDialog = false" class="text-xs sm:text-sm h-8 sm:h-9">
            لغو
          </Button>
          <Button
            v-if="editingIndex !== null"
            variant="outline"
            class="text-xs sm:text-sm h-8 sm:h-9"
            @click="handleDeleteFromDialog"
            :disabled="isLoadingData"
          >
            حذف
          </Button>
          <Button @click="handleSaveDialog" class="text-xs sm:text-sm h-8 sm:h-9">
            {{ editingIndex !== null ? 'ذخیره تغییرات' : 'افزودن کانفیگ آماری' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
