# Questify product roadmap

Updated: 2026-11-10.

## Product goal
Build one platform combining competitive learning games with interactive presentations,
polling, audience Q&A, surveys and training workflows. Users should be able to mix
these activities in the same presentation and run them live or at their own pace.

This is Questify's proposed combined scope, informed by official Kahoot! and
Mentimeter documentation. It is not a claim that both products provide every item.
Matching their full commercial catalogs is a multi-release program, not one patch.
Branded minigames are represented by game-mode capabilities, not promises to copy
each named game. Product features are separate from vendor pricing/plan limits.

## Reading the inventory
- **Partial**: code/foundations exist, including uncommitted audit work; still needs
  end-to-end verification and completion. It does not mean production-ready.
- **Planned**: no complete implementation established by the repository review.
- **P0–P15**: delivery workstreams in the linked implementation plan, not dates.
- Every feature gets an enduring ID so tasks, tests and releases can refer to it.
- **BUSINESS** is conditional on a decision to monetize; keep it tracked without
  delaying the core product. Integrations are delivered individually as needed.

## Existing baseline and work in progress
The app has host accounts, a quiz library/editor, live host/display/participant
screens, four basic question types, media support, scoring/leaderboards and basic
session analytics. Coverage and reliability are incomplete. Audit changes are on
`fix/skill-audit`, uncommitted and not integrated into `dev` as of this document.
Do not replace or discard that work when starting roadmap delivery.

The initial production dependency audit reported 25 advisories (2 critical, 12 high,
11 moderate); these include transitive dependencies. This is a baseline observation,
not an assessment that every advisory is exploitable. Remediation and a fresh audit
belong to P0. Do not use `npm audit fix --force` without reviewing breaking changes.

The current data model supports only a narrow quiz shape. A shared, versioned
activity model must precede additional interactions to avoid rewriting the editor,
socket protocol, persistence and reports for every new question type.

## Reliable foundation (P0)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| BASE-01 | Signed host sessions, login/logout and resource ownership | Partial |
| BASE-02 | Email verification, password reset and account recovery | Planned |
| BASE-03 | Login/signup throttling and abuse prevention | Planned |
| BASE-04 | Validated quiz data, files and Socket.IO payloads | Partial |
| BASE-05 | Correct cancellation, pause/resume, deadlines and duplicate-answer prevention | Partial |
| BASE-06 | Player reconnect and complete state restoration | Partial |
| BASE-07 | Idempotent authoritative session-result persistence | Partial |
| BASE-08 | Separate development/build caches and reproducible Node/Docker setup | Partial |
| BASE-09 | Dependency advisory remediation and supported framework/runtime migration | Planned |
| BASE-10 | Regression tests, browser end-to-end tests and continuous integration | Partial |

## Shared content and response model (P1)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| MODEL-01 | Versioned presentations containing mixed activity and content slides | Planned |
| MODEL-02 | Discriminated activity schemas with editor, player, display and report contracts | Planned |
| MODEL-03 | Separate scored, unscored, identified and anonymous response policies | Planned |
| MODEL-04 | Immutable published versions and per-session content snapshots | Planned |
| MODEL-05 | Server-side validation and grading adapters for every activity type | Planned |
| MODEL-06 | Response IDs, participant identity, deduplication and attempt policies | Planned |
| MODEL-07 | Backward-compatible migration of existing quizzes and reports | Planned |

## Authoring and content management (P2)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| EDIT-01 | Create, edit, duplicate and delete presentations/questions | Partial |
| EDIT-02 | Drag-and-drop slide ordering and keyboard alternatives | Planned |
| EDIT-03 | Autosave with saving/saved/error indicators and conflict handling | Planned |
| EDIT-04 | Undo/redo and unsaved-change protection | Planned |
| EDIT-05 | Draft, published, archived and trash/restore states | Planned |
| EDIT-06 | Folders, tags, search, filters and sorting | Planned |
| EDIT-07 | Reusable question bank and import questions from other decks | Planned |
| EDIT-08 | Templates for classes, training, meetings, workshops and events | Planned |
| EDIT-09 | Preview as host, participant and audience display | Partial |
| EDIT-10 | CSV/Excel/JSON question import with validation and error reporting | Planned |
| EDIT-11 | PowerPoint/PDF slide import with preserved source/attribution | Planned |
| EDIT-12 | Version history, restore previous version and publication controls | Planned |

## Question and interaction types (P3)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| QUESTION-01 | Single-choice scored quiz with configurable answer count | Partial |
| QUESTION-02 | Multi-select quiz with multiple correct options and partial-credit rules | Planned |
| QUESTION-03 | True/false quiz | Partial |
| QUESTION-04 | Typed-answer quiz with accepted alternatives and normalization | Partial |
| QUESTION-05 | Numeric answer with units, tolerance and precision grading | Planned |
| QUESTION-06 | Puzzle/order-the-items quiz | Planned |
| QUESTION-07 | Match-pairs activity | Planned |
| QUESTION-08 | Fill-in-the-blank activity | Planned |
| QUESTION-09 | Image choices and audio-based questions | Planned |
| QUESTION-10 | Scored pin-on-image with author-defined correct region | Planned |
| QUESTION-11 | Unscored single-choice poll | Partial |
| QUESTION-12 | Unscored multi-select poll | Planned |
| QUESTION-13 | Live word cloud with normalization, deduplication and filtering | Planned |
| QUESTION-14 | Open-ended short/long text with response wall | Planned |
| QUESTION-15 | Rating/Likert scales, stars and emoji ratings | Planned |
| QUESTION-16 | Numeric slider/estimate with configurable scale and optional grading | Planned |
| QUESTION-17 | Ranking/prioritization activity | Planned |
| QUESTION-18 | 100-point allocation across options | Planned |
| QUESTION-19 | Two-axis/2-by-2 evaluation grid | Planned |
| QUESTION-20 | Unscored pin-on-image and response heatmap | Planned |
| QUESTION-21 | Quick forms with required/optional fields and consent | Planned |
| QUESTION-22 | Brainstorm ideas, group ideas and vote on groups | Planned |
| QUESTION-23 | Audience Q&A with upvotes and moderation | Planned |
| QUESTION-24 | Structured satisfaction/NPS-style feedback | Planned |

## Hosting and participant experience (P4)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| LIVE-01 | PIN, join link and QR entry without participant signup | Partial |
| LIVE-02 | Anonymous, nickname, authenticated and invited-only join modes | Planned |
| LIVE-03 | Lobby with avatars, attendance and connection state | Partial |
| LIVE-04 | Nickname generator, profanity controls and duplicate-name handling | Planned |
| LIVE-05 | Lock/unlock room, remove/ban participants and capacity limits | Planned |
| LIVE-06 | Presenter dashboard and separate audience display | Partial |
| LIVE-07 | Co-host/moderator roles and mobile remote control | Planned |
| LIVE-08 | Start, pause, resume, skip, restart and end controls | Partial |
| LIVE-09 | Manual and automatic pacing with timer adjustment | Planned |
| LIVE-10 | Show/hide results, correct answers and leaderboard independently | Planned |
| LIVE-11 | Show full question/answers on participant devices | Planned |
| LIVE-12 | Late join/rejoin policies and low-bandwidth recovery | Planned |
| LIVE-13 | Live response counts and activity-specific result visualizations | Partial |
| LIVE-14 | Presenter notes, next-slide preview and full-screen mode | Planned |
| LIVE-15 | Practice/test session without polluting published reports | Planned |
| LIVE-16 | Audience reactions with host controls and rate limits | Partial |
| LIVE-17 | Live captions/media descriptions, zoom and device-safe layouts | Planned |

## Quiz scoring and game modes (P5)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| GAME-01 | Classic individual competition with points and podium | Partial |
| GAME-02 | Accuracy-only mode without speed pressure | Planned |
| GAME-03 | No-points, standard, double and custom scoring policies | Partial |
| GAME-04 | Configurable streak and time bonuses with transparent rules | Partial |
| GAME-05 | Multi-select partial credit and numeric precision scoring | Planned |
| GAME-06 | Question/answer shuffling with stable grading identities | Planned |
| GAME-07 | Team competition: shared-device and individual-device participation | Planned |
| GAME-08 | Team selection/assignment, discussion time and team leaderboards | Planned |
| GAME-09 | Cooperative group goals and noncompetitive participation mode | Planned |
| GAME-10 | Optional elimination, survival and tournament rounds | Planned |
| GAME-11 | Badges/achievements, rematches and season leaderboards | Planned |
| GAME-12 | Answer explanations and post-question learning feedback | Planned |

## Presentation and audience insight (P6)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| PRESENT-01 | Title, text, image, video, instructions and divider slides | Planned |
| PRESENT-02 | Rich text, lists, links, mathematical notation and code blocks | Planned |
| PRESENT-03 | Custom slide layouts, backgrounds and accessible themes | Planned |
| PRESENT-04 | Consistent branding across host, display and participant screens | Planned |
| PRESENT-05 | Charts: bars, stacked bars, distributions, rankings and word clouds | Planned |
| PRESENT-06 | Result comparison between questions and before/after activities | Planned |
| PRESENT-07 | Response segmentation using consented participant attributes | Planned |
| PRESENT-08 | Hide/reveal responses and host-selected response highlighting | Planned |
| PRESENT-09 | Q&A inbox, answered/archive states and pinned questions | Planned |
| PRESENT-10 | Moderation queue, spam/profanity filters and response removal | Planned |
| PRESENT-11 | Manual response grouping and duplicate idea merging | Planned |
| PRESENT-12 | Anonymous response controls with minimum-group privacy thresholds | Planned |

## Self-paced surveys and assignments (P7)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| ASYNC-01 | Participant-paced quizzes, presentations and surveys | Planned |
| ASYNC-02 | Shareable assignment links with start/end schedules and timezones | Planned |
| ASYNC-03 | Deadlines, reminders, attempt limits and resume-later support | Planned |
| ASYNC-04 | Optional timers and customizable post-submission feedback | Planned |
| ASYNC-05 | Survey pages, required questions, branching and skip logic | Planned |
| ASYNC-06 | Anonymous surveys and invite-only respondent lists | Planned |
| ASYNC-07 | Completion tracking and assignment reports | Planned |
| ASYNC-08 | Recurring pulse check-ins with scheduled delivery | Planned |
| ASYNC-09 | Longitudinal trend charts and recurring-question comparisons | Planned |
| ASYNC-10 | Close/reopen surveys and configurable results visibility | Planned |

## Learning and training (P8)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| LEARN-01 | Courses composed of presentations, quizzes and assignments | Planned |
| LEARN-02 | Module prerequisites and scheduled content release | Planned |
| LEARN-03 | Learner progress, completion and pass/fail thresholds | Planned |
| LEARN-04 | Certificates and downloadable completion records | Planned |
| LEARN-05 | Practice/review mode and retry incorrect questions | Planned |
| LEARN-06 | Flashcards, spaced practice and learner goals | Planned |
| LEARN-07 | Classes/cohorts, rosters and instructor dashboards | Planned |
| LEARN-08 | Cross-session learner mastery and progress comparisons | Planned |

## Results and analytics (P9)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| REPORT-01 | Session history with host, date, mode and presentation version | Partial |
| REPORT-02 | Per-question answer distribution and response time | Partial |
| REPORT-03 | Per-participant answers, score breakdown and completion | Planned |
| REPORT-04 | Accuracy, hardest questions and participation summaries | Partial |
| REPORT-05 | Poll/ranking/scale statistics and raw response views | Planned |
| REPORT-06 | Word cloud/open-text/Q&A reports with moderation state | Planned |
| REPORT-07 | Compare repeated sessions, cohorts and pre/post results | Planned |
| REPORT-08 | Search/filter reports and inspect individual responses | Planned |
| REPORT-09 | CSV/Excel exports and PDF/image summaries | Planned |
| REPORT-10 | Private/shareable report links with access controls | Planned |
| REPORT-11 | Report deletion, anonymization and retention settings | Planned |
| REPORT-12 | Workspace-wide usage, engagement and learning trends | Planned |

## Libraries, collaboration and sharing (P10)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| TEAM-01 | Personal and organization workspaces | Planned |
| TEAM-02 | Owner/admin/editor/presenter/moderator/viewer roles | Planned |
| TEAM-03 | Invite members, groups and scoped sharing permissions | Planned |
| TEAM-04 | Shared folders, question banks, templates and brand themes | Planned |
| TEAM-05 | Simultaneous collaborative editing with presence and conflict resolution | Planned |
| TEAM-06 | Comments, review requests and publication approval | Planned |
| TEAM-07 | Public/unlisted/private presentations and remix controls | Planned |
| TEAM-08 | Searchable public content discovery and collections | Planned |
| TEAM-09 | Licensing/attribution, content reporting and takedown workflow | Planned |
| TEAM-10 | Transfer ownership and preserve team content when members leave | Planned |

## Assisted creation and insight (P11)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| AI-01 | Generate draft quizzes/presentations from a topic or prompt | Planned |
| AI-02 | Generate drafts from pasted text, PDFs or slide decks | Planned |
| AI-03 | Suggest distractors, explanations and additional question types | Planned |
| AI-04 | Adjust difficulty, reading level, tone and language | Planned |
| AI-05 | Translate content while preserving grading rules | Planned |
| AI-06 | Group similar open-text answers and brainstorm ideas | Planned |
| AI-07 | Summarize responses, Q&A and session takeaways | Planned |
| AI-08 | Human review, source attribution, privacy controls and AI usage limits | Planned |

## Media and branding (P12)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| MEDIA-01 | Image/video upload, preview and playback | Partial |
| MEDIA-02 | Audio upload and playback controls | Planned |
| MEDIA-03 | Media library with search, reuse and unused-file cleanup | Planned |
| MEDIA-04 | Image crop/resize, compression, alt text and captions | Planned |
| MEDIA-05 | Supported external video embeds with failure/privacy handling | Planned |
| MEDIA-06 | Background music, sound effects and mute/volume controls | Planned |
| MEDIA-07 | Logos, fonts, custom colors and reusable brand kits | Planned |
| MEDIA-08 | Localized participant UI, multilingual decks and RTL layouts | Planned |
| MEDIA-09 | Text-to-speech and accessible alternative presentation modes | Planned |

## External integrations (P13)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| INTEGRATE-01 | PowerPoint presentation integration | Planned |
| INTEGRATE-02 | Google Slides integration | Planned |
| INTEGRATE-03 | Teams/Zoom meeting workflows | Planned |
| INTEGRATE-04 | LMS integrations using LTI and grade-return workflows | Planned |
| INTEGRATE-05 | Learning export formats where the target LMS requires them | Planned |
| INTEGRATE-06 | Calendar/email invitations and transactional reminders | Planned |
| INTEGRATE-07 | Scoped public API, API keys and signed webhooks | Planned |
| INTEGRATE-08 | Embeddable activities and results with domain restrictions | Planned |

## Scale, administration and privacy (P14)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| OPS-01 | Durable room recovery after process restart | Planned |
| OPS-02 | Multi-instance room routing, fan-out and cross-node consistency | Planned |
| OPS-03 | Reconnect-safe event sequencing and server-authoritative deadlines | Planned |
| OPS-04 | Load tests at explicitly measured concurrent-room/player targets | Planned |
| OPS-05 | Monitoring, structured logs, error tracking and health/readiness probes | Planned |
| OPS-06 | Background jobs for exports, imports, reminders and media cleanup | Planned |
| OPS-07 | Backups, tested restore procedures and data migrations | Planned |
| OPS-08 | Admin console for users, sessions, content reports and abuse | Planned |
| OPS-09 | Audit logs, account export/deletion and retention enforcement | Planned |
| OPS-10 | SSO, organization domain controls and automated provisioning | Planned |
| OPS-11 | Accessibility audit and browser/device compatibility matrix | Planned |
| OPS-12 | Security dependency updates, secret rotation and incident runbooks | Planned |

## Optional commercial product layer (P15)

| ID | Feature / required behavior | Current status |
| --- | --- | --- |
| BUSINESS-01 | Free/paid plans with server-enforced entitlements | Planned |
| BUSINESS-02 | Participant, workspace, storage and AI quotas | Planned |
| BUSINESS-03 | Subscriptions, checkout, invoices and billing portal | Planned |
| BUSINESS-04 | Seat management, organization licensing and usage dashboards | Planned |
| BUSINESS-05 | Trial, upgrade/downgrade and cancellation flows | Planned |
| BUSINESS-06 | Payment webhook idempotency, failed-payment recovery and support tooling | Planned |

## Source references
Checked official documentation on 2026-11-10. Features and plan availability change;
recheck the applicable source when specifying an individual implementation.

- [Kahoot! question types](https://support.kahoot.com/hc/en-us/articles/115002308428-Kahoot-question-types)
- [Kahoot! scoring and accuracy mode](https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work)
- [Kahoot! assignments](https://support.kahoot.com/hc/en-us/articles/360039411334-How-to-assign-a-kahoot-in-web-platform)
- [Kahoot! courses](https://support.kahoot.com/hc/en-us/articles/4405241386131-Kahoot-courses-Intro)
- [Kahoot! workspaces](https://support.kahoot.com/hc/en-us/articles/360053998413-How-to-use-workspaces)
- [Mentimeter interactive slide types](https://help.mentimeter.com/en/articles/375437-create-an-interactive-menti-live)
- [Mentimeter live, form and pulse workflows](https://help.mentimeter.com/en/articles/17710294-what-can-i-do-with-menti-live-menti-form-and-menti-pulse)
- [Mentimeter collaboration and integrations](https://www.mentimeter.com/features)
- [Mentimeter results and export](https://help.mentimeter.com/en/articles/15086803-making-the-most-of-your-menti-live-results)

## Delivery tracking
Follow [the implementation plan](superpowers/plans/2026-11-10-full-platform.md).
When shipping, change a feature's status only with a linked commit, test evidence
and a release note. Use **In progress**, **Verified**, and **Released** as subsequent
states; do not mark a whole category complete when only one interaction works.
