import { cells, COLS, HIDDEN_ROWS, ROWS, TetrisGame } from "./game.js";
const boardCanvas = document.querySelector("#board");
const ctx = boardCanvas.getContext("2d");
const holdCanvas = document.querySelector("#hold");
const scoreEl = document.querySelector("#score");
const levelEl = document.querySelector("#level");
const linesEl = document.querySelector("#lines");
const nextList = document.querySelector("#next-list");
const overlay = document.querySelector("#overlay");
const colors = {
    I: "#25d9f8", J: "#5865f2", L: "#ff9d35", O: "#ffe13b",
    S: "#48e072", T: "#b95cff", Z: "#ff4560",
};
const block = 30;
let game = new TetrisGame();
let previous = performance.now();
let gravity = 0;
function drawBlock(context, x, y, size, color, alpha = 1) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = color;
    context.fillRect(x + 1, y + 1, size - 2, size - 2);
    const shine = context.createLinearGradient(x, y, x, y + size);
    shine.addColorStop(0, "rgba(255,255,255,.28)");
    shine.addColorStop(.42, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(0,0,0,.24)");
    context.fillStyle = shine;
    context.fillRect(x + 2, y + 2, size - 4, size - 4);
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.strokeRect(x + 2.5, y + 2.5, size - 5, size - 5);
    context.restore();
}
function drawBoard() {
    ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
    ctx.fillStyle = "#090a12";
    ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * block, 0);
        ctx.lineTo(x * block, 600);
        ctx.stroke();
    }
    for (let y = 1; y < ROWS - HIDDEN_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * block);
        ctx.lineTo(300, y * block);
        ctx.stroke();
    }
    game.board.slice(HIDDEN_ROWS).forEach((row, y) => row.forEach((cell, x) => {
        if (cell)
            drawBlock(ctx, x * block, y * block, block, colors[cell]);
    }));
    const ghost = { ...game.active, y: game.ghostY() };
    cells(ghost).forEach(([x, y]) => { if (y >= HIDDEN_ROWS)
        drawBlock(ctx, x * block, (y - HIDDEN_ROWS) * block, block, colors[ghost.name], .18); });
    cells(game.active).forEach(([x, y]) => { if (y >= HIDDEN_ROWS)
        drawBlock(ctx, x * block, (y - HIDDEN_ROWS) * block, block, colors[game.active.name]); });
}
function miniPiece(canvas, name) {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const piece = { name, x: 0, y: 0, rotation: 0 };
    const shape = cells(piece);
    const size = 20;
    const minX = Math.min(...shape.map(([x]) => x)), maxX = Math.max(...shape.map(([x]) => x));
    const minY = Math.min(...shape.map(([, y]) => y)), maxY = Math.max(...shape.map(([, y]) => y));
    const ox = (canvas.width - (maxX - minX + 1) * size) / 2 - minX * size;
    const oy = (canvas.height - (maxY - minY + 1) * size) / 2 - minY * size;
    shape.forEach(([x, y]) => drawBlock(context, ox + x * size, oy + y * size, size, colors[name]));
}
function renderSidebars() {
    scoreEl.textContent = game.score.toLocaleString();
    levelEl.textContent = String(game.level);
    linesEl.textContent = String(game.lines);
    const hc = holdCanvas.getContext("2d");
    hc.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (game.held)
        miniPiece(holdCanvas, game.held);
    nextList.replaceChildren(...game.queue.slice(0, 4).map(name => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 66;
        miniPiece(canvas, name);
        return canvas;
    }));
    overlay.classList.toggle("hidden", !game.over);
}
function render() { drawBoard(); renderSidebars(); }
const actions = {
    left: () => { game.move(-1, 0); }, right: () => { game.move(1, 0); }, down: () => { game.softDrop(); },
    cw: () => { game.rotate(1); }, ccw: () => { game.rotate(-1); }, drop: () => { game.hardDrop(); }, hold: () => { game.hold(); },
};
function restart() { game = new TetrisGame(); previous = performance.now(); gravity = 0; render(); }
window.addEventListener("keydown", event => {
    const map = {
        ArrowLeft: "left", ArrowRight: "right", ArrowDown: "down", ArrowUp: "cw",
        x: "cw", X: "cw", z: "ccw", Z: "ccw", Control: "ccw", " ": "drop", c: "hold", C: "hold",
    };
    if ((event.key === "r" || event.key === "R") && game.over)
        restart();
    const action = map[event.key];
    if (action) {
        event.preventDefault();
        actions[action]?.();
        render();
    }
}, { passive: false });
document.querySelector("#restart").addEventListener("click", restart);
document.querySelectorAll("[data-action]").forEach(button => {
    const act = button.dataset.action;
    const fire = (event) => { event.preventDefault(); actions[act]?.(); render(); };
    button.addEventListener("pointerdown", fire);
});
function loop(now) {
    const elapsed = now - previous;
    previous = now;
    gravity += elapsed;
    if (!game.over && game.groundedAt !== null && now - game.groundedAt >= 500) {
        game.lock();
        gravity = 0;
        render();
    }
    else if (!game.over && gravity >= game.gravityMs()) {
        game.tick(now);
        gravity = 0;
        render();
    }
    requestAnimationFrame(loop);
}
render();
requestAnimationFrame(loop);
//# sourceMappingURL=main.js.map