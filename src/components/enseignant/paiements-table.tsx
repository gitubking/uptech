'use client'

import { useState, useMemo } from 'react'
import { Search, Banknote, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PaiementEnseignantRow } from '@/app/actions/enseignant'

interface Props {
  paiements: PaiementEnseignantRow[]
}

const MODE_LABELS: Record<string, string> = {
  especes:  'Espèces',
  virement: 'Virement',
  cheque:   'Chèque',
  mobile:   'Mobile Money',
}

const SEARCH_FIELDS = [
  { value: 'all',    label: 'Tous'    },
  { value: 'payeur', label: 'Payeur'  },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function PaiementsTable({ paiements }: Props) {
  const [searchField, setSearchField] = useState('all')
  const [search, setSearch]           = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [page, setPage]               = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return paiements
    return paiements.filter(row => {
      if (searchField === 'payeur') return row.payeur_nom?.toLowerCase().includes(q)
      return (row.payeur_nom?.toLowerCase().includes(q) ?? false)
    })
  }, [paiements, search, searchField])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage   = Math.min(page, totalPages)
  const startIdx   = (safePage - 1) * rowsPerPage
  const paginated  = filtered.slice(startIdx, startIdx + rowsPerPage)

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex items-center gap-2">
        <Select value={searchField} onValueChange={v => { setSearchField(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9 text-sm bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FIELDS.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 h-9 w-64 text-sm bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3 font-medium text-gray-500">montant</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Mode</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Payeur</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                  Aucun paiement trouvé
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id} className={`hover:bg-gray-50/50 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                  <td className="px-5 py-3 font-semibold text-gray-900">
                    {fmt(row.montant)} F CFA
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded bg-gray-100 flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-500">
                        {MODE_LABELS[row.mode_paiement] ?? row.mode_paiement}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {row.payeur_nom ? (
                      <div>
                        <p className="font-medium text-gray-900">{row.payeur_nom}</p>
                        {row.payeur_role && (
                          <p className="text-xs text-gray-400 italic">{row.payeur_role}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-end gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={v => { setRowsPerPage(Number(v)); setPage(1) }}
            >
              <SelectTrigger className="h-8 w-16 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs">
            {startIdx + 1} – {Math.min(startIdx + rowsPerPage, filtered.length)} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronFirst className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-colors">
              <ChevronLast className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
