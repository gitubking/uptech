'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, User, Phone, Briefcase, KeyRound } from 'lucide-react'

interface Props {
  defaultValues?: Record<string, string>
  teacherId?: string
}

export function TeacherForm({ defaultValues, teacherId }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [type_contrat, setTypeContrat] = useState(defaultValues?.type_contrat ?? 'vacataire')
  const [actif, setActif] = useState(defaultValues?.actif ?? 'true')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validation mot de passe à la création
    if (!teacherId) {
      const formData = new FormData(e.currentTarget)
      const pwd = formData.get('password') as string
      const pwdConfirm = formData.get('password_confirm') as string
      if (pwd !== pwdConfirm) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
    }

    setIsPending(true)
    try {
      const formData = new FormData(e.currentTarget)
      const url = teacherId ? `/api/teachers?id=${teacherId}` : '/api/teachers'
      const method = teacherId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        if (data.inviteError) {
          setError(`Enseignant créé, mais invitation email échouée : ${data.inviteError}`)
        }
        router.push(teacherId ? `/teachers/${teacherId}` : `/teachers/${data.id}`)
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Erreur globale */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Champs cachés */}
      <input type="hidden" name="type_contrat" value={type_contrat} />
      <input type="hidden" name="actif" value={actif} />

      {/* Informations personnelles */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom" name="nom" placeholder="NOM"
                defaultValue={defaultValues?.nom}
                required className="h-10 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prenom" name="prenom" placeholder="Prénom"
                defaultValue={defaultValues?.prenom}
                required className="h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="specialite" className="text-sm font-medium text-gray-700">
              Spécialité / Domaine d&apos;enseignement
            </Label>
            <Input
              id="specialite" name="specialite"
              placeholder="ex: Informatique, Mathématiques, Gestion..."
              defaultValue={defaultValues?.specialite}
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-600" />
            Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email professionnel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email" name="email" type="email"
                placeholder="enseignant@uptech.cd"
                defaultValue={defaultValues?.email}
                required className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                Téléphone
              </Label>
              <Input
                id="telephone" name="telephone"
                placeholder="+243 XXX XXX XXX"
                defaultValue={defaultValues?.telephone}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mot de passe — uniquement à la création */}
      {!teacherId && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-red-600" />
              Accès à la plateforme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password" name="password" type="password"
                  placeholder="Minimum 8 caractères"
                  required minLength={8} className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password_confirm" className="text-sm font-medium text-gray-700">
                  Confirmer le mot de passe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password_confirm" name="password_confirm" type="password"
                  placeholder="Répétez le mot de passe"
                  required minLength={8} className="h-10"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Communiquez ce mot de passe à l&apos;enseignant. Il pourra le modifier depuis son espace.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contrat */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-purple-600" />
            Informations contractuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Type de contrat <span className="text-red-500">*</span>
              </Label>
              <Select value={type_contrat} onValueChange={setTypeContrat}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="vacataire">Vacataire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_embauche" className="text-sm font-medium text-gray-700">
                Date d&apos;embauche
              </Label>
              <Input
                id="date_embauche" name="date_embauche" type="date"
                defaultValue={defaultValues?.date_embauche}
                className="h-10"
              />
            </div>
          </div>

          {teacherId && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Statut</Label>
                <Select value={actif} onValueChange={setActif}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Actif</SelectItem>
                    <SelectItem value="false">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-blue-700 hover:bg-blue-800 text-white min-w-32"
        >
          {isPending
            ? 'Enregistrement...'
            : teacherId ? 'Mettre à jour' : 'Ajouter l\'enseignant'}
        </Button>
      </div>
    </form>
  )
}
