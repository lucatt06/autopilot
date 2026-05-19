'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createServerClient } from '@/lib/supabase/server'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

export async function signInWithEmail(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { ok: false, error: 'Email o contraseña incorrectos' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signInWithGoogle(): Promise<ActionResult> {
  const supabase = createServerClient()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { ok: false, error: 'No se pudo iniciar sesión con Google' }
  }

  if (data.url) redirect(data.url)
  return { ok: true }
}

export async function signOut(): Promise<void> {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Email inválido' }
  }

  const supabase = createServerClient()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // We intentionally don't surface "user not found" — security best practice.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password`,
  })

  return { ok: true }
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Datos inválidos', field: issue?.path[0] as string }
  }

  const supabase = createServerClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
