import { CreditCard, TrendingUp, Clock, CheckCircle, Plus, Search, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPaiements, getFinanceStats } from '@/app/actions/finance'
import { PaiementActions } from '@/components/finance/paiement-actions'

interface SearchParams {
  search?: string
  type?: string
  statut?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

const STATUT_CONFIG: Record<string, { label: string; class: string }> = {
  paye:       { label: 'Payé',        class: 'bg-green-100 text-green-700 border-green-200' },
  en_attente: { label: 'En attente',  class: 'bg-amber-100 text-amber-700 border-amber-200' },
  partiel:    { label: 'Partiel',     class: 'bg-blue-100 text-blue-700 border-blue-200' },
  exonere:    { label: 'Exonéré',     class: 'bg-purple-100 text-purple-700 border-purple-200' },
}

const TYPE_LABELS: Record<string, string> = {
  inscription: 'Inscription',
  scolarite:   'Scolarité',
  rattrapage:  'Rattrapage',
  autre:       'Autre',
}

function mensualiteLabel(n: number) {
  return n === 1 ? '1ère mensualité' : `${n}ème mensualité`
}

function buildMensualiteMap(paiements: { id: string; type: string; etudiant_id: string; created_at: string }[]) {
  // Grouper les scolarités par étudiant, ordonner chrono, numéroter
  const byEtudiant: Record<string, typeof paiements> = {}
  for (const p of paiements) {
    if (p.type !== 'scolarite') continue
    if (!byEtudiant[p.etudiant_id]) byEtudiant[p.etudiant_id] = []
    byEtudiant[p.etudiant_id].push(p)
  }
  const map = new Map<string, number>()
  for (const group of Object.values(byEtudiant)) {
    group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    group.forEach((p, i) => map.set(p.id, i + 1))
  }
  return map
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('fr-SN', { style: 'decimal' }).format(amount) + ' FCFA'
}

export default async function FinancePage({ searchParams }: Props) {
  const params = await searchParams
  const [paiements, stats] = await Promise.all([
    getPaiements(params),
    getFinanceStats(),
  ])
  const mensualiteMap = buildMensualiteMap(paiements as { id: string; type: string; etudiant_id: string; created_at: string }[])

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-1">Gestion des paiements et scolarités</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/tarifs">
            <Button variant="outline" className="gap-2 text-gray-600">
              <Settings2 className="h-4 w-4" />
              Tarifs
            </Button>
          </Link>
          <Link href="/finance/paiement">
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouveau paiement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 rounded-lg p-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total perçu</p>
              <p className="font-bold text-gray-900 text-sm">{formatMoney(stats.totalPercu)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 rounded-lg p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">En attente</p>
              <p className="font-bold text-gray-900 text-sm">{formatMoney(stats.totalAttente)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 rounded-lg p-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Payés</p>
              <p className="font-bold text-gray-900 text-lg">{stats.nbPaye}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 rounded-lg p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total paiements</p>
              <p className="font-bold text-gray-900 text-lg">{stats.totalPaiements}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              name="search"
              defaultValue={params.search}
              placeholder="Rechercher un étudiant, une référence…"
              className="flex-1 text-sm outline-none bg-transparent"
            />
          </div>
          <select
            name="statut"
            defaultValue={params.statut ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="paye">Payé</option>
            <option value="en_attente">En attente</option>
            <option value="partiel">Partiel</option>
            <option value="exonere">Exonéré</option>
          </select>
          <select
            name="type"
            defaultValue={params.type ?? ''}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="">Tous les types</option>
            <option value="inscription">Inscription</option>
            <option value="scolarite">Scolarité</option>
            <option value="rattrapage">Rattrapage</option>
            <option value="autre">Autre</option>
          </select>
          <Button type="submit" size="sm" variant="outline">Filtrer</Button>
        </form>
      </div>

      {/* Table */}
      {paiements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun paiement trouvé</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur &quot;Nouveau paiement&quot; pour commencer.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Référence</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Étudiant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Montant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Statut</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paiements.map((p) => {
                const etudiant = p.etudiant as { nom: string; prenom: string; matricule: string } | null
                const statut = STATUT_CONFIG[p.statut] ?? { label: p.statut, class: 'bg-gray-100 text-gray-600' }
                const date = p.date_paiement
                  ? new Date(p.date_paiement).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  : new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-500">{p.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{etudiant?.nom} {etudiant?.prenom}</p>
                      <p className="text-xs text-gray-400">{etudiant?.matricule}</p>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {p.type === 'scolarite'
                        ? mensualiteLabel(mensualiteMap.get(p.id) ?? 1)
                        : (TYPE_LABELS[p.type] ?? p.type)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{formatMoney(Number(p.montant))}</p>
                      {Number(p.montant) < Number(p.montant_total) && (
                        <p className="text-xs text-gray-400">/ {formatMoney(Number(p.montant_total))}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`text-xs border ${statut.class}`}>
                        {statut.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{date}</td>
                    <td className="py-3 px-4 text-right">
                      <PaiementActions paiementId={p.id} statut={p.statut} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
