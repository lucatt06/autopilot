'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  total: number
  page: number
  pageSize: number
}

export function ContactsPagination({ total, page, pageSize }: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function goTo(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (newPage === 1) params.delete('page')
    else params.set('page', String(newPage))
    startTransition(() => router.replace(`?${params.toString()}`))
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{from}-{to}</span> de{' '}
        <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1 || isPending}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages || isPending}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
