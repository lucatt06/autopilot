import { Construction } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface StubPageProps {
  title: string
  phase: string
  description?: string
}

/**
 * Placeholder page for modules whose UI is not yet implemented.
 * Replace with the real page when its phase arrives.
 */
export function StubPage({ title, phase, description }: StubPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-orange-100 p-2 text-orange-700">
              <Construction className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">En construcción</CardTitle>
              <CardDescription>
                Esta pantalla se implementará en <span className="font-medium">Fase {phase}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          La estructura del menú ya está lista — el contenido funcional viene en su fase
          correspondiente del plan de construcción (Doc 3 §11).
        </CardContent>
      </Card>
    </div>
  )
}
