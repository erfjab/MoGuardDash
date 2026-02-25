<script setup lang="ts">
import type { NavGroup, NavLink, NavSectionTitle } from '~/types/nav'
import type { AdminResponse } from '~/types/api'
import { navMenu, navMenuBottom } from '~/constants/menus'

function resolveNavItemComponent(item: NavLink | NavGroup | NavSectionTitle): any {
  if ('children' in item)
    return resolveComponent('LayoutSidebarNavGroup')

  return resolveComponent('LayoutSidebarNavLink')
}

const { logout } = useAuth()
const { admin, fetchAdmin, isOwner } = useAdmin()

onMounted(async () => {
  try {
    await fetchAdmin()
  } catch (error) {
    console.error('Failed to fetch admin data:', error)
    // If can't get admin data, logout
    logout()
  }
})

// Filter menu items based on owner status
const filteredNavMenu = computed(() => {
  return navMenu.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if ('ownerOnly' in item && item.ownerOnly) {
        return isOwner.value
      }
      return true
    })
  }))
})

const { sidebar } = useAppSettings()
const { locale } = useI18n()

// Update sidebar side based on locale
const sidebarSide = computed(() => {
  return locale.value === 'fa' ? 'right' : 'left'
})
</script>

<template>
  <Sidebar :collapsible="sidebar?.collapsible" :side="sidebarSide" :variant="sidebar?.variant">
    <SidebarHeader>
      <LayoutSidebarNavHeader />
      <LayoutSidebarSearch />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="(nav, indexGroup) in filteredNavMenu" :key="indexGroup">
        <SidebarGroupLabel v-if="nav.heading">
          {{ $t(nav.heading) }}
        </SidebarGroupLabel>
        <SidebarMenu>
          <component :is="resolveNavItemComponent(item)" v-for="(item, index) in nav.items" :key="index" :item="item" />
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup class="mt-auto">
        <SidebarMenu>
          <component :is="resolveNavItemComponent(item)" v-for="(item, index) in navMenuBottom" :key="index" :item="item" size="sm" />
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <LayoutSidebarNavFooter v-if="admin" :admin="admin" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<style scoped>

</style>
