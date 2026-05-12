const fs = require('fs');

let code = fs.readFileSync('src/features/quotes/forms/WindowForm.tsx', 'utf8');

// The block starts near "Col total width" logic: 'const colTotalMm = formatMm(col.width_ratio ?? 0);'
let startCol = code.indexOf('const colTotalMm = formatMm(col.width_ratio ?? 0);');
if (startCol !== -1) {
    let startDiv = code.indexOf('<div className="mt-2 text-xs">', startCol);
    if(startDiv === -1) {
        startDiv = code.indexOf('<div className="mt-2">', startCol);
    }
    if (startDiv !== -1) {
        // Need to substitute to the end of the return
        let endDiv = code.indexOf('return (', startCol);
        let returnEnd = code.indexOf('            );', endDiv);
        
        if (returnEnd !== -1) {
            let prefix = code.slice(0, endDiv);
            let suffix = code.slice(returnEnd);
            let injection = `return (
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
                                                            <label className="text-gray-500">Larghezza Anta {rowIndex + 1}.{colIndex + 1} (tot mm)</label>
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
            code = prefix + injection + suffix;
            fs.writeFileSync('src/features/quotes/forms/WindowForm.tsx', code);
            console.log('Fixed');
        } else {
             console.log('Cant find end');
        }
    } else {
        console.log('Cant find StartDiv');
    }
} else {
    console.log('Cant find start');
}

