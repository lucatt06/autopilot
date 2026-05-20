'use client'

import { useState, useRef, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface PriceInputProps {
  /** Field name for native form submission (adds a hidden input) */
  name?: string
  id?: string
  /** Uncontrolled initial value */
  defaultValue?: number
  /** Controlled value */
  value?: number
  /** Called on every change with the parsed number (or undefined if empty) */
  onValueChange?: (value: number | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

const fmt = (n: number | undefined): string =>
  n != null && !isNaN(n)
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
    : ''

const digitsOnly = (s: string) => s.replace(/[^\d]/g, '')

export function PriceInput({
  name,
  id,
  defaultValue,
  value,
  onValueChange,
  placeholder = '0',
  className,
  disabled,
  required,
}: PriceInputProps) {
  const isControlled = value !== undefined
  const [display, setDisplay] = useState<string>(() =>
    fmt(isControlled ? value : defaultValue),
  )
  const prevValueRef = useRef<number | undefined>(isControlled ? value : defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)

  // Sync controlled value changes coming from outside
  useEffect(() => {
    if (isControlled && value !== prevValueRef.current) {
      prevValueRef.current = value
      setDisplay(fmt(value))
      if (hiddenRef.current) hiddenRef.current.value = value != null ? String(value) : ''
    }
  }, [isControlled, value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const cursorPos = el.selectionStart ?? 0

    // Count how many digits are before the cursor in the current raw string
    const digitsBeforeCursor = digitsOnly(el.value.slice(0, cursorPos)).length

    // Strip all non-digit characters and format with commas
    const digits = digitsOnly(el.value)
    const formatted = digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''

    setDisplay(formatted)

    // Restore cursor: find position in formatted string after the same number of digits
    let newCursor = formatted.length
    let counted = 0
    for (let i = 0; i < formatted.length; i++) {
      if (counted === digitsBeforeCursor) {
        newCursor = i
        break
      }
      if (formatted[i] !== ',') counted++
    }

    // Apply after React re-renders
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(newCursor, newCursor)
    })

    const parsed = digits ? parseInt(digits, 10) : undefined
    prevValueRef.current = parsed
    if (hiddenRef.current) hiddenRef.current.value = parsed != null ? String(parsed) : ''
    onValueChange?.(parsed)
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />
      {name && (
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          defaultValue={
            (isControlled ? value : defaultValue) != null
              ? String(isControlled ? value : defaultValue)
              : ''
          }
        />
      )}
    </>
  )
}
