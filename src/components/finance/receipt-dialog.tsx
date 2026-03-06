'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { useRef } from 'react'

export interface ReceiptData {
  reference: string
  date: string
  etudiant: {
    nom: string
    prenom: string
    matricule: string
    filiere?: string | null
    niveau?: string | null
  }
  typeLabel: string
  montant: number
  montant_total: number
  statut: string
  mode_paiement: string
  anneeLibelle?: string | null
}

const STATUT_LABELS: Record<string, string> = {
  paye: 'Payé',
  en_attente: 'En attente',
  partiel: 'Partiel',
  exonere: 'Exonéré',
}

const MODE_LABELS: Record<string, string> = {
  especes: 'Espèces',
  virement: 'Virement bancaire',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('fr-SN').format(n) + ' FCFA'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ReceiptData
}

export function ReceiptDialog({ open, onOpenChange, data }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Reçu ${data.reference}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; max-width: 680px; margin: auto; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
    .header h2 { font-size: 13px; color: #555; margin-top: 4px; }
    .badge { display: inline-block; margin-top: 8px; font-size: 11px; padding: 2px 10px; border-radius: 4px; border: 1px solid #333; }
    .ref-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; color: #555; }
    .ref-row span { font-weight: bold; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table th { text-align: left; background: #f3f4f6; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border: 1px solid #e5e7eb; }
    table td { padding: 8px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
    table td:first-child { color: #555; width: 40%; }
    table td:last-child { font-weight: 600; }
    .amount-box { background: #f9fafb; border: 2px solid #111; border-radius: 6px; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .amount-box .label { font-size: 12px; color: #555; }
    .amount-box .value { font-size: 20px; font-weight: bold; }
    .footer { margin-top: 40px; display: flex; justify-content: space-between; }
    .footer .sig { text-align: center; }
    .footer .sig .line { border-top: 1px solid #555; margin-top: 48px; padding-top: 6px; font-size: 11px; color: #555; width: 160px; }
    .note { font-size: 11px; color: #888; text-align: center; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  </style>
</head>
<body>
  ${content.innerHTML}
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`)
    win.document.close()
  }

  const restedu = Number(data.montant_total) - Number(data.montant)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Reçu de paiement</DialogTitle>
        </DialogHeader>

        {/* Receipt preview */}
        <div ref={printRef} className="font-sans text-sm text-gray-900">
          <div className="header text-center border-b-2 border-gray-900 pb-4 mb-6">
            <h1 className="text-lg font-bold tracking-widest uppercase">Institut Uptech</h1>
            <h2 className="text-xs text-gray-500 mt-1">Reçu de paiement</h2>
            <span className="badge inline-block mt-2 text-xs px-3 py-0.5 border border-gray-400 rounded">
              {STATUT_LABELS[data.statut] ?? data.statut}
            </span>
          </div>

          <div className="ref-row flex justify-between text-xs text-gray-500 mb-5">
            <span>Référence : <span className="font-bold text-gray-900 font-mono">{data.reference}</span></span>
            <span>Date : <span className="font-bold text-gray-900">{data.date}</span></span>
          </div>

          {/* Étudiant */}
          <table className="w-full border-collapse text-sm mb-5">
            <thead>
              <tr>
                <th colSpan={2} className="bg-gray-100 text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500 border border-gray-200">
                  Étudiant
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-500 w-2/5">Nom complet</td>
                <td className="px-3 py-2 border border-gray-200 font-semibold">{data.etudiant.nom} {data.etudiant.prenom}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-500">Matricule</td>
                <td className="px-3 py-2 border border-gray-200 font-semibold font-mono">{data.etudiant.matricule}</td>
              </tr>
              {data.etudiant.filiere && (
                <tr>
                  <td className="px-3 py-2 border border-gray-200 text-gray-500">Filière / Niveau</td>
                  <td className="px-3 py-2 border border-gray-200 font-semibold">{data.etudiant.filiere}{data.etudiant.niveau ? ` — ${data.etudiant.niveau}` : ''}</td>
                </tr>
              )}
              {data.anneeLibelle && (
                <tr>
                  <td className="px-3 py-2 border border-gray-200 text-gray-500">Année académique</td>
                  <td className="px-3 py-2 border border-gray-200 font-semibold">{data.anneeLibelle}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paiement */}
          <table className="w-full border-collapse text-sm mb-5">
            <thead>
              <tr>
                <th colSpan={2} className="bg-gray-100 text-left px-3 py-2 text-xs uppercase tracking-wide text-gray-500 border border-gray-200">
                  Détails du paiement
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-500 w-2/5">Objet</td>
                <td className="px-3 py-2 border border-gray-200 font-semibold">{data.typeLabel}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-500">Mode de paiement</td>
                <td className="px-3 py-2 border border-gray-200 font-semibold">{MODE_LABELS[data.mode_paiement] ?? data.mode_paiement}</td>
              </tr>
              <tr>
                <td className="px-3 py-2 border border-gray-200 text-gray-500">Montant dû</td>
                <td className="px-3 py-2 border border-gray-200 font-semibold">{formatMoney(Number(data.montant_total))}</td>
              </tr>
            </tbody>
          </table>

          {/* Montant encaissé */}
          <div className="amount-box flex justify-between items-center bg-gray-50 border-2 border-gray-900 rounded-lg px-5 py-3 mb-6">
            <div>
              <p className="label text-xs text-gray-500">Montant encaissé</p>
              {restedu > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">Reste à payer : {formatMoney(restedu)}</p>
              )}
            </div>
            <p className="value text-xl font-bold">{formatMoney(Number(data.montant))}</p>
          </div>

          {/* Signatures */}
          <div className="footer flex justify-between mt-10">
            <div className="sig text-center">
              <div className="line border-t border-gray-400 mt-12 pt-1.5 text-xs text-gray-500 w-40">Signature du payeur</div>
            </div>
            <div className="sig text-center">
              <div className="line border-t border-gray-400 mt-12 pt-1.5 text-xs text-gray-500 w-40">Cachet / Signature responsable</div>
            </div>
          </div>

          <p className="note text-xs text-gray-400 text-center mt-8 border-t border-gray-200 pt-3">
            Ce reçu a été généré automatiquement — Institut Uptech
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
