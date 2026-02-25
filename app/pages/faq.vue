<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { faqCategories, type FaqCategory } from '~/constants/faqs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

const route = useRoute()

const { t } = useI18n()

definePageMeta({
  layout: 'default',
  title: 'FAQ'
})

const selectedCategory = ref<FaqCategory | null>(null)
const searchQuery = ref('')

const slugify = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-')

watchEffect(() => {
  const categoryQuery = route.query.category as string | undefined
  if (!categoryQuery) return
  const targetSlug = slugify(categoryQuery)
  const matched = faqCategories.find(cat => slugify(cat.title) === targetSlug)
  if (matched) {
    selectedCategory.value = matched
    searchQuery.value = ''
  }
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return []
  }
  
  // If searching, return all categories that have matching items
  return faqCategories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)
})

const isSearching = computed(() => searchQuery.value.length > 0)

const selectCategory = (category: FaqCategory) => {
  selectedCategory.value = category
  searchQuery.value = ''
}

const clearSearch = () => {
  searchQuery.value = ''
  selectedCategory.value = null
}

const goBack = () => {
  selectedCategory.value = null
  searchQuery.value = ''
}

const formatAnswer = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-foreground">$1</span>')
    .replace(/\n/g, '<br>')
}
</script>

<template>
  <div class="container max-w-5xl mx-auto py-12 px-4 md:px-8" dir="rtl">
    <!-- Header Section -->
    <div class="mb-12 space-y-6 text-center">
      <h1 class="text-4xl font-bold tracking-tight">{{ $t('faq.howCanHelp') }}</h1>
      
      <div class="relative max-w-xl mx-auto">
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Icon name="i-lucide-search" class="w-5 h-5 text-muted-foreground" />
        </div>
        <Input 
          v-model="searchQuery"
          type="search" 
          :placeholder="$t('faq.searchPlaceholder')" 
          class="pr-10 h-12 text-lg shadow-sm text-right"
          dir="rtl"
        />
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="isSearching" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">{{ $t('faq.searchResults') }}</h2>
        <Button variant="ghost" @click="clearSearch">{{ $t('faq.clearSearch') }}</Button>
      </div>

      <div v-if="filteredCategories.length === 0" class="text-center py-12 border rounded-lg bg-muted/10">
        <Icon name="i-lucide-search-x" class="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 class="text-lg font-medium">{{ $t('faq.noResultsTitle') }}</h3>
        <p class="text-muted-foreground">
          {{ $t('faq.noResultsDescription', { query: searchQuery }) }}
        </p>
      </div>

      <div v-for="category in filteredCategories" :key="category.title" class="space-y-4">
        <div class="flex items-center gap-2 text-muted-foreground">
          <Icon :name="category.icon || ''" class="w-5 h-5" />
          <span class="font-medium">{{ category.title }}</span>
        </div>
        
        <Accordion type="single" collapsible class="w-full space-y-4">
          <AccordionItem 
            v-for="(faq, index) in category.items" 
            :key="index" 
            :value="`search-${category.title}-${index}`"
            class="border rounded-lg px-4 bg-card shadow-sm"
          >
            <AccordionTrigger class="text-base font-medium hover:no-underline py-4 text-right">
              {{ faq.question }}
            </AccordionTrigger>
            <AccordionContent class="pb-4 text-base leading-relaxed">
              <div class="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div class="text-muted-foreground text-right" v-html="formatAnswer(faq.answer)"></div>
                <div v-if="faq.link" class="mt-2 md:mt-0 w-full md:w-auto shrink-0">
                  <Button as-child class="w-full md:w-auto">
                    <NuxtLink :to="faq.link">
                      {{ faq.linkText || 'رفتن به صفحه' }}
                      <Icon name="i-lucide-arrow-left" class="mr-2 w-4 h-4" />
                    </NuxtLink>
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>

    <!-- Category Detail View -->
    <div v-else-if="selectedCategory" class="animate-in fade-in slide-in-from-right-8 duration-300">
      <Button 
        variant="secondary" 
        size="lg"
        class="mb-8 pr-3 pl-6 font-medium hover:bg-secondary/80 transition-all group" 
        @click="goBack"
      >
        <Icon name="i-lucide-arrow-right" class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        {{ $t('faq.backToCategories') }}
      </Button>

      <div class="flex flex-col items-center text-center gap-5 mb-10">
        <div class="w-16 h-16 shrink-0 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Icon :name="selectedCategory.icon || ''" class="w-8 h-8" />
        </div>
        <div>
          <h2 class="text-3xl font-bold tracking-tight">{{ selectedCategory.title }}</h2>
          <p class="text-muted-foreground text-lg mt-1.5">{{ selectedCategory.description }}</p>
        </div>
      </div>

      <Accordion type="single" collapsible class="w-full space-y-4">
        <AccordionItem 
          v-for="(faq, index) in selectedCategory.items" 
          :key="index" 
          :value="`cat-${index}`"
          class="border rounded-lg px-4 bg-card shadow-sm transition-all hover:shadow-md"
        >
          <AccordionTrigger class="text-base font-medium hover:no-underline py-4 [&[data-state=open]]:text-primary text-right">
            {{ faq.question }}
          </AccordionTrigger>
          <AccordionContent class="pb-4 text-base leading-relaxed">
            <div class="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div class="text-muted-foreground text-right" v-html="formatAnswer(faq.answer)"></div>
              <div v-if="faq.link" class="mt-2 md:mt-0 w-full md:w-auto shrink-0">
                <Button as-child class="w-full md:w-auto">
                  <NuxtLink :to="faq.link">
                    {{ faq.linkText || 'رفتن به صفحه' }}
                    <Icon name="i-lucide-arrow-left" class="mr-2 w-4 h-4" />
                  </NuxtLink>
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>

    <!-- Categories Grid (Home) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card 
        v-for="category in faqCategories" 
        :key="category.title"
        class="group cursor-pointer hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/50"
        @click="selectCategory(category)"
      >
        <CardHeader class="text-right">
          <div class="mb-4 w-12 h-12 rounded-lg bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Icon :name="category.icon || ''" class="w-6 h-6" />
          </div>
          <CardTitle class="text-xl group-hover:text-primary transition-colors">{{ category.title }}</CardTitle>
          <CardDescription class="text-base mt-2 line-clamp-2">
            {{ category.description }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-sm text-muted-foreground font-medium flex items-center">
            {{ category.items.length }} مقاله
            <Icon name="i-lucide-arrow-left" class="w-4 h-4 mr-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>


