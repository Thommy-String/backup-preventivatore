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
  theme,
}: SummarySectionProps) {
  const discountedBg = theme?.soft || '#e8f7ec'
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
    const highlightBg = { backgroundColor: '#f7f7f7' }

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

          {hasDiscount ? (
            <>
              <View style={[s.tr]}>
                <Text style={[s.td, { flex: 2, fontWeight: 700 }, ...(showIncl ? [] : [highlightBg]) ]}>TOTALE (IVA ESCLUSA)</Text>
                <Text style={[s.td, s.right, { fontWeight: 700 }, ...(showIncl ? [] : [highlightBg]) ]}>{euro(originalTotal)}</Text>
              </View>

              <View style={[s.tr, { borderBottomWidth: 0, backgroundColor: discountedBg }]}> 
                <Text style={[s.td, { flex: 2, fontWeight: 700 }]}> 
                  {(
                    discount?.mode === 'pct' &&
                    typeof discount?.pct === 'number' &&
                    discount.pct > 0
                  )
                    ? `TOTALE SCONTATO DEL ${discount.pct}% (IVA ESCLUSA)`
                    : 'TOTALE SCONTATO (IVA ESCLUSA)'
                  }
                </Text>
                <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(discountedTotal)}</Text>
              </View>
            </>
          ) : (
            <View style={[s.tr, { borderBottomWidth: 0 }]}> 
              <Text style={[s.td, { flex: 2, fontWeight: 700 }, ...(showIncl ? [] : [{ backgroundColor: '#f7f7f7' }])]}>TOTALE (IVA ESCLUSA)</Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }, ...(showIncl ? [] : [{ backgroundColor: '#f7f7f7' }])]}>{euro(originalTotal)}</Text>
            </View>
          )}

          {showIncl ? (
            <>
              <View style={[s.tr]}> 
                <Text style={[s.td, { flex: 2, color: '#6b7280' }]}>
                  IVA <Text style={{ color: '#9ca3af' }}>({vatPct}%)</Text>
                </Text>
                <Text style={[s.td, s.right, { color: '#374151' }]}>{euro(displayedFinal * (vatPct / 100))}</Text>
              </View>
              <View style={[s.tr, { borderTopWidth: 0 }]}> 
                <View style={[s.td, { flex: 2, backgroundColor: '#f7f7f7', flexDirection: 'column' }]}> 
                  <Text style={{ fontWeight: 700 }}>TOTALE (IVA INCLUSA)</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                    di cui IVA {euro(displayedFinal * (vatPct / 100))} ({vatPct}%)
                  </Text>
                </View>
                <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(totalIncl)}</Text>
              </View>
            </>
          ) : null}
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
        {hasDiscount ? (
          <>
            <View style={[s.tr]}>
              <Text style={[s.td, { flex: 2, fontWeight: 700 }, ...((showTotalIncl ? [] : [{ backgroundColor: '#f7f7f7' }]) as any[])]}>TOTALE (IVA ESCLUSA)</Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }, ...((showTotalIncl ? [] : [{ backgroundColor: '#f7f7f7' }]) as any[])]}>{euro(originalTotal)}</Text>
            </View>

            <View style={[s.tr, { borderBottomWidth: 0, backgroundColor: '#e8f7ec' }]}> 
              <Text style={[s.td, { flex: 2, fontWeight: 700 }]}> 
                {(
                  discount?.mode === 'pct' &&
                  typeof discount?.pct === 'number' &&
                  discount.pct > 0
                )
                  ? `TOTALE SCONTATO DEL ${discount.pct}% (IVA ESCLUSA)`
                  : 'TOTALE SCONTATO (IVA ESCLUSA)'
                }
              </Text>
              <Text style={[s.td, s.right, { fontWeight: 700 }]}>{euro(discountedTotal)}</Text>
            </View>
          </>
        ) : (
          <View style={[s.tr, { borderBottomWidth: 0 }]}> 
            <Text style={[s.td, { flex: 2, fontWeight: 700 }, ...((showTotalIncl ? [] : [{ backgroundColor: '#f7f7f7' }]) as any[])]}>TOTALE (IVA ESCLUSA)</Text>
            <Text style={[s.td, s.right, { fontWeight: 700 }, ...((showTotalIncl ? [] : [{ backgroundColor: '#f7f7f7' }]) as any[])]}>{euro(originalTotal)}</Text>
          </View>
        )}
        {(() => {
          const showIncl = !!showTotalIncl
          const vatPct = typeof vatPercent === 'number' && Number.isFinite(vatPercent) ? vatPercent : 22
          const displayedFinal = hasDiscount ? discountedTotal : originalTotal
          if (!showIncl) return null
          const vatAmount = displayedFinal * (vatPct / 100)
          const totalIncl = displayedFinal + vatAmount
          return (
            <>
              <View style={[s.tr]}> 
                <Text style={[s.td, { flex: 2, color: '#6b7280' }]}>
                  IVA <Text style={{ color: '#9ca3af' }}>({vatPct}%)</Text>
                </Text>
                <Text style={[s.td, s.right, { color: '#374151' }]}>{euro(vatAmount)}</Text>
              </View>
              <View style={[s.tr, { borderTopWidth: 0 }]}> 
                <View style={[s.td, { flex: 2, backgroundColor: '#f7f7f7', flexDirection: 'column' }]}> 
                  <Text style={{ fontWeight: 700 }}>TOTALE (IVA INCLUSA)</Text>
                  <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>
                    di cui IVA {euro(vatAmount)} ({vatPct}%)
                  </Text>
                </View>
                <Text style={[s.td, s.right, { fontWeight: 700, backgroundColor: '#f7f7f7' }]}>{euro(totalIncl)}</Text>
              </View>
            </>
          )
        })()}
      </View>
    </View>
  )
}
