// src/components/editor/pricing/surface.ts
import type { QuoteItem } from '../../../domain/items'

export const surfaceMq = (w?: number, h?: number) => {
  if (!w || !h || w <= 0 || h <= 0) return 0
  const s = (w * h) / 1_000_000
  return round2(s)
}

/** Calcola l'area reale di un item, considerando l'eventuale gridWindow. */
export const itemSurfaceMq = (it: QuoteItem): number => {
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
    if (areaMm2 > 0) return round2(areaMm2 / 1_000_000)
  }
  return surfaceMq(it.width_mm, it.height_mm)
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const rowTotal = (it: QuoteItem) => {
  const mode = it.price_mode ?? 'per_mq'

  if (mode === 'total') {
    return round2(it.price_total ?? 0)
  }

  // default: per m²
  const mq = surfaceMq(it.width_mm, it.height_mm)
  const unit = (it.price_per_mq ?? 0) * mq
  const qty = it.qty ?? 1
  return round2(unit * qty)
}