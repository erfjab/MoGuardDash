<script setup lang="ts">
import { createColumns } from '@/components/subscriptions/components/columns'
import DataTable from '@/components/subscriptions/components/DataTable.vue'
import SubscriptionDetailsDialog from '@/components/subscriptions/components/SubscriptionDetailsDialog.vue'
import CreateSubscriptionDialog from '@/components/subscriptions/components/CreateSubscriptionDialog.vue'
import QrCodeDialog from '@/components/subscriptions/components/QrCodeDialog.vue'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { SubscriptionResponse } from '~/types/api'
import { smartToast as toast } from '~/lib/smart-toast'
import { Info } from 'lucide-vue-next'

const api = useApi()
const { isAuthenticated } = useAuth()
const { admin, fetchAdmin, fetchInitialSubscriptions, initialSubscriptions, isOwner } = useAdmin()
const { t } = useI18n()

const subscriptions = ref<SubscriptionResponse[]>([])
const isLoading = ref(false)
const selectedSubscription = ref<SubscriptionResponse | null>(null)
const showCreateDialog = ref(false)
const createDialogInitialValues = ref({})
const showConfirmDialog = ref(false)
const showQrCodeDialog = ref(false)
const qrCodeSubscription = ref<SubscriptionResponse | null>(null)
const confirmAction = ref<{ type: string; subscription: SubscriptionResponse | null }>({ type: '', subscription: null })
const currentAdmin = computed(() => admin.value)
const selectionResetKey = ref(0)
const pendingBulkAction = ref<{ action: string; usernames: string[] } | null>(null)
const pendingBulkActionType = computed(() => pendingBulkAction.value?.action ?? '')
const pendingBulkActionCount = computed(() => pendingBulkAction.value?.usernames.length ?? 0)
const showBulkConfirmDialog = ref(false)

const route = useRoute()
const router = useRouter()

// Handle query params
const handleQueryParams = () => {
  const action = route.query.action as string
  
  if (action === 'create') {
    createDialogInitialValues.value = {}
    showCreateDialog.value = true
    // Clear query
    router.replace({ query: { ...route.query, action: undefined } })
  } else if (action === 'search') {
    // Focus search input
    setTimeout(() => {
      const searchInput = document.querySelector(`input[placeholder="${t('subscriptions.searchByUsername')}"]`) as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    }, 500)
    // Clear query
    router.replace({ query: { ...route.query, action: undefined } })
  } else if (action === 'test') {
    // Generate random username
    const randomSuffix = Math.random().toString(36).substring(2, 7)
    createDialogInitialValues.value = {
      username: `test${randomSuffix}`,
      limit_usage_gb: 0.1,
      limit_expire: 1,
      auto_delete_days: 1
    }
    showCreateDialog.value = true
    // Clear query
    router.replace({ query: { ...route.query, action: undefined } })
  }
}

onMounted(() => {
  handleQueryParams()
})

watch(() => route.query, () => {
  handleQueryParams()
})

const refreshIntervalOptions = computed(() => [
  { label: t('subscriptions.secondsShort', { count: 30 }), value: 30_000 },
  { label: t('subscriptions.secondsShort', { count: 60 }), value: 60_000 },
  { label: t('subscriptions.secondsShort', { count: 120 }), value: 120_000 },
])

const { startAutoRefresh, triggerAutoRefresh, setAutoRefreshInterval, intervalMs } = useAutoRefresh(() => fetchSubscriptions(true, true), {
  immediate: false,
})

const selectedRefreshInterval = ref<number>(intervalMs.value)
const refreshMenuLabel = computed(() => {
  return refreshIntervalOptions.value.find(option => option.value === selectedRefreshInterval.value)?.label ?? t('subscriptions.secondsShort', { count: 30 })
})

function handleSelectRefreshInterval(interval: number) {
  selectedRefreshInterval.value = interval
  setAutoRefreshInterval(interval)
}

async function handleRefreshNow() {
  await fetchSubscriptions(true)
  toast.success(t('subscriptions.dataRefreshed'))
}

// Filters state
const statusFilters = ref<Set<string>>(new Set())
// Default sort: Created (Newest)
const orderBy = ref<string | undefined>('created_at_desc')

// Pagination state
const currentPage = ref(1)
const pageSize = ref(10)

// Search state
const searchQuery = ref('')

// Total count state
const totalCount = ref(0)

const canCreate = computed(() => {
  return currentAdmin.value?.role !== 'owner'
})

const showCustomDomainAlert = computed(() => {
  // Don't show until admin data is loaded
  if (!currentAdmin.value) return false
  
  const prefix = currentAdmin.value?.access_prefix
  // Show alert if no custom domain is set OR if using the default versub.vercel.app domain
  return !prefix || prefix.startsWith('https://versub.vercel.app')
})

const showPlaceholderNotice = computed(() => (currentAdmin.value?.placeholders?.length ?? 0) === 0)

// Create columns with action handler - reactive to isOwner
const columns = computed(() => createColumns((action: string, subscription: SubscriptionResponse) => {
  if (action === 'qrcode') {
    qrCodeSubscription.value = subscription
    showQrCodeDialog.value = true
  } else {
    confirmAction.value = { type: action, subscription }
    showConfirmDialog.value = true
  }
}, isOwner.value, t))

// Flag to prevent concurrent fetches
const isFetching = ref(false)

async function fetchSubscriptions(force = false, background = false) {
  // Prevent concurrent requests
  if (isFetching.value) return
  
  isFetching.value = true
  if (!background) isLoading.value = true
  try {
    // Check if we can use cached initial subscriptions
    const isDefaultFilters = 
      statusFilters.value.size === 0 && 
      orderBy.value === 'created_at_desc' && 
      currentPage.value === 1 && 
      pageSize.value === 10 &&
      !searchQuery.value

    if (isDefaultFilters) {
      const { subscriptions: cachedSubs, count: cachedCount } = await fetchInitialSubscriptions(force)
      subscriptions.value = cachedSubs
      totalCount.value = cachedCount
      return
    }

    // Build filters object
    const filters: any = {}
    
    // Convert status filters to API params
    // Format is "field:value" e.g., "limited:true" or "enabled:false"
    statusFilters.value.forEach((filter: string) => {
      const [field, value] = filter.split(':')
      if (field && value !== undefined) {
        filters[field] = value === 'true'
      }
    })
    
    // Add order_by if set
    if (orderBy.value) {
      filters.order_by = orderBy.value
    }
    
    // Add search if present
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    
    // Add pagination
    filters.page = currentPage.value
    filters.size = pageSize.value
    
    // Build count filters (same as list filters but without pagination)
    const countFilters: any = {}
    statusFilters.value.forEach((filter: string) => {
      const [field, value] = filter.split(':')
      if (field && value !== undefined) {
        countFilters[field] = value === 'true'
      }
    })
    
    // Fetch list and count in parallel
    const [response, count] = await Promise.all([
      api.subscriptions.getAll(filters),
      api.subscriptions.getCount(countFilters)
    ])
    
    subscriptions.value = response
    totalCount.value = count
  } catch (error: any) {
    toast.error(error.message || t('subscriptions.fetchFailed'))
  } finally {
    isFetching.value = false
    if (!background) isLoading.value = false
  }
}

function handleRowClick(subscription: SubscriptionResponse) {
  selectedSubscription.value = subscription
}

function handleCloseDetails() {
  selectedSubscription.value = null
}

function handleUpdated(sub: SubscriptionResponse) {
  // Update the selected subscription immediately with the fresh data
  selectedSubscription.value = sub
  
  // Update the list reactively (clone to trigger table updates)
  const idx = subscriptions.value.findIndex((s: SubscriptionResponse) => s.id === sub.id)
  if (idx !== -1) {
    const next = [...subscriptions.value]
    next[idx] = sub
    subscriptions.value = next
  } else {
    fetchSubscriptions()
  }

  // Keep the cached initial subscriptions in sync when applicable
  const cachedIndex = initialSubscriptions.value.findIndex((s: SubscriptionResponse) => s.id === sub.id)
  if (cachedIndex !== -1) {
    const cachedNext = [...initialSubscriptions.value]
    cachedNext[cachedIndex] = sub
    initialSubscriptions.value = cachedNext
  }
}

async function handleRefresh() {
  await fetchSubscriptions(true)
}

function handleUpdateStatusFilters(values: string[]) {
  statusFilters.value = new Set(values)
  currentPage.value = 1 // Reset to first page
  fetchSubscriptions()
}

function handleUpdateOrderBy(value: string | undefined) {
  orderBy.value = value
  currentPage.value = 1 // Reset to first page
  fetchSubscriptions()
}

function handleUpdateSearch(value: string) {
  searchQuery.value = value
  currentPage.value = 1 // Reset to first page
  fetchSubscriptions()
}

function handleBulkActionRequest(payload: { action: string; usernames: string[] }) {
  if (!payload?.action || !payload.usernames?.length) {
    toast.error(t('subscriptions.selectOne'))
    return
  }
  pendingBulkAction.value = payload
  showBulkConfirmDialog.value = true
}

function handleCancelBulkAction() {
  showBulkConfirmDialog.value = false
  pendingBulkAction.value = null
}

async function handleConfirmBulkAction() {
  if (!pendingBulkAction.value) return
  const { action, usernames } = pendingBulkAction.value
  isLoading.value = true
  try {
    switch (action) {
      case 'revoke':
        await api.subscriptions.revoke(usernames)
        toast.success(t('subscriptions.bulkRevokeSuccess'))
        break
      case 'reset':
        await api.subscriptions.reset(usernames)
        toast.success(t('subscriptions.bulkResetSuccess'))
        break
      case 'enable':
        await api.subscriptions.enable(usernames)
        toast.success(t('subscriptions.bulkEnableSuccess'))
        break
      case 'disable':
        await api.subscriptions.disable(usernames)
        toast.success(t('subscriptions.bulkDisableSuccess'))
        break
      case 'delete':
        await api.subscriptions.delete(usernames)
        toast.success(t('subscriptions.bulkDeleteSuccess'))
        break
      default:
        toast.error(t('subscriptions.unsupportedAction'))
        return
    }

    await fetchSubscriptions(true)
    selectionResetKey.value += 1
  } catch (error: any) {
    toast.error(error.message || t('subscriptions.actionFailed'))
  } finally {
    isLoading.value = false
    handleCancelBulkAction()
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchSubscriptions()
}

function handleCreate() {
  if (!canCreate.value) {
    toast.error(t('subscriptions.noPermissionCreate'))
    return
  }
  showCreateDialog.value = true
}

async function handleCreated() {
  // Force refresh to show the new subscription immediately
  await fetchSubscriptions(true)
}

async function handleConfirmAction() {
  if (!confirmAction.value.subscription) return
  
  const { type, subscription } = confirmAction.value
  isLoading.value = true
  
  try {
    switch (type) {
      case 'revoke':
        await api.subscriptions.revoke([subscription.username])
        toast.success(t('subscriptions.revokeSuccessSingle'))
        break
      case 'reset':
        await api.subscriptions.reset([subscription.username])
        toast.success(t('subscriptions.resetSuccessSingle'))
        break
      case 'enable':
        await api.subscriptions.enable([subscription.username])
        toast.success(t('subscriptions.enableSuccessSingle'))
        break
      case 'disable':
        await api.subscriptions.disable([subscription.username])
        toast.success(t('subscriptions.disableSuccessSingle'))
        break
      case 'delete':
        await api.subscriptions.delete([subscription.username])
        toast.success(t('subscriptions.deleteSuccessSingle'))
        break
    }
    // Force refresh to update the list
    await fetchSubscriptions(true)
  } catch (error: any) {
    toast.error(error.message || t('subscriptions.actionFailed'))
  } finally {
    isLoading.value = false
    showConfirmDialog.value = false
    confirmAction.value = { type: '', subscription: null }
  }
}

const confirmMessages = computed<Record<string, { title: string; description: string; variant: 'default' | 'destructive' }>>(() => ({
  revoke: {
    title: t('subscriptions.revokeTitle'),
    description: t('subscriptions.revokeDescription'),
    variant: 'destructive'
  },
  reset: {
    title: t('subscriptions.resetTitle'),
    description: t('subscriptions.resetDescription'),
    variant: 'default'
  },
  enable: {
    title: t('subscriptions.enableTitle'),
    description: t('subscriptions.enableDescription'),
    variant: 'default'
  },
  disable: {
    title: t('subscriptions.disableTitle'),
    description: t('subscriptions.disableDescription'),
    variant: 'destructive'
  },
  delete: {
    title: t('subscriptions.deleteTitle'),
    description: t('subscriptions.deleteDescription'),
    variant: 'destructive'
  }
}))

onMounted(async () => {
  await fetchSubscriptions()
  fetchAdmin()
  startAutoRefresh()
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t('subscriptions.title') }}
        </h2>
        <p class="text-muted-foreground">
          {{ $t('subscriptions.subtitle') }}
        </p>
      </div>
    </div>
  
    <div
      v-if="showPlaceholderNotice"
      class="border border-dashed rounded-xl bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <div class="flex items-start gap-2 text-right">
        <Info class="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div class="space-y-1 text-sm">
          <p class="font-semibold text-foreground">برای نمایش اطلاعات کاربر، کانفیگ آماری بسازید.</p>
          <p class="text-muted-foreground">کانفیگ‌های آماری فقط برای نمایش پیام و داده‌ها به کاربر در صدر لیست کانفیگ‌های ساب است مثل نام‌کاربری، حجم‌مانده یا تاریخ انقضاء....</p>
        </div>
      </div>
      <NuxtLink
        to="/config/placeholders"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        ساخت کانفیگ آماری
      </NuxtLink>
    </div>

    <div class="rounded-xl border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-start gap-2 text-right">
        <Info class="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div class="space-y-1 text-sm">
          <p class="font-semibold text-foreground">سوالات متداول کاربران</p>
          <p class="text-muted-foreground">پاسخ پرسش‌های پرتکرار درباره مدیریت و نمایش اطلاعات اشتراک را ببینید.</p>
        </div>
      </div>
      <NuxtLink
        to="/faq?category=اشتراک‌ها"
        class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
      >
        مشاهده سوالات متداول
      </NuxtLink>
    </div>



    <DataTable 
      :data="subscriptions" 
      :columns="columns"
      :can-create="canCreate"
      :status-filters="statusFilters"
      :order-by="orderBy"
      :search-query="searchQuery"
      :total-count="totalCount"
      :current-page="currentPage"
      :page-size="pageSize"
      :loading="isLoading"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      :selection-reset-key="selectionResetKey"
      @row-click="handleRowClick"
      @create="handleCreate"
      @update-status-filters="handleUpdateStatusFilters"
      @update-order-by="handleUpdateOrderBy"
      @update-search="handleUpdateSearch"
      @page-change="handlePageChange"
      @refresh-now="handleRefreshNow"
      @select-refresh-interval="handleSelectRefreshInterval"
      @bulk-action="handleBulkActionRequest"
    />

    <SubscriptionDetailsDialog
      :subscription="selectedSubscription"
      @close="handleCloseDetails"
      @refresh="handleRefresh"
      @updated="handleUpdated"
    />

    <CreateSubscriptionDialog
      v-model:open="showCreateDialog"
      :initial-values="createDialogInitialValues"
      @created="handleCreated"
    />

    <!-- QR Code Dialog -->
    <QrCodeDialog
      :subscription="qrCodeSubscription"
      v-model:open="showQrCodeDialog"
    />

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="showConfirmDialog">
      <AlertDialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
        <AlertDialogHeader class="items-start text-right space-y-1.5">
          <AlertDialogTitle>{{ confirmMessages[confirmAction.type]?.title }}</AlertDialogTitle>
          <AlertDialogDescription class="text-right">
            {{ confirmMessages[confirmAction.type]?.description }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="gap-2">
          <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction 
            @click="handleConfirmAction"
            :class="confirmMessages[confirmAction.type]?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
          >
            {{ $t('common.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Bulk Confirmation Dialog -->
    <AlertDialog v-model:open="showBulkConfirmDialog">
      <AlertDialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
        <AlertDialogHeader class="items-start text-right space-y-1.5">
          <AlertDialogTitle>{{ confirmMessages[pendingBulkActionType]?.title }}</AlertDialogTitle>
          <AlertDialogDescription class="text-right">
            {{ confirmMessages[pendingBulkActionType]?.description }}
            <span class="mt-2 block font-medium">{{ pendingBulkActionCount }} {{ $t('subscriptions.selected') }}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="gap-2">
          <AlertDialogCancel @click="handleCancelBulkAction">{{ $t('common.cancel') }}</AlertDialogCancel>
          <AlertDialogAction 
            @click="handleConfirmBulkAction"
            :class="confirmMessages[pendingBulkActionType]?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''"
          >
            {{ $t('common.confirm') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
