const fs = require('fs');
const filepath = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let txt = fs.readFileSync(filepath, 'utf-8');

txt = txt.replace(/const logicalRatio = Number.isFinite\(row.height_ratio\) \&\& row\.height_ratio > 0\n\s+\? row\.height_ratio\n\s+: \(1 \/ Math\.max\(1, rows\.length\)\);/, '');

fs.writeFileSync(filepath, txt);
