const fs = require('fs');
const filepath = '/Users/thomasdascalu/backup-preventivatore/src/features/quotes/window/WindowSvg.tsx';
let txt = fs.readFileSync(filepath, 'utf-8');

txt = txt.replace(/const rowHeightLogicalMm = logicalRatio \* height_mm;/g, '');

txt = txt.replace(/const sx = startX;\n\s+const sy = y0;\n\s+const sw = colW;\n\s+const sh = rowH;/g, `
            let colH = rowH;
            let sy = y0;
            if (typeof col.height_mm === 'number' && col.height_mm > 0) {
                 const pxPerMm = usableH / height_mm;
                 colH = col.height_mm * pxPerMm;
                 sy = y0 + (rowH - colH);
            }
            
            const sx = startX;
            const sw = colW;
            const sh = colH;
`);

fs.writeFileSync(filepath, txt);
