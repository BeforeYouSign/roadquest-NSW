# CONTENT_REVIEW.md — items to check before going public

RoadQuest NSW uses the supplied **NSW Driver Knowledge Test Questions — Class C (Car)** PDF as its only content source. In the game, the source text of all 358 questions and answers is kept exactly as written. The only edits are small fixes to how the PDF text was extracted, such as stray characters and spacing. Nothing has been silently "corrected". The items below are things a person should check against **current official NSW Government resources** before the site goes public.

How the data was built: every question, all three answer options, the section, category and page number came from the PDF automatically. **The correct answer is the option shown in bold in the PDF.** All 358 questions had exactly one bold option. The answer order is shuffled every time a question is shown.

Status key: questions marked `excluded` in `data/questions/questions.json` never appear in play. Everything else is live.

## 1. Must fix before launch

| Question code | Page | Issue | Recommended review |
|---|---|---|---|
| LD033 | 52 | The question asks "What does this sign mean?" but no sign image exists in the supplied PDF. | **Excluded from play.** Add the correct sign artwork (see `components/art/Sign.tsx`) and a `visual` spec in `tools/specs.py`, then set status back to `active`. |
| IN012 | 33 | The wording is confusing: it says both vehicles are "turning right", then asks which is best placed to "turn left into the street marked X". The diagram has been recreated as two lanes approaching, with X marked. | Check the original meaning. Consider rewording or excluding. |

## 2. Possibly outdated rules, penalties, figures or names

These are reproduced exactly as supplied. They may no longer match current NSW law or practice.

| Question code | Page | Issue | Recommended review |
|---|---|---|---|
| CG062 | 9 | Refers to notifying the "RTA". The RTA no longer exists; its functions now sit with Transport for NSW / Service NSW. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG064 | 10 | Refers to the "RTA" (see CG062). | Check against the current NSW Road User Handbook / NSW road rules. |
| AD034 | 23 | A crash statistic ("About 50%") that may be out of date. | Check against the current NSW Road User Handbook / NSW road rules. |
| AD014 | 21 | BAC limits for professional and heavy vehicle drivers. | Check against the current NSW Road User Handbook / NSW road rules. |
| AD041 | 23 | The zero BAC limit for learner and provisional licence holders. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG002 | 2 | The minimum time on a P1 licence. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG044 | 7 | The rule for reporting crashes to police (tow-away, 24 hours). | Check against the current NSW Road User Handbook / NSW road rules. |
| CG099 | 16 | Rules for bus lights and the 40 km/h limit. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG110 | 18 | Wording about flashing headlights on a bus. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG106 | 18 | Says the right lane on a three-lane freeway "is reserved for overtaking". | Check against the current NSW Road User Handbook / NSW road rules. |
| CG114 | 19 | Mobile phone rules (learners and P-platers have stricter restrictions). | Check against the current NSW Road User Handbook / NSW road rules. |
| CG039 | 6 | The 60 metre towing gap. | Check against the current NSW Road User Handbook / NSW road rules. |
| CG061 | 9 | The licence class for a 10-seat van. | Check against the current NSW Road User Handbook / NSW road rules. |
| BI001 | 25 | Minimum passing distances for bicycle riders. | Check against the current NSW Road User Handbook / NSW road rules. |
| BI002 | 25 | Minimum passing distances for bicycle riders. | Check against the current NSW Road User Handbook / NSW road rules. |
| BI003 | 25 | Crossing lines to pass bicycle riders. | Check against the current NSW Road User Handbook / NSW road rules. |
| SL015 | 72 | The Shared Traffic Zone speed limit. | Check against the current NSW Road User Handbook / NSW road rules. |
| SL026 | 73 | Radar detectors (an answer option mentions 1998). | Check against the current NSW Road User Handbook / NSW road rules. |
| SL028 | 73 | The default speed limit where no signs are shown. | Check against the current NSW Road User Handbook / NSW road rules. |
| ND038 | 59 | Penalties for street or drag racing. | Check against the current NSW Road User Handbook / NSW road rules. |
| ND039 | 59 | Penalties for street or drag racing. | Check against the current NSW Road User Handbook / NSW road rules. |
| ND040 | 59 | Penalties for street or drag racing (demerit points and fines). | Check against the current NSW Road User Handbook / NSW road rules. |
| ND045 | 59 | Penalties for speeding in road work zones. | Check against the current NSW Road User Handbook / NSW road rules. |
| ND048 | 60 | P1 licence suspension for speeding. | Check against the current NSW Road User Handbook / NSW road rules. |
| LD026 | 51 | T2 transit lane rules and times. | Check against the current NSW Road User Handbook / NSW road rules. |
| LD027 | 51 | T3 transit lane rules. | Check against the current NSW Road User Handbook / NSW road rules. |
| LD028 | 51 | The 100 m transit lane turning rule. | Check against the current NSW Road User Handbook / NSW road rules. |
| SI048 | 91 | Who may use a T3 lane (including motorcycles). | Check against the current NSW Road User Handbook / NSW road rules. |
| PD015 | 64 | Flashing yellow at pedestrian crossing lights. | Check against the current NSW Road User Handbook / NSW road rules. |
| IN040 | 39 | Continuing when lights turn yellow inside the intersection. | Check against the current NSW Road User Handbook / NSW road rules. |
| TL005 | 77 | U-turns at traffic lights. This rule is also referenced on the 404 page. | Check against the current NSW Road User Handbook / NSW road rules. |

## 3. Typos and wording kept from the source

| Question code | Page | Issue | Recommended review |
|---|---|---|---|
| SI058 | 93 | "What does this sign means?" | Optional: tidy the wording without changing the meaning. |
| SI064 | 94 | "a disable person" | Optional: tidy the wording without changing the meaning. |
| FD035 | 29 | "a more experience driver" (in a wrong option) | Optional: tidy the wording without changing the meaning. |
| BI002 | 25 | The correct answer has no full stop in the source. | Optional: tidy the wording without changing the meaning. |
| CG045 | 7 | "if a Policeman asks" (in a wrong option) | Optional: tidy the wording without changing the meaning. |
| ICAC3 | 1 | "him or her" wording | Optional: tidy the wording without changing the meaning. |

## 4. Diagrams and photos recreated as original artwork

The PDF has 193 diagrams and photos. None of them are copied. Each one is redrawn by the game's own SVG components from a small spec in `tools/specs.py`. Road signs are original drawings, not official sign files. **Photographs** have been turned into stylised driver's-eye illustrations with a short caption describing the scene. Each one should be checked to confirm the illustration still supports the source answer.

| Question code | Page | Issue | Recommended review |
|---|---|---|---|
| CG078 | 12 | Recreated as a custom illustration (hill-park). | Check against the original. |
| CG082 | 12 | The "3 m?" measurement label was added by the game. | Check against the original PDF diagram. |
| CG083 | 12 | The parking methods M, N and O are redrawn as angled, parallel and reverse-angled parking. | Check against the original PDF diagram. |
| CG086 | 13 | Source photo recreated as an illustration: "A narrow bridge with only just enough room for two vehicles" | Check the illustration still supports the answer. |
| CG087 | 13 | The mirror views A, B and C were redrawn as a concept (A shows mostly the road with a sliver of your own car, B mostly your own car, C mostly sky). | Check against the original PDF diagram. |
| CG088 | 14 | Source photo recreated as an illustration: "An intersection where a building sits right on the corner of the side street" | Check the illustration still supports the answer. |
| CG090 | 14 | Source photo recreated as an illustration: "Multi-lane road: you hear an ambulance siren from behind" | Check the illustration still supports the answer. |
| CG091 | 15 | Source photo recreated as an illustration: "Suburban street with parked cars: an ambulance appears in your mirror" | Check the illustration still supports the answer. |
| CG099 | 16 | Recreated as a custom illustration (bus-40). | Check against the original. |
| CG100 | 16 | Source photo recreated as an illustration: "Driving at night with no other traffic around" | Check the illustration still supports the answer. |
| CG102 | 16 | Source photo recreated as an illustration: "Parking at night for a short time" | Check the illustration still supports the answer. |
| CG103 | 17 | Source photo recreated as an illustration: "A corner with loose gravel on the road" | Check the illustration still supports the answer. |
| CG105 | 17 | Source photo recreated as an illustration: "A two-lane freeway" | Check the illustration still supports the answer. |
| CG113 | 18 | Recreated as a custom illustration (bus-rail-20m). | Check against the original. |
| FD028 | 28 | Recreated as a custom illustration (shoulder-check). | Check against the original. |
| FD033 | 29 | Source photo recreated as an illustration: "Night driving on a suburban street" | Check the illustration still supports the answer. |
| FD037 | 30 | Source photo recreated as an illustration: "Following another vehicle — how big should the gap be?" | Check the illustration still supports the answer. |
| IN016 | 34 | A Y-shaped junction is approximated as a cross intersection with the same give-way relationships. | Check against the original PDF diagram. |
| IN034 | 37 | Source photo recreated as an illustration: "A Light Rail vehicle about to enter the intersection" | Check the illustration still supports the answer. |
| IN035 | 37 | Source photo recreated as an illustration: "Busy traffic: the road on the far side of the intersection is full" | Check the illustration still supports the answer. |
| IN037 | 38 | Source photo recreated as an illustration: "A busy intersection with slow moving traffic" | Check the illustration still supports the answer. |
| IN038 | 38 | Source photo recreated as an illustration: "Traffic on the other side of the intersection has stopped" | Check the illustration still supports the answer. |
| IN040 | 39 | Source photo recreated as an illustration: "The lights turn yellow as you drive into the intersection" | Check the illustration still supports the answer. |
| IN042 | 39 | Recreated as a custom illustration (ped-signals). | Check against the original. |
| IN043 | 39 | Source photo recreated as an illustration: "Turning left: pedestrian lights are flashing red" | Check the illustration still supports the answer. |
| IN053 | 41 | An isometric drawing is redrawn as a top-down T-junction. | Check against the original PDF diagram. |
| IN057 | 42 | Points M, N and O are placed along the path of a car going straight through the roundabout. | Check against the original PDF diagram. |
| IN064 | 44 | The position of the marked car on the roundabout is approximated. | Check against the original PDF diagram. |
| LD004 | 46 | Drawn as a double line with the unbroken line on the purple car's side. Check against the original. | Check against the original PDF diagram. |
| LD010 | 48 | The merge geometry is approximated (right lane ends). | Check against the original PDF diagram. |
| LD011 | 48 | The merge geometry is approximated (B is in the lane that ends). | Check against the original PDF diagram. |
| LD017 | 49 | Source photo recreated as an illustration: "Country road marked with double unbroken dividing lines" | Check the illustration still supports the answer. |
| LD025 | 50 | Source photo recreated as an illustration: "Changing lanes in busy traffic" | Check the illustration still supports the answer. |
| LD038 | 52 | Recreated as a custom illustration (one-way-positions). | Check against the original. |
| ND031 | 57 | Source photo recreated as an illustration: "You move from the left lane to the right lane across the lane line" | Check the illustration still supports the answer. |
| ND032 | 58 | Source photo recreated as an illustration: "A truck crossing an unbroken line on a curve" | Check the illustration still supports the answer. |
| ND033 | 58 | Source photo recreated as an illustration: "90 km/h road — you have just overtaken a vehicle in the left lane" | Check the illustration still supports the answer. |
| ND034 | 58 | Source photo recreated as an illustration: "100 km/h multi-lane road" | Check the illustration still supports the answer. |
| ND044 | 59 | Source photo recreated as an illustration: "The car you are overtaking has its right indicator flashing" | Check the illustration still supports the answer. |
| PD004 | 61 | Marking B is drawn as the zig-zag shape it appears as in the source. The current NSW "crossing ahead" marking is a diamond. | Check against the original PDF diagram. |
| PD006 | 62 | Recreated as a custom illustration (school-crossing). | Check against the original. |
| PD016 | 64 | Source photo recreated as an illustration: "Pedestrians crossing the road away from a marked crossing" | Check the illustration still supports the answer. |
| PD022 | 66 | Recreated as a custom illustration (school-crossing). | Check against the original. |
| PD024 | 66 | Source photo recreated as an illustration: "A person standing on a pedestrian refuge" | Check the illustration still supports the answer. |
| PD025 | 66 | Source photo recreated as an illustration: "A man crossing the road between parked cars" | Check the illustration still supports the answer. |
| PD026 | 67 | Source photo recreated as an illustration: "Children on and near the road" | Check the illustration still supports the answer. |
| PD027 | 67 | Source photo recreated as an illustration: "An older person walking at the edge of the road" | Check the illustration still supports the answer. |
| PD030 | 68 | Source photo recreated as an illustration: "A Light Rail vehicle has just stopped at a tram stop" | Check the illustration still supports the answer. |
| SB003 | 69 | The seat occupants are an original recreation. | Check against the original PDF diagram. |
| SB019 | 71 | Recreated as a custom illustration (baby-restraint). | Check against the original. |
| SL021 | 72 | Source photo recreated as an illustration: "Busy 80 km/h road — it begins to rain lightly" | Check the illustration still supports the answer. |
| SL022 | 72 | Source photo recreated as an illustration: "70 km/h zone — several vehicles pass you" | Check the illustration still supports the answer. |
| SL023 | 72 | Source photo recreated as an illustration: "Busy traffic in a 60 km/h zone" | Check the illustration still supports the answer. |
| SL030 | 73 | The sign text reads "LOCAL TRAFFIC AREA"; the source image is small. | Check against the original PDF diagram. |
| TL013 | 79 | Source photo recreated as an illustration: "Waiting at the lights as they change to green" | Check the illustration still supports the answer. |
| TL016 | 79 | Source photo recreated as an illustration: "Turning left on green — the new road is blocked by car A" | Check the illustration still supports the answer. |
| TL018 | 80 | Source photo recreated as an illustration: "Temporary traffic lights at road works" | Check the illustration still supports the answer. |
| TL019 | 80 | Source photo recreated as an illustration: "Temporary traffic lights with a "Stop here on red signal" sign" | Check the illustration still supports the answer. |
| SI018 | 84 | The clearway times on the sign are illustrative because the source image is too small to read. | Check against the original PDF diagram. |

All other diagrams (intersections, roundabouts, lanes, signs and traffic lights) are straightforward recreations. The `order` values used for "Who Goes First?" (IN010, IN019, IN045, IN046, IN048, IN053, LD011) come directly from each source answer. In IN046 the straight-through car is labelled **B** by the game; the source calls it "the car going straight ahead".

## 5. Content the game adds on top of the source

These parts are game design, not road rules. They should still be reviewed.

- **"Why it matters"** text (`data/categories/categories.json`): one general safety explanation per category. These are written so they don't state any new rules. Some quote ideas already in the source (for example AD033 and SB007).
- **Correct rule panel:** this shows the source question together with its correct answer, word for word.
- **Categories:** the source's own categories are used. Two game-only changes: IN056–IN067 are grouped as **Roundabouts**, and "Traffic Lights / Lanes" is split into **Traffic Lights** (TL) and **Traffic Lanes** (LD). Subcategories and tags are keyword-based helpers.
- **Difficulty (1–3):** set by a simple rule (diagram-heavy multi-vehicle questions are harder), with manual overrides in `tools/specs.py`. These affect XP, skill rating and competition points.
- **Test format** (`data/config/game.json`): 15 General Knowledge (pass 12) and 30 Road Safety and Traffic Signs (pass 29). Set to mirror the commonly published knowledge-test format. **Check against current requirements.** Always labelled "Practice assessment based on the supplied NSW road-rule study material".
- **Driving simulator** (`components/drive/engine.ts`): live infringements link to these source rules: SL007 (speeding), SL032 (school zone), TL002 (red light), PD001 (pedestrians), SI051 (STOP), SI052 (GIVE WAY), CG119 (lane ends/merge), FD001 (3-second gap), SI027 (railway lights), LD013 (indicating). The tolerances are **game mechanics, not legal thresholds**: speeding is flagged at more than 4 km/h over for 1.6 s, and tailgating at under about 1.1 s for 2 s. The on-screen objective always states the source rule ("Keep a 3-second gap").
- **Consequence animations** (near miss, pulled over, camera flash and so on) are stylised, labelled "game only", and never show real fine amounts.
- **Road sign artwork:** original simplified drawings that are recognisable but not the official sign files. The school zone sign times (8–9:30 AM, 2:30–4 PM) follow the source image for SL032.

## 6. How to update content

1. Edit `tools/specs.py` (diagrams, difficulty, exclusions), or edit `data/questions/questions.json` directly.
2. To rebuild everything from the PDF: `python3 tools/parse.py` (needs the PDF path set inside the script), then `python3 tools/build_questions.py data/questions/questions.json`.
3. Nothing in the app code needs to change when questions are added, edited or removed.
