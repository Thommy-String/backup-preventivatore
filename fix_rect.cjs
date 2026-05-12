const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let txt = fs.readFileSync(file, 'utf8');

txt = txt.replace(
    /let colH = rowH;\s+let sy = y0;/,
    `let colH = rowH;
            let sy = y0;
            // Frame bounds recording
            acc.leafRects = acc.leafRects || [];
`
);

txt = txt.replace(
    /const sh = colH;/,
    `const sh = colH;
            acc.leafRects.push({
                x: sx - frame_mm,
                y: sy - frame_mm,
                rowIdx,
                colIdx,
                sx, sy, sw, sh
            });
`
);

txt = txt.replace(
    /horzLines: \[\] as Array<{ x1: number; x2: number; y: number; width: number }>/,
    `horzLines: [] as Array<{ x1: number; x2: number; y: number; width: number }>,
        leafRects: [] as Array<{ x: number; y: number; rowIdx: number; colIdx: number; sx: number; sy: number; sw: number; sh: number }>`
);


const target = txt.indexOf('Telaio esterno: fill + stroke');

if (target !== -1) {
    const endTarget = txt.indexOf('drawing.nodes}', target);
    
    if (endTarget !== -1) {
        const newRepl = `{/* Telaio esterno e interno: dinamico */}
            <g fill={frameColor} stroke={TECH_STYLE.FRAME_STROKE} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME}>
                {drawing.leafRects.map((r, i) => {
                    const isFirstCol = r.colIdx === 0;
                    const isLastCol = r.colIdx === rows[r.rowIdx].cols.length - 1;
                    const isFirstRow = r.rowIdx === 0;
                    const isLastRow = r.rowIdx === rows.length - 1;
                    const fLeft = isFirstCol ? frame_mm : frame_mm / 2;
                    const fRight = isLastCol ? frame_mm : frame_mm / 2;
                    const fTop = isFirstRow ? frame_mm : frame_mm / 2;
                    const fBottom = isLastRow ? frame_mm : frame_mm / 2;
                    return (
                        <rect key={\`outer-f-\${i}\`} x={r.sx - fLeft} y={r.sy - fTop} width={r.sw + fLeft + fRight} height={r.sh + fTop + fBottom} strokeLinejoin="round" />
                    );
                })}
            </g>
            {woodEnabled && (
                <g opacity={woodTextureOpacity} fill={woodPatternFill}>
                    {drawing.leafRects.map((r, i) => {
                        const isFirstCol = r.colIdx === 0;
                        const isLastCol = r.colIdx === rows[r.rowIdx].cols.length - 1;
                        const isFirstRow = r.rowIdx === 0;
                        const isLastRow = r.rowIdx === rows.length - 1;
                        const fLeft = isFirstCol ? frame_mm : frame_mm / 2;
                        const fRight = isLastCol ? frame_mm : frame_mm / 2;
                        const fTop = isFirstRow ? frame_mm : frame_mm / 2;
                        const fBottom = isLastRow ? frame_mm : frame_mm / 2;
                        return (
                            <rect key={\`wood-f-\${i}\`} x={r.sx - fLeft} y={r.sy - fTop} width={r.sw + fLeft + fRight} height={r.sh + fTop + fBottom} />
                        );
                    })}
                </g>
            )}
            <g fill="none" stroke={TECH_STYLE.FRAME_STROKE} strokeWidth={TECH_STYLE.STROKE_WIDTH_BEAD}>
                {drawing.leafRects.map((r, i) => <rect key={\`inner-f-\${i}\`} x={r.sx} y={r.sy} width={r.sw} height={r.sh} />)}
            </g>
            {`;
        
        let targetStrStart = txt.lastIndexOf('{/*', target);
        let firstPart = txt.substring(0, targetStrStart);
        let lastPart = txt.substring(endTarget);
        txt = firstPart + newRepl + lastPart;
        fs.writeFileSync(file, txt);
        console.log("Success updated SVG frame bounds using substring logic!");
    } else {
        console.log("Could not find end of nodes.");
    }
} else {
    console.log("Could not find start substring");
}
