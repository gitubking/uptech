'use client'

import { useActionState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Image from 'next/image'

function LoginForm() {
  const [state, action, isPending] = useActionState(login, null)
  const searchParams = useSearchParams()
  const message = searchParams.get('message')

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Card de connexion */}
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
            <CardTitle className="text-xl font-bold text-center text-gray-800">
              Connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">

              {/* Message de succès (ex: après définition du mot de passe) */}
              {message && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {/* Message d'erreur */}
              {state?.error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Adresse email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                  className="h-11 border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-11 border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {isPending ? 'Connexion en cours...' : 'Connexion'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-xs">
          © 2025 UP'TECH — Tous droits réservés
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
