const fs = require('fs');
const path = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx';
let src = fs.readFileSync(path, 'utf8');

if (!src.includes('const onColHeightChange =')) {
    src = src.replace(
        'const toggleColLock = (rowIndex: number, colIndex: number) => {',
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

    const toggleColLock = (rowIndex: number, colIndex: number) => {`
    );
}

fs.writeFileSync(path, src);
