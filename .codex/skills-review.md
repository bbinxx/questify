# Questify skills review

Reviewed 2026-11-10 against package.json and current application source. This is a
stack/skill-fit audit, not a full code security audit. Global skills were inventoried
by entrypoint metadata; relevant creator, installer, discovery, Git-worktree and
verification instructions were also read. Unrelated Android manuals were not loaded.

## Coverage decisions
| Capability | Installed fit | Repository coverage |
| --- | --- | --- |
| Next.js 14, React 18, TypeScript, Tailwind 4, accessibility | vercel-react-best-practices, web-design-guidelines, frontend-design (added after initial audit) | questify-web |
| Socket.IO phase engine, scoring, lifecycle | No dedicated installed skill | questify-realtime |
| Firestore, cookie auth, R2, custom-server deployment | No dedicated installed skill | questify-backend |
| Branch selection, commits, merges, cleanup | using-git-worktrees covers isolation only | questify-git |
| Debugging and verification | systematic-debugging, verification-before-completion | Reuse when applicable |
| Planning, testing and code review | writing-plans, test-driven-development, requesting-code-review | Conditional; scale to task and current infrastructure |
| Skill authoring/discovery | skill-creator, skill-installer, find-skills | Setup tasks only |
| Android/KMP/Compose and computer vision | Installed but unrelated | Leave globally installed; do not apply here |

Plugin catalog also exposes Android skills (many duplicate user entries), Sites,
image generation, OpenAI docs, plugin management and Work Pets. Use Sites only for
its applicable website workflow, image generation for requested/generated assets,
and OpenAI docs for Codex setup. Pets and Android workflows are unrelated to this
repo. No global skills were removed, disabled or copied into this repository.
Four third-party skills were subsequently installed globally at the user’s request:
vercel-react-best-practices, web-design-guidelines and vercel-composition-patterns
from vercel-labs/agent-skills, plus frontend-design from anthropics/skills.
They supplement the repo skills; use only React 18/Next.js 14 compatible rules. The four local skills cover observed repo
needs without requiring an external skill bundle or additional application packages.

## Follow-up gaps found in source
- package.json has no lint/test scripts or dedicated test framework. Add a suitable
  harness when implementing behavior that needs regression coverage.
- db:prod:* scripts reference Prisma despite absent dependency/schema.
- lib/redis.ts imports ioredis absent from package.json; verify use before cleanup.
- render.yaml retains DATABASE_URL/REDIS_URL while active persistence uses Firestore.
- /api/quiz uses in-memory storage separate from DatabaseService.
- Cookie/session integrity, resource ownership and upload validation merit a focused
  backend review; this documentation task does not fix or certify those paths.
- Global Android skills and plugin variants overlap. Avoid loading both copies;
  machine-wide deletion would affect other projects and is outside this repo setup.

## Locations and maintenance
AGENTS.md routes tasks to .agents/skills. .codex/config.toml intentionally inherits
user model, permissions and integrations. Skills live in the documented repo discovery
directory, not a duplicate .codex/skills directory. Update this review when the stack
or test tooling changes. Newly created skills are available on the next turn; restart
Codex if they are not discovered.

References: [local skills](https://developers.openai.com/codex/skills/) and
[project configuration](https://developers.openai.com/codex/config-basic/).

## Additional global installations
| Skill | Source |
| --- | --- |
| vercel-react-best-practices | vercel-labs/agent-skills: skills/react-best-practices |
| web-design-guidelines | vercel-labs/agent-skills: skills/web-design-guidelines |
| vercel-composition-patterns | vercel-labs/agent-skills: skills/composition-patterns |
| frontend-design | anthropics/skills: skills/frontend-design |

## User-directory inventory (initial 109 entrypoints)
This inventory records all skill entrypoints found in the two user skill roots;
plugin catalog coverage is summarized above.

| Skill | Entrypoint |
| --- | --- |
| adaptive | `/home/bbin/.agents/skills/adaptive/SKILL.md` |
| agp-9-upgrade | `/home/bbin/.agents/skills/agp-9-upgrade/SKILL.md` |
| android-cli | `/home/bbin/.agents/skills/android-cli/SKILL.md` |
| android-compose-ui | `/home/bbin/.agents/skills/android-compose-ui/SKILL.md` |
| android-data-layer | `/home/bbin/.agents/skills/android-data-layer/SKILL.md` |
| android-debugging | `/home/bbin/.agents/skills/android-debugging/SKILL.md` |
| android-dev | `/home/bbin/.agents/skills/android-dev/SKILL.md` |
| android-di-koin | `/home/bbin/.agents/skills/android-di-koin/SKILL.md` |
| android-error-handling | `/home/bbin/.agents/skills/android-error-handling/SKILL.md` |
| android-for-cars-parked-apps | `/home/bbin/.agents/skills/android-for-cars-parked-apps/SKILL.md` |
| android-gradle-logic | `/home/bbin/.agents/skills/android-gradle-logic/SKILL.md` |
| android-intent-security | `/home/bbin/.agents/skills/android-intent-security/SKILL.md` |
| android-module-structure | `/home/bbin/.agents/skills/android-module-structure/SKILL.md` |
| android-navigation | `/home/bbin/.agents/skills/android-navigation/SKILL.md` |
| android-permissions-security | `/home/bbin/.agents/skills/android-permissions-security/SKILL.md` |
| android-presentation-mvi | `/home/bbin/.agents/skills/android-presentation-mvi/SKILL.md` |
| android-profiler | `/home/bbin/.agents/skills/android-profiler/SKILL.md` |
| android-retrofit | `/home/bbin/.agents/skills/android-retrofit/SKILL.md` |
| android-source-search | `/home/bbin/.agents/skills/android-source-search/SKILL.md` |
| android-testing | `/home/bbin/.agents/skills/android-testing/SKILL.md` |
| android-ux | `/home/bbin/.agents/skills/android-ux/SKILL.md` |
| anr-audit-and-fix | `/home/bbin/.agents/skills/anr-audit-and-fix/SKILL.md` |
| appfunctions | `/home/bbin/.agents/skills/appfunctions/SKILL.md` |
| auditing-compose-performance | `/home/bbin/.agents/skills/auditing-compose-performance/SKILL.md` |
| avoiding-subcomposition-pitfalls | `/home/bbin/.agents/skills/avoiding-subcomposition-pitfalls/SKILL.md` |
| camerax | `/home/bbin/.agents/skills/camerax/SKILL.md` |
| choosing-derivedstateof | `/home/bbin/.agents/skills/choosing-derivedstateof/SKILL.md` |
| coil-compose | `/home/bbin/.agents/skills/coil-compose/SKILL.md` |
| collecting-flows-safely | `/home/bbin/.agents/skills/collecting-flows-safely/SKILL.md` |
| compose | `/home/bbin/.agents/skills/compose/SKILL.md` |
| compose-expert | `/home/bbin/.agents/skills/compose-expert/SKILL.md` |
| configuring-lazy-prefetch | `/home/bbin/.agents/skills/configuring-lazy-prefetch/SKILL.md` |
| contour-analysis | `/home/bbin/.agents/skills/contour-analysis/SKILL.md` |
| datastore | `/home/bbin/.agents/skills/datastore/SKILL.md` |
| debugging-recompositions | `/home/bbin/.agents/skills/debugging-recompositions/SKILL.md` |
| deferring-state-reads | `/home/bbin/.agents/skills/deferring-state-reads/SKILL.md` |
| diagnosing-compose-stability | `/home/bbin/.agents/skills/diagnosing-compose-stability/SKILL.md` |
| display-glasses-with-jetpack-compose-glimmer | `/home/bbin/.agents/skills/display-glasses-with-jetpack-compose-glimmer/SKILL.md` |
| edge-to-edge | `/home/bbin/.agents/skills/edge-to-edge/SKILL.md` |
| enforcing-stability-in-ci | `/home/bbin/.agents/skills/enforcing-stability-in-ci/SKILL.md` |
| engage-sdk-integration | `/home/bbin/.agents/skills/engage-sdk-integration/SKILL.md` |
| find-skills | `/home/bbin/.agents/skills/find-skills/SKILL.md` |
| generating-baseline-profiles | `/home/bbin/.agents/skills/generating-baseline-profiles/SKILL.md` |
| glance-appwidget-updates-and-memory | `/home/bbin/.agents/skills/glance-appwidget-updates-and-memory/SKILL.md` |
| glance-canonical-layouts | `/home/bbin/.agents/skills/glance-canonical-layouts/SKILL.md` |
| gradle-build-performance | `/home/bbin/.agents/skills/gradle-build-performance/SKILL.md` |
| image-fundamentals | `/home/bbin/.agents/skills/image-fundamentals/SKILL.md` |
| ink-app-builder | `/home/bbin/.agents/skills/ink-app-builder/SKILL.md` |
| ink-custom-brush-builder | `/home/bbin/.agents/skills/ink-custom-brush-builder/SKILL.md` |
| iterating-with-ai-and-mcp | `/home/bbin/.agents/skills/iterating-with-ai-and-mcp/SKILL.md` |
| jetpack-compose-performance | `/home/bbin/.agents/skills/jetpack-compose-performance/SKILL.md` |
| kmp-boundaries | `/home/bbin/.agents/skills/kmp-boundaries/SKILL.md` |
| kmp-ktor | `/home/bbin/.agents/skills/kmp-ktor/SKILL.md` |
| koin | `/home/bbin/.agents/skills/koin/SKILL.md` |
| kotlin-coroutines | `/home/bbin/.agents/skills/kotlin-coroutines/SKILL.md` |
| kotlin-flows | `/home/bbin/.agents/skills/kotlin-flows/SKILL.md` |
| leanback-to-compose-tv-migration | `/home/bbin/.agents/skills/leanback-to-compose-tv-migration/SKILL.md` |
| litert-lm | `/home/bbin/.agents/skills/litert-lm/SKILL.md` |
| litert-runtime | `/home/bbin/.agents/skills/litert-runtime/SKILL.md` |
| media3-cast-integration | `/home/bbin/.agents/skills/media3-cast-integration/SKILL.md` |
| mediapipe-tracking | `/home/bbin/.agents/skills/mediapipe-tracking/SKILL.md` |
| migrate-xml-views-to-jetpack-compose | `/home/bbin/.agents/skills/migrate-xml-views-to-jetpack-compose/SKILL.md` |
| migrating-to-modifier-node | `/home/bbin/.agents/skills/migrating-to-modifier-node/SKILL.md` |
| ml-kit-genai-prompt-api | `/home/bbin/.agents/skills/ml-kit-genai-prompt-api/SKILL.md` |
| mlkit-agent-api | `/home/bbin/.agents/skills/mlkit-agent-api/SKILL.md` |
| mobile-android-design | `/home/bbin/.agents/skills/mobile-android-design/SKILL.md` |
| modularization | `/home/bbin/.agents/skills/modularization/SKILL.md` |
| morphology-toolkit | `/home/bbin/.agents/skills/morphology-toolkit/SKILL.md` |
| navigation-3 | `/home/bbin/.agents/skills/navigation-3/SKILL.md` |
| navigation-event | `/home/bbin/.agents/skills/navigation-event/SKILL.md` |
| optimizing-lazy-layouts | `/home/bbin/.agents/skills/optimizing-lazy-layouts/SKILL.md` |
| ordering-modifier-chains | `/home/bbin/.agents/skills/ordering-modifier-chains/SKILL.md` |
| paging | `/home/bbin/.agents/skills/paging/SKILL.md` |
| pdf-annotations | `/home/bbin/.agents/skills/pdf-annotations/SKILL.md` |
| play-billing-library-version-upgrade | `/home/bbin/.agents/skills/play-billing-library-version-upgrade/SKILL.md` |
| play-policy-insights | `/home/bbin/.agents/skills/play-policy-insights/SKILL.md` |
| preprocessing-decisions | `/home/bbin/.agents/skills/preprocessing-decisions/SKILL.md` |
| preserving-state-across-reloads | `/home/bbin/.agents/skills/preserving-state-across-reloads/SKILL.md` |
| projected-hardware | `/home/bbin/.agents/skills/projected-hardware/SKILL.md` |
| r8-analyzer | `/home/bbin/.agents/skills/r8-analyzer/SKILL.md` |
| requesting-code-review | `/home/bbin/.agents/skills/requesting-code-review/SKILL.md` |
| restore-credentials | `/home/bbin/.agents/skills/restore-credentials/SKILL.md` |
| rxjava-migration | `/home/bbin/.agents/skills/rxjava-migration/SKILL.md` |
| setting-up-compose-hotswan | `/home/bbin/.agents/skills/setting-up-compose-hotswan/SKILL.md` |
| stabilizing-compose-types | `/home/bbin/.agents/skills/stabilizing-compose-types/SKILL.md` |
| systematic-debugging | `/home/bbin/.agents/skills/systematic-debugging/SKILL.md` |
| test-driven-development | `/home/bbin/.agents/skills/test-driven-development/SKILL.md` |
| testing-compose-in-release-mode | `/home/bbin/.agents/skills/testing-compose-in-release-mode/SKILL.md` |
| testing-setup | `/home/bbin/.agents/skills/testing-setup/SKILL.md` |
| thresholding-strategy | `/home/bbin/.agents/skills/thresholding-strategy/SKILL.md` |
| tracing-recompositions-at-runtime | `/home/bbin/.agents/skills/tracing-recompositions-at-runtime/SKILL.md` |
| understanding-hot-reload-limits | `/home/bbin/.agents/skills/understanding-hot-reload-limits/SKILL.md` |
| understanding-stability-inference | `/home/bbin/.agents/skills/understanding-stability-inference/SKILL.md` |
| using-efficient-effects | `/home/bbin/.agents/skills/using-efficient-effects/SKILL.md` |
| using-git-worktrees | `/home/bbin/.agents/skills/using-git-worktrees/SKILL.md` |
| using-stability-analyzer-ide-plugin | `/home/bbin/.agents/skills/using-stability-analyzer-ide-plugin/SKILL.md` |
| using-strong-skipping-correctly | `/home/bbin/.agents/skills/using-strong-skipping-correctly/SKILL.md` |
| verification-before-completion | `/home/bbin/.agents/skills/verification-before-completion/SKILL.md` |
| verified-email | `/home/bbin/.agents/skills/verified-email/SKILL.md` |
| visualizing-recomposition-cascades | `/home/bbin/.agents/skills/visualizing-recomposition-cascades/SKILL.md` |
| wear-compose-m3 | `/home/bbin/.agents/skills/wear-compose-m3/SKILL.md` |
| wear-widgets | `/home/bbin/.agents/skills/wear-widgets/SKILL.md` |
| writing-plans | `/home/bbin/.agents/skills/writing-plans/SKILL.md` |
| yolo-pipeline | `/home/bbin/.agents/skills/yolo-pipeline/SKILL.md` |
| imagegen | `/home/bbin/.codex/skills/.system/imagegen/SKILL.md` |
| openai-docs | `/home/bbin/.codex/skills/.system/openai-docs/SKILL.md` |
| review-agent | `/home/bbin/.codex/skills/.system/review-agent/SKILL.md` |
| skill-creator | `/home/bbin/.codex/skills/.system/skill-creator/SKILL.md` |
| skill-installer | `/home/bbin/.codex/skills/.system/skill-installer/SKILL.md` |
