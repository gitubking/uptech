'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: 'Email ou mot de passe incorrect.' }
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', authData.user.id)
    .single()

  // Fallback : si pas de profil, vérifier si c'est un enseignant par email
  if (!profile) {
    const { data: enseignant } = await supabase
      .from('enseignants')
      .select('id, nom, prenom')
      .eq('email', authData.user.email ?? '')
      .single()

    if (enseignant) {
      // Créer le profil manquant
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          role: 'enseignant',
          nom: enseignant.nom,
          prenom: enseignant.prenom,
          email: authData.user.email,
        })
        .select('role')
        .single()
      profile = newProfile
    }
  }

  revalidatePath('/', 'layout')
  if (profile?.role === 'enseignant') {
    redirect('/enseignant/dashboard')
  }
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return profile
}
