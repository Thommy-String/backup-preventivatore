import type { ManualTotalSurfaceEntry, SurfaceGroupId } from '../types'

export type SurfaceGroupMeta = {
  id: SurfaceGroupId
  label: string
  match: (kind: string) => boolean
}

type SurfaceItem = Record<string, any>

const LOWER = (value: unknown) => String(value ?? '').toLowerCase()

export const SURFACE_GROUPS: SurfaceGroupMeta[] = [
  {
    id: 'windows',
    label: 'Finestre e portefinestre',
    match: (kind: string) => /finestr|serrament|scorrevol|portafin/i.test(kind),
  },
  {
    id: 'persiane',
    label: 'Persiane',
    match: (kind: string) => /persian/i.test(kind),
  },
  {
    id: 'tapparelle',
    label: 'Tapparelle',
    match: (kind: string) => /tapparell|avvolgibil/i.test(kind),
  },
  {
    id: 'zanzariere',
    label: 'Zanzariere',
    match: (kind: string) => /zanzar/i.test(kind),
  },
  {
    id: 'cassonetti',
    label: 'Cassonetti',
    match: (kind: string) => /casson/i.test(kind),
  },
  {
    id: 'custom',
    label: 'Voci custom',
    match: (kind: string) => /custom|personalizzat/i.test(kind),
  },
]

const SURFACE_GROUP_IDS = new Set<SurfaceGroupId>(SURFACE_GROUPS.map((g) => g.id))

export const formatMq = (n: number) => `${n.toFixed(2)} m²`

const pickNumber = (input: unknown) => {
  const n = Number(input)
  return Number.isFinite(n) ? n : null
}

const pickDimension = (it: SurfaceItem, keys: string[]) => {
  for (const key of keys) {
    const val = pickNumber((it as any)[key])
    if (val && val > 0) return val
  }
  return null
}

export const computeItemSurfaceMq = (it: SurfaceItem): number => {
  const qty = pickNumber((it as any).qty) ?? 1
  if (!qty || qty <= 0) return 0

  // Se c'è una gridWindow, somma le aree reali tenendo conto di max_height_mm
  // (per riga) e height_mm (per anta), così le finestre con ante di altezza
  // ridotta non vengono sovrastimate.
  const gw = (it as any)?.options?.gridWindow
  if (gw && Array.isArray(gw.rows) && gw.rows.length > 0) {
    const totalH = pickNumber(gw.height_mm) ?? pickNumber((it as any).height_mm) ?? 0
    const rowRatios = gw.rows.map((r: any) => pickNumber(r?.height_ratio) ?? 0).map((v: number) => v > 0 ? v : 0)
    const ratioSum = rowRatios.reduce((a: number, b: number) => a + b, 0) || gw.rows.length
    let areaMm2 = 0
    gw.rows.forEach((row: any, ri: number) => {
      const maxH = pickNumber(row?.max_height_mm)
      const rowH = (maxH && maxH > 0) ? maxH : (totalH * (rowRatios[ri] || 0)) / ratioSum
      const cols = Array.isArray(row?.cols) ? row.cols : []
      cols.forEach((col: any) => {
        const w = pickNumber(col?.width_ratio) ?? 0
        const colH = pickNumber(col?.height_mm)
        const h = (colH && colH > 0) ? Math.min(colH, rowH) : rowH
        if (w > 0 && h > 0) areaMm2 += w * h
      })
    })
    if (areaMm2 > 0) return round2((areaMm2 / 1_000_000) * qty)
  }

  const w = pickDimension(it, ['width_mm', 'larghezza_mm', 'larghezza', 'width'])
  const h = pickDimension(it, ['height_mm', 'altezza_mm', 'altezza', 'height'])
  if (!w || !h || w <= 0 || h <= 0) return 0
  const mq = (w * h) / 1_000_000
  return round2(mq * qty)
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const describeDimensions = (it: SurfaceItem) => {
  const w = pickDimension(it, ['width_mm', 'larghezza_mm', 'larghezza', 'width'])
  const h = pickDimension(it, ['height_mm', 'altezza_mm', 'altezza', 'height'])
  if (w && h) return `L ${Math.round(w)} × H ${Math.round(h)} mm`
  if (w) return `L ${Math.round(w)} mm`
  if (h) return `H ${Math.round(h)} mm`
  return null
}

export const getGroupForItem = (it: SurfaceItem): SurfaceGroupId | null => {
  const kind = LOWER((it as any)?.kind)
  const group = SURFACE_GROUPS.find((g) => g.match(kind))
  return group ? group.id : null
}

export const normalizeSurfaceEntries = (entries?: ManualTotalSurfaceEntry[] | null): ManualTotalSurfaceEntry[] => {
  if (!Array.isArray(entries)) return []
  const seen = new Set<SurfaceGroupId>()
  return entries
    .map((entry) => {
      const group = entry?.group
      if (!group || !SURFACE_GROUP_IDS.has(group) || seen.has(group)) return null
      const mode: ManualTotalSurfaceEntry['mode'] = entry?.mode === 'subset' ? 'subset' : 'all'
      const ids = Array.isArray(entry?.itemIds)
        ? Array.from(new Set(entry.itemIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)))
        : undefined
      seen.add(group)
      if (mode === 'subset' && (!ids || ids.length === 0)) {
        // sottoinsieme vuoto inutile
        return null
      }
      return { group, mode, itemIds: mode === 'subset' ? ids : undefined }
    })
    .filter(Boolean) as ManualTotalSurfaceEntry[]
}

const itemsForEntry = (entry: ManualTotalSurfaceEntry, items: SurfaceItem[]) => {
  const groupItems = items.filter((it) => getGroupForItem(it) === entry.group)
  if (entry.mode === 'all') return groupItems
  const pickIds = new Set(entry.itemIds ?? [])
  return groupItems.filter((it) => pickIds.has(String(it.id)))
}

export type SurfaceSummaryRow = {
  id: SurfaceGroupId
  label: string
  mq: number
  selectedCount: number
  missingDimensions: number
  /** Somma dei prezzi unitari (unit_price * qty) delle voci collegate */
  priceTotal: number
  /** Somma dei prezzi scontati effettivi (unit_price_discounted se presente, altrimenti unit_price) * qty */
  priceTotalDiscounted: number
  /** Indica se almeno una voce ha un prezzo scontato attivo */
  hasDiscount: boolean
  /** Numero di voci selezionate prive di prezzo unitario */
  missingUnitPrice: number
}

export const buildSurfaceSummary = (
  entries: ManualTotalSurfaceEntry[] | undefined,
  items: SurfaceItem[]
): SurfaceSummaryRow[] => {
  const normalized = normalizeSurfaceEntries(entries)
  if (normalized.length === 0) return []
  return normalized.map((entry) => {
    const meta = SURFACE_GROUPS.find((g) => g.id === entry.group)!
    const selectedItems = itemsForEntry(entry, items)
    let mq = 0
    let missing = 0
    let priceTotal = 0
    let priceTotalDiscounted = 0
    let hasDiscount = false
    let missingUnitPrice = 0
    selectedItems.forEach((item) => {
      const area = computeItemSurfaceMq(item)
      if (area > 0) {
        mq += area
      } else {
        missing += 1
      }
      const unit = pickNumber((item as any).unit_price)
      const unitDisc = pickNumber((item as any).unit_price_discounted)
      const qty = pickNumber((item as any).qty) ?? 1
      const q = qty > 0 ? qty : 1
      const baseUnit = unit != null && unit > 0 ? unit : null
      const discUnit = unitDisc != null && unitDisc > 0 && (baseUnit == null || unitDisc < baseUnit) ? unitDisc : null
      if (baseUnit != null) {
        priceTotal += baseUnit * q
      }
      if (discUnit != null) {
        priceTotalDiscounted += discUnit * q
        hasDiscount = true
      } else if (baseUnit != null) {
        priceTotalDiscounted += baseUnit * q
      }
      if (baseUnit == null && discUnit == null) {
        missingUnitPrice += 1
      }
    })
    return {
      id: entry.group,
      label: meta.label,
      mq: round2(mq),
      selectedCount: selectedItems.length,
      missingDimensions: missing,
      priceTotal: round2(priceTotal),
      priceTotalDiscounted: round2(priceTotalDiscounted),
      hasDiscount,
      missingUnitPrice,
    }
  })
}

export const summarizeEntriesAsText = (entries: ManualTotalSurfaceEntry[] | undefined, items: SurfaceItem[]) => {
  return buildSurfaceSummary(entries, items).map((row) => {
    const base = `${row.label} ${formatMq(row.mq)}`
    if (row.missingDimensions > 0) {
      return `${base} (dati mancanti per ${row.missingDimensions} voce${row.missingDimensions === 1 ? '' : 'i'})`
    }
    return base
  })
}
