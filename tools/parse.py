"""Extracts questions from the NSW DKT PDF.
Usage: pip install pdfplumber && python3 tools/parse.py path/to/driver-knowledge-test-questions-car.pdf
Writes tools/out/raw.json (+ cropped diagram images for reference)."""
import pdfplumber, re, json, os, sys
from collections import Counter

F = sys.argv[1] if len(sys.argv) > 1 else 'driver-knowledge-test-questions-car.pdf'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
os.makedirs(OUT + '/img', exist_ok=True)
pdf = pdfplumber.open(F)

HDR = re.compile(r'^((?:ICAC|[A-Z]{2})\d+[A-Z]?)\s*[–\-]\s*(.*)$')

lines = []  # (page, top, text, bold, x0)
for pno, p in enumerate(pdf.pages, 1):
    words = p.extract_words(extra_attrs=['fontname', 'size'], keep_blank_chars=True, x_tolerance=1.5)
    rows = {}
    for w in words:
        key = round(w['top'] / 3)
        rows.setdefault(key, []).append(w)
    for key in sorted(rows):
        ws = sorted(rows[key], key=lambda w: w['x0'])
        text = ' '.join(w['text'] for w in ws).strip()
        text = re.sub(r'\s+', ' ', text)
        fonts = Counter()
        for w in ws:
            fonts[w['fontname']] += len(w['text'])
        bold = fonts.get('Arial-Black', 0) + fonts.get('Arial-BoldMT', 0) > sum(fonts.values()) * 0.5
        lines.append(dict(page=pno, top=ws[0]['top'], bottom=max(w['bottom'] for w in ws), text=text, bold=bold, x0=ws[0]['x0']))

qs = []
cur = None
state = None
for ln in lines:
    t = ln['text']
    if re.fullmatch(r'\d+', t) or t in ('RUH',):
        continue
    t = re.sub(r'\s*RUH$', '', t).strip()
    if not t:
        continue
    if 'SECTION' in t and t.isupper():
        section = t
        continue
    if 'DRIVER KNOWLEDGE TEST QUESTIONS' in t or 'CLASS C (CAR)' in t:
        continue
    m = HDR.match(t)
    if m and ln['bold']:
        cur = dict(code=m.group(1), category=m.group(2).strip(), question='', options=[], page=ln['page'], top=ln['top'], section=globals().get('section', 'GENERAL KNOWLEDGE SECTION'), end_page=ln['page'], bottom=ln['bottom'])
        qs.append(cur)
        state = 'q'
        continue
    if cur is None:
        continue
    cur['end_page'] = ln['page']; cur['bottom'] = ln['bottom']
    if t[:1] in '-–−':
        cur['options'].append(dict(text=t.lstrip('-–− ').strip(), bold=ln['bold']))
        state = 'o'
    elif state == 'q':
        cur['question'] += (' ' if cur['question'] else '') + t
    else:
        # continuation of option
        cur['options'][-1]['text'] += ' ' + t
        cur['options'][-1]['bold'] = cur['options'][-1]['bold'] or ln['bold']

# images: assign to question whose (page, top) most recently precedes image
imgs = []
for pno, p in enumerate(pdf.pages, 1):
    for i, im in enumerate(p.images):
        imgs.append(dict(page=pno, top=im['top'], bbox=(im['x0'], im['top'], im['x1'], im['bottom']), idx=i))

def owner(im):
    best = None
    for q in qs:
        if (q['page'], q['top']) <= (im['page'], im['top'] + 5):
            best = q
    return best

for im in imgs:
    q = owner(im)
    if q is None:
        continue
    q.setdefault('images', []).append(im)

# crop images
for q in qs:
    for k, im in enumerate(q.get('images', [])):
        p = pdf.pages[im['page'] - 1]
        x0, t, x1, b = im['bbox']
        x0 = max(0, x0); t = max(0, t); x1 = min(p.width, x1); b = min(p.height, b)
        try:
            p.crop((x0, t, x1, b)).to_image(resolution=90).save(f"{OUT}/img/{q['code']}_{k}.png")
        except Exception as e:
            print('crop fail', q['code'], e)

bad = []
for q in qs:
    q['question'] = q['question'].strip()
    nb = sum(o['bold'] for o in q['options'])
    if nb != 1 or len(q['options']) < 2:
        bad.append((q['code'], nb, len(q['options'])))
    for im in q.get('images', []):
        im.pop('bbox', None)

json.dump(qs, open(OUT + '/raw.json', 'w'), indent=1, ensure_ascii=False)
print(len(qs), 'questions;', sum(1 for q in qs if q.get('images')), 'with images')
print('bad', bad)
print(Counter(q['category'] for q in qs))
