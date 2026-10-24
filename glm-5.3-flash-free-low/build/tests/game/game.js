"use strict";
/**
 * Game state machine wiring the engine primitives together: bag randomizer,
 * movement/rotation with SRS kicks, hold, lock delay, ghost piece, scoring
 * and levels per the Tetris Guideline.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIDDEN_ROWS = exports.Game = void 0;
const engine_js_1 = require("./engine.js");
const HIDDEN_ROWS = 3; // rows above the visible board used for spawning
exports.HIDDEN_ROWS = HIDDEN_ROWS;
/** Guideline gravity in cells per frame (60 fps clock), per level. */
function gravityCellsPerFrame(level) {
    const secondsPerCell = Math.pow(0.8 - (level - 1) * 0.007, level - 1);
    const framesPerCell = Math.max(secondsPerCell * 60, 1 / 60);
    return 1 / framesPerCell;
}
/** Points for clearing n lines in one drop (no combos/T-spins, Guideline base table). */
const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };
class Game {
    constructor() {
        this.board = (0, engine_js_1.emptyBoard)();
        this.piece = null;
        this.ghostY = 0;
        /** Upcoming piece ids, ready queue (front = next spawn). */
        this.nextQueue = [];
        this.bag = [];
        this.hold = null;
        this.holdUsed = false;
        this.stats = { score: 0, lines: 0, level: 1 };
        this.status = 'ready';
        /** Accumulated gravity movement since the last cell drop. */
        this.gravityAccumulator = 0;
        /** Frames the piece has rested in a locking position since the last move. */
        this.lockFrames = 0;
        this.lockFrameLimit = 30; // ~0.5 s lock delay
        this.softDropping = false;
        /** Last action that moved the piece, used for lock-delay reset bookkeeping. */
        this.moveResetCount = 0;
        this.reset();
    }
    reset() {
        this.board = (0, engine_js_1.emptyBoard)();
        this.hold = null;
        this.holdUsed = false;
        this.stats = { score: 0, lines: 0, level: 1 };
        this.bag = [];
        this.nextQueue = [];
        this.refillQueue();
        this.status = 'playing';
        this.gravityAccumulator = 0;
        this.lockFrames = 0;
        this.moveResetCount = 0;
        this.softDropping = false;
        this.spawn();
    }
    refillQueue() {
        while (this.nextQueue.length < 5) {
            if (this.bag.length === 0) {
                this.bag = (0, engine_js_1.shuffle)([0, 1, 2, 3, 4, 5, 6]);
            }
            this.nextQueue.push(this.bag.pop());
        }
    }
    takeNext() {
        this.refillQueue();
        return this.nextQueue.shift();
    }
    spawn(id) {
        const pieceId = id ?? this.takeNext();
        const width = Math.max(...(0, engine_js_1.pieceCells)(pieceId, 0).map(([cx]) => cx)) + 1;
        const piece = {
            id: pieceId,
            x: Math.floor((engine_js_1.COLS - width) / 2),
            y: -1 - HIDDEN_ROWS,
            rotation: 0,
        };
        // Shift down to the first row above the visible board that collides.
        while (this.canPlace(piece, 0, 1) && piece.y < -1) {
            piece.y += 1;
        }
        if (!this.canPlace(piece, 0, 0)) {
            // Blocked spawn at the top: top out immediately.
            this.piece = piece;
            this.status = 'over';
            return;
        }
        this.piece = piece;
        this.ghostY = this.dropDistance(piece);
        this.gravityAccumulator = 0;
        this.lockFrames = 0;
        this.moveResetCount = 0;
        this.refillQueue();
    }
    /** Whether every cell of the piece, offset by (dx, dy), is inside the board and empty. */
    canPlace(piece, dx, dy, rotation = piece.rotation) {
        for (const [cx, cy] of (0, engine_js_1.pieceCells)(piece.id, rotation)) {
            const x = piece.x + cx + dx;
            const y = piece.y + cy + dy;
            if (x < 0 || x >= engine_js_1.COLS || y >= engine_js_1.ROWS) {
                return false;
            }
            if (y >= 0 && this.board[y][x] !== 0) {
                return false;
            }
        }
        return true;
    }
    /** Number of rows the piece can fall before colliding. */
    dropDistance(piece) {
        let distance = 0;
        while (this.canPlace(piece, 0, distance + 1)) {
            distance += 1;
        }
        return distance;
    }
    move(dx) {
        if (this.status !== 'playing' || !this.piece) {
            return;
        }
        if (this.canPlace(this.piece, dx, 0)) {
            this.piece.x += dx;
            this.onMoved();
        }
    }
    rotate(direction) {
        if (this.status !== 'playing' || !this.piece) {
            return;
        }
        const from = this.piece.rotation;
        const to = (((from + direction) % 4) + 4) % 4;
        const table = `${from}>${to}`;
        const attempts = this.piece.id === 3
            ? [[0, 0]] // O never kicks
            : this.piece.id === 0 ? engine_js_1.KICKS_I[table] : engine_js_1.KICKS_JLSTZ[table];
        if (!attempts) {
            return;
        }
        for (const [dx, dy] of attempts) {
            if (this.canPlace(this.piece, dx, dy, to)) {
                this.piece.x += dx;
                this.piece.y += dy;
                this.piece.rotation = to;
                this.onMoved();
                return;
            }
        }
    }
    softDrop(on) {
        this.softDropping = on;
    }
    /** One gravity "tick": advance the accumulator and drop cells. */
    tick() {
        if (this.status !== 'playing' || !this.piece) {
            return;
        }
        const rate = Math.max(gravityCellsPerFrame(this.stats.level), 1);
        const speed = this.softDropping ? Math.max(rate, 20) : rate;
        this.gravityAccumulator += speed;
        let moved = false;
        while (this.gravityAccumulator >= 1) {
            this.gravityAccumulator -= 1;
            if (this.canPlace(this.piece, 0, 1)) {
                this.piece.y += 1;
                moved = true;
            }
            else {
                this.gravityAccumulator = 0;
                break;
            }
        }
        if (moved) {
            this.lockFrames = 0;
            this.moveResetCount = 0;
        }
        this.ghostY = this.dropDistance(this.piece);
        if (!this.canPlace(this.piece, 0, 1)) {
            this.lockFrames += 1;
            if (this.lockFrames >= this.lockFrameLimit) {
                this.lockPiece();
            }
        }
    }
    /** Hard drop: fall to the floor, score 2 per cell, lock immediately. */
    hardDrop() {
        if (this.status !== 'playing' || !this.piece) {
            return;
        }
        const distance = this.dropDistance(this.piece);
        this.piece.y += distance;
        this.stats.score += distance * 2;
        this.ghostY = 0;
        this.lockPiece();
    }
    /** Hold the current piece; each held piece may be swapped back once. */
    holdPiece() {
        if (this.status !== 'playing' || !this.piece || this.holdUsed) {
            return;
        }
        const current = this.piece.id;
        if (this.hold === null) {
            this.hold = current;
            this.spawn();
        }
        else {
            const swap = this.hold;
            this.hold = current;
            this.spawn(swap);
        }
        this.holdUsed = true;
    }
    onMoved() {
        // Lock delay resets when the piece moves or rotates, with a cap so the
        // game cannot be stalled forever.
        if (this.piece && this.lockFrames > 0 && this.moveResetCount < 15) {
            this.lockFrames = 0;
            this.moveResetCount += 1;
        }
        this.ghostY = this.piece ? this.dropDistance(this.piece) : 0;
    }
    lockPiece() {
        if (!this.piece) {
            return;
        }
        let touchesHiddenRows = false;
        for (const [x, y] of (0, engine_js_1.absoluteCells)(this.piece)) {
            if (y < 0) {
                // A piece locked above the visible board means the stack reached the
                // spawn area; the next spawn will be blocked and top out.
                touchesHiddenRows = true;
                continue;
            }
            this.board[y][x] = (this.piece.id + 1); // 0 = empty, so cells shift by 1
        }
        this.piece = null;
        const cleared = this.clearLines();
        this.updateScore(cleared);
        if (touchesHiddenRows) {
            this.status = 'over';
            return;
        }
        this.spawn();
    }
    clearLines() {
        let cleared = 0;
        for (let y = engine_js_1.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every((cell) => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array.from({ length: engine_js_1.COLS }, () => 0));
                cleared += 1;
                y += 1; // re-check the same row index after the shift
            }
        }
        return cleared;
    }
    updateScore(cleared) {
        if (cleared > 0) {
            this.stats.score += (LINE_SCORES[cleared] ?? 0) * this.stats.level;
            this.stats.lines += cleared;
            const newLevel = Math.floor(this.stats.lines / 10) + 1;
            if (newLevel > this.stats.level) {
                this.stats.level = newLevel;
            }
        }
    }
    /** A blocked spawn (stack reaching into the spawn area) means top out. */
    snapshot() {
        return {
            board: this.board,
            piece: this.piece,
            ghostY: this.ghostY,
            next: this.nextQueue.slice(0, 5),
            hold: this.hold,
            holdUsed: this.holdUsed,
            stats: { ...this.stats },
            status: this.status,
        };
    }
}
exports.Game = Game;
