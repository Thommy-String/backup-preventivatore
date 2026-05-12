const fs = require('fs');
const file = 'src/features/quotes/window/WindowSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<g fill={frameColor} stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME} strokeLinejoin="round">/g,
    '<g fill={frameColor} stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME}>'
);

content = content.replace(
    /return \(\s*<rect key={`outer-f-\$\{i\}`} x=\{r.sx - fLeft\} y=\{r.sy - fTop\} width=\{r.sw \+ fLeft \+ fRight\} height=\{r.sh \+ fTop \+ fBottom\} strokeLinejoin="round" \/>/g,
    'return (\n                        <rect key={`outer-f-${i}`} x={r.sx - fLeft} y={r.sy - fTop} width={r.sw + fLeft + fRight} height={r.sh + fTop + fBottom} />'
);

fs.writeFileSync(file, content);
