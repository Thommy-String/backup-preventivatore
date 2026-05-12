const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
    '<g fill={frameColor} stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME}>',
    '<g fill={frameColor} stroke={outlineColor} strokeWidth={TECH_STYLE.STROKE_WIDTH_FRAME} strokeLinejoin="round">'
);
fs.writeFileSync(file, code);
