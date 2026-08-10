export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const HIDDEN_ROWS = 2;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + HIDDEN_ROWS;
export const PIECES = ["I", "J", "L", "O", "S", "T", "Z"];
const SHAPES = {
    I: [
        [[0, 1], [1, 1], [2, 1], [3, 1]],
        [[2, 0], [2, 1], [2, 2], [2, 3]],
        [[0, 2], [1, 2], [2, 2], [3, 2]],
        [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
    J: [
        [[0, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [2, 2]],
        [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
    L: [
        [[2, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [1, 2], [2, 2]],
        [[0, 1], [1, 1], [2, 1], [0, 2]],
        [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
    O: [
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
        [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
    S: [
        [[1, 0], [2, 0], [0, 1], [1, 1]],
        [[1, 0], [1, 1], [2, 1], [2, 2]],
        [[1, 1], [2, 1], [0, 2], [1, 2]],
        [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
    T: [
        [[1, 0], [0, 1], [1, 1], [2, 1]],
        [[1, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [2, 1], [1, 2]],
        [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
    Z: [
        [[0, 0], [1, 0], [1, 1], [2, 1]],
        [[2, 0], [1, 1], [2, 1], [1, 2]],
        [[0, 1], [1, 1], [1, 2], [2, 2]],
        [[1, 0], [0, 1], [1, 1], [0, 2]],
    ],
};
const JLSTZ_KICKS = {
    "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const I_KICKS = {
    "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
    "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};
const NORMAL_CLEAR_POINTS = [0, 100, 300, 500, 800];
const T_SPIN_POINTS = [400, 800, 1200, 1600];
const PERFECT_CLEAR_POINTS = [0, 800, 1200, 1800, 2000];
const LOCK_DELAY_MS = 500;
const MAX_LOCK_RESETS = 15;
function emptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}
export function cellsFor(piece) {
    const shape = SHAPES[piece.kind][piece.rotation];
    if (!shape)
        throw new Error("Invalid piece rotation");
    return shape.map(([x, y]) => [piece.x + x, piece.y + y]);
}
export class TetrisGame {
    board = emptyBoard();
    active = null;
    bag = [];
    queue = [];
    held = null;
    canHold = true;
    gravityElapsed = 0;
    lockElapsed = 0;
    lockResets = 0;
    lastActionWasRotation = false;
    random;
    score = 0;
    lines = 0;
    level = 1;
    combo = -1;
    backToBack = false;
    gameOver = false;
    paused = false;
    constructor(random = Math.random) {
        this.random = random;
        this.fillQueue();
        this.spawn();
    }
    snapshot() {
        return {
            board: this.board,
            active: this.active,
            ghostY: this.active ? this.getGhostY() : null,
            held: this.held,
            next: this.queue.slice(0, 5),
            score: this.score,
            lines: this.lines,
            level: this.level,
            combo: this.combo,
            backToBack: this.backToBack,
            gameOver: this.gameOver,
            paused: this.paused,
        };
    }
    restart() {
        this.board = emptyBoard();
        this.active = null;
        this.bag = [];
        this.queue = [];
        this.held = null;
        this.canHold = true;
        this.gravityElapsed = 0;
        this.lockElapsed = 0;
        this.lockResets = 0;
        this.lastActionWasRotation = false;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = -1;
        this.backToBack = false;
        this.gameOver = false;
        this.paused = false;
        this.fillQueue();
        this.spawn();
    }
    togglePause() {
        if (!this.gameOver)
            this.paused = !this.paused;
    }
    tick(deltaMs) {
        if (!this.active || this.gameOver || this.paused || deltaMs <= 0)
            return;
        this.gravityElapsed += Math.min(deltaMs, 1000);
        const interval = this.gravityInterval();
        while (this.gravityElapsed >= interval && this.active) {
            this.gravityElapsed -= interval;
            if (!this.tryMove(0, 1, false))
                break;
        }
        if (this.active && this.isGrounded(this.active)) {
            this.lockElapsed += Math.min(deltaMs, 1000);
            if (this.lockElapsed >= LOCK_DELAY_MS)
                this.lock();
        }
        else {
            this.lockElapsed = 0;
        }
    }
    move(dx) {
        return this.tryMove(dx, 0, true);
    }
    softDrop() {
        const moved = this.tryMove(0, 1, false);
        if (moved)
            this.score += 1;
        return moved;
    }
    hardDrop() {
        if (!this.active || this.paused || this.gameOver)
            return;
        let distance = 0;
        while (this.tryMove(0, 1, false))
            distance++;
        this.score += distance * 2;
        this.lock();
    }
    rotate(direction) {
        if (!this.active || this.paused || this.gameOver)
            return false;
        const from = this.active.rotation;
        const to = ((from + direction + 4) % 4);
        if (this.active.kind === "O") {
            this.active.rotation = to;
            this.lastActionWasRotation = true;
            this.resetLockDelay();
            return true;
        }
        const table = this.active.kind === "I" ? I_KICKS : JLSTZ_KICKS;
        for (const [dx, dy] of table[`${from}>${to}`] ?? [[0, 0]]) {
            const candidate = { ...this.active, rotation: to, x: this.active.x + dx, y: this.active.y + dy };
            if (this.valid(candidate)) {
                this.active = candidate;
                this.lastActionWasRotation = true;
                this.resetLockDelay();
                return true;
            }
        }
        return false;
    }
    hold() {
        if (!this.active || !this.canHold || this.paused || this.gameOver)
            return false;
        const outgoing = this.active.kind;
        this.active = null;
        if (this.held) {
            const incoming = this.held;
            this.held = outgoing;
            this.spawn(incoming);
        }
        else {
            this.held = outgoing;
            this.spawn();
        }
        this.canHold = false;
        return true;
    }
    fillQueue() {
        while (this.queue.length < 7) {
            if (this.bag.length === 0) {
                this.bag = [...PIECES];
                for (let i = this.bag.length - 1; i > 0; i--) {
                    const j = Math.floor(this.random() * (i + 1));
                    [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
                }
            }
            this.queue.push(this.bag.shift());
        }
    }
    spawn(kind) {
        this.fillQueue();
        const next = kind ?? this.queue.shift();
        this.fillQueue();
        const piece = { kind: next, rotation: 0, x: 3, y: 0 };
        this.gravityElapsed = 0;
        this.lockElapsed = 0;
        this.lockResets = 0;
        this.lastActionWasRotation = false;
        if (!this.valid(piece)) {
            this.active = null;
            this.gameOver = true;
            return;
        }
        this.active = piece;
    }
    tryMove(dx, dy, playerAction) {
        if (!this.active || this.paused || this.gameOver)
            return false;
        const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy };
        if (!this.valid(candidate))
            return false;
        this.active = candidate;
        this.lastActionWasRotation = false;
        if (playerAction)
            this.resetLockDelay();
        if (!this.isGrounded(candidate))
            this.lockElapsed = 0;
        return true;
    }
    resetLockDelay() {
        if (!this.active || !this.isGrounded(this.active) || this.lockResets >= MAX_LOCK_RESETS)
            return;
        this.lockElapsed = 0;
        this.lockResets++;
    }
    valid(piece) {
        return cellsFor(piece).every(([x, y]) => x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT && this.board[y]?.[x] === null);
    }
    isGrounded(piece) {
        return !this.valid({ ...piece, y: piece.y + 1 });
    }
    getGhostY() {
        if (!this.active)
            return 0;
        let y = this.active.y;
        while (this.valid({ ...this.active, y: y + 1 }))
            y++;
        return y;
    }
    lock() {
        if (!this.active)
            return;
        const piece = this.active;
        const tSpin = this.isTSpin(piece);
        for (const [x, y] of cellsFor(piece))
            this.board[y][x] = piece.kind;
        const cleared = this.clearLines();
        this.applyScoring(cleared, tSpin);
        this.canHold = true;
        this.active = null;
        this.spawn();
    }
    clearLines() {
        let count = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(Boolean)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(null));
                count++;
                y++;
            }
        }
        return count;
    }
    isTSpin(piece) {
        if (piece.kind !== "T" || !this.lastActionWasRotation)
            return false;
        const pivotX = piece.x + 1;
        const pivotY = piece.y + 1;
        let occupied = 0;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            const x = pivotX + dx;
            const y = pivotY + dy;
            if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || this.board[y]?.[x])
                occupied++;
        }
        return occupied >= 3;
    }
    applyScoring(cleared, tSpin) {
        const difficult = cleared === 4 || (tSpin && cleared > 0);
        const base = (tSpin ? T_SPIN_POINTS[cleared] : NORMAL_CLEAR_POINTS[cleared]) ?? 0;
        this.score += Math.floor(base * this.level * (difficult && this.backToBack ? 1.5 : 1));
        if (cleared > 0) {
            this.combo++;
            if (this.combo > 0)
                this.score += 50 * this.combo * this.level;
            if (this.board.every((row) => row.every((cell) => cell === null))) {
                this.score += (PERFECT_CLEAR_POINTS[cleared] ?? 0) * this.level;
            }
            this.lines += cleared;
            this.level = Math.floor(this.lines / 10) + 1;
            if (difficult)
                this.backToBack = true;
            else
                this.backToBack = false;
        }
        else {
            this.combo = -1;
        }
    }
    gravityInterval() {
        return Math.max(16, Math.pow(0.8 - (this.level - 1) * 0.007, this.level - 1) * 1000);
    }
}
