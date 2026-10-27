'use strict';
/* Project menu craft scenes. Each installer is a small rig (two-bone IK limbs, planted-foot walk
   cycle, pendulum secondary motion) drawn on canvas under one soft key light. Scenes loop
   seamlessly, pause while the menu is closed, and the installers react when clicked. */
(function () {
  const menu = document.getElementById('projects-menu');
  const canvases = menu ? Array.from(menu.querySelectorAll('canvas[data-craft]')) : [];
  if (!canvases.length || !canvases[0].getContext) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const W = 380, H = 230, PI = Math.PI, TAU = PI * 2, LX = .55, LY = -.83, STEP = 36;
  const OFF_L = -130, STAGE = [-32, 412], MASK = 30; // workers enter and leave beyond the stage mask

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const span = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const smooth = t => t * t * (3 - 2 * t);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const sine = t => .5 - .5 * Math.cos(PI * t);
  const outBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const mixPt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const quadPt = (q, u, v) => mixPt(mixPt(q[0], q[1], u), mixPt(q[3], q[2], u), v);
  const mixQuad = (a, b, t) => a.map((p, i) => mixPt(p, b[i], t));
  const shiftQuad = (q, dx, dy) => q.map(p => [p[0] + dx, p[1] + dy]);
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const rand = (a, b) => a + Math.random() * (b - a);

  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  const css = (c, f) => { const k = f > 0 ? c.map(v => v + (255 - v) * f) : c.map(v => v * (1 + f)); return 'rgb(' + (k[0] | 0) + ',' + (k[1] | 0) + ',' + (k[2] | 0) + ')'; };
  const pal = (hex, d) => { const c = rgb(hex).map(v => v * (1 + d)); return [css(c, .26), css(c, 0), css(c, -.34)]; };
  const COLORS = { skin: '#c28a62', shirt: '#41575f', pants: '#3b4741', vest: '#cfd45c', glove: '#a08c5c', boot: '#6d5136' };
  const NEAR = {}, FAR = {};
  for (const k in COLORS) { NEAR[k] = pal(COLORS[k], 0); FAR[k] = pal(COLORS[k], -.22); }

  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); return g; }
  function blob(c, x, y, rx, ry, alpha) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, 'rgba(32,48,38,' + alpha + ')'); g.addColorStop(1, 'rgba(32,48,38,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }

  /* ---------- rig ---------- */
  function ik(a, t, l1, l2, bend) {
    const dx = t[0] - a[0], dy = t[1] - a[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + .01, l1 + l2 - .01);
    const ang = Math.atan2(dy, dx), th = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)) * bend;
    return [[a[0] + Math.cos(ang - th) * l1, a[1] + Math.sin(ang - th) * l1], [a[0] + Math.cos(ang) * d, a[1] + Math.sin(ang) * d]];
  }
  // Local space: origin at the root (x, gy), +x is the facing direction, y grows downward.
  const BASE = { x: 0, gy: 0, hip: [0, -65.5], lean: 0, head: 0, look: .22, fN: [5, -3, 0], fF: [-4, -7, 0], sN: 2, sF: -2, hN: [6, -63.5], hF: [-3, -64.5], eN: -1, eF: -1, gN: 0, gF: 0, hat: 0, tilt: 0, smile: 0, oh: 0, carry: 0 };
  const pose = o => Object.assign({}, BASE, o);
  const toLocal = (p, w) => [w[0] - p.x, w[1] - p.gy];
  function blend(a, b, t) {
    if (t <= 0) return a; if (t >= 1) return b;
    const o = {};
    for (const k in b) {
      const u = a[k], v = b[k];
      if (typeof v === 'number' && typeof u === 'number') o[k] = k === 'gN' || k === 'gF' || k === 'carry' ? (t < .5 ? u : v) : lerp(u, v, t);
      else if (Array.isArray(v) && Array.isArray(u)) o[k] = v.map((x, i) => lerp(u[i], x, t));
      else o[k] = v;
    }
    return o;
  }
  function solve(p, breath) {
    const cs = Math.cos(p.lean), sn = Math.sin(p.lean), h = p.hip;
    const T = (x, y) => [h[0] + x * cs - y * sn, h[1] + x * sn + y * cs];
    const r = { p, T, shN: T(3, -37 - breath), shF: T(-4, -36 - breath), neck: T(1.5, -40 - breath), hpN: [h[0] + 2, h[1] + 1], hpF: [h[0] - 3, h[1] - 1] };
    [r.kN, r.aN] = ik(r.hpN, p.fN, 32, 31, 1); [r.kF, r.aF] = ik(r.hpF, p.fF, 32, 31, 1);
    [r.elN, r.wN] = ik(r.shN, p.hN, 22, 21, p.eN); [r.elF, r.wF] = ik(r.shF, p.hF, 22, 21, p.eF);
    r.ha = p.lean + p.head; r.hc = [r.neck[0] + Math.sin(r.ha) * 11 + 1, r.neck[1] - Math.cos(r.ha) * 11];
    r.world = v => [p.x + v[0], p.gy + v[1]];
    return r;
  }

  /* ---------- worker drawing ---------- */
  function limb(c, a, b, wa, wb, pl) {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), nx = -dy / len, ny = dx / len;
    const lit = nx * LX + ny * LY > 0 ? 1 : -1, w = Math.max(wa, wb) / 2, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    c.fillStyle = lin(c, mx + nx * lit * w, my + ny * lit * w, mx - nx * lit * w, my - ny * lit * w, [pl[0], pl[1], pl[2]]);
    c.beginPath(); c.moveTo(a[0] + nx * wa / 2, a[1] + ny * wa / 2); c.lineTo(b[0] + nx * wb / 2, b[1] + ny * wb / 2);
    c.arc(b[0], b[1], wb / 2, ang + PI / 2, ang - PI / 2, true); c.lineTo(a[0] - nx * wa / 2, a[1] - ny * wa / 2);
    c.arc(a[0], a[1], wa / 2, ang - PI / 2, ang + PI / 2, true); c.fill();
  }
  function band(c, a, b, at, wd, color) { // reflective band across a limb
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, x = a[0] + dx * at, y = a[1] + dy * at;
    c.save(); c.translate(x, y); c.rotate(Math.atan2(dy, dx)); c.fillStyle = color; c.fillRect(-1.6, -wd / 2, 3.2, wd); c.restore();
  }
  function boot(c, a, pitch, pl) {
    c.save(); c.translate(a[0], a[1]); c.rotate(pitch);
    c.fillStyle = lin(c, 0, -8, 0, 4, [pl.boot[0], pl.boot[1], pl.boot[2]]);
    c.beginPath(); c.moveTo(-4.8, -8); c.lineTo(3.2, -8); c.quadraticCurveTo(4.6, -3.4, 8, -2.6); c.quadraticCurveTo(13.6, -2, 13.6, 2); c.lineTo(13, 3.3); c.lineTo(-5.6, 3.3); c.quadraticCurveTo(-6.2, -2, -4.8, -8); c.fill();
    c.fillStyle = 'rgba(255,240,215,.22)'; c.beginPath(); c.ellipse(9.5, -1.2, 3.2, 1.3, -.15, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(30,20,12,.45)'; c.lineWidth = .7; c.beginPath(); c.moveTo(1.5, -6.5); c.lineTo(5.5, -3); c.stroke();
    c.fillStyle = '#29221c'; rrect(c, -6, 3, 20.2, 2.4, 1); c.fill();
    c.restore();
  }
  function glove(c, el, w, pl, grip) {
    const ang = Math.atan2(w[1] - el[1], w[0] - el[0]);
    c.save(); c.translate(w[0], w[1]); c.rotate(ang);
    c.fillStyle = pl.glove[2]; rrect(c, -3, -3.9, 3.6, 7.8, 1.6); c.fill();
    c.fillStyle = lin(c, 0, -4, 0, 4, [pl.glove[0], pl.glove[1], pl.glove[2]]);
    c.beginPath();
    if (grip === 1) { c.ellipse(4.6, 0, 5.4, 3.5, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(50,40,20,.35)'; c.lineWidth = .5; c.beginPath(); c.moveTo(6, -1.6); c.lineTo(9.6, -1.4); c.moveTo(6.2, .6); c.lineTo(9.8, .7); c.stroke(); }
    else { c.ellipse(3.3, 0, 4.3, 3.8, 0, 0, TAU); c.fill(); }
    c.restore();
    if (grip === 2) { c.fillStyle = pl.glove[0]; rrect(c, w[0] + Math.cos(ang) * 3 - 1.7, w[1] + Math.sin(ang) * 3 - 8.5, 3.4, 7, 1.7); c.fill(); }
  }
  function arm(c, r, near) {
    const pl = near ? NEAR : FAR, sh = near ? r.shN : r.shF, el = near ? r.elN : r.elF, w = near ? r.wN : r.wF;
    limb(c, sh, el, 10, 8.4, pl.shirt); limb(c, el, w, 8.4, 6.8, pl.shirt);
    glove(c, el, w, pl, Math.round(near ? r.p.gN : r.p.gF));
  }
  function leg(c, r, near) {
    const pl = near ? NEAR : FAR, hp = near ? r.hpN : r.hpF, k = near ? r.kN : r.kF, a = near ? r.aN : r.aF, f = near ? r.p.fN : r.p.fF;
    limb(c, hp, k, 13.5, 11, pl.pants); limb(c, k, a, 11, 8.6, pl.pants);
    band(c, k, a, .62, 9.6, near ? 'rgba(226,230,226,.92)' : 'rgba(170,176,170,.8)');
    if (near) {
      c.save(); c.translate(k[0], k[1]); c.rotate(Math.atan2(a[1] - k[1], a[0] - k[0]));
      c.fillStyle = lin(c, 0, -7, 0, 2, ['#3c4742', '#222a26']); rrect(c, -3.5, -6.8, 10.5, 8, 3); c.fill(); c.restore();
      c.fillStyle = 'rgba(20,28,24,.22)'; c.save(); c.translate((hp[0] + k[0]) / 2, (hp[1] + k[1]) / 2); c.rotate(Math.atan2(k[1] - hp[1], k[0] - hp[0])); rrect(c, -4, -5, 8, 6.5, 1.5); c.fill(); c.restore();
    }
    boot(c, a, f[2], pl);
  }
  function torso(c, r, clock) {
    const p = r.p;
    c.save(); c.translate(p.hip[0], p.hip[1]); c.rotate(p.lean);
    c.fillStyle = lin(c, 10, -6, -10, 6, NEAR.pants); c.beginPath(); c.ellipse(-.5, 1.5, 11.6, 8, 0, 0, TAU); c.fill();
    const body = new Path2D('M-9.5 3C-13-10-13-27-9.8-35.5Q-4-41.6 3-40.6Q10.2-39.2 11.4-31C12.8-21 11.8-9 9.6 3Z');
    c.fillStyle = lin(c, 12, -32, -12, -8, NEAR.shirt); c.fill(body);
    c.save(); c.clip(body);
    c.fillStyle = lin(c, 13, -30, -13, -2, NEAR.vest); c.fillRect(-15, -31, 30, 36);
    c.beginPath(); c.moveTo(3.5, -31); c.lineTo(9.5, -31); c.lineTo(8.5, -42); c.lineTo(2.5, -42); c.closePath(); c.moveTo(-10, -31); c.lineTo(-4, -31); c.lineTo(-4.6, -42); c.lineTo(-11, -40); c.closePath(); c.fill();
    const sx = ((clock * 26) % 70) - 35;
    const strip = c.createLinearGradient(sx - 9, 0, sx + 9, 0);
    strip.addColorStop(0, '#c9cfcb'); strip.addColorStop(.5, '#ffffff'); strip.addColorStop(1, '#c9cfcb');
    c.fillStyle = strip; c.fillRect(-15, -21, 30, 3.4); c.fillRect(-15, -12.5, 30, 3.4); c.fillRect(4.6, -41, 2.6, 20);
    c.fillStyle = 'rgba(70,72,30,.28)'; rrect(c, 0, -7.5, 7.5, 6.5, 1); c.fill();
    c.strokeStyle = 'rgba(60,62,24,.5)'; c.lineWidth = .6; c.beginPath(); c.moveTo(8.6, -31); c.lineTo(10, 3); c.stroke();
    c.fillStyle = 'rgba(20,30,25,.18)'; c.fillRect(-15, 0, 30, 4);
    c.restore();
    c.strokeStyle = 'rgba(28,40,34,.28)'; c.lineWidth = .6; c.stroke(body);
    c.fillStyle = '#2f2a24'; c.fillRect(-12, -1.6, 23.5, 4.4);
    c.fillStyle = '#b7b4a4'; c.fillRect(7.6, -1.2, 3, 3.6);
    c.fillStyle = lin(c, 0, 0, 0, 10, ['#6e5841', '#4a3a2a']); rrect(c, -9.5, .4, 7.5, 9.5, 1.6); c.fill();
    c.fillStyle = lin(c, 0, 1, 0, 8, ['#d8c75a', '#a29436']); rrect(c, 1.6, 1.4, 5.8, 6, 1.8); c.fill();
    c.fillStyle = '#2a2a24'; c.beginPath(); c.arc(4.5, 4.4, 1.3, 0, TAU); c.fill();
    c.restore();
  }
  function head(c, r, blink) {
    const p = r.p, lk = clamp(p.look, 0, 1), fx = lerp(5, .6, lk);
    limb(c, r.neck, [r.hc[0] - .5, r.hc[1] + 5], 8, 7.4, NEAR.skin);
    c.save(); c.translate(r.hc[0], r.hc[1]); c.rotate(r.ha);
    const hg = c.createRadialGradient(4, -4, 1, 1, 0, 13); hg.addColorStop(0, NEAR.skin[0]); hg.addColorStop(.62, NEAR.skin[1]); hg.addColorStop(1, NEAR.skin[2]);
    c.fillStyle = hg; c.beginPath(); c.ellipse(0, 0, 8.4, 10, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(lerp(3, .3, lk), 5, lerp(6, 6.8, lk), 4.7, 0, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.ellipse(0, 0, 8.6, 10.2, 0, 0, TAU); c.ellipse(lerp(3, .3, lk), 5, lerp(6.2, 7, lk), 4.9, 0, 0, TAU); c.clip();
    c.fillStyle = '#2b221d'; c.fillRect(-12, -12, lerp(7.5, 3.5, lk), 13);
    if (lk > .45) c.fillRect(8.6 - (lk - .45) * 7, -12, 6, 10);
    c.fillStyle = 'rgba(60,40,30,.2)'; c.beginPath(); c.ellipse(fx * .7, 6.5, 6.8, 3.8, 0, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = NEAR.skin[2]; c.beginPath(); c.ellipse(lerp(-2.4, -8, lk), 1, 2.1, 3.1, 0, 0, TAU); c.fill();
    if (lk > .45) { c.beginPath(); c.ellipse(lerp(14, 8, lk), 1, 1.8, 2.9, 0, 0, TAU); c.fill(); }
    const ey = -1.2, bl = blink ? .15 : 1, eN = fx + lerp(2.2, 3.2, lk), eF = fx - lerp(2.4, 3.2, lk), brow = -4.2 - p.oh * 1.6;
    c.fillStyle = '#231b17';
    c.beginPath(); c.ellipse(eN, ey, 1, 1.25 * bl, 0, 0, TAU); c.fill();
    if (lk > .12) { c.globalAlpha = clamp((lk - .12) * 4, 0, 1); c.beginPath(); c.ellipse(eF, ey, .95, 1.2 * bl, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
    c.strokeStyle = '#2b211c'; c.lineWidth = .9; c.lineCap = 'round'; c.beginPath(); c.moveTo(eN - 1.4, brow + .3); c.lineTo(eN + 1.6, brow - .2);
    if (lk > .12) { c.moveTo(eF - 1.5, brow - .2); c.lineTo(eF + 1.3, brow + .3); } c.stroke();
    const nx = lerp(8.6, fx + .4, lk);
    c.fillStyle = NEAR.skin[1]; c.beginPath(); c.moveTo(nx - 2, -.6); c.lineTo(nx + 1.2 * (1 - lk), 2.3); c.lineTo(nx - 1.8, 2.9); c.closePath(); c.fill();
    c.fillStyle = 'rgba(90,50,35,.35)'; c.beginPath(); c.ellipse(nx - 1, 2.7, 1.3, .6, 0, 0, TAU); c.fill();
    const mx = fx + lerp(1.6, 0, lk);
    if (p.oh > .3) { c.fillStyle = '#5a2b22'; c.beginPath(); c.ellipse(mx, 5.4, 1.3 * p.oh, 1.7 * p.oh, 0, 0, TAU); c.fill(); }
    else { c.strokeStyle = '#6b3a2c'; c.lineWidth = .8; c.beginPath(); c.moveTo(mx - 2, 5); c.quadraticCurveTo(mx, 5 + p.smile * 2.2, mx + 2.1, 4.8 - p.smile * .4); c.stroke(); }
    const gx0 = lerp(fx - 1.5, fx - 5.4, lk), gx1 = lerp(fx + 5.2, fx + 5.4, lk);
    c.fillStyle = 'rgba(176,210,222,.38)'; rrect(c, gx0, -3.4, gx1 - gx0, 4.2, 1.6); c.fill();
    c.strokeStyle = 'rgba(30,40,40,.6)'; c.lineWidth = .6; c.stroke();
    c.beginPath(); c.moveTo(gx0, -2.2); c.lineTo(lerp(-2, -7.5, lk), -1.2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(gx1 - 2.8, -2.6); c.lineTo(gx1 - 1, -2.6); c.stroke();
    c.fillStyle = 'rgba(40,28,20,.16)'; c.beginPath(); c.ellipse(fx, -3.2, 8.5, 2.2, 0, 0, TAU); c.fill();
    c.translate(0, -p.hat); c.rotate(p.tilt);
    const bx = lerp(14.5, 11.5, lk), bk = lerp(-10.6, -11.4, lk);
    c.fillStyle = lin(c, 7, -19, -9, -1, ['#ffffff', '#f1eee3', '#bab6a6']);
    c.beginPath(); c.moveTo(bk, -3.4); c.bezierCurveTo(bk, -18.4, 9.6, -19.8, 10.2, -5.4); c.lineTo(bx, -4.2); c.quadraticCurveTo(bx + 1, -2.2, bx - .6, -1.7); c.lineTo(bk - 1, -2.1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(140,134,116,.55)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-2.4, -16.2); c.quadraticCurveTo(6, -14.2, 8.6, -6.4); c.stroke();
    c.strokeStyle = 'rgba(120,114,98,.5)'; c.lineWidth = .7; c.beginPath(); c.moveTo(bk - .6, -2.6); c.lineTo(bx - .5, -2.4); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.5; c.beginPath(); c.arc(1.5, -5.5, 9, -2.15, -1.3); c.stroke();
    c.restore();
  }
  function drawWorker(c, r, clock, blink) {
    const p = r.p, h = p.hip;
    blob(c, h[0] + 2, (p.sN + p.sF) / 2 + 1, 26, 5, .16);
    for (const [a, s] of [[r.aN, p.sN], [r.aF, p.sF]]) { const lift = Math.max(0, s - (a[1] + 5)); blob(c, a[0] + 4, s + .5, 12 + lift * .15, 2.8, .3 * clamp(1 - lift / 22, 0, 1)); }
    leg(c, r, false); arm(c, r, false); leg(c, r, true); torso(c, r, clock); head(c, r, blink); arm(c, r, true);
  }

  /* ---------- motion helpers ---------- */
  function gaitFoot(s, off, depth) {
    const u = ((((s + off) % 2) + 2) % 2) / 2;
    let x, lift = 0, a;
    if (u < .4) { const q = u / .4; x = -.6 * STEP + 2 * STEP * sine(q) - u * 2 * STEP; lift = Math.sin(PI * q) * (7 + 3 * (1 - q)); a = lerp(.6, -.28, sine(q)); }
    else { const q = (u - .4) / .6; x = 1.4 * STEP - u * 2 * STEP; a = q < .18 ? lerp(-.28, 0, q / .18) : q > .6 ? .6 * Math.pow((q - .6) / .4, 1.6) : 0; }
    if (a > 0) { lift += 11 * Math.sin(a); x -= 11 * (1 - Math.cos(a)); } else { lift += 5 * Math.sin(-a); x += 5 * (1 - Math.cos(a)); }
    return [x, depth - lift, a];
  }
  function walk(x0, x1, gy, mod) {
    const dist = Math.abs(x1 - x0), dir = x1 < x0 ? -1 : 1, A = clamp(34 / Math.max(dist, 1), .1, .5);
    return (u, lt) => {
      const vm = 1 / (1 - A); let f, v;
      if (u < A) { f = .5 * vm * u * u / A; v = u / A; } else if (u <= 1 - A) { f = .5 * vm * A + vm * (u - A); v = 1; } else { const k = 1 - u; f = 1 - .5 * vm * k * k / A; v = k / A; }
      const d = f * dist, s = d / STEP, w = smooth(clamp(v * 1.6, 0, 1));
      const gN = gaitFoot(s, 0, -3), gF = gaitFoot(s, 1, -7), bob = .5 + .5 * Math.cos(TAU * (s - .3)), sw = -Math.cos(TAU * ((s / 2) % 1 - .4));
      const hy = lerp(-65.5, -62.6 - 2.6 * bob, w);
      const p = pose({ x: x0 + dir * d, gy, hip: [1.5 * w, hy], lean: .06 * w, head: -.03 * w,
        fN: [lerp(5, gN[0], w), lerp(-3, gN[1], w), gN[2] * w], fF: [lerp(-4, gF[0], w), lerp(-7, gF[1], w), gF[2] * w],
        hN: [6 + sw * 12 * w, hy + 2 - Math.abs(sw) * 3 * w], hF: [-3 - sw * 11 * w, hy + 1 - Math.abs(sw) * 3 * w] });
      return mod ? mod(p, u, lt) : p;
    };
  }
  // Step up or down: each plant is a world point for the next foot (near first); a last move brings the trailing foot alongside.
  function climb(x0, gy, plants) {
    let n = [x0 + 5, gy - 3], f = [x0 - 4, gy - 7];
    const moves = [], hipAt = () => [(n[0] + f[0]) / 2 - .5, (n[1] + f[1]) / 2 + 5 - 65.5];
    const stand = [hipAt()];
    plants.forEach((pl, i) => { const near = i % 2 === 0, to = [pl[0], pl[1] + (near ? -3 : -7)]; moves.push({ near, from: near ? n : f, to }); if (near) n = to; else f = to; stand.push(hipAt()); });
    const near = plants.length % 2 === 0, lead = near ? f : n, to = [lead[0] + (near ? 9 : -9), lead[1] + (near ? 4 : -4)];
    moves.push({ near, from: near ? n : f, to }); if (near) n = to; else f = to; stand.push(hipAt());
    return u => {
      const k = Math.min(moves.length - 1, Math.floor(u * moves.length)), q = u * moves.length - k;
      let fn = [x0 + 5, gy - 3], ff = [x0 - 4, gy - 7];
      for (let i = 0; i < k; i++) { if (moves[i].near) fn = moves[i].to; else ff = moves[i].to; }
      const m = moves[k], up = m.from[1] - m.to[1];
      const mv = [lerp(m.from[0], m.to[0], sine(q)), lerp(m.from[1], m.to[1], smooth(clamp(q * 1.6, 0, 1))) - Math.sin(PI * q) * (7 + Math.max(0, up) * .3), lerp(.45, 0, q)];
      const mvGround = lerp(m.from[1], m.to[1], q) + 5;
      if (m.near) fn = mv; else ff = mv;
      const hp = mixPt(stand[k], stand[k + 1], ease(q)), hx = hp[0];
      const loc = pt => [pt[0] - hx, pt[1] - gy];
      return pose({ x: hx, gy, hip: [0, hp[1] - gy - Math.sin(PI * q) * 1.5], lean: .1 + Math.max(0, up) * .004,
        fN: [...loc(fn), m.near ? mv[2] : 0], fF: [...loc(ff), m.near ? 0 : mv[2]],
        sN: (m.near ? mvGround : fn[1] + 5) - gy, sF: (m.near ? ff[1] + 5 : mvGround) - gy,
        hN: [8 + Math.sin(PI * q) * (m.near ? -5 : 5), hp[1] - gy + 1], hF: [-2 + Math.sin(PI * q) * (m.near ? 5 : -5), hp[1] - gy] });
    };
  }
  function stand(x, gy, o) { return () => pose(Object.assign({ x, gy }, o)); }
  function seq(list) {
    let a = 0;
    const segs = list.map(([d, fn]) => { const s = { a, d, fn }; a += d; return s; });
    const fn = t => {
      t = ((t % a) + a) % a;
      let i = 0; while (i < segs.length - 1 && t >= segs[i].a + segs[i].d) i++;
      const s = segs[i], lt = t - s.a, p = s.fn(clamp(lt / s.d, 0, 1), lt);
      // Ease in from the previous segment, but never across the loop: the worker leaves right and re-enters left off-stage.
      if (lt < .24 && i > 0) return blend(segs[i - 1].fn(1, segs[i - 1].d), p, smooth(lt / .24));
      return p;
    };
    fn.dur = a;
    return fn;
  }

  /* ---------- room and light ---------- */
  function room(c, top, clock, motes) {
    const tY = x => top - 21 * (x - 22) / 243, bY = x => 166 - 19 * (x - 22) / 243, cx = 265, cT = tY(cx), cB = bY(cx);
    const rT = x => cT + 34 * (x - cx) / 96, rB = x => cB + 42 * (x - cx) / 96;
    c.fillStyle = lin(c, 0, -40, 0, 60, ['#d9dfd2', '#e8ebe2']); c.fillRect(-400, -300, 1200, 800);
    c.fillStyle = lin(c, 0, tY(120), 0, bY(120), ['#eceee5', '#f5f5ef', '#eef0e8']); poly(c, [[-400, tY(-400)], [cx, cT], [cx, cB], [-400, bY(-400)]]); c.fill();
    c.fillStyle = lin(c, cx, 0, 430, 0, ['#d7ddcf', '#e4e8dd']); poly(c, [[cx, cT], [800, rT(800)], [800, rB(800)], [cx, cB]]); c.fill();
    const floor = [[-400, bY(-400)], [cx, cB], [800, rB(800)], [800, 700], [-400, 700]];
    c.fillStyle = lin(c, 0, 140, 0, 240, ['#d9ded1', '#e3e7dc', '#ebeee6']); poly(c, floor); c.fill();
    c.save(); poly(c, floor); c.clip();
    c.strokeStyle = 'rgba(110,130,105,.14)'; c.lineWidth = .7; c.beginPath();
    for (let k = 1; k < 9; k++) { const dx = 96 * k * .3, dy = 42 * k * .3; c.moveTo(-400 + dx, bY(-400) + dy); c.lineTo(cx + dx, cB + dy); }
    for (let x = -380; x < cx; x += 52) { c.moveTo(x, bY(x)); c.lineTo(x + 96 * 3, bY(x) + 126); }
    c.stroke();
    c.fillStyle = lin(c, 0, 168, 0, 230, ['rgba(255,252,236,.0)', 'rgba(255,252,236,.55)', 'rgba(255,252,236,0)']);
    poly(c, [[118, 186], [218, 177], [310, 226], [190, 238]]); c.fill();
    c.restore();
    c.fillStyle = 'rgba(255,253,240,.5)'; poly(c, [[44, tY(44) + 34], [76, tY(76) + 34], [76, tY(76) + 92], [44, tY(44) + 92]]); c.fill(); poly(c, [[80, tY(80) + 34], [112, tY(112) + 34], [112, tY(112) + 92], [80, tY(80) + 92]]); c.fill();
    c.fillStyle = lin(c, 0, cB - 14, 0, cB, ['rgba(60,80,62,0)', 'rgba(60,80,62,.13)']); poly(c, [[-400, bY(-400) - 14], [cx, cB - 14], [cx, cB], [-400, bY(-400)]]); c.fill();
    c.fillStyle = lin(c, 0, cB, 0, cB + 9, ['rgba(60,80,62,.12)', 'rgba(60,80,62,0)']); poly(c, [[-400, bY(-400)], [cx, cB], [cx + 9, cB + 4], [-400, bY(-400) + 9]]); c.fill();
    c.fillStyle = lin(c, cx - 10, 0, cx + 8, 0, ['rgba(60,80,62,0)', 'rgba(60,80,62,.12)', 'rgba(60,80,62,0)']); c.fillRect(cx - 10, cT, 18, cB - cT);
    c.strokeStyle = 'rgba(80,100,82,.3)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-400, bY(-400) - 1); c.lineTo(cx, cB - 1); c.lineTo(800, rB(800) - 1); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = lin(c, 260, 0, 330, 0, ['rgba(255,248,225,0)', 'rgba(255,248,225,.13)', 'rgba(255,248,225,0)']);
    poly(c, [[330, -30], [430, -30], [250, 240], [150, 240]]); c.fill();
    for (const m of motes) {
      const shaft = 380 - (m.y + 30) * .667, inside = clamp(1 - Math.abs(m.x - shaft + 10) / 52, 0, 1);
      c.fillStyle = 'rgba(255,250,230,' + (inside * (.45 + .35 * Math.sin(clock * 1.7 + m.ph))).toFixed(3) + ')';
      c.beginPath(); c.arc(m.x, m.y, m.r, 0, TAU); c.fill();
    }
    c.restore();
  }

  /* ---------- props ---------- */
  function drill(c, w, ang, spin) {
    c.save(); c.translate(w[0], w[1]); c.rotate(ang);
    c.fillStyle = lin(c, 0, 8, 0, 14, ['#3a3d38', '#1d201c']); rrect(c, -3, 8, 10, 5, 1.4); c.fill();
    c.fillStyle = lin(c, 0, -2, 4, 9, ['#4e6e5b', '#2f4a3b']); poly(c, [[-1.5, -3], [4, -3], [5.5, 9], [-1, 9]]); c.fill();
    c.fillStyle = lin(c, 0, -9, 0, -1, ['#6d8f78', '#4d6c58', '#2c4637']); rrect(c, -5, -9, 21, 8, 3); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; rrect(c, -3, -8.2, 15, 1.6, .8); c.fill();
    c.fillStyle = lin(c, 0, -8, 0, -2, ['#e2e2da', '#8f918a']); rrect(c, 16, -7.6, 5, 5.2, 1); c.fill();
    c.strokeStyle = '#8a8c86'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(21, -5); c.lineTo(28, -5); c.stroke();
    if (spin) { c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = .6; c.beginPath(); for (let i = 0; i < 3; i++) { const x = 22 + ((spin * 40 + i * 2.3) % 6); c.moveTo(x, -6); c.lineTo(x + 1, -4); } c.stroke(); }
    c.restore();
  }
  function toolbox(c, x, y) {
    blob(c, x + 2, y + 1, 26, 4, .28);
    c.fillStyle = lin(c, 0, y - 15, 0, y, ['#5f7c66', '#3f5747']); rrect(c, x - 18, y - 14, 36, 14, 2); c.fill();
    c.fillStyle = lin(c, 0, y - 19, 0, y - 13, ['#7b987f', '#56705d']); rrect(c, x - 19, y - 18, 38, 5, 1.6); c.fill();
    c.strokeStyle = '#2f3d33'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 7, y - 18); c.quadraticCurveTo(x, y - 25, x + 7, y - 18); c.stroke();
    c.fillStyle = '#c9c6b5'; c.fillRect(x - 13, y - 13.5, 3, 3); c.fillRect(x + 10, y - 13.5, 3, 3);
    c.fillStyle = '#d4c15a'; c.fillRect(x + 21, y - 4, 22, 3); c.fillStyle = '#7ea06f'; c.beginPath(); c.arc(x + 32, y - 2.5, 1, 0, TAU); c.fill();
  }

  function platform(c, deck, floor) { // rolling work platform shared by the overhead scenes
    blob(c, 186, floor + 1, 70, 6, .25);
    c.strokeStyle = '#8fa092'; c.lineWidth = 2.2; c.beginPath();
    for (const x of [134, 232]) { c.moveTo(x, deck + 3); c.lineTo(x, floor - 2); }
    c.moveTo(136, deck + 6); c.lineTo(230, floor - 4); c.moveTo(136, floor - 4); c.lineTo(230, deck + 6); c.stroke();
    c.fillStyle = lin(c, 0, deck - 3, 0, deck + 5, ['#e0e5da', '#a8b4a6']); rrect(c, 128, deck - 1, 110, 6, 1.5); c.fill();
    c.fillStyle = '#d0d8cb'; poly(c, [[134, deck - 1], [232, deck - 1], [244, deck - 6], [146, deck - 6]]); c.fill();
    c.fillStyle = '#3c4640'; for (const x of [134, 232]) { c.beginPath(); c.arc(x, floor - 1.5, 3, 0, TAU); c.fill(); }
  }
  function platformRail(c, deck) { c.strokeStyle = 'rgba(120,138,122,.75)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(128, deck + 7); c.lineTo(238, deck + 7); c.stroke(); }

  /* ---------- scene: partition framing ---------- */
  function partitionScene() {
    const gy = 180, top = 43;
    const tY = x => top - 21 * (x - 22) / 243, bY = x => 166 - 19 * (x - 22) / 243, fT = x => tY(x) + 10, fB = x => bY(x) - 3;
    const bay = (x0, x1) => [[x0, fT(x0)], [x1, fT(x1)], [x1, fB(x1)], [x0, fB(x0)]];
    const mount = bay(194, 258), done = bay(130, 194);
    const carried = p => { const hx = p.x + p.hip[0], hy = p.gy + p.hip[1]; return [[hx - 25, hy - 100], [hx + 39, hy - 105.5], [hx + 39, hy + 4.5], [hx - 25, hy + 10]]; };
    const CARRY = [[.72, .84], [.14, 1]], MOUNT = [[.05, .52], [.1, .3]];
    const ang = -.12, tip = rot([27, -5], ang);
    const screws = [[.5, .78, 4.6], [.5, .5, 5.2], [.5, .22, 5.8], [.94, .22, 7.0], [.94, .5, 7.6], [.94, .78, 8.2]].map(([u, v, t]) => ({ pt: quadPt(mount, u, v), t }));
    const holster = p => [8, p.hip[1] + 3];
    const boardAt = (t, p) => {
      if (t < 3) return carried(p);
      if (t < 4.2) { const q = ease(span(t, 3, 4.2)); return shiftQuad(mixQuad(carried(p), mount, q), 0, -Math.sin(PI * q) * 8); }
      return mount;
    };
    const handsOn = (p, q, t) => { const k = clamp(t, 0, 1); p.hN = toLocal(p, quadPt(q, lerp(CARRY[0][0], MOUNT[0][0], k), lerp(CARRY[0][1], MOUNT[0][1], k))); p.hF = toLocal(p, quadPt(q, lerp(CARRY[1][0], MOUNT[1][0], k), lerp(CARRY[1][1], MOUNT[1][1], k))); p.eN = -1; p.eF = -.6; p.gN = 1; return p; };
    const crouchFor = (p, hand) => { const k = clamp((hand[1] + 83) / 36, 0, 1); p.hip = [p.hip[0] + 3 * k, lerp(-65.5, -49, k)]; p.lean = .1 + .16 * k; p.fN = [9, -3, 0]; p.fF = [-6, -7, 0]; };
    const drillTarget = (p, s, push) => toLocal(p, [s.pt[0] - tip[0] - push, s.pt[1] - tip[1]]);
    const work = (x, list, brace) => (u, lt) => {
      const p = pose({ x, gy, look: .12 }), t = list[0].t + lt;
      let i = 0; while (i < list.length - 1 && t >= list[i + 1].t) i++;
      const s = list[i], prev = i ? drillTarget(p, list[i - 1], 0) : holster(p);
      const a = span(t, s.t, s.t + .25), d = span(t, s.t + .25, s.t + .6), jit = d > 0 && d < 1 ? Math.sin(t * 90) * .6 : 0;
      const hand = mixPt(prev, drillTarget(p, s, Math.sin(PI * d) * 2), ease(a));
      p.hN = [hand[0] + jit, hand[1] - Math.sin(PI * a) * 4 + jit * .5]; p.eN = -1;
      crouchFor(p, p.hN);
      p.hF = toLocal(p, quadPt(mount, brace, lerp(.38, .62, clamp((p.hN[1] + 83) / 36, 0, 1)))); p.eF = -.4; p.gF = 1;
      p.head = clamp((p.hN[1] - (p.hip[1] - 50)) / 70, -.45, .4); p.drive = d > 0 && d < 1 ? s : null; p.busyN = 1;
      return p;
    };
    const timeline = seq([
      [3.0, walk(OFF_L, 158, gy, p => { p.carry = 1; p.lean = .03; return handsOn(p, carried(p), 0); })],
      [1.2, (u, lt) => { const p = pose0(158); p.carry = 1; p.lean = .04 + .1 * sine(u); p.hip = [2 * u, -65.5 + 2 * Math.sin(PI * u)]; p.head = -.18 * Math.sin(PI * u); return handsOn(p, boardAt(3 + lt, p), smooth(u)); }],
      [.4, u => { const p = pose0(158); p.lean = .1; const a = toLocal(p, quadPt(mount, MOUNT[0][0], MOUNT[0][1])); p.hN = mixPt(a, holster(p), ease(span(u, 0, .5))); p.hF = toLocal(p, quadPt(mount, .12, .45)); p.eF = -.4; p.gF = 1; return p; }],
      [1.8, work(158, screws.slice(0, 3), .12)],
      [.6, walk(158, 200, gy, p => { p.hF = toLocal(p, quadPt(mount, lerp(.12, .5, span(p.x, 158, 200)), .45)); p.gF = 1; p.hN = [16, p.hip[1] - 14]; p.busyN = 1; return p; })],
      [1.8, work(200, screws.slice(3), .5)],
      [.5, u => { const p = pose0(200); p.hN = mixPt(drillTarget(p, screws[5], 0), holster(p), ease(span(u, 0, .6))); crouchFor(p, p.hN); p.hF = mixPt(toLocal(p, quadPt(mount, .5, .45)), [-3, -64.5], ease(u)); return p; }],
      [1.0, u => { const p = pose0(200); p.lean = -.05; p.head = -.2 + Math.sin(u * PI * 2) * .06; p.look = .35; p.hN = [3, -69.5]; p.hF = [-8, -69.5]; p.eF = -1; p.smile = smooth(u); return p; }],
      [2.9, walk(200, 475, gy)],
      [.8, stand(475, gy)]
    ]);
    function pose0(x) { return pose({ x, gy }); }
    return {
      dur: timeline.dur, top, pose: timeline, line: 'Plumb and level.',
      back(c, t, r) {
        const steel = lin(c, 0, 0, 4, 0, ['#c9d0c4', '#eef1ea', '#9aa597']);
        c.fillStyle = 'rgba(70,90,72,.12)'; for (const x of [98, 130, 162, 194, 226, 258]) poly(c, [[x + 3, fT(x)], [x + 7, fT(x)], [x + 7, fB(x)], [x + 3, fB(x)]]), c.fill();
        c.fillStyle = steel;
        poly(c, [[96, fT(96) - 2], [262, fT(262) - 2], [262, fT(262) + 2], [96, fT(96) + 2]]); c.fill();
        poly(c, [[96, fB(96) - 2], [262, fB(262) - 2], [262, fB(262) + 2], [96, fB(96) + 2]]); c.fill();
        for (const x of [98, 130, 162, 194, 226, 258]) { c.save(); c.translate(x, 0); c.fillStyle = lin(c, -2, 0, 2.5, 0, ['#9aa597', '#eef1ea', '#b8c0b3']); c.fillRect(-2, fT(x), 4.5, fB(x) - fT(x)); c.restore(); }
        drawBoard(c, done, 1, true);
        const reset = 1 - span(t, 13.2, 13.8);
        if (t < 13.8) drawBoard(c, boardAt(t, r.p), t < 4.2 ? 1 : reset, false);
        if (t >= 4.2) for (const s of screws) { if (t > s.t + .55) screw(c, s.pt, reset, t - s.t - .55); }
      },
      front(c, t, r) {
        const inHand = t >= 4.4 && t < 9.1, p = r.p;
        if (inHand) drill(c, r.world(r.wN), ang, p.drive ? t : 0);
        else { const h = r.world(r.T(7, 3)); drill(c, [h[0] - 3, h[1] + 4], 1.45, 0); }
        toolbox(c, 54, 205);
      },
      emit(t, r, add) { const p = r.p; if (p.drive) { for (let i = 0; i < 2; i++) add(p.drive.pt[0] + rand(-1, 1), p.drive.pt[1] + rand(-1, 1), rand(-14, 6), rand(-16, 4), rand(.5, 1), rand(.6, 1.6), '244,242,234'); } },
      still: 5.4
    };
    function drawBoard(c, q, alpha, finished) {
      if (alpha <= 0) return;
      c.save(); c.globalAlpha = alpha;
      c.fillStyle = 'rgba(60,78,62,.18)'; poly(c, shiftQuad(q, 2.5, 1.5)); c.fill();
      c.fillStyle = lin(c, q[0][0], q[0][1], q[2][0], q[2][1], finished ? ['#f4f4ee', '#ecede5', '#e2e4da'] : ['#f6f4ea', '#ebe8da', '#ddd9c8']);
      poly(c, q); c.fill();
      c.strokeStyle = 'rgba(120,130,110,.4)'; c.lineWidth = .7; c.stroke();
      c.strokeStyle = 'rgba(150,150,130,.18)'; c.beginPath(); for (let i = 1; i < 4; i++) { const a = quadPt(q, i / 4, .04), b = quadPt(q, i / 4, .96); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
      if (finished) { c.fillStyle = '#9da493'; for (const u of [.06, .5, .94]) for (const v of [.14, .5, .86]) { const s = quadPt(q, u, v); c.beginPath(); c.arc(s[0], s[1], 1, 0, TAU); c.fill(); } c.fillStyle = 'rgba(255,255,255,.65)'; poly(c, [quadPt(q, .97, 0), quadPt(q, 1.03, 0), quadPt(q, 1.03, 1), quadPt(q, .97, 1)]); c.fill(); }
      c.restore();
    }
    function screw(c, pt, alpha, age) {
      c.save(); c.globalAlpha = alpha;
      if (age < .4) { c.strokeStyle = 'rgba(255,255,255,' + (1 - age / .4) + ')'; c.lineWidth = .8; c.beginPath(); c.arc(pt[0], pt[1], 2 + age * 14, 0, TAU); c.stroke(); }
      c.fillStyle = '#7b8476'; c.beginPath(); c.arc(pt[0], pt[1], 1.25, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(pt[0] - .4, pt[1] - .4, .45, 0, TAU); c.fill();
      c.restore();
    }
  }

  /* ---------- scene: ceiling installation ---------- */
  function ceilingScene() {
    const floor = 206, deck = 186, top = 18;
    const tY = x => top - 21 * (x - 22) / 243;
    const A0 = [40, tY(40) + 28], B0 = [262, tY(262) + 28], D = [72, 25.5];
    const at = (u, v) => [A0[0] + (B0[0] - A0[0]) * u + D[0] * v, A0[1] + (B0[1] - A0[1]) * u + D[1] * v];
    const cell = (i, j) => [at(i / 6, j / 3), at((i + 1) / 6, j / 3), at((i + 1) / 6, (j + 1) / 3), at(i / 6, (j + 1) / 3)];
    const target = cell(2, 2), U = [(B0[0] - A0[0]) / 6, (B0[1] - A0[1]) / 6], V = [D[0] / 3, D[1] / 3];
    const tileAround = (cx, cy, tilt) => [[cx - U[0] / 2 - V[0] / 2 * tilt, cy - U[1] / 2 - V[1] / 2 * tilt], [cx + U[0] / 2 - V[0] / 2 * tilt, cy + U[1] / 2 - V[1] / 2 * tilt], [cx + U[0] / 2 + V[0] / 2 * tilt, cy + U[1] / 2 + V[1] / 2 * tilt], [cx - U[0] / 2 + V[0] / 2 * tilt, cy - U[1] / 2 + V[1] / 2 * tilt]];
    const held = p => { const hx = p.x + p.hip[0], hy = p.gy + p.hip[1]; return tileAround(hx + 22, hy - 16, 1); };
    const over = p => tileAround(p.x + 22, p.gy - 131, .7);
    const insert = [shiftQuad(target, 0, -10)[0], shiftQuad(target, 0, -10)[1], [target[2][0], target[2][1] - 4], [target[3][0], target[3][1] - 4]];
    const grips = (p, q) => { p.hN = toLocal(p, quadPt(q, .5, 1)); p.hF = toLocal(p, quadPt(q, .25, .1)); p.eN = -1; p.eF = -1; p.gN = 1; p.gF = 1; return p; };
    const X = 172;
    const tileAt = (t, p) => {
      if (t < 4.4) return { q: held(p), front: 1 };
      if (t < 5.1) return { q: mixQuad(held(p), over(p), ease(span(t, 4.4, 5.1))), front: 1 };
      if (t < 5.7) { const k = ease(span(t, 5.1, 5.7)); return { q: mixQuad(over(p), insert, k), front: k < .55 }; }
      if (t < 6.2) { const k = span(t, 5.7, 6.2); return { q: mixQuad(insert, target, outBack(k)), front: 0 }; }
      return { q: target, front: 0 };
    };
    const P0 = x => pose({ x, gy: deck });
    const timeline = seq([
      [2.8, walk(OFF_L, 120, floor, p => { p.carry = 1; return grips(p, held(p)); })],
      [.9, (u, lt) => { const p = climb(120, floor, [[142, deck]])(u); p.carry = 1; return grips(p, held(p)); }],
      [.7, walk(137, X, deck, p => { p.carry = 1; return grips(p, held(p)); })],
      [.7, u => { const p = P0(X); p.carry = 1; p.lean = -.04 * u; p.head = -.35 * smooth(u); p.look = .15; return grips(p, mixQuad(held(p), over(p), ease(u))); }],
      [.6, u => { const p = P0(X); p.carry = 1; p.lean = -.06; p.head = -.42; p.hip = [0, -65.5 + Math.sin(PI * u) * -2]; p.fN = [5, -3 - Math.sin(PI * u) * 4, Math.sin(PI * u) * .5]; p.fF = [-4, -7 - Math.sin(PI * u) * 3, Math.sin(PI * u) * .45]; return grips(p, tileAt(5.1 + u * .6, p).q); }],
      [.5, u => { const p = P0(X); p.carry = 1; p.lean = -.06; p.head = -.42; return grips(p, tileAt(5.7 + u * .5, p).q); }],
      [.8, u => { const p = P0(X); p.lean = -.05; p.head = -.4; const push = Math.sin(u * PI * 3) * 1.5; p.hN = toLocal(p, quadPt(target, .45, .85)); p.hF = toLocal(p, quadPt(target, .2, .5)); p.hN[1] -= push; p.hF[1] += push * .6; p.gN = 1; p.gF = 1; return p; }],
      [.8, u => { const p = P0(X); p.head = -.25 + .1 * u; p.look = .5; const k = Math.sin(PI * u); p.hN = [lerp(6, 14, u) * k + 6 * (1 - k), lerp(-63.5, -119.5, k)]; p.eN = -1; p.gN = 1; p.smile = .6; return p; }],
      [.8, u => { const p = P0(X); p.look = .7; p.smile = 1; const c = Math.abs(Math.sin(u * PI * 2)); p.hN = [12 + c * 4, -85.5]; p.hF = [10 - c * 4, -87.5]; p.eN = -1; p.eF = -1; p.gN = 1; p.gF = 1; p.clap = c < .12 ? 1 : 0; return p; }],
      [.6, walk(X, 216, deck)],
      [.8, climb(216, deck, [[238, floor]])],
      [2.6, walk(233, 475, floor)],
      [1.4, stand(475, floor)]
    ]);
    const pins = [];
    for (let i = 0; i < 26; i++) pins.push([Math.random(), Math.random()]);
    return {
      dur: timeline.dur, top, pose: timeline, line: 'Grid aligned.',
      back(c, t, r) {
        platform(c, deck, floor);
        // ceiling plenum, services and tiles
        const plane = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
        c.fillStyle = lin(c, 0, 0, 0, 70, ['#4a5650', '#66726a']); poly(c, plane); c.fill();
        c.save(); poly(c, plane); c.clip();
        c.fillStyle = lin(c, 0, 26, 0, 40, ['#b9c0b5', '#8b958a', '#6c766c']); poly(c, [at(0, .5), at(1, .5), at(1, .78), at(0, .78)]); c.fill();
        c.strokeStyle = '#2f3833'; c.lineWidth = 1.1; c.beginPath(); const a1 = at(0, .35), a2 = at(1, .35); c.moveTo(a1[0], a1[1]); c.quadraticCurveTo((a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2 + 8, a2[0], a2[1]); c.stroke();
        c.restore();
        const reset = 1 - span(t, 12.8, 13.6), tile = tileAt(t, r.p);
        if (!tile.front && t < 13.6) drawTile(c, tile.q, t >= 6.2 ? reset : 1);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) if (i !== 2 || j !== 2) drawTile(c, cell(i, j), 1);
        c.strokeStyle = '#fbfbf7'; c.lineWidth = 1.6; c.beginPath();
        for (let i = 0; i <= 6; i++) { const a = at(i / 6, 0), b = at(i / 6, 1); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        for (let j = 0; j <= 3; j++) { const a = at(0, j / 3), b = at(1, j / 3); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke();
        c.strokeStyle = 'rgba(70,84,72,.35)'; c.lineWidth = .6; c.beginPath();
        for (let j = 1; j <= 3; j++) { const a = at(0, j / 3), b = at(1, j / 3); c.moveTo(a[0], a[1] + 1); c.lineTo(b[0], b[1] + 1); } c.stroke();
        c.strokeStyle = 'rgba(90,100,92,.5)'; c.lineWidth = .5; c.beginPath();
        for (let i = 0; i <= 6; i++) { const a = at(i / 6, 1); c.moveTo(a[0], a[1]); c.lineTo(a[0] + 2, -30); } c.stroke();
        c.fillStyle = lin(c, 0, 0, 0, 6, ['rgba(40,55,45,.18)', 'rgba(40,55,45,0)']); poly(c, [at(0, 1), at(1, 1), [at(1, 1)[0], at(1, 1)[1] + 6], [at(0, 1)[0], at(0, 1)[1] + 6]]); c.fill();
      },
      front(c, t, r) {
        const tile = tileAt(t, r.p);
        if (tile.front) drawTile(c, tile.q, 1, true);
        platformRail(c, deck);
      },
      emit(t, r, add) {
        if (t > 6.15 && t < 6.35) for (let i = 0; i < 3; i++) { const pt = quadPt(target, Math.random(), rand(.6, 1)); add(pt[0], pt[1], rand(-8, 8), rand(2, 12), rand(.8, 1.4), rand(.6, 1.5), '236,236,226'); }
        if (r.p.clap) { const w = r.world(r.wN); for (let i = 0; i < 4; i++) add(w[0] + 3, w[1], rand(-22, 22), rand(-18, 4), rand(.4, .8), rand(.6, 1.4), '226,224,210'); }
      },
      still: 6.6
    };
    function drawTile(c, q, alpha, underside) {
      if (alpha <= 0) return;
      c.save(); c.globalAlpha = alpha;
      c.fillStyle = lin(c, q[3][0], q[3][1], q[1][0], q[1][1], ['#f1f0e8', '#f8f8f2', '#e6e6dc']); poly(c, q); c.fill();
      c.fillStyle = 'rgba(120,125,110,.35)'; for (const [u, v] of pins) { const s = quadPt(q, u, v); c.fillRect(s[0], s[1], .6, .6); }
      if (underside) { c.fillStyle = '#c9cbbf'; poly(c, [q[3], q[2], [q[2][0], q[2][1] + 1.8], [q[3][0], q[3][1] + 1.8]]); c.fill(); }
      c.restore();
    }
  }

  /* ---------- scene: sculptural GRG ceiling ---------- */
  function grgScene() {
    const floor = 206, deck = 186, top = 18;
    // Circular GRG feature on the soffit: a dropped ring of curved segments around a raised, cove-lit dome.
    const C = [196, 30], RA = 100, RB = 20, TILT = -.06, cT = Math.cos(TILT), sT = Math.sin(TILT);
    const K0 = .68, FASCIA = 5, LIFT = 7, SEG = PI / 4, G0 = PI / 2 - SEG / 2, G1 = PI / 2 + SEG / 2;
    const E = (k, th, dy) => { const x = RA * k * Math.cos(th), y = RB * k * Math.sin(th); return [C[0] + x * cT - y * sT, C[1] + x * sT + y * cT + dy]; };
    const P = (k, th, d) => { const e = E(k, th, 0); return [e[0] + d[0], e[1] + d[1]]; };
    const sY = x => 78 - 21 * (x - 22) / 243;
    const mid = E(.84, PI / 2, 0), UNDER = [0, 16], XR = 186, X2 = 206;
    const held = p => [p.x + p.hip[0] + 8 - mid[0], p.gy + p.hip[1] - 14 - mid[1]];
    const segAt = (t, p) => {
      if (t < 4.4) return { d: held(p), front: 1 };
      if (t < 5.1) { const k = ease(span(t, 4.4, 5.1)); return { d: mixPt(held(p), UNDER, k), front: k < .9 }; }
      if (t < 5.6) return { d: mixPt(UNDER, [0, 0], outBack(span(t, 5.1, 5.6))), front: 0 };
      return { d: [0, 0], front: 0 };
    };
    const grips = (p, d) => { p.hN = toLocal(p, P(1, PI / 2 - .2, [d[0], d[1] + FASCIA])); p.hF = toLocal(p, P(1, PI / 2 + .3, [d[0], d[1] + FASCIA])); p.eN = -1; p.eF = -1; p.gN = 1; p.gF = 1; return p; };
    const holster = p => [8, p.hip[1] + 3];
    const jointPt = (th, q) => E(lerp(K0 - .03, 1.03, q), th + Math.sin(q * TAU) * .035, 0);
    const toolHand = (p, pt) => toLocal(p, [pt[0] - 4, pt[1] + 9]); // trowel blade rides 9px above the grip
    const P0 = x => pose({ x, gy: deck });
    const joint = (x, th) => (u, lt) => {
      const p = P0(x); p.look = .15; p.lean = -.04; p.head = -.42;
      const grab = span(lt, 0, .3), s = span(lt, .3, 1.3), back = span(lt, 1.3, 1.6), pass = s * 3, f = pass % 1;
      const pt = jointPt(th, sine(Math.floor(pass) % 2 ? 1 - f : f));
      p.hN = grab < 1 ? mixPt(holster(p), toolHand(p, jointPt(th, 0)), ease(grab)) : back > 0 ? mixPt(toolHand(p, pt), holster(p), ease(back)) : toolHand(p, pt);
      p.eN = -1; p.gN = 1; p.tool = grab > .5 && back < .5 ? 1 : 0;
      p.hF = toLocal(p, P(1, PI / 2, [0, FASCIA])); p.eF = -1; p.gF = 1;
      p.trowel = s > 0 && s < 1 ? pt : null;
      return p;
    };
    const timeline = seq([
      [2.8, walk(OFF_L, 120, floor, p => { p.carry = 1; return grips(p, held(p)); })],
      [.9, u => { const p = climb(120, floor, [[142, deck]])(u); p.carry = 1; return grips(p, held(p)); }],
      [.7, walk(137, XR, deck, p => { p.carry = 1; return grips(p, held(p)); })],
      [.7, u => { const p = P0(XR); p.carry = 1; p.lean = -.04 * u; p.head = -.35 * smooth(u); p.look = .15; return grips(p, segAt(4.4 + u * .7, p).d); }],
      [.5, u => { const p = P0(XR); p.carry = 1; p.lean = -.06; p.head = -.42; p.hip = [0, -65.5 - Math.sin(PI * u) * 2]; p.fN = [5, -3 - Math.sin(PI * u) * 4, Math.sin(PI * u) * .5]; p.fF = [-4, -7 - Math.sin(PI * u) * 3, Math.sin(PI * u) * .45]; return grips(p, segAt(5.1 + u * .5, p).d); }],
      [.6, u => { const p = P0(XR); p.lean = -.05; p.head = -.42; return grips(p, [0, -Math.abs(Math.sin(u * PI * 3)) * 1.2]); }],
      [1.6, joint(XR, G1)],
      [.6, walk(XR, X2, deck)],
      [1.6, joint(X2, G0)],
      [1.3, u => { const p = P0(X2); p.head = -.38 + Math.sin(u * PI * 2) * .05; p.look = .45; p.smile = smooth(u); p.hN = [19, -98.5 - Math.sin(PI * span(u, .2, .5)) * 3]; p.eN = -1; p.gN = 2; return p; }],
      [.5, walk(X2, 216, deck)],
      [.8, climb(216, deck, [[238, floor]])],
      [2.6, walk(233, 475, floor)],
      [1.2, stand(475, floor)]
    ]);
    const JOINTS = [[G1, 6.5], [G0, 8.7]], LIGHT = 10.2, RESET = 15.2;
    const lights = [0, 1, 2, 3, 4, 5, 6, 7].map(i => E(.44, i * SEG + SEG / 2, -LIFT));
    return {
      dur: timeline.dur, top, pose: timeline, line: 'Perfect circle.',
      back(c, t, r) {
        const reset = 1 - span(t, RESET, RESET + .8), glow = span(t, LIGHT, LIGHT + .6) * reset, seg = segAt(t, r.p);
        platform(c, deck, floor);
        // soffit with a cut-away front edge
        c.fillStyle = lin(c, 0, -10, 0, 80, ['#e6e9df', '#f3f4ee']); poly(c, [[-400, -300], [800, -300], [800, sY(800)], [-400, sY(-400)]]); c.fill();
        c.fillStyle = lin(c, 0, 50, 0, 70, ['#d3d9cc', '#bfc7b8']); poly(c, [[-400, sY(-400)], [800, sY(800)], [800, sY(800) + 5], [-400, sY(-400) + 5]]); c.fill();
        c.fillStyle = 'rgba(40,58,45,.14)'; poly(c, [[-400, sY(-400) + 5], [800, sY(800) + 5], [800, sY(800) + 12], [-400, sY(-400) + 12]]); c.fill();
        blob(c, C[0] + 3, C[1] + 6, 116, 30, .13);
        // raised dome inside the ring: cove reveal shows below the dome edge
        c.save(); ellipse(c, K0, 0); c.clip();
        c.fillStyle = lin(c, 0, C[1] - 12, 0, C[1] + 16, ['#b9bfb1', '#d3d7ca']); c.fill();
        if (glow) { c.fillStyle = lin(c, 0, C[1], 0, C[1] + 15, ['rgba(255,214,150,' + (.55 * glow) + ')', 'rgba(255,232,190,' + (.95 * glow) + ')']); c.fill(); }
        ellipse(c, K0, -LIFT); const dg = c.createRadialGradient(C[0] - 12, C[1] - LIFT - 4, 2, C[0], C[1] - LIFT, RA * K0);
        dg.addColorStop(0, '#fdfdf9'); dg.addColorStop(.7, '#eff1e9'); dg.addColorStop(1, '#dde0d5'); c.fillStyle = dg; c.fill();
        if (glow) { const wg = c.createRadialGradient(C[0], C[1] - LIFT + 14, 0, C[0], C[1] - LIFT + 14, 64); wg.addColorStop(0, 'rgba(255,228,176,' + (.55 * glow) + ')'); wg.addColorStop(1, 'rgba(255,228,176,0)'); c.fillStyle = wg; c.fill(); }
        c.strokeStyle = 'rgba(150,158,140,.38)'; c.lineWidth = .7; ellipse(c, .46, -LIFT); c.stroke();
        c.strokeStyle = 'rgba(48,58,52,.55)'; c.lineWidth = 1; arc(c, K0, -LIFT, .05, PI - .05); c.stroke();
        for (const l of lights) {
          if (glow) { const lg = c.createRadialGradient(l[0], l[1], 0, l[0], l[1], 6); lg.addColorStop(0, 'rgba(255,246,220,' + glow + ')'); lg.addColorStop(1, 'rgba(255,246,220,0)'); c.fillStyle = lg; c.fillRect(l[0] - 6, l[1] - 6, 12, 12); }
          c.fillStyle = glow > .5 ? '#fffaf0' : '#9aa094'; c.beginPath(); c.ellipse(l[0], l[1], 1.7, .9, 0, 0, TAU); c.fill();
        }
        c.restore();
        c.strokeStyle = 'rgba(120,128,112,.5)'; c.lineWidth = .6; ellipse(c, K0, 0); c.stroke();
        // dropped ring: open bay with framing until the last segment is fitted
        sector(c, K0, 1, G0, G1, 0, 0, [0, 0]); c.fillStyle = '#56625b'; c.fill();
        c.strokeStyle = '#a9b3a6'; c.lineWidth = 1.2; for (const k of [.76, .94]) { arc(c, k, -1.5, G0 + .04, G1 - .04); c.stroke(); }
        c.strokeStyle = 'rgba(169,179,166,.7)'; c.lineWidth = .8; c.beginPath(); for (const th of [G0 + .2, PI / 2, G1 - .2]) { const a = E(.72, th, -1.5), b = E(.98, th, -1.5); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke();
        for (let i = 1; i < 8; i++) fascia(c, G0 + i * SEG, G1 + i * SEG, [0, 0]);
        for (let i = 1; i < 8; i++) underside(c, G0 + i * SEG, G1 + i * SEG, [0, 0]);
        c.strokeStyle = 'rgba(150,158,142,.28)'; c.lineWidth = .6; c.beginPath();
        for (let i = 2; i < 8; i++) { const th = G0 + i * SEG, a = E(K0, th, 0), b = E(1, th, 0); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); if (Math.sin(th) > 0) c.lineTo(b[0], b[1] + FASCIA); }
        c.stroke();
        if (!seg.front && t < RESET + .8) {
          const alpha = t < 5.6 ? 1 : reset;
          c.save(); c.globalAlpha = alpha; fascia(c, G0, G1, seg.d); underside(c, G0, G1, seg.d);
          if (t >= 5.6) for (const [th, st] of JOINTS) {
            const done = span(t, st, st + 1), a = E(K0, th, 0), b = E(1, th, 0);
            c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], b[1] + FASCIA);
            c.strokeStyle = 'rgba(62,74,66,' + (.85 * (1 - done)) + ')'; c.lineWidth = 1.3; c.stroke();
            if (done) { c.strokeStyle = 'rgba(255,255,251,' + done + ')'; c.lineWidth = 2.4; c.stroke(); }
          }
          c.restore();
        }
        if (glow) {
          c.save(); c.globalCompositeOperation = 'lighter';
          for (const l of [lights[0], lights[1], lights[2]]) { c.fillStyle = lin(c, 0, l[1], 0, floor, ['rgba(255,240,205,' + (.13 * glow) + ')', 'rgba(255,240,205,0)']); poly(c, [[l[0] - 1.5, l[1]], [l[0] + 1.5, l[1]], [l[0] + 30, floor + 4], [l[0] - 30, floor + 4]]); c.fill(); }
          c.restore();
        }
      },
      front(c, t, r) {
        const p = r.p, seg = segAt(t, p);
        if (seg.front) { fascia(c, G0, G1, seg.d); underside(c, G0, G1, seg.d); }
        if (p.tool) {
          const w = r.world(r.wN);
          c.fillStyle = '#7a5f42'; rrect(c, w[0] + 2.4, w[1] - 6, 3.2, 7, 1.4); c.fill();
          c.fillStyle = lin(c, 0, w[1] - 10, 0, w[1] - 7, ['#f4f5f1', '#b9bdb6', '#8e938b']); rrect(c, w[0] - 5, w[1] - 9.6, 18, 2.8, .8); c.fill();
          c.fillStyle = '#f3f1e7'; c.beginPath(); c.ellipse(w[0] + 4, w[1] - 9.6, 5, 1.2, 0, PI, 0); c.fill();
        } else {
          const h = r.world(r.T(7, 3));
          c.save(); c.translate(h[0] - 2, h[1] + 3); c.rotate(1.35);
          c.fillStyle = '#7a5f42'; rrect(c, -2, -2.2, 7, 4.4, 2); c.fill();
          c.fillStyle = lin(c, 4, 2, 4, 6, ['#f4f5f1', '#b9bdb6', '#8e938b']); poly(c, [[5, 2.4], [18, 2.4], [19.5, 4], [18, 5.6], [5, 5.6]]); c.fill();
          c.restore();
        }
        if (p.trowel) { const g = c.createRadialGradient(p.trowel[0], p.trowel[1], 0, p.trowel[0], p.trowel[1], 9); g.addColorStop(0, 'rgba(255,255,250,.75)'); g.addColorStop(1, 'rgba(255,255,250,0)'); c.fillStyle = g; c.beginPath(); c.arc(p.trowel[0], p.trowel[1], 9, 0, TAU); c.fill(); }
        platformRail(c, deck);
      },
      emit(t, r, add) {
        const p = r.p;
        if (t > 5.45 && t < 5.65) for (let i = 0; i < 3; i++) { const pt = P(1, rand(G0, G1), [0, FASCIA]); add(pt[0], pt[1], rand(-8, 8), rand(2, 12), rand(.8, 1.4), rand(.6, 1.4), '236,236,226'); }
        if (p.trowel && Math.random() < .6) add(p.trowel[0] + rand(-3, 3), p.trowel[1] + 2, rand(-8, 8), rand(0, 10), rand(.6, 1.2), rand(.5, 1.3), '240,238,228');
      },
      still: 10.8
    };
    function ellipse(c, k, dy) { c.beginPath(); for (let i = 0; i <= 48; i++) { const p = E(k, i / 48 * TAU, dy); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.closePath(); }
    function arc(c, k, dy, a0, a1) { c.beginPath(); for (let i = 0; i <= 16; i++) { const p = E(k, lerp(a0, a1, i / 16), dy); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } }
    function sector(c, k0, k1, a0, a1, dy0, dy1, d) { // outer edge (k1, dy1) forward, inner edge (k0, dy0) back
      c.beginPath();
      for (let i = 0; i <= 14; i++) { const p = E(k1, lerp(a0, a1, i / 14), dy1); if (i) c.lineTo(p[0] + d[0], p[1] + d[1]); else c.moveTo(p[0] + d[0], p[1] + d[1]); }
      for (let i = 14; i >= 0; i--) { const p = E(k0, lerp(a0, a1, i / 14), dy0); c.lineTo(p[0] + d[0], p[1] + d[1]); }
      c.closePath();
    }
    function fascia(c, a0, a1, d) { sector(c, 1, 1, a0, a1, FASCIA, 0, d); c.fillStyle = lin(c, 0, C[1] + d[1] + 14, 0, C[1] + d[1] + 26, ['#d2d7ca', '#b6bdae']); c.fill(); }
    function underside(c, a0, a1, d) {
      sector(c, K0, 1, a0, a1, 0, 0, d); c.fillStyle = lin(c, C[0] - RA + d[0], 0, C[0] + RA + d[0], 0, ['#e9ebe2', '#fbfbf7', '#e2e5da']); c.fill();
      c.strokeStyle = 'rgba(150,158,140,.45)'; c.lineWidth = .6; c.save(); c.translate(d[0], d[1]); arc(c, .86, 0, a0, a1); c.stroke(); c.restore();
    }
  }

  /* ---------- reactions ---------- */
  const RD = 1.8, KINDS = ['wave', 'thumbs', 'hat', 'jump'], LINES = { wave: 'Salam!', hat: 'Safety first.', jump: 'Whoa!' };
  function reactPose(p, k, r) {
    const q = Object.assign({}, p), arc = x => Math.sin(PI * clamp(x, 0, 1));
    if (k === 'nod') { q.head = Math.sin(clamp(r / 1.3, 0, 1) * PI * 3) * .13; q.look = .8; q.smile = 1; return q; }
    // Straighten up out of any work crouch, then gesture with whichever hand is free.
    const hy = lerp(p.hip[1], -65.5, .85), sy = hy - 37, far = p.busyN && k !== 'jump', dx = far ? -6 : 0;
    q.hip = [p.hip[0] * .3, hy]; q.lean = p.lean * .25; q.look = .95; q.smile = 1; q.head = -.06;
    const set = (pt, grip) => { if (far) { q.hF = [pt[0] + dx, pt[1]]; q.eF = -1; q.gF = grip; } else { q.hN = pt; q.eN = -1; q.gN = grip; } };
    if (k === 'wave') { set([(far ? -8 : 15) + Math.sin(r * 12) * 5, sy - 29 + Math.cos(r * 12) * 1.5], 1); q.head = -.05 + Math.sin(r * 2.6) * .05; }
    else if (k === 'thumbs') { set([19, sy + 4 - arc(r / .5) * 3], 2); q.head = -.03 + Math.sin(r * 6) * .04 * (r < 1 ? 1 : 0); }
    else if (k === 'hat') { const a = arc((r - .15) / 1.1); set([12, sy - 19 - a * 2], 1); q.tilt = -.24 * a; q.hat = 2.5 * a; q.head = .14 * a; }
    else {
      const j = arc((r - .14) / .6) * 15, dip = r < .14 ? arc(r / .14) * 5 : r > .74 && r < 1.02 ? arc((r - .74) / .28) * 6 : 0, f = j * .72;
      q.hip = [q.hip[0], hy - j + dip]; q.fN = [p.fN[0] + j * .2, p.fN[1] - f, -.2 * j / 15]; q.fF = [p.fF[0] - j * .1, p.fF[1] - f, -.15 * j / 15];
      q.hN = [14, sy - j - 35]; q.hF = [-6, sy - j - 31]; q.eN = -1; q.eF = -1; q.gN = 1; q.gF = 1;
      q.hat = arc((r - .22) / .72) * 10; q.tilt = q.hat * .025; q.oh = 1; q.smile = 0;
    }
    return q;
  }

  /* ---------- scene runner ---------- */
  const DEFS = { partition: partitionScene, ceiling: ceilingScene, grg: grgScene };
  function makeScene(canvas, def, offset) {
    const c = canvas.getContext('2d');
    const motes = Array.from({ length: 18 }, () => ({ x: rand(140, 400), y: rand(0, 220), vx: rand(-3, 3), vy: rand(-4, 2), r: rand(.4, 1.1), ph: rand(0, TAU) }));
    const bits = [];
    let t = offset, ts = 1, clock = rand(0, 10), react = null, count = 0, look = 0, glance = 0, hoverOn = false, blinkIn = rand(1, 3), blinkT = 0;
    let cw = 0, ch = 0, dpr = 1, s = 1, ox = 0, oy = 0, rig = null;
    function resize() {
      const b = canvas.getBoundingClientRect();
      cw = b.width; ch = b.height; dpr = Math.min(2, window.devicePixelRatio || 1);
      if (!cw || !ch) return false;
      canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
      s = Math.min(cw / W, ch / H); ox = (cw - W * s) / 2; oy = (ch - H * s) / 2;
      return true;
    }
    const add = (x, y, vx, vy, life, size, color) => { if (bits.length < 140) bits.push({ x, y, vx, vy, life, max: life, size, color }); };
    function render(dt, still) {
      if (!cw && !resize()) return;
      if (still && motion.matches) t = def.still;
      if (!still) {
        if (react) { react.r += dt; if (react.r > RD) react = null; }
        ts += ((react ? 0 : 1) - ts) * Math.min(1, dt * 7);
        t = (t + dt * ts) % def.dur; clock += dt;
        blinkIn -= dt; if (blinkIn < 0) { blinkT = .13; blinkIn = rand(2, 4.5); } blinkT -= dt;
        glance = Math.max(0, glance - dt);
        look += ((hoverOn || glance > 0 ? 1 : 0) - look) * Math.min(1, dt * 5);
      }
      let p = def.pose(t);
      if (react) { const e = smooth(span(react.r, 0, .22)) * (1 - smooth(span(react.r, RD - .4, RD))); p = blend(p, reactPose(p, react.kind, react.r), e); }
      else if (look > .01) p = Object.assign({}, p, { look: lerp(p.look, .85, look), smile: Math.max(p.smile, look * .7) });
      rig = solve(p, Math.sin(clock * 2.2) * .45);
      c.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      for (const m of motes) { m.x += (m.vx + Math.sin(clock * .7 + m.ph) * 2) * dt; m.y += m.vy * dt; if (m.y < -10) m.y = 225; if (m.y > 230) m.y = -8; if (m.x < 120) m.x = 400; if (m.x > 410) m.x = 125; }
      room(c, def.top, clock, motes);
      def.back(c, t, rig);
      c.save(); c.translate(p.x, p.gy); drawWorker(c, rig, clock, blinkT > 0); c.restore();
      def.front(c, t, rig);
      if (!still && ts > .5) def.emit(t, rig, add);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i]; b.life -= dt; if (b.life <= 0) { bits.splice(i, 1); continue; }
        b.vy += 34 * dt; b.vx *= 1 - dt * 1.5; b.x += b.vx * dt; b.y += b.vy * dt;
        c.fillStyle = 'rgba(' + b.color + ',' + (b.life / b.max * .9).toFixed(3) + ')'; c.beginPath(); c.arc(b.x, b.y, b.size, 0, TAU); c.fill();
      }
      if (react) {
        const e = smooth(span(react.r, 0, .3)) * (1 - smooth(span(react.r, RD - .3, RD))), hc = rig.world(rig.hc);
        bubble(c, clamp(hc[0] + 20, 40, 340), Math.max(20, hc[1] - 24 - p.hat * .5), react.line, e, outBack(span(react.r, 0, .35)) * .3 + .7);
      }
      const vy0 = -oy / s - 1, vh = ch / s + 2, sideL = lin(c, STAGE[0] - MASK, 0, STAGE[0], 0, ['rgba(236,239,231,1)', 'rgba(236,239,231,0)']), sideR = lin(c, STAGE[1], 0, STAGE[1] + MASK, 0, ['rgba(236,239,231,0)', 'rgba(236,239,231,1)']);
      c.fillStyle = sideL; c.fillRect(-ox / s - 1, vy0, STAGE[0] + ox / s + 1, vh);
      c.fillStyle = sideR; c.fillRect(STAGE[1], vy0, (cw - ox) / s - STAGE[1] + 1, vh);
      c.strokeStyle = 'rgba(160,176,156,.45)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(30, 225); c.lineTo(350, 225); c.stroke();
      c.strokeStyle = '#7c9274'; c.beginPath(); c.moveTo(30, 225); c.lineTo(30 + 320 * (t / def.dur), 225); c.stroke();
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const edge = c.createLinearGradient(0, 0, cw, 0);
      edge.addColorStop(0, 'rgba(236,239,231,1)'); edge.addColorStop(.07, 'rgba(236,239,231,0)'); edge.addColorStop(.93, 'rgba(236,239,231,0)'); edge.addColorStop(1, 'rgba(236,239,231,1)');
      c.fillStyle = edge; c.fillRect(0, 0, cw, ch);
    }
    function toScene(e) { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left - ox) / s, (e.clientY - b.top - oy) / s]; }
    function hit(pt) {
      if (!rig) return false; const p = rig.p, x = p.x + p.hip[0], hc = rig.world(rig.hc);
      return pt[0] > x - 22 && pt[0] < x + 28 && pt[1] > hc[1] - 22 && pt[1] < p.gy + Math.max(p.sN, p.sF) + 6;
    }
    canvas.addEventListener('pointermove', e => { hoverOn = hit(toScene(e)); canvas.style.cursor = hoverOn ? 'pointer' : ''; });
    canvas.addEventListener('pointerleave', () => { hoverOn = false; canvas.style.cursor = ''; });
    canvas.addEventListener('click', e => {
      if (motion.matches) return;
      if (!hit(toScene(e))) { glance = .9; return; }
      if (react && react.r < 1.1) return;
      const carry = rig && rig.p.carry, kind = carry ? 'nod' : KINDS[count++ % KINDS.length];
      react = { kind, r: 0, line: LINES[kind] || def.line };
      if (kind === 'jump') { const p = rig.p; for (let i = 0; i < 8; i++) add(p.x + rand(-10, 14), p.gy + rand(-2, 3), rand(-26, 26), rand(-14, -2), rand(.4, .8), rand(.7, 1.5), '214,220,206'); }
    });
    return { render, resize };
  }
  function bubble(c, x, y, text, a, k) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(k, k);
    c.font = '600 8.5px "Helvetica Neue",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + 14;
    c.fillStyle = 'rgba(30,45,37,.14)'; rrect(c, -w / 2 + 1, -14, w, 15, 7.5); c.fill();
    c.fillStyle = '#fffef9'; rrect(c, -w / 2, -15.5, w, 15, 7.5); c.fill(); poly(c, [[-9, -2], [-2, -2], [-13, 4]]); c.fill();
    c.strokeStyle = 'rgba(70,90,75,.22)'; c.lineWidth = .6; rrect(c, -w / 2, -15.5, w, 15, 7.5); c.stroke();
    c.fillStyle = '#26382e'; c.fillText(text, 0, -7.8);
    c.restore();
  }

  const scenes = canvases.map((canvas, i) => { const make = DEFS[canvas.dataset.craft]; return make ? makeScene(canvas, make(), i * 1.3) : null; }).filter(Boolean);
  let running = false, last = 0, raf = 0;
  const visible = () => !menu.hidden && !document.hidden;
  function tick(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; for (const s of scenes) s.render(dt, false); raf = requestAnimationFrame(tick); }
  function sync() {
    const on = visible() && !motion.matches;
    if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(tick); }
    else if (!on && running) { running = false; cancelAnimationFrame(raf); }
    if (visible() && motion.matches) for (const s of scenes) { s.resize(); s.render(0, true); }
  }
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => { for (const s of scenes) s.resize(); if (!running && visible()) for (const s of scenes) s.render(0, true); }); canvases.forEach(cv => ro.observe(cv)); }
  new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', sync);
  if (motion.addEventListener) motion.addEventListener('change', sync);
  sync();
})();
