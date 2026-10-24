import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../dist/game.js', import.meta.url), 'utf8');
assert.match(html, /id="board"/);
assert.match(html, /id="next-pieces"/);
assert.match(script, /class Tetris/);
assert.match(script, /function randomBag/);
assert.match(script, /clearLines\(\)/);
console.log('Tetris smoke checks passed.');
