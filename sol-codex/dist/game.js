export const COLS = 10;
export const ROWS = 22;
export const HIDDEN_ROWS = 2;
const SPAWN = {
    I: [[0, 1], [1, 1], [2, 1], [3, 1]], J: [[0, 0], [0, 1], [1, 1], [2, 1]],
    L: [[2, 0], [0, 1], [1, 1], [2, 1]], O: [[1, 0], [2, 0], [1, 1], [2, 1]],
    S: [[1, 0], [2, 0], [0, 1], [1, 1]], T: [[1, 0], [0, 1], [1, 1], [2, 1]],
    Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
};
const JLSTZ_KICKS = {
    "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const I_KICKS = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]], "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]], "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};
export function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function rotatePoint([x, y], name, times) {
    if (name === "O")
        return [x, y];
    const center = name === "I" ? 1.5 : 1;
    let px = x, py = y;
    for (let i = 0; i < times; i++)
        [px, py] = [center - (py - center), center + (px - center)];
    return [Math.round(px), Math.round(py)];
}
export function cells(piece) {
    return SPAWN[piece.name].map(point => {
        const [x, y] = rotatePoint(point, piece.name, piece.rotation);
        return [piece.x + x, piece.y + y];
    });
}
export class TetrisGame {
    board = emptyBoard();
    active;
    queue = [];
    held = null;
    canHold = true;
    score = 0;
    lines = 0;
    level = 1;
    over = false;
    groundedAt = null;
    lockResets = 0;
    combo = -1;
    backToBack = false;
    lastMoveWasRotation = false;
    rng;
    constructor(rng = Math.random) { this.rng = rng; this.fillQueue(); this.spawn(); }
    fillQueue() {
        while (this.queue.length < 7) {
            const bag = ["I", "J", "L", "O", "S", "T", "Z"];
            for (let i = bag.length - 1; i > 0; i--) {
                const j = Math.floor(this.rng() * (i + 1));
                [bag[i], bag[j]] = [bag[j], bag[i]];
            }
            this.queue.push(...bag);
        }
    }
    spawn(name) {
        this.fillQueue();
        this.active = { name: name ?? this.queue.shift(), x: 3, y: 0, rotation: 0 };
        this.fillQueue();
        this.groundedAt = null;
        this.lockResets = 0;
        this.lastMoveWasRotation = false;
        if (!this.valid(this.active))
            this.over = true;
    }
    valid(piece) {
        return cells(piece).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && y >= 0 && !this.board[y][x]);
    }
    move(dx, dy, now = performance.now()) {
        if (this.over)
            return false;
        const next = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
        if (!this.valid(next)) {
            if (dy > 0 && this.groundedAt === null)
                this.groundedAt = now;
            return false;
        }
        this.active = next;
        this.lastMoveWasRotation = false;
        if (dy > 0)
            this.groundedAt = this.valid({ ...this.active, y: this.active.y + 1 }) ? null : now;
        else
            this.resetLock(now);
        return true;
    }
    rotate(direction, now = performance.now()) {
        if (this.over || this.active.name === "O")
            return false;
        const from = this.active.rotation;
        const to = (from + direction + 4) % 4;
        const kickTable = this.active.name === "I" ? I_KICKS : JLSTZ_KICKS;
        for (const [kx, ky] of kickTable[`${from}>${to}`] ?? [[0, 0]]) {
            const next = { ...this.active, x: this.active.x + kx, y: this.active.y - ky, rotation: to };
            if (this.valid(next)) {
                this.active = next;
                this.lastMoveWasRotation = true;
                this.resetLock(now);
                return true;
            }
        }
        return false;
    }
    resetLock(now) {
        if (this.groundedAt !== null && this.lockResets < 15) {
            this.groundedAt = now;
            this.lockResets++;
        }
    }
    softDrop() { const moved = this.move(0, 1); if (moved)
        this.score++; return moved; }
    ghostY() { let y = this.active.y; while (this.valid({ ...this.active, y: y + 1 }))
        y++; return y; }
    hardDrop() {
        if (this.over)
            return;
        const distance = this.ghostY() - this.active.y;
        this.active.y += distance;
        this.score += distance * 2;
        this.lock();
    }
    hold() {
        if (this.over || !this.canHold)
            return;
        const current = this.active.name;
        if (this.held) {
            const swap = this.held;
            this.held = current;
            this.spawn(swap);
        }
        else {
            this.held = current;
            this.spawn();
        }
        this.canHold = false;
    }
    tick(now = performance.now()) {
        if (this.over)
            return;
        if (!this.move(0, 1, now)) {
            if (this.groundedAt === null)
                this.groundedAt = now;
            if (now - this.groundedAt >= 500)
                this.lock();
        }
    }
    lock() {
        const tSpin = this.isTSpin();
        for (const [x, y] of cells(this.active))
            this.board[y][x] = this.active.name;
        const cleared = this.clearLines();
        if (cleared) {
            this.combo++;
            const difficult = cleared === 4 || tSpin;
            const normal = [0, 100, 300, 500, 800][cleared] ?? 800;
            const spin = [400, 800, 1200, 1600][cleared] ?? 1600;
            let points = tSpin ? spin : normal;
            if (difficult && this.backToBack)
                points = Math.floor(points * 1.5);
            if (this.combo > 0)
                points += 50 * this.combo;
            this.score += points * this.level;
            this.lines += cleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.backToBack = difficult;
            if (this.board.every(row => row.every(cell => cell === null))) {
                this.score += ([0, 800, 1200, 1800, 2000][cleared] ?? 2000) * this.level;
            }
        }
        else {
            if (tSpin)
                this.score += 400 * this.level;
            this.combo = -1;
        }
        this.canHold = true;
        this.spawn();
    }
    isTSpin() {
        if (this.active.name !== "T" || !this.lastMoveWasRotation)
            return false;
        const cx = this.active.x + 1, cy = this.active.y + 1;
        const occupied = (x, y) => x < 0 || x >= COLS || y < 0 || y >= ROWS || this.board[y][x] !== null;
        return [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]].filter(([x, y]) => occupied(x, y)).length >= 3;
    }
    clearLines() {
        const remaining = this.board.filter(row => row.some(cell => cell === null));
        const count = ROWS - remaining.length;
        this.board = [...Array.from({ length: count }, () => Array(COLS).fill(null)), ...remaining];
        return count;
    }
    gravityMs() { return Math.max(16, 1000 * Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1)); }
}
//# sourceMappingURL=game.js.map