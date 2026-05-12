const fs = require('fs');
const file = 'src/features/quotes/window/WindowSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the outer perimeter rects generation to not use multiple overlapping rects, which causes inner joint lines when stroked.
// Instead, just generate stroke="none" for the fill, and draw individual outer lines for the perimeter outline.
content = content.replace(
    /<g fill=\{frameColor\} stroke=\{outlineColor\} strokeWidth=\{TECH_STYLE\.STROKE_WIDTH_FRAME\}>[\s\S]*?(?=\{\/\*|<g fill="none" stroke=\{outlineColor\} strokeWidth=\{TECH_STYLE\.STROKE_WIDTH_BEAD\}>)/,
    `<g fill={frameColor}>
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
                        <rect key={\`outer-f-fill-\${i}\`} x={r.sx - fLeft} y={r.sy - fTop} width={r.sw + fLeft + fRight} height={r.sh + fTop + fBottom} />
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
            <g stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME} fill="none">
                {drawing.leafRects.map((r, i) => {
                    const isFirstCol = r.colIdx === 0;
                    const isLastCol = r.colIdx === rows[r.rowIdx].cols.length - 1;
                    const isFirstRow = r.rowIdx === 0;
                    const isLastRow = r.rowIdx === rows.length - 1;
                    const fLeft = isFirstCol ? frame_mm : frame_mm / 2;
                    const fRight = isLastCol ? frame_mm : frame_mm / 2;
                    const fTop = isFirstRow ? frame_mm : frame_mm / 2;
                    const fBottom = isLastRow ? frame_mm : frame_mm / 2;
                    const rx = r.sx - fLeft;
                    const ry = r.sy - fTop;
                    const rw = r.sw + fLeft + fRight;
                    const rh = r.sh + fTop + fBottom;
                    
                    return (
                        <g key={\`outer-outline-\${i}\`}>
                            {isFirstCol && <line x1={rx} y1={ry} x2={rx} y2={ry + rh} />}
                            {isLastCol && <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + rh} />}
                            {isFirstRow && <line x1={rx} y1={ry} x2={rx + rw} y2={ry} />}
                            <line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry + rh} />
                        </g>
                    );
                })}
            </g>
            `
);

fs.writeFileSync(file, content);
