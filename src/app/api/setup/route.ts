import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// Route temporaire pour réinitialiser un mot de passe
// Supprimer ce fichier après utilisation
export async function POST(request: NextRequest) {
  const { email, newPassword, secret } = await request.json()

  if (secret !== process.env.RESET_SECRET && secret !== 'uptech-reset-2025') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!email || !newPassword) {
    return NextResponse.json({ error: 'email et newPassword requis' }, { status: 400 })
  }

  const db = createAdminClient()

  const { data: { users }, error: listError } = await db.auth.admin.listUsers()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const user = users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: `Utilisateur "${email}" introuvable` }, { status: 404 })

  const { error: updateError } = await db.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, message: `Mot de passe mis à jour pour ${email}` })
}
