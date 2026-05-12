const fs = require('fs');

const path = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [colHeightStr, setColHeightStr]')) {
    content = content.replace(
        'const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});',
        `const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});
    const [colHeightStr, setColHeightStr] = useState<Record<string, string>>({});
    const [rowMaxHeightStr, setRowMaxHeightStr] = useState<Record<number, string>>({});`
    );
}

if (!content.includes('const onColHeightChange')) {
    content = content.replace(
        'const toggleColLock = (ri: number, ci: number) => {',
        `const updateRowMaxHeight = (rowIndex: number, hm: number | undefined) => {
        applyConfigPatch(c => {
            const next = { ...c };
            if (!next.rows[rowIndex]) return;
            next.rows[rowIndex] = { ...next.rows[rowIndex], max_height_mm: hm };
        });
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
        if (allowMmInput(v)) setColHeightStr(prev => ({ ...prev, [\`\${ri}.\${ci}\`]: v }));
    };

    const onColHeightBlur = (ri: number, ci: number) => {
        const key = \`\${ri}.\${ci}\`;
        const raw = colHeightStr[key] ?? '';
        if (raw === '') {
            applyConfigPatch(c => {
                const next = { ...c };
                if (next.rows[ri]?.cols[ci]) {
                    next.rows[ri].cols[ci] = { ...next.rows[ri].cols[ci], height_mm: undefined };
                }
            });
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            applyConfigPatch(c => {
                const next = { ...c };
                if (next.rows[ri]?.cols[ci]) {
                    next.rows[ri].cols[ci] = { ...next.rows[ri].cols[ci], height_mm: parsed };
                }
            });
            setColHeightStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
        }
    };

    const toggleColLock = (ri: number, ci: number) => {`
    );
}

// Add max row height input if not there
if (content.match(/placeholder={\`Alt. riga \\(mm\\)\`}/)) {
    if (!content.includes('Max alt.')) {
        content = content.replace(
            /(<input[^>]*placeholder={`Alt\. riga \(mm\)`}[^>]*\/>\s*<\/div>)/,
            `$1
                                        <div className="flex flex-col gap-1 w-28 relative">
                                            <input
                                                className="input text-xs h-7 border-blue-200 focus:border-blue-500"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={\`Max alt. (mm)\`}
                                                title="Altezza massima riga (opzionale)"
                                                value={rowMaxHeightStr[rowIndex] ?? windowConf.rows[rowIndex]?.max_height_mm ?? ''}
                                                onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowMaxHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>`
        );
    }
}

// Add column height input if not there
if (!content.includes('Altezza speciale anta')) {
    content = content.replace(
        /(onKeyDown={\(e\) => \{ if \(e\.key === 'ArrowUp' \|\| e\.key === 'ArrowDown'\) e\.preventDefault\(\); \}}\s*\/>\s*<\/>\s*)\)(}\s*<\/div>\s*\);\s*}\)\(\)}\s*<\/div>\s*\)\)\}\s*<\/div>\s*\)\)\})/,
        `$1)}
                                                <div className="mt-4">
                                                    <label className="text-xs text-gray-500 block mb-1">Altezza speciale anta (mm, opzionale)</label>
                                                    <input
                                                        className="input"
                                                        type="text"
                                                        inputMode="decimal"
                                                        placeholder="Standard riga"
                                                        value={colHeightStr[\`\${rowIndex}.\${colIndex}\`] ?? windowConf.rows[rowIndex]?.cols[colIndex]?.height_mm ?? ''}
                                                        onChange={(e) => onColHeightChange(rowIndex, colIndex, e.target.value)}
                                                        onBlur={() => onColHeightBlur(rowIndex, colIndex)}
                                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                    />
                                                </div>
                                            $2`
    );
}

fs.writeFileSync(path, content, 'utf8');
