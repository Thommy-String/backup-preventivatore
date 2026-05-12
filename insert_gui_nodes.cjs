const fs = require('fs');

let code = fs.readFileSync('src/features/quotes/forms/WindowForm.tsx', 'utf8');


const colHeightHtml = `
                                            <div className="mt-2">
                                                <div className="text-[11px] text-gray-400 mb-1">
                                                    {autoSplit
                                                        ? "Auto-ripartizione attiva: larghezze uguali sul totale"
                                                        : "Imposta larghezza TOTALE anta (mm)"}
                                                </div>
                                                {autoSplit ? (
                                                    <div className="text-xs text-gray-600">Larghezza totale stimata: <b>{formatMm(grid.width_mm / Math.max(1, row.cols.length))} mm</b></div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs text-gray-500">Larghezza Anta {rowIndex + 1}.{colIndex + 1} (totale mm)</label>
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
                                                            className={\`input \${Boolean(colLocked[\`\${rowIndex}.\${colIndex}\`]) ? 'bg-gray-100' : ''}\`}
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
                                                
                                                <div className="mt-4">
                                                    <label className="text-xs text-gray-500 block mb-1">Altezza speciale anta (mm, opzionale)</label>
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
                                            </div>
`;


let colTarget = `<div className="mt-2">
                                                <div className="text-[11px] text-gray-400 mb-1">`;
let idx = code.indexOf(colTarget);
let nextReturnEnd = code.indexOf(');', idx);

if (idx !== -1) {
    let start = code.slice(0, idx);
    let end = code.slice(nextReturnEnd);
    code = start + colHeightHtml.trim() + '\n                                        ' + end;
}
fs.writeFileSync('src/features/quotes/forms/WindowForm.tsx', code);
