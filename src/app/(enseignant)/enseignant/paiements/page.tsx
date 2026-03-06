import { redirect } from 'next/navigation'
import { getEnseignantConnecte, getPaiementsEnseignant } from '@/app/actions/enseignant'
import { PaiementsTable } from '@/components/enseignant/paiements-table'

export default async function PaiementsEnseignantPage() {
  const { enseignant } = await getEnseignantConnecte()
  if (!enseignant) redirect('/login')

  const paiements = await getPaiementsEnseignant(enseignant.id)

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-xl font-bold text-gray-900">L&apos;historique de mes paiements</h1>
      <PaiementsTable paiements={paiements} />
    </div>
  )
}
