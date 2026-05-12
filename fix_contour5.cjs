const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `<g stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME} fill="none">
                {drawing.leafRects.map((r, i) => {
                    const isFirstCol = r.colIdx === 0;
                    const isLastCol = r.colIdx === rows[r.rowIdx].cols.length - 1;
                    const isFirstRow = r.rowIdx === 0;
                    const isLastRow = r.rowIdx === rows.length - 1;
                    
                    const fLeft = isFirstCol ? frame_mm : frame_mm / 2;
                    const fRight = isLastCol ? frame_mm : frame_mm / 2;
                    const fTop = isFirstRow ? frame_mm : frame_mm / 2;
                    const fBottom = isLastRow ? frame_mm : frame_mm / 2;
                    
                    const isShorter = typeof rows[r.rowIdx].cols[r.colIdx]?.height_mm === 'number' && (rows[r.rowIdx].cols[r.colIdx]?.height_mm ?? 0) > 0;
                    
                    const rx = r.sx - fLeft;
                    const ry = r.sy - fTop;
                    const rw = r.sw + fLeft + fRight;
                    // If shorter, its individual block ends at sh + fTop + full frame_mm
                    const rh = r.sh + fTop + (isShorter ? frame_mm : fBottom);

                    return (
                        <g key={\`outer-outline-\${i}\`}>
                            {isFirstCol && <line x1={rx} y1={ry} x2={rx} y2={ry + rh} strokeLinecap="square" />}
                            {isLastCol && <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />}
                            {isFirstRow && <line x1={rx} y1={ry} x2={rx + rw} y2={ry} strokeLinecap="square" />}
                            {(isLastRow || isShorter) && <line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />}
                            
                            {!isLastRow && !isShorter && <line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />}
                            
                            {/* Bridges from a short leaf bottom ONLY down to actual master window height, ONLY if next door leaf is TALLER. To completely drop empty space bounding boxes, we just extend the taller leaf downwards and DO NOT CLOSE empty space. */}
                            {/* Wait, the user wants empty space to be completely empty. So NO lines bridging downwards under a short leaf. It's just a shorter window! The space under it is NOT part of the window framework. */}
                        </g>
                    );
                })}
            </g>
`;

code = code.replace(/<g stroke=\{outlineColor\} strokeWidth=\{TECH_STYLE\.STROKE_WIDTH_FRAME\} fill="none">[\s\S]*?(?=<\/g>\s*<g fill="none" stroke=\{outlineColor\} strokeWidth=\{TECH_STYLE\.STROKE_WIDTH_BEAD\}>)/, replacement);

fs.writeFileSync(file, code);
