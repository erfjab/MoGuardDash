<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTimeAgo, useNow, useDateFormat } from '@vueuse/core'

const { t } = useI18n()

definePageMeta({
  middleware: 'auth'
})

const api = useApi()
const { admin, fetchAdmin } = useAdmin()
const isLoading = ref(false)
const now = useNow()

const lastBackupTime = computed(() => {
  if (!admin.value?.last_backup_at) return null
  // Ensure UTC parsing
  const dateStr = admin.value.last_backup_at.endsWith('Z') 
    ? admin.value.last_backup_at 
    : `${admin.value.last_backup_at}Z`
  return new Date(dateStr)
})

const timeAgo = useTimeAgo(lastBackupTime)
const formattedLastBackup = useDateFormat(lastBackupTime, 'YYYY-MM-DD HH:mm:ss')

const nextBackupTime = computed(() => {
  if (!lastBackupTime.value) return null
  // 10 minutes cooldown
  return new Date(lastBackupTime.value.getTime() + 10 * 60 * 1000)
})

const timeRemaining = computed(() => {
  if (!nextBackupTime.value) return 0
  const diff = nextBackupTime.value.getTime() - now.value.getTime()
  return Math.max(0, Math.ceil(diff / 1000))
})

const canBackup = computed(() => timeRemaining.value === 0)

const downloadBackup = async () => {
  if (!canBackup.value) return

  try {
    isLoading.value = true
    const blob = await api.admins.getBackup()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    await fetchAdmin(true)
    toast.success(t('backup.backupCreated'))
  } catch (error) {
    console.error(error)
    toast.error(t('backup.backupFailed'))
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-6" dir="rtl">
    <div class="text-right">
      <h2 class="text-2xl font-bold tracking-tight">
        {{ $t('backup.title') }}
      </h2>
      <p class="text-muted-foreground">
        {{ $t('backup.subtitle') }}
      </p>
    </div>

    <Card>
      <CardHeader class="text-right">
        <CardTitle>{{ $t('backup.dataBackup') }}</CardTitle>
        <CardDescription>
          {{ $t('backup.dataBackupDescription') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div class="flex-1">
            <div class="flex flex-col gap-1 text-sm text-muted-foreground mb-2 md:mb-0 text-right">
              <div class="flex items-center gap-2">
                <Icon name="i-lucide-history" class="h-4 w-4" />
                <span v-if="lastBackupTime">
                  {{ $t('backup.lastBackup', { time: timeAgo, date: formattedLastBackup }) }}
                </span>
                <span v-else>
                  {{ $t('backup.noBackupYet') }}
                </span>
              </div>
              <div v-if="!canBackup" class="flex items-center gap-2 text-amber-500">
                <Icon name="i-lucide-clock" class="h-4 w-4" />
                <span>{{ $t('backup.nextBackupIn', { seconds: timeRemaining }) }}</span>
              </div>
            </div>
          </div>
          <Button @click="downloadBackup" :disabled="isLoading || !canBackup">
            <Icon v-if="isLoading" name="i-lucide-loader-2" class="ml-2 h-4 w-4 animate-spin" />
            <Icon v-else name="i-lucide-download" class="ml-2 h-4 w-4" />
            <span v-if="!canBackup">{{ $t('backup.waitSeconds', { seconds: timeRemaining }) }}</span>
            <span v-else>{{ $t('backup.downloadBackup') }}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
