"""Builds data/questions/questions.json from tools/out/raw.json + tools/specs.py.
Usage: python3 tools/build_questions.py"""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from specs import SPECS, DIFFICULTY, EXCLUDE

raw = json.load(open(os.path.join(os.path.dirname(__file__), 'out/raw.json')))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'questions', 'questions.json')

def clean(t):
    t = re.sub(r'\s*RUH\d*\s*$', '', t)
    t = t.replace('’', "'").replace('–', '-').replace('–', '-')
    t = re.sub(r'^\s*\.\s*', '', t)
    t = re.sub(r'\s+\.', '.', t)
    t = re.sub(r'\s+', ' ', t).strip()
    t = re.sub(r'\?-$', '?', t)
    if t and t[0].islower():
        t = t[0].upper() + t[1:]
    return t

def category_of(code, n):
    p = re.match(r'[A-Z]+', code).group(0)
    if p == 'ICAC': return 'test-rules'
    if p == 'CG': return 'general'
    if p in ('AD', 'DR'): return 'alcohol-drugs'
    if p == 'BI': return 'bicycles'
    if p == 'FD': return 'fatigue-defensive'
    if p == 'IN':
        return 'roundabouts' if 56 <= n <= 67 else 'intersections'
    if p == 'TL': return 'traffic-lights'
    if p == 'LD': return 'traffic-lanes'
    if p == 'ND': return 'negligent-driving'
    if p == 'PD': return 'pedestrians'
    if p == 'SB': return 'seatbelts'
    if p == 'SL': return 'speed-limits'
    if p == 'SI': return 'traffic-signs'
    raise ValueError(code)

TAG_RULES = [
    ('parking', r'\bpark|double-park|double park|stand it|standing\b'),
    ('freeway', r'freeway|motorway'),
    ('emergency-vehicles', r'ambulance|siren|fire truck|emergency vehicle'),
    ('railway', r'railway|train|boomgate|level crossing'),
    ('roadworks', r'road ?works?|road work|traffic controller|workers'),
    ('night', r'night|dark|sunset|dawn|headlight|high beam|poor light|dazzle|3 o.clock in the morning'),
    ('wet-weather', r'wet|rain|fog|slippery|dew'),
    ('overtak', r'overtak|pass(ing)? (a|another|the)'),
    ('towing', r'tow'),
    ('crashes', r'accident|crash'),
    ('licensing', r'(?i:licence|provisional|learner|demerit)|\bP1\b|\bP2\b|L or P|\bRTA\b'),
    ('vehicle-condition', r'tyre|defect|registration|fuel|mirror|seat\b|number plate'),
    ('school', r'school|children|child'),
    ('light-rail', r'light rail|tram'),
    ('transit-lanes', r'transit|T2|T3|bus lane'),
    ('buses', r'\bbus'),
    ('bicycles', r'bicycle|cyclist|bike'),
    ('speed', r'speed|km/h'),
    ('give-way', r'give way|right of way|goes first|who can go|must give'),
    ('traffic-lights', r'traffic light|green|red light|yellow|amber'),
    ('lanes', r'\blane'),
    ('indicators', r'indicat|signal'),
    ('merging', r'merg'),
    ('alcohol', r'alcohol|drink|BAC|breath'),
    ('drugs', r'drug|medic|tablet'),
    ('fatigue', r'tired|sleepy|fatigue|rest\b|long trip|long drive|long distance'),
    ('animals', r'animal|kangaroo|horse|cattle|farm'),
    ('phone', r'phone'),
    ('elderly', r'older|elderly|aged'),
    ('pedestrians', r'pedestrian'),
    ('penalties', r'penalt|fine|prison|offence|convicted'),
]

SUBCAT_ORDER = ['emergency-vehicles','railway','roadworks','parking','freeway','transit-lanes','light-rail','school','night','wet-weather','overtaking','towing','crashes','licensing','vehicle-condition','alcohol','drugs','fatigue','give-way','traffic-lights','lanes','speed','pedestrians','bicycles']
SUBCAT_LABEL = {'overtak':'overtaking'}

def consequence_for(cat, tags):
    if 'roadworks' in tags: return 'roadworks'
    if 'parking' in tags: return 'parking-fine'
    if cat == 'pedestrians' or 'pedestrians' in tags or 'school' in tags: return 'emergency-brake'
    if cat in ('intersections', 'roundabouts', 'traffic-lanes', 'negligent-driving', 'bicycles'):
        return 'camera' if 'traffic-lights' in tags and cat == 'intersections' else ('police' if 'penalties' in tags else 'near-miss')
    if cat == 'traffic-lights': return 'camera'
    if cat in ('speed-limits', 'alcohol-drugs', 'test-rules'): return 'police'
    if cat == 'fatigue-defensive': return 'drift' if 'fatigue' in tags else 'tailgate'
    if cat == 'seatbelts': return 'hard-stop'
    if 'emergency-vehicles' in tags: return 'siren'
    if 'penalties' in tags or 'licensing' in tags: return 'police'
    return 'near-miss'

def difficulty_for(code, cat, q, has_img):
    if code in DIFFICULTY: return DIFFICULTY[code]
    if cat in ('traffic-signs', 'test-rules', 'seatbelts'): return 1
    long = len(q) > 110 or q.lower().startswith('you ')
    if has_img and cat in ('intersections', 'roundabouts', 'traffic-lanes', 'negligent-driving'): return 2 if not long else 3
    return 2 if long else 1

LETTER = re.compile(r'^(?:Vehicle|Car|Lane|Mirror|Position)?\s*([A-Z])\b[.]?')

out = []
seen = set()
for r in raw:
    code = r['code']
    if code in seen: continue
    seen.add(code)
    n = int(re.search(r'\d+', code).group(0))
    cat = category_of(code, n)
    q = clean(r['question'])
    opts = [clean(o['text']) for o in r['options']]
    correct = [clean(o['text']) for o in r['options'] if o['bold']][0]
    wrong = [clean(o['text']) for o in r['options'] if not o['bold']]
    text_all = q + ' ' + ' '.join(opts)
    tags = sorted({t for t, rx in TAG_RULES if re.search(rx, text_all, 0 if t=='licensing' else re.I)})
    tags = sorted({'overtaking' if t=='overtak' else t for t in tags})
    if cat == 'traffic-signs': tags = sorted(set(tags) | {'signs'})
    if cat == 'roundabouts': tags = sorted(set(tags) | {'roundabouts'})
    sub = next((SUBCAT_LABEL.get(s, s) for s in SUBCAT_ORDER if s in tags), cat)
    spec = SPECS.get(code)
    has_img = bool(r.get('images'))
    if has_img and not spec:
        print('MISSING SPEC', code)
    visual = dict(spec) if spec else None
    review = None
    if visual and 'review' in visual:
        review = visual.pop('review')
    # challenge type
    ctype = 'multiple-choice'
    if visual and visual.get('kind') == 'sign': ctype = 'sign'
    if visual and visual.get('kind') == 'lights': ctype = 'traffic-light'
    labels = []
    if visual:
        for v in visual.get('vehicles', []) or []:
            if isinstance(v, dict) and v.get('label'): labels.append(v['label'])
        for h in visual.get('hotspots', []) or []: labels.append(h['id'])
        if visual.get('kind') == 'custom' and visual['name'] in ('mirrors', 'road-markings-abc', 'one-way-positions', 'parking-methods'):
            labels += list('ABCMNOR')
    mapped = 0
    for o in opts:
        m = LETTER.match(o)
        if (m and m.group(1) in labels and (len(o) < 14 or o.startswith('Position'))) or o in labels:
            mapped += 1
    if mapped >= 2: ctype = 'hotspot'
    if visual and visual.get('order'): ctype = 'sequence'
    status = 'active'
    if code in EXCLUDE:
        status = 'excluded'; review = EXCLUDE[code]
    item = {
        'id': code.lower(),
        'sourceCode': code,
        'category': cat,
        'sourceCategory': r['category'].replace('TrafficSigns', 'Traffic Signs'),
        'section': r['section'].title().replace(' Section', ''),
        'subcategory': sub,
        'question': q,
        'correctAnswer': correct,
        'incorrectAnswers': wrong,
        'explanation': correct,
        'challengeType': ctype,
        'difficulty': difficulty_for(code, cat, q, has_img),
        'visualType': visual['kind'] if visual else 'none',
        'visual': visual,
        'consequence': consequence_for(cat, tags),
        'tags': tags,
        'sourcePage': r['page'],
        'status': status,
    }
    if review: item['reviewNote'] = review
    out.append(item)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(out), Counter(i['category'] for i in out))
print(Counter(i['challengeType'] for i in out))
print(Counter(i['difficulty'] for i in out))
print([i['sourceCode'] for i in out if i['challengeType'] == 'hotspot'])
