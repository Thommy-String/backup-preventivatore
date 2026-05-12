const fs = require('fs');
const path = "/Users/thomasdascalu/backup-preventivatore/src/features/quotes/forms/WindowForm.tsx";
let src = fs.readFileSync(path, 'utf8');

const tOld = `                                        onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                </div>`

const tNew = `                                        onChange={(e) => onRowHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                        onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1 w-28 relative">
                                    <input
                                        className="input border-blue-200 focus:border-blue-500"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Max alt. (mm)"
                                        title="Altezza massima riga (opzionale)"
                                        value={rowMaxHeightStr[rowIndex] ?? (getGrid()?.rows || [])[rowIndex]?.max_height_mm ?? ''}
                                        onChange={(e) => onRowMaxHeightChange(rowIndex, e.target.value)}
                                        onBlur={() => onRowMaxHeightBlur(rowIndex)}
                                        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                    />
                                </div>`

src = src.replace(tOld, tNew);
fs.writeFileSync(path, src);
