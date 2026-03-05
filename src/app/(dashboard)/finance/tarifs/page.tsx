import { getTarifs } from '@/app/actions/tarifs'
import { getFormationData } from '@/app/actions/grades'
import { getActiveAnneeFinance } from '@/app/actions/finance'
import { TarifsManager } from '@/components/finance/tarifs-manager'
import { Settings2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default async function TarifsPage() {
  const [tarifs, formationData, anneeActive] = await Promise.all([
    getTarifs(),
    getFormationData(),
    getActiveAnneeFinance(),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="bg-green-50 rounded-lg p-2">
            <Settings2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarifs de scolarité</h1>
            <p className="text-gray-500 text-sm mt-0.5">Frais d'inscription et mensualités par filière</p>
          </div>
        </div>
      </div>

      <TarifsManager
        tarifs={tarifs as Parameters<typeof TarifsManager>[0]['tarifs']}
        filieres={formationData.filieres}
        annees={formationData.annees}
        anneeActiveId={anneeActive?.id}
      />
    </div>
  )
}
