import type { ColumnDef } from '@tanstack/vue-table'
import type { NodeResponse } from '~/types/api'
import { h, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '#components'

export function createColumns(onAction: (action: string, node: NodeResponse) => void): ColumnDef<NodeResponse>[] {
  return [
    {
      accessorKey: 'remark',
      header: () => h('div', { class: 'pr-4 font-medium text-right' }, 'نام'),
      cell: ({ row }) => {
        const node = row.original
        const statusColor = node.enabled ? 'bg-green-500' : 'bg-gray-500'
        
        return h('div', { class: 'flex items-center gap-2 min-w-32 pr-4' }, [
          h('span', {
            class: `inline-flex h-3 w-3 rounded-full ${statusColor}`,
          }),
          h('span', { class: 'font-medium' }, row.getValue('remark')),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'category',
      header: () => h('div', { class: 'font-medium text-right' }, 'دسته‌بندی'),
      cell: ({ row }) => {
        const category = row.original.category
        
        return h('div', { class: 'text-sm capitalize text-right' }, category)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'current_usage',
      header: () => h('div', { class: 'font-medium text-right' }, 'مصرف'),
      cell: ({ row }) => {
        const usage = row.original.current_usage
        const usageGB = (usage / (1024 ** 3)).toFixed(2)
        
        return h('div', { class: 'text-sm min-w-24 text-right' }, [
          h('div', { class: 'font-medium' }, `${usageGB} GB`),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'usage_rate',
      header: () => h('div', { class: 'font-medium text-right' }, 'نرخ مصرف'),
      cell: ({ row }) => {
        const rate = row.original.usage_rate ?? 1.0
        
        return h('div', { class: 'text-sm text-right' }, `x${rate}`)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'priority',
      header: () => h('div', { class: 'font-medium text-right' }, 'اولویت'),
      cell: ({ row }) => {
        const priority = row.original.priority
        
        return h('div', { class: 'text-sm text-right' }, priority.toString())
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'actions',
      header: () => h('div', { class: 'text-center' }, 'عملیات'),
      cell: ({ row }) => {
        const node = row.original
        
        return h('div', { class: 'flex justify-center gap-1 min-w-24' }, [
          // Enable/Disable button
          h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            title: node.enabled ? 'غیرفعال کردن' : 'فعال کردن',
            onClick: (e: Event) => {
              e.stopPropagation()
              onAction(node.enabled ? 'disable' : 'enable', node)
            },
          }, () => h(Icon, { 
            name: node.enabled ? 'i-lucide-ban' : 'i-lucide-check-circle', 
            class: 'h-4 w-4' 
          })),
          
          // Delete button
          h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8',
            title: 'حذف',
            onClick: (e: Event) => {
              e.stopPropagation()
              onAction('delete', node)
            },
          }, () => h(Icon, { name: 'i-lucide-trash-2', class: 'h-4 w-4 text-destructive' })),
        ])
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
