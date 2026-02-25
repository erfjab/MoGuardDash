<script setup lang="ts">
import { createColumns } from '@/components/nodes/components/columns'
import DataTable from '@/components/nodes/components/DataTable.vue'
import NodeFormDialog from '@/components/nodes/components/NodeFormDialog.vue'
import NodeDetailsDialog from '@/components/nodes/components/NodeDetailsDialog.vue'
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
import type { NodeResponse } from '~/types/api'
import { smartToast as toast } from '~/lib/smart-toast'

definePageMeta({
  middleware: 'auth'
})

const api = useApi()
const { admin, fetchAdmin, isOwner } = useAdmin()
const { t } = useI18n()

const nodes = ref<NodeResponse[]>([])
const isLoading = ref(false)
const showFormDialog = ref(false)
const showDetailsDialog = ref(false)
const showConfirmDialog = ref(false)
const selectedNode = ref<NodeResponse | null>(null)
const confirmAction = ref<{ type: string; node: NodeResponse | null }>({ type: '', node: null })
const categoryFilters = ref<Set<string>>(new Set<string>())
const orderBy = ref<string>('created_at_desc')

const refreshIntervalOptions = [
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
  { label: '120s', value: 120_000 },
]

const { startAutoRefresh, stopAutoRefresh, triggerAutoRefresh, setAutoRefreshInterval, intervalMs } = useAutoRefresh(() => fetchNodes(true), {
  immediate: false,
})

const selectedRefreshInterval = ref<number>(intervalMs.value)
const refreshMenuLabel = computed(() => {
  return refreshIntervalOptions.find(option => option.value === selectedRefreshInterval.value)?.label ?? '30s'
})

// Redirect if not owner
watch(isOwner, (value) => {
  if (value === false) {
    navigateTo('/')
    toast.error(t('nodes.accessDenied'))
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
  await fetchNodes(true)
  toast.success(t('services.dataRefreshed'))
}

// Create columns with action handler
const columns = createColumns((action: string, node: NodeResponse) => {
  confirmAction.value = { type: action, node }
  showConfirmDialog.value = true
})

const orderComparators: Record<string, (a: NodeResponse, b: NodeResponse) => number> = {
  remark_asc: (a, b) => a.remark.localeCompare(b.remark, undefined, { sensitivity: 'base' }),
  remark_desc: (a, b) => b.remark.localeCompare(a.remark, undefined, { sensitivity: 'base' }),
  created_at_desc: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  created_at_asc: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  updated_at_desc: (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  updated_at_asc: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
  current_usage_desc: (a, b) => (b.current_usage ?? 0) - (a.current_usage ?? 0),
  current_usage_asc: (a, b) => (a.current_usage ?? 0) - (b.current_usage ?? 0),
  priority_desc: (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  priority_asc: (a, b) => (a.priority ?? 0) - (b.priority ?? 0),
}

// Filter and sort nodes
const processedNodes = computed(() => {
  let result = nodes.value.slice()

  // Apply category filter
  if (categoryFilters.value.size) {
    const categories = new Set(Array.from(categoryFilters.value).map(filter => filter.split(':')[1]))
    result = result.filter(node => categories.has(node.category))
  }

  // Apply sorting
  const comparator = orderComparators[orderBy.value] || orderComparators.created_at_desc
  result = result.sort(comparator)

  return result
})

function handleCategoryFiltersUpdate(values: string[]) {
  categoryFilters.value = new Set<string>(values)
}

function handleOrderByUpdate(value?: string) {
  orderBy.value = value ?? 'created_at_desc'
}

async function fetchNodes(isBackground = false) {
  if (!isOwner.value) return
  
  if (!isBackground) {
    isLoading.value = true
  }
  try {
    const response = await api.nodes.getAll()
    nodes.value = response
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch nodes')
  } finally {
    if (!isBackground) {
      isLoading.value = false
    }
  }
}

function handleRowClick(node: NodeResponse) {
  selectedNode.value = node
  showDetailsDialog.value = true
}

function handleCreate() {
  selectedNode.value = null
  showFormDialog.value = true
}

function handleCloseDetails() {
  selectedNode.value = null
  showDetailsDialog.value = false
}

async function handleCreated() {
  await fetchNodes()
}

async function handleUpdated() {
  await fetchNodes()
  showFormDialog.value = false
  selectedNode.value = null
}

async function handleConfirmAction() {
  if (!confirmAction.value.node) return
  
  const { type, node } = confirmAction.value
  isLoading.value = true
  
  try {
    switch (type) {
      case 'enable':
        await api.nodes.enable(node.id)
        toast.success('نود فعال شد')
        break
      case 'disable':
        await api.nodes.disable(node.id)
        toast.success('نود غیرفعال شد')
        break
      case 'delete':
        await api.nodes.delete(node.id)
        toast.success('نود با موفقیت حذف شد')
        break
    }
    
    await fetchNodes()
  } catch (error: any) {
    toast.error(error.message || 'عملیات ناموفق بود')
  } finally {
    isLoading.value = false
    showConfirmDialog.value = false
    confirmAction.value = { type: '', node: null }
  }
}

const confirmMessages = computed(() => ({
  enable: {
    title: t('common.enabled'),
    description: t('nodes.deleteDescription'),
    variant: 'default' as const
  },
  disable: {
    title: t('common.disabled'),
    description: t('nodes.deleteDescription'),
    variant: 'destructive' as const
  },
  delete: {
    title: t('nodes.deleteConfirm'),
    description: t('nodes.deleteDescription'),
    variant: 'destructive' as const
  },
  reconnect: {
    title: t('nodes.reconnect'),
    description: t('nodes.deleteDescription'),
    variant: 'default' as const
  }
}))

onMounted(() => {
  fetchAdmin()
  if (isOwner.value) {
    fetchNodes()
  }
})
</script>

<template>
  <div v-if="isOwner" class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t('nodes.title') }}
        </h2>
        <p class="text-muted-foreground">
          {{ $t('nodes.subtitle') }}
        </p>
      </div>
    </div>

    <DataTable 
      :data="processedNodes" 
      :columns="columns"
      :loading="isLoading"
      :category-filters="categoryFilters"
      :order-by="orderBy"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @row-click="handleRowClick"
      @create="handleCreate"
      @refresh-now="handleRefreshNow"
      @select-refresh-interval="handleSelectRefreshInterval"
      @update-category-filters="handleCategoryFiltersUpdate"
      @update-order-by="handleOrderByUpdate"
    />

    <NodeDetailsDialog
      :node="selectedNode"
      @close="handleCloseDetails"
      @refresh="fetchNodes"
    />

    <NodeFormDialog
      v-model:open="showFormDialog"
      :node="selectedNode"
      @created="handleCreated"
      @updated="handleUpdated"
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
  </div>
</template>
