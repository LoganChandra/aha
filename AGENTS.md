<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Prompt gate parity

Treat Role, Task, Context, and Format as one prompt-gate system. When adding or changing UI or interaction for one gate, apply the equivalent change to the other three in the same work. These gates are single-select: choosing an option updates the value and immediately closes the popup for all four. Do not leave a selected popup open waiting for Done. Keep selection feedback, mobile layout, typography, spacing, icon and button sizing, and accessibility consistent. Preserve gate-specific content only where the lesson requires it. After a shared gate change, check all four gates on desktop and mobile.

## Standalone HTML review versions

For each change to a standalone lesson HTML review, create a new HTML file instead of overwriting the previous version. Keep prior versions intact for comparison and rollback.

## Relatable visual language

Use clear, familiar vectors to explain the user's current choice; never add lines or shapes as decoration without a meaning. Role changes the character and its recognizable prop immediately; the selected persona replaces the robot. With no role selected, show one clear-faced Prof AI robot. During guided playback, visibly choose one persona at the Role beat and show that persona instead of the robot; outside guided playback, keep the robot until a role is selected. Task changes the map or scene to match the action: show a route for a trip or run, relevant place markers for a search, and a loop for an athletic route. Context visibly filters or highlights the relevant area or results. Format previews the requested answer shape. Pair color with a recognizable icon and a text label, and animate only the part that changed. Use familiar map cues such as named streets, transit stops, parks, and route start/end markers. Use real geographic data only when it is available; otherwise label the map as illustrative and avoid implying precise directions or distances. Respect reduced-motion settings.

## Skill fallback

When the user has not selected a skill, route the request through gstack autoplan before execution. Keep the user's requested scope; then use the task-specific skill for implementation and QA. Do not silently proceed with `No specific skill` when this fallback applies.

## Animation skill routing

For any request to create, fix, or QA animation, video, or motion, automatically assign and apply `design-motion`, even when the user does not tag a skill. Include `Assigned to: "design-motion"` in the reply. This animation-specific rule takes precedence over the general Autoplan fallback.

## Standalone animation regression check

For standalone lesson-video HTML, `prefers-reduced-motion` must not freeze the timeline or force one terminal scene. Keep the story advancing with reduced travel and no looping decorative motion. Before finishing an animation fix, verify both normal motion and reduced motion at a phone-sized viewport: the plane appears and lands, scenes advance through the Tokyo food beat, and playback does not remain stuck on the final frame.
