<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { NodeCreate, NodeResponse, NodeUpdate } from '~/types/api'
import PasswordInput from '@/components/PasswordInput.vue'

const props = defineProps<{
  open: boolean
  node?: NodeResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
}>()

const api = useApi()
const isLoading = ref(false)

const form = ref({
  remark: '',
  category: 'marzban' as 'marzban' | 'marzneshin' | 'rustneshin',
  username: '',
  password: '',
  host: '',
  offset_link: 0,
  batch_size: 1,
  priority: 0,
  usage_rate: 1.0,
  script_url: '',
  script_secret: '',
})

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const isEditMode = computed(() => !!props.node)

watch(() => props.node, (node) => {
  if (node) {
    form.value = {
      remark: node.remark,
      category: node.category,
      username: node.username,
      password: node.password,
      host: node.host,
      offset_link: node.offset_link,
      batch_size: node.batch_size,
      priority: node.priority,
      usage_rate: node.usage_rate ?? 1.0,
      script_url: node.script_url ?? '',
      script_secret: node.script_secret ?? '',
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    remark: '',
    category: 'marzban',
    username: '',
    password: '',
    host: '',
    offset_link: 0,
    batch_size: 1,
    priority: 0,
    usage_rate: 1.0,
    script_url: '',
    script_secret: '',
  }
}

async function handleSubmit() {
  if (!form.value.remark) {
    toast.error('نام ضروری است')
    return
  }
  
  if (!form.value.host) {
    toast.error('میزبان ضروری است')
    return
  }
  
  if (!form.value.username) {
    toast.error('نام کاربری ضروری است')
    return
  }
  
  if (!form.value.password) {
    toast.error('رمز عبور ضروری است')
    return
  }

  isLoading.value = true
  try {
    if (isEditMode.value && props.node) {
      // Update existing node
      const updateData: NodeUpdate = {
        remark: form.value.remark,
        username: form.value.username,
        password: form.value.password,
        host: form.value.host,
        offset_link: form.value.offset_link,
        batch_size: form.value.batch_size,
        priority: form.value.priority,
        usage_rate: form.value.usage_rate,
        script_url: form.value.script_url,
        script_secret: form.value.script_secret,
      }
      
      await api.nodes.update(props.node.id, updateData)
      toast.success('نود با موفقیت به‌روزرسانی شد')
      emit('updated')
    } else {
      // Create new node
      const createData: NodeCreate = {
        remark: form.value.remark,
        category: form.value.category,
        username: form.value.username,
        password: form.value.password,
        host: form.value.host,
        offset_link: form.value.offset_link,
        batch_size: form.value.batch_size,
        priority: form.value.priority,
        usage_rate: form.value.usage_rate,
        script_url: form.value.script_url,
        script_secret: form.value.script_secret,
      }
      
      await api.nodes.create(createData)
      toast.success('نود با موفقیت ایجاد شد')
      emit('created')
    }
    
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || 'ذخیره نود ناموفق بود')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-md sm:w-auto sm:max-w-lg max-h-[80vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle class="text-right w-full">{{ isEditMode ? 'ویرایش نود' : 'ایجاد نود جدید' }}</DialogTitle>
        <DialogDescription class="text-right w-full">
          {{ isEditMode ? 'به‌روزرسانی اطلاعات نود' : 'افزودن نود جدید به زیرساخت شما' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div v-if="!isEditMode" class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="remark">نام *</Label>
            <Input
              id="remark"
              v-model="form.remark"
              placeholder="نود من"
              :disabled="isLoading"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <Label for="category">دسته‌بندی *</Label>
            <Select v-model="form.category" :disabled="isLoading">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="انتخاب دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marzban">Marzban</SelectItem>
                <SelectItem value="marzneshin">Marzneshin</SelectItem>
                <SelectItem value="rustneshin">Rustneshin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div v-else class="space-y-2">
          <Label for="remark">نام *</Label>
          <Input
            id="remark"
            v-model="form.remark"
            placeholder="نود من"
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-2">
          <Label for="host">میزبان *</Label>
          <Input
            id="host"
            v-model="form.host"
            placeholder="https://panel.example.com"
            :disabled="isLoading"
            type="url"
          />
          <div class="text-xs text-muted-foreground">
            آدرس کامل با پروتکل (https://)
          </div>
        </div>

        <div class="space-y-2">
          <Label for="username">نام کاربری *</Label>
          <Input
            id="username"
            v-model="form.username"
            placeholder="admin"
            :disabled="isLoading"
            autocomplete="off"
          />
        </div>

        <div class="space-y-2">
          <Label for="password">رمز عبور *</Label>
          <Input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            :disabled="isLoading"
            autocomplete="new-password"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="offset_link">آفست لینک</Label>
            <Input
              id="offset_link"
              v-model.number="form.offset_link"
              type="number"
              min="0"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              جابجایی لینک (پیش‌فرض: 0)
            </div>
          </div>

          <div class="space-y-2">
            <Label for="batch_size">اندازه دسته</Label>
            <Input
              id="batch_size"
              v-model.number="form.batch_size"
              type="number"
              min="1"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              اندازه دسته پردازش
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="priority">اولویت</Label>
            <Input
              id="priority"
              v-model.number="form.priority"
              type="number"
              min="0"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              اولویت نود (بالاتر = مهم‌تر)
            </div>
          </div>

          <div class="space-y-2">
            <Label for="usage_rate">نرخ مصرف</Label>
            <Input
              id="usage_rate"
              v-model.number="form.usage_rate"
              type="number"
              step="0.1"
              min="0"
              :disabled="isLoading"
            />
            <div class="text-xs text-muted-foreground">
              ضریب مصرف (پیش‌فرض: 1.0)
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="script_url">اسکریپت</Label>
          <Input
            id="script_url"
            v-model="form.script_url"
            placeholder="https://example.com:port"
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-2">
          <Label for="script_secret">سکرت اسکریپت</Label>
          <Input
            id="script_secret"
            v-model="form.script_secret"
            placeholder="my-secret"
            :disabled="isLoading"
          />
        </div>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          @click="open = false"
          :disabled="isLoading"
        >
          لغو
        </Button>
        <Button 
          @click="handleSubmit"
          :disabled="isLoading"
        >
          <Icon v-if="isLoading" name="i-radix-icons-update" class="ml-2 h-4 w-4 animate-spin" />
          {{ isEditMode ? 'به‌روزرسانی نود' : 'ایجاد نود' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
