<script setup lang="ts">
import { createColumns } from '@/components/services/components/columns'
import DataTable from '@/components/services/components/DataTable.vue'
import ServiceFormDialog from '@/components/services/components/ServiceFormDialog.vue'
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
import type { ServiceResponse } from '~/types/api'
import { smartToast as toast } from '~/lib/smart-toast'

definePageMeta({
  middleware: 'auth',
  layout: 'default',
})

const api = useApi()
const { services: cachedServices, fetchServices: fetchCachedServices, fetchNodes, isOwner } = useAdmin()

const services = ref<ServiceResponse[]>([])
const isLoading = ref(false)
const showConfirmDialog = ref(false)
const showFormDialog = ref(false)
const selectedService = ref<ServiceResponse | null>(null)
const confirmAction = ref<{ type: string; service: ServiceResponse | null }>({ type: '', service: null })

const refreshIntervalOptions = [
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
  { label: '120s', value: 120_000 },
]

const { startAutoRefresh, triggerAutoRefresh, setAutoRefreshInterval, intervalMs } = useAutoRefresh(handleRefresh, {
  immediate: false,
})

const selectedRefreshInterval = ref<number>(intervalMs.value)
const refreshMenuLabel = computed(() => {
  return refreshIntervalOptions.find(option => option.value === selectedRefreshInterval.value)?.label ?? '30s'
})

function handleSelectRefreshInterval(interval: number) {
  selectedRefreshInterval.value = interval
  setAutoRefreshInterval(interval)
}

async function handleRefreshNow() {
  await triggerAutoRefresh()
  toast.success($t('services.dataRefreshed'))
}

function handleAction(action: string, service: ServiceResponse) {
  if (action === 'edit') {
    selectedService.value = service
    showFormDialog.value = true
  } else {
    confirmAction.value = { type: action, service }
    showConfirmDialog.value = true
  }
}

// Create columns with action handler
const columns = computed(() => createColumns(handleAction, isOwner.value))

async function fetchServices() {
  isLoading.value = true
  try {
    const response = await fetchCachedServices()
    services.value = response
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch services')
  } finally {
    isLoading.value = false
  }
}

async function handleRefresh() {
  isLoading.value = true
  try {
    const response = await fetchCachedServices(true)
    services.value = response
  } catch (error: any) {
    toast.error(error.message || 'Failed to fetch services')
  } finally {
    isLoading.value = false
  }
}

function handleCreate() {
  selectedService.value = null
  showFormDialog.value = true
}

async function handleCreated() {
  await handleRefresh()
}

async function handleUpdated() {
  await handleRefresh()
  showFormDialog.value = false
  selectedService.value = null
}

async function handleConfirmAction() {
  if (!confirmAction.value.service) return
  
  const { type, service } = confirmAction.value
  isLoading.value = true
  
  try {
    switch (type) {
      case 'add_to_all':
        await api.subscriptions.bulkAddService(service.id)
        toast.success('Service added to all subscriptions successfully')
        break
      case 'remove_from_all':
        await api.subscriptions.bulkRemoveService(service.id)
        toast.success('Service removed from all subscriptions successfully')
        break
      case 'delete':
        await api.services.delete(service.id)
        toast.success('Service deleted successfully')
        break
    }
    await handleRefresh()
  } catch (error: any) {
    toast.error(error.message || t('services.actionFailed'))
  } finally {
    isLoading.value = false
    showConfirmDialog.value = false
    confirmAction.value = { type: '', service: null }
  }
}

const { t } = useI18n()

const confirmMessages = computed(() => ({
  add_to_all: {
    title: t('services.addToAll'),
    description: t('services.addToAllDescription'),
    variant: 'default' as const
  },
  remove_from_all: {
    title: t('services.removeFromAll'),
    description: t('services.removeFromAllDescription'),
    variant: 'destructive' as const
  },
  delete: {
    title: t('services.deleteConfirm'),
    description: t('services.deleteDescription'),
    variant: 'destructive' as const
  }
}))

onMounted(() => {
  fetchServices()
  if (isOwner.value) {
    fetchNodes()
  }
  startAutoRefresh()
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          {{ $t('services.title') }}
        </h2>
        <p class="text-muted-foreground">
          {{ $t('services.subtitle') }}
        </p>
      </div>
    </div>

    <DataTable 
      :data="services" 
      :columns="columns"
      :total-count="services.length"
      :is-owner="isOwner"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @create="handleCreate"
      @row-click="(service) => isOwner && handleAction('edit', service)"
      @refresh-now="handleRefreshNow"
      @select-refresh-interval="handleSelectRefreshInterval"
    />

    <ServiceFormDialog
      v-model:open="showFormDialog"
      :service="selectedService"
      @created="handleCreated"
      @updated="handleUpdated"
      @deleted="handleUpdated"
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
