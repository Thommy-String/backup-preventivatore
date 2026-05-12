const fs = require('fs');
const file = 'src/features/quotes/window/WindowSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

// The bottom line also shouldn't be drawn if it's an inner overlap unless it's the bottom of that column structure. Actually since it's bottom aligned by row, only draw bottom line for the bottom perimeter of the leaves.

content = content.replace(
    /return \([\s]*<g key=\{`outer-outline-\$\{i\}`\}\>[\s\S]*?<\/g>\s*\);/g,
    `const isBottomInCol = r.rowIdx === rows.length - 1 || rows[r.rowIdx + 1]?.cols[r.colIdx]?.leaf?.state === 'fissa' /* temporary simplification */;
                    return (
                        <g key={\`outer-outline-\${i}\`}>
                            {isFirstCol && <line x1={rx} y1={ry} x2={rx} y2={ry + rh} strokeLinecap="square" />}
                            {isLastCol && <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />}
                            {isFirstRow && <line x1={rx} y1={ry} x2={rx + rw} y2={ry} strokeLinecap="square" />}
                            <line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />
                        </g>
                    );`
);

fs.writeFileSync(file, content);
