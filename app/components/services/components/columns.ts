import type { ColumnDef } from '@tanstack/vue-table'
import type { ServiceResponse } from '~/types/api'
import { h } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '#components'
import DataTableColumnHeader from './DataTableColumnHeader.vue'

export function createColumns(
  onAction: (action: string, service: ServiceResponse) => void,
  isOwner: boolean
): ColumnDef<ServiceResponse>[] {
  return [
    {
      accessorKey: 'remark',
      header: ({ column }) => h('div', { class: 'pr-4 text-right' }, [h(DataTableColumnHeader, { column, title: 'نام سرویس' })]),
      cell: ({ row }) => {
        return h('div', { class: 'flex items-center gap-2 min-w-48 pr-4' }, [
          h('span', { class: 'font-medium' }, row.getValue('remark')),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'node_ids',
      header: () => h('div', { class: 'font-medium text-right' }, 'نودها'),
      cell: ({ row }) => {
        const count = (row.getValue('node_ids') as number[])?.length || 0
        return h('div', { class: 'text-sm text-right' }, `${count} نود`)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'users_count',
      header: () => h('div', { class: 'font-medium text-right' }, 'کاربران'),
      cell: ({ row }) => {
        const count = row.getValue('users_count') as number || 0
        return h('div', { class: 'text-sm text-right' }, count)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'actions',
      header: () => h('div', { class: 'text-center' }, 'عملیات'),
      cell: ({ row }) => {
        const service = row.original
        
        const actions = [
          // Add to all button
          h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            title: 'افزودن به همه اشتراک‌ها',
            onClick: (e: Event) => {
              e.stopPropagation()
              onAction('add_to_all', service)
            },
          }, () => h(Icon, { name: 'i-lucide-plus-circle', class: 'h-4 w-4' })),
          
          // Remove from all button
          h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            title: 'حذف از همه اشتراک‌ها',
            onClick: (e: Event) => {
              e.stopPropagation()
              onAction('remove_from_all', service)
            },
          }, () => h(Icon, { name: 'i-lucide-minus-circle', class: 'h-4 w-4' })),
        ]

        if (isOwner) {
          // Delete button
          actions.push(
            h(Button, {
              variant: 'ghost',
              size: 'icon',
              class: 'h-8 w-8',
              title: 'حذف سرویس',
              onClick: (e: Event) => {
                e.stopPropagation()
                onAction('delete', service)
              },
            }, () => h(Icon, { name: 'i-lucide-trash-2', class: 'h-4 w-4 text-destructive' }))
          )
        }
        
        return h('div', { class: 'flex justify-center gap-1' }, actions)
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
