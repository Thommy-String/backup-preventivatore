const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const totalWinH = height - \(frame_mm \* 2\);/g, 'const totalWinH = height_mm - (frame_mm * 2);');

fs.writeFileSync(file, code);
