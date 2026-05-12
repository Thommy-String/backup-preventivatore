const fs = require('fs');
const path = "/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx";
let src = fs.readFileSync(path, 'utf8');

src = src.replace(/windowConf/g, "getGrid()");
fs.writeFileSync(path, src);
