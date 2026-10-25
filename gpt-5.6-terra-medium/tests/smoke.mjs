import fs from 'node:fs';
const source = fs.readFileSync('dist/main.js', 'utf8');
for (const phrase of ['class TetrisGame', 'hardDrop()', 'holdPiece()', 'ghostY()', 'rotate(dir)']) {
  if (!source.includes(phrase)) throw new Error(`Missing ${phrase}`);
}
console.log('Smoke tests passed: build contains core Tetris game logic.');
