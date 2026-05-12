const fs = require('fs');
const file = 'src/features/quotes/window/WindowSvg.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\{isFirstCol && <line x1=\{rx\} y1=\{ry\} x2=\{rx\} y2=\{ry \+ rh\} strokeLinecap="square" \/>\}/g,
    '{isFirstCol && <line x1={rx} y1={ry} x2={rx} y2={ry + rh} strokeLinecap="square" />}\n                            <line x1={rx} y1={ry} x2={rx} y2={ry + rh} strokeLinecap="square" />'
);

// We'll actually modify the entire inner path builder to just draw lines on all 4 sides!
content = content.replace(
    /\{isFirstCol && <line x1=\{rx\} y1=\{ry\}.*\n.*\{isLastCol &&.*\n.*\{isFirstRow &&.*\n.*<line x1=\{rx\}.*y2=\{ry \+ rh\}.*\n/g,
    '<line x1={rx} y1={ry} x2={rx} y2={ry + rh} strokeLinecap="square" />\n<line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />\n<line x1={rx} y1={ry} x2={rx + rw} y2={ry} strokeLinecap="square" />\n<line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry + rh} strokeLinecap="square" />\n'
);


fs.writeFileSync(file, content);
