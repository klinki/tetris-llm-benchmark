import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, ARR, Controls, DAS, KEY_ACTIONS, isAction } from "../dist/controls.js";
import { Game } from "../dist/engine.js";

function recorder() {
  const actions = [];
  return { actions, controls: new Controls((action) => actions.push(action)) };
}

test("keys follow the README controls", () => {
  assert.deepEqual(KEY_ACTIONS, {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "cw",
    KeyX: "cw",
    KeyZ: "ccw",
    ControlLeft: "ccw",
    ArrowDown: "soft",
    Space: "drop",
    KeyC: "hold",
    KeyR: "restart",
    KeyP: "pause",
    Escape: "pause",
    Enter: "start",
  });
});

test("only known action names are accepted from markup", () => {
  for (const action of [...ACTIONS, ...Object.values(KEY_ACTIONS)]) assert.equal(isAction(action), true);
  for (const value of [undefined, "", "jump", "LEFT"]) assert.equal(isAction(value), false);
});

test("a press acts once; repeated presses of a held source are ignored", () => {
  const { actions, controls } = recorder();
  controls.press("Space", "drop");
  controls.press("Space", "drop");
  controls.update(1000);
  assert.deepEqual(actions, ["drop"], "only horizontal movement auto-repeats");
  controls.release("Space");
  controls.press("Space", "drop");
  assert.deepEqual(actions, ["drop", "drop"]);
});

test("holding a direction moves once, then repeats after DAS at the ARR", () => {
  const { actions, controls } = recorder();
  controls.press("ArrowLeft", "left");
  assert.deepEqual(actions, ["left"]);
  controls.update(DAS - 1);
  assert.equal(actions.length, 1);
  controls.update(1);
  assert.equal(actions.length, 2, "first repeat at DAS");
  controls.update(ARR - 1);
  assert.equal(actions.length, 2);
  controls.update(1);
  assert.equal(actions.length, 3);
  controls.update(ARR * 3);
  assert.equal(actions.length, 6, "a long frame catches up every repeat");
});

test("auto-repeat timing is the same at any frame rate", () => {
  const count = (frame) => {
    const { actions, controls } = recorder();
    controls.press("ArrowRight", "right");
    for (let time = 0; time + frame <= 1000; time += frame) controls.update(frame);
    return actions.length;
  };
  const expected = 1 + 1 + Math.floor((1000 - DAS) / ARR);
  assert.equal(count(1), expected);
  assert.equal(count(1000 / 60), count(1));
  assert.equal(count(1000 / 144), count(1));
});

test("the newest direction wins and releasing it falls back to the other", () => {
  const { actions, controls } = recorder();
  controls.press("ArrowLeft", "left");
  controls.update(DAS);
  controls.press("ArrowRight", "right");
  assert.deepEqual(actions, ["left", "left", "right"]);
  controls.update(DAS - 1);
  assert.equal(actions.length, 3, "the new direction charges its own DAS");
  controls.release("ArrowRight");
  assert.deepEqual(actions.slice(3), ["left"], "the still-held direction resumes immediately");
  controls.update(DAS);
  assert.deepEqual(actions.slice(3), ["left", "left"]);
  controls.release("ArrowLeft");
  controls.update(1000);
  assert.equal(actions.length, 5, "nothing repeats once all directions are released");
});

test("releasing the older direction or another key does not interrupt movement", () => {
  const { actions, controls } = recorder();
  controls.press("ArrowLeft", "left");
  controls.press("ArrowRight", "right");
  controls.press("KeyX", "cw");
  controls.update(DAS - 10);
  controls.release("ArrowLeft");
  controls.release("KeyX");
  controls.update(10);
  assert.deepEqual(actions, ["left", "right", "cw", "right"]);
});

test("touch pointers and keys are separate sources", () => {
  const { actions, controls } = recorder();
  controls.press("pointer-1", "soft");
  assert.equal(controls.softDropHeld, true);
  controls.press("ArrowDown", "soft");
  controls.release("pointer-1");
  assert.equal(controls.softDropHeld, true, "the key still holds soft drop");
  controls.release("ArrowDown");
  assert.equal(controls.softDropHeld, false);
  controls.press("pointer-2", "left");
  controls.press("pointer-3", "right");
  controls.release("pointer-3");
  assert.deepEqual(actions, ["soft", "soft", "left", "right", "left"]);
});

test("reset forgets held inputs, e.g. after the window loses focus", () => {
  const { actions, controls } = recorder();
  controls.press("ArrowLeft", "left");
  controls.press("ArrowDown", "soft");
  controls.reset();
  assert.equal(controls.softDropHeld, false);
  controls.update(1000);
  controls.release("ArrowLeft");
  assert.deepEqual(actions, ["left", "soft"]);
  controls.press("ArrowLeft", "left");
  assert.deepEqual(actions, ["left", "soft", "left"], "a key held through the reset can be pressed again");
});

test("advance runs the game clock up to each repeat before the repeat happens", () => {
  const { actions, controls } = recorder();
  const steps = [];
  controls.press("ArrowLeft", "left");
  controls.update(250, (ms) => steps.push(ms));
  assert.deepEqual(steps, [DAS, ARR, ARR, 250 - DAS - 2 * ARR]);
  assert.equal(actions.length, 1 + 3);
});

test("a held direction and lock delay agree at any frame rate (repeats are in time order)", () => {
  // O resting on the floor; holding Right moves it on the press and at 167, 200 and
  // 233 ms (reaching the wall), so the last reset is at 233 ms and it locks at 733 ms.
  const lockTimeAt = (frame) => {
    const game = new Game(() => 0.5);
    game.play();
    game.setUp({ clear: true, active: { kind: "O", rotation: 0, x: 3, y: 18 } });
    const controls = new Controls((action) => action === "right" && game.move(1));
    let time = 0;
    const advanceTo = (target) => {
      const tick = (ms) => controls.update(ms, (step) => game.update(step, controls.softDropHeld));
      for (; time + frame < target; time += frame) tick(frame);
      tick(target - time);
      time = target;
    };
    controls.press("ArrowRight", "right");
    advanceTo(725);
    assert.deepEqual([game.pieces, game.active.x], [0, 7], `${frame} ms frames at 725 ms`);
    advanceTo(732.9);
    assert.equal(game.pieces, 0, `${frame} ms frames at 732.9 ms`);
    advanceTo(733.1);
    return game.pieces;
  };
  for (const frame of [1000 / 60, 1000 / 144, 1000 / 30, 1]) assert.equal(lockTimeAt(frame), 1, `${frame} ms frames`);
});
