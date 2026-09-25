"""Generates data/achievements/achievements.json (run: python3 scripts/generate-achievements.py).
Edit the lists below to add/remove achievements. Condition types are evaluated in lib/achievements.ts."""
import json, os

A = []
def add(id, name, desc, rarity, icon, ctype, value=None, param=None):
    c = {'type': ctype}
    if value is not None: c['value'] = value
    if param is not None: c['param'] = param
    A.append({'id': id, 'name': name, 'description': desc, 'rarity': rarity, 'icon': icon, 'condition': c})

add('first-drive', 'First Drive', 'Complete your first challenge.', 'common', 'Car', 'firstDrive')
for v, n, r in [(10, 'Warming Up', 'common'), (25, 'Getting Somewhere', 'common'), (50, 'Half Century', 'common'), (100, 'Question Machine', 'rare'),
                (250, 'Study Buddy', 'rare'), (500, 'Rule Book Reader', 'epic'), (1000, 'Thousand Club', 'epic'), (2500, 'Encyclopaedia', 'legendary')]:
    add(f'answered-{v}', n, f'Answer {v} questions.', r, 'MessageSquare', 'answered', v)
for v, n, r in [(25, 'On a Roll', 'common'), (100, 'Century', 'rare'), (250, 'Quarter Grand', 'rare'), (500, 'Five Hundred', 'epic'),
                (1000, 'Road Scholar', 'epic'), (2000, 'Professor of the Pavement', 'legendary')]:
    add('century' if v == 100 else ('road-scholar' if v == 1000 else f'correct-{v}'), n, f'Answer {v} questions correctly.', r, 'CheckCircle2', 'correctTotal', v)
for v, n, r in [(5, 'High Five', 'common'), (10, 'Perfect 10', 'rare'), (15, 'Fifteen Flawless', 'rare'), (20, 'Twenty Straight', 'epic'),
                (30, 'Unstoppable', 'epic'), (50, 'Fifty Flawless', 'legendary')]:
    add('perfect-10' if v == 10 else f'streak-{v}', n, f'Answer {v} correctly in a row.', r, 'Flame', 'streak', v)
for v, r in [(2, 'common'), (5, 'common'), (10, 'rare'), (15, 'rare'), (20, 'epic'), (30, 'epic'), (40, 'legendary'), (50, 'legendary')]:
    add(f'level-{v}', f'Level {v}', f'Reach player level {v}.', r, 'ArrowUpCircle', 'level', v)
for v, n, r in [(1100, 'Silver Service', 'common'), (1250, 'Golden Driver', 'rare'), (1400, 'Platinum Pilot', 'epic'), (1550, 'Diamond Driver', 'epic'), (1700, 'Road Elite', 'legendary')]:
    add('road-elite' if v == 1700 else f'skill-{v}', n, f'Reach a Skill Rating of {v:,}.', r, 'Sparkles', 'skill', v)

levels = [('quiet-suburbs', 'Suburb Starter', 'Home'), ('school-zone', 'School Zone Safe', 'School'), ('shopping-district', 'Shop Smart', 'ShoppingBag'),
          ('busy-intersections', 'Intersection Survivor', 'Split'), ('major-roundabouts', 'Round and Round', 'RotateCw'), ('motorway', 'Motorway Merger', 'Route'),
          ('sydney-cbd', 'City Slicker', 'Building2'), ('night-drive', 'Night Owl', 'Moon'), ('wet-weather', 'Rain Master', 'CloudRain'),
          ('country-highway', 'Country Cruiser', 'Mountain'), ('ultimate-nsw', 'Ultimate Champion', 'Crown')]
for lid, name, icon in levels:
    aid = {'night-drive': 'night-owl', 'wet-weather': 'rain-master'}.get(lid, f'clear-{lid}')
    add(aid, name, f'Complete the {lid.replace("-", " ").title()} location.', 'rare' if lid != 'ultimate-nsw' else 'epic', icon, 'mapLevel', param=lid)
    add(f'stars-{lid}', f'{name} ★★★', f'Earn 3 stars at {lid.replace("-", " ").title()}.', 'epic' if lid != 'ultimate-nsw' else 'legendary', 'Star', 'mapLevelStars', 3, lid)

cats = [('general', 'General Knowledge'), ('alcohol-drugs', 'Alcohol & Drugs'), ('bicycles', 'Bicycle Safety'), ('fatigue-defensive', 'Fatigue & Defensive Driving'),
        ('intersections', 'Intersections'), ('roundabouts', 'Roundabouts'), ('traffic-lights', 'Traffic Lights'), ('traffic-lanes', 'Traffic Lanes'),
        ('negligent-driving', 'Overtaking'), ('pedestrians', 'Pedestrians'), ('seatbelts', 'Seat Belts'), ('speed-limits', 'Speed Limits'), ('traffic-signs', 'Traffic Signs')]
for cid, cname in cats:
    add(f'mastery-{cid}', f'{cname} Pro', f'Reach 80% mastery in {cname}.', 'rare', 'Target', 'categoryMastery', 0.8, cid)
    add(f'perfect-{cid}', f'{cname} Perfection', f'Reach 100% mastery in {cname}.', 'legendary' if cid in ('general', 'traffic-signs') else 'epic', 'Gem', 'categoryMastery', 1.0, cid)
add('sign-master', 'Sign Master', 'Correctly identify 50 road signs.', 'rare', 'Signpost', 'categoryCorrect', 50, 'traffic-signs')
add('give-way-guru', 'Give Way Guru', 'Answer 50 intersection questions correctly.', 'rare', 'Split', 'categoryCorrect', 50, 'intersections')
add('ped-protector', 'Pedestrian Protector', 'Answer 40 pedestrian questions correctly.', 'rare', 'Footprints', 'categoryCorrect', 40, 'pedestrians')

games = [('who-goes-first', 'Right of Way'), ('spot-the-hazard', 'Hawk Eyes'), ('pick-the-lane', 'Lane Legend'), ('sign-snap', 'Snap Happy'),
         ('legal-or-illegal', 'Judge Judy-cious'), ('park-it', 'Parking Pro'), ('roundabout-rush', 'Roundabout Royalty'), ('beat-the-lights', 'Light Reader'),
         ('safe-gap', 'Gap Keeper'), ('roadwork-ready', 'Roadwork Ready'), ('pedestrian-watch', 'Crossing Guardian'), ('cyclist-safe', 'Cyclist\'s Friend'),
         ('night-drive', 'Night Vision'), ('wet-weather', 'Storm Chaser'), ('fatigue-challenge', 'Wide Awake')]
for gid, name in games:
    aid = {'roundabout-rush': 'roundabout-royalty', 'roadwork-ready': 'roadwork-ready'}.get(gid, f'perfect-game-{gid}')
    add(aid, name, f'Complete a perfect {gid.replace("-", " ").title()} mini-game.', 'rare', 'Gamepad2', 'minigamePerfect', param=gid)
for v, r in [(1, 'common'), (10, 'rare'), (50, 'epic')]:
    add(f'minigames-{v}', f'Arcade Regular {v}' if v > 1 else 'Arcade Rookie', f'Play {v} mini-game{"s" if v > 1 else ""}.', r, 'Gamepad2', 'minigamesPlayed', v)
for v, r in [(1, 'common'), (7, 'rare'), (30, 'epic'), (100, 'legendary')]:
    add(f'daily-{v}', 'Daily Driver' if v == 1 else f'{v} Daily Challenges', f'Complete {v} daily challenge{"s" if v > 1 else ""}.', r, 'CalendarCheck', 'dailyCompleted', v)
for v, r in [(3, 'rare'), (7, 'epic'), (14, 'legendary')]:
    add(f'daily-streak-{v}', f'{v}-Day Streak', f'Complete the daily challenge {v} days in a row.', r, 'CalendarDays', 'dailyStreak', v)
add('weekly-warrior', 'Weekly Warrior', 'Complete a weekly challenge.', 'epic', 'Swords', 'weeklyCompleted', 1)
add('weekly-5', 'Seasoned Competitor', 'Complete 5 weekly challenges.', 'legendary', 'Swords', 'weeklyCompleted', 5)
add('test-first', 'Test Taker', 'Complete a practice test.', 'common', 'ClipboardList', 'testsTaken', 1)
add('test-5', 'Test Veteran', 'Complete 5 practice tests.', 'rare', 'ClipboardList', 'testsTaken', 5)
add('test-pass', 'Practice Pass', 'Pass a practice test.', 'rare', 'ClipboardCheck', 'testPassed')
add('final-pass', 'The Ultimate Test', 'Pass the Ultimate NSW Learner Test.', 'epic', 'Award', 'finalPassed')
add('virtual-licence', 'Licensed to Learn', 'Earn your RoadQuest Virtual Learner Licence.', 'legendary', 'IdCard', 'licence')
for v, r in [(1, 'common'), (4, 'rare'), (8, 'epic'), (12, 'legendary')]:
    add(f'garage-{v}', 'Car Collector' if v > 1 else 'Keys in Hand', f'Own {v} car{"s" if v > 1 else ""}.', r, 'Warehouse', 'carsOwned', v)
for v, r in [(1, 'common'), (10, 'rare'), (25, 'epic')]:
    add(f'custom-{v}', 'Pimp My Learner' if v == 1 else f'Customiser {v}', f'Apply {v} customisation{"s" if v > 1 else ""} in the Garage.', r, 'Paintbrush', 'customised', v)
for v, r in [(1, 'common'), (10, 'rare'), (50, 'epic')]:
    add('untouchable' if v == 1 else f'untouchable-{v}', 'Untouchable' if v == 1 else f'Untouchable x{v}', f'Complete {"a challenge" if v == 1 else str(v) + " challenges"} without a single mistake.', r, 'Shield', 'perfectRuns', v)
for v, r in [(1, 'common'), (10, 'rare'), (25, 'epic')]:
    add(f'clean-drive-{v}', 'Clean Driver' if v == 1 else f'Clean Driver x{v}', f'Finish {v} drive{"s" if v > 1 else ""} with zero driving infringements.', r, 'BadgeCheck', 'cleanDrives', v)
for v, r in [(20, 'rare'), (100, 'epic')]:
    add(f'quick-{v}', 'Quick Thinker' if v == 20 else 'Lightning Brain', f'Answer {v} questions correctly in under 3 seconds.', r, 'Zap', 'fastAnswers', v)
for rid, name in [('road-recruit', 'Road Recruit'), ('learner', 'Learner'), ('road-smart', 'Road Smart'), ('hazard-hunter', 'Hazard Hunter'),
                  ('intersection-expert', 'Intersection Expert'), ('road-rules-pro', 'Road Rules Pro'), ('test-ready', 'Test Ready'), ('nsw-road-master', 'NSW Road Master')]:
    add(f'rank-{rid}', f'Rank: {name}', f'Reach the {name} licence rank.', 'legendary' if rid == 'nsw-road-master' else ('epic' if rid in ('road-rules-pro', 'test-ready') else 'rare'), 'Medal', 'rank', param=rid)
add('top-100', 'NSW Top 100', 'Reach the global top 100.', 'epic', 'Globe2', 'globalRank', 100)
add('top-10', 'NSW Top 10', 'Reach the global top 10.', 'legendary', 'Globe2', 'globalRank', 10)
add('number-one', 'Number One in NSW', 'Reach #1 on the global leaderboard.', 'legendary', 'Crown', 'globalRank', 1)
add('suburb-hero', 'Suburb Hero', 'Be #1 in your suburb.', 'epic', 'MapPin', 'suburbRank', 1)
for v, r in [(1000, 'common'), (5000, 'rare'), (20000, 'epic')]:
    add(f'coins-{v}', f'{v:,} Coins', f'Earn {v:,} coins in total.', r, 'Coins', 'coinsEarned', v)
for v, r in [(5000, 'rare'), (25000, 'epic'), (100000, 'legendary')]:
    add(f'xp-{v}', f'{v:,} XP', f'Earn {v:,} XP in total.', r, 'Sparkle', 'xp', v)

ids = [a['id'] for a in A]
assert len(ids) == len(set(ids)), [i for i in ids if ids.count(i) > 1]
out = os.path.join(os.path.dirname(__file__), '..', 'data', 'achievements', 'achievements.json')
json.dump(A, open(out, 'w'), indent=1)
print(len(A), 'achievements')
