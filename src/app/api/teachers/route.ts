import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function generateMatricule() {
  const db = createAdminClient()
  const year = new Date().getFullYear().toString()
  const { count } = await db.from('enseignants').select('*', { count: 'exact', head: true })
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  return `ENS${year}${seq}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const db = createAdminClient()
    const matricule = await generateMatricule()

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      specialite: (formData.get('specialite') as string) ?? '',
      type_contrat: (formData.get('type_contrat') as string) || 'vacataire',
      date_embauche: (formData.get('date_embauche') as string) || null,
      actif: true,
      matricule,
    }

    const { data: teacher, error } = await db
      .from('enseignants')
      .insert(data)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Créer le compte Auth avec le mot de passe défini par l'admin
    const password = (formData.get('password') as string) ?? ''
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe invalide (minimum 8 caractères)' }, { status: 400 })
    }

    const { data: authUser, error: createError } = await db.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { role: 'enseignant', nom: data.nom, prenom: data.prenom },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (authUser?.user) {
      // Le trigger on_auth_user_created crée le profil depuis user_metadata
      await db.from('enseignants').update({ user_id: authUser.user.id }).eq('id', teacher.id)
    }

    return NextResponse.json({ success: true, id: teacher.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const toggle = searchParams.get('toggle') === 'true'
    const resend = searchParams.get('resend') === 'true'
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    // Renvoi de l'invitation
    if (resend) {
      const db = createAdminClient()
      const { data: teacher } = await db.from('enseignants').select('email').eq('id', id).single()
      if (!teacher?.email) return NextResponse.json({ error: 'Enseignant introuvable' }, { status: 404 })

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://uptech-taupe.vercel.app'

      // Vérifier si l'utilisateur existe déjà dans Auth
      const { data: authUsers } = await db.auth.admin.listUsers()
      const existingUser = authUsers?.users?.find(u => u.email === teacher.email)

      // Si l'utilisateur n'existe pas encore, le créer (confirmé)
      if (!existingUser) {
        const { data: ens } = await db.from('enseignants').select('nom, prenom').eq('id', id).single()
        await db.auth.admin.createUser({
          email: teacher.email,
          email_confirm: true,
          user_metadata: { role: 'enseignant', nom: ens?.nom ?? '', prenom: ens?.prenom ?? '' },
        })
      }

      // Générer un magic link (fonctionne avec ou sans mot de passe)
      const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
        type: 'magiclink',
        email: teacher.email,
        options: { redirectTo: `${siteUrl}/update-password` },
      })
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 })

      const actionLink = linkData.properties?.action_link
      if (!actionLink) return NextResponse.json({ error: 'Impossible de générer le lien' }, { status: 500 })

      // Récupérer le nom de l'enseignant
      const { data: ens } = await db.from('enseignants').select('nom, prenom').eq('id', id).single()
      const nomComplet = ens ? `${ens.prenom} ${ens.nom}` : 'Enseignant'

      // Envoyer l'email via Resend
      const mailer = new Resend(process.env.RESEND_API_KEY)
      const { error: emailError } = await mailer.emails.send({
        from: 'UPTECH <onboarding@resend.dev>',
        to: teacher.email,
        subject: 'Votre accès à la plateforme UP\'TECH',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #111;">Bonjour ${nomComplet},</h2>
            <p style="color: #444; line-height: 1.6;">
              Votre compte enseignant sur la plateforme <strong>UP'TECH</strong> est prêt.
              Cliquez sur le bouton ci-dessous pour définir votre mot de passe et accéder à votre espace.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${actionLink}"
                style="background-color: #CC1F1F; color: white; padding: 14px 28px;
                       border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Accéder à mon espace
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">
              Ce lien est valable 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">© 2025 UP'TECH — Institut Supérieur de Formation</p>
          </div>
        `,
      })

      if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })

      return NextResponse.json({ success: true })
    }

    const formData = await request.formData()
    const db = createAdminClient()

    // Mode toggle : seulement le champ actif
    if (toggle) {
      const actif = formData.get('actif') === 'true'
      const { error } = await db.from('enseignants').update({ actif }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ success: true, id })
    }

    const data = {
      nom: (formData.get('nom') as string)?.toUpperCase() ?? '',
      prenom: (formData.get('prenom') as string) ?? '',
      email: (formData.get('email') as string) ?? '',
      telephone: (formData.get('telephone') as string) ?? '',
      specialite: (formData.get('specialite') as string) ?? '',
      type_contrat: (formData.get('type_contrat') as string) || 'vacataire',
      date_embauche: (formData.get('date_embauche') as string) || null,
      actif: formData.get('actif') === 'true',
    }

    const { error } = await db.from('enseignants').update(data).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true, id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const db = createAdminClient()

    // Récupérer l'email pour supprimer le compte Auth
    const { data: teacher } = await db.from('enseignants').select('email').eq('id', id).single()

    await db.from('enseignants').delete().eq('id', id)

    // Supprimer le compte Auth et le profil associé
    if (teacher?.email) {
      const { data: authUsers } = await db.auth.admin.listUsers()
      const authUser = authUsers?.users?.find(u => u.email === teacher.email)
      if (authUser) {
        await db.auth.admin.deleteUser(authUser.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
