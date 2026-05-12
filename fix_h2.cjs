const fs = require('fs');
const file = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/typeof rows\[r\.rowIdx\]\.cols\[r\.colIdx\]\.height_mm === 'number' && rows\[r\.rowIdx\]\.cols\[r\.colIdx\]\.height_mm > 0/g, "typeof rows[r.rowIdx].cols[r.colIdx]?.height_mm === 'number' && (rows[r.rowIdx].cols[r.colIdx]?.height_mm ?? 0) > 0");

fs.writeFileSync(file, code);
