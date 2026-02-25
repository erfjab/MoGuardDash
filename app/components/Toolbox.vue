<template>
  <div
    ref="toolboxRef"
    class="absolute z-50"
    :class="{ 
      'transition-all duration-300': !isDragging,
      'scale-95 rotate-2': isDragging 
    }"
    :style="{ 
      bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
      left: isDragging ? `${dragX}px` : (position === 'left' ? '24px' : 'auto'),
      right: isDragging ? 'auto' : (position === 'right' ? '24px' : 'auto')
    }"
  >
    <div :class="[isExpanded ? 'w-60' : 'w-12']" class="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      <!-- Toolbox Container -->
      <div
        class="relative overflow-hidden rounded-2xl shadow-xl transition-colors duration-300"
        :class="[
          isExpanded ? 'bg-background border border-border h-auto' : 'bg-primary border border-primary h-12'
        ]"
      >
        <!-- Drag Handle (Collapsed) -->
        <div
          v-if="!isExpanded"
          @mousedown="startDrag"
          @touchstart="startDrag"
          @click="handleHeaderClick"
          class="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
        >
          <Icon name="lucide:grip-vertical" class="w-5 h-5 text-primary-foreground" />
        </div>

        <!-- Expanded Content -->
        <div
          v-if="isExpanded"
          class="p-3"
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-3 px-1">
            <div class="flex items-center gap-2">
              <div
                @mousedown="startDrag"
                @touchstart="startDrag"
                @click="handleHeaderClick"
                class="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded-md transition-colors"
              >
                <Icon name="lucide:grip-vertical" class="w-4 h-4 text-muted-foreground" />
              </div>
              <span class="text-sm font-semibold text-foreground">{{ $t('toolbox.quickActions') }}</span>
            </div>
            <Button
              @click="toggleExpand"
              variant="ghost"
              size="icon"
              class="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-full"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </Button>
          </div>

          <!-- Scrollable Items -->
          <div class="max-h-72 overflow-y-auto space-y-1 custom-scrollbar pr-1">
            <Button
              v-for="item in toolboxItems"
              :key="item.id"
              @click="handleItemClick(item)"
              variant="ghost"
              size="sm"
              class="w-full justify-start gap-3 h-10 hover:bg-primary/5 transition-all group rounded-xl"
            >
              <div class="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon :name="item.icon" class="w-3.5 h-3.5 text-primary" />
              </div>
              <span class="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors">{{ item.label }}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Button } from '@/components/ui/button'

interface ToolboxItem {
  id: string
  label: string
  description: string
  icon: string
  action: string
}

const { t } = useI18n()

const toolboxItems = computed<ToolboxItem[]>(() => [
  {
    id: 'create-sub',
    label: t('toolbox.createSubscription'),
    description: t('toolbox.createSubscriptionDesc'),
    icon: 'lucide:plus-circle',
    action: '/subscriptions?action=create'
  },
  {
    id: 'search-sub',
    label: t('toolbox.searchSubscription'),
    description: t('toolbox.searchSubscriptionDesc'),
    icon: 'lucide:search',
    action: '/subscriptions?action=search'
  },
  {
    id: 'new-test',
    label: t('toolbox.newTest'),
    description: t('toolbox.newTestDesc'),
    icon: 'lucide:flask-conical',
    action: '/subscriptions?action=test'
  },
  {
    id: 'help',
    label: t('toolbox.help'),
    description: t('toolbox.helpDesc'),
    icon: 'lucide:help-circle',
    action: '/faq'
  },
])

const isExpanded = ref(false)
const position = ref<'left' | 'right'>('right')
const toolboxRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isDraggingMoved = ref(false)
const justDragged = ref(false)
const dragX = ref(0)
const dragOffsetX = ref(0)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const handleHeaderClick = () => {
  if (justDragged.value) return
  toggleExpand()
}

const handleItemClick = (item: ToolboxItem) => {
  navigateTo(item.action)
  isExpanded.value = false
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  // Don't prevent default immediately to allow clicks if no drag happens
  // e.preventDefault() 
  e.stopPropagation()
  isDragging.value = true
  isDraggingMoved.value = false
  
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  
  if (toolboxRef.value) {
    const rect = toolboxRef.value.getBoundingClientRect()
    // Calculate offset relative to the element itself
    dragOffsetX.value = clientX - rect.left
    
    // For absolute positioning, we need the position relative to the offset parent (SidebarInset)
    // But dragX is used for 'left' style.
    // When dragging starts, we want to keep the element where it is visually.
    // rect.left is viewport relative.
    // We need to convert viewport relative to container relative.
    
    const parent = toolboxRef.value.offsetParent as HTMLElement
    if (parent) {
      const parentRect = parent.getBoundingClientRect()
      // Initial left position relative to parent
      dragX.value = rect.left - parentRect.left
    } else {
      dragX.value = rect.left
    }
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  
  // Check if moved enough to consider it a drag
  if (!isDraggingMoved.value) {
    const moveThreshold = 5
    // We can't easily check against initial dragX because dragX is now relative.
    // But we can check movement delta.
    // Let's just use a flag set in startDrag if we want strict check, but here simple check is fine.
    isDraggingMoved.value = true
  }
  
  // Prevent scrolling while dragging
  e.preventDefault()

  // Calculate new left position relative to parent
  if (toolboxRef.value && toolboxRef.value.offsetParent) {
    const parent = toolboxRef.value.offsetParent as HTMLElement
    const parentRect = parent.getBoundingClientRect()
    
    // clientX is viewport x.
    // parentRect.left is parent's viewport x.
    // dragOffsetX is mouse offset inside the element.
    
    // New element left (viewport) = clientX - dragOffsetX
    // New element left (relative) = (clientX - dragOffsetX) - parentRect.left
    
    let newX = (clientX - dragOffsetX.value) - parentRect.left
    
    // Constrain
    const parentWidth = parentRect.width
    const currentWidth = toolboxRef.value.offsetWidth || 48
    
    const minX = 24
    const maxX = parentWidth - 24 - currentWidth
    
    newX = Math.max(minX, Math.min(newX, maxX))
    
    dragX.value = newX
  }
}

const stopDrag = () => {
  if (isDraggingMoved.value) {
    justDragged.value = true
    setTimeout(() => { justDragged.value = false }, 50)
  }

  isDragging.value = false
  isDraggingMoved.value = false
  
  // Snap logic
  if (toolboxRef.value && toolboxRef.value.offsetParent) {
    const parent = toolboxRef.value.offsetParent as HTMLElement
    const parentWidth = parent.offsetWidth
    const contentCenterX = parentWidth / 2
    
    const currentWidth = toolboxRef.value.offsetWidth || 48
    const elementCenterX = dragX.value + currentWidth / 2
    
    if (elementCenterX < contentCenterX) {
      position.value = 'left'
    } else {
      position.value = 'right'
    }
  }
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

onMounted(() => {
  const savedPosition = localStorage.getItem('toolbox-position')
  if (savedPosition) {
    position.value = savedPosition as 'left' | 'right'
  }
})

onUnmounted(() => {
  localStorage.setItem('toolbox-position', position.value)
})

watch(position, () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('toolbox-position', position.value)
  }
})
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--primary) / 0.5) hsl(var(--primary) / 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: hsl(var(--primary) / 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: hsl(var(--primary) / 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: hsl(var(--primary) / 0.7);
}
</style>
