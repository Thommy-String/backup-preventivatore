const fs = require('fs');

let code = fs.readFileSync('src/features/quotes/forms/WindowForm.tsx', 'utf8');

// 1. Add state for rowMaxHeightStr and colHeightStr
code = code.replace(
  'const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});',
  `const [rowMaxHeightStr, setRowMaxHeightStr] = useState<Record<number, string>>({});
    const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});
    const [colHeightStr, setColHeightStr] = useState<Record<string, string>>({});`
);

// 2. Sync loop update
code = code.replace(
  'const nextRowHeights: Record<number, string> = {};',
  `const nextRowHeights: Record<number, string> = {};
        const nextRowMaxHeights: Record<number, string> = {};`
);
code = code.replace(
  'const nextColWidths: Record<string, string> = {};',
  `const nextColWidths: Record<string, string> = {};
        const nextColHeights: Record<string, string> = {};`
);

code = code.replace(
  'nextRowHeights[ri] = formatMm(interpretRowHeight(r));',
  `nextRowHeights[ri] = formatMm(interpretRowHeight(r));
            nextRowMaxHeights[ri] = r.max_height_mm !== undefined ? formatMm(r.max_height_mm) : '';`
);

code = code.replace(
  'nextColWidths[`${ri}.${ci}`] = formatMm(c.width_ratio ?? 0);',
  'nextColWidths[`${ri}.${ci}`] = formatMm(c.width_ratio ?? 0);\n                nextColHeights[`${ri}.${ci}`] = c.height_mm !== undefined ? formatMm(c.height_mm) : \'\';'
);

code = code.replace(
  'setRowHeightStr(nextRowHeights);',
  `setRowHeightStr(nextRowHeights);
        setRowMaxHeightStr(nextRowMaxHeights);`
);

code = code.replace(
  'setColWidthStr(nextColWidths);',
  `setColWidthStr(nextColWidths);
        setColHeightStr(nextColHeights);`
);

// 3. Handlers
const handlers = `
    const updateRowMaxHeight = (rowIndex: number, val: number | undefined) => {
        const nextRows = grid.rows.map((r, i) => i === rowIndex ? { ...r, max_height_mm: val } : r);
        handleRowsChange(nextRows);
    };

    const onRowMaxHeightChange = (i: number, v: string) => {
        if (v === '' || allowMmInput(v)) setRowMaxHeightStr(prev => ({ ...prev, [i]: v }));
    };

    const onRowMaxHeightBlur = (i: number) => {
        const raw = rowMaxHeightStr[i] ?? '';
        if (raw === '') {
            updateRowMaxHeight(i, undefined);
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            updateRowMaxHeight(i, parsed);
            setRowMaxHeightStr(prev => ({ ...prev, [i]: formatMm(parsed) }));
        } else {
            updateRowMaxHeight(i, undefined);
        }
    };

    const updateColHeight = (rowIndex: number, colIndex: number, val: number | undefined) => {
        const nextRows = grid.rows.map((r, ri) => ri === rowIndex ? {
            ...r,
            cols: r.cols.map((c, ci) => ci === colIndex ? { ...c, height_mm: val } : c)
        } : r);
        handleRowsChange(nextRows);
    };

    const onColHeightChange = (ri: number, ci: number, v: string) => {
        if (v === '' || allowMmInput(v)) setColHeightStr(prev => ({ ...prev, [\`\${ri}.\${ci}\`]: v }));
    };

    const onColHeightBlur = (ri: number, ci: number) => {
        const key = \`\${ri}.\${ci}\`;
        const raw = colHeightStr[key] ?? '';
        if (raw === '') {
            updateColHeight(ri, ci, undefined);
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            updateColHeight(ri, ci, parsed);
            setColHeightStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
        } else {
            updateColHeight(ri, ci, undefined);
        }
    };
`;

code = code.replace(
  'const onSashCountChange = (i: number, v: string) => {',
  handlers + '\n    const onSashCountChange = (i: number, v: string) => {'
);


// 4. UI Inputs

// Row Max Height input
const rowMaxHeightHtml = `
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Altezza massima sovrascritta (mm)</label>
                                    <input
                                        className="input"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Usa StdRiga"
                                        value={rowMaxHeightStr[rowIndex] ?? ''}
                                        onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowMaxHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">Numero Ante</label>`;

code = code.replace(
  /<div className="flex-1">\s*<label className="text-xs text-gray-500">Numero Ante<\/label>/g,
  rowMaxHeightHtml
);


// Col Height input
const colHeightHtml = `
                                            <div className="mt-2 text-xs">
                                                <div className="text-gray-400 mb-1">
                                                    {autoSplit
                                                        ? "Auto-ripartizione attiva: larghezze uguali sul totale"
                                                        : "Imposta larghezza TOTALE anta (mm)"}
                                                </div>
                                                {autoSplit ? (
                                                    <div className="text-gray-600 mb-2">Larghezza totale stimata: <b>{formatMm(grid.width_mm / Math.max(1, row.cols.length))} mm</b></div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <label className="text-gray-500">Larghezza Anta {rowIndex + 1}.{colIndex + 1} (metà mm)</label>
                                                            {(() => {
                                                                const lockKey = \`\${rowIndex}.\${colIndex}\`;
                                                                const isLocked = Boolean(colLocked[lockKey]);
                                                                return (
                                                                    <button type="button" title={isLocked ? 'Sblocco misura' : 'Blocca misura'} onClick={() => toggleColLock(rowIndex, colIndex)} className="p-1 rounded">
                                                                        {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                                                                    </button>
                                                                );
                                                            })()}
                                                        </div>
                                                        <input
                                                            className={\`input \${Boolean(colLocked[\`\${rowIndex}.\${colIndex}\`]) ? 'bg-gray-100' : ''} mb-2\`}
                                                            type="text"
                                                            inputMode="decimal"
                                                            pattern="\\d+([.,]\\d{0,1})?"
                                                            value={colWidthStr[\`\${rowIndex}.\${colIndex}\`] ?? colTotalMm}
                                                            onChange={(e) => onColWidthChange(rowIndex, colIndex, e.target.value)}
                                                            onBlur={() => onColWidthBlur(rowIndex, colIndex)}
                                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                        />
                                                    </>
                                                )}
                                                
                                                <label className="text-gray-500 block mb-1 mt-2">Altezza speciale anta (mm, opzionale)</label>
                                                <input
                                                    className="input"
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Standard riga"
                                                    value={colHeightStr[\`\${rowIndex}.\${colIndex}\`] ?? ''}
                                                    onChange={(e) => onColHeightChange(rowIndex, colIndex, e.target.value)}
                                                    onBlur={() => onColHeightBlur(rowIndex, colIndex)}
                                                    onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                />
                                            </div>
`;

code = code.replace(
  /<div className="mt-2">\s*<div className="text-\[11px\] text-gray-400 mb-1">[\s\S]*?(?=<\/div>\s*<\/div>\s*\)\s*\}\)\(\)\}\s*<\/div>\s*\)\)\}\s*<\/div>)/g,
  colHeightHtml
);

fs.writeFileSync('src/features/quotes/forms/WindowForm.tsx', code);
console.log('Patch complete.');
