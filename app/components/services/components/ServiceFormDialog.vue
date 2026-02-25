<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import type { ServiceCreate, ServiceResponse, ServiceUpdate, NodeResponse } from '~/types/api'
import { Checkbox } from '@/components/ui/checkbox'

const props = defineProps<{
  open: boolean
  service?: ServiceResponse | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'created'): void
  (e: 'updated'): void
  (e: 'deleted'): void
}>()

const api = useApi()
const { fetchNodes: fetchCachedNodes } = useAdmin()
const isLoading = ref(false)
const nodes = ref<NodeResponse[]>([])
const isLoadingNodes = ref(false)
const showDeleteConfirm = ref(false)

const form = ref({
  remark: '',
  node_ids: [] as number[],
})

const open = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const isEditMode = computed(() => !!props.service)

watch(() => props.service, (service) => {
  if (service) {
    form.value = {
      remark: service.remark,
      node_ids: [...service.node_ids],
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(open, (isOpen) => {
  if (isOpen) {
    fetchNodes()
  }
})

async function fetchNodes() {
  if (nodes.value.length > 0) return
  
  isLoadingNodes.value = true
  try {
    nodes.value = await fetchCachedNodes()
  } catch (error) {
    toast.error('دریافت نودها ناموفق بود')
  } finally {
    isLoadingNodes.value = false
  }
}

function resetForm() {
  form.value = {
    remark: '',
    node_ids: [],
  }
}

function toggleNode(nodeId: number) {
  const index = form.value.node_ids.indexOf(nodeId)
  if (index === -1) {
    form.value.node_ids.push(nodeId)
  } else {
    form.value.node_ids.splice(index, 1)
  }
}

async function handleSubmit() {
  if (!form.value.remark) {
    toast.error('نام الزامی است')
    return
  }
  
  if (form.value.node_ids.length === 0) {
    toast.error('حداقل یک نود باید انتخاب شود')
    return
  }

  isLoading.value = true
  try {
    if (isEditMode.value && props.service) {
      const updateData: ServiceUpdate = {
        remark: form.value.remark,
        node_ids: form.value.node_ids,
      }
      
      await api.services.update(props.service.id, updateData)
      toast.success('سرویس با موفقیت به‌روزرسانی شد')
      emit('updated')
    } else {
      const createData: ServiceCreate = {
        remark: form.value.remark,
        node_ids: form.value.node_ids,
      }
      
      await api.services.create(createData)
      toast.success('سرویس با موفقیت ایجاد شد')
      emit('created')
    }
    
    emit('update:open', false)
    resetForm()
  } catch (error: any) {
    toast.error(error.message || 'ذخیره سرویس ناموفق بود')
  } finally {
    isLoading.value = false
  }
}
async function handleDelete() {
  if (!props.service) return
  
  isLoading.value = true
  try {
    await api.services.delete(props.service.id)
    toast.success('سرویس با موفقیت حذف شد')
    emit('deleted')
    emit('update:open', false)
  } catch (error: any) {
    toast.error(error.message || 'حذف سرویس ناموفق بود')
  } finally {
    isLoading.value = false
    showDeleteConfirm.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent dir="rtl" class="w-[95vw] max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle class="text-right w-full">{{ isEditMode ? 'ویرایش سرویس' : 'ایجاد سرویس جدید' }}</DialogTitle>
        <DialogDescription class="text-right w-full">
          {{ isEditMode ? 'به‌روزرسانی اطلاعات سرویس' : 'ایجاد پیکربندی سرویس جدید' }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="remark">نام *</Label>
          <Input
            id="remark"
            v-model="form.remark"
            placeholder="سرویس من"
            :disabled="isLoading"
          />
        </div>

        <div class="space-y-2">
          <Label>نودها *</Label>
          
          <!-- Loading State -->
          <div v-if="isLoadingNodes" class="flex items-center justify-center p-2 border rounded-md bg-muted/30">
            <Icon name="i-radix-icons-update" class="ml-1.5 h-3 w-3 animate-spin" />
            <span class="text-xs text-muted-foreground">در حال بارگذاری...</span>
          </div>
          
          <!-- Empty State -->
          <div 
            v-else-if="nodes.length === 0" 
            class="flex flex-col items-center justify-center p-3 border rounded-md bg-muted/20"
          >
            <Icon name="i-lucide-inbox" class="h-5 w-5 text-muted-foreground/40 mb-1" />
            <p class="text-xs text-muted-foreground text-center">
              نودی در دسترس نیست
            </p>
          </div>
          
          <!-- Nodes Grid -->
          <div v-else class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="node in nodes"
                :key="node.id"
                @click="toggleNode(node.id)"
                :class="[
                  'flex flex-col items-center justify-center p-2 rounded border transition-all cursor-pointer text-center gap-1',
                  form.node_ids.includes(node.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted/50 border-muted-foreground/20',
                  isLoading && 'opacity-50 cursor-not-allowed'
                ]"
              >
                <span class="text-xs font-medium line-clamp-1 w-full">
                  {{ node.remark }}
                </span>
              </div>
            </div>
            
            <!-- Selection Summary -->
            <div class="flex items-center justify-between px-0.5 pt-0.5">
              <div class="text-xs text-muted-foreground">
                <span class="font-medium">{{ form.node_ids.length }}</span> انتخاب شده
              </div>
              <Button
                v-if="form.node_ids.length > 0 && !isLoading"
                variant="ghost"
                size="sm"
                @click="form.node_ids = []"
                class="h-5 px-1.5 text-xs"
              >
                <Icon name="i-lucide-x" class="ml-0.5 h-3 w-3" />
                پاک کردن
              </Button>
            </div>
          </div>
          
          <div class="text-xs text-muted-foreground">
            نودهایی که توسط این سرویس استفاده خواهند شد را انتخاب کنید.
          </div>
        </div>
      </div>

      <DialogFooter>
        <div class="flex flex-row flex-wrap gap-2 w-full justify-end">
          <Button 
            variant="outline" 
            @click="open = false"
            :disabled="isLoading"
          >
            لغو
          </Button>

          <template v-if="isEditMode">
             <div v-if="showDeleteConfirm" class="flex items-center gap-2">
                <span class="text-xs text-destructive font-medium">مطمئنید؟</span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  @click="handleDelete"
                  :disabled="isLoading"
                >
                  بله
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="showDeleteConfirm = false"
                  :disabled="isLoading"
                >
                  خیر
                </Button>
             </div>
             <Button 
               v-else
               variant="outline" 
               @click="showDeleteConfirm = true"
               :disabled="isLoading"
               class="text-destructive hover:text-destructive hover:bg-destructive/10"
             >
               حذف
             </Button>
          </template>

          <Button 
            @click="handleSubmit"
            :disabled="isLoading"
          >
            <Icon v-if="isLoading" name="i-radix-icons-update" class="ml-2 h-4 w-4 animate-spin" />
            {{ isEditMode ? 'به‌روزرسانی سرویس' : 'ایجاد سرویس' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
