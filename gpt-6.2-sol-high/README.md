# Aftershift

Aftershift is a browser-based falling-block game written in TypeScript. Seven distinctly colored pieces fall into an 11 × 18 playfield. Fill a row to clear it. The run ends when the next piece cannot enter.

## Controls

| Action | Keys |
| --- | --- |
| Move | Left or Right |
| Rotate clockwise | Up or X |
| Rotate counterclockwise | Z or Left Ctrl |
| Soft drop | Down |
| Hard drop | Space |
| Hold | C |
| Pause or resume | P |
| Restart | R |

On touchscreens, use the buttons below the playfield.

## Rules

- Each shuffled bag contains one of every shape. The next three pieces are visible.
- The outline shows where the current piece will land. Rotate near an edge to try a short offset if the regular rotation is blocked.
- Hold stores the current piece or swaps it with the stored one. You can hold once per placement.
- Grounded pieces lock after 450 ms. Movement or rotation can reset the timer up to eight times. A hard drop locks immediately.
- Soft drops award one point per cell and hard drops award two. Clearing rows awards 100 × rows² × level. Consecutive placements that clear rows add 50 × (streak − 1) × level.
- Every six cleared rows increases the level and speeds up gravity. The best score is saved in the browser.

## Development

```sh
npm install     # installs TypeScript, the only development dependency
npm run build   # compiles src/ and copies the HTML and CSS into dist/
npm start       # serves the game at http://localhost:8321
npm test        # builds and runs the headless logic smoke tests
```

The game has no runtime dependencies.
