const fs = require('fs');
const file = 'src/features/quotes/window/WindowSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

// remove unused var
content = content.replace(
    /const isBottomInCol.*\n/g,
    ''
);

fs.writeFileSync(file, content);
