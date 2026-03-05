import { getSettingsData } from '@/app/actions/settings'
import { SettingsClient } from '@/components/settings/settings-client'
import { AlertCircle } from 'lucide-react'

export default async function SettingsPage() {
  let data
  let fetchError: string | null = null

  try {
    data = await getSettingsData()
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Erreur lors du chargement'
  }

  if (fetchError || !data) {
    return (
      <div className="max-w-4xl">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de chargement</p>
            <p className="text-sm mt-1">{fetchError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SettingsClient
      annees={data.annees as unknown as Parameters<typeof SettingsClient>[0]['annees']}
      profile={data.profile as unknown as Parameters<typeof SettingsClient>[0]['profile']}
      userEmail={data.userEmail}
      typeFormations={data.typeFormations as unknown as Parameters<typeof SettingsClient>[0]['typeFormations']}
      filieres={data.filieres as unknown as Parameters<typeof SettingsClient>[0]['filieres']}
    />
  )
}
