import { Text, View } from '@react-pdf/renderer'
import type { CategoryTotalInput } from '../QuotePDF.utils'
import { euro, safeText } from '../QuotePDF.utils'
import { buildSurfaceSummary, formatMq } from '../../features/quotes/utils/surfaceSelections'
import { s } from '../QuotePDF.styles'
import type { PDFTheme } from '../../config/brand'

type SummarySectionProps = {
  brandId?: 'xinfissi' | 'ecosolution' | null
  totals: ReturnType<(input?: CategoryTotalInput[] | null) => Array<{ category: string; amount: number; pieces: number | null; surfaces?: any }>>
  items: any[]
  mountingCost?: number | null
  hasDiscount: boolean
  originalTotal: number
  discountedTotal: number
  discount?: { mode: 'pct' | 'final'; pct?: number | null } | null
  showTotalIncl?: boolean | null
  vatPercent?: number | null
  theme?: PDFTheme | null
}

export function SummarySection({
  brandId,
  totals,
  items,
  mountingCost,
  hasDiscount,
  originalTotal,
  discountedTotal,
  discount,
  showTotalIncl,
  vatPercent,
}: SummarySectionProps) {
  const isEco = brandId === 'ecosolution'
  const normalizePersianaNoFrameLabel = (value: string) => {
    const clean = value.trim().replace(/[.:;,_-]+$/g, '')
    return /^persian[ae]\s+senza\s+telaio$/i.test(clean) ? 'Telaio Senza' : value
  }

  if (isEco) {
    const showIncl = !!showTotalIncl
    const vatPct = typeof vatPercent === 'number' && Number.isFinite(vatPercent) ? vatPercent : 22
    const displayedFinal = hasDiscount ? discountedTotal : originalTotal
    const totalIncl = displayedFinal * (1 + vatPct / 100)

    return (
      <View style={s.block}>
        <Text style={s.h2}>Riepilogo preventivo</Text>
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={[s.th, { flex: 2 }]}>Categoria</Text>
            <Text style={[s.th, s.right]}>Importo</Text>
          </View>
          {totals.length > 0 ? (
            totals.map((r, i) => {
              const label = normalizePersianaNoFrameLabel(safeText(r.category, '-'))
              const k = `eco-row-${label}-${Number.isFinite(r.amount) ? r.amount : 0}-${i}`
              const pieces = (r as any).pieces as number | null
              const surfaceRows = buildSurfaceSummary((r as any).surfaces, items as any)
              return (
                <View key={k} style={s.tr}>
                  <Text style={[s.td, { flex: 2 }]}> 
                    <Text>{label}</Text>
                    {typeof pieces === 'number' && pieces > 0 ? (
                      <Text style={s.piecesNote}> · {pieces} pezzi </Text>
                    ) : null}
                    {surfaceRows.map((row) => (
                      <Text key={`${k}-${row.id}`} style={s.piecesNote}>
                        {' '}· {formatMq(row.mq)}
                        {row.missingDimensions > 0 ? ` (${row.missingDimensions} senza dimensioni)` : ''}
                      </Text>
                    ))}
                  </Text>
                  <Text style={[s.td, s.right]}>
                    {typeof (r as any).amount_discounted === 'number' && (r as any).amount_discounted < r.amount ? (
                      <>
                        <Text style={{ color: '#dc2626', textDecoration: 'line-through' }}>{euro(r.amount)}</Text>
                        {'  '}
                        <Text style={{ fontWeight: 700 }}>{euro((r as any).amount_discounted)}</Text>
                      </>
                    ) : (
                      euro(r.amount)
                    )}
                  </Text>
                </View>
              )
            })
          ) : (
            <View style={s.tr}>
              <Text style={[s.td, { flex: 2, color: '#777' }]}>—</Text>
              <Text style={[s.td, s.right, { color: '#777' }]}>—</Text>
            </View>
          )}

          {typeof mountingCost === 'number' && Number.isFinite(mountingCost) && (
            <View style={s.tr}>
              <Text style={[s.td, { flex: 2 }]}>Montaggio</Text>
              <Text style={[s.td, s.right]}>{euro(mountingCost)}</Text>
            </View>
          )}

        </View>

        {/* ── Totals footer ── */}
        <View style={{ marginTop: 2, borderTopWidth: 1, borderTopColor: '#e5e7eb', borderStyle: 'solid', paddingTop: 8 }}>
          {/* Subtotale */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: hasDiscount ? 4 : 0 }}>
            <Text style={{ fontSize: 9, color: '#9ca3af' }}>Subtotale (IVA esclusa)</Text>
            <Text style={{ fontSize: 9, color: '#9ca3af' }}>{euro(originalTotal)}</Text>
          </View>

          {/* Sconto */}
          {hasDiscount && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 9, color: '#16a34a' }}>
                  {discount?.mode === 'pct' && typeof discount?.pct === 'number' && discount.pct > 0
                    ? `Sconto ${discount.pct}%`
                    : 'Sconto applicato'}
                </Text>
              </View>
              <Text style={{ fontSize: 9, color: '#16a34a' }}>- {euro(originalTotal - discountedTotal)}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#111827', marginHorizontal: 8, marginBottom: 8 }} />

          {/* Totale finale */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
                {showIncl ? 'Totale IVA inclusa' : 'Totale'}
              </Text>
              {showIncl && (
                <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                  IVA {vatPct}% · di cui {euro(displayedFinal * (vatPct / 100))}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
              {showIncl ? euro(totalIncl) : euro(displayedFinal)}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={s.block}>
      <Text style={s.h2}>Riepilogo preventivo</Text>
      <View style={s.table}>
        <View style={s.tr}>
          <Text style={[s.th, { flex: 2 }]}>Categoria</Text>
          <Text style={[s.th, s.right]}>Importo</Text>
        </View>
        {totals.length > 0 ? (
          totals.map((r, i) => {
            const label = normalizePersianaNoFrameLabel(safeText(r.category, '-'))
            const k = `row-${label}-${Number.isFinite(r.amount) ? r.amount : 0}-${i}`
            const pieces = (r as any).pieces as number | null
            const surfaceRows = buildSurfaceSummary((r as any).surfaces, items as any)
            const detailParts: string[] = []
            if (typeof pieces === 'number' && pieces > 0) detailParts.push(`${pieces} pezzi`)
            if (surfaceRows.length > 0) {
              detailParts.push(...surfaceRows.map((row) => {
                const parts = [formatMq(row.mq)]
                if (row.missingDimensions > 0) parts.push(`(${row.missingDimensions} senza dimensioni)`)
                return parts.join(' · ')
              }))
            }
            return (
              <View key={k} style={s.tr}>
                {isEco ? (
                  <>
                    <Text style={[s.td, { flex: 1.5, fontWeight: 700 }]}>{label}</Text>
                    <Text style={[s.td, { flex: 2, color: '#4b5563' }]}>{detailParts.join(' · ') || '—'}</Text>
                    <Text style={[s.td, s.right]}>
                      {typeof (r as any).amount_discounted === 'number' && (r as any).amount_discounted < r.amount ? (
                        <>
                          <Text style={{ color: '#dc2626', textDecoration: 'line-through' }}>{euro(r.amount)}</Text>
                          {'  '}
                          <Text style={{ fontWeight: 700 }}>{euro((r as any).amount_discounted)}</Text>
                        </>
                      ) : (
                        euro(r.amount)
                      )}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[s.td, { flex: 2 }]}> 
                      <Text>{label}</Text>
                      {typeof pieces === 'number' && pieces > 0 ? (
                        <Text style={s.piecesNote}> · {pieces} pezzi </Text>
                      ) : null}
                      {surfaceRows.map((row) => (
                        <Text key={`${k}-${row.id}`} style={s.piecesNote}>
                          {' '}· {formatMq(row.mq)}
                          {row.missingDimensions > 0 ? ` (${row.missingDimensions} senza dimensioni)` : ''}
                        </Text>
                      ))}
                    </Text>
                    <Text style={[s.td, s.right]}>
                      {typeof (r as any).amount_discounted === 'number' && (r as any).amount_discounted < r.amount ? (
                        <>
                          <Text style={{ color: '#dc2626', textDecoration: 'line-through' }}>{euro(r.amount)}</Text>
                          {'  '}
                          <Text style={{ fontWeight: 700 }}>{euro((r as any).amount_discounted)}</Text>
                        </>
                      ) : (
                        euro(r.amount)
                      )}
                    </Text>
                  </>
                )}
              </View>
            )
          })
        ) : (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 2, color: '#777' }]}>—</Text>
            <Text style={[s.td, s.right, { color: '#777' }]}>—</Text>
          </View>
        )}
        {typeof mountingCost === 'number' && Number.isFinite(mountingCost) && (
          <View style={s.tr}>
            <Text style={[s.td, { flex: 2 }]}>Montaggio</Text>
            <Text style={[s.td, s.right]}>{euro(mountingCost)}</Text>
          </View>
        )}
      </View>

      {/* ── Totals footer ── */}
      {(() => {
          const showIncl = !!showTotalIncl
          const vatPct = typeof vatPercent === 'number' && Number.isFinite(vatPercent) ? vatPercent : 22
          const displayedFinal = hasDiscount ? discountedTotal : originalTotal
          const vatAmount = displayedFinal * (vatPct / 100)
          const totalIncl = displayedFinal + vatAmount
          return (
            <View style={{ marginTop: 2, borderTopWidth: 1, borderTopColor: '#e5e7eb', borderStyle: 'solid', paddingTop: 8 }}>
              {/* Subtotale */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: hasDiscount ? 4 : 0 }}>
                <Text style={{ fontSize: 9, color: '#9ca3af' }}>Subtotale (IVA esclusa)</Text>
                <Text style={{ fontSize: 9, color: '#9ca3af' }}>{euro(originalTotal)}</Text>
              </View>

              {/* Sconto */}
              {hasDiscount && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, color: '#16a34a' }}>
                    {discount?.mode === 'pct' && typeof discount?.pct === 'number' && discount.pct > 0
                      ? `Sconto ${discount.pct}%`
                      : 'Sconto applicato'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#16a34a' }}>- {euro(originalTotal - discountedTotal)}</Text>
                </View>
              )}

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: '#111827', marginHorizontal: 8, marginBottom: 8 }} />

              {/* Totale finale */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
                    {showIncl ? 'Totale IVA inclusa' : 'Totale'}
                  </Text>
                  {showIncl && (
                    <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                      IVA {vatPct}% · di cui {euro(vatAmount)}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
                  {showIncl ? euro(totalIncl) : euro(displayedFinal)}
                </Text>
              </View>
            </View>
          )
        })()}
    </View>
  )
}
