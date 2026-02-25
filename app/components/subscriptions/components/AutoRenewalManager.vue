<script setup lang="ts">
import type { AutoRenewalCreate, AutoRenewalUpdate, AutoRenewalResponse } from '~/types/api'

interface AutoRenewalItem {
  id?: number
  limit_expire: number
  limit_expire_days: number
  on_first_connect: boolean
  limit_usage: number
  limit_usage_gb: number
  reset_usage: boolean
  isNew?: boolean
  isEditing?: boolean
}

const props = defineProps<{
  modelValue: AutoRenewalCreate[] | AutoRenewalUpdate[]
  existingRenewals?: AutoRenewalResponse[]
  disabled?: boolean
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: AutoRenewalCreate[] | AutoRenewalUpdate[]): void
}>()

const renewals = ref<AutoRenewalItem[]>([])
const showAddForm = ref(false)
const isExpanded = ref(false)
const isInitialized = ref(false)

// Form for new/editing renewal
const form = ref<AutoRenewalItem>({
  limit_expire: 0,
  limit_expire_days: 30,
  on_first_connect: false,
  limit_usage: 0,
  limit_usage_gb: 10,
  reset_usage: false,
  isNew: true,
})

const editingIndex = ref<number | null>(null)

// Initialize renewals from existing data (for edit mode)
watch(() => props.existingRenewals, (existing, oldExisting) => {
  // Only initialize once or when existingRenewals actually changes from parent
  if (props.mode === 'edit') {
    // Check if this is a real change from parent (not our own emit)
    const existingIds = existing?.map(r => r.id).sort().join(',') ?? ''
    const oldIds = oldExisting?.map(r => r.id).sort().join(',') ?? ''
    
    // Only reinitialize if the IDs changed (meaning different subscription)
    if (!isInitialized.value || existingIds !== oldIds) {
      if (existing && existing.length > 0) {
        renewals.value = existing.map(r => {
          // Convert limit_expire (seconds) to days
          let days = 0
          let onFirstConnect = false
          
          if (r.limit_expire !== null) {
            if (r.limit_expire < 0) {
              // Negative = on first connect, value is negative seconds
              onFirstConnect = true
              days = Math.abs(r.limit_expire) / 86400
            } else if (r.limit_expire > 0) {
              // Positive = seconds
              days = r.limit_expire / 86400
            }
          }
          
          // Convert limit_usage (bytes) to GB
          const usageGb = (r.limit_usage !== null && r.limit_usage > 0) 
            ? r.limit_usage / (1024 * 1024 * 1024) 
            : 0

          return {
            id: r.id,
            limit_expire: r.limit_expire ?? 0,
            limit_expire_days: days,
            on_first_connect: onFirstConnect,
            limit_usage: r.limit_usage ?? 0,
            limit_usage_gb: usageGb,
            reset_usage: r.reset_usage,
            isNew: false,
            isEditing: false,
          }
        })
      } else {
        // No existing renewals, reset to empty
        renewals.value = []
      }
      // Reset form state when subscription changes
      showAddForm.value = false
      editingIndex.value = null
      isInitialized.value = true
    }
  }
}, { immediate: true })

// Initialize from modelValue for create mode
watch(() => props.modelValue, (value) => {
  if (props.mode === 'create' && value && value.length > 0 && renewals.value.length === 0) {
    renewals.value = (value as AutoRenewalCreate[]).map(r => {
      let days = 0
      let onFirstConnect = false
      
      if (r.limit_expire < 0) {
        onFirstConnect = true
        days = Math.abs(r.limit_expire) / 86400
      } else if (r.limit_expire > 0) {
        days = r.limit_expire / 86400
      }
      
      const usageGb = r.limit_usage > 0 ? r.limit_usage / (1024 * 1024 * 1024) : 0

      return {
        limit_expire: r.limit_expire,
        limit_expire_days: days,
        on_first_connect: onFirstConnect,
        limit_usage: r.limit_usage,
        limit_usage_gb: usageGb,
        reset_usage: r.reset_usage ?? false,
        isNew: true,
        isEditing: false,
      }
    })
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    limit_expire: 0,
    limit_expire_days: 30,
    on_first_connect: false,
    limit_usage: 0,
    limit_usage_gb: 10,
    reset_usage: false,
    isNew: true,
  }
  editingIndex.value = null
}

function openAddForm() {
  resetForm()
  showAddForm.value = true
  isExpanded.value = true
}

function cancelAdd() {
  showAddForm.value = false
  resetForm()
}

function startEdit(index: number) {
  const item = renewals.value[index]
  if (item) {
    form.value = {
      id: item.id,
      limit_expire: item.limit_expire,
      limit_expire_days: item.limit_expire_days,
      on_first_connect: item.on_first_connect,
      limit_usage: item.limit_usage,
      limit_usage_gb: item.limit_usage_gb,
      reset_usage: item.reset_usage,
      isNew: item.isNew,
      isEditing: true,
    }
    editingIndex.value = index
    showAddForm.value = true
  }
}

function saveRenewal() {
  // Calculate limit_expire in seconds
  let limitExpire = 0
  if (form.value.limit_expire_days > 0) {
    const seconds = form.value.limit_expire_days * 86400
    limitExpire = form.value.on_first_connect ? -seconds : seconds
  }
  // If days is 0, limitExpire stays 0 (unlimited)
  
  // Calculate limit_usage in bytes (0 means unlimited)
  const limitUsage = Math.floor((form.value.limit_usage_gb || 0) * 1024 * 1024 * 1024)
  
  const item: AutoRenewalItem = {
    id: form.value.id,
    limit_expire: limitExpire,
    limit_expire_days: form.value.limit_expire_days || 0,
    on_first_connect: form.value.on_first_connect,
    limit_usage: limitUsage,
    limit_usage_gb: form.value.limit_usage_gb || 0,
    reset_usage: form.value.reset_usage,
    isNew: editingIndex.value === null,
    isEditing: false,
  }
  
  // If editing existing item, keep the id
  if (editingIndex.value !== null) {
    const existingItem = renewals.value[editingIndex.value]
    if (existingItem && existingItem.id !== undefined) {
      item.id = existingItem.id
      item.isNew = false
    }
    renewals.value[editingIndex.value] = item
  } else {
    renewals.value.push(item)
  }
  
  showAddForm.value = false
  resetForm()
  emitUpdate()
}

function removeRenewal(index: number) {
  renewals.value.splice(index, 1)
  emitUpdate()
}

function emitUpdate() {
  if (props.mode === 'create') {
    const createData: AutoRenewalCreate[] = renewals.value.map(r => ({
      limit_expire: r.limit_expire,
      limit_usage: r.limit_usage,
      reset_usage: r.reset_usage,
    }))
    emit('update:modelValue', createData)
  } else {
    // For edit mode, we need to handle both existing (with id) and new items
    const updateData: AutoRenewalUpdate[] = renewals.value.map(r => {
      if (r.id !== undefined) {
        // Existing item - include id for update
        return {
          id: r.id,
          limit_expire: r.limit_expire,
          limit_usage: r.limit_usage,
          reset_usage: r.reset_usage,
        }
      } else {
        // New item - use id: 0 to indicate it's new (backend should handle this)
        return {
          id: 0,
          limit_expire: r.limit_expire,
          limit_usage: r.limit_usage,
          reset_usage: r.reset_usage,
        }
      }
    })
    emit('update:modelValue', updateData)
  }
}

function formatExpire(item: AutoRenewalItem): string {
  if (item.limit_expire_days === 0) return 'نامحدود'
  const days = Math.round(item.limit_expire_days)
  const suffix = item.on_first_connect ? ' (پس از اولین اتصال)' : ''
  return `${days} روز${suffix}`
}

function formatUsage(item: AutoRenewalItem): string {
  if (item.limit_usage_gb === 0) {
    return item.reset_usage ? 'نامحدود (با ریست مصرف)' : 'نامحدود'
  }
  const gb = `${item.limit_usage_gb.toFixed(2)} گیگ`
  return item.reset_usage ? `${gb} (با ریست مصرف)` : gb
}
</script>

<template>
  <Collapsible v-model:open="isExpanded" class="w-full border rounded-lg">
    <!-- Collapsible Header -->
    <CollapsibleTrigger class="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors rounded-lg">
      <div class="flex items-center gap-2">
        <Icon 
          name="i-lucide-chevron-right" 
          class="h-4 w-4 transition-transform duration-200"
          :class="{ 'rotate-90': isExpanded }"
        />
        <span class="font-medium text-sm">تمدید اتوماتیک</span>
        <Badge v-if="renewals.length > 0" variant="secondary" class="ml-1">
          {{ renewals.length }}
        </Badge>
      </div>
    </CollapsibleTrigger>

    <CollapsibleContent>
      <div class="px-4 py-3 space-y-3 overflow-hidden">
        <!-- Description -->
        <p class="text-xs text-muted-foreground">
          تمدید اتوماتیک اشتراک را به صورت خودکار زمانی که منقضی می‌شود یا به محدودیت می‌رسد، تمدید می‌کند.
        </p>

        <!-- Existing Renewals List -->
        <div v-if="renewals.length > 0" class="space-y-2">
          <div
            v-for="(item, index) in renewals"
            :key="index"
            class="group flex items-center gap-3 p-2.5 border rounded-md bg-background hover:bg-muted/30 transition-colors"
          >
              <!-- Index Badge -->
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                {{ index + 1 }}
              </div>
            
              <!-- Info Grid -->
              <div class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-3">
                <div class="flex items-center gap-1.5">
                  <Icon name="i-radix-icons-clock" class="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span class="text-sm truncate" :title="formatExpire(item)">{{ formatExpire(item) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <Icon name="i-radix-icons-bar-chart" class="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span class="text-sm truncate">{{ formatUsage(item) }}</span>
                </div>
              </div>
            
            <!-- Actions - always visible on mobile -->
            <div class="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-7 w-7"
                @click="startEdit(index)"
                :disabled="disabled"
              >
                <Icon name="i-radix-icons-pencil-1" class="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-7 w-7 text-destructive hover:text-destructive"
                @click="removeRenewal(index)"
                :disabled="disabled"
              >
                <Icon name="i-radix-icons-trash" class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!showAddForm" class="text-center py-4 text-sm text-muted-foreground">
          <p>هیچ تمدید اتوماتیکی تنظیم نشده است</p>
        </div>

        <!-- Add/Edit Form -->
        <div v-if="showAddForm" class="border rounded-md p-3 space-y-3 bg-muted/20">
          <div class="flex items-center gap-2">
            <Icon :name="editingIndex !== null ? 'i-radix-icons-pencil-1' : 'i-radix-icons-plus'" class="h-4 w-4" />
            <span class="text-sm font-medium">{{ editingIndex !== null ? `ویرایش تمدید #${editingIndex + 1}` : 'تمدید جدید' }}</span>
          </div>

          <!-- Time Limit -->
          <div class="space-y-1.5">
            <Label for="renewal_limit_expire_new" class="text-xs">محدودیت زمان (روز)</Label>
            <div class="flex gap-2 items-center">
              <Input
                id="renewal_limit_expire_new"
                v-model.number="form.limit_expire_days"
                type="number"
                min="0"
                :disabled="disabled"
                class="flex-1 h-9"
                placeholder="۰ = نامحدود"
              />
              <Button
                type="button"
                :variant="form.on_first_connect ? 'default' : 'outline'"
                size="sm"
                class="h-9 text-xs"
                @click="form.on_first_connect = !form.on_first_connect"
                :disabled="disabled || form.limit_expire_days === 0"
              >
                <Icon name="i-radix-icons-timer" class="mr-1 h-3 w-3" />
                پس از اولین اتصال
              </Button>
            </div>
          </div>

          <!-- Data Limit -->
          <div class="space-y-1.5">
            <Label for="renewal_limit_usage_new" class="text-xs">محدودیت حجم (گیگابایت)</Label>
            <div class="flex gap-2 items-center">
              <Input
                id="renewal_limit_usage_new"
                v-model.number="form.limit_usage_gb"
                type="number"
                step="0.1"
                min="0"
                :disabled="disabled"
                class="flex-1 h-9"
                placeholder="۰ = نامحدود"
              />
              <Button
                type="button"
                :variant="form.reset_usage ? 'default' : 'outline'"
                size="sm"
                class="h-9 text-xs"
                @click="form.reset_usage = !form.reset_usage"
                :disabled="disabled"
              >
                <Icon name="i-radix-icons-reset" class="mr-1 h-3 w-3" />
                ریست مصرف
              </Button>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="h-8"
              @click="cancelAdd"
              :disabled="disabled"
            >
              لغو
            </Button>
            <Button
              type="button"
              size="sm"
              class="h-8"
              @click="saveRenewal"
              :disabled="disabled"
            >
              {{ editingIndex !== null ? 'به‌روزرسانی' : 'افزودن' }}
            </Button>
          </div>
        </div>

        <!-- Add Button -->
        <Button
          v-if="!showAddForm"
          type="button"
          variant="outline"
          size="sm"
          class="w-full"
          @click="openAddForm"
          :disabled="disabled"
        >
          <Icon name="i-radix-icons-plus" class="mr-1.5 h-3.5 w-3.5" />
          افزودن تمدید
        </Button>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
