import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Helvetica',
  fonts: [],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#CC1F1F',
  },
  headerLeft: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#CC1F1F',
    letterSpacing: 1,
  },
  schoolSubtitle: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  bulletinTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    textTransform: 'uppercase',
  },
  anneeLabel: {
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  // Info étudiant
  studentBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  studentDetail: {
    fontSize: 9,
    color: '#555555',
    marginTop: 2,
  },
  matriculeBadge: {
    fontSize: 8,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
  },
  moyenneBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  moyenneValue: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  moyenneSub: {
    fontSize: 8,
    color: '#888888',
  },
  creditsText: {
    fontSize: 8,
    color: '#666666',
    marginTop: 2,
  },
  // Semestre
  semestreTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#CC1F1F',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  cellMatiere: { flex: 3 },
  cellCoeff: { flex: 1, textAlign: 'center' },
  cellNote: { flex: 1, textAlign: 'center' },
  cellRatt: { flex: 1, textAlign: 'center' },
  cellFinale: { flex: 1, textAlign: 'center' },
  cellMention: { flex: 1.2, textAlign: 'center' },
  cellCredits: { flex: 1, textAlign: 'center' },
  cellNom: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111111' },
  cellCode: { fontSize: 7, color: '#9ca3af', fontFamily: 'Helvetica' },
  cellText: { fontSize: 9, color: '#374151' },
  cellTextBold: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#111111' },
  mentionTB: { color: '#15803d', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  mentionB: { color: '#1d4ed8', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  mentionAB: { color: '#4338ca', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  mentionP: { color: '#b45309', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  mentionF: { color: '#dc2626', fontSize: 8, fontFamily: 'Helvetica-Bold' },
  // Pied de page
  footer: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  signatureBox: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
})

interface Matiere {
  id: string
  nom: string
  code: string
  coefficient: number | null
  credit: number | null
  semestre: string | null
  note_normale: number | null
  note_rattrapage: number | null
  note_finale: number | null
  mention: string | null
  enseignant: { nom: string; prenom: string } | null
}

interface Etudiant {
  nom: string
  prenom: string
  matricule: string
  niveau_entree?: string | null
  filiere?: { nom: string } | null
  niveau?: { nom: string } | null
}

interface BulletinPDFProps {
  etudiant: Etudiant
  matieres: Matiere[]
  anneeLibelle: string
  moyenne: number | null
  totalCredits: number
}

function getDocumentType(niveau_entree?: string | null) {
  if (niveau_entree === 'bac') return { titre: 'Relevé de Notes', type: 'lmd' }
  return { titre: 'Bulletin de Notes', type: 'fp' }
}

const MENTION_STYLE: Record<string, ReturnType<typeof StyleSheet.create>[string]> = {
  TB: styles.mentionTB,
  B: styles.mentionB,
  AB: styles.mentionAB,
  P: styles.mentionP,
  F: styles.mentionF,
}

function TableauSemestre({ matieres, label }: { matieres: Matiere[]; label: string }) {
  if (matieres.length === 0) return null

  return (
    <View>
      <Text style={styles.semestreTitle}>{label}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.cellMatiere, { paddingLeft: 4 }]}>
            <Text style={styles.tableHeaderText}>MATIÈRE</Text>
          </View>
          <View style={styles.cellCoeff}>
            <Text style={styles.tableHeaderText}>COEFF.</Text>
          </View>
          <View style={styles.cellNote}>
            <Text style={styles.tableHeaderText}>NOTE</Text>
          </View>
          <View style={styles.cellRatt}>
            <Text style={styles.tableHeaderText}>RATT.</Text>
          </View>
          <View style={styles.cellFinale}>
            <Text style={styles.tableHeaderText}>FINALE</Text>
          </View>
          <View style={styles.cellMention}>
            <Text style={styles.tableHeaderText}>MENTION</Text>
          </View>
          <View style={styles.cellCredits}>
            <Text style={styles.tableHeaderText}>CRÉDITS</Text>
          </View>
        </View>
        {matieres.map((m, i) => {
          const mention = m.mention as string | null
          const creditsValides = (m.note_finale ?? 0) >= 10
          return (
            <View key={m.id} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <View style={[styles.cellMatiere, { paddingLeft: 4 }]}>
                <Text style={styles.cellNom}>{m.nom}</Text>
                <Text style={styles.cellCode}>{m.code}</Text>
              </View>
              <View style={styles.cellCoeff}>
                <Text style={styles.cellText}>{m.coefficient ?? '—'}</Text>
              </View>
              <View style={styles.cellNote}>
                <Text style={styles.cellText}>
                  {m.note_normale !== null ? m.note_normale.toFixed(2) : '—'}
                </Text>
              </View>
              <View style={styles.cellRatt}>
                <Text style={styles.cellText}>
                  {m.note_rattrapage !== null ? m.note_rattrapage.toFixed(2) : '—'}
                </Text>
              </View>
              <View style={styles.cellFinale}>
                <Text style={styles.cellTextBold}>
                  {m.note_finale !== null ? m.note_finale.toFixed(2) : '—'}
                </Text>
              </View>
              <View style={styles.cellMention}>
                {mention ? (
                  <Text style={MENTION_STYLE[mention] ?? styles.cellText}>{mention}</Text>
                ) : (
                  <Text style={styles.cellText}>—</Text>
                )}
              </View>
              <View style={styles.cellCredits}>
                <Text style={creditsValides ? { ...styles.cellText, color: '#15803d' } : { ...styles.cellText, color: '#d1d5db' }}>
                  {m.credit ?? '—'}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export function BulletinPDF({ etudiant, matieres, anneeLibelle, moyenne, totalCredits }: BulletinPDFProps) {
  const sem1 = matieres.filter((m) => m.semestre === '1')
  const sem2 = matieres.filter((m) => m.semestre === '2')
  const dateImpression = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const { titre } = getDocumentType(etudiant.niveau_entree)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.schoolName}>UP&apos;TECH</Text>
            <Text style={styles.schoolSubtitle}>Institut Supérieur de Technologie</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.bulletinTitle}>{titre}</Text>
            <Text style={styles.anneeLabel}>Année académique : {anneeLibelle}</Text>
          </View>
        </View>

        {/* Info étudiant */}
        <View style={styles.studentBox}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {etudiant.prenom} {etudiant.nom}
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
              <Text style={styles.matriculeBadge}>{etudiant.matricule}</Text>
            </View>
            <Text style={styles.studentDetail}>
              Filière : {etudiant.filiere?.nom ?? '—'}
            </Text>
            <Text style={styles.studentDetail}>
              Niveau : {etudiant.niveau?.nom ?? '—'}
            </Text>
          </View>
          {moyenne !== null && (
            <View style={styles.moyenneBox}>
              <Text style={styles.moyenneValue}>{moyenne.toFixed(2)}</Text>
              <Text style={styles.moyenneSub}>/ 20 — Moyenne générale</Text>
              <Text style={styles.creditsText}>{totalCredits} crédits validés</Text>
            </View>
          )}
        </View>

        {/* Tables par semestre */}
        <TableauSemestre matieres={sem1} label="Semestre 1" />
        <TableauSemestre matieres={sem2} label="Semestre 2" />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Imprimé le {dateImpression}
          </Text>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Le Directeur</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
