export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Autopilot</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu negocio inmobiliario en piloto automático
          </p>
        </div>
        {children}
      </div>
    </main>
  )
}
