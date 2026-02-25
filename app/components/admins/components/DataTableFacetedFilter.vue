<script setup lang="ts">
import { cn } from '@/lib/utils'

interface FilterOption {
  label: string
  value: string
  icon?: string
}

interface DataTableFacetedFilterProps {
  title: string
  options: FilterOption[]
  selectedValues: Set<string>
}

const props = defineProps<DataTableFacetedFilterProps>()
const emit = defineEmits<{
  (e: 'update', values: string[]): void
}>()

const selectedOptions = computed(() => {
  return props.options.filter((opt: FilterOption) => props.selectedValues.has(opt.value))
})

function toggleValue(value: string) {
  const newSet = new Set(props.selectedValues)
  if (newSet.has(value)) {
    newSet.delete(value)
  } else {
    newSet.add(value)
  }
  emit('update', Array.from(newSet))
}

function clearFilters() {
  emit('update', [])
}
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        :class="[
          'h-8 border-dashed w-full sm:w-auto',
          selectedValues.size > 0 ? 'justify-between sm:justify-start' : 'justify-center'
        ]"
      >
        <Icon name="i-radix-icons-plus-circled" class="mr-2 h-4 w-4" />
        {{ title }}
        <template v-if="selectedValues.size > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1 font-normal lg:hidden"
          >
            {{ selectedValues.size }}
          </Badge>
          <div class="hidden lg:flex space-x-1">
            <Badge
              v-if="selectedValues.size > 2"
              variant="secondary"
              class="rounded-sm px-1 font-normal"
            >
              {{ selectedValues.size }} selected
            </Badge>

            <template v-else>
              <Badge
                v-for="item in selectedOptions"
                :key="item.value"
                variant="secondary"
                class="rounded-sm px-1 font-normal"
              >
                {{ item.label }}
              </Badge>
            </template>
          </div>
        </template>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command
        :filter-function="(list: FilterOption[], term: string) => list.filter(i => i.label.toLowerCase().includes(term.toLowerCase()))"
      >
        <CommandInput :placeholder="title" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option"
              @select="toggleValue(option.value)"
            >
              <div
                :class="cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  selectedValues.has(option.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'opacity-50 [&_svg]:invisible',
                )"
              >
                <Icon name="i-radix-icons-check" :class="cn('h-4 w-4')" />
              </div>
              <Icon v-if="option.icon" :name="option.icon" class="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>

          <template v-if="selectedValues.size > 0">
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                :value="{ label: 'Clear filters' }"
                class="justify-center text-center"
                @select="clearFilters"
              >
                Clear filters
              </CommandItem>
            </CommandGroup>
          </template>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
