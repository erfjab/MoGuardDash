<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const { t } = useI18n()

definePageMeta({
  middleware: 'auth'
})

const api = useApi()
const { admin, fetchAdmin } = useAdmin()
const { copy, copied } = useClipboard({ legacy: true })

const isRevoking = ref(false)
const showApiKey = ref(false)

async function handleRevoke() {
  if (!admin.value) return
  
  isRevoking.value = true
  try {
    await api.admins.revokeCurrentApiKey()
    await fetchAdmin(true)
    toast.success(t('api.keyRevoked'))
  } catch (error: any) {
    toast.error(error.message || t('api.failedRevoke'))
  } finally {
    isRevoking.value = false
  }
}

function handleCopy() {
  if (admin.value?.api_key) {
    copy(admin.value.api_key)
    toast.success(t('api.keyCopied'))
  } else {
    toast.error(t('api.noKeyCopy'))
  }
}

function openDocs() {
  window.open('https://my.solidlayerco.com/docs', '_blank')
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">
        {{ $t('api.title') }}
      </h2>
      <p class="text-muted-foreground">
        {{ $t('api.subtitle') }}
      </p>
    </div>

    <!-- API Key Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('api.yourApiKey') }}</CardTitle>
        <CardDescription>
          {{ $t('api.apiKeyDescription') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <!-- Row 1: Input + Hide/Unhide + Copy (mobile & desktop) -->
          <div class="flex items-center gap-2 md:flex-1 md:gap-4">
            <div class="flex-1 relative">
              <Input
                :model-value="admin?.api_key"
                readonly
                :type="showApiKey ? 'text' : 'password'"
                class="pr-10 font-mono"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              @click="showApiKey = !showApiKey"
            >
              <Icon :name="showApiKey ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              @click="handleCopy"
            >
              <Icon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
            </Button>
          </div>
          
          <!-- Row 3: Revoke (mobile) -->
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button
                variant="destructive"
                class="w-full bg-red-600 hover:bg-red-700 md:w-auto"
                :disabled="isRevoking"
              >
                <Icon v-if="isRevoking" name="i-lucide-loader-2" class="animate-spin mr-2" />
                <span v-else>{{ $t('api.revokeKey') }}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl" class="[&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
              <AlertDialogHeader class="items-start text-right space-y-1.5">
                <AlertDialogTitle>{{ $t('api.revokeConfirm') }}</AlertDialogTitle>
                <AlertDialogDescription class="text-right">
                  {{ $t('api.revokeDescription') }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter class="gap-2">
                <AlertDialogCancel>{{ $t('common.cancel') }}</AlertDialogCancel>
                <AlertDialogAction @click="handleRevoke">{{ $t('common.confirm') }}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>

    <!-- API Documentation Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('api.documentationTitle') }}</CardTitle>
        <CardDescription>
          {{ $t('api.documentationDescription') }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button @click="openDocs" class="w-full sm:w-auto">
          <Icon name="i-lucide-external-link" class="mr-2" />
          {{ $t('api.viewDocumentation') }}
        </Button>
      </CardContent>
    </Card>

    <!-- SDK Section -->
    <Card>
      <CardHeader>
        <CardTitle>{{ $t('api.pythonSdk') }}</CardTitle>
        <CardDescription>
          {{ $t('api.pythonSdkDescription') }}
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 sm:flex-row">
        <Button variant="outline" as-child class="w-full sm:w-auto">
          <a href="https://github.com/erfjab/OpexCore" target="_blank" rel="noopener noreferrer">
            <Icon name="i-lucide-github" class="mr-2" />
            OpexCore
          </a>
        </Button>
        <Button variant="outline" as-child class="w-full sm:w-auto">
          <a href="https://github.com/erfjab/GuardCoreApi" target="_blank" rel="noopener noreferrer">
            <Icon name="i-lucide-github" class="mr-2" />
            GuardCoreApi
          </a>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
