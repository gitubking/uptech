'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, ChevronDown, ChevronRight, Banknote, Clock,
  Users, AlertCircle, GraduationCap, BookOpen,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type SeanceDetail = {
  id: string
  date_cours: string
  matiere_code: string
  matiere_nom: string
  filiere_code: string
  type_formation_nom: string | null
  type_formation_code: string | null
  methode_paiement: string
  tarif_horaire: number
  heures: number
  montant: number
}

type EnseignantPaiement = {
  id: string
  nom: string
  prenom: string
  matricule?: string | null
  seances: SeanceDetail[]
  totalHeures: number
  totalMontant: number
}

type TypeFormation = {
  id: string; nom: string; code: string
  tarif_horaire: number; methode_paiement: string
}

interface Props {
  paiements: EnseignantPaiement[]
  typeFormations: TypeFormation[]
  hasTypeFormations: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const METHODE_LABELS: Record<string, string> = {
  horaire: '/heure',
  forfait_seance: '/séance',
  mensuel: '/mois',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PaiementsClient({ paiements, typeFormations, hasTypeFormations }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const totalHeures = paiements.reduce((s, p) => s + p.totalHeures, 0)
  const totalMontant = paiements.reduce((s, p) => s + p.totalMontant, 0)
  const totalSeances = paiements.reduce((s, p) => s + p.seances.length, 0)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/teachers" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements enseignants</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Récapitulatif des rémunérations basé sur les émargements
          </p>
        </div>
      </div>

      {/* ── Alerte si types de formation manquants ── */}
      {!hasTypeFormations && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Types de formation non configurés</p>
            <p className="text-sm mt-0.5">
              Les tarifs de rémunération ne peuvent pas être calculés.{' '}
              <Link href="/settings" className="underline font-medium">
                Configurez les types de formation dans Paramètres →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Cartes résumé ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Enseignants</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{paiements.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">{paiements.filter(p => p.totalHeures > 0).length} ayant émargé</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Heures dispensées</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalHeures.toFixed(1)} h</p>
          <p className="text-xs text-gray-400 mt-0.5">{totalSeances} séances enregistrées</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Total à payer</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalMontant)} FCFA</p>
          <p className="text-xs text-gray-400 mt-0.5">Tous enseignants confondus</p>
        </div>
      </div>

      {/* ── Légende types de formation ── */}
      {typeFormations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {typeFormations.map((tf) => (
            <div key={tf.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs">
              <span className="font-mono font-bold text-emerald-700">{tf.code}</span>
              <span className="text-gray-600">{tf.nom}</span>
              <span className="text-gray-400">·</span>
              <span className="font-semibold text-gray-700">
                {fmt(Number(tf.tarif_horaire))} FCFA{METHODE_LABELS[tf.methode_paiement] ?? ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Tableau par enseignant ── */}
      <div className="space-y-3">
        {paiements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Aucun enseignant</p>
          </div>
        ) : (
          paiements.map((p) => {
            const isOpen = expanded === p.id
            const hasSeances = p.seances.length > 0

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* ── En-tête enseignant ── */}
                <div
                  className={`px-5 py-4 flex items-center justify-between ${hasSeances ? 'cursor-pointer hover:bg-gray-50/80' : ''} transition-colors`}
                  onClick={() => hasSeances && setExpanded(isOpen ? null : p.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {p.prenom[0]}{p.nom[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{p.prenom} {p.nom}</p>
                      {p.matricule && (
                        <p className="text-xs text-gray-400 font-mono">{p.matricule}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Séances</p>
                      <p className="font-semibold text-gray-900">{p.seances.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Heures</p>
                      <p className="font-semibold text-indigo-700">{p.totalHeures.toFixed(1)} h</p>
                    </div>
                    <div className="min-w-[100px]">
                      <p className="text-xs text-gray-400">Montant dû</p>
                      <p className={`font-bold text-base ${p.totalMontant > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                        {p.totalMontant > 0 ? `${fmt(p.totalMontant)} FCFA` : '—'}
                      </p>
                    </div>
                    {hasSeances && (
                      <div className="text-gray-400">
                        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Détail des séances ── */}
                {isOpen && (
                  <div className="border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/80 border-b border-gray-100">
                        <tr>
                          <th className="text-left py-2.5 px-5 font-medium text-gray-500">Date</th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">Matière</th>
                          <th className="text-left py-2.5 px-4 font-medium text-gray-500">Type formation</th>
                          <th className="text-right py-2.5 px-4 font-medium text-gray-500">Heures</th>
                          <th className="text-right py-2.5 px-4 font-medium text-gray-500">Tarif</th>
                          <th className="text-right py-2.5 px-5 font-medium text-gray-500">Montant</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {p.seances.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-2.5 px-5 text-gray-600 whitespace-nowrap text-xs">
                              {formatDate(s.date_cours)}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-purple-700">{s.matiere_code}</span>
                                <span className="text-gray-700 text-xs">{s.matiere_nom}</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5">{s.filiere_code}</Badge>
                              </div>
                            </td>
                            <td className="py-2.5 px-4">
                              {s.type_formation_code ? (
                                <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {s.type_formation_code}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Non configuré</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="font-semibold text-indigo-700 text-xs tabular-nums">
                                {s.heures > 0 ? `${s.heures.toFixed(1)} h` : '—'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right text-xs text-gray-500 tabular-nums">
                              {s.tarif_horaire > 0
                                ? `${fmt(s.tarif_horaire)} FCFA${METHODE_LABELS[s.methode_paiement] ?? ''}`
                                : '—'}
                            </td>
                            <td className="py-2.5 px-5 text-right">
                              <span className={`font-semibold text-sm tabular-nums ${s.montant > 0 ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {s.montant > 0 ? `${fmt(s.montant)} FCFA` : '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan={3} className="py-2.5 px-5 text-xs text-gray-500 font-medium">
                            Total — {p.prenom} {p.nom}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-indigo-700 text-sm tabular-nums">
                            {p.totalHeures.toFixed(1)} h
                          </td>
                          <td></td>
                          <td className="py-2.5 px-5 text-right font-bold text-emerald-700 text-sm tabular-nums">
                            {fmt(p.totalMontant)} FCFA
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <GraduationCap className="h-4 w-4" />
          <span>Les tarifs sont définis dans</span>
          <Link href="/settings" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Paramètres → Types de formation
          </Link>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.print()}
        >
          Imprimer
        </Button>
      </div>
    </div>
  )
}
