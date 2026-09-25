# Visual + interaction specs for every source question that had a diagram/photo.
# Each diagram from the PDF is RECREATED as original game artwork (SVG) by the app.
# kinds: sign | lights | scene (top-down) | pov (driver's-eye illustration) | custom

def V(label=None, frm=None, move=None, color='blue', **kw):
    d = {'color': color}
    if label: d['label'] = label
    if frm: d['from'] = frm
    if move: d['move'] = move
    d.update(kw)
    return d

def sign(s, **kw):
    d = {'kind': 'sign', 'sign': s}; d.update(kw); return d

def lights(cols, **kw):
    d = {'kind': 'lights', 'cols': cols}; d.update(kw); return d

def scene(layout, **kw):
    d = {'kind': 'scene', 'layout': layout}; d.update(kw); return d

def pov(caption, **kw):
    d = {'kind': 'pov', 'caption': caption}; d.update(kw); return d

def custom(name, **kw):
    d = {'kind': 'custom', 'name': name}; d.update(kw); return d

O = 'off'
SPECS = {
 # ---------------- GENERAL KNOWLEDGE ----------------
 'CG010': scene('cross', vehicles=[V(None,'S','left','blue', indicate='left')]),
 'CG013': sign('give-way'),
 'CG014': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], vehicles=[{'lane':0,'t':0.35,'color':'blue','reverse':True}], arrows=[{'d':'M135,120 L135,250','dashed':True}]),
 'CG028': sign('taxi-zone-left', caption='Sign at the kerb: TAXI ZONE with arrow'),
 'CG031': sign('give-way-to-buses', caption='Sign displayed on the rear of the bus'),
 'CG037': sign('bus-lane'),
 'CG045': scene('cross', vehicles=[V(None,'S',None,'yellow', pos=-1.6, crash=True), V(None,'E',None,'blue', pos=-1.2, crash=True)], crash={'x':196,'y':150}),
 'CG046': scene('cross', vehicles=[V(None,'S',None,'yellow', pos=-1.6, crash=True), V(None,'E',None,'blue', pos=-1.2, crash=True)], crash={'x':196,'y':150}),
 'CG070': sign('farm-animals-5km'),
 'CG071': scene('road-v', lanes=[{'dir':'up','mark':'right'},{'dir':'up','mark':'right'},{'dir':'up','mark':'straight'},{'dir':'down'}], lines=['broken','broken','double'], vehicles=[{'lane':1,'t':0.55,'color':'silver','highlight':True,'indicate':'right'},{'lane':0,'t':0.3,'color':'white'},{'lane':2,'t':0.2,'color':'red'}], caption='Two lanes marked right turn only'),
 'CG078': custom('hill-park'),
 'CG080': sign('motorway'),
 'CG082': scene('road-v', lanes=[{'dir':'park'},{'dir':'up'},{'dir':'down'},{'dir':'park'}], lines=['none','double','none'], vehicles=[{'lane':0,'t':0.55,'color':'yellow','rot':0}], measures=[{'x1':152,'y1':170,'x2':196,'y2':170,'label':'3 m?'}], caption='Double dividing lines — where may you park?'),
 'CG083': custom('parking-methods'),
 'CG084': scene('road-v', lanes=[{'dir':'angle-park'},{'dir':'up'},{'dir':'down'}], lines=['none','broken'], vehicles=[], caption='Angle parking bays marked on the road'),
 'CG086': pov('A narrow bridge with only just enough room for two vehicles', road='bridge', objects=[{'type':'car','lane':0.6,'d':0.75,'color':'white','oncoming':True}]),
 'CG087': custom('mirrors'),
 'CG088': pov('An intersection where a building sits right on the corner of the side street', road='two-way', objects=[{'type':'building-corner','side':'right','d':0.35}], junction='right'),
 'CG090': pov('Multi-lane road: you hear an ambulance siren from behind', road='multi', lanesOurs=2, objects=[{'type':'car','lane':-0.5,'d':0.5,'color':'red'},{'type':'car','lane':-1.5,'d':0.62,'color':'silver'},{'type':'mirror','vehicle':'ambulance'}], env='day'),
 'CG091': pov('Suburban street with parked cars: an ambulance appears in your mirror', road='two-way', objects=[{'type':'parked-car','side':'left','d':0.25,'color':'red'},{'type':'parked-car','side':'left','d':0.45,'color':'white'},{'type':'car','lane':-0.5,'d':0.7,'color':'silver'},{'type':'mirror','vehicle':'ambulance'}]),
 'CG092': scene('cross', lanesPerArm=2, controls={'S':'lights-green','N':'lights-green','E':'lights-red','W':'lights-red'}, vehicles=[V('A','S','right','blue', lane=1, indicate='right'), V(None,'S',None,'fire', lane=1, pos=2.2), V(None,'S',None,'yellow', lane=0, pos=0.3), V(None,'S',None,'red', lane=0, pos=1.6)], arrows=[{'d':'M225,275 C230,200 240,160 300,137','dashed':True,'color':'#f97316'}]),
 'CG093': sign('workers'),
 'CG095': scene('cross', lanesPerArm=2, controls={'S':'lights-green','E':'lights-red'}, vehicles=[V('A','S','straight','blue', lane=1), V(None,'E','straight','ambulance', lane=1, pos=0.6)]),
 'CG099': custom('bus-40'),
 'CG100': pov('Driving at night with no other traffic around', road='two-way', env='night', headlights='high'),
 'CG102': pov('Parking at night for a short time', road='two-way', env='night', objects=[{'type':'parked-car','side':'left','d':0.12,'color':'red','lights':'parking'}]),
 'CG103': pov('A corner with loose gravel on the road', road='curve-left', objects=[{'type':'gravel','lane':-0.3,'d':0.45}], country=True),
 'CG105': pov('A two-lane freeway', road='freeway', lanesOurs=2, objects=[{'type':'car','lane':-1.5,'d':0.7,'color':'white'},{'type':'overpass','d':0.8}]),
 'CG112': scene('road-h', lanes=[{'dir':'left'},{'dir':'right'},{'dir':'park'}], lines=['broken','none'], vehicles=[{'lane':2,'t':0.1,'color':'lightblue'},{'lane':2,'t':0.3,'color':'orange'},{'lane':2,'t':0.52,'color':'yellow'},{'lane':2,'t':0.72,'color':'green'},{'lane':1,'t':0.32,'color':'blue','highlight':True}], caption='The blue car is standing alongside a parked car'),
 'CG113': custom('bus-rail-20m'),
 'CG119': sign('lane-ends-left'),
 # ---------------- FATIGUE / DEFENSIVE ----------------
 'FD028': custom('shoulder-check'),
 'FD033': pov('Night driving on a suburban street', road='two-way', env='night', objects=[{'type':'car','lane':0.5,'d':0.7,'color':'white','oncoming':True,'lights':'head'}]),
 'FD037': pov('Following another vehicle — how big should the gap be?', road='multi', lanesOurs=2, objects=[{'type':'car','lane':-0.5,'d':0.45,'color':'silver'},{'type':'gap','lane':-0.5,'d0':0.02,'d1':0.42}]),
 # ---------------- INTERSECTIONS ----------------
 'IN003': scene('cross', vehicles=[V(None,'S','right','blue', indicate='right')]),
 'IN004': scene('t', vehicles=[V(None,'S','right','yellow', indicate='right'), V(None,'W','straight','blue', pos=2.4, arrow=False), V(None,'E','straight','red', pos=1.2, arrow=False)]),
 'IN006': scene('cross', vehicles=[V(None,'S','left','yellow'), V(None,'S','right','yellow', ghost=True)], pedestrians=[{'x':150,'y':112,'kind':'adult'},{'x':252,'y':112,'kind':'adult'}], zebraArms=['W','E']),
 'IN007': scene('cross', controls={'S':'lights-green'}, vehicles=[V(None,'S','straight','yellow'), V(None,'N',None,'blue', lane=0, pos=0.2, rot=0, side='out'), V(None,'N',None,'red', lane=0, pos=1.5, rot=0, side='out')], caption='The road beyond the intersection is choked with traffic'),
 'IN010': scene('cross', controls={'S':'giveway','N':'giveway'}, vehicles=[V('O','S','right','yellow'), V('P','N','left','red')], order=['P','O']),
 'IN011': scene('cross', controls={'S':'stop'}, vehicles=[V('O','S','straight','yellow'), V('P','W','right','pink'), V('Q','N','straight','red'), V('R','E','straight','blue')]),
 'IN012': scene('cross', lanesPerArm=2, vehicles=[V('O','S',None,'yellow', lane=0), V('P','S',None,'pink', lane=1)], laneMarks={'S':['left-straight','right']}, labels=[{'text':'X','x':178,'y':18}], review='Source question wording is confusing (turning right vs turning left into X).'),
 'IN013': scene('cross', controls={'S':'stop'}, zebraArms=['S'], vehicles=[V(None,'S',None,'yellow', pos=1.1)], pedestrians=[]),
 'IN014': scene('cross', controls={'S':'giveway','N':'giveway'}, vehicles=[V(None,'S',None,'yellow')]),
 'IN016': scene('cross', controls={'S':'giveway'}, vehicles=[V('J','S','straight','yellow'), V('K','E','right','red'), V('L','N','left','blue')]),
 'IN019': scene('t-west', vehicles=[V('R','W','right','yellow'), V('Q','N','right','blue')], order=['Q','R']),
 'IN026': sign('railway-stop'),
 'IN027': scene('cross', controls={'S':'stop'}, vehicles=[V(None,'S',None,'yellow')]),
 'IN029': sign('railway-giveway'),
 'IN030': sign('railway-lights'),
 'IN034': pov('A Light Rail vehicle about to enter the intersection', road='multi', lanesOurs=2, objects=[{'type':'tram','lane':1.2,'d':0.55},{'type':'light','side':'right','d':0.5,'state':'green'}], city=True),
 'IN035': pov('Busy traffic: the road on the far side of the intersection is full', road='multi', lanesOurs=2, city=True, objects=[{'type':'light','side':'left','d':0.45,'state':'green'},{'type':'queue','lane':-0.5,'d':0.62},{'type':'queue','lane':-1.5,'d':0.62}], junction='cross', highlight={'lane':-0.5,'d':0.72}),
 'IN037': pov('A busy intersection with slow moving traffic', road='multi', lanesOurs=2, city=True, objects=[{'type':'light','side':'left','d':0.45,'state':'green'},{'type':'queue','lane':-0.5,'d':0.62},{'type':'queue','lane':-1.5,'d':0.62},{'type':'car','lane':-0.5,'d':0.2,'color':'silver'}], junction='cross'),
 'IN038': pov('Traffic on the other side of the intersection has stopped', road='multi', lanesOurs=2, city=True, objects=[{'type':'light','side':'left','d':0.45,'state':'green'},{'type':'queue','lane':-0.5,'d':0.62},{'type':'queue','lane':-1.5,'d':0.62},{'type':'car','lane':-0.5,'d':0.16,'color':'navy','highlight':True}], junction='cross'),
 'IN040': pov('The lights turn yellow as you drive into the intersection', road='multi', lanesOurs=2, city=True, objects=[{'type':'light','side':'left','d':0.2,'state':'yellow'},{'type':'car','lane':-1.5,'d':0.55,'color':'yellow'}], junction='cross'),
 'IN042': custom('ped-signals'),
 'IN043': pov('Turning left: pedestrian lights are flashing red', road='multi', lanesOurs=2, city=True, junction='left', objects=[{'type':'zebra','d':0.45,'side':'left'},{'type':'ped','lane':-2.6,'d':0.45}], caption2='Pedestrian signal: flashing red'),
 'IN044': sign('stop'),
 'IN045': scene('cross', controls={'S':'stop','N':'stop'}, vehicles=[V('A','S','right','blue', indicate='right'), V('B','N','left','yellow', indicate='left')], order=['B','A']),
 'IN046': scene('cross', vehicles=[V('A','S','right','blue', indicate='right'), V('B','N','straight','yellow')], order=['B','A']),
 'IN048': scene('cross', vehicles=[V('A','S','left','blue', indicate='left'), V('B','E','straight','orange', pos=1.2)], order=['B','A']),
 'IN049': scene('cross', vehicles=[V('A','S','right','blue', indicate='right'), V('B','N','right','orange', indicate='right')]),
 'IN053': scene('t', vehicles=[V('B','S','left','blue', indicate='left'), V('A','E','straight','orange', pos=1.4)], order=['A','B']),
 'IN056': scene('roundabout', vehicles=[V(None,'S','left','white', lane=0, pos=1.5)], laneMarks={'S':['left-straight','straight-right']}, hotspots=[{'id':'Left lane','lane':0,'arm':'S'},{'id':'Right lane','lane':1,'arm':'S'}]),
 'IN057': scene('roundabout', vehicles=[V(None,'S','straight','silver', lane=1)], points=[{'label':'M','arm':'S','at':'entry'},{'label':'N','angle':200},{'label':'O','angle':250}]),
 'IN058': scene('roundabout', vehicles=[V(None,'S','left','white', lane=0, indicate='left')]),
 'IN059': scene('roundabout', vehicles=[V(None,'S','straight','white', lane=0), V(None,'S','straight','silver', lane=1, pos=1.6), V(None,'W',None,'red', lane=1, pos=0.2, arrow=False)]),
 'IN060': scene('roundabout', vehicles=[], laneMarks={'S':['left-straight','straight-right']}, hotspots=[{'id':'A','lane':0,'arm':'S'},{'id':'B','lane':1,'arm':'S'}]),
 'IN061': scene('roundabout', vehicles=[V(None,'S','straight','white', lane=0), V(None,'S','straight','silver', lane=1, pos=1.2)]),
 'IN062': scene('roundabout', vehicles=[V(None,'S','left','white', lane=0, indicate='left')], laneMarks={'S':['left-straight','straight-right']}),
 'IN063': scene('roundabout', vehicles=[V(None,'S','straight','white', lane=0, ghost=True), V(None,'S','straight','white', lane=1, ghost=True)], laneMarks={'S':['left-straight','straight-right']}),
 'IN064': scene('roundabout', vehicles=[V(None,'S','straight','moto', lane=1), V(None,'E','left','silver', lane=0, onRing=True, highlight=True)]),
 'IN065': scene('roundabout', vehicles=[V(None,'S','uturn','silver', lane=1, indicate='right')]),
 'IN066': scene('roundabout', vehicles=[V(None,'S',None,'white', lane=0, highlight=True), V(None,'S',None,'silver', lane=1, pos=1.5)]),
 'IN067': scene('roundabout', vehicles=[V(None,'S',None,'red', lane=0, pos=0.8)], exitArrow='E'),
 # ---------------- LANES ----------------
 'LD002': scene('road-h', lanes=[{'dir':'right'},{'dir':'left'}], lines=['double'], vehicles=[{'lane':0,'t':0.12,'color':'purple'},{'lane':0,'t':0.78,'color':'red'}], driveways=[{'t':0.32,'side':'bottom','label':'O'},{'t':0.56,'side':'bottom','label':'P','street':True}], moves=['O','P','Q']),
 'LD003': scene('road-h', lanes=[{'dir':'right'},{'dir':'left'}], lines=['broken'], vehicles=[{'lane':0,'t':0.12,'color':'purple'},{'lane':0,'t':0.78,'color':'red'}], driveways=[{'t':0.32,'side':'bottom','label':'O'},{'t':0.56,'side':'bottom','label':'P','street':True}], moves=['O','P','Q']),
 'LD004': scene('road-h', lanes=[{'dir':'right'},{'dir':'left'}], lines=['double-solid-first'], vehicles=[{'lane':0,'t':0.12,'color':'purple'},{'lane':0,'t':0.78,'color':'red'}], driveways=[{'t':0.32,'side':'bottom','label':'O'},{'t':0.56,'side':'bottom','label':'P','street':True}], moves=['O','P','Q']),
 'LD007': scene('road-h', lanes=[{'dir':'left'},{'dir':'right'}], lines=['double'], vehicles=[{'lane':0,'t':0.2,'color':'moto'},{'lane':1,'t':0.72,'color':'blue'}]),
 'LD009': scene('road-v', lanes=[{'dir':'up'},{'dir':'up'},{'dir':'up'}], lines=['broken','broken'], vehicles=[{'lane':0,'t':0.3,'color':'red'},{'lane':0,'t':0.7,'color':'blue'},{'lane':1,'t':0.15,'color':'pink'},{'lane':2,'t':0.5,'color':'yellow'}]),
 'LD010': scene('merge', vehicles=[{'lane':0,'t':0.25,'color':'truck'},{'lane':1,'t':0.35,'color':'red'}]),
 'LD011': scene('merge', vehicles=[{'lane':0,'t':0.45,'color':'green','label':'A'},{'lane':1,'t':0.5,'color':'red','label':'B'}], order=['A','B']),
 'LD015': scene('road-v', lanes=[{'dir':'up'},{'dir':'up'}], lines=['solid'], vehicles=[{'lane':0,'t':0.25,'color':'green'},{'lane':1,'t':0.3,'color':'orange','label':'B'},{'lane':1,'t':0.72,'color':'blue','label':'A'}]),
 'LD017': pov('Country road marked with double unbroken dividing lines', road='curve-right', centre='double', country=True, objects=[{'type':'car','lane':0.5,'d':0.72,'color':'silver','oncoming':True}]),
 'LD018': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken-then-double'], vehicles=[{'lane':0,'t':0.45,'color':'orange'},{'lane':0,'t':0.72,'color':'blue','indicate':'right'}], arrows=[{'d':'M186,215 C215,190 215,140 215,100','dashed':True}]),
 'LD022': scene('t-west', edgeLine=True, vehicles=[V(None,'S','left','yellow', indicate='left')]),
 'LD025': pov('Changing lanes in busy traffic', road='multi', lanesOurs=3, city=True, objects=[{'type':'car','lane':-0.5,'d':0.35,'color':'red'},{'type':'car','lane':-1.5,'d':0.5,'color':'silver'},{'type':'car','lane':-2.5,'d':0.6,'color':'white'}]),
 'LD026': sign('transit-t2'),
 'LD027': sign('transit-t3'),
 'LD028': sign('transit-t2'),
 'LD029': scene('road-v', lanes=[{'dir':'up'},{'dir':'median'},{'dir':'down'}], lines=['solid','solid'], vehicles=[{'lane':0,'t':0.78,'color':'blue','label':'Y','indicate':'right'},{'lane':1,'t':0.2,'color':'yellow','label':'O','rot':180,'indicate':'right'},{'lane':0,'t':0.4,'color':'white'},{'lane':2,'t':0.55,'color':'white'}]),
 'LD032': sign('bus-lane'),
 'LD038': custom('one-way-positions'),
 # ---------------- NEGLIGENT / OVERTAKING ----------------
 'ND007': scene('cross', vehicles=[V(None,'S','right','blue', pos=0.1, indicate='right'), V(None,'S',None,'yellow', pos=1.6)]),
 'ND015': scene('cross', lanesPerArm=2, vehicles=[V(None,'S','left','truck', lane=1, indicate='left'), V(None,'S',None,'yellow', lane=0, pos=1.6)], caption='Long vehicle displaying DO NOT OVERTAKE TURNING VEHICLE'),
 'ND019': scene('road-h', lanes=[{'dir':'right'},{'dir':'left'}], lines=['broken'], vehicles=[{'lane':1,'t':0.25,'color':'blue','rot':270},{'lane':1,'t':0.6,'color':'bike','rot':270}]),
 'ND020': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], vehicles=[{'lane':0,'t':0.7,'color':'blue'},{'lane':1,'t':0.35,'color':'red','rot':0,'indicate':'left'}]),
 'ND031': pov('You move from the left lane to the right lane across the lane line', road='multi', lanesOurs=2, laneLine='solid', city=True, objects=[{'type':'swerve'}]),
 'ND032': pov('A truck crossing an unbroken line on a curve', road='curve-left', centre='solid', objects=[{'type':'truck','lane':-0.1,'d':0.55,'oncoming':True}], country=True),
 'ND033': pov('90 km/h road — you have just overtaken a vehicle in the left lane', road='multi', lanesOurs=2, objects=[{'type':'car','lane':-1.5,'d':0.1,'color':'red'}], country=True),
 'ND034': pov('100 km/h multi-lane road', road='multi', lanesOurs=2, country=True, objects=[{'type':'car','lane':-1.5,'d':0.7,'color':'white'}]),
 'ND044': pov('The car you are overtaking has its right indicator flashing', road='two-way', objects=[{'type':'car','lane':-0.35,'d':0.3,'color':'red','indicate':'right'}]),
 # ---------------- PEDESTRIANS ----------------
 'PD002': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], zebra=[{'t':0.2}], vehicles=[{'lane':0,'t':0.65,'color':'blue'}]),
 'PD004': custom('road-markings-abc'),
 'PD005': scene('road-v', lanes=[{'dir':'up'},{'dir':'up'}], lines=['broken'], zebra=[{'t':0.2}], vehicles=[{'lane':1,'t':0.4,'color':'blue'},{'lane':0,'t':0.72,'color':'yellow'}]),
 'PD006': custom('school-crossing'),
 'PD015': lights([['red','off','off']], caption='Pedestrian crossing traffic lights'),
 'PD016': pov('Pedestrians crossing the road away from a marked crossing', road='multi', lanesOurs=2, city=True, objects=[{'type':'ped','lane':-0.8,'d':0.35},{'type':'ped','lane':0.3,'d':0.45},{'type':'ped','lane':-1.9,'d':0.5}]),
 'PD017': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], zebra=[{'t':0.25}], pedestrians=[{'lane':0.5,'t':0.25},{'lane':1.1,'t':0.25,'kind':'child'}], signs=[{'id':'ped-crossing-post','side':'left','t':0.4}], vehicles=[{'lane':0,'t':0.8,'color':'blue'}]),
 'PD018': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], zigzag=True, zebra=[{'t':0.08}], vehicles=[]),
 'PD019': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], zebra=[{'t':0.3}], zigzag=True, signs=[{'id':'ped-crossing-post','side':'left','t':0.45}], vehicles=[]),
 'PD021': scene('road-v', lanes=[{'dir':'up'},{'dir':'down'}], lines=['broken'], zebra=[{'t':0.3}], pedestrians=[{'lane':0.4,'t':0.3}], vehicles=[{'lane':0,'t':0.82,'color':'blue'}]),
 'PD022': custom('school-crossing', supervisor=True),
 'PD024': pov('A person standing on a pedestrian refuge', road='two-way', objects=[{'type':'refuge','d':0.35},{'type':'ped','lane':0.02,'d':0.35}]),
 'PD025': pov('A man crossing the road between parked cars', road='two-way', objects=[{'type':'parked-car','side':'left','d':0.3,'color':'white'},{'type':'ped','lane':-0.4,'d':0.36}]),
 'PD026': pov('Children on and near the road', road='two-way', objects=[{'type':'parked-car','side':'left','d':0.28,'color':'red'},{'type':'child','lane':-0.9,'d':0.32},{'type':'child','lane':-1.3,'d':0.4}]),
 'PD027': pov('An older person walking at the edge of the road', road='two-way', country=True, objects=[{'type':'elderly','lane':-1.05,'d':0.3}]),
 'PD030': pov('A Light Rail vehicle has just stopped at a tram stop', road='multi', lanesOurs=2, city=True, objects=[{'type':'tram','lane':0.9,'d':0.4},{'type':'ped','lane':0.1,'d':0.42},{'type':'ped','lane':-0.3,'d':0.44}]),
 # ---------------- SEAT BELTS ----------------
 'SB003': custom('seatbelts'),
 'SB019': custom('baby-restraint'),
 # ---------------- SPEED ----------------
 'SL021': pov('Busy 80 km/h road — it begins to rain lightly', road='multi', lanesOurs=2, env='wet', objects=[{'type':'car','lane':-0.5,'d':0.5,'color':'silver'}]),
 'SL022': pov('70 km/h zone — several vehicles pass you', road='multi', lanesOurs=2, objects=[{'type':'car','lane':-1.5,'d':0.2,'color':'white'},{'type':'car','lane':-1.5,'d':0.5,'color':'silver'}]),
 'SL023': pov('Busy traffic in a 60 km/h zone', road='multi', lanesOurs=2, city=True, env='wet', objects=[{'type':'car','lane':-0.5,'d':0.35,'color':'red'},{'type':'car','lane':-1.5,'d':0.5,'color':'white'},{'type':'car','lane':-0.5,'d':0.65,'color':'silver'}]),
 'SL030': sign('local-traffic-40'),
 'SL031': sign('shared-zone-10'),
 'SL032': sign('school-zone-40'),
 'SL034': sign('speed-50'),
 # ---------------- TRAFFIC LIGHTS ----------------
 'TL001': lights([['red','off','off'],['off','off','green-right']]),
 'TL002': lights([['red','off','off']]),
 'TL003': lights([['off','yellow','off']]),
 'TL004': lights([['red','off','off']], sign='left-on-red'),
 'TL006': lights([['off','off','green-left'],['red','off','off']]),
 'TL007': lights([['off','off','green']]),
 'TL008': lights([['off','off','green'],['red-right','off','off']]),
 'TL010': lights([['red','off','off']]),
 'TL011': sign('left-on-red'),
 'TL013': pov('Waiting at the lights as they change to green', road='multi', lanesOurs=2, city=True, junction='cross', objects=[{'type':'light','side':'left','d':0.35,'state':'green'},{'type':'truck','lane':-1.5,'d':0.12}]),
 'TL014': lights([['off','off','green'],['red-right','off','off']]),
 'TL015': lights([['red','off','off']], sign='left-on-red'),
 'TL016': pov('Turning left on green — the new road is blocked by car A', road='multi', lanesOurs=2, city=True, junction='left', objects=[{'type':'light','side':'left','d':0.2,'state':'green'},{'type':'car','lane':-3.2,'d':0.5,'color':'white','label':'A'},{'type':'ped','lane':-2.6,'d':0.35}]),
 'TL017': lights([['off','off','green']], caption='Approaching lights that change from green to yellow'),
 'TL018': pov('Temporary traffic lights at road works', road='two-way', country=True, objects=[{'type':'roadworks-lights','d':0.3},{'type':'cones','d':0.25}]),
 'TL019': pov('Temporary traffic lights with a "Stop here on red signal" sign', road='two-way', country=True, objects=[{'type':'roadworks-lights','d':0.3},{'type':'cones','d':0.25}]),
}

# Traffic signs section — each gets its own sign art
SIGN_MAP = {
 'SI001':'no-entry','SI002':'keep-left','SI003':'right-lane-must-turn-right','SI004':'two-way','SI006':'no-right-turn',
 'SI007':'no-left-turn','SI008':'left-only','SI009':'one-way-left','SI013':'speed-60','SI014':'speed-100',
 'SI016':'kangaroo-30km','SI017':'t-junction','SI018':'clearway','SI019':'narrow-bridge','SI020':'slippery',
 'SI021':'winding-road','SI022':'dip','SI024':'hook-bend-right','SI025':'children-crossing','SI026':'crossroads',
 'SI027':'railway-lights','SI028':'give-way-ahead','SI030':'trucks-entering','SI031':'pedestrians','SI032':'ped-crossing-ahead',
 'SI033':'divided-road-ends','SI035':'workers','SI036':'bicycles','SI038':'signals-out-stop','SI039':'stop-ahead',
 'SI040':'traffic-controller','SI041':'steep-descent','SI042':'divided-road-ahead','SI043':'railway-lights-ahead',
 'SI045':'road-narrows','SI046':'no-stopping','SI048':'transit-t3','SI049':'railway-ahead','SI050':'side-road-left',
 'SI051':'stop','SI052':'give-way','SI053':'railway-stop','SI056':'curve-35','SI057':'railway-lights','SI058':'keep-left-unless-overtaking',
 'SI059':'railway-giveway','SI060':'roundabout-giveway','SI061':'crest','SI062':'hump','SI063':'cattle','SI064':'disabled-parking',
}
for k, v in SIGN_MAP.items():
    SPECS[k] = sign(v)

# Question-level overrides
DIFFICULTY = {
 # hard (3): multi-vehicle give-way, roundabout lanes, lane rules, tricky
 **{c: 3 for c in ['IN010','IN011','IN016','IN019','IN045','IN046','IN048','IN049','IN053','IN057','IN059','IN064','IN065','IN066','IN067',
                   'LD002','LD003','LD004','LD011','LD015','LD027','LD028','LD029','ND015','ND035','CG083','CG113','CG082','CG092','CG095','TL008','TL014','SI038','PD015','LD038','IN012','CG037','ND004','SL028','CG039']},
}

EXCLUDE = {
 'LD033': 'The sign image for this question is missing from the supplied PDF, so it cannot be shown. Excluded from play until the sign artwork is confirmed.',
}
