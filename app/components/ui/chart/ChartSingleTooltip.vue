<script setup lang="ts">
import type { BulletLegendItemInterface } from '@unovis/ts'
import type { Component } from 'vue'
import { omit } from '@unovis/ts'
import { VisTooltip } from '@unovis/vue'
import { createApp, computed } from 'vue'
import { ChartTooltip } from '.'

type FieldConfig = string | { key: string; label?: string }

const props = defineProps<{
  selector: string
  index: string
  items?: BulletLegendItemInterface[]
  valueFormatter?: (tick: number, i?: number, ticks?: number[]) => string
  customTooltip?: Component
  titleKey?: string
  fields?: FieldConfig[]
}>()

const titleKey = computed(() => props.titleKey ?? props.index)
const normalizedFields = computed(() => props.fields?.map(field => typeof field === 'string' ? { key: field, label: undefined } : field) ?? null)

const resolveColor = (elements: (HTMLElement | SVGElement)[], index: number, fallback?: string) => {
  const element = elements?.[index]
  if (!element) return fallback
  const style = getComputedStyle(element)
  return style.fill || fallback
}

// Use weakmap to store reference to each datapoint for Tooltip
const wm = new WeakMap()
function template(d: any, i: number, elements: (HTMLElement | SVGElement)[]) {
  const valueFormatter = props.valueFormatter ?? ((tick: number) => `${tick}`)
  if (props.index in d) {
    if (wm.has(d)) {
      return wm.get(d)
    }
    else {
      const componentDiv = document.createElement('div')
      const fields = normalizedFields.value
      const entries = fields
        ? fields.map(field => ({ key: field.key, label: field.label ?? field.key }))
        : Object.entries(omit(d, [props.index])).map(([key]) => ({ key, label: key }))
      const omittedData = entries
        .map(entry => {
          const rawValue = d[entry.key] ?? d.data?.[entry.key]
          const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue ?? NaN)
          const formattedValue = Number.isFinite(numericValue)
            ? valueFormatter(numericValue)
            : (rawValue ?? '')
          const legendReference = props.items?.find(item => item.name === entry.label)
          const color = legendReference?.color ?? resolveColor(elements, i)
          return {
            ...legendReference,
            color,
            name: entry.label,
            value: formattedValue,
          }
        })
        .filter(item => item.name && item.value !== '')
      const TooltipComponent = props.customTooltip ?? ChartTooltip
      const resolvedTitle = d[titleKey.value] ?? d.data?.[titleKey.value] ?? d[props.index]
      createApp(TooltipComponent, { title: resolvedTitle, data: omittedData }).mount(componentDiv)
      wm.set(d, componentDiv.innerHTML)
      return componentDiv.innerHTML
    }
  }

  else {
    const data = d.data

    if (wm.has(data)) {
      return wm.get(data)
    }
    else {
      const style = getComputedStyle(elements[i]!)
      const numericValue = typeof data[props.index] === 'number' ? data[props.index] : Number(data[props.index] ?? NaN)
      const omittedData = [{
        name: data.name ?? data[titleKey.value],
        value: Number.isFinite(numericValue) ? valueFormatter(numericValue) : `${data[props.index] ?? ''}`,
        color: style.fill,
      }]
      const componentDiv = document.createElement('div')
      const TooltipComponent = props.customTooltip ?? ChartTooltip
      const resolvedTitle = data[titleKey.value] ?? d[titleKey.value] ?? data.name ?? d[props.index]
      createApp(TooltipComponent, { title: resolvedTitle, data: omittedData }).mount(componentDiv)
      wm.set(d, componentDiv.innerHTML)
      return componentDiv.innerHTML
    }
  }
}
</script>

<template>
  <VisTooltip
    :horizontal-shift="20" :vertical-shift="20" :triggers="{
      [selector]: template,
    }"
  />
</template>
