<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { ServiceResponse } from '~/types/api'

const props = defineProps<{
  modelValue: number[]
  disabled?: boolean
  selectAllByDefault?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const api = useApi()
const { fetchServices } = useAdmin()
const isLoading = ref(false)
const services = ref<ServiceResponse[]>([])
const isInitialized = ref(false)

// Computed for v-model support
const selectedServiceIds = computed({
  get: () => props.modelValue,
  set: (value: number[]) => emit('update:modelValue', value)
})

// Load services from API
const loadServices = async () => {
  isLoading.value = true
  try {
    services.value = await fetchServices()
    // Select all by default if prop is true and not yet initialized
    if (props.selectAllByDefault && !isInitialized.value && props.modelValue.length === 0) {
      selectedServiceIds.value = services.value.map(s => s.id)
    }
    isInitialized.value = true
  } catch (error: any) {
    console.error('Failed to load services:', error)
    toast.error('Failed to load services')
  } finally {
    isLoading.value = false
  }
}

// Toggle service selection
const toggleService = (serviceId: number) => {
  if (props.disabled) return
  
  const currentIds = [...selectedServiceIds.value]
  const index = currentIds.indexOf(serviceId)
  
  if (index > -1) {
    currentIds.splice(index, 1)
  } else {
    currentIds.push(serviceId)
  }
  
  selectedServiceIds.value = currentIds
}

// Check if service is selected
const isServiceSelected = (serviceId: number) => {
  return selectedServiceIds.value.includes(serviceId)
}

onMounted(() => {
  loadServices()
})
</script>

<template>
  <div class="space-y-2 mt-2">
    <div class="flex items-center justify-between">
      <Label>سرویس‌ها</Label>
      <Badge variant="secondary">
        {{ selectedServiceIds.length }}/{{ services.length }}
      </Badge>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-4 border rounded-md border-dashed">
      <Icon name="i-radix-icons-update" class="mr-1.5 h-4 w-4 animate-spin" />
      <span class="text-sm text-muted-foreground">در حال بارگذاری سرویس‌ها...</span>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="services.length === 0" class="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
      <p>سرویسی موجود نیست</p>
    </div>
    
    <!-- Services List -->
    <div v-else class="space-y-2">
      <div
        v-for="service in services"
        :key="service.id"
        @click="toggleService(service.id)"
        class="flex items-center justify-between border rounded-md p-3 cursor-pointer transition-all hover:bg-muted/50"
        :class="[
          isServiceSelected(service.id)
            ? 'bg-primary/10 border-primary'
            : '',
          disabled && 'opacity-50 cursor-not-allowed'
        ]"
      >
        <!-- Service info -->
        <span class="text-sm font-medium truncate flex-1 min-w-0 mr-4">{{ service.remark }}</span>
        
        <!-- Stats -->
        <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <div class="flex items-center gap-2 w-10" title="Nodes">
            <Icon name="i-lucide-server" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ service.node_ids.length }}</span>
          </div>
          <div class="flex items-center gap-2 w-12" title="Users">
            <Icon name="i-lucide-users" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ service.users_count ?? 0 }}</span>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="flex items-center justify-end gap-2 pt-2">
        <Button
          v-if="selectedServiceIds.length > 0 && !disabled"
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          @click.stop="selectedServiceIds = []"
        >
          پاک کردن همه
        </Button>
        <Button
          v-if="selectedServiceIds.length < services.length && !disabled"
          variant="ghost"
          size="sm"
          class="h-7 text-xs"
          @click.stop="selectedServiceIds = services.map(s => s.id)"
        >
          انتخاب همه
        </Button>
      </div>
    </div>
  </div>
</template>
