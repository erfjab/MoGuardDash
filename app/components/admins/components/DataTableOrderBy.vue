<script setup lang="ts">
interface OrderOption {
  label: string
  value: string
}

interface DataTableOrderByProps {
  title: string
  options: OrderOption[]
  selectedValue?: string
  allowClear?: boolean
}

const props = defineProps<DataTableOrderByProps>()
const emit = defineEmits<{
  (e: 'update', value: string | undefined): void
}>()

function selectOrder(value: string) {
  if (value === props.selectedValue) {
    if (props.allowClear === false) return
    emit('update', undefined)
  } else {
    emit('update', value)
  }
}

function clearOrder() {
  if (props.allowClear === false) return
  emit('update', undefined)
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="h-8 w-full sm:w-auto justify-between sm:justify-start">
        <Icon name="i-radix-icons-mixer-horizontal" class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValue">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge variant="secondary" class="rounded-sm px-1 font-normal">
            <span class="sm:hidden">{{ truncateLabel(getSelectedLabel(selectedValue), 10) }}</span>
            <span class="hidden sm:inline">{{ getSelectedLabel(selectedValue) }}</span>
          </Badge>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[240px] p-0" align="start">
      <Command>
        <CommandInput placeholder="Search order..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option"
              @select="selectOrder(option.value)"
            >
              <div class="flex items-center justify-between w-full">
                <span>{{ option.label }}</span>
                <Icon
                  v-if="selectedValue === option.value"
                  name="i-radix-icons-check"
                  class="h-4 w-4 text-primary"
                />
              </div>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValue && props.allowClear !== false">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="{ label: 'Clear order' }"
                class="justify-center text-center"
                @select="clearOrder"
              >
                Clear order
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script lang="ts">
export default {
  methods: {
    getSelectedLabel(this: any, value?: string) {
      if (!value) return ''
      const match = (this as any).options?.find((o: { label: string; value: string }) => o.value === value)
      return match?.label ?? ''
    },
    truncateLabel(_str?: string, max = 15) {
      const str = _str || ''
      if (str.length <= max) return str
      return str.slice(0, max) + '…'
    }
  }
}
</script>
