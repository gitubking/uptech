import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getEtudiantsForFinance, getActiveAnneeFinance } from '@/app/actions/finance'
import { getTarifs } from '@/app/actions/tarifs'
import { PaiementForm } from '@/components/finance/paiement-form'

export default async function NouveauPaiementPage() {
  const [etudiants, anneeActive] = await Promise.all([
    getEtudiantsForFinance(),
    getActiveAnneeFinance(),
  ])
  const tarifs = anneeActive?.id ? await getTarifs(anneeActive.id) : []

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/finance">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau paiement</h1>
          <p className="text-gray-500 text-sm mt-1">Enregistrez un paiement pour un étudiant</p>
        </div>
      </div>

      <PaiementForm
        etudiants={etudiants as unknown as Parameters<typeof PaiementForm>[0]['etudiants']}
        anneeActive={anneeActive}
        tarifs={tarifs as unknown as Parameters<typeof PaiementForm>[0]['tarifs']}
      />
    </div>
  )
}
