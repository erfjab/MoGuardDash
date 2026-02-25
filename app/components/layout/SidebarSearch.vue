<script setup lang="ts">
import { searchItems, type SearchItem } from '~/constants/searchItems'

const open = ref(false)
const router = useRouter()
const { metaSymbol } = useShortcuts()
const { isOwner } = useAdmin()

// Filter items based on owner status
const filteredItems = computed(() => {
  return searchItems.filter(item => {
    if (item.ownerOnly && !isOwner.value) {
      return false
    }
    return true
  })
})

// Group items by their group property
const groupedItems = computed(() => {
  const groups = new Map<string, SearchItem[]>()
  
  for (const item of filteredItems.value) {
    if (!groups.has(item.group)) {
      groups.set(item.group, [])
    }
    groups.get(item.group)!.push(item)
  }
  
  return groups
})

// Handle item selection
function handleSelect(link: string) {
  open.value = false
  router.push(link)
}

// Keyboard shortcut to open search (Ctrl/Cmd + K)
defineShortcuts({
  'meta_k': {
    handler: () => {
      open.value = !open.value
    },
  },
})
</script>

<template>
  <div>
    <SidebarGroup class="py-0">
      <SidebarGroupContent class="relative">
        <SidebarMenuButton as-child :tooltip="$t('common.search')">
          <Button variant="outline" class="w-full justify-start text-muted-foreground shadow-none py-2 h-auto" @click="open = true">
            <Icon name="i-lucide-search" class="size-4 shrink-0" />
            <span class="font-normal">{{ $t('common.searchPlaceholder') }}</span>
          </Button>
        </SidebarMenuButton>
      </SidebarGroupContent>
    </SidebarGroup>

    <CommandDialog v-model:open="open" :title="$t('common.searchTitle')" :description="$t('common.searchDescription')">
      <CommandInput :placeholder="$t('common.typeToSearch')" />
      <CommandList>
        <CommandEmpty>{{ $t('common.noResults') }}</CommandEmpty>
        <template v-for="[group, items] in groupedItems" :key="group">
          <CommandGroup :heading="$t(group)">
            <CommandItem
              v-for="item in items"
              :key="`${item.group}-${item.title}`"
              :value="[item.title, item.description, ...(item.keywords || [])].join(' ')"
              class="gap-4 py-5"
              @select="handleSelect(item.link)"
            >
              <span v-if="item.icon" :class="[item.icon, 'size-6 shrink-0 text-muted-foreground']" />
              <div class="flex flex-col gap-1.5">
                <span class="text-base font-medium leading-none">{{ $t(item.title) }}</span>
                <span v-if="item.description" class="text-sm text-muted-foreground line-clamp-1">{{ $t(item.description) }}</span>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
        </template>
      </CommandList>
    </CommandDialog>
  </div>
</template>
