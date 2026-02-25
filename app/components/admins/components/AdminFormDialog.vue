<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { AdminCreate, AdminResponse, AdminUpdate } from '~/types/api'
import { formatBytes } from '~/lib/utils'
import { Icon } from '#components'
import { useI18n } from '#imports'

const props = defineProps<{
  open: boolean
  admin?: AdminResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const api = useApi()
const { services, fetchServices } = useAdmin()
const isLoading = ref(false)
const { t } = useI18n()

const form = ref({
  username: '',
  password: '',
  role: 'seller' as 'owner' | 'seller' | 'reseller',
  service_ids: [] as number[],
  create_access: false,
  update_access: false,
  remove_access: false,
  count_limit: 0,
  usage_limit: 0,
})

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const isEditMode = computed(() => !!props.admin)

watch(() => props.admin, (admin) => {
  if (admin) {
    form.value = {
      username: admin.username,
      password: '', // Don't fill password on edit
      role: admin.role,
      service_ids: admin.service_ids || [],
      create_access: admin.create_access || false,
      update_access: admin.update_access || false,
      remove_access: admin.remove_access || false,
      count_limit: admin.count_limit || 0,
      usage_limit: admin.usage_limit ? Math.round(admin.usage_limit / (1024 ** 3)) : 0,
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    username: '',
    password: '',
    role: 'seller',
    service_ids: [],
    create_access: true,
    update_access: true,
    remove_access: false,
    count_limit: 0,
    usage_limit: 0,
  }
}

function generateUsername() {
  const random = Math.random().toString(36).substring(2, 8)
  form.value.username = random
}

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = password
}

async function handleSubmit() {
  if (!form.value.username) {
    toast.error(t('admins.usernameRequired'))
    return
  }
  
  if (!isEditMode.value && !form.value.password) {
    toast.error(t('admins.passwordRequired'))
    return
  }

  isLoading.value = true
  try {
    const usageLimitBytes = form.value.usage_limit > 0 ? form.value.usage_limit * (1024 ** 3) : null

    if (isEditMode.value && props.admin) {
      // Update existing admin
      const updateData: AdminUpdate = {
        password: form.value.password || undefined,
        create_access: form.value.create_access,
        update_access: form.value.update_access,
        remove_access: form.value.remove_access,
        count_limit: form.value.count_limit ?? null,
        usage_limit: usageLimitBytes,
        service_ids: form.value.service_ids,
      }
      
      await api.admins.update(props.admin.username, updateData)
      toast.success(t('admins.updateSuccess'))
      emit('updated')
    } else {
      // Create new admin
      const createData: AdminCreate = {
        username: form.value.username,
        password: form.value.password,
        role: form.value.role,
        service_ids: form.value.service_ids,
        create_access: form.value.create_access,
        update_access: form.value.update_access,
        remove_access: form.value.remove_access,
        count_limit: form.value.count_limit ?? null,
        usage_limit: usageLimitBytes,
      }
      
      await api.admins.create(createData)
      toast.success(t('admins.createSuccess'))
      emit('created')
    }
    
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || t('admins.saveFailed'))
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchServices()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-md sm:w-auto sm:max-w-lg max-h-[80vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>{{ isEditMode ? t('admins.editAdmin') : t('admins.createAdmin') }}</DialogTitle>
        <DialogDescription>
          {{ isEditMode ? t('admins.editAdminDescription') : t('admins.createAdminDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="username">{{ t('common.username') }} *</Label>
          <div class="flex gap-2">
            <Input
              id="username"
              v-model="form.username"
              :placeholder="t('admins.usernamePlaceholder')"
              :disabled="isLoading || isEditMode"
              autocomplete="off"
              class="flex-1 text-right"
              dir="rtl"
            />
            <Button
              v-if="!isEditMode"
              type="button"
              variant="outline"
              class="h-10 gap-2 shrink-0 px-4"
              :title="t('admins.generateUsername')"
              @click="generateUsername"
              :disabled="isLoading"
            >
              <Icon name="i-lucide-wand-2" class="h-4 w-4" />
              {{ t('admins.random') }}
            </Button>
          </div>
        </div>

        <div v-if="!isEditMode" class="space-y-2">
          <Label for="role">{{ t('admins.role') }} *</Label>
          <Select
            v-model="form.role"
            :disabled="isLoading"
          >
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="$t('admins.selectRole')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seller">{{ $t('admins.seller') }}</SelectItem>
              <SelectItem value="reseller">{{ $t('admins.reseller') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="password">{{ isEditMode ? t('admins.passwordKeep') : `${t('common.password')} *` }}</Label>
          <div class="flex gap-2">
            <Input
              id="password"
              v-model="form.password"
              type="text"
              :placeholder="t('admins.passwordPlaceholder')"
              :disabled="isLoading"
              autocomplete="new-password"
              class="flex-1 text-right"
              dir="rtl"
            />
            <Button
              type="button"
              variant="outline"
              class="h-10 gap-2 shrink-0 px-4"
              :title="t('admins.generatePassword')"
              @click="generatePassword"
              :disabled="isLoading"
            >
              <Icon name="i-lucide-key" class="h-4 w-4" />
              {{ t('admins.random') }}
            </Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t('admins.services') }}</Label>
          <div class="space-y-2">
            <div 
              v-for="service in services" 
              :key="service.id" 
              class="flex items-center justify-between border rounded-md p-3 cursor-pointer transition-all hover:bg-muted/50"
              :class="{ 'bg-primary/10 border-primary': form.service_ids.includes(service.id) }"
              @click="() => {
                if (form.service_ids.includes(service.id)) {
                  form.service_ids = form.service_ids.filter(id => id !== service.id)
                } else {
                  form.service_ids.push(service.id)
                }
              }"
            >
              <!-- Service info -->
              <span class="text-sm font-medium truncate flex-1 min-w-0 ml-4">{{ service.remark }}</span>
              
              <!-- Stats -->
              <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <div class="flex items-center gap-1.5 w-14" :title="t('admins.nodes')">
                  <Icon name="i-lucide-server" class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ service.node_ids.length }}</span>
                </div>
                <div class="flex items-center gap-1.5 w-14" :title="t('admins.users')">
                  <Icon name="i-lucide-users" class="w-3.5 h-3.5 shrink-0" />
                  <span>{{ service.users_count ?? 0 }}</span>
                </div>
              </div>
            </div>
            <div v-if="services.length === 0" class="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
              {{ t('admins.noServices') }}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="count_limit">{{ t('admins.countLimit') }}</Label>
            <Input
              id="count_limit"
              v-model.number="form.count_limit"
              type="number"
              min="0"
              :placeholder="t('admins.unlimitedPlaceholder')"
              :disabled="isLoading"
              class="text-right"
              dir="rtl"
            />
            <div class="text-xs text-muted-foreground text-right">
              {{ t('admins.maxUsersHint') }}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="usage_limit">{{ t('admins.usageLimitGb') }}</Label>
            <Input
              id="usage_limit"
              v-model.number="form.usage_limit"
              type="number"
              min="0"
              :placeholder="t('admins.unlimitedPlaceholder')"
              :disabled="isLoading"
              class="text-right"
              dir="rtl"
            />
            <div class="text-xs text-muted-foreground text-right">
              {{ form.usage_limit > 0 ? formatBytes(form.usage_limit * (1024 ** 3)) : t('dashboard.unlimited') }}
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label>{{ t('admins.permissions') }}</Label>
          <div class="grid grid-cols-3 gap-2">
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.create_access }"
              @click="form.create_access = !form.create_access"
            >
              <Icon name="i-lucide-plus-circle" class="h-4 w-4" :class="form.create_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionCreate') }}</span>
            </div>
            
            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.update_access }"
              @click="form.update_access = !form.update_access"
            >
              <Icon name="i-lucide-edit" class="h-4 w-4" :class="form.update_access ? 'text-primary' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionUpdate') }}</span>
            </div>

            <div 
              class="flex items-center justify-center gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 h-12"
              :class="{ 'bg-primary/10 border-primary': form.remove_access }"
              @click="form.remove_access = !form.remove_access"
            >
              <Icon name="i-lucide-trash-2" class="h-4 w-4" :class="form.remove_access ? 'text-destructive' : 'text-muted-foreground'" />
              <span class="text-sm font-medium">{{ t('admins.permissionRemove') }}</span>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          {{ t('common.cancel') }}
        </Button>
        <Button 
          @click="handleSubmit"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="i-radix-icons-update" class="ml-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? t('common.update') : t('admins.createAdmin') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
