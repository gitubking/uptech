'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, AlertCircle, CheckCircle2, MessageSquare, Users, GraduationCap, Building2 } from 'lucide-react'

type AnnonceRow = {
  id: string
  titre: string
  contenu: string
  cible: string
  date_expiration?: string
  created_at: string
  auteur_id?: string | null
  auteur?: { nom: string; prenom: string } | null
}

interface Props {
  annonces: AnnonceRow[]
  tableError?: string
}

const CIBLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  tous: { label: 'Tous', color: 'bg-blue-100 text-blue-700', icon: <Users className="h-3.5 w-3.5" /> },
  etudiants: { label: 'Étudiants', color: 'bg-green-100 text-green-700', icon: <Users className="h-3.5 w-3.5" /> },
  enseignants: { label: 'Enseignants', color: 'bg-purple-100 text-purple-700', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  administration: { label: 'Administration', color: 'bg-orange-100 text-orange-700', icon: <Building2 className="h-3.5 w-3.5" /> },
}

export function CommunicationClient({ annonces: initialAnnonces, tableError }: Props) {
  const router = useRouter()
  const [annonces, setAnnonces] = useState(initialAnnonces)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [cible, setCible] = useState('tous')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      titre: formData.get('titre') as string,
      contenu: formData.get('contenu') as string,
      cible,
      date_expiration: (formData.get('date_expiration') as string) || null,
    }

    try {
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (result.error) {
        setFormError(result.error)
      } else {
        setShowDialog(false)
        setCible('tous')
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
      const res = await fetch(`/api/communication?id=${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.error) {
        alert(result.error)
      } else {
        setDeleteConfirm(null)
        setAnnonces((prev) => prev.filter((a) => a.id !== id))
      }
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-500 text-sm mt-1">Annonces et messages internes</p>
        </div>
        {!tableError && (
          <Button
            onClick={() => { setShowDialog(true); setFormError(null); setCible('tous') }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="h-4 w-4" /> Nouvelle annonce
          </Button>
        )}
      </div>

      {/* Table error (annonces table doesn't exist) */}
      {tableError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 text-amber-800">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Table <code className="font-mono">annonces</code> introuvable</p>
                <p className="text-sm mt-1 text-amber-700">
                  Copiez le SQL ci-dessous et exécutez-le dans le SQL Editor de Supabase.
                </p>
              </div>
            </div>
            <a
              href="https://supabase.com/dashboard/project/gpikjvprlwjfdtwuonwc/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Ouvrir SQL Editor ↗
            </a>
          </div>
          <div className="relative">
            <pre className="bg-amber-900/10 border border-amber-200 rounded-lg p-4 text-xs font-mono text-amber-900 overflow-x-auto leading-relaxed">{`CREATE TABLE IF NOT EXISTS annonces (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titre           text NOT NULL,
  contenu         text NOT NULL,
  auteur_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  cible           text DEFAULT 'tous'
                       CHECK (cible IN ('tous','etudiants','enseignants','administration')),
  date_expiration date,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE annonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON annonces FOR ALL USING (true) WITH CHECK (true);`}</pre>
            <button
              onClick={() => navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS annonces (\n  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,\n  titre text NOT NULL,\n  contenu text NOT NULL,\n  auteur_id uuid REFERENCES profiles(id) ON DELETE SET NULL,\n  cible text DEFAULT 'tous' CHECK (cible IN ('tous','etudiants','enseignants','administration')),\n  date_expiration date,\n  created_at timestamptz DEFAULT now()\n);\nALTER TABLE annonces ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "allow_all" ON annonces FOR ALL USING (true) WITH CHECK (true);`)}
              className="absolute top-2 right-2 px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-800 text-xs rounded transition-colors"
            >
              Copier
            </button>
          </div>
          <p className="text-xs text-amber-700">
            💡 Le fichier complet <code className="font-mono">supabase/migrations/002_emargements_annonces.sql</code> contient les deux tables.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!tableError && annonces.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Aucune annonce</p>
          <p className="text-sm mt-1">Publiez votre première annonce en cliquant sur &quot;Nouvelle annonce&quot;.</p>
        </div>
      )}

      {/* Annonces list */}
      <div className="space-y-3">
        {annonces.map((annonce) => {
          const cfg = CIBLE_CONFIG[annonce.cible] ?? CIBLE_CONFIG['tous']
          const isExpired = annonce.date_expiration && new Date(annonce.date_expiration) < new Date()

          return (
            <div
              key={annonce.id}
              className={`bg-white rounded-xl border shadow-sm p-5 ${isExpired ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-semibold text-gray-900">{annonce.titre}</h3>
                    {isExpired && (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Expirée</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{annonce.contenu}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(annonce.created_at)}
                    </span>
                    {annonce.auteur && (
                      <span className="text-xs text-gray-400">
                        par {annonce.auteur.prenom} {annonce.auteur.nom}
                      </span>
                    )}
                    {annonce.date_expiration && (
                      <span className="text-xs text-gray-400">
                        Expire le {formatDate(annonce.date_expiration)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {deleteConfirm === annonce.id ? (
                    <>
                      <Button variant="destructive" size="sm" className="h-7 text-xs"
                        onClick={() => handleDelete(annonce.id)}>
                        Confirmer
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => setDeleteConfirm(null)}>
                        Annuler
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(annonce.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog create */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) setShowDialog(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle annonce</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="titre">Titre *</Label>
              <Input id="titre" name="titre" required placeholder="Objet de l'annonce" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contenu">Contenu *</Label>
              <Textarea
                id="contenu" name="contenu" required
                placeholder="Rédigez votre annonce…"
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Destinataires</Label>
                <Select value={cible} onValueChange={setCible} name="cible_display">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CIBLE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">{cfg.icon} {cfg.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date_expiration">Date d&apos;expiration</Label>
                <Input id="date_expiration" name="date_expiration" type="date" />
              </div>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {loading ? 'Publication…' : 'Publier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
