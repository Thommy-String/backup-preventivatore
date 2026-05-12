const fs = require('fs');
const path = "/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx";
let src = fs.readFileSync(path, 'utf8');

src = src.replace(/\(getGrid\(\)\?\.rows\)\[rowIndex\]/g, "(getGrid()?.rows || [])[rowIndex]");
src = src.replace(/onChange=\{\(e\) => onRowHeightChange\(rowIndex, e\.target\.value\)\}/g, "onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}");

// Remove the warnings for unused by binding them properly to inputs
// It seems my previous replace logic failed to inject them properly because of exact indentation matches
const rowUIMatch = `onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 w-28 relative">
                                            <input
                                                className="input text-xs h-7 border-blue-200 focus:border-blue-500"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={\`Max alt. (mm)\`}
                                                title="Altezza massima riga (opzionale)"
                                                value={rowMaxHeightStr[rowIndex] ?? windowConf.rows[rowIndex]?.max_height_mm ?? ''}
                                                onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowMaxHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>`

const originalRowUI = `onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>`;

const newRowUI = `onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                                onBlur={(e) => onRowHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1 w-28 relative">
                                            <input
                                                className="input text-xs h-7 border-blue-200 focus:border-blue-500"
                                                type="text"
                                                inputMode="decimal"
                                                placeholder={\`Max alt. (mm)\`}
                                                title="Altezza massima riga (opzionale)"
                                                value={rowMaxHeightStr[rowIndex] ?? (getGrid()?.rows || [])[rowIndex]?.max_height_mm ?? ''}
                                                onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                                onBlur={() => onRowMaxHeightBlur(rowIndex)}
                                                onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            />
                                        </div>`;

src = src.replace(originalRowUI, newRowUI);

fs.writeFileSync(path, src);
