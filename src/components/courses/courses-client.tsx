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
import Link from 'next/link'
import {
  Plus, Pencil, Trash2, BookOpen, Layers, GraduationCap, AlertCircle, CheckCircle2,
  Users, ExternalLink,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type FiliereRow = {
  id: string; nom: string; code: string; actif: boolean
  description?: string; duree_annees?: number
  type_formation_id?: string | null
}
type TypeFormationSimple = {
  id: string; nom: string; code: string
  tarif_horaire: number; methode_paiement: string
}
type NiveauRow = {
  id: string; nom: string; filiere_id: string; ordre: number
  filiere: { id: string; nom: string; code: string } | null
}
type MatiereRow = {
  id: string; code: string; nom: string; coefficient: number; credit: number
  semestre: number; volume_horaire?: number; filiere_id: string; niveau_id: string
  enseignant_id?: string
  filiere: { id: string; nom: string; code: string } | null
  niveau: { id: string; nom: string } | null
  enseignant: { id: string; nom: string; prenom: string } | null
}
type EnseignantSimple = { id: string; nom: string; prenom: string }
type EtudiantSimple = {
  id: string; matricule: string; nom: string; prenom: string; statut: string
  filiere_id: string; niveau_id: string
  filiere: { id: string; code: string; nom: string } | null
  niveau: { id: string; nom: string; ordre?: number } | null
}

interface Props {
  filieres: FiliereRow[]
  niveaux: NiveauRow[]
  matieres: MatiereRow[]
  enseignants: EnseignantSimple[]
  etudiants: EtudiantSimple[]
  typeFormations: TypeFormationSimple[]
}

type DialogState =
  | { type: 'filiere'; mode: 'create' }
  | { type: 'filiere'; mode: 'edit'; data: FiliereRow }
  | { type: 'niveau'; mode: 'create' }
  | { type: 'niveau'; mode: 'edit'; data: NiveauRow }
  | { type: 'matiere'; mode: 'create' }
  | { type: 'matiere'; mode: 'edit'; data: MatiereRow }

// ─── Component ───────────────────────────────────────────────────────────────

export function CoursesClient({ filieres, niveaux, matieres, enseignants, etudiants, typeFormations }: Props) {
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // For filtering niveaux in matière form
  const [formFiliereId, setFormFiliereId] = useState<string>('')
  const [formNiveauId, setFormNiveauId] = useState<string>('')
  const [formEnseignantId, setFormEnseignantId] = useState<string>('')
  const [formTypeFormationId, setFormTypeFormationId] = useState<string>('none')

  function openCreate(type: 'filiere' | 'niveau' | 'matiere') {
    setDialog({ type, mode: 'create' } as DialogState)
    setFormError(null)
    setFormFiliereId('')
    setFormNiveauId('')
    setFormEnseignantId('')
    setFormTypeFormationId('none')
  }

  function openEdit(type: 'filiere' | 'niveau' | 'matiere', data: FiliereRow | NiveauRow | MatiereRow) {
    setDialog({ type, mode: 'edit', data } as DialogState)
    setFormError(null)
    if (type === 'matiere') {
      const m = data as MatiereRow
      setFormFiliereId(m.filiere_id)
      setFormNiveauId(m.niveau_id)
      setFormEnseignantId(m.enseignant_id ?? '')
    } else if (type === 'niveau') {
      setFormFiliereId((data as NiveauRow).filiere_id)
    } else {
      const f = data as FiliereRow
      setFormFiliereId('')
      setFormNiveauId('')
      setFormEnseignantId('')
      setFormTypeFormationId(f.type_formation_id ?? 'none')
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!dialog) return
    setLoading(true)
    setFormError(null)

    const form = e.currentTarget
    const formData = new FormData(form)
    const raw: Record<string, unknown> = {}
    formData.forEach((v, k) => { raw[k] = v })

    // Type coercions
    if (dialog.type === 'filiere') {
      raw.actif = raw.actif === 'true'
      raw.duree_annees = Number(raw.duree_annees) || 3
      // type_formation_id: use controlled state value
      raw.type_formation_id = formTypeFormationId !== 'none' ? formTypeFormationId : null
    }
    if (dialog.type === 'niveau') {
      raw.ordre = Number(raw.ordre) || 1
    }
    if (dialog.type === 'matiere') {
      raw.coefficient = Number(raw.coefficient) || 1
      raw.credit = Number(raw.credit) || 1
      raw.semestre = Number(raw.semestre) || 1
      if (raw.volume_horaire) raw.volume_horaire = Number(raw.volume_horaire)
      else delete raw.volume_horaire
      if (!raw.enseignant_id || raw.enseignant_id === 'none') delete raw.enseignant_id
    }

    const isEdit = dialog.mode === 'edit'
    const id = isEdit ? (dialog.data as { id: string }).id : null
    const url = isEdit ? `/api/courses?id=${id}` : '/api/courses'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: dialog.type, ...raw }),
      })
      const result = await res.json()
      if (result.error) {
        setFormError(result.error)
      } else {
        setDialog(null)
        router.refresh()
      }
    } catch {
      setFormError('Erreur réseau, veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(type: string, id: string) {
    try {
      const res = await fetch(`/api/courses?type=${type}&id=${id}`, { method: 'DELETE' })
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

  const filteredNiveaux = niveaux.filter((n) => n.filiere_id === formFiliereId)

  // ── Groupement des classes (filière + niveau) ──
  type ClasseGroup = {
    key: string
    filiere: { id: string; code: string; nom: string }
    niveau: { id: string; nom: string; ordre?: number }
    etudiants: EtudiantSimple[]
    matieres_count: number
  }
  const classesMap: Record<string, ClasseGroup> = {}
  for (const e of etudiants) {
    if (!e.filiere || !e.niveau) continue
    const key = `${e.filiere_id}/${e.niveau_id}`
    if (!classesMap[key]) {
      classesMap[key] = {
        key,
        filiere: e.filiere,
        niveau: e.niveau,
        etudiants: [],
        matieres_count: matieres.filter(
          (m) => m.filiere_id === e.filiere_id && m.niveau_id === e.niveau_id
        ).length,
      }
    }
    classesMap[key].etudiants.push(e)
  }
  const classes = Object.values(classesMap).sort((a, b) => {
    const fc = a.filiere.code.localeCompare(b.filiere.code)
    if (fc !== 0) return fc
    return (a.niveau.ordre ?? 0) - (b.niveau.ordre ?? 0)
  })

  const statut_colors: Record<string, string> = {
    inscrit: 'bg-green-100 text-green-700',
    suspendu: 'bg-amber-100 text-amber-700',
    diplome: 'bg-blue-100 text-blue-700',
    abandonne: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gérez les filières, niveaux d&apos;étude et matières
        </p>
      </div>

      <Tabs defaultValue="filieres">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="filieres" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Filières <Badge variant="secondary" className="ml-1 text-xs">{filieres.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="niveaux" className="gap-2">
            <Layers className="h-4 w-4" />
            Niveaux <Badge variant="secondary" className="ml-1 text-xs">{niveaux.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="matieres" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Matières <Badge variant="secondary" className="ml-1 text-xs">{matieres.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <Users className="h-4 w-4" />
            Classes <Badge variant="secondary" className="ml-1 text-xs">{etudiants.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── FILIÈRES ── */}
        <TabsContent value="filieres" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openCreate('filiere')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nouvelle filière
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nom</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Durée</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filieres.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400">Aucune filière</td>
                  </tr>
                )}
                {filieres.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-blue-700 bg-blue-50/50">{f.code}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{f.nom}</td>
                    <td className="py-3 px-4 text-gray-500">{f.duree_annees ?? 3} ans</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {f.actif ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirm === f.id ? (
                          <>
                            <Button variant="destructive" size="sm" className="h-7 text-xs"
                              onClick={() => handleDelete('filiere', f.id)}>
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
                              onClick={() => openEdit('filiere', f)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(f.id)}>
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

        {/* ── NIVEAUX ── */}
        <TabsContent value="niveaux" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openCreate('niveau')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nouveau niveau
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Filière</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nom du niveau</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Ordre</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {niveaux.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-400">Aucun niveau</td>
                  </tr>
                )}
                {niveaux.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">{n.filiere?.code ?? '—'}</Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{n.nom}</td>
                    <td className="py-3 px-4 text-gray-500">Ordre {n.ordre}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirm === n.id ? (
                          <>
                            <Button variant="destructive" size="sm" className="h-7 text-xs"
                              onClick={() => handleDelete('niveau', n.id)}>
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
                              onClick={() => openEdit('niveau', n)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(n.id)}>
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

        {/* ── MATIÈRES ── */}
        <TabsContent value="matieres" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button onClick={() => openCreate('matiere')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nouvelle matière
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Nom</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Filière / Niveau</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Sem.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Coeff.</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Enseignant</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {matieres.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-400">Aucune matière</td>
                  </tr>
                )}
                {matieres.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-purple-700">{m.code}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{m.nom}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="text-xs w-fit">{m.filiere?.code}</Badge>
                        <span className="text-xs text-gray-500">{m.niveau?.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-slate-100 text-slate-700 border-0 text-xs">S{m.semestre}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{m.coefficient}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">
                      {m.enseignant ? `${m.enseignant.prenom} ${m.enseignant.nom}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirm === m.id ? (
                          <>
                            <Button variant="destructive" size="sm" className="h-7 text-xs"
                              onClick={() => handleDelete('matiere', m.id)}>
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
                              onClick={() => openEdit('matiere', m)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteConfirm(m.id)}>
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
        {/* ── CLASSES ── */}
        <TabsContent value="classes" className="mt-4">
          <div className="space-y-4">
            {classes.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Aucun étudiant inscrit</p>
                <p className="text-sm text-gray-400 mt-1">
                  Inscrivez des étudiants dans le module Étudiants pour voir les classes apparaître ici.
                </p>
              </div>
            ) : (
              classes.map((classe) => (
                <div key={classe.key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* En-tête de classe */}
                  <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {classe.filiere.code}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          {classe.filiere.nom} — {classe.niveau.nom}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <strong className="text-gray-900">{classe.etudiants.length}</strong> étudiant{classe.etudiants.length > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="h-4 w-4" />
                        <strong className="text-gray-900">{classe.matieres_count}</strong> matière{classe.matieres_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Liste des étudiants */}
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-2.5 px-4 font-medium text-gray-500 w-8">#</th>
                        <th className="text-left py-2.5 px-4 font-medium text-gray-500">Matricule</th>
                        <th className="text-left py-2.5 px-4 font-medium text-gray-500">Nom complet</th>
                        <th className="text-left py-2.5 px-4 font-medium text-gray-500">Statut</th>
                        <th className="text-right py-2.5 px-4 font-medium text-gray-500">Fiche</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {classe.etudiants.map((e, idx) => (
                        <tr key={e.id} className="hover:bg-gray-50/40 transition-colors">
                          <td className="py-2.5 px-4 text-gray-400 text-xs">{idx + 1}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {e.matricule}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-gray-900">
                            {e.nom} {e.prenom}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statut_colors[e.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                              {e.statut}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <Link
                              href={`/students/${e.id}`}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Voir <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── DIALOG CRUD ── */}
      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) setDialog(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'create' ? 'Nouveau' : 'Modifier'}{' '}
              {dialog?.type === 'filiere' ? 'une filière' : dialog?.type === 'niveau' ? 'un niveau' : 'une matière'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* ── Filière form ── */}
            {dialog?.type === 'filiere' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Code *</Label>
                    <Input id="code" name="code" required placeholder="INFO"
                      defaultValue={dialog.mode === 'edit' ? dialog.data.code : ''}
                      className="uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="duree_annees">Durée (années)</Label>
                    <Input id="duree_annees" name="duree_annees" type="number" min={1} max={10}
                      defaultValue={dialog.mode === 'edit' ? (dialog.data.duree_annees ?? 3) : 3} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input id="nom" name="nom" required placeholder="Informatique"
                    defaultValue={dialog.mode === 'edit' ? dialog.data.nom : ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Description optionnelle"
                    defaultValue={dialog.mode === 'edit' ? (dialog.data.description ?? '') : ''} />
                </div>
                {typeFormations.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Type de formation</Label>
                    <Select value={formTypeFormationId} onValueChange={setFormTypeFormationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Non défini —</SelectItem>
                        {typeFormations.map((tf) => (
                          <SelectItem key={tf.id} value={tf.id}>
                            <span className="font-mono text-xs mr-1 text-emerald-600">{tf.code}</span>
                            {tf.nom}
                            <span className="text-gray-400 ml-1 text-xs">
                              ({Number(tf.tarif_horaire).toLocaleString('fr-FR')} FC/{tf.methode_paiement === 'horaire' ? 'h' : 'séance'})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select name="actif" defaultValue={dialog.mode === 'edit' ? String(dialog.data.actif) : 'true'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* ── Niveau form ── */}
            {dialog?.type === 'niveau' && (
              <>
                <div className="space-y-1.5">
                  <Label>Filière *</Label>
                  <Select
                    name="filiere_id"
                    value={formFiliereId}
                    onValueChange={setFormFiliereId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une filière" />
                    </SelectTrigger>
                    <SelectContent>
                      {filieres.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom du niveau *</Label>
                  <Input id="nom" name="nom" required placeholder="Licence 1"
                    defaultValue={dialog.mode === 'edit' ? dialog.data.nom : ''} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ordre">Ordre d&apos;affichage</Label>
                  <Input id="ordre" name="ordre" type="number" min={1}
                    defaultValue={dialog.mode === 'edit' ? dialog.data.ordre : 1} />
                </div>
              </>
            )}

            {/* ── Matière form ── */}
            {dialog?.type === 'matiere' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="code">Code *</Label>
                    <Input id="code" name="code" required placeholder="INF101"
                      defaultValue={dialog.mode === 'edit' ? dialog.data.code : ''}
                      className="uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Semestre *</Label>
                    <Select name="semestre" defaultValue={dialog.mode === 'edit' ? String(dialog.data.semestre) : '1'}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semestre 1</SelectItem>
                        <SelectItem value="2">Semestre 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom de la matière *</Label>
                  <Input id="nom" name="nom" required placeholder="Algorithmique et Programmation"
                    defaultValue={dialog.mode === 'edit' ? dialog.data.nom : ''} />
                </div>
                <div className="space-y-1.5">
                  <Label>Filière *</Label>
                  <Select
                    name="filiere_id"
                    value={formFiliereId}
                    onValueChange={(v) => { setFormFiliereId(v); setFormNiveauId('') }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une filière" />
                    </SelectTrigger>
                    <SelectContent>
                      {filieres.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.code} — {f.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Niveau *</Label>
                  <Select
                    name="niveau_id"
                    value={formNiveauId}
                    onValueChange={setFormNiveauId}
                    required
                    disabled={!formFiliereId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formFiliereId ? 'Choisir un niveau' : 'Sélectionnez d\'abord une filière'} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNiveaux.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="coefficient">Coeff. *</Label>
                    <Input id="coefficient" name="coefficient" type="number" min={1} max={10} required
                      defaultValue={dialog.mode === 'edit' ? dialog.data.coefficient : 1} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="credit">Crédit *</Label>
                    <Input id="credit" name="credit" type="number" min={1} max={20} required
                      defaultValue={dialog.mode === 'edit' ? dialog.data.credit : 3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="volume_horaire">Vol. horaire</Label>
                    <Input id="volume_horaire" name="volume_horaire" type="number" min={1}
                      defaultValue={dialog.mode === 'edit' ? (dialog.data.volume_horaire ?? '') : ''} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Enseignant</Label>
                  <Select
                    name="enseignant_id"
                    value={formEnseignantId}
                    onValueChange={setFormEnseignantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="(optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {enseignants.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {loading ? (
                  'Enregistrement…'
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> {dialog?.mode === 'create' ? 'Créer' : 'Enregistrer'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
