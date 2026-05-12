const fs = require('fs');
const path = "/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx";
let src = fs.readFileSync(path, 'utf8');

// 1. Add states
if (!src.includes('const [colHeightStr, setColHeightStr]')) {
    src = src.replace(
        'const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});',
        `const [colWidthStr, setColWidthStr] = useState<Record<string, string>>({});\n    const [colHeightStr, setColHeightStr] = useState<Record<string, string>>({});\n    const [rowMaxHeightStr, setRowMaxHeightStr] = useState<Record<number, string>>({});`
    );
}

// 2. Add methods
if (!src.includes('const onColHeightChange')) {
    src = src.replace(
        `    const toggleColLock = (rowIndex: number, colIndex: number) => {`,
        `
    const updateRowMaxHeight = (rowIndex: number, hm: number | undefined) => {
        const rows = [...(windowConf.rows || [])];
        if (!rows[rowIndex]) return;
        rows[rowIndex] = { ...rows[rowIndex], max_height_mm: hm };
        onChange({ ...draft, options: { ...draft.options, gridWindow: { ...windowConf, rows } } } as WindowItem);
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
            const rows = [...(windowConf.rows || [])];
            if (rows[ri]?.cols[ci]) {
                rows[ri].cols[ci] = { ...rows[ri].cols[ci], height_mm: undefined };
                onChange({ ...draft, options: { ...draft.options, gridWindow: { ...windowConf, rows } } } as WindowItem);
            }
            return;
        }
        const parsed = parseMmInput(raw);
        if (parsed !== null) {
            const rows = [...(windowConf.rows || [])];
            if (rows[ri]?.cols[ci]) {
                rows[ri].cols[ci] = { ...rows[ri].cols[ci], height_mm: parsed };
                onChange({ ...draft, options: { ...draft.options, gridWindow: { ...windowConf, rows } } } as WindowItem);
            }
            setColHeightStr(prev => ({ ...prev, [key]: formatMm(parsed) }));
        }
    };

    const toggleColLock = (rowIndex: number, colIndex: number) => {`
    );
}

const rowUIMatch = `onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>`;

const rowUIRepl = `onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>
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
                                        </div>`;

if(src.includes(rowUIMatch)) src = src.replace(rowUIMatch, rowUIRepl);

const colUIMatch = `onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                            onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                                        />
                                                    </>
                                                )}
                                            </div>`;

const colUIRepl = `onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
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
                                                        value={colHeightStr[\`\${rowIndex}.\${colIndex}\`] ?? windowConf.rows[rowIndex]?.cols[colIndex]?.height_mm ?? ''}
                                                        onChange={(e) => onColHeightChange(rowIndex, colIndex, e.target.value)}
                                                        onBlur={() => onColHeightBlur(rowIndex, colIndex)}
                                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                                    />
                                                </div>
                                            </div>`;

if(src.includes(colUIMatch)) src = src.replace(colUIMatch, colUIRepl);


fs.writeFileSync(path, src);
