import fs from 'fs';

let content = fs.readFileSync('src/pdf/sections/SummarySection.tsx', 'utf8');

// I will just read and overwrite the component entirely below the 'normalizePersianaNoFrameLabel' definition
const sections = content.split('  const normalizePersianaNoFrameLabel = (value: string) => {\n    const clean = value.trim().replace(/[.:;,_-]+$/g, \'\')\n    return /^persian[ae]\\s+senza\\s+telaio$/i.test(clean) ? \'Telaio Senza\' : value\n  }');

if (sections.length === 2) {
  const replacement = `  const normalizePersianaNoFrameLabel = (value: string) => {
    const clean = value.trim().replace(/[.:;,_-]+$/g, '')
    return /^persian[ae]\\s+senza\\s+telaio$/i.test(clean) ? 'Telaio Senza' : value
  }

  const showIncl = !!showTotalIncl
  const vatPct = typeof vatPercent === 'number' && Number.isFinite(vatPercent) ? vatPercent : 22
  const displayedFinal = hasDiscount ? discountedTotal : originalTotal
  const totalIncl = displayedFinal * (1 + vatPct / 100)

  return (
    <View style={s.block}>
      <Text style={s.h2}>Riepilogo preventivo</Text>
      <View style={{ marginTop: 2, paddingHorizontal: 4 }}>
        {totals.length > 0 ? (
          totals.map((r, i) => {
            const label = normalizePersianaNoFrameLabel(safeText(r.category, '-'))
            const k = \`row-\${label}-\${Number.isFinite(r.amount) ? r.amount : 0}-\${i}\`
            const pieces = (r as any).pieces as number | null
            const surfaceRows = buildSurfaceSummary((r as any).surfaces, items as any)
            
            const detailParts: string[] = []
            if (typeof pieces === 'number' && pieces > 0) detailParts.push(\`\${pieces} \${pieces === 1 ? 'pezzo' : 'pezzi'}\`)
            if (surfaceRows.length > 0) {
              detailParts.push(...surfaceRows.map((row) => {
                const parts = [formatMq(row.mq)]
                if (row.missingDimensions > 0) parts.push(\`(\${row.missingDimensions} senza dim.)\`)
                return parts.join(' · ')
              }))
            }

            return (
              <View key={k} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingTop: 6, paddingBottom: 6 }}>
                <Text style={{ flex: 2, paddingLeft: 0, paddingRight: 0, fontSize: 11, color: '#111827' }}> 
                  <Text style={{ fontWeight: 600 }}>\${label}</Text>
                  {detailParts.length > 0 && (
                    <Text style={{ color: '#6b7280', fontSize: 9 }}> · \${detailParts.join(' · ')}</Text>
                  )}
                </Text>
                <Text style={[s.right, { flex: 1, paddingRight: 0, paddingLeft: 0, fontSize: 11, color: '#111827' }]}>
                  {typeof (r as any).amount_discounted === 'number' && (r as any).amount_discounted < r.amount ? (
                    <>
                      <Text style={{ color: '#dc2626', textDecoration: 'line-through', fontSize: 9.5 }}>{euro(r.amount)}</Text>
                      {'  '}
                      <Text style={{ fontWeight: 600 }}>{euro((r as any).amount_discounted)}</Text>
                    </>
                  ) : (
                    <Text style={{ fontWeight: 600 }}>{euro(r.amount)}</Text>
                  )}
                </Text>
              </View>
            )
          })
        ) : (
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingTop: 6, paddingBottom: 6 }}>
            <Text style={{ flex: 2, color: '#9ca3af', fontSize: 11 }}>—</Text>
            <Text style={[s.right, { flex: 1, color: '#9ca3af', fontSize: 11 }]}>—</Text>
          </View>
        )}

        {typeof mountingCost === 'number' && Number.isFinite(mountingCost) && (
           <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingTop: 6, paddingBottom: 6 }}>
            <Text style={{ flex: 2, fontWeight: 600, color: '#111827', fontSize: 11, paddingLeft: 0, paddingRight: 0 }}>Montaggio</Text>
            <Text style={[s.right, { flex: 1, fontWeight: 600, color: '#111827', fontSize: 11, paddingLeft: 0, paddingRight: 0 }]}>{euro(mountingCost)}</Text>
          </View>
        )}

      </View>

      {/* ── Totals footer ── */}
      <View style={{ marginTop: 6, borderTopWidth: 1, borderTopColor: '#e5e7eb', borderStyle: 'solid', paddingTop: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: hasDiscount ? 4 : 0 }}>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>Subtotale (IVA esclusa)</Text>
          <Text style={{ fontSize: 9, color: '#9ca3af' }}>{euro(originalTotal)}</Text>
        </View>

        {hasDiscount && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 9, color: '#16a34a' }}>
                {discount?.mode === 'pct' && typeof discount?.pct === 'number' && discount.pct > 0
                  ? \`Sconto \${discount.pct}%\`
                  : 'Sconto applicato'}
              </Text>
            </View>
            <Text style={{ fontSize: 9, color: '#16a34a' }}>- {euro(originalTotal - discountedTotal)}</Text>
          </View>
        )}

        <View style={{ height: 1, backgroundColor: '#111827', marginHorizontal: 8, marginBottom: 8 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 8 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>
              {showIncl ? 'Totale IVA inclusa' : 'Totale'}
            </Text>
            {showIncl && (
              <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>
                IVA {vatPct}% · {euro(displayedFinal * (vatPct / 100))}
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
`;
  console.log("Rewriting");
  fs.writeFileSync('src/pdf/sections/SummarySection.tsx', sections[0] + replacement);
} else {
  console.log("Could not split content correctly");
}
