'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // email_redirect_to is not strictly required for the MVP,
      // but good practice to include. It tells Supabase where to
      // redirect the user after they click the confirmation link.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect('/signup?error=Could not authenticate user')
  }

  // Redirect to a page that tells the user to check their email.
  redirect('/signup/success')
}
