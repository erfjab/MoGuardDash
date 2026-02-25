import type { ColumnDef } from '@tanstack/vue-table'
import type { AdminResponse } from '~/types/api'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'

export function createColumns(t: (key: string) => string): ColumnDef<AdminResponse>[] {
  return [
    {
      accessorKey: 'username',
      header: () => h('div', { class: 'pr-4 font-medium text-right' }, 'نام کاربری'),
      cell: ({ row }) => {
        const admin = row.original
        const statusColor = admin.enabled ? 'bg-green-500' : 'bg-gray-500'
        
        return h('div', { class: 'flex items-center gap-2 min-w-32 pr-4' }, [
          h('span', {
            class: `inline-flex h-3 w-3 rounded-full ${statusColor}`,
          }),
          h('span', { class: 'font-medium truncate' }, row.getValue('username')),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'role',
      header: () => h('div', { class: 'font-medium text-right' }, 'نقش'),
      cell: ({ row }) => {
        const role = row.original.role
        return h('div', { class: 'flex items-center min-w-24 justify-end' }, [
          h(
            Badge,
            { variant: 'outline', class: 'capitalize text-xs px-2 py-0.5' },
            () => t(`admins.${role}`),
          ),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'current_count',
      header: () => h('div', { class: 'font-medium text-right' }, 'کاربران'),
      cell: ({ row }) => {
        const count = row.original.current_count || 0
        return h('div', { class: 'text-sm text-right' }, count)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'current_usage',
      header: () => h('div', { class: 'font-medium text-right' }, 'مصرف'),
      cell: ({ row }) => {
        const usage = row.original.current_usage || 0
        const usageGB = (usage / (1024 ** 3)).toFixed(2)
        
        return h('div', { class: 'text-sm min-w-24 text-right' }, [
          h('div', { class: 'font-medium' }, `${usageGB} GB`),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
