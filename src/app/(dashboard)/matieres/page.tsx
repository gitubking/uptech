import Link from 'next/link'
import { BookOpen, Plus, Search, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMatieres } from '@/app/actions/matieres'
import { MatiereCreateDialog } from '@/components/matieres/matiere-create-dialog'
import { MatiereDeleteButton } from '@/components/matieres/matiere-delete-button'

interface SearchParams { search?: string }
interface Props { searchParams: Promise<SearchParams> }

export default async function MatieresPage({ searchParams }: Props) {
  const { search } = await searchParams
  const matieres = await getMatieres(search)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue des matières</h1>
          <p className="text-gray-500 text-sm mt-1">{matieres.length} matière{matieres.length > 1 ? 's' : ''} dans le catalogue</p>
        </div>
        <MatiereCreateDialog />
      </div>

      {/* Recherche */}
      <form className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          name="search"
          defaultValue={search}
          placeholder="Rechercher par nom ou code…"
          className="flex-1 text-sm outline-none bg-transparent"
        />
        <Button type="submit" size="sm" variant="outline">Rechercher</Button>
      </form>

      {/* Liste */}
      {matieres.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
          <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune matière dans le catalogue</p>
          <p className="text-sm text-gray-400 mt-1">Créez la première matière en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs">Nom de la matière</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 text-xs hidden sm:table-cell">Description</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {matieres.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{m.code}</span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{m.nom}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs hidden sm:table-cell">
                    {m.description ?? <span className="italic">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/matieres/${m.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600 gap-1">
                          <School className="h-3 w-3" />
                          Programmes
                        </Button>
                      </Link>
                      <MatiereDeleteButton matiereId={m.id} nom={m.nom} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
