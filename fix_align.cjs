const fs = require('fs');
const path = "/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx";
let src = fs.readFileSync(path, 'utf8');

src = src.replace('sy = y0 + (rowH - colH); // Align to bottom of the row', '// sy = y0; // Aligned to top by default');

fs.writeFileSync(path, src);
