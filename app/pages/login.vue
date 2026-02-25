<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import { PinInput, PinInputSlot, PinInputGroup, PinInputSeparator } from '@/components/ui/pin-input'

definePageMeta({
  layout: 'blank',
  middleware: ['auth'],
})

const { login, isAuthenticated } = useAuth()
const router = useRouter()
const { t } = useI18n()

const loading = ref(false)
const username = ref('')
const password = ref('')
const totpCode = ref<string[]>([])
const showTotpInput = ref(true)
const totpForced = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast.error(t('login.loginError'), {
      description: t('login.enterCredentials'),
    })
    return
  }

  const code = totpCode.value.join('').trim()
  const codeProvided = code.length > 0

  loading.value = true

  try {
    await login(username.value, password.value, codeProvided ? code : undefined)
    toast.success(t('login.loginSuccess'), {
      description: t('login.welcomeBack', { username: username.value }),
      duration: 10000,
    })
    router.push('/')
  } catch (error: any) {
    const errorMessage = error.message || ''
    const errorDetail = error.detail?.detail || ''
    
    if (
      errorMessage.toLowerCase().includes('totp') || 
      errorMessage.toLowerCase().includes('2fa') ||
      (typeof errorDetail === 'string' && (errorDetail.toLowerCase().includes('totp') || errorDetail.toLowerCase().includes('2fa')))
    ) {
       showTotpInput.value = true
    }
  } finally {
    loading.value = false
  }
}

// Handle Enter key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !loading.value) {
    handleLogin()
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
      <div class="flex flex-col space-y-2 text-center">
        <img src="/favicon.svg" alt="logo" class="mx-auto h-14 w-auto" />
        <h1 class="text-3xl font-bold tracking-tight">
          {{ t('login.title') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('login.subtitle') }}
        </p>
      </div>

      <div class="grid gap-6">
        <div class="grid gap-4">
          <div class="grid gap-2">
            <Label for="username">{{ t('login.username') }}</Label>
            <Input
              id="username"
              v-model="username"
              :placeholder="t('login.usernamePlaceholder')"
              type="text"
              autocomplete="username"
              :disabled="loading"
              @keydown="handleKeydown"
            />
          </div>

          <div class="grid gap-2">
            <Label for="password">{{ t('login.password') }}</Label>
            <PasswordInput
              id="password"
              v-model="password"
              :placeholder="t('login.passwordPlaceholder')"
              autocomplete="current-password"
              :disabled="loading"
              @keydown="handleKeydown"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="totp">{{ t('login.totpCode') }}</Label>
              <span v-if="totpForced" class="text-xs text-destructive">{{ t('common.required') }}</span>
            </div>
            <div dir="ltr">
              <PinInput
                id="totp"
                v-model="totpCode"
                type="number"
                :disabled="loading"
                :otp="true"
                class="w-full"
              >
                <PinInputGroup class="w-full flex-row-reverse items-center justify-between py-3 *:data-[slot=pin-input-slot]:rounded-md *:data-[slot=pin-input-slot]:border *:data-[slot=pin-input-slot]:border-input *:data-[slot=pin-input-slot]:bg-background *:data-[slot=pin-input-slot]:h-11 *:data-[slot=pin-input-slot]:w-11 *:data-[slot=pin-input-slot]:text-lg *:data-[slot=pin-input-slot]:font-semibold *:data-[slot=pin-input-slot]:shadow-sm">
                  <template v-for="(id, index) in 6" :key="id">
                    <PinInputSlot :index="index" />
                    <template v-if="index < 5">
                      <PinInputSeparator class="w-5 shrink-0 text-muted-foreground" />
                    </template>
                  </template>
                </PinInputGroup>
              </PinInput>
            </div>
          </div>

          <Button
            class="w-full"
            :disabled="loading"
            @click="handleLogin"
          >
            <Spinner v-if="loading" class="mr-2 size-4" />
            {{ t('login.signIn') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
