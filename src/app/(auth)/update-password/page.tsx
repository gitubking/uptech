'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, KeyRound, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const initSession = async () => {
      // PKCE flow: le token est dans ?code=
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError('Lien invalide ou expiré. Demandez une nouvelle invitation.')
        } else {
          setSessionReady(true)
        }
        setChecking(false)
        return
      }

      // Hash-based flow: les tokens sont dans le hash #access_token=...
      // createBrowserClient les détecte automatiquement via getSession()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setSessionReady(true)
      } else {
        // Écouter le changement d'état auth (le client échange le hash automatiquement)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
          if (s) {
            setSessionReady(true)
            setChecking(false)
            subscription.unsubscribe()
          }
        })
        // Timeout si aucune session après 3s
        setTimeout(() => {
          setChecking(false)
          subscription.unsubscribe()
        }, 3000)
        return
      }
      setChecking(false)
    }

    initSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsPending(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsPending(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-4 pb-4 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="UP'TECH"
              width={200}
              height={80}
              className="object-contain"
              priority
            />
            <div className="flex flex-col items-center gap-1">
              <div className="bg-red-50 rounded-full p-2">
                <KeyRound className="h-5 w-5 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-center text-gray-800">
                Définir votre mot de passe
              </CardTitle>
              <p className="text-sm text-gray-500 text-center">
                Bienvenue sur UP&apos;TECH. Choisissez un mot de passe pour accéder à votre espace.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {checking ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Vérification du lien…</p>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="bg-green-50 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-semibold text-gray-800">Mot de passe enregistré !</p>
                <p className="text-sm text-gray-500">Redirection vers votre tableau de bord…</p>
              </div>
            ) : !sessionReady ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error || 'Lien invalide ou expiré. Demandez une nouvelle invitation.'}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-gray-700 font-medium">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Répétez le mot de passe"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    className="h-11 border-gray-200 focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-11 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  {isPending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-xs">
          © 2025 UP&apos;TECH — Tous droits réservés
        </p>
      </div>
    </div>
  )
}
