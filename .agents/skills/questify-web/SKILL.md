---
name: questify-web
description: Develop or review Questify Next.js routes, React UI, TypeScript, Tailwind styling and accessibility.
---

# Questify web development

Trace the route and its data source before editing. This project uses Next.js 16
and React 19; confirm APIs against installed versions using node_modules/next/dist/docs/ for version-matched guidance. Keep server actions in app/actions and server-only imports out
of client components. Add client boundaries only where browser state is needed.

Use the existing Tailwind 4 PostCSS setup and visual conventions. Check presenter,
display and participant layouts separately: their space and interaction needs differ.
Maintain keyboard access, labels, focus visibility, readable contrast and reduced
motion behavior when changing animated UI. Preserve audio gesture requirements.

Trace create/edit data through app/actions/quiz.ts and lib/db.ts; question options
may be JSON strings, while editor answers use arrays. Update adapters deliberately.
For game event UI, read the realtime skill too. Avoid adding listeners on each render;
clean up the exact listener and timers owned by the component.

Validate changed routes at phone and desktop sizes, including loading, empty and
error states. Run local TypeScript and production build checks for code changes;
state any service/configuration blockers. Documentation-only edits need diff checks.
