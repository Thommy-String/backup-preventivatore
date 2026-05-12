//src/features/quotes/forms/WindowForm.tsx
import { useState, useEffect } from "react";
import * as React from "react";
import type { ItemFormProps } from "../types";
import type { WindowItem } from "../types";
import type { GridWindowConfig, LeafState } from "../types";
import { Trash2, Lock, Unlock, Plus, Ruler, Layers, Paintbrush2, Settings2, Hash } from "lucide-react";
import { RalColorPicker } from "../components/RalColorPicker";

// --- UI helpers (module scope: defining these inside WindowForm would remount on every render,
// causing inputs to lose focus and the page to scroll to top on each keystroke) ---
const SectionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}> = ({ icon, title, subtitle, action, children }) => (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600">
                    {icon}
                </span>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{title}</div>
                    {subtitle && <div className="text-[11px] text-gray-500 truncate">{subtitle}</div>}
                </div>
            </div>
            {action}
        </header>
        <div className="p-4 space-y-4">{children}</div>
    </section>
);

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> =
    ({ label, hint, children, className }) => (
        <div className={className}>
            <label className="block text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">{label}</label>
            {children}
            {hint && <div className="mt-1 text-[11px] text-gray-400">{hint}</div>}
        </div>
    );

// --- Costanti e Tipi ---
const openingOptions: { value: LeafState; label: string }[] = [
    { value: 'fissa', label: 'Fissa' },
    { value: 'apre_sx', label: 'Apertura Sinistra' },
    { value: 'apre_dx', label: 'Apertura Destra' },
    { value: 'vasistas', label: 'Vasistas' },
    { value: 'apre_sx+vasistas', label: 'Anta-ribalta Sinistra' },
    { value: 'apre_dx+vasistas', label: 'Anta-ribalta Destra' },
    { value: 'scorrevole_sx', label: 'Scorrevole Sinistra' },
    { value: 'scorrevole_dx', label: 'Scorrevole Destra' },
];

// Funzioni Helper
const createNewRow = (): GridWindowConfig['rows'][0] => ({
    height_ratio: 1,
    cols: [{ width_ratio: 1, leaf: { state: 'fissa' }, handle: false }],
});

const createNewSash = (): GridWindowConfig['rows'][0]['cols'][0] => ({
    width_ratio: 1,
    leaf: { state: 'fissa' },
    handle: false,
});

// Valori fissi per telaio e montante
const FRAME_MM = 70;
const MULLION_MM = 60;

// Valori standard per vetrocamera
const VETROCAMERA_OPTIONS = [
    '3.3 - 20Cu7040.Ar-3.3i',
    '4 - 22Ar - 3.3.i',
    '3.3.i - 16 Ar - 4 - 16Ar - 3.3.i',
] as const;

// Profili disponibili (lista rapida)
const PROFILE_SYSTEMS = [
    'WDS 76 MD',
    'WDS 76 AD',
    'WDS 76 PORTE',
    'WDS 76 SCORREVOLE',
    'ULTRA 70',
    'ULTRA 60',
] as const;

// === Helper numeric con precisione a 0.1 mm ===
const MM_DECIMALS = 1;
const MM_SCALE = Math.pow(10, MM_DECIMALS);
const MIN_MM = 1;
const MIN_SCALED = Math.round(MIN_MM * MM_SCALE);

function sumNum(arr: number[]) { return arr.reduce((s, v) => s + v, 0); }
const clampMm = (value: number) => Math.max(MIN_MM, value);
const roundMm = (value: number) => Math.max(MIN_MM, Math.round(value * MM_SCALE) / MM_SCALE);
const formatMm = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    const rounded = roundMm(value);
    const fixed = rounded.toFixed(MM_DECIMALS);
    return fixed.replace(/\.?0+$/, '');
};
const allowMmInput = (value: string) => value === '' || /^\d+([.,]\d{0,1})?$/.test(value);
const parseMmInput = (value: string) => {
    if (value == null) return null;
    const normalized = value.replace(',', '.').trim();
    if (normalized === '') return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return null;
    return roundMm(parsed);
};
const toScaled = (value: number) => Math.max(MIN_SCALED, Math.round(clampMm(value) * MM_SCALE));
const fromScaled = (value: number) => value / MM_SCALE;
const normalizeDimensionValues = (values: number[], total: number) => {
    const fallback = total > 0 ? total / Math.max(1, values.length) : 1;
    const sanitized = values.map(v => (Number.isFinite(v) && v > 0 ? v : fallback));
    const sumValues = sumNum(sanitized);
    if (sumValues > 0 && total > 0 && sumValues <= 1.0001) {
        return sanitized.map(v => v * total);
    }
    return sanitized.map(clampMm);
};
const allocateScaled = (totalScaled: number, weightsScaled: number[], minScaled: number) => {
    const len = weightsScaled.length;
    if (len === 0) return [];
    const base = Array(len).fill(minScaled);
    let remaining = totalScaled - minScaled * len;
    if (remaining <= 0) {
        const fallback = Array(len).fill(Math.floor(totalScaled / len));
        let residue = totalScaled - sumNum(fallback);
        for (let i = len - 1; i >= 0 && residue > 0; i -= 1) {
            fallback[i] += 1;
            residue -= 1;
        }
        return fallback;
    }
    const safeWeights = weightsScaled.map(w => Math.max(0, w));
    const weightSum = sumNum(safeWeights);
    const shares = weightSum > 0
        ? safeWeights.map(w => Math.floor((w / weightSum) * remaining))
        : Array(len).fill(Math.floor(remaining / len));
    let residue = remaining - sumNum(shares);
    const result = base.map((v, i) => v + shares[i]);
    if (residue > 0) {
        for (let i = len - 1; i >= 0 && residue > 0; i -= 1) {
            result[i] += 1;
            residue -= 1;
        }
    } else if (residue < 0) {
        for (let i = len - 1; i >= 0 && residue < 0; i -= 1) {
            const possible = result[i] - minScaled;
            if (possible <= 0) continue;
            const delta = Math.min(possible, -residue);
            result[i] -= delta;
            residue += delta;
        }
    }
    return result;
};
const splitEvenly = (total: number, count: number) => {
    if (count <= 0) return [];
    const totalScaled = Math.round(clampMm(total) * MM_SCALE);
    const distributed = allocateScaled(totalScaled, Array(count).fill(1), MIN_SCALED);
    return distributed.map(fromScaled);
};

/** Ribilancia le altezze delle righe con precisione a 0.1 mm. */
function rebalanceRowsToTotal(
    rows: GridWindowConfig['rows'],
    totalH: number,
    fixedIndex?: number,
    fixedNewVal?: number
): GridWindowConfig['rows'] {
    if (!rows.length) return rows;
    const totalScaled = Math.round(clampMm(totalH) * MM_SCALE);
    const baseValues = normalizeDimensionValues(rows.map(r => r.height_ratio ?? 0), totalH);
    const rawScaled = baseValues.map(toScaled);
    let targetScaled: number[];

    if (
        typeof fixedIndex === 'number' &&
        fixedIndex >= 0 &&
        fixedIndex < rows.length &&
        typeof fixedNewVal === 'number'
    ) {
        const safeFixed = Math.min(
            Math.max(MIN_SCALED, Math.round(clampMm(fixedNewVal) * MM_SCALE)),
            totalScaled - MIN_SCALED * Math.max(0, rows.length - 1)
        );
        const otherIdx = rawScaled.map((_, i) => i).filter(i => i !== fixedIndex);
        const otherWeights = otherIdx.map(i => rawScaled[i]);
        const remainingScaled = Math.max(0, totalScaled - safeFixed);
        const distributed = allocateScaled(remainingScaled, otherWeights, MIN_SCALED);
        targetScaled = Array(rows.length).fill(MIN_SCALED);
        targetScaled[fixedIndex] = safeFixed;
        otherIdx.forEach((idx, pos) => {
            targetScaled[idx] = distributed[pos] ?? MIN_SCALED;
        });
    } else {
        targetScaled = allocateScaled(totalScaled, rawScaled, MIN_SCALED);
    }

    const diff = totalScaled - sumNum(targetScaled);
    if (diff !== 0 && targetScaled.length > 0) {
        const last = targetScaled.length - 1;
        targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + diff);
    }

    return rows.map((r, i) => ({ ...r, height_ratio: fromScaled(targetScaled[i]) / totalH }));
}

/** Ribilancia le larghezze delle ante con precisione a 0.1 mm. */
function rebalanceColsToTotal(
    cols: GridWindowConfig['rows'][0]['cols'],
    totalW: number,
    fixedIndex?: number,
    fixedNewVal?: number,
    lockedMask?: boolean[]
): GridWindowConfig['rows'][0]['cols'] {
    if (!cols.length) return cols;
    const totalScaled = Math.round(clampMm(totalW) * MM_SCALE);
    const baseValues = normalizeDimensionValues(cols.map(c => c.width_ratio ?? 0), totalW);
    const rawScaled = baseValues.map(toScaled);
    let targetScaled: number[] = Array(cols.length).fill(0);

    const lockedIdxs = new Set<number>();
    if (Array.isArray(lockedMask)) {
        lockedMask.forEach((v, i) => { if (v) lockedIdxs.add(i); });
    }

    // If user edited a specific col, consider it fixed as well (uses fixedNewVal)
    let fixedScaledForIndex: number | null = null;
    if (
        typeof fixedIndex === 'number' &&
        fixedIndex >= 0 &&
        fixedIndex < cols.length &&
        typeof fixedNewVal === 'number'
    ) {
        const safeFixed = Math.min(
            Math.max(MIN_SCALED, Math.round(clampMm(fixedNewVal) * MM_SCALE)),
            totalScaled - MIN_SCALED * Math.max(0, cols.length - 1)
        );
        fixedScaledForIndex = safeFixed;
        lockedIdxs.add(fixedIndex);
    }

    // Assign locked values (either the explicit fixed value, or current rawScaled)
    lockedIdxs.forEach(i => {
        targetScaled[i] = i === fixedIndex && fixedScaledForIndex !== null ? fixedScaledForIndex : rawScaled[i];
    });

    const sumLocked = sumNum(Array.from(lockedIdxs).map(i => targetScaled[i] || 0));
    const remainingScaled = Math.max(0, totalScaled - sumLocked);

    const unlockedIdxs = rawScaled.map((_, i) => i).filter(i => !lockedIdxs.has(i));
    if (unlockedIdxs.length === 0) {
        // nothing to distribute, fill last with remainder if needed
        if (targetScaled.length > 0) {
            const last = targetScaled.length - 1;
            targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + (totalScaled - sumNum(targetScaled)));
        }
    } else {
        const weights = unlockedIdxs.map(i => rawScaled[i]);
        const distributed = allocateScaled(remainingScaled, weights, MIN_SCALED);
        unlockedIdxs.forEach((idx, pos) => {
            targetScaled[idx] = distributed[pos] ?? MIN_SCALED;
        });
    }

    const diff = totalScaled - sumNum(targetScaled);
    if (diff !== 0 && targetScaled.length > 0) {
        const last = targetScaled.length - 1;
        targetScaled[last] = Math.max(MIN_SCALED, targetScaled[last] + diff);
    }

    return cols.map((c, i) => ({ ...c, width_ratio: fromScaled(targetScaled[i]) }));
}



export function WindowForm({ draft, onChange }: ItemFormProps<WindowItem>) {
    if (!draft) return null;
    const d = draft;

    const [autoSplit, setAutoSplit] = useState(true);

    const getGrid = (): GridWindowConfig | undefined => (d as any)?.options?.gridWindow;
    const grid = getGrid();

    const interpretRowHeight = (r: GridWindowConfig['rows'][0]) => {
        const raw = r.height_ratio ?? 0;
        if (!raw || raw <= 0) return grid ? grid.height_mm / Math.max(1, grid.rows.length) : 0;
        return raw * (grid ? grid.height_mm : 1);
    };

    const [widthStr, setWidthStr] = useState(typeof d.width_mm === 'number' ? formatMm(d.width_mm) : '');
    const [heightStr, setHeightStr] = useState(typeof d.height_mm === 'number' ? formatMm(d.height_mm) : '');
    const [qtyStr, setQtyStr] = useState(String(d.qty ?? 1));

    // --- Per-row and per-anta string states for safe editing ---
    const [rowHeightStr, setRowHeightStr] = useState<Record<number, string>>({});
    const [sashCountStr, setSashCountStr] = useState<Record<number, string>>({});
    const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});
    const [colHeightStr, setColHeightStr] = useState<Record<string, string>>({});
    const [rowMaxHeightStr, setRowMaxHeightStr] = useState<Record<number, string>>({});
    const [barOffsetStr, setBarOffsetStr] = useState<Record<string, string>>({});
    const [handleHeightStr, setHandleHeightStr] = useState<Record<string, string>>({});
    const [colLocked, setColLocked] = useState<Record<string, boolean>>({});

    const getRowLockedMask = (rowIndex: number) => {
        const row = grid?.rows?.[rowIndex];
        if (!row) return [] as boolean[];
        return row.cols.map((_, ci) => Boolean(colLocked[`${rowIndex}.${ci}`]));
    };


    const updateRowMaxHeight = (rowIndex: number, hm: number | undefined) => {
        const rows = [...((getGrid()?.rows) || [])];
        if (!rows[rowIndex]) return;
        rows[rowIndex] = { ...rows[rowIndex], max_height_mm: hm };
        onChange({ ...draft, options: { ...draft.options, gridWindow: { ...getGrid(), rows } } } as WindowItem);
    };

    const onRowMaxHeightChange = (ri: number, v: string) => {
        if (allowMmInput(v)) setRowMaxHeightStr(prev => ({ ...prev, [ri]: v }));
    };

    const onRowMaxHeightBlur = (ri: number) => {
        const raw = rowMaxHeightStr[ri] ?? '';
        if (raw === '') {
            updateRowMaxHeight(ri, undefined);
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            updateRowMaxHeight(ri, parsed);
            setRowMaxHeightStr(prev => ({ ...prev, [ri]: formatMm(parsed) }));
        }
    };

    const onColHeightChange = (ri: number, ci: number, v: string) => {
        if (allowMmInput(v)) setColHeightStr(prev => ({ ...prev, [`${ri}.${ci}`]: v }));
    };

    const onColHeightBlur = (ri: number, ci: number) => {
        const key = `${ri}.${ci}`;
        const raw = colHeightStr[key] ?? '';
        if (raw === '') {
            const rows = [...((getGrid()?.rows) || [])];
            if (rows[ri]?.cols[ci]) {
                rows[ri].cols[ci] = { ...rows[ri].cols[ci], height_mm: undefined };
                onChange({ ...draft, options: { ...draft.options, gridWindow: { ...getGrid(), rows } } } as WindowItem);
            }
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            const rows = [...((getGrid()?.rows) || [])];
            if (rows[ri]?.cols[ci]) {
                rows[ri].cols[ci] = { ...rows[ri].cols[ci], height_mm: parsed };
                onChange({ ...draft, options: { ...draft.options, gridWindow: { ...getGrid(), rows } } } as WindowItem);
            }
            setColHeightStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
        }
    };

    const toggleColLock = (rowIndex: number, colIndex: number) => {
        const key = `${rowIndex}.${colIndex}`;
        setColLocked(prev => ({ ...prev, [key]: !prev[key] }));
    };

    useEffect(() => {
        setQtyStr(String(d.qty ?? 1));
    }, [d.qty]);

    useEffect(() => {
        setWidthStr(typeof d.width_mm === 'number' ? formatMm(d.width_mm) : '');
        setHeightStr(typeof d.height_mm === 'number' ? formatMm(d.height_mm) : '');
    }, [d.width_mm, d.height_mm]);

    useEffect(() => {
        if (!grid) return;
        const nextHandleHeights: Record<string, string> = {};
        grid.rows.forEach((row, ri) => {
            row.cols.forEach((col, ci) => {
                const v = col.handle_height_mm;
                nextHandleHeights[`${ri}.${ci}`] = typeof v === 'number' && Number.isFinite(v) ? formatMm(v) : '';
            });
        });
        setHandleHeightStr(nextHandleHeights);
    }, [grid?.rows]);

    // Sync string states from grid structure/values
    useEffect(() => {
        if (!grid) return;
        const nextRowHeights: Record<number, string> = {};
        const nextSashCounts: Record<number, string> = {};
        const nextColWidths: Record<string, string> = {};
        const nextBarOffsets: Record<string, string> = {};
        const nextColLocked: Record<string, boolean> = {};

        grid.rows.forEach((r, ri) => {
            nextRowHeights[ri] = formatMm(interpretRowHeight(r));
            nextSashCounts[ri] = String(r.cols.length);
            r.cols.forEach((c, ci) => {
                nextColWidths[`${ri}.${ci}`] = formatMm(c.width_ratio ?? 0);
                nextColLocked[`${ri}.${ci}`] = colLocked[`${ri}.${ci}`] ?? false;
                const bar = c.leaf?.horizontalBars?.[0];
                if (bar && Number.isFinite(bar.offset_mm)) {
                    const rowHeight = interpretRowHeight(r);
                    const raw = Math.max(MIN_MM, Math.min(rowHeight, bar.offset_mm));
                    const bottomValue = bar.origin === 'bottom'
                        ? raw
                        : Math.max(MIN_MM, Math.min(rowHeight, rowHeight - raw));
                    nextBarOffsets[`${ri}.${ci}`] = formatMm(bottomValue);
                }
            });
        });
        setRowHeightStr(nextRowHeights);
        setSashCountStr(nextSashCounts);
        setColWidthStr(nextColWidths);
        setBarOffsetStr(nextBarOffsets);
        setColLocked(nextColLocked);
    }, [grid?.rows]);

    // Inizializzazione
    useEffect(() => {
        if (!grid) {
            const initialGrid: GridWindowConfig = {
                width_mm: d.width_mm || 1200, height_mm: d.height_mm || 1500,
                frame_mm: FRAME_MM, mullion_mm: MULLION_MM,
                handle_color: '#ffffff',
                wood_effect: false,
                rows: [{
                    height_ratio: 1,
                    cols: [{ width_ratio: 1, leaf: { state: 'fissa' }, handle: false }]
                }],
                glazing: 'doppio',
                showDims: true,
            };
            onChange({ ...(d as any), options: { ...(d as any).options, gridWindow: initialGrid } });
        }
    }, [grid, d.width_mm, d.height_mm, onChange, d]);

    if (!grid) { return <div>Caricamento...</div>; }

    // --- Patch atomica: aggiorna contemporaneamente draft e gridWindow ---
    const applyPatch = (
        draftPatch: Partial<WindowItem> = {},
        gridPatch: Partial<GridWindowConfig> = {}
    ) => {
        const curGrid: GridWindowConfig = (d as any)?.options?.gridWindow ?? {
            width_mm: d.width_mm || 1200,
            height_mm: d.height_mm || 1500,
            frame_mm: FRAME_MM,
            mullion_mm: MULLION_MM,
            handle_color: '#ffffff',
            wood_effect: false,
            rows: [{
                height_ratio: (d.height_mm || 1500),
                cols: [{ width_ratio: (d.width_mm || 1200), leaf: { state: 'fissa' } }]
            }],
            glazing: 'doppio',
            showDims: true,
        };

        const next = {
            ...(d as any),
            ...draftPatch,
            options: {
                ...(d as any).options,
                gridWindow: { ...curGrid, ...gridPatch },
            },
        };

        onChange(next as any);
    };

    // --- Gestori Eventi ---
    const handleGridChange = (newGridData: Partial<GridWindowConfig>) => {
        applyPatch({}, newGridData);
    };

    const handleRowsChange = (newRows: GridWindowConfig['rows']) => {
        handleGridChange({ rows: newRows });
    };

    const handleMeasureUpdate = (key: 'width_mm' | 'height_mm', value: string) => {
        if (value === '') return;
        const parsed = parseMmInput(value);
        if (parsed === null) return;
        const commitTotal = roundMm(Math.max(100, parsed));

        if (key === 'width_mm') {
            const nextRows = grid.rows.map((r, rIdx) => {
                if (autoSplit) {
                    const count = Math.max(1, r.cols.length);
                    const distributed = splitEvenly(commitTotal, count);
                    return {
                        ...r,
                        cols: r.cols.map((c, idx) => ({
                            ...c,
                            width_ratio: distributed[idx] ?? distributed[distributed.length - 1] ?? commitTotal / count,
                        })),
                    };
                }
                return { ...r, cols: rebalanceColsToTotal(r.cols, commitTotal, undefined, undefined, getRowLockedMask(rIdx)) };
            });

            applyPatch(
                { width_mm: commitTotal },
                { width_mm: commitTotal, rows: nextRows }
            );
            setWidthStr(formatMm(commitTotal));
        } else {
            // Scale existing row heights proportionally instead of redistributing evenly
            const currentHeights = grid.rows.map(r => interpretRowHeight(r));
            const currentTotal = sumNum(currentHeights);
            const scale = currentTotal > 0 ? commitTotal / currentTotal : 1;
            const nextRows = grid.rows.map(r => ({ ...r, height_ratio: (interpretRowHeight(r) * scale) / commitTotal }));
            applyPatch(
                { height_mm: commitTotal },
                { height_mm: commitTotal, rows: nextRows }
            );
            setHeightStr(formatMm(commitTotal));
        }
    };

    const addRow = () => {
        const totalH = grid.height_mm;
        const nextRows = [...grid.rows, createNewRow()];
        let resized = nextRows;
        if (autoSplit) {
            const distributed = splitEvenly(totalH, nextRows.length);
            resized = nextRows.map((r, idx) => ({
                ...r,
                height_ratio: (distributed[idx] ?? distributed[distributed.length - 1] ?? totalH / nextRows.length) / totalH,
            }));
        } else {
            resized = rebalanceRowsToTotal(nextRows, totalH);
        }
        handleRowsChange(resized);
    };
    const removeRow = (rowIndex: number) => {
        if (grid.rows.length <= 1) return;
        handleRowsChange(grid.rows.filter((_, i) => i !== rowIndex));
    };

    const handleSashCountChange = (rowIndex: number, newCount: number) => {
        const count = Math.max(1, newCount || 1);
        const totalW = grid.width_mm;

        let nextRows = grid.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            let newCols = [...row.cols];
            const cur = newCols.length;
            if (count > cur) {
                for (let i = 0; i < count - cur; i++) newCols.push(createNewSash());
            } else if (count < cur) {
                newCols = newCols.slice(0, count);
            }

            // Assicura che ogni anta abbia un glazing valorizzato (eredita dal default di griglia)
            newCols = newCols.map((c) => ({ ...c, glazing: (c as any).glazing ?? grid.glazing }));

            if (autoSplit) {
                const distributed = splitEvenly(totalW, count);
                const cols = newCols.map((c, idx) => ({
                    ...c,
                    width_ratio: distributed[idx] ?? distributed[distributed.length - 1] ?? totalW / count,
                }));
                return { ...row, cols };
            }
            // no autoSplit: ribilancia proporzionalmente
            return { ...row, cols: rebalanceColsToTotal(newCols, totalW, undefined, undefined, getRowLockedMask(rowIndex)) };
        });

        handleRowsChange(nextRows);
    };

    const updateSashOpening = (rowIndex: number, colIndex: number, newState: LeafState) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) => {
                    if (cIdx !== colIndex) return col;
                    const nextCol = {
                        ...col,
                        leaf: { ...(col.leaf ?? {}), state: newState },
                    } as typeof col;
                    if (newState === 'fissa') {
                        nextCol.handle = false;
                    }
                    return nextCol;
                });
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateSashHandle = (rowIndex: number, colIndex: number, enabled: boolean) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) => {
                    if (cIdx !== colIndex) return col;
                    const state = col.leaf?.state ?? 'fissa';
                    if (state === 'fissa') return { ...col, handle: false };
                    return { ...col, handle: enabled };
                });
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateSashHorizontalBar = (rowIndex: number, colIndex: number, newOffsetMm: number | null) => {
        const frameVal = grid.frame_mm ?? FRAME_MM;
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx !== rowIndex) return row;
            const safeRowHeight = interpretRowHeight(row);
            const baseMin = MULLION_MM / 2;
            const safeMin = Math.min(safeRowHeight / 2, Math.max(baseMin, frameVal * 0.12));
            const maxOffset = Math.max(safeMin, safeRowHeight - safeMin);
            const clampedBottom = typeof newOffsetMm === 'number'
                ? Math.min(maxOffset, Math.max(safeMin, roundMm(newOffsetMm)))
                : null;

            const newCols = row.cols.map((col, cIdx) => {
                if (cIdx !== colIndex) return col;
                const baseLeaf = col.leaf ?? { state: 'fissa' as LeafState };
                const nextLeaf = { ...baseLeaf };

                if (clampedBottom === null) {
                    if (nextLeaf.horizontalBars) delete nextLeaf.horizontalBars;
                } else {
                    nextLeaf.horizontalBars = [{ offset_mm: clampedBottom, origin: 'bottom' }];
                }

                return { ...col, leaf: nextLeaf };
            });
            return { ...row, cols: newCols };
        });

        handleRowsChange(newRows);
    };

    // Nuova funzione: aggiorna il glazing di una singola anta
    const updateSashGlazing = (rowIndex: number, colIndex: number, newGlazing: GridWindowConfig['glazing']) => {
        const newRows = grid.rows.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                const newCols = row.cols.map((col, cIdx) =>
                    cIdx === colIndex ? { ...col, glazing: newGlazing } : col
                );
                return { ...row, cols: newCols };
            }
            return row;
        });
        handleRowsChange(newRows);
    };

    const updateRowHeightMm = (rowIndex: number, newHeightMm: number) => {
        const totalH = grid.height_mm;
        const nextRows = rebalanceRowsToTotal(grid.rows, totalH, rowIndex, newHeightMm);
        handleRowsChange(nextRows);
    };

    const updateColWidthMm = (rowIndex: number, colIndex: number, newWidthMm: number) => {
        const totalW = grid.width_mm;
        const nextRows = grid.rows.map((r, i) => {
            if (i !== rowIndex) return r;
            return { ...r, cols: rebalanceColsToTotal(r.cols, totalW, colIndex, newWidthMm, getRowLockedMask(rowIndex)) };
        });
        handleRowsChange(nextRows);
    };

    // --- Handlers for safe editing of numeric fields (row/cols) ---
    const onRowHeightChange = (i: number, v: string) => {
        if (allowMmInput(v)) setRowHeightStr(prev => ({ ...prev, [i]: v }));
    };
    const onRowHeightBlur = (i: number) => {
        const raw = rowHeightStr[i] ?? '';
        if (raw === '') return;
        const parsed = parseMmInput(raw);
        if (parsed === null) return;
        updateRowHeightMm(i, parsed);
        setRowHeightStr(prev => ({ ...prev, [i]: formatMm(parsed) }));
    };

    const onSashCountChange = (i: number, v: string) => {
        if (v === '' || /^\d+$/.test(v)) setSashCountStr(prev => ({ ...prev, [i]: v }));
    };
    const onSashCountBlur = (i: number) => {
        const raw = sashCountStr[i] ?? '';
        const n = raw === '' ? 1 : Math.max(1, Number(raw) || 1);
        handleSashCountChange(i, n);
        setSashCountStr(prev => ({ ...prev, [i]: String(n) }));
    };

    const onColWidthChange = (ri: number, ci: number, v: string) => {
        if (allowMmInput(v)) setColWidthStr(prev => ({ ...prev, [`${ri}.${ci}`]: v }));
    };
    const onColWidthBlur = (ri: number, ci: number) => {
        const key = `${ri}.${ci}`;
        const raw = colWidthStr[key] ?? '';
        if (raw === '') return;
        const parsed = parseMmInput(raw);
        if (parsed === null) return;
        updateColWidthMm(ri, ci, parsed);
        setColWidthStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
    };

    return (
        <div className="space-y-5">
            {/* === IDENTITÀ VOCE === */}
            <SectionCard icon={<Hash size={16} />} title="Identità voce" subtitle="Titolo e riferimento usati in editor e PDF">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Titolo voce" hint="Se vuoto, verrà mostrato il tipo (es. “Finestra”).">
                        <input
                            className="input"
                            type="text"
                            placeholder="es. Portafinestra soggiorno"
                            value={(d as any).title ?? ""}
                            onChange={(e) => applyPatch({ title: e.target.value })}
                        />
                    </Field>
                    <Field label="Riferimento" hint="Stanza, posizione o codice interno.">
                        <input className="input" type="text" placeholder="es. Salotto" value={d.reference ?? ''} onChange={(e) => applyPatch({ reference: e.target.value })} />
                    </Field>
                </div>
            </SectionCard>

            {/* === DIMENSIONI E QUANTITÀ === */}
            <SectionCard
                icon={<Ruler size={16} />}
                title="Dimensioni totali"
                subtitle="Misure complessive (telaio incluso) e numero di pezzi"
            >
                <div className="grid grid-cols-3 gap-3">
                    <Field label="Larghezza (mm)">
                        <input
                            className="input"
                            type="text"
                            inputMode="decimal"
                            pattern="\\d+([.,]\\d{0,1})?"
                            value={widthStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (allowMmInput(v)) setWidthStr(v);
                            }}
                            onBlur={() => {
                                if (widthStr === '') return;
                                handleMeasureUpdate('width_mm', widthStr);
                            }}
                        />
                    </Field>

                    <Field label="Altezza (mm)">
                        <input
                            className="input"
                            type="text"
                            inputMode="decimal"
                            pattern="\\d+([.,]\\d{0,1})?"
                            value={heightStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (allowMmInput(v)) setHeightStr(v);
                            }}
                            onBlur={() => {
                                if (heightStr === '') return;
                                handleMeasureUpdate('height_mm', heightStr);
                            }}
                        />
                    </Field>

                    <Field label="Quantità">
                        <input
                            className="input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={qtyStr}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v === '' || /^\d+$/.test(v)) setQtyStr(v);
                            }}
                            onBlur={() => {
                                const n = qtyStr === '' ? 1 : Math.max(1, Number(qtyStr) || 1);
                                applyPatch({ qty: n as any });
                                setQtyStr(String(n));
                            }}
                        />
                    </Field>
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={autoSplit} onChange={(e) => setAutoSplit(e.target.checked)} />
                    <span>Ripartisci automaticamente la larghezza tra le ante</span>
                </label>
            </SectionCard>

            {/* === STRUTTURA: RIGHE E ANTE === */}
            <SectionCard
                icon={<Layers size={16} />}
                title="Struttura della finestra"
                subtitle="Definisci righe (orizzontali) e ante per ciascuna riga"
                action={
                    <button type="button" onClick={addRow} className="btn btn-sm inline-flex items-center gap-1.5">
                        <Plus size={14} /> Riga
                    </button>
                }
            >
                <div className="space-y-4">
                    {grid.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="rounded-xl border border-gray-200 bg-gray-50/40 overflow-hidden">
                            {/* Header riga */}
                            <div className="flex items-end gap-3 px-3 pt-3 pb-2 border-b border-gray-100 bg-white">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">
                                    R{rowIndex + 1}
                                </div>
                                <Field label={`Altezza riga (mm)`} className="flex-1">
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="decimal"
                                        pattern="\\d+([.,]\\d{0,1})?"
                                        value={rowHeightStr[rowIndex] ?? formatMm(interpretRowHeight(row))}
                                        onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                </Field>
                                <Field label="Max alt. (mm)" className="w-32">
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="opz."
                                        title="Altezza massima riga (opzionale)"
                                        value={rowMaxHeightStr[rowIndex] ?? (getGrid()?.rows || [])[rowIndex]?.max_height_mm ?? ''}
                                        onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowMaxHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                    />
                                </Field>
                                <Field label="N° ante" className="w-28" hint={`≈ ${formatMm(grid.width_mm / Math.max(1, row.cols.length))} mm ad anta`}>
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={sashCountStr[rowIndex] ?? String(row.cols.length)}
                                        onChange={(e) => onSashCountChange(rowIndex, e.target.value)}
                                        onBlur={() => onSashCountBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                </Field>
                                {grid.rows.length > 1 && (
                                    <button type="button" onClick={() => removeRow(rowIndex)} className="btn-icon text-gray-400 hover:text-red-500 mb-1" title="Rimuovi riga"><Trash2 size={16} /></button>
                                )}
                            </div>

                            {/* Griglia ante */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                            {row.cols.map((col, colIndex) => {
                                const state = col.leaf?.state ?? 'fissa';
                                const canHaveHandle = state !== 'fissa';
                                const handleChecked = Boolean(col.handle);
                                const handleId = `handle-${rowIndex}-${colIndex}`;
                                const barKey = `${rowIndex}.${colIndex}`;
                                const bar = col.leaf?.horizontalBars?.[0];
                                const hasBar = Boolean(bar);
                                const barId = `bar-${rowIndex}-${colIndex}`;
                                const rowHeight = interpretRowHeight(row);
                                let storedBarValue = '';
                                if (bar && Number.isFinite(bar.offset_mm)) {
                                    const raw = Math.max(MIN_MM, Math.min(rowHeight, bar.offset_mm));
                                    const bottomValue = bar.origin === 'bottom'
                                        ? raw
                                        : Math.max(MIN_MM, Math.min(rowHeight, rowHeight - raw));
                                    storedBarValue = formatMm(bottomValue);
                                }
                                const lockKey = `${rowIndex}.${colIndex}`;
                                const isLocked = Boolean(colLocked[lockKey]);
                                const colTotalMm = formatMm(col.width_ratio ?? 0);

                                return (
                                <div key={colIndex} className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
                                    {/* Header anta */}
                                    <div className="flex items-center justify-between">
                                        <div className="inline-flex items-center gap-2">
                                            <span className="inline-flex h-6 px-2 items-center rounded-md bg-gray-100 text-[11px] font-semibold text-gray-700 border border-gray-200">
                                                Anta {rowIndex + 1}.{colIndex + 1}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Apertura + Vetro */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Apertura">
                                            <select
                                                className="input"
                                                value={state}
                                                onChange={e => updateSashOpening(rowIndex, colIndex, e.target.value as LeafState)}
                                            >
                                                {openingOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Vetro">
                                            <select
                                                className="input"
                                                value={(col as any).glazing ?? grid.glazing}
                                                onChange={(e) => updateSashGlazing(rowIndex, colIndex, e.target.value as GridWindowConfig['glazing'])}
                                            >
                                                <option value="singolo">Singolo</option>
                                                <option value="doppio">Doppio</option>
                                                <option value="triplo">Triplo</option>
                                                <option value="satinato">Satinato</option>
                                            </select>
                                        </Field>
                                    </div>

                                    {/* Maniglia + altezza */}
                                    <div className="rounded-md bg-gray-50 border border-gray-100 p-2 space-y-2">
                                        <label className={`flex items-center gap-2 text-sm select-none ${canHaveHandle ? 'text-gray-700 cursor-pointer' : 'text-gray-400'}`}>
                                            <input
                                                id={handleId}
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={handleChecked}
                                                disabled={!canHaveHandle}
                                                onChange={(e) => updateSashHandle(rowIndex, colIndex, e.target.checked)}
                                            />
                                            <span>Maniglia</span>
                                            {!canHaveHandle && <span className="text-[10px] text-gray-400">(solo per ante apribili)</span>}
                                        </label>
                                        {handleChecked && (state === 'apre_sx' || state === 'apre_dx' || state === 'apre_sx+vasistas' || state === 'apre_dx+vasistas') && (
                                            <Field label="Altezza maniglia da terra (mm)">
                                                <input
                                                    className="input"
                                                    type="text"
                                                    inputMode="decimal"
                                                    pattern="\\d+([.,]\\d{0,1})?"
                                                    placeholder={String(Math.round((grid.height_mm || 1500) / 2))}
                                                    value={handleHeightStr[`${rowIndex}.${colIndex}`] ?? ''}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (allowMmInput(v)) setHandleHeightStr(prev => ({ ...prev, [`${rowIndex}.${colIndex}`]: v }));
                                                    }}
                                                    onBlur={() => {
                                                        const key = `${rowIndex}.${colIndex}`;
                                                        const raw = handleHeightStr[key] ?? '';
                                                        const newRows = grid.rows.map((r, ri) => {
                                                            if (ri !== rowIndex) return r;
                                                            return {
                                                                ...r,
                                                                cols: r.cols.map((c, ci) => {
                                                                    if (ci !== colIndex) return c;
                                                                    if (raw === '') return { ...c, handle_height_mm: undefined };
                                                                    const parsed = parseMmInput(raw);
                                                                    if (parsed === null) return c;
                                                                    const clamped = roundMm(Math.max(MIN_MM, Math.min(grid.height_mm || 1500, parsed)));
                                                                    setHandleHeightStr(prev => ({ ...prev, [key]: formatMm(clamped) }));
                                                                    return { ...c, handle_height_mm: clamped };
                                                                }),
                                                            };
                                                        });
                                                        handleRowsChange(newRows);
                                                    }}
                                                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                    onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                />
                                            </Field>
                                        )}
                                    </div>

                                    {/* Traverso orizzontale */}
                                    <div className="rounded-md bg-gray-50 border border-gray-100 p-2 space-y-2">
                                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                            <input
                                                id={barId}
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={hasBar}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        const frameVal = grid.frame_mm ?? FRAME_MM;
                                                        const baseMin = MULLION_MM / 2;
                                                        const safeMin = Math.min(rowHeight / 2, Math.max(baseMin, frameVal * 0.12));
                                                        const safeMax = Math.max(safeMin, rowHeight - safeMin);
                                                        const rawDefault = rowHeight / 2 || safeMin;
                                                        const defaultOffset = roundMm(Math.min(safeMax, Math.max(safeMin, rawDefault)));
                                                        updateSashHorizontalBar(rowIndex, colIndex, defaultOffset);
                                                        setBarOffsetStr(prev => ({ ...prev, [barKey]: formatMm(defaultOffset) }));
                                                    } else {
                                                        updateSashHorizontalBar(rowIndex, colIndex, null);
                                                        setBarOffsetStr(prev => {
                                                            const next = { ...prev };
                                                            delete next[barKey];
                                                            return next;
                                                        });
                                                    }
                                                }}
                                            />
                                            <span>Traverso orizzontale</span>
                                        </label>
                                        {hasBar && (
                                            <Field label="Altezza dal bordo inferiore (mm)">
                                                <input
                                                    className="input"
                                                    type="text"
                                                    inputMode="decimal"
                                                    pattern="\\d+([.,]\\d{0,1})?"
                                                    value={barOffsetStr[barKey] ?? storedBarValue}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (allowMmInput(v)) setBarOffsetStr(prev => ({ ...prev, [barKey]: v }));
                                                    }}
                                                    onBlur={() => {
                                                        const raw = barOffsetStr[barKey] ?? '';
                                                        if (raw === '') return;
                                                        const parsed = parseMmInput(raw);
                                                        if (parsed === null) return;
                                                        updateSashHorizontalBar(rowIndex, colIndex, parsed);
                                                        setBarOffsetStr(prev => ({ ...prev, [barKey]: formatMm(parsed) }));
                                                    }}
                                                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                    onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                />
                                            </Field>
                                        )}
                                    </div>

                                    {/* Misure dell'anta */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {autoSplit ? (
                                            <Field label="Larghezza anta" hint="Auto-ripartizione attiva">
                                                <div className="input flex items-center text-sm text-gray-700 bg-gray-50">
                                                    <b className="mr-1">{formatMm(grid.width_mm / Math.max(1, row.cols.length))}</b> mm
                                                </div>
                                            </Field>
                                        ) : (
                                            <Field label={`Larghezza (mm)`}>
                                                <div className="relative">
                                                    <input
                                                        className={`input pr-9 ${isLocked ? 'bg-gray-100' : ''}`}
                                                        type="text"
                                                        inputMode="decimal"
                                                        pattern="\\d+([.,]\\d{0,1})?"
                                                        value={colWidthStr[lockKey] ?? colTotalMm}
                                                        onChange={(e) => onColWidthChange(rowIndex, colIndex, e.target.value)}
                                                        onBlur={() => onColWidthBlur(rowIndex, colIndex)}
                                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                    />
                                                    <button
                                                        type="button"
                                                        title={isLocked ? 'Sblocca misura' : 'Blocca misura'}
                                                        onClick={() => toggleColLock(rowIndex, colIndex)}
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                                                    >
                                                        {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                                                    </button>
                                                </div>
                                            </Field>
                                        )}
                                        <Field label="Altezza speciale (mm)" hint="Lascia vuoto per usare l'altezza riga">
                                            <input
                                                className="input"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="—"
                                                value={colHeightStr[lockKey] ?? (getGrid()?.rows || [])[rowIndex]?.cols[colIndex]?.height_mm ?? ''}
                                                onChange={(e) => onColHeightChange(rowIndex, colIndex, e.target.value)}
                                                onBlur={() => onColHeightBlur(rowIndex, colIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </Field>
                                    </div>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* === VETRO === */}
            <SectionCard
                icon={<Settings2 size={16} />}
                title="Vetro"
                subtitle="Composizione vetrocamera"
            >
                <Field label="Vetrocamera">
                    <select
                        className="input"
                        value={VETROCAMERA_OPTIONS.includes((d as any).glass_spec) ? (d as any).glass_spec : 'custom'}
                        onChange={(e) => {
                            if (VETROCAMERA_OPTIONS.includes(e.target.value as any)) {
                                applyPatch({ glass_spec: e.target.value });
                            } else {
                                applyPatch({ glass_spec: '' });
                            }
                        }}
                    >
                        {VETROCAMERA_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                        <option value="custom">Personalizzato</option>
                    </select>
                    {(!VETROCAMERA_OPTIONS.includes((d as any).glass_spec)) && (
                        <input
                            className="input mt-2"
                            type="text"
                            placeholder="Inserisci vetrocamera personalizzata"
                            value={(d as any).glass_spec ?? ''}
                            onChange={(e) => applyPatch({ glass_spec: e.target.value || null })}
                        />
                    )}
                </Field>
            </SectionCard>

            {/* === FINITURE === */}
            <SectionCard
                icon={<Paintbrush2 size={16} />}
                title="Finiture"
                subtitle="Colori del profilo, della maniglia e della ferramenta"
            >
                <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Colore profilo</div>
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-amber-700"
                                checked={Boolean((grid as any)?.wood_effect)}
                                onChange={(e) => applyPatch({}, ({ wood_effect: e.target.checked } as any))}
                            />
                            Effetto legno
                        </label>
                    </div>
                    <RalColorPicker
                        previewColor={(grid as any)?.frame_color ?? '#ffffff'}
                        labelValue={(d as any).color ?? ''}
                        onPreviewColorChange={(hex) => applyPatch({}, ({ frame_color: hex } as any))}
                        onLabelChange={(text) => applyPatch({ color: text })}
                        onRalSelect={(ral) => {
                             applyPatch(
                                { color: `${ral.code} ${ral.name}` },
                                { frame_color: ral.hex } as any
                             );
                        }}
                    />
                </div>

                <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1.5">Colore maniglia</div>
                    <RalColorPicker
                        previewColor={(grid as any)?.handle_color ?? '#ffffff'}
                        labelValue={(d as any).handle_color ?? ''}
                        onPreviewColorChange={(hex) => applyPatch({}, ({ handle_color: hex } as any))}
                        onLabelChange={(text) => applyPatch({ handle_color: text } as any)}
                        onRalSelect={(ral) => {
                            applyPatch(
                                { handle_color: `${ral.code} ${ral.name}` } as any,
                                { handle_color: ral.hex } as any
                            );
                        }}
                    />
                </div>

                <Field label="Colore cerniere">
                    <input
                        className="input w-full"
                        type="text"
                        placeholder="Es. Bianco / Inox / Nero"
                        value={(d as any).hinges_color ?? ''}
                        onChange={(e) => applyPatch({ hinges_color: e.target.value })}
                    />
                </Field>
            </SectionCard>

            {/* === DATI TECNICI === */}
            <SectionCard
                icon={<Settings2 size={16} />}
                title="Dati tecnici"
                subtitle="Sistema profilo e prestazioni energetiche"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="Sistema profilo">
                        <select
                            className="input w-full"
                            value={(d as any).profile_system ?? ''}
                            onChange={(e) => applyPatch({ profile_system: e.target.value || null })}
                        >
                            <option value="">— Seleziona —</option>
                            {PROFILE_SYSTEMS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Uw (W/m²K)" hint="Trasmittanza termica">
                        <input
                            className="input w-full"
                            type="text"
                            placeholder="Es. 1.3 oppure ≤ 1.1 W/m²K"
                            value={(d as any).uw != null ? String((d as any).uw) : ''}
                            onChange={(e) => {
                                const raw = e.target.value;
                                applyPatch({ uw: raw === '' ? null : raw as any });
                            }}
                        />
                    </Field>
                </div>
            </SectionCard>
        </div>
    );
}
