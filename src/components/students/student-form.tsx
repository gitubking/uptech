'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, User, Phone, BookOpen, GraduationCap } from 'lucide-react'

interface Props {
  filieres: { id: string; nom: string; code: string; type_formation?: string | null; nb_mensualites?: number | null }[]
  niveaux: { id: string; nom: string; filiere_id: string; ordre: number }[]
  annees: { id: string; libelle: string }[]
  defaultValues?: Record<string, string>
  studentId?: string
}

export function StudentForm({ filieres, niveaux, annees, defaultValues, studentId }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiliere, setSelectedFiliere] = useState(defaultValues?.filiere_id ?? '')
  const [filiere_id, setFiliereId] = useState(defaultValues?.filiere_id ?? '')
  const [niveau_id, setNiveauId] = useState(defaultValues?.niveau_id ?? '')
  const [annee_id, setAnneeId] = useState(defaultValues?.annee_academique_id ?? (annees[0]?.id ?? ''))
  const [sexe, setSexe] = useState(defaultValues?.sexe ?? '')
  const [statut, setStatut] = useState(defaultValues?.statut ?? 'preinscrit')
  const [niveauEntree, setNiveauEntree] = useState(defaultValues?.niveau_entree ?? 'bfem')

  const [typeFormation, setTypeFormation] = useState(() => {
    if (!defaultValues?.filiere_id) return ''
    return filieres.find(f => f.id === defaultValues.filiere_id)?.type_formation ?? ''
  })

  const selectedFiliereData = filieres.find(f => f.id === selectedFiliere)
  const isAcademique = !selectedFiliereData || selectedFiliereData.type_formation === 'academique' || !selectedFiliereData.type_formation
  const filteredFilieres = typeFormation ? filieres.filter(f => f.type_formation === typeFormation) : []
  const filteredNiveaux = niveaux.filter(n => n.filiere_id === selectedFiliere)

  const TYPE_LABELS: Record<string, string> = {
    academique: 'Académique',
    certifiante: 'Certifiante',
    acceleree: 'Accélérée',
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const formData = new FormData(e.currentTarget)
      const url = studentId ? `/api/students?id=${studentId}` : '/api/students'
      const method = studentId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: formData })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        router.push(studentId ? `/students/${studentId}` : `/students/${data.id}`)
      }
    } catch {
      setError('Une erreur est survenue.')
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
      <input type="hidden" name="filiere_id" value={filiere_id} />
      <input type="hidden" name="niveau_id" value={niveau_id} />
      <input type="hidden" name="annee_academique_id" value={annee_id} />
      <input type="hidden" name="sexe" value={sexe} />
      <input type="hidden" name="statut" value={statut} />
      <input type="hidden" name="niveau_entree" value={niveauEntree} />

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
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom <span className="text-red-500">*</span></Label>
              <Input id="nom" name="nom" placeholder="NOM" defaultValue={defaultValues?.nom}
                required className="h-10 uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">Prénom <span className="text-red-500">*</span></Label>
              <Input id="prenom" name="prenom" placeholder="Prénom" defaultValue={defaultValues?.prenom}
                required className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Sexe <span className="text-red-500">*</span></Label>
              <Select value={sexe} onValueChange={setSexe} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date_naissance" className="text-sm font-medium text-gray-700">Date de naissance <span className="text-red-500">*</span></Label>
              <Input id="date_naissance" name="date_naissance" type="date"
                defaultValue={defaultValues?.date_naissance} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lieu_naissance" className="text-sm font-medium text-gray-700">Lieu de naissance</Label>
              <Input id="lieu_naissance" name="lieu_naissance" placeholder="Ville"
                defaultValue={defaultValues?.lieu_naissance} className="h-10" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nationalite" className="text-sm font-medium text-gray-700">Nationalité</Label>
              <Input id="nationalite" name="nationalite" placeholder="Congolaise"
                defaultValue={defaultValues?.nationalite ?? 'Congolaise'} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">Adresse</Label>
              <Input id="adresse" name="adresse" placeholder="Adresse complète"
                defaultValue={defaultValues?.adresse} className="h-10" />
            </div>
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
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
              <Input id="email" name="email" type="email" placeholder="etudiant@email.com"
                defaultValue={defaultValues?.email} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">Téléphone</Label>
              <Input id="telephone" name="telephone" placeholder="+243 XXX XXX XXX"
                defaultValue={defaultValues?.telephone} className="h-10" />
            </div>
          </div>

          <Separator />
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contact parent / tuteur</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telephone_parent" className="text-sm font-medium text-gray-700">Téléphone parent</Label>
              <Input id="telephone_parent" name="telephone_parent" placeholder="+243 XXX XXX XXX"
                defaultValue={defaultValues?.telephone_parent} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email_parent" className="text-sm font-medium text-gray-700">Email parent</Label>
              <Input id="email_parent" name="email_parent" type="email" placeholder="parent@email.com"
                defaultValue={defaultValues?.email_parent} className="h-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inscription académique */}
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            Inscription académique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Type de formation <span className="text-red-500">*</span></Label>
              <Select
                value={typeFormation}
                onValueChange={(v) => {
                  setTypeFormation(v)
                  setFiliereId('')
                  setSelectedFiliere('')
                  setNiveauId('')
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Filière <span className="text-red-500">*</span></Label>
              <Select
                value={filiere_id}
                onValueChange={(v) => { setFiliereId(v); setSelectedFiliere(v); setNiveauId('') }}
                disabled={!typeFormation}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={typeFormation ? 'Choisir une filière' : "Choisir d'abord un type"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredFilieres.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAcademique && filiere_id && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Niveau <span className="text-red-500">*</span></Label>
              <Select value={niveau_id} onValueChange={setNiveauId} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {filteredNiveaux.map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isAcademique && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Niveau d'entrée <span className="text-red-500">*</span></Label>
              <Select value={niveauEntree} onValueChange={setNiveauEntree} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Niveau d'entrée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_diplome">Non diplômé → DAP</SelectItem>
                  <SelectItem value="sixieme">Niveau 6ème → DAP</SelectItem>
                  <SelectItem value="bfem">BFEM → DT</SelectItem>
                  <SelectItem value="bac">BAC → Licence (LMD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Année académique <span className="text-red-500">*</span></Label>
              <Select value={annee_id} onValueChange={setAnneeId} required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Choisir une année" />
                </SelectTrigger>
                <SelectContent>
                  {annees.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Statut</Label>
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preinscrit">Préinscrit</SelectItem>
                  <SelectItem value="inscrit">Inscrit</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isPending || !filiere_id || (isAcademique && !niveau_id) || !annee_id || !sexe}
          className="bg-blue-700 hover:bg-blue-800 text-white min-w-32"
        >
          {isPending ? 'Enregistrement...' : studentId ? 'Mettre à jour' : 'Inscrire l\'étudiant'}
        </Button>
      </div>
    </form>
  )
}
