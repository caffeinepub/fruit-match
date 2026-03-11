# Fruit Match

## Current State
A web-based match-2 puzzle game with 12 worlds, 30 levels each. Has lives system, combo display, pause overlay, frozen tile visuals, collection objectives, and star rating system. Several of these features have bugs or are incomplete.

## Requested Changes (Diff)

### Add
- Public `pauseBackgroundMusic()` and `resumeBackgroundMusic()` methods on SoundManager class in `lib/soundManager.ts`

### Modify
- **GamePlay.tsx — frozen tile blocking**: In `handleTileClick`, after the chained tile check, add a guard: if `tile.frozen === true`, show a toast error and return early. This makes frozen tiles unclickable.
- **GamePlay.tsx — unfreeze on neighbor match**: When a match is made, unfreeze tiles that are adjacent (same row/col ±1 in the grid). Since tiles are a flat array and the grid columns depend on board size, unfreeze ALL frozen tiles when any match occurs nearby (simpler: unfreeze frozen tiles whose id is within ±gridCols of the matched tile ids).
- **GamePlay.tsx — collection target stale closure fix**: In the `shouldComplete` check, compute the new collected counts inline (without relying on the `collectedByType` state variable from closure), then check against `collectTarget`. Specifically: compute `newCollectedForType = (collectedByType[collectTarget.fruitType] ?? 0) + (tile.fruitType === collectTarget.fruitType ? 1 : 0) + (firstTile.fruitType === collectTarget.fruitType ? 1 : 0)` and use `newCollectedForType >= collectTarget.count` instead of stale `collectDone`.
- **GamePlay.tsx — pause music**: In the pause button's `onClick` handler, after `setIsPaused`, also call `soundManager.pauseBackgroundMusic()` when pausing and `soundManager.resumeBackgroundMusic()` when resuming.
- **GamePlay.tsx — star calculation**: Replace the inline time-based star formula in `handleLevelComplete` with a call to `calculateStarRating(worldId, levelId, timeLeft, initialTimeLimit, movesUsed, optimalMoves ?? pairCount)` imported from `lib/gameLogic.ts`. Save `timeLeft` at level complete moment. Update `starBreakdown` strings to reflect the new formula's actual thresholds.
- **translations.ts — star conditions**: Update `star_cond_1`, `star_cond_2`, `star_cond_3` in ALL languages to accurately describe the `calculateStarRating` thresholds (3 stars: fast + efficient, 2 stars: moderate, 1 star: completed). Also add a `frozen_tile_locked` key in all languages meaning "Frozen tile! Match nearby tiles first."
- **GamePlay.tsx — star info tooltip**: Replace `t("star_cond_1/2/3")` with dynamic strings showing real thresholds based on current world's difficulty multiplier.

### Remove
- The old inline star calculation formula in `handleLevelComplete` (the `timePercentage < 0.4 / 0.7` block)

## Implementation Plan
1. Add `pauseBackgroundMusic()` and `resumeBackgroundMusic()` public methods to `SoundManager` in `lib/soundManager.ts` by exposing `handleAndroidPause` / `handleAndroidResume` logic.
2. In `GamePlay.tsx` `handleTileClick`: add frozen tile guard after line checking `tile.chained`.
3. In `GamePlay.tsx` `handleTileClick`: after setting matched tiles, call `setTiles` to unfreeze nearby frozen tiles.
4. In `GamePlay.tsx` `handleTileClick`: fix `shouldComplete` by computing new collect count inline instead of relying on stale `collectDone`.
5. In `GamePlay.tsx` pause button `onClick`: call pause/resume music based on current `isPaused` state before toggle.
6. In `GamePlay.tsx` `handleLevelComplete`: import and call `calculateStarRating`, remove old inline formula.
7. Update `translations.ts` star condition strings and add frozen lock key for all languages.
