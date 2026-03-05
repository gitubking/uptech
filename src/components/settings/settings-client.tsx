'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Calendar, UserCircle,
  GraduationCap, Banknote,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type AnneeRow = {
  id: string; libelle: string; date_debut: string; date_fin: string; actif: boolean
}
type ProfileRow = {
  id: string; nom: string; prenom: string; email: string; telephone?: string; role: string
}
type TypeFormationRow = {
  id: string
  nom: string
  code: string
  description?: string | null
  tarif_horaire: number
  methode_paiement: 'horaire' | 'forfait_seance' | 'mensuel'
  actif: boolean
}

interface Props {
  annees: AnneeRow[]
  profile: ProfileRow | null
  userEmail: string
  typeFormations: TypeFormationRow[]
}

const METHODE_LABELS: Record<string, string> = {
  horaire: 'Taux horaire',
  forfait_seance: 'Forfait par séance',
  mensuel: 'Forfait mensuel',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SettingsClient({ annees: initialAnnees, profile, userEmail, typeFormations: initialTypes }: Props) {
  const router = useRouter()

  // ── Années académiques ──
  const [annees, setAnnees] = useState(initialAnnees)
  const [anneeDialog, setAnneeDialog] = useState<{ mode: 'create' } | { mode: 'edit'; data: AnneeRow } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Profil ──
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // ── Types de formation ──
  const [typeFormations, setTypeFormations] = useState(initialTypes)
  const [typeDialog, setTypeDialog] = useState<{ mode: 'create' } | { mode: 'edit'; data: TypeFormationRow } | null>(null)
  const [typeDeleteConfirm, setTypeDeleteConfirm] = useState<string | null>(null)
  const [typeLoading, setTypeLoading] = useState(false)
  const [typeFormError, setTypeFormError] = useState<string | null>(null)
  const [formMethode, setFormMethode] = useState<string>('horaire')

  // ── Handlers Années ──────────────────────────────────────────────────────

  async function handleAnneeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      libelle: formData.get('libelle') as string,
      date_debut: formData.get('date_debut') as string,
      date_fin: formData.get('date_fin') as string,
      actif: formData.get('actif') === 'true',
    }

    const isEdit = anneeDialog?.mode === 'edit'
    const id = isEdit ? anneeDialog.data.id : null
    const url = isEdit ? `/api/settings?type=annee&id=${id}` : '/api/settings'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'annee', ...data }),
      })
      const result = await res.json()
      if (result.error) {
        setFormError(result.error)
      } else {
        setAnneeDialog(null)
        router.refresh()
      }
    } catch {
      setFormError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/settings?type=annee&id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.error) {
        alert(result.error)
      } else {
        setDeleteConfirm(null)
        router.refresh()
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  async function handleActivate(id: string) {
    try {
      await fetch(`/api/settings?type=annee&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'annee', actif: true }),
      })
      router.refresh()
    } catch {
      alert("Erreur lors de l'activation")
    }
  }

  // ── Handlers Profil ──────────────────────────────────────────────────────

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return
    setLoading(true)
    setProfileError(null)
    setProfileSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      nom: (formData.get('nom') as string).toUpperCase(),
      prenom: formData.get('prenom') as string,
      telephone: formData.get('telephone') as string,
    }

    try {
      const res = await fetch(`/api/settings?type=profile&id=${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', ...data }),
      })
      const result = await res.json()
      if (result.error) {
        setProfileError(result.error)
      } else {
        setProfileSuccess(true)
        router.refresh()
        setTimeout(() => setProfileSuccess(false), 3000)
      }
    } catch {
      setProfileError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers Types de formation ──────────────────────────────────────────

  async function handleTypeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setTypeLoading(true)
    setTypeFormError(null)

    const formData = new FormData(e.currentTarget)
    const body = {
      nom: formData.get('nom') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      tarif_horaire: formData.get('tarif_horaire') as string,
      methode_paiement: formMethode,
      actif: true,
    }

    const isEdit = typeDialog?.mode === 'edit'
    const url = isEdit ? `/api/type-formations?id=${typeDialog.data.id}` : '/api/type-formations'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.error) {
        setTypeFormError(result.error)
      } else {
        if (isEdit) {
          setTypeFormations((prev) => prev.map((t) => t.id === result.id ? result : t))
        } else {
          setTypeFormations((prev) => [...prev, result])
        }
        setTypeDialog(null)
      }
    } catch {
      setTypeFormError('Erreur réseau')
    } finally {
      setTypeLoading(false)
    }
  }

  async function handleTypeDelete(id: string) {
    try {
      const res = await fetch(`/api/type-formations?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.error) {
        alert(result.error)
      } else {
        setTypeDeleteConfirm(null)
        setTypeFormations((prev) => prev.filter((t) => t.id !== id))
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  function openTypeCreate() {
    setTypeDialog({ mode: 'create' })
    setTypeFormError(null)
    setFormMethode('horaire')
  }

  function openTypeEdit(data: TypeFormationRow) {
    setTypeDialog({ mode: 'edit', data })
    setTypeFormError(null)
    setFormMethode(data.methode_paiement)
  }

  // ── Constantes ────────────────────────────────────────────────────────────

  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Administrateur',
    directeur: 'Directeur',
    responsable_pedagogique: 'Resp. Pédagogique',
    enseignant: 'Enseignant',
    etudiant: 'Étudiant',
    agent_comptable: 'Agent Comptable',
    secretaire: 'Secrétaire',
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1">Configuration du système et profil utilisateur</p>
      </div>

      <Tabs defaultValue="annees">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="annees" className="gap-2">
            <Calendar className="h-4 w-4" />
            Années académiques
          </TabsTrigger>
          <TabsTrigger value="types" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Types de formation
            <Badge variant="secondary" className="ml-1 text-xs">{typeFormations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <UserCircle className="h-4 w-4" />
            Mon profil
          </TabsTrigger>
        </TabsList>

        {/* ── ANNÉES ACADÉMIQUES ── */}
        <TabsContent value="annees" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button
              onClick={() => { setAnneeDialog({ mode: 'create' }); setFormError(null) }}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Nouvelle année
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Libellé</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Début</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Fin</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {annees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">Aucune année académique</td>
                  </tr>
                )}
                {annees.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-900">{a.libelle}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {a.date_debut ? new Date(a.date_debut).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {a.date_fin ? new Date(a.date_fin).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {a.actif ? (
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active</Badge>
                      ) : (
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => handleActivate(a.id)}
                        >
                          Activer
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirm === a.id ? (
                          <>
                            <Button variant="destructive" size="sm" className="h-7 text-xs"
                              onClick={() => handleDelete(a.id)}>
                              Confirmer
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs"
                              onClick={() => setDeleteConfirm(null)}>
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => { setAnneeDialog({ mode: 'edit', data: a }); setFormError(null) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(a.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── TYPES DE FORMATION ── */}
        <TabsContent value="types" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Définissez les types de formation et leur tarif de rémunération des enseignants.
            </p>
            <Button onClick={openTypeCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shrink-0">
              <Plus className="h-4 w-4" /> Nouveau type
            </Button>
          </div>

          {typeFormations.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <GraduationCap className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="font-medium text-amber-800">Table &quot;type_formations&quot; non disponible</p>
              <p className="text-sm text-amber-700 mt-1 max-w-sm mx-auto">
                Exécutez la migration SQL{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">003_type_formations.sql</code>{' '}
                dans le{' '}
                <a
                  href="https://supabase.com/dashboard/project/gpikjvprlwjfdtwuonwc/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  SQL Editor Supabase ↗
                </a>
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {typeFormations.map((tf) => (
                <div key={tf.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {tf.code}
                        </span>
                        {!tf.actif && (
                          <Badge variant="secondary" className="text-xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{tf.nom}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => openTypeEdit(tf)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {typeDeleteConfirm === tf.id ? (
                        <div className="flex items-center gap-1">
                          <Button variant="destructive" size="sm" className="h-7 text-xs px-2"
                            onClick={() => handleTypeDelete(tf.id)}>
                            Oui
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2"
                            onClick={() => setTypeDeleteConfirm(null)}>
                            Non
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setTypeDeleteConfirm(tf.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="px-5 py-3 space-y-2">
                    {tf.description && (
                      <p className="text-xs text-gray-500 leading-relaxed">{tf.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-gray-900 text-sm">
                        {Number(tf.tarif_horaire).toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-xs text-gray-500">
                        / {tf.methode_paiement === 'horaire' ? 'heure'
                          : tf.methode_paiement === 'forfait_seance' ? 'séance'
                          : 'mois'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-500">
                      {METHODE_LABELS[tf.methode_paiement] ?? tf.methode_paiement}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── PROFIL ── */}
        <TabsContent value="profile" className="mt-4">
          {!profile ? (
            <div className="p-5 text-center text-gray-400">Profil introuvable</div>
          ) : (
            <div className="max-w-lg">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                    {profile.prenom[0]}{profile.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile.prenom} {profile.nom}</p>
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 mt-1">
                      {ROLE_LABELS[profile.role] ?? profile.role}
                    </Badge>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="nom">Nom</Label>
                      <Input id="nom" name="nom" defaultValue={profile.nom} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="prenom">Prénom</Label>
                      <Input id="prenom" name="prenom" defaultValue={profile.prenom} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email_ro">Adresse e-mail</Label>
                    <Input id="email_ro" defaultValue={userEmail || profile.email} disabled
                      className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                    <p className="text-xs text-gray-400">L&apos;e-mail ne peut pas être modifié ici.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" name="telephone" defaultValue={profile.telephone ?? ''} placeholder="+243 8xx xxx xxx" />
                  </div>

                  {profileError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Profil mis à jour avec succès !
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full">
                    <CheckCircle2 className="h-4 w-4" />
                    {loading ? 'Enregistrement…' : 'Sauvegarder le profil'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── DIALOG Année ── */}
      <Dialog open={!!anneeDialog} onOpenChange={(open) => { if (!open) setAnneeDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {anneeDialog?.mode === 'create' ? 'Nouvelle année académique' : "Modifier l'année académique"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAnneeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="libelle">Libellé *</Label>
              <Input id="libelle" name="libelle" required placeholder="2025-2026"
                defaultValue={anneeDialog?.mode === 'edit' ? anneeDialog.data.libelle : ''} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date_debut">Date de début *</Label>
                <Input id="date_debut" name="date_debut" type="date" required
                  defaultValue={anneeDialog?.mode === 'edit' ? anneeDialog.data.date_debut?.split('T')[0] : ''} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_fin">Date de fin *</Label>
                <Input id="date_fin" name="date_fin" type="date" required
                  defaultValue={anneeDialog?.mode === 'edit' ? anneeDialog.data.date_fin?.split('T')[0] : ''} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="actif" name="actif" value="true"
                className="h-4 w-4 rounded border-gray-300"
                defaultChecked={anneeDialog?.mode === 'edit' ? anneeDialog.data.actif : false} />
              <Label htmlFor="actif" className="cursor-pointer">Définir comme année active</Label>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAnneeDialog(null)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {loading ? 'Enregistrement…' : anneeDialog?.mode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG Type de formation ── */}
      <Dialog open={!!typeDialog} onOpenChange={(open) => { if (!open) setTypeDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {typeDialog?.mode === 'create' ? 'Nouveau type de formation' : 'Modifier le type de formation'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tf_code">Code *</Label>
                <Input
                  id="tf_code" name="code" required
                  placeholder="ACADEMIQUE" className="uppercase"
                  defaultValue={typeDialog?.mode === 'edit' ? typeDialog.data.code : ''}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tf_tarif">Tarif (FC) *</Label>
                <Input
                  id="tf_tarif" name="tarif_horaire" type="number"
                  min={0} step={500} required placeholder="5000"
                  defaultValue={typeDialog?.mode === 'edit' ? typeDialog.data.tarif_horaire : ''}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf_nom">Nom complet *</Label>
              <Input
                id="tf_nom" name="nom" required placeholder="Formation Académique"
                defaultValue={typeDialog?.mode === 'edit' ? typeDialog.data.nom : ''}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Méthode de paiement *</Label>
              <Select value={formMethode} onValueChange={setFormMethode}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horaire">Taux horaire (par heure dispensée)</SelectItem>
                  <SelectItem value="forfait_seance">Forfait par séance</SelectItem>
                  <SelectItem value="mensuel">Forfait mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tf_desc">Description</Label>
              <Input
                id="tf_desc" name="description" placeholder="Description optionnelle"
                defaultValue={typeDialog?.mode === 'edit' ? (typeDialog.data.description ?? '') : ''}
              />
            </div>

            {typeFormError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {typeFormError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTypeDialog(null)} disabled={typeLoading}>
                Annuler
              </Button>
              <Button type="submit" disabled={typeLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {typeLoading ? 'Enregistrement…' : typeDialog?.mode === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
