<script setup lang="ts">
import { smartToast as toast } from '~/lib/smart-toast'
import { createQrCodeUrl } from '~/lib/api-helpers'
import { PinInput, PinInputSlot, PinInputGroup } from '@/components/ui/pin-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardDescription from '@/components/ui/card/CardDescription.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
})

const api = useApi()
const { admin, setAdmin, fetchAdmin } = useAdmin()
const { logout } = useAuth()
const { t } = useI18n()

const isLoading = ref(false)
const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// TOTP State
const showEnableTotpDialog = ref(false)
const showDisableTotpDialog = ref(false)
const totpSecret = ref('')
const totpQrUrl = ref('')
const totpCode = ref<string[]>([])
const disableTotpCode = ref<string[]>([])
const isTotpLoading = ref(false)

// Password validation: 3-30 alphanumeric characters
const validatePassword = (value: string): boolean => {
  passwordError.value = ''
  
  if (!value) {
    passwordError.value = 'رمز عبور الزامی است'
    return false
  }
  
  if (value.length < 3) {
    passwordError.value = 'رمز عبور باید حداقل ۳ کاراکتر باشد'
    return false
  }
  
  if (value.length > 30) {
    passwordError.value = 'رمز عبور باید حداکثر ۳۰ کاراکتر باشد'
    return false
  }
  
  if (!/^[a-zA-Z0-9@#&]+$/.test(value)) {
    passwordError.value = 'فقط حروف، اعداد و @#& مجاز هستند'
    return false
  }
  
  return true
}

// Validate password confirmation
const validateConfirmPassword = (): boolean => {
  confirmPasswordError.value = ''
  
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'لطفاً رمز عبور را تأیید کنید'
    return false
  }
  
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'رمزهای عبور مطابقت ندارند'
    return false
  }
  
  return true
}

// Generate random password (letters, numbers, and @#&)
const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#&'
  let generatedPassword = ''
  for (let i = 0; i < 12; i++) {
    generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  password.value = generatedPassword
  confirmPassword.value = generatedPassword
  passwordError.value = ''
  confirmPasswordError.value = ''
  // Show passwords so user can see the generated password
  showPassword.value = true
  showConfirmPassword.value = true
}

// Update password
const handleSubmit = async () => {
  if (!validatePassword(password.value) || !validateConfirmPassword()) {
    return
  }
  
  isLoading.value = true
  try {
    const response = await api.admins.updateCurrent({
      password: password.value,
    })
    setAdmin(response)
    toast.success('رمز عبور با موفقیت به‌روز شد')
    password.value = ''
    confirmPassword.value = ''
    passwordError.value = ''
    confirmPasswordError.value = ''
  }
  catch (error: any) {
    toast.error('به‌روزرسانی رمز عبور ناموفق بود', {
      description: error.message || 'خطایی رخ داد',
    })
  }
  finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  password.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
}

// TOTP Functions
const handleEnableTotp = async () => {
  isTotpLoading.value = true
  try {
    // Request provisioning
    const response = await api.admins.revokeTotp()
    
    // Check if we have a secret (provisioning_uri might be optional)
    if (response.secret) {
      totpSecret.value = response.secret
      
      // Use the provisioning URI directly if available
      if (response.provisioning_uri) {
        totpQrUrl.value = createQrCodeUrl(response.provisioning_uri)
      } else {
        // Fallback: Construct the URI manually if missing
        // We need the username for the label
        const username = admin.value?.username || 'Admin'
        const label = encodeURIComponent(`GuardDash:${username}`)
        const issuer = encodeURIComponent('GuardDash')
        const uri = `otpauth://totp/${label}?secret=${response.secret}&issuer=${issuer}`
        totpQrUrl.value = createQrCodeUrl(uri)
      }
      
      totpCode.value = []
      showEnableTotpDialog.value = true
    } else {
      toast.error('تولید کلید TOTP ناموفق بود')
    }
  } catch (error: any) {
    toast.error('راه‌اندازی TOTP ناموفق بود', {
      description: error.data?.detail || error.message
    })
  } finally {
    isTotpLoading.value = false
  }
}

const handleVerifyTotp = async () => {
  const code = totpCode.value.join('').trim()
  if (code.length !== 6) {
    toast.error('لطفاً کد ۶ رقمی معتبر وارد کنید')
    return
  }

  isTotpLoading.value = true
  try {
    await api.admins.verifyTotp(code)
    toast.success('TOTP با موفقیت فعال شد. لطفاً دوباره وارد شوید.')
    showEnableTotpDialog.value = false
    await logout()
  } catch (error: any) {
    toast.error('تأیید TOTP ناموفق بود', {
      description: error.data?.detail || error.message
    })
  } finally {
    isTotpLoading.value = false
  }
}

const handleDisableTotpClick = () => {
  disableTotpCode.value = []
  showDisableTotpDialog.value = true
}

const handleDisableTotp = async () => {
  const code = disableTotpCode.value.join('').trim()
  if (code.length !== 6) {
    toast.error('لطفاً کد ۶ رقمی معتبر وارد کنید')
    return
  }

  isTotpLoading.value = true
  try {
    await api.admins.updateCurrent({ totp_status: false }, code)
    toast.success('TOTP با موفقیت غیرفعال شد')
    showDisableTotpDialog.value = false
    await fetchAdmin(true) // Refresh admin info
  } catch (error: any) {
    toast.error('غیرفعال کردن TOTP ناموفق بود', {
      description: error.data?.detail || error.message
    })
  } finally {
    isTotpLoading.value = false
  }
}

const isTotpEnabled = computed(() => {
  if (!admin.value) return false
  return admin.value.totp_enabled || admin.value.totp_status || false
})
</script>

<template>
  <div class="container mx-auto py-6 space-y-6" dir="rtl">
    <div class="flex items-center justify-between">
      <div class="text-right">
        <h1 class="text-3xl font-bold tracking-tight">
          {{ t('security.title') }}
        </h1>
        <p class="text-muted-foreground mt-2">
          {{ t('security.subtitle') }}
        </p>
      </div>
    </div>


    <Card>
      <CardHeader class="text-right">
        <CardTitle>{{ t('security.changePassword') }}</CardTitle>
        <CardDescription>
          رمز عبور حساب خود را به‌روز کنید. باید ۳-۳۰ کاراکتر باشد (حروف، اعداد، @#&).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-4">
            <div class="grid gap-x-4 gap-y-2 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="password">{{ t('security.newPassword') }}</Label>
                <div class="relative">
                  <Input
                    id="password"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="رمز عبور جدید را وارد کنید"
                    :disabled="isLoading"
                    class="pl-10 text-right"
                    dir="rtl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="absolute left-0 top-0 h-full px-2 py-2 hover:bg-transparent"
                    :disabled="isLoading"
                    @click="showPassword = !showPassword"
                  >
                    <Icon
                      :name="showPassword ? 'lucide:eye' : 'lucide:eye-off'"
                      class="h-4 w-4"
                    />
                  </Button>
                </div>
              </div>

              <div class="space-y-2">
                <Label for="confirm_password">{{ t('security.confirmPassword') }}</Label>
                <div class="relative">
                  <Input
                    id="confirm_password"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="رمز عبور جدید را دوباره وارد کنید"
                    :disabled="isLoading"
                    class="pl-10 text-right"
                    dir="rtl"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="absolute left-0 top-0 h-full px-2 py-2 hover:bg-transparent"
                    :disabled="isLoading"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <Icon
                      :name="showConfirmPassword ? 'lucide:eye' : 'lucide:eye-off'"
                      class="h-4 w-4"
                    />
                  </Button>
                </div>
              </div>

              <p class="text-sm text-muted-foreground md:col-span-2 text-right">
                رمز عبور فقط باید شامل حروف، اعداد و @#& باشد (a-z, A-Z, 0-9, @, #, &) و بین ۳-۳۰ کاراکتر طول داشته باشد.
              </p>

              <p v-if="passwordError" class="text-sm text-destructive text-right">
                {{ passwordError }}
              </p>
              <p v-if="confirmPasswordError" class="text-sm text-destructive text-right">
                {{ confirmPasswordError }}
              </p>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              type="button"
              variant="outline"
              class="w-full sm:w-auto order-first sm:order-2"
              :disabled="isLoading"
              @click="generatePassword"
            >
              <Icon name="lucide:wand-2" class="ml-2 h-4 w-4" />
              {{ t('security.randomPassword') }}
            </Button>
            <div class="flex gap-4 sm:contents">
              <Button type="submit" class="flex-1 sm:flex-none sm:order-1" :disabled="isLoading">
                <Icon v-if="isLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
                {{ t('security.updatePassword') }}
              </Button>
              <Button
                type="button"
                variant="outline"
                class="flex-1 sm:flex-none sm:order-3"
                :disabled="isLoading"
                @click="handleCancel"
              >
                {{ t('common.cancel') }}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>

    <ClientOnly>
      <template #fallback>
        <div class="h-10" />
      </template>

      <!-- TOTP Section -->
      <Card>
        <CardHeader class="text-right">
          <CardTitle>{{ t('security.twoFactorAuth') }}</CardTitle>
          <CardDescription>
            {{ t('security.twoFactorDescription') }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div 
                  class="h-2.5 w-2.5 rounded-full"
                  :class="isTotpEnabled ? 'bg-green-500' : 'bg-destructive'"
                ></div>
                <span class="font-medium">
                  {{ isTotpEnabled ? t('common.active') : t('common.inactive') }}
                </span>
              </div>
              <p class="text-sm text-muted-foreground hidden sm:block">
                {{ isTotpEnabled 
                  ? 'حساب شما با TOTP امن شده است.' 
                  : 'TOTP را برای محافظت از حساب خود فعال کنید.' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <Button 
                v-if="!isTotpEnabled" 
                @click="handleEnableTotp"
                :disabled="isTotpLoading"
              >
                <Icon v-if="isTotpLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
                {{ t('security.enableTotp') }}
              </Button>
              <Button 
                v-else 
                variant="destructive" 
                @click="handleDisableTotpClick"
                :disabled="isTotpLoading"
              >
                <Icon v-if="isTotpLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
                {{ t('security.disableTotp') }}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Enable TOTP Dialog -->
      <Dialog v-model:open="showEnableTotpDialog">
        <DialogContent dir="rtl" class="sm:max-w-md [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
          <DialogHeader class="items-start text-right space-y-1.5">
            <DialogTitle>فعال کردن TOTP</DialogTitle>
            <DialogDescription class="text-right">
              کد QR را با برنامه احراز هویت خود (مانند Google Authenticator) اسکن کنید و کد زیر را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          
          <div class="flex flex-col items-center space-y-4 py-4">
            <div class="bg-white p-2 rounded-lg">
              <img :src="totpQrUrl" alt="کد QR احراز هویت" class="w-48 h-48" />
            </div>
            
            <div class="w-full space-y-2">
              <Label class="text-right block">کلید مخفی</Label>
              <code class="block w-full p-2 bg-muted rounded text-sm font-mono break-all select-all text-center cursor-text">{{ totpSecret }}</code>
              <p class="text-xs text-muted-foreground text-center">
                اگر نمی‌توانید کد QR را اسکن کنید، این کلید مخفی را به صورت دستی در برنامه خود وارد کنید.
              </p>
            </div>

            <div class="w-full space-y-2">
              <Label for="totp-code" class="text-right block">کد تأیید</Label>
              <PinInput
                id="totp-code"
                v-model="totpCode"
                type="number"
                :disabled="isTotpLoading"
                :otp="true"
                class="w-full justify-center"
                @complete="handleVerifyTotp"
              >
                <PinInputGroup class="gap-2.5 justify-center *:data-[slot=pin-input-slot]:rounded-md *:data-[slot=pin-input-slot]:border *:data-[slot=pin-input-slot]:border-input *:data-[slot=pin-input-slot]:bg-background *:data-[slot=pin-input-slot]:h-11 *:data-[slot=pin-input-slot]:w-11 *:data-[slot=pin-input-slot]:text-lg *:data-[slot=pin-input-slot]:font-semibold *:data-[slot=pin-input-slot]:shadow-sm">
                  <PinInputSlot
                    v-for="(id, index) in 6"
                    :key="id"
                    :index="index"
                  />
                </PinInputGroup>
              </PinInput>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showEnableTotpDialog = false">انصراف</Button>
            <Button @click="handleVerifyTotp" :disabled="isTotpLoading">
              <Icon v-if="isTotpLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
              تأیید و فعال‌سازی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Disable TOTP Dialog -->
      <Dialog v-model:open="showDisableTotpDialog">
        <DialogContent dir="rtl" class="sm:max-w-md [&_button[aria-label=Close]]:left-4 [&_button[aria-label=Close]]:right-auto">
          <DialogHeader class="items-start text-right space-y-1.5">
            <DialogTitle>غیرفعال کردن TOTP</DialogTitle>
            <DialogDescription class="text-right">
              برای غیرفعال کردن احراز هویت دو مرحله‌ای، لطفاً کد برنامه احراز هویت خود را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          
          <div class="py-4">
            <div class="space-y-2">
              <Label for="disable-totp-code" class="text-right block">کد احراز هویت</Label>
              <PinInput
                id="disable-totp-code"
                v-model="disableTotpCode"
                type="number"
                :disabled="isTotpLoading"
                :otp="true"
                class="w-full justify-center"
                @complete="handleDisableTotp"
              >
                <PinInputGroup class="gap-2.5 justify-center *:data-[slot=pin-input-slot]:rounded-md *:data-[slot=pin-input-slot]:border *:data-[slot=pin-input-slot]:border-input *:data-[slot=pin-input-slot]:bg-background *:data-[slot=pin-input-slot]:h-11 *:data-[slot=pin-input-slot]:w-11 *:data-[slot=pin-input-slot]:text-lg *:data-[slot=pin-input-slot]:font-semibold *:data-[slot=pin-input-slot]:shadow-sm">
                  <PinInputSlot
                    v-for="(id, index) in 6"
                    :key="id"
                    :index="index"
                  />
                </PinInputGroup>
              </PinInput>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="showDisableTotpDialog = false">{{ t('common.cancel') }}</Button>
            <Button variant="destructive" @click="handleDisableTotp" :disabled="isTotpLoading">
              <Icon v-if="isTotpLoading" name="lucide:loader-2" class="ml-2 h-4 w-4 animate-spin" />
              {{ t('security.disableTotp') }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientOnly>
  </div>
</template>
