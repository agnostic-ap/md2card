import { useRef, useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type SliderFieldProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  /** Format number for display, e.g. 0.85 → "85%" */
  fmt: (v: number) => string
  /** Parse edited string back to number; return null to reject */
  parse: (s: string) => number | null
  /** Optional quick-select preset values shown below slider */
  presets?: number[]
  onChange: (v: number) => void
  className?: string
}

export function SliderField({
  label, value, min, max, step, fmt, parse, presets, onChange, className,
}: SliderFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(fmt(value).replace(/[^0-9.-]/g, ''))
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    const v = parse(draft)
    if (v !== null) onChange(v)
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="h-6 w-14 rounded border border-(--border) bg-transparent px-1.5 text-right text-xs text-(--foreground) transition-colors focus:border-(--accent-ui) focus:outline-none"
          value={editing ? draft : fmt(value)}
          onFocus={startEdit}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') inputRef.current?.blur()
            if (e.key === 'Escape') { setEditing(false); inputRef.current?.blur() }
          }}
        />
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v ?? value)}
      />
      {presets && presets.length > 0 && (
        <div className="flex justify-end gap-1">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] transition-colors',
                Math.abs(value - p) < step * 0.6
                  ? 'bg-(--accent-ui)/15 text-(--accent-ui)'
                  : 'text-(--muted-foreground) hover:bg-(--border)/50 hover:text-(--foreground)',
              )}
            >
              {fmt(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
