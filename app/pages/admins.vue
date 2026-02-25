<script setup lang="ts">
import { createColumns } from '@/components/admins/components/columns'
import DataTable from '@/components/admins/components/DataTable.vue'
import AdminFormDialog from '@/components/admins/components/AdminFormDialog.vue'
import AdminDetailsDialog from '@/components/admins/components/AdminDetailsDialog.vue'
import type { AdminResponse } from '~/types/api'
import { smartToast as toast } from '~/lib/smart-toast'

const { t } = useI18n()

definePageMeta({
  middleware: 'auth'
})

const api = useApi()
const { admin, fetchAdmin, isOwner } = useAdmin()

const admins = ref<AdminResponse[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const isLoading = ref(false)
const showFormDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedAdmin = ref<AdminResponse | null>(null)
const searchTerm = ref('')
const statusFilters = ref<Set<string>>(new Set<string>())
const roleFilters = ref<Set<string>>(new Set<string>())
const orderBy = ref<string>('created_at_desc')

const refreshIntervalOptions = [
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
  { label: '120s', value: 120_000 },
]

const { startAutoRefresh, stopAutoRefresh, triggerAutoRefresh, setAutoRefreshInterval, intervalMs } = useAutoRefresh(() => fetchAdmins(true), {
  immediate: false,
})

const selectedRefreshInterval = ref<number>(intervalMs.value)
const refreshMenuLabel = computed(() => {
  return refreshIntervalOptions.find(option => option.value === selectedRefreshInterval.value)?.label ?? '30s'
})

const statusFilterPredicates: Record<string, (admin: AdminResponse) => boolean> = {
  'enabled:true': (admin) => admin.enabled,
  'enabled:false': (admin) => !admin.enabled,
  'reached_count_limit:true': (admin) => Boolean(admin.reached_count_limit),
  'reached_usage_limit:true': (admin) => Boolean(admin.reached_usage_limit),
}

const orderComparators: Record<string, (a: AdminResponse, b: AdminResponse) => number> = {
  username_asc: (a, b) => a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }),
  username_desc: (a, b) => b.username.localeCompare(a.username, undefined, { sensitivity: 'base' }),
  created_at_desc: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  created_at_asc: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  updated_at_desc: (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  updated_at_asc: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
  current_usage_desc: (a, b) => (b.current_usage ?? 0) - (a.current_usage ?? 0),
  current_usage_asc: (a, b) => (a.current_usage ?? 0) - (b.current_usage ?? 0),
  current_count_desc: (a, b) => (b.current_count ?? 0) - (a.current_count ?? 0),
  current_count_asc: (a, b) => (a.current_count ?? 0) - (b.current_count ?? 0),
}

const processedAdmins = computed(() => {
  let result = admins.value.slice()

  if (searchTerm.value) {
    const search = searchTerm.value.toLowerCase()
    result = result.filter(admin => admin.username.toLowerCase().includes(search))
  }

  if (roleFilters.value.size) {
    const roles = new Set(Array.from(roleFilters.value).map(filter => filter.split(':')[1]))
    result = result.filter(admin => roles.has(admin.role))
  }

  if (statusFilters.value.size) {
    const predicates = Array.from(statusFilters.value)
      .map(filter => statusFilterPredicates[filter])
      .filter(Boolean) as Array<(admin: AdminResponse) => boolean>

    result = result.filter(admin => predicates.some(predicate => predicate(admin)))
  }

  const comparator = orderComparators[orderBy.value] || orderComparators.created_at_desc
  result = result.sort(comparator)

  return result
})

const paginatedAdmins = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return processedAdmins.value.slice(start, start + pageSize.value)
})

const filteredTotal = computed(() => processedAdmins.value.length)

watch(filteredTotal, () => {
  const maxPage = Math.max(1, Math.ceil(filteredTotal.value / pageSize.value) || 1)
  if (currentPage.value > maxPage) {
    currentPage.value = maxPage
  }
})

// Redirect if not owner
watch(isOwner, (value) => {
  if (value === false) {
    navigateTo('/')
    toast.error(t('admins.accessDenied'))
  }
}, { immediate: true })

watch(isOwner, (value) => {
  if (value) {
    startAutoRefresh()
  }
  else {
    stopAutoRefresh()
  }
}, { immediate: true })

function handleSelectRefreshInterval(interval: number) {
  selectedRefreshInterval.value = interval
  setAutoRefreshInterval(interval)
}

async function handleRefreshNow() {
  await fetchAdmins(true)
  toast.success(t('admins.dataRefreshed'))
}

// Create columns
const columns = createColumns(t)

async function fetchAdmins(isBackground = false) {
  if (!isOwner.value) return
  
  if (!isBackground) {
    isLoading.value = true
  }
  try {
    const response = await api.admins.getAll()
    admins.value = response
  } catch (error: any) {
    toast.error(error.message || 'دریافت ادمین‌ها ناموفق بود')
  } finally {
    if (!isBackground) {
      isLoading.value = false
    }
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
}

function handleSearchUpdate(value: string) {
  searchTerm.value = value
  currentPage.value = 1
}

function handleStatusFiltersUpdate(values: string[]) {
  statusFilters.value = new Set<string>(values)
  currentPage.value = 1
}

function handleRoleFiltersUpdate(values: string[]) {
  roleFilters.value = new Set<string>(values)
  currentPage.value = 1
}

function handleOrderByUpdate(value?: string) {
  orderBy.value = value ?? 'created_at_desc'
}

function handleRowClick(admin: AdminResponse) {
  selectedAdmin.value = admin
  showDetailsDialog.value = true
}

function handleCreate() {
  selectedAdmin.value = null
  showFormDialog.value = true
}

function handleCloseDetails() {
  selectedAdmin.value = null
  showDetailsDialog.value = false
}

async function handleCreated() {
  await fetchAdmins()
}

async function handleUpdated() {
  await fetchAdmins()
  showFormDialog.value = false
  selectedAdmin.value = null
}

onMounted(() => {
  fetchAdmin()
  if (isOwner.value) {
    fetchAdmins()
  }
})
</script>

<template>
  <div v-if="isOwner" class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t('admins.title') }}
        </h2>
        <p class="text-muted-foreground">
          {{ $t('admins.subtitle') }}
        </p>
      </div>
    </div>

    <DataTable 
      :data="paginatedAdmins" 
      :columns="columns"
      :total-count="filteredTotal"
      :current-page="currentPage"
      :page-size="pageSize"
      :search-term="searchTerm"
      :status-filters="statusFilters"
      :role-filters="roleFilters"
      :order-by="orderBy"
      :loading="isLoading"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @row-click="handleRowClick"
      @create="handleCreate"
      @page-change="handlePageChange"
      @update-search="handleSearchUpdate"
      @update-status-filters="handleStatusFiltersUpdate"
      @update-role-filters="handleRoleFiltersUpdate"
      @update-order-by="handleOrderByUpdate"
      @refresh-now="handleRefreshNow"
      @select-refresh-interval="handleSelectRefreshInterval"
    />

    <AdminDetailsDialog
      :admin="selectedAdmin"
      @close="handleCloseDetails"
      @refresh="fetchAdmins"
    />

    <AdminFormDialog
      v-model:open="showFormDialog"
      :admin="selectedAdmin"
      @created="handleCreated"
      @updated="handleUpdated"
    />
  </div>
</template>
