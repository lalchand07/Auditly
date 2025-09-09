'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function signup(formData: FormData) {
  const origin = headers().get('origin')
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    // TODO: This should be a more user-friendly error message.
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  // Redirect to a page that tells the user to check their email
  return redirect('/signup/success?message=Check your email to confirm your account')
}
