import { ARR, DAS } from '../src/core/constants.js';
import { Game } from '../src/core/game.js';
import { InputController } from '../src/input/keyboard.js';
import { assertEqual, assertOk, describe, it, run } from './harness.js';

/** Creates a game with a deterministic piece order. */
function makeGame(): Game {
  return new Game(() => 0);
}

/** Builds a keyboard event that the input controller understands. */
function keyEvent(type: string, code: string): Event {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, { code, repeat: false, metaKey: false, altKey: false });
  return event;
}

describe('input', () => {
  it('moves the piece to the sides', () => {
    const game = makeGame();
    const target = new EventTarget();
    new InputController(game, target).attach();

    const start = game.current!.x;
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    assertEqual(game.current!.x, start - 1);
    target.dispatchEvent(keyEvent('keyup', 'ArrowLeft'));

    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    assertEqual(game.current!.x, start);
    target.dispatchEvent(keyEvent('keyup', 'ArrowRight'));
  });

  it('repeats the movement after the delayed auto shift', () => {
    const game = makeGame();
    const target = new EventTarget();
    const input = new InputController(game, target);
    input.attach();

    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    const start = game.current!.x;

    input.update(DAS);
    assertEqual(game.current!.x, start, 'the piece waits for the auto shift delay');

    input.update(ARR);
    assertEqual(game.current!.x, start + 1, 'the piece repeats after the delay');

    target.dispatchEvent(keyEvent('keyup', 'ArrowRight'));
    input.update(ARR * 5);
    assertEqual(game.current!.x, start + 1, 'the piece stops when the key is released');
  });

  it('rotates in both directions', () => {
    const game = makeGame();
    const target = new EventTarget();
    new InputController(game, target).attach();

    target.dispatchEvent(keyEvent('keydown', 'KeyX'));
    assertEqual(game.current!.rotation, 1);
    target.dispatchEvent(keyEvent('keydown', 'KeyZ'));
    assertEqual(game.current!.rotation, 0);
  });

  it('soft drops while the down key is held', () => {
    const game = makeGame();
    const target = new EventTarget();
    const input = new InputController(game, target);
    input.attach();

    const start = game.current!.y;
    target.dispatchEvent(keyEvent('keydown', 'ArrowDown'));
    game.update(100);
    assertOk(game.current!.y > start, 'the piece moved down');
    target.dispatchEvent(keyEvent('keyup', 'ArrowDown'));
  });

  it('drops the piece with the space key', () => {
    const game = makeGame();
    const target = new EventTarget();
    new InputController(game, target).attach();

    target.dispatchEvent(keyEvent('keydown', 'Space'));
    assertOk(game.current!.type !== 'I', 'the piece was locked and a new one spawned');
  });

  it('holds the piece with the C key', () => {
    const game = makeGame();
    const target = new EventTarget();
    new InputController(game, target).attach();

    target.dispatchEvent(keyEvent('keydown', 'KeyC'));
    assertEqual(game.hold, 'I');
  });

  it('restarts the game with the R key', () => {
    const game = makeGame();
    const target = new EventTarget();
    new InputController(game, target).attach();

    game.status = 'gameover';
    game.score = 1234;
    target.dispatchEvent(keyEvent('keydown', 'KeyR'));
    assertEqual(game.status, 'playing');
    assertEqual(game.score, 0);
  });
});

run();
