import type { BaseItem } from "../types"

/**
 * Calcola la superficie reale di un infisso in m².
 * Se è disponibile una configurazione `gridWindow`, somma l'area effettiva di
 * ogni anta tenendo conto delle eventuali altezze speciali per riga
 * (`row.max_height_mm`) o per singola anta (`col.height_mm`).
 * In assenza di griglia ricade su `width_mm * height_mm`.
 */
export function surfaceMq(it: Pick<BaseItem,'width_mm'|'height_mm'> & { options?: any }){
  const gw = (it as any)?.options?.gridWindow
  if (gw && Array.isArray(gw.rows) && gw.rows.length > 0) {
    const totalH = Number(gw.height_mm) || Number((it as any).height_mm) || 0
    const rowRatios = gw.rows.map((r: any) => Number(r?.height_ratio) > 0 ? Number(r.height_ratio) : 0)
    const ratioSum = rowRatios.reduce((a: number, b: number) => a + b, 0) || gw.rows.length
    let areaMm2 = 0
    gw.rows.forEach((row: any, ri: number) => {
      const rowH = typeof row?.max_height_mm === 'number' && row.max_height_mm > 0
        ? row.max_height_mm
        : (totalH * (rowRatios[ri] || 0)) / ratioSum
      const cols = Array.isArray(row?.cols) ? row.cols : []
      cols.forEach((col: any) => {
        const w = Number(col?.width_ratio) > 0 ? Number(col.width_ratio) : 0
        const h = typeof col?.height_mm === 'number' && col.height_mm > 0
          ? Math.min(col.height_mm, rowH)
          : rowH
        if (w > 0 && h > 0) areaMm2 += w * h
      })
    })
    if (areaMm2 > 0) return Math.round((areaMm2 / 1_000_000) * 100) / 100
  }
  const w = Number((it as any).width_mm) || 0
  const h = Number((it as any).height_mm) || 0
  const s = (w * h) / 1_000_000
  return Math.round(s * 100) / 100
}

export function rowTotal(it: BaseItem){
  const mode = it.price_mode ?? 'per_mq'
  if (mode === 'total') {
    return round2(it.price_total ?? 0)
  }
  if (mode === 'per_pezzo') {
    const unit = (it as any).price_per_piece ?? 0
    return round2(unit * (it.qty ?? 1))
  }
  const mq = surfaceMq(it)
  const unit = (it.price_per_mq ?? 0) * mq
  return round2(unit * (it.qty ?? 1))
}

export function euro(n: number){
  return new Intl.NumberFormat('it-IT', { style:'currency', currency:'EUR' }).format(n || 0)
}
function round2(n:number){ return Math.round(n*100)/100 }