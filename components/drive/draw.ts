// Canvas drawing for the driving game. Everything is procedural (no image files).
import { LW, WORLD_W, laneX, type GameEvent, type Player, type World } from './engine';

export interface Theme {
  scenery: string;
  env: 'day' | 'night' | 'wet';
  grass: string;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, opts: { rot?: number; brake?: boolean; indicator?: 'left' | 'right' | null; blink?: boolean; scale?: number; police?: boolean } = {}) {
  const s = opts.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  if (opts.rot) ctx.rotate(opts.rot);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  roundRect(ctx, -14, -24, 30, 52, 9);
  ctx.fill();
  ctx.fillStyle = color;
  roundRect(ctx, -15, -27, 30, 54, 9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // windscreen / roof / rear window
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.quadraticCurveTo(0, -17, 11, -12);
  ctx.lineTo(9, -4);
  ctx.lineTo(-9, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  roundRect(ctx, -9, -4, 18, 16, 3);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  roundRect(ctx, -9, 14, 18, 6, 2);
  ctx.fill();
  // lights
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(-12, -27, 6, 3);
  ctx.fillRect(6, -27, 6, 3);
  ctx.fillStyle = opts.brake ? '#ff3030' : '#991b1b';
  ctx.fillRect(-12, 24, 6, 3);
  ctx.fillRect(6, 24, 6, 3);
  if (opts.police) {
    ctx.fillStyle = opts.blink ? '#ef4444' : '#3b82f6';
    ctx.fillRect(-9, 0, 8, 4);
    ctx.fillStyle = opts.blink ? '#3b82f6' : '#ef4444';
    ctx.fillRect(1, 0, 8, 4);
  }
  if (opts.indicator && opts.blink) {
    ctx.fillStyle = '#fb923c';
    const ix = opts.indicator === 'left' ? -16 : 12;
    ctx.fillRect(ix, -27, 4, 5);
    ctx.fillRect(ix, 22, 4, 5);
    ctx.beginPath();
    ctx.arc(ix + 2, -25, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251,146,60,.35)';
    ctx.fill();
  }
  if (opts.brake) {
    ctx.fillStyle = 'rgba(255,48,48,.25)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function signSpeed(ctx: CanvasRenderingContext2D, x: number, y: number, n: number, school = false) {
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x - 1.5, y, 3, 26);
  if (school) {
    ctx.fillStyle = '#ffd200';
    ctx.fillRect(x - 17, y - 50, 34, 14);
    ctx.fillStyle = '#111';
    ctx.font = 'bold 7px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCHOOL', x, y - 40);
  }
  ctx.fillStyle = '#fff';
  roundRect(ctx, x - 16, y - 36, 32, 38, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 17, 12, 0, Math.PI * 2);
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#d71920';
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.font = `bold ${n >= 100 ? 10 : 12}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y - 16);
  ctx.textBaseline = 'alphabetic';
}

function signOct(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x - 1.5, y, 3, 24);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) * (2 * i + 1);
    ctx.lineTo(x + 15 * Math.cos(a), y - 14 + 15 * Math.sin(a));
  }
  ctx.closePath();
  ctx.fillStyle = '#d71920';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y - 11);
}

function signGiveWay(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x - 1.5, y, 3, 24);
  ctx.beginPath();
  ctx.moveTo(x - 17, y - 30);
  ctx.lineTo(x + 17, y - 30);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#d71920';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 26);
  ctx.lineTo(x + 10, y - 26);
  ctx.lineTo(x, y - 8);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, color = '#0ea5e9', r = 7) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7c4a2d';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, night: boolean) {
  ctx.fillStyle = 'rgba(0,0,0,.2)';
  ctx.beginPath();
  ctx.arc(x + 4, y + 5, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night ? '#173524' : '#3f7d3a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = night ? '#1f4430' : '#5a9e4b';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.3, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function house(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, roof: string, night: boolean) {
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = roof;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.fillRect(x, y + h / 2, w, h / 2);
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  if (night) {
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(x + w * 0.3, y + h * 0.35, 5, 4);
  }
}

/** Draws the whole frame. `scale` maps logical px → canvas px. */
export function drawFrame(ctx: CanvasRenderingContext2D, w: World, p: Player, theme: Theme, viewH: number, time: number, playerColor: string, braking: boolean) {
  const night = theme.env === 'night';
  const wet = theme.env === 'wet';
  const py = viewH * 0.74;
  const Y = (d: number) => py - (d - p.d);
  const roadW = (w.lanes + w.oncoming) * LW;
  const roadL = w.roadLeft;
  const roadR = roadL + roadW;
  const blink = Math.floor(time * 2.4) % 2 === 0;

  // ground
  ctx.fillStyle = night ? '#0f2419' : theme.grass;
  ctx.fillRect(0, 0, WORLD_W, viewH);
  if (theme.scenery === 'coast') {
    ctx.fillStyle = night ? '#1e293b' : '#fde68a';
    ctx.fillRect(roadR + 26, 0, 30, viewH);
    ctx.fillStyle = night ? '#0c1a33' : '#0ea5e9';
    ctx.fillRect(roadR + 56, 0, WORLD_W, viewH);
  }
  // footpaths / kerbs
  const pathW = theme.scenery === 'motorway' || theme.scenery === 'country' ? 10 : 22;
  ctx.fillStyle = theme.scenery === 'country' ? '#a8a29e' : night ? '#57534e' : '#d6d3d1';
  ctx.fillRect(roadL - pathW, 0, pathW, viewH);
  ctx.fillRect(roadR, 0, pathW, viewH);

  // scenery slots
  const slot = 110;
  const first = Math.floor((p.d - viewH) / slot) - 1;
  const last = Math.floor((p.d + viewH * 0.4) / slot) + 1;
  for (let i = first; i <= last; i++) {
    const r = rng(i * 7919 + 13);
    const y = Y(i * slot);
    for (const side of [0, 1]) {
      const edge = side === 0 ? roadL - pathW : roadR + pathW;
      const dir = side === 0 ? -1 : 1;
      const room = side === 0 ? roadL - pathW : WORLD_W - edge;
      if (room < 16) continue;
      if (theme.scenery === 'coast' && side === 1) continue;
      const roll = r();
      if (theme.scenery === 'city' || theme.scenery === 'shops') {
        const h = 60 + r() * 50;
        const wdt = Math.min(room - 4, 50 + r() * 40);
        const x = side === 0 ? edge - wdt - 2 : edge + 2;
        ctx.fillStyle = ['#64748b', '#94a3b8', '#475569', '#7c8aa5'][Math.floor(r() * 4)];
        ctx.fillRect(x, y - h, wdt, h - 8);
        ctx.fillStyle = night ? '#fde68a' : 'rgba(224,242,254,.6)';
        for (let k = 0; k < 3; k++) ctx.fillRect(x + 6 + k * (wdt / 3), y - h + 10, wdt / 5, 8);
        if (theme.scenery === 'shops') {
          ctx.fillStyle = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i & 3];
          ctx.fillRect(side === 0 ? edge - 12 : edge, y - h + 20, 12, h - 40);
        }
      } else if (theme.scenery === 'motorway') {
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(side === 0 ? edge - 4 : edge, y - slot, 4, slot);
        if (roll > 0.5) tree(ctx, edge + dir * (22 + r() * 30), y - 40, 12 + r() * 8, night);
      } else if (theme.scenery === 'country') {
        ctx.fillStyle = '#78716c';
        ctx.fillRect(edge + dir * 14, y - 30, 3, 10);
        if (roll > 0.6) tree(ctx, edge + dir * (30 + r() * (room - 40)), y - 50, 14 + r() * 10, night);
        else if (roll > 0.45) {
          // cow
          const cx = edge + dir * (40 + r() * 40);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(cx - 9, y - 60, 18, 10);
          ctx.fillStyle = '#111';
          ctx.fillRect(cx - 4, y - 58, 5, 5);
          ctx.fillRect(cx + 8, y - 59, 5, 7);
        }
      } else {
        // suburb / school
        if (roll > 0.35) {
          const wdt = Math.min(room - 12, 46 + r() * 20);
          house(ctx, side === 0 ? edge - wdt - 10 : edge + 10, y - 70, wdt, 44, ['#b45309', '#9a3412', '#475569', '#7c2d12'][Math.floor(r() * 4)], night);
          // driveway
          ctx.fillStyle = night ? '#44403c' : '#a8a29e';
          ctx.fillRect(side === 0 ? edge - 10 : edge, y - 40, 10, 14);
        }
        if (r() > 0.4) tree(ctx, edge + dir * 6, y - 12, 9 + r() * 5, night);
      }
    }
  }

  // road surface
  ctx.fillStyle = night ? '#1f2937' : wet ? '#374151' : '#4b5563';
  ctx.fillRect(roadL, 0, roadW, viewH);
  // edge lines
  ctx.fillStyle = 'rgba(248,250,252,.9)';
  ctx.fillRect(roadL + 3, 0, 2.5, viewH);
  ctx.fillRect(roadR - 5.5, 0, 2.5, viewH);
  // lane lines (scrolling dashes)
  const dash = 34;
  const offset = ((p.d % (dash * 2)) + dash * 2) % (dash * 2);
  for (let l = 1; l < w.lanes; l++) {
    const x = roadL + LW * l;
    for (let y = -dash * 2 + offset; y < viewH; y += dash * 2) ctx.fillRect(x - 1.25, y, 2.5, dash);
  }
  if (w.oncoming) {
    const cx = roadL + LW * w.lanes;
    ctx.fillRect(cx - 4, 0, 2.5, viewH);
    ctx.fillRect(cx + 1.5, 0, 2.5, viewH);
  } else {
    ctx.fillStyle = night ? '#14281c' : '#4d7c0f';
    ctx.fillRect(roadR, 0, 8, viewH);
  }

  // events
  for (const ev of w.events) {
    const y = Y(ev.at);
    if (y < -200 || y > viewH + 400) continue;
    drawEvent(ctx, w, ev, y, theme, blink, p);
  }

  // oncoming ambient cars
  if (w.oncoming) {
    for (const c of w.oncomingCars) {
      const yy = Y(c.d);
      if (yy < -80 || yy > viewH + 80) continue;
      drawCar(ctx, roadL + LW * (w.lanes + 0.5), yy, c.color, { rot: Math.PI, scale: 0.95 });
    }
  }

  // player
  drawCar(ctx, p.x, py, playerColor, { brake: braking, indicator: p.indicator, blink });

  // night headlight cone & darkness
  if (night) {
    const g = ctx.createRadialGradient(p.x, py - 120, 20, p.x, py - 120, 260);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(2,6,23,.72)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, viewH);
    ctx.fillStyle = 'rgba(254,249,195,.10)';
    ctx.beginPath();
    ctx.moveTo(p.x - 10, py - 26);
    ctx.lineTo(p.x - 60, py - 260);
    ctx.lineTo(p.x + 60, py - 260);
    ctx.lineTo(p.x + 10, py - 26);
    ctx.fill();
  }
  if (wet) {
    ctx.strokeStyle = 'rgba(226,232,240,.35)';
    ctx.lineWidth = 1;
    const r = rng(Math.floor(time * 20));
    ctx.beginPath();
    for (let i = 0; i < 70; i++) {
      const x = r() * WORLD_W;
      const y = r() * viewH;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 12);
    }
    ctx.stroke();
  }
}

function drawEvent(ctx: CanvasRenderingContext2D, w: World, ev: GameEvent, y: number, theme: Theme, blink: boolean, p: Player) {
  const roadL = w.roadLeft;
  const roadW = (w.lanes + w.oncoming) * LW;
  const signX = roadL - 30;
  switch (ev.type) {
    case 'speed':
      if (ev.limit) signSpeed(ctx, signX, y, ev.limit);
      break;
    case 'school':
      signSpeed(ctx, signX, y, ev.limit ?? 40, true);
      // children on footpath
      person(ctx, roadL - 12, y - 120, '#ec4899', 5);
      person(ctx, roadL - 14, y - 150, '#22c55e', 5);
      person(ctx, roadL + roadW + 12, y - 260, '#f59e0b', 5);
      break;
    case 'lights': {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(roadL, y - 3, w.lanes * LW, 5);
      // cross street
      ctx.fillStyle = theme.env === 'night' ? '#1f2937' : '#4b5563';
      ctx.fillRect(0, y - 70, WORLD_W, 60);
      ctx.fillStyle = 'rgba(248,250,252,.8)';
      for (let x = 0; x < WORLD_W; x += 30) ctx.fillRect(x, y - 41, 16, 2);
      // light pole
      const lx = roadL - 16;
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(lx - 2, y - 6, 4, 20);
      ctx.fillStyle = '#111827';
      roundRect(ctx, lx - 8, y - 40, 16, 36, 4);
      ctx.fill();
      const col = (c: string, on: boolean) => (on ? c : '#1f2937');
      ctx.fillStyle = col('#ef4444', ev.light === 'red');
      ctx.beginPath();
      ctx.arc(lx, y - 32, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col('#fbbf24', ev.light === 'yellow');
      ctx.beginPath();
      ctx.arc(lx, y - 22, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col('#22c55e', ev.light === 'green');
      ctx.beginPath();
      ctx.arc(lx, y - 12, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'crossing': {
      ctx.fillStyle = '#f8fafc';
      for (let x = roadL + 6; x < roadL + roadW - 6; x += 12) ctx.fillRect(x, y - 30, 7, 28);
      // zig zags
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) ctx.lineTo(roadL + 8 + (k % 2 ? 5 : -2), y + 10 + k * 16);
      ctx.stroke();
      // crossing sign
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(signX - 1, y - 10, 3, 20);
      ctx.save();
      ctx.translate(signX, y - 22);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.restore();
      const px = roadL - 16 + (roadW + 32) * Math.max(0, Math.min(1, ev.pedX ?? 0));
      person(ctx, px, y - 16, '#0ea5e9', 7);
      break;
    }
    case 'giveway':
    case 'stop': {
      ctx.fillStyle = theme.env === 'night' ? '#1f2937' : '#4b5563';
      ctx.fillRect(0, y - 70, WORLD_W, 60);
      ctx.fillStyle = '#f8fafc';
      if (ev.type === 'stop') ctx.fillRect(roadL, y - 4, w.lanes * LW, 6);
      else for (let x = roadL; x < roadL + w.lanes * LW; x += 12) ctx.fillRect(x, y - 3, 7, 4);
      if (ev.type === 'stop') signOct(ctx, signX, y, 'STOP');
      else signGiveWay(ctx, signX, y);
      if (ev.crossActive && (ev.crossX ?? 999) < WORLD_W + 40 && (ev.crossX ?? 0) > -60) drawCar(ctx, ev.crossX ?? 0, y - 55, '#f97316', { rot: -Math.PI / 2 });
      break;
    }
    case 'merge': {
      const len = ev.len - 200;
      const x = roadL + LW / 2;
      for (let d = 0; d < len; d += 40) {
        const cy = y - d;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(x - 7 + (d === 0 ? 0 : 0), cy);
        ctx.lineTo(x, cy - 14);
        ctx.lineTo(x + 7, cy);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 4, cy - 7, 8, 2);
      }
      ctx.fillStyle = '#ffd200';
      ctx.fillRect(signX - 16, y + 120, 32, 22);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 7px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LANE', signX, y + 130);
      ctx.fillText('ENDS', signX, y + 139);
      break;
    }
    case 'tailgate': {
      if (ev.carD !== undefined) {
        const cy = y - (ev.carD - ev.at);
        drawCar(ctx, laneX(w, ev.carLane ?? 0), cy, '#a3a3a3', { brake: true });
        const gap = ev.carD - p.d - 40;
        if (p.lane === ev.carLane && gap > 0 && gap < 420) {
          ctx.strokeStyle = gap / Math.max(1, p.speed * 2.3) < 1.2 ? '#ef4444' : '#22c55e';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + 22, cy + 28);
          ctx.lineTo(p.x + 22, cy + 28 + gap);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      break;
    }
    case 'railway': {
      ctx.fillStyle = '#57534e';
      ctx.fillRect(0, y - 46, WORLD_W, 34);
      ctx.fillStyle = '#78350f';
      for (let x = 0; x < WORLD_W; x += 12) ctx.fillRect(x, y - 44, 6, 30);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(0, y - 38, WORLD_W, 3);
      ctx.fillRect(0, y - 22, WORLD_W, 3);
      // crossbuck + lights
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(signX - 1.5, y - 4, 3, 22);
      ctx.fillStyle = ev.flashing && blink ? '#ef4444' : '#3f0d0d';
      ctx.beginPath();
      ctx.arc(signX - 8, y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ev.flashing && !blink ? '#ef4444' : '#3f0d0d';
      ctx.beginPath();
      ctx.arc(signX + 8, y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(roadL, y + 4, w.lanes * LW, 5);
      if (ev.flashing && (ev.trainX ?? -999) > -300) {
        const tx = ev.trainX ?? 0;
        for (let k = 0; k < 3; k++) {
          ctx.fillStyle = k === 0 ? '#f59e0b' : '#e5e7eb';
          roundRect(ctx, tx - k * 96, y - 44, 90, 30, 6);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          for (let wdw = 0; wdw < 4; wdw++) ctx.fillRect(tx - k * 96 + 10 + wdw * 19, y - 38, 12, 8);
        }
      }
      break;
    }
    case 'checkpoint': {
      if (ev.done) break;
      const g = ctx.createLinearGradient(roadL, 0, roadL + roadW, 0);
      g.addColorStop(0, 'rgba(46,230,214,.0)');
      g.addColorStop(0.5, 'rgba(46,230,214,.55)');
      g.addColorStop(1, 'rgba(46,230,214,.0)');
      ctx.fillStyle = g;
      ctx.fillRect(roadL, y - 8, roadW, 16);
      ctx.fillStyle = '#2ee6d6';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('? DECISION POINT ?', roadL + roadW / 2, y - 14);
      break;
    }
  }
}
