const fs = require('fs');
let code = fs.readFileSync('src/features/quotes/forms/WindowForm.tsx', 'utf8');

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

// Locate the block starting with: const colTotalMm = formatMm(col.width_ratio ?? 0);
let idx = code.indexOf('const colTotalMm = formatMm(col.width_ratio ?? 0);');
let divStartIdx = code.indexOf('<div className="mt-2 text-xs">', idx);
if (divStartIdx === -1){
 divStartIdx = code.indexOf('<div className="mt-2">', idx);
}
let returnEndIdx = code.indexOf(');', code.indexOf('return (', idx));

if (idx !== -1 && divStartIdx !== -1 && returnEndIdx !== -1) {
    let prefix = code.slice(0, divStartIdx);
    let suffix = code.slice(returnEndIdx);
    code = prefix + colHeightHtml + suffix;
    fs.writeFileSync('src/features/quotes/forms/WindowForm.tsx', code);
    console.log('Fixed block.');
} else {
    console.log('Failed to find block');
}
