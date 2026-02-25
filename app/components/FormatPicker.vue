<script setup lang="ts">
import { PLACEHOLDER_FORMATS } from '~/constants/formats'

const props = withDefaults(
  defineProps<{
    /**
     * The current value of the input to append format to
     */
    modelValue?: string
    /**
     * Whether the picker is disabled
     */
    disabled?: boolean
    /**
     * Button size variant
     */
    size?: 'sm' | 'default' | 'lg' | 'icon'
    /**
     * Button variant
     */
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    /**
     * Align popover content
     */
    align?: 'start' | 'center' | 'end'
  }>(),
  {
    modelValue: '',
    disabled: false,
    size: 'icon',
    variant: 'outline',
    align: 'end',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', format: string): void
}>()

const isOpen = ref(false)

const handleFormatSelect = (format: string) => {
  const formatted = `{${format}}`
  emit('update:modelValue', props.modelValue + formatted)
  emit('select', formatted)
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        type="button"
        :variant="variant"
        :size="size"
        :disabled="disabled"
        class="shrink-0"
      >
        <Icon name="lucide:braces" class="h-4 w-4" />
        <span class="sr-only">Insert format placeholder</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent 
      :align="align" 
      class="w-auto min-w-[280px] max-w-[400px] p-2"
    >
      <div class="space-y-2">
        <div class="px-1 pb-1 border-b">
          <p class="text-xs font-medium text-muted-foreground">
            Click to insert format
          </p>
        </div>
        <div class="flex flex-col gap-0.5 max-h-[280px] overflow-y-auto">
          <Button
            v-for="item in PLACEHOLDER_FORMATS"
            :key="item.key"
            type="button"
            variant="ghost"
            size="sm"
            class="justify-between font-mono text-xs h-7 px-2 w-full"
            @click="handleFormatSelect(item.key)"
          >
            <span class="text-foreground font-semibold">{{ '{' + item.key + '}' }}</span>
            <span class="text-muted-foreground text-[10px] truncate ml-2">{{ item.example }}</span>
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>
