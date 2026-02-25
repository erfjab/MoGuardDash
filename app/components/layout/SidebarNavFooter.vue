<script setup lang="ts">
import type { AdminResponse } from '~/types/api'
import { useSidebar } from '~/components/ui/sidebar'
import { formatBytes } from '~/lib/api-helpers'
import { smartToast as toast } from '~/lib/smart-toast'

defineProps<{
  admin: AdminResponse
}>()

const api = useApi()
const { data: statusStats } = useAsyncData(
  'subscription-status-stats-sidebar',
  () => api.subscriptions.getSubscriptionStatusStats(),
  { server: false, lazy: true }
)

const { isMobile, setOpenMobile } = useSidebar()
const { t } = useI18n()

function handleLogout() {
  const { logout } = useAuth()
  logout()
  toast.info(t('login.loggedOut'), {
    description: t('login.loggedOutDesc'),
    duration: 10000,
  })
}

const showModalTheme = ref(false)

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
      return 'i-lucide-crown'
    case 'admin':
      return 'i-lucide-shield-check'
    default:
      return 'i-lucide-user'
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'text-amber-500'
    default:
      return 'text-muted-foreground'
  }
}

const getRoleName = (role: string) => {
  switch (role) {
    case 'owner':
      return 'مالک'
    case 'admin':
      return 'مدیر'
    default:
      return 'کاربر'
  }
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            dir="rtl"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Icon :name="getRoleIcon(admin.role)" class="size-4" />
            </div>
            <div class="grid flex-1 text-right text-sm leading-tight">
              <span class="truncate font-semibold">{{ admin.username }}</span>
              <span class="truncate text-xs" :class="getRoleColor(admin.role)">{{ getRoleName(admin.role) }}</span>
            </div>
            <Icon name="i-lucide-chevrons-up-down" class="mr-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg"
          :side="isMobile ? 'bottom' : 'left'"
          align="end"
          dir="rtl"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-right text-sm">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon :name="getRoleIcon(admin.role)" class="size-4" />
              </div>
              <div class="grid flex-1 text-right text-sm leading-tight">
                <span class="truncate font-semibold">{{ admin.username }}</span>
                <span class="truncate text-xs" :class="getRoleColor(admin.role)">{{ getRoleName(admin.role) }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div class="px-2 py-2 space-y-2 text-xs">
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-users" class="size-4 text-muted-foreground" />
              <span class="text-muted-foreground">{{ t('subscriptions.title') }}</span>
              <span class="font-semibold text-foreground mr-auto">{{ statusStats?.total ?? 0 }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-lucide-zap" class="size-4 text-muted-foreground" />
              <span class="text-muted-foreground">{{ t('subscriptions.usage') }}</span>
              <span class="font-semibold text-foreground mr-auto">{{ formatBytes(statusStats?.total_usage ?? 0) }}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="showModalTheme = true">
              <Icon name="i-lucide-paintbrush" />
              {{ t('theme.title') }}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <Icon name="i-lucide-log-out" />
            {{ t('user.logout') }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>

  <Dialog v-model:open="showModalTheme">
    <DialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
      <DialogHeader class="items-start text-right space-y-1.5">
        <DialogTitle>شخصی‌سازی</DialogTitle>
        <DialogDescription class="text-xs text-muted-foreground text-right">
          شخصی‌سازی تم و رنگ‌های پوسته‌ی داشبورد
        </DialogDescription>
      </DialogHeader>
      <ThemeCustomize />
    </DialogContent>
  </Dialog>
</template>

<style scoped>

</style>
