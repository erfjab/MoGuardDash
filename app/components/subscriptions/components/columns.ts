import type { ColumnDef } from '@tanstack/vue-table'
import type { SubscriptionResponse } from '~/types/api'
import { h, ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Icon } from '#components'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import { getSubscriptionMetrics, formatTimeLeft } from '../data/schema'
import { smartToast as toast } from '~/lib/smart-toast'
import { copySubscriptionLink } from '@/lib/api-helpers'

function formatLastOnline(onlineAt: string | null, t: (key: string) => string): string {
  if (!onlineAt) return t('subscriptions.neverUsed')
  
  const now = Date.now()
  // Parse as UTC if no timezone specified
  const utcTime = onlineAt.endsWith('Z') ? onlineAt : onlineAt + 'Z'
  const onlineTime = new Date(utcTime).getTime()
  const diffSeconds = Math.floor((now - onlineTime) / 1000)
  
  if (diffSeconds < 0) return t('subscriptions.online')
  if (diffSeconds < 60) return t('subscriptions.online')
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} ${t('subscriptions.minute')} ${t('subscriptions.ago')}`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} ${t('subscriptions.hour')} ${t('subscriptions.ago')}`
  return `${Math.floor(diffSeconds / 86400)} ${t('subscriptions.day')} ${t('subscriptions.ago')}`
}

const copiedStates = ref(new Map<number, boolean>())

async function handleCopyLink(row: SubscriptionResponse) {
  const res = await copySubscriptionLink(row)
  if (res.ok) {
    toast.success('Link copied!')
    copiedStates.value.set(row.id, true)
    setTimeout(() => {
      copiedStates.value.delete(row.id)
      copiedStates.value = new Map(copiedStates.value)
    }, 2000)
  } else {
    if (res.reason === 'no-link') {
      toast.error('No link available to copy')
    } else if (res.reason === 'copy-failed') {
      toast.error('Clipboard blocked. Please allow clipboard access or copy manually.')
    } else {
      toast.error('Failed to copy link')
    }
  }
}

export function createColumns(onAction: (action: string, subscription: SubscriptionResponse) => void, isOwner: boolean = false, t: (key: string) => string): ColumnDef<SubscriptionResponse>[] {
  const columns: ColumnDef<SubscriptionResponse>[] = [
    {
      accessorKey: 'username',
      header: ({ column }) => h('div', { class: 'ltr:pl-10 rtl:pr-10' }, [h(DataTableColumnHeader, { column, title: t('common.username') })]),
      cell: ({ row }) => {
        const sub = row.original
        const hasAutoRenewal = sub.auto_renewals && sub.auto_renewals.length > 0
        
        // Determine status emoji color based on priority
        let statusColor = 'bg-green-500' // Default active
        if (sub.limited) {
          statusColor = 'bg-red-500' // Limited (usage exceeded) - highest priority
        } else if (!sub.enabled) {
          statusColor = 'bg-gray-500' // Disabled
        } else if (sub.expired) {
          statusColor = 'bg-yellow-500' // Expired
        } else if (sub.limit_expire < 0) {
          statusColor = 'bg-violet-500' // On first connect (not started yet)
        }
        
        return h('div', { class: 'flex items-center gap-2 min-w-32 ltr:pl-10 rtl:pr-10' }, [
          h('span', {
            class: `inline-flex h-3 w-3 rounded-full ${statusColor} ${sub.is_active && !sub.limited && sub.enabled && !sub.expired ? 'animate-pulse' : ''}`,
          }),
          h('div', { class: 'flex flex-col' }, [
            h('div', { class: 'flex items-center gap-1.5' }, [
              h('span', { class: 'font-medium' }, row.getValue('username')),
              hasAutoRenewal ? h('span', { 
                class: 'text-xs text-muted-foreground',
              }, `(${t('subscriptions.autoRenewal')})`) : null,
            ]),
            h('span', { class: 'text-xs text-muted-foreground/50' }, formatLastOnline(sub.online_at, t)),
          ]),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  // Add owner_username column if user is owner (after username column)
  if (isOwner) {
    columns.splice(1, 0, {
      accessorKey: 'owner_username',
      header: ({ column }) => h(DataTableColumnHeader, { column, title: t('subscriptions.owner') }),
      cell: ({ row }) => {
        const ownerUsername = row.original.owner_username
        return h('div', { class: 'text-sm min-w-24' }, [
          h('span', { class: 'text-muted-foreground' }, ownerUsername),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    })
  }

  // Add remaining columns
  columns.push(
  {
    accessorKey: 'limit_usage',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: t('subscriptions.dataUsage') }),
    cell: ({ row }) => {
      const currentUsage = row.original.current_usage
      const limitUsage = row.original.limit_usage
      const isUnlimited = limitUsage === 0
      
      const currentGB = (currentUsage / (1024 ** 3)).toFixed(2)
      const limitGB = isUnlimited ? t('subscriptions.unlimited') : (limitUsage / (1024 ** 3)).toFixed(2)
      
      return h('div', { class: 'text-sm min-w-40' }, [
        h('div', { class: 'font-medium' }, isUnlimited ? `${currentGB} ${t('subscriptions.gbUnit')}` : `${currentGB} ${t('subscriptions.gbUnit')} / ${limitGB} ${t('subscriptions.gbUnit')}`),
        isUnlimited 
          ? h('div', { class: 'text-xs text-muted-foreground' }, t('subscriptions.unlimited'))
          : h('div', { class: 'text-xs text-muted-foreground/70' }, `${(limitGB as any - parseFloat(currentGB)).toFixed(2)} ${t('subscriptions.gbUnit')} ${t('subscriptions.left')}`),
      ])
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'limit_expire',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: t('subscriptions.time') }),
    cell: ({ row }) => {
      const limitExpire = row.original.limit_expire
      const isUnlimited = limitExpire === 0
      const metrics = getSubscriptionMetrics(row.original)
      let timeDisplay = formatTimeLeft(metrics.timeLeftSeconds, t)
      let expired = false
      if (!isUnlimited && metrics.timeLeftSeconds === 0 && limitExpire > 0) {
        const now = Math.floor(Date.now() / 1000)
        const agoSeconds = now - limitExpire
        timeDisplay = formatTimeLeft(agoSeconds, t) + ' ' + t('subscriptions.ago')
        expired = true
      }
      return h('div', { class: 'text-sm min-w-32' }, [
  h('div', { class: expired ? 'font-medium text-muted-foreground' : 'font-medium' }, isUnlimited ? t('subscriptions.unlimited') : expired ? timeDisplay : `${timeDisplay} ${t('subscriptions.left')}`),
      ])
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-center' }, t('common.actions')),
    cell: ({ row }) => {
      const isCopied = copiedStates.value.get(row.original.id) || false
      const sub = row.original
      
      return h('div', { class: 'flex justify-center gap-1 min-w-64' }, [
        // Link copy button
        h(Button, {
          variant: isCopied ? 'default' : 'ghost',
          size: 'icon',
          class: `h-8 w-8 transition-colors ${isCopied ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`,
          title: t('subscriptions.copyLink'),
          onClick: async (e: Event) => {
            e.stopPropagation()
            await handleCopyLink(row.original)
          },
        }, () => h(Icon, { 
          name: isCopied ? 'i-lucide-check' : 'i-lucide-link', 
          class: `h-4 w-4 ${isCopied ? 'text-primary-foreground' : ''}` 
        })),
        
        // QR Code button
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8',
          title: t('subscriptions.showQrCode'),
          onClick: (e: Event) => {
            e.stopPropagation()
            onAction('qrcode', sub)
          },
        }, () => h(Icon, { name: 'i-lucide-qr-code', class: 'h-4 w-4' })),
        
        // Revoke button
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8',
          title: t('subscriptions.revoke'),
          onClick: (e: Event) => {
            e.stopPropagation()
            onAction('revoke', sub)
          },
        }, () => h(Icon, { name: 'i-lucide-lock', class: 'h-4 w-4' })),
        
        // Reset button
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8',
          title: t('subscriptions.resetUsageAction'),
          onClick: (e: Event) => {
            e.stopPropagation()
            onAction('reset', sub)
          },
        }, () => h(Icon, { name: 'i-lucide-rotate-ccw', class: 'h-4 w-4' })),
        
        // Enable/Disable button
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8',
          title: sub.enabled ? t('subscriptions.disable') : t('subscriptions.enable'),
          onClick: (e: Event) => {
            e.stopPropagation()
            onAction(sub.enabled ? 'disable' : 'enable', sub)
          },
        }, () => h(Icon, { 
          name: sub.enabled ? 'i-lucide-ban' : 'i-lucide-check-circle', 
          class: 'h-4 w-4' 
        })),
        
        // Delete button
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8',
          title: t('subscriptions.deleteAction'),
          onClick: (e: Event) => {
            e.stopPropagation()
            onAction('delete', sub)
          },
        }, () => h(Icon, { name: 'i-lucide-trash-2', class: 'h-4 w-4 text-destructive' })),
      ])
    },
    enableSorting: false,
    enableHiding: false,
  })

  return columns
}
