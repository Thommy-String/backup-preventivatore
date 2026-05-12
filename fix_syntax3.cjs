const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/<\/g>\s*<\/g>\s*<g fill="none" stroke=\{outlineColor\}/g, '</g>\n            <g fill="none" stroke={outlineColor}');

fs.writeFileSync(file, code);
