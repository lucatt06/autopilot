'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton() {
  const router = useRouter()
  return (
    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )
}
