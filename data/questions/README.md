# Question database

`questions.json` holds all 358 questions from the supplied **NSW Driver Knowledge Test Questions – Class C (Car)** PDF. The app code reads it directly, so you can edit this file without touching any code.

| Field | Meaning |
|---|---|
| `id` | Internal id (the source code in lower case, e.g. `in045`) |
| `sourceCode` | Code from the PDF, e.g. `IN045`, `CG013`, `SI052` |
| `category` | Game category (see `data/categories/categories.json`) |
| `sourceCategory` / `section` | The category and section exactly as printed in the PDF |
| `subcategory`, `tags` | Keyword helpers used for map levels, mini-games and practice |
| `question`, `correctAnswer`, `incorrectAnswers` | Source text. The correct answer is the option printed in **bold** in the PDF |
| `explanation` | The correct answer, shown on the "Correct rule" panel |
| `challengeType` | `multiple-choice`, `sign`, `traffic-light`, `hotspot` (tap the diagram) or `sequence` (tap vehicles in order) |
| `difficulty` | 1 (easy) to 3 (hard). Affects XP, skill rating and competition points |
| `visualType` / `visual` | Spec used to redraw the source diagram as original SVG artwork (`sign`, `lights`, `scene`, `pov`, `custom`) |
| `consequence` | Which stylised "what happened" animation plays on a wrong answer |
| `sourcePage` | Page number in the PDF |
| `status` | `active`, `review` or `excluded` (excluded questions never appear) |

Answer order is **always shuffled** when a question is shown, so the order stored here doesn't matter.

To rebuild from the PDF, see `tools/` and section 6 of `CONTENT_REVIEW.md`.
