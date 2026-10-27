// Playfield geometry. The top HIDDEN_ROWS rows form an invisible buffer
// zone where pieces spawn, so the visible field is the usual 10 x 20.
export const COLS = 10;
export const VISIBLE_ROWS = 20;
export const HIDDEN_ROWS = 2;
export const ROWS = VISIBLE_ROWS + HIDDEN_ROWS;
