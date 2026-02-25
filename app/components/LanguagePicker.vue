<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const { locale, locales, setLocale } = useI18n()

const changeLocale = async (code: string) => {
  await setLocale(code as 'en' | 'fa')
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="h-9 w-9">
        <Icon name="i-lucide-languages" class="h-4 w-4" />
        <span class="sr-only">Change language</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem 
        v-for="loc in locales" 
        :key="loc.code"
        @click="changeLocale(loc.code)"
        :class="{ 'bg-accent': locale === loc.code }"
      >
        <Icon 
          v-if="locale === loc.code"
          name="i-lucide-check" 
          class="mr-2 h-4 w-4" 
        />
        <span :class="{ 'ml-6': locale !== loc.code }">
          {{ loc.name }}
        </span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
