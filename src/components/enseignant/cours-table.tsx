'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CoursRow } from '@/app/actions/enseignant'

interface CoursTableProps {
  cours: CoursRow[]
}

const SEARCH_FIELDS = [
  { value: 'all',    label: 'Tous'    },
  { value: 'cours',  label: 'Cours'   },
  { value: 'classe', label: 'Classe'  },
]

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function CoursTable({ cours }: CoursTableProps) {
  const [searchField, setSearchField] = useState('all')
  const [search, setSearch]           = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [page, setPage]               = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return cours
    return cours.filter(row => {
      if (searchField === 'cours')  return row.cours.toLowerCase().includes(q)
      if (searchField === 'classe') return row.classe_code.toLowerCase().includes(q)
      return row.cours.toLowerCase().includes(q) || row.classe_code.toLowerCase().includes(q)
    })
  }, [cours, search, searchField])

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
              <th className="text-left px-5 py-3 font-medium text-gray-500">Cours</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Classe</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Taux horaire</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Nombre d&apos;heures</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">Heures restantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                  Aucun cours trouvé
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={`${row.programme_id}-${row.classe_code}-${i}`} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{row.cours}</td>
                  <td className="px-5 py-3 text-gray-600">{row.classe_code}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {row.taux_horaire > 0 ? `${fmt(row.taux_horaire)} F CFA` : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{row.nombre_heures}H</td>
                  <td className="px-5 py-3">
                    <span className={row.heures_restantes === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'}>
                      {row.heures_restantes}H
                    </span>
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
                {[5, 10, 20, 50].map(n => (
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
