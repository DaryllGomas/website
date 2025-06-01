# Zen Garden Enhancement Plan

This plan outlines potential improvements for the interactive Zen Garden feature in `zen-story.html`. Use the checkboxes to track progress.

## 1. More Realistic Raking

*   **Goal:** Allow users to draw continuous rake lines by dragging the mouse instead of just clicking for circles.
*   **Tasks:**
    - [x] Modify the event listener on the `#sand` element to use `mousedown`, `mousemove`, and `mouseup`.
    - [x] On `mousedown`, start recording the mouse path.
    - [x] On `mousemove` (while mouse is down), draw short line segments connecting the recorded points.
    - [x] On `mouseup`, finalize the current rake line.
    - [x] Refine the appearance of the drawn lines (e.g., color `e5dbc5` for light mode, `#444` for dark mode, appropriate thickness).
    - [x] Ensure lines are added to the `lines` array for potential clearing.

## 2. Stone Variety

*   **Goal:** Make the stones look slightly more natural and less uniform.
*   **Tasks:**
    - [x] In the `initZenGarden` function, within the stone creation loop, randomize the `background-color` slightly for each stone (e.g., vary the gray shade within a small range like `#666` to `#888`).
    - [x] Consider adding a subtle inner `box-shadow` for depth (e.g., `inset 0 1px 2px rgba(0,0,0,0.2)`).
    - [x] Keep the `border-radius: 50%` for a smooth look.

## 3. Reset Button

*   **Goal:** Add a way for the user to clear the garden and start fresh.
*   **Tasks:**
    - [x] Add a `button` element inside the `.zen-garden-header` div in the HTML, next to the close button. Give it an ID like `reset-zen-garden`.
    - [x] Add basic CSS styling for the reset button (similar to `.zen-garden-close`).
    - [x] Create a JavaScript event listener for `#reset-zen-garden`.
    - [x] In the event listener function, call `clearZenLines()` to remove all drawn rake lines.
    - [x] In the event listener function, loop through the `stones` array and assign new random `top` and `left` positions within the garden boundaries.
    - [x] (Optional) In the event listener function, call `drawZenLines()` to redraw the initial default horizontal lines.

## 4. (Optional) Subtle Sound Effects

*   **Goal:** Add unobtrusive audio feedback for interaction.
*   **Tasks:**
    - [x] Source or create very short, low-volume sound files: `rake.mp3` (gentle sand scrape) and `stone_place.mp3` (soft click/thud).
    - [x] Add `<audio>` elements for these sounds with `preload="auto"`.
    - [x] Get references to these audio elements in the JavaScript.
    - [x] In the raking `mousemove` logic, play `rakeSound.play()` very quietly and possibly intermittently.
    - [x] In the stone `mouseup` listener (when `activeStone` is released), play `stonePlaceSound.play()`.
    - [x] Ensure these sounds respect the main sound toggle (`soundPlaying` variable). 