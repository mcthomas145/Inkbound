import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ============================================================
   INKBOUND — a stick figure fighting game
   ============================================================ */

const W = 960, H = 540, GROUND = 462, GRAV = 0.86;

const C = {
  paper:   '#E8DFC8',
  paper2:  '#DDD2B6',
  graphite:'#22201C',
  blue:    '#8EC5DC',
  blueDk:  '#4A7C93',
  red:     '#C4452F',
  ink:     '#F2C94C',
  purple:  '#6B4E9B',
  green:   '#5E8C61',
  night:   '#1B1A17',
};

const FONT_DISP = '"Arial Narrow","Helvetica Neue",Impact,sans-serif';
const FONT_DATA = '"Courier New",Courier,monospace';
const FONT_HAND = '"Bradley Hand","Segoe Print","Comic Sans MS",cursive';

/* ---------------- WEAPONS ---------------- */
const WEAPONS = [
  { id:'fists',   name:'Bare Hands',        cost:0,    dmg:9,  range:38, speed:1.00, kb:4,  shape:'none',   desc:'Two of them. Free.' },
  { id:'pencil', special:'GRAFFITO',  name:'Pencil Shiv',       cost:100,  dmg:13, range:46, speed:1.05, kb:5,  shape:'pencil', desc:'Snapped in half, sharpened on the desk edge.' },
  { id:'ruler', special:'STRAIGHT EDGE',   name:'Ruler Blade',       cost:280,  dmg:18, range:60, speed:0.94, kb:7,  shape:'ruler',  desc:'Thirty centimetres of unforgiving straight.' },
  { id:'eraser', special:'BLANK SLATE',  name:'Eraser Maul',       cost:560,  dmg:31, range:50, speed:0.66, kb:16, shape:'maul',   desc:'Slow. Removes the problem entirely.' },
  { id:'compass', special:'FULL CIRCLE', name:'Compass Spear',     cost:900, dmg:21, range:82, speed:0.84, kb:8,  shape:'spear',  desc:'Keeps everyone at arm\u2019s length. Then some.' },
  { id:'nibs', special:'CROSSHATCH',    name:'Twin Nibs',         cost:1400, dmg:12, range:44, speed:1.55, kb:3,  shape:'nibs',   desc:'Two fast hits where one used to go.' },
  { id:'marker', special:'HIGHLIGHT REEL',  name:'Highlighter',       cost:2200, dmg:26, range:66, speed:1.10, kb:9,  shape:'marker', glow:C.ink, desc:'Marks what matters. Loudly.' },
  { id:'stylus', special:'REVISION',  name:'Architect\u2019s Stylus', cost:3800, dmg:38, range:72, speed:1.18, kb:11, shape:'stylus', glow:C.purple, desc:'A prototype. It was never meant to leave the desk.' },
];

/* ---------------- SKINS ---------------- */
const SKINS = [
  { id:'graphite', name:'Graphite',      cost:0,    line:'#22201C', accent:'#5A554A', desc:'Standard 2B. How everyone starts.' },
  { id:'roughs',   name:'Non-Photo Blue',cost:120,  line:'#4A7C93', accent:'#8EC5DC', desc:'The colour of a drawing not finished yet.' },
  { id:'redpen',   name:'Editor\u2019s Red', cost:280, line:'#C4452F', accent:'#E88A72', desc:'Every line on you is a correction.' },
  { id:'charcoal', name:'Charcoal',      cost:500,  line:'#0D0D0D', accent:'#4A4A4A', thick:1.4, desc:'Thick, smudged, hard to erase.' },
  { id:'mint',     name:'Ditto Green',   cost:800, line:'#3F7A4A', accent:'#9BD3A4', desc:'Fresh off the copier, still warm.' },
  { id:'gold',     name:'Gold Leaf',     cost:1300, line:'#B8860B', accent:'#F2C94C', glow:true, desc:'Reserved for finished work.' },
  { id:'violet',   name:'Duplicator',    cost:2000, line:'#6B4E9B', accent:'#B49BD6', glow:true, desc:'The Architect\u2019s own purple. Stolen.' },
  { id:'ghost',    name:'Tracing Paper', cost:2800, line:'#7E7A70', accent:'#C9C3B4', ghost:true, desc:'You can see straight through. So can they.' },
];

/* ---------------- CLOTHING ---------------- */
const WEARS = [
  { id:'none',    name:'Nothing',        cost:0,    slot:'head', desc:'Bare line.' },
  { id:'band',    name:'Headband',       cost:120,  slot:'head', perk:{ speed:0.04 },  desc:'Keeps the graphite out of your eyes. +4% move speed.' },
  { id:'cap',     name:'Backwards Cap',  cost:320,  slot:'head', perk:{ atkSpeed:0.04 },desc:'+4% attack speed. Purely psychological.' },
  { id:'antenna', name:'Antenna',        cost:600,  slot:'head', perk:{ ink:0.05 },    desc:'Picks up loose signal. +5% ink earned.' },
  { id:'tophat',  name:'Top Hat',        cost:950, slot:'head', perk:{ hp:10 },       desc:'+10 max health. Dignity is armour.' },
  { id:'crown',   name:'Paper Crown',    cost:1900, slot:'head', perk:{ ink:0.10 },    desc:'+10% ink earned. Folded from a losing draft.' },
  { id:'cape',    name:'Draft Cape',     cost:700,  slot:'back', perk:{ speed:0.06 },  desc:'+6% move speed. It catches the air from the fan.' },
  { id:'wings',   name:'Sketch Wings',   cost:2200, slot:'back', perk:{ speed:0.05, dash:1 }, desc:'+5% speed and one extra dash charge.' },
  { id:'scarf',   name:'Long Scarf',     cost:1200, slot:'back', perk:{ hp:15 },       desc:'+15 max health. Mostly for the trailing.' },
  { id:'nothingb',name:'No Back',        cost:0,    slot:'back', desc:'Nothing behind you.' },
];

/* ---------------- UPGRADES (the compounding loop) ---------------- */
const UPGRADES = [
  { id:'vit',  name:'Vitality',  max:8,  base:80,  mult:1.4, per:'+14 max health',      icon:'\u2665' },
  { id:'pow',  name:'Power',     max:10, base:95, mult:1.42, per:'+8% damage',          icon:'\u2694' },
  { id:'swift',name:'Swiftness', max:8,  base:110, mult:1.44, per:'+5% move speed',      icon:'\u21C9' },
  { id:'fero', name:'Ferocity',  max:8,  base:125, mult:1.44, per:'+6% attack speed',    icon:'\u26A1' },
  { id:'wind', name:'Second Wind',max:4, base:350, mult:1.7, per:'+1 dash charge',      icon:'\u21BB' },
  { id:'fort', name:'Fortune',   max:8,  base:180, mult:1.46, per:'+9% ink from levels', icon:'\u2726' },
];
const upCost = (u, lvl) => Math.round(u.base * Math.pow(u.mult, lvl));

/* ---------------- CHAPTERS + LEVELS ---------------- */
const CHAPTERS = [
  { id:1, name:'THE MARGIN',        color:C.graphite, blurb:'The thin strip of blank at the edge of the page. Nobody important is drawn here.' },
  { id:2, name:'THE ERASER FIELDS', color:'#9A9384',  blurb:'Everything half-removed. The ground remembers what used to stand on it.' },
  { id:3, name:'THE GRID',          color:C.blueDk,   blurb:'Ruled lines all the way down. Nothing here is allowed to curve.' },
  { id:4, name:'THE PALETTE',       color:'#B05A8A',  blurb:'Wet, loud and unfinished. Colour was never meant to get out of the tray.' },
  { id:5, name:'THE DRAFT',         color:'#7A6A55',  blurb:'Where rejected versions of everyone are kept. Including you.' },
  { id:6, name:'THE FINAL PAGE',    color:C.purple,   blurb:'One sheet. One desk lamp. One hand still holding the pen.' },
];

const mk = (id, ch, name, kind, waves, gold, ink, story) =>
  ({ id, ch, name, kind, waves, gold, ink, story });

const LEVELS = [
  mk(1,1,'First Line','fight',[['scribbler',3]],6,110,
    'You wake up as four lines and a circle. Someone drew you in the margin and then stopped paying attention.\n\nThere is scribbling nearby. It is coming toward you.'),
  mk(2,1,'Crossed Out','fight',[['scribbler',3],['scribbler',4]],12,150,
    'A voice from somewhere above the page: "Rough. Keep going."\n\nYou keep going.'),
  mk(3,1,'SCRIBBLE','boss',[['boss','scribble']],26,400,
    'It is what happens to a drawing when the hand gets angry. Every wrong line the Architect ever made, balled up and left alive in the margin.\n\nIt does not want anything. That is what makes it hard.'),
  mk(4,2,'White Noise','fight',[['dasher',3],['scribbler',3],['dasher',3]],15,220,
    'Past the margin, the page goes pale. Whole shapes stand around with their outlines missing, waiting to be finished. They will not be.\n\nOne of them notices you still have all of yours.'),
  mk(5,2,'Half-Erased','fight',[['scribbler',4],['lobber',2],['dasher',4]],22,270,
    'A stick figure with no legs drags itself out of your way. "He erases the ones who ask questions," it says. "Ask fewer."\n\nYou ask which way.'),
  mk(6,2,'SMUDGE','boss',[['boss','smudge']],36,620,
    'The Architect\u2019s second mistake: he tried to rub out the first one. SMUDGE is what the rubbing became.\n\nIt has no edge to hit. You will have to find where it stops being blurry.'),
  mk(7,3,'Ruled Lines','fight',[['brute',2],['scribbler',4],['lobber',2]],28,330,
    'The Grid begins exactly where the Eraser Fields end, on a line you could measure. Everything stands at right angles. Everything is waiting for permission.\n\nYou are the only curve here.'),
  mk(8,3,'Right Angles','fight',[['dasher',4],['brute',2],['lobber',3]],28,380,
    'They march in squares. They turn in ninety degrees. A guard stops you and asks for your reference number.\n\nYou tell it your name instead.'),
  mk(9,3,'THE STRAIGHTEDGE','boss',[['boss','straightedge']],38,950,
    'It was drawn to keep the world tidy and it has never once been wrong, because it decides what wrong means.\n\nIt has read your file. It is disappointed.'),
  mk(10,4,'Wet Paint','fight',[['lobber',3],['dasher',4],['brute',2]],24,440,
    'Colour gets out of the tray and nothing behaves. The ground is tacky. Shapes bleed into each other and come apart wrong.\n\nSomething red is having a very good time up ahead.'),
  mk(11,4,'Running Colours','fight',[['brute',2],['copy',2],['lobber',3],['dasher',3]],32,510,
    'The Architect keeps his failures separated by hue so they cannot mix and organise.\n\nYou walk through the dividing line. They mix.'),
  mk(12,4,'CHROMA','boss',[['boss','chroma']],38,1380,
    'Four moods in one body, and it changes which one it is whenever it gets bored.\n\nRead the colour. The colour is the only warning you get.'),
  mk(13,5,'Rough Sketch','fight',[['copy',2],['brute',2],['dasher',4],['scribbler',4]],26,580,
    'The Draft is a drawer. Every version of everything that got thrown out is still in here, still moving.\n\nYou see three of yourself before you stop counting.'),
  mk(14,5,'Tracing Paper','fight',[['copy',3],['lobber',3],['brute',3],['copy',2]],30,690,
    'They copy your stance. Your weapon. The way you favour one side when you\u2019re tired.\n\nThe only thing they cannot copy is that you chose to come here.'),
  mk(15,5,'THE UNDERSTUDY','boss',[['boss','understudy']],42,2000,
    'Version one. Drawn before you, with the same hand, on a better morning \u2014 and then set aside for reasons never written down.\n\nIt has been practising for this the entire time you were alive.'),
  mk(16,6,'The Gutter','fight',[['brute',3],['copy',3],['dasher',4],['lobber',4]],32,760,
    'The seam where two pages meet. The lamp is close enough now to feel warm.\n\nEverything he has left throws itself into the gap.'),
  mk(17,6,'Last Margin','fight',[['copy',4],['brute',4],['dasher',5],['lobber',4]],34,900,
    'One strip of blank between you and him. It is the same margin you woke up in, at the other end of the page.\n\nThe hand above stops moving. It has seen you.'),
  mk(18,6,'THE ARCHITECT','boss',[['boss','architect']],55,3600,
    'He is not larger than you. That is the first surprise.\n\nHe holds the pen the way you hold your weapon, and he says, without much interest: "You were a warm-up. I do this every morning."'),
];

const CH_END = {
  1:'The scribble comes apart into loose loops and drifts up off the page.\n\nIn the blank it leaves behind, something is written in a hand you do not recognise: FIVE MORE. THEN ME.',
  2:'The smudge thins out until it is only a grey suggestion, and then not even that.\n\nBeyond it the paper turns to graph. Every square exactly the same size. Someone measured all of this on purpose.',
  3:'The Straightedge snaps clean in two and both halves lie perfectly parallel, which seems to satisfy it.\n\nAhead, the ruled lines stop dead and the colour begins, all at once, like a spill.',
  4:'Chroma runs out of moods and settles, finally, into plain grey.\n\nPast the drying puddles there is a drawer, slightly open. Your own face is looking out of it.',
  5:'The Understudy lowers its guard before you land the last hit. You are almost certain that was deliberate.\n\n"Tell him," it says, coming apart, "that I remembered the whole time."',
  6:'The pen rolls off the edge of the desk.\n\nThe hand above the page pulls back, and for the first time the light is not coming from a lamp. You walk to the corner of the sheet, and step off it, and the story does not follow you.\n\nYou drew that part yourself.',
};

const chapterLevels = (ch) => LEVELS.filter(l => l.ch === ch);

/* ---------------- ENEMIES ---------------- */
const ENEMIES = {
  scribbler:{ hp:36, spd:1.9, dmg:8,  reach:46, cd:1150, wind:300, w:24, h:62, ink:3,  col:C.graphite, label:'Scribbler' },
  dasher:   { hp:28, spd:3.6, dmg:10, reach:44, cd:900,  wind:210, w:22, h:58, ink:4,  col:'#7A6A55',  label:'Dasher', lunge:true },
  lobber:   { hp:30, spd:1.5, dmg:9,  reach:340,cd:1700, wind:520, w:24, h:60, ink:5,  col:C.blueDk,   label:'Lobber', ranged:true, keep:230 },
  brute:    { hp:96, spd:1.25,dmg:19, reach:60, cd:1900, wind:640, w:38, h:80, ink:9,  col:'#5A554A',  label:'Brute', heavy:true },
  copy:     { hp:62, spd:2.9, dmg:14, reach:56, cd:1100, wind:300, w:26, h:66, ink:11, col:'#8A7FA8',  label:'Copy', mirror:true },
};

/* ---------------- BOSSES ---------------- */
const BOSSES = {
  scribble:{ name:'SCRIBBLE', hp:460, w:88, h:104, col:C.graphite, spd:1.7, contact:9, art:'scribble',
    phases:[{at:1,moves:['lunge','sweep']},{at:0.55,moves:['lunge','sweep','summon','spin']}],
    quips:['[it does not speak. it only tangles.]'] },
  smudge:{ name:'SMUDGE', hp:820, w:96, h:100, col:'#8B8478', spd:2.1, contact:11, art:'smudge',
    phases:[{at:1,moves:['blink','sweep','volley']},{at:0.5,moves:['blink','volley','rain','summon']}],
    quips:['"you can\u2019t hit what hasn\u2019t settled."','"i was a mistake he tried to fix. now i\u2019m two."'] },
  straightedge:{ name:'THE STRAIGHTEDGE', hp:1250, w:64, h:132, col:C.blueDk, spd:2.0, contact:12, art:'straight',
    phases:[{at:1,moves:['beam','slam','sweep']},{at:0.6,moves:['beam','slam','grid','lunge']},{at:0.3,moves:['beam','grid','slam','lunge','volley']}],
    quips:['"you are not to scale."','"i have measured you. you are within tolerance of nothing."','"correction is not cruelty."'] },
  chroma:{ name:'CHROMA', hp:1750, w:82, h:118, col:'#B05A8A', spd:2.4, contact:13, art:'chroma',
    phases:[{at:1,moves:['volley','lunge','sweep']},{at:0.7,moves:['rain','blink','volley','spin']},{at:0.35,moves:['rain','spin','volley','summon','lunge']}],
    quips:['"pick a favourite. i\u2019ll be the other one."','"red now. keep up."','"you\u2019re all one colour. how do you stand it?"'] },
  understudy:{ name:'THE UNDERSTUDY', hp:2400, w:30, h:70, col:'#7A6A55', spd:3.6, contact:10, art:'stick',
    phases:[{at:1,moves:['lunge','sweep','blink']},{at:0.65,moves:['lunge','sweep','blink','volley','slam']},{at:0.3,moves:['lunge','blink','spin','slam','sweep']}],
    quips:['"he used your name on me first."','"i know the ending. i was drawn holding it."','"go on. finish the sketch."'] },
  architect:{ name:'THE ARCHITECT', hp:3300, w:34, h:76, col:C.purple, spd:3.2, contact:12, art:'architect',
    phases:[{at:1,moves:['beam','volley','lunge','sweep']},
            {at:0.75,moves:['grid','beam','summon','blink','slam']},
            {at:0.45,moves:['rain','spin','beam','blink','volley','slam']},
            {at:0.18,moves:['rain','grid','spin','beam','lunge','summon','volley']}],
    quips:['"stand still. you\u2019re smudging."','"i drew the floor you\u2019re standing on."','"do you know how many of you there have been?"','"fine. FINE. hold still and i\u2019ll do it properly."'] },
};

/* ---------------- SAVE / STORAGE ---------------- */
const SAVE_KEY = 'inkbound-save-v1';
const LB_KEY = 'inkbound-leaderboard-v1';

const freshSave = (name) => ({
  name, ink:0, totalInk:0, level:1, cleared:{}, best:{}, deaths:0, runs:0,
  weapon:'fists', skin:'graphite', head:'none', back:'nothingb',
  ownedW:['fists'], ownedS:['graphite'], ownedC:['none','nothingb'],
  ups:{ vit:0, pow:0, swift:0, fero:0, wind:0, fort:0 },
  seenStory:{}, muted:false, created:Date.now(),
});

/* Bump VERSION on every deploy so testers can tell you which build they are on.
   It is shown at the bottom of Settings. */
const VERSION = '1.1.0';

/* Old saves are merged onto a fresh one, so adding a new upgrade, wearable or
   save field in a later build never leaves an existing player with undefined
   in it. Only bump SAVE_KEY if you change the shape so much that a merge
   cannot rescue it -- that wipes everyone's progress. */
function migrateSave(raw) {
  if (!raw || typeof raw !== 'object' || !raw.name) return null;
  const base = freshSave(raw.name);
  const out = { ...base, ...raw };
  out.ups = { ...base.ups, ...(raw.ups || {}) };
  Object.keys(out.ups).forEach(k => { if (typeof out.ups[k] !== 'number' || !isFinite(out.ups[k])) out.ups[k] = 0; });
  ['cleared', 'best', 'seenStory'].forEach(k => { if (!out[k] || typeof out[k] !== 'object') out[k] = {}; });
  ['ownedW', 'ownedS', 'ownedC'].forEach(k => {
    out[k] = Array.isArray(raw[k]) ? Array.from(new Set([...base[k], ...raw[k]])) : base[k];
  });
  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'fists';
  if (!SKINS.some(w => w.id === out.skin)) out.skin = 'graphite';
  if (!out.ownedW.includes(out.weapon)) out.weapon = 'fists';
  if (!out.ownedS.includes(out.skin)) out.skin = 'graphite';
  if (!out.ownedC.includes(out.head)) out.head = 'none';
  if (!out.ownedC.includes(out.back)) out.back = 'nothingb';
  out.ink = Math.max(0, Number(out.ink) || 0);
  out.level = clamp(Math.round(Number(out.level) || 1), 1, LEVELS.length);
  return out;
}

async function loadSave() {
  try { const r = await window.storage.get(SAVE_KEY); return r ? migrateSave(JSON.parse(r.value)) : null; }
  catch { return null; }
}
async function writeSave(s) {
  try { await window.storage.set(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* offline */ }
}
async function loadBoard() {
  try { const r = await window.storage.get(LB_KEY, true); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
}
async function submitTime(name, levelId, ms) {
  try {
    const board = await loadBoard();
    const key = 'L' + levelId;
    const rows = board[key] || [];
    const mine = rows.find(r => r.n === name);
    if (mine) { if (ms < mine.t) mine.t = ms; } else { rows.push({ n:name, t:ms }); }
    rows.sort((a,b) => a.t - b.t);
    board[key] = rows.slice(0, 30);
    await window.storage.set(LB_KEY, JSON.stringify(board), true);
    return board;
  } catch { return null; }
}

/* ---------------- DERIVED STATS ---------------- */
function perksOf(s) {
  const out = { speed:0, atkSpeed:0, hp:0, ink:0, dash:0 };
  [s.head, s.back].forEach(id => {
    const w = WEARS.find(x => x.id === id);
    if (w && w.perk) for (const k in w.perk) out[k] += w.perk[k];
  });
  return out;
}
function statsOf(s) {
  const u = s.ups, p = perksOf(s);
  const wp = WEAPONS.find(w => w.id === s.weapon) || WEAPONS[0];
  return {
    maxHp:  Math.round(100 + u.vit * 14 + p.hp),
    dmgMul: 1 + u.pow * 0.08,
    spd:    4.3 * (1 + u.swift * 0.05 + p.speed),
    atkMul: 1 + u.fero * 0.06 + p.atkSpeed,
    dashes: 1 + u.wind + p.dash,
    inkMul: 1 + u.fort * 0.09 + p.ink,
    wp,
  };
}

/* ---------------- SMALL UTILS ---------------- */
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const rnd = (a,b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const fmt = (ms) => {
  if (ms == null) return '--:--.--';
  const t = Math.max(0, ms);
  const m = Math.floor(t / 60000), s = Math.floor(t / 1000) % 60, c = Math.floor(t / 10) % 100;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(c).padStart(2,'0')}`;
};
const commas = n => Math.round(n).toLocaleString();

/* ---------------- AUDIO ---------------- */
let AC = null;
function beep(type, muted) {
  if (muted) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime;
    const cfg = {
      hit:   { f:220, f2:90,  d:0.09, type:'square',   g:0.10 },
      heavy: { f:130, f2:50,  d:0.16, type:'sawtooth', g:0.13 },
      swing: { f:520, f2:300, d:0.06, type:'triangle', g:0.04 },
      hurt:  { f:180, f2:70,  d:0.14, type:'sawtooth', g:0.11 },
      jump:  { f:340, f2:600, d:0.09, type:'triangle', g:0.06 },
      dash:  { f:700, f2:260, d:0.10, type:'sine',     g:0.06 },
      ko:    { f:300, f2:60,  d:0.34, type:'square',   g:0.13 },
      win:   { f:440, f2:880, d:0.30, type:'triangle', g:0.11 },
      buy:   { f:660, f2:990, d:0.16, type:'sine',     g:0.09 },
      block: { f:900, f2:700, d:0.06, type:'square',   g:0.07 },
      coin:  { f:820, f2:1240,d:0.20, type:'triangle', g:0.09 },
      super: { f:180, f2:1400,d:0.42, type:'sawtooth', g:0.12 },
    }[type];
    if (!cfg) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = cfg.type; o.frequency.setValueAtTime(cfg.f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, cfg.f2), t + cfg.d);
    g.gain.setValueAtTime(cfg.g, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + cfg.d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + cfg.d + 0.02);
  } catch (e) { /* no audio */ }
}

/* ============================================================
   HAND-DRAWN CANVAS PRIMITIVES
   Every stroke wobbles on a 3-frame cycle, like a pencil test.
   ============================================================ */
let BOIL = 0;
const hash = (a, b) => {
  let x = Math.sin(a * 127.1 + b * 311.7 + BOIL * 74.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
};

function jline(ctx, x1, y1, x2, y2, seed = 0, amp = 1.1) {
  const mx = (x1 + x2) / 2 + hash(seed, 1) * amp * 1.6;
  const my = (y1 + y2) / 2 + hash(seed, 2) * amp * 1.6;
  ctx.beginPath();
  ctx.moveTo(x1 + hash(seed, 3) * amp, y1 + hash(seed, 4) * amp);
  ctx.quadraticCurveTo(mx, my, x2 + hash(seed, 5) * amp, y2 + hash(seed, 6) * amp);
  ctx.stroke();
}
function jcirc(ctx, cx, cy, r, seed = 0, amp = 1.0, fill = null) {
  ctx.beginPath();
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr = r + hash(seed, i) * amp;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}
function jrect(ctx, x, y, w, h, seed = 0, amp = 1.0, fill = null) {
  ctx.beginPath();
  ctx.moveTo(x + hash(seed,1)*amp, y + hash(seed,2)*amp);
  ctx.lineTo(x+w + hash(seed,3)*amp, y + hash(seed,4)*amp);
  ctx.lineTo(x+w + hash(seed,5)*amp, y+h + hash(seed,6)*amp);
  ctx.lineTo(x + hash(seed,7)*amp, y+h + hash(seed,8)*amp);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}

/* ============================================================
   ARENA BACKDROPS — one per chapter
   ============================================================ */
function drawArena(ctx, ch, tick, dark) {
  const bg = dark ? C.night : (ch === 2 ? '#EFEADC' : ch === 6 ? '#242028' : C.paper);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const lineCol = dark ? '#3A3630' : C.paper2;
  ctx.save();
  ctx.lineWidth = 1; ctx.strokeStyle = lineCol;

  if (ch === 1) {
    ctx.strokeStyle = 'rgba(196,69,47,0.35)'; ctx.lineWidth = 2;
    jline(ctx, 96, 0, 96, H, 900, 2);
    ctx.strokeStyle = lineCol; ctx.lineWidth = 1;
    for (let y = 60; y < H; y += 34) jline(ctx, 0, y, W, y, y, 1.4);
  } else if (ch === 2) {
    for (let i = 0; i < 14; i++) {
      const x = ((i * 137) % (W - 100)) + 50, y = 120 + ((i * 91) % 300);
      ctx.strokeStyle = `rgba(120,114,100,${0.05 + (i % 4) * 0.03})`;
      ctx.lineWidth = 3;
      jcirc(ctx, x, y, 26 + (i % 5) * 9, i * 7, 5);
    }
  } else if (ch === 3) {
    ctx.strokeStyle = dark ? '#2E3D45' : 'rgba(142,197,220,0.55)';
    for (let x = 0; x <= W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = dark ? '#3E5560' : 'rgba(74,124,147,0.5)'; ctx.lineWidth = 2;
    for (let x = 0; x <= W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  } else if (ch === 4) {
    const cols = ['#B05A8A','#E0A02F','#5E8C61','#4A7C93','#C4452F'];
    for (let i = 0; i < 11; i++) {
      const x = ((i * 197) % (W - 80)) + 40, y = 80 + ((i * 131) % 340);
      ctx.globalAlpha = 0.11; ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const a = (k / 12) * Math.PI * 2, rr = 30 + ((i * k) % 40);
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.7;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
  } else if (ch === 5) {
    ctx.globalAlpha = 0.16; ctx.strokeStyle = dark ? '#6A6355' : '#8A8270'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const x = 70 + i * 130, y = GROUND;
      jline(ctx, x, y, x, y - 60, i * 3, 2);
      jcirc(ctx, x, y - 72, 11, i * 5, 2);
      jline(ctx, x, y - 52, x - 16, y - 34, i * 9, 2);
      jline(ctx, x, y - 52, x + 16, y - 34, i * 11, 2);
    }
    ctx.globalAlpha = 1;
  } else if (ch === 6) {
    const g = ctx.createRadialGradient(W / 2, 90, 30, W / 2, 250, 620);
    g.addColorStop(0, 'rgba(242,201,76,0.20)');
    g.addColorStop(0.45, 'rgba(107,78,155,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(107,78,155,0.30)'; ctx.lineWidth = 2;
    jline(ctx, W / 2, 0, W / 2, GROUND, 77, 3);
  }

  ctx.restore();
  // ground
  ctx.save();
  ctx.strokeStyle = dark ? '#6A6355' : C.graphite;
  ctx.lineWidth = 3;
  jline(ctx, 0, GROUND, W, GROUND, 4242, 1.8);
  ctx.globalAlpha = 0.25; ctx.lineWidth = 1.5;
  for (let x = 10; x < W; x += 26) jline(ctx, x, GROUND + 3, x - 9, GROUND + 13, x, 1.6);
  ctx.restore();
}

/* ============================================================
   WEAPON ART
   ============================================================ */
function drawWeapon(ctx, shape, hx, hy, ang, face, glow) {
  if (shape === 'none') return;
  ctx.save();
  ctx.translate(hx, hy); ctx.rotate(ang * face); ctx.scale(face, 1);
  if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 12; }
  ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  if (shape === 'pencil') {
    jline(ctx, 0, 0, 34, -4, 21, 0.8);
    ctx.beginPath(); ctx.moveTo(34, -4); ctx.lineTo(44, -6); ctx.lineTo(34, -9); ctx.closePath(); ctx.stroke();
  } else if (shape === 'ruler') {
    jrect(ctx, 2, -6, 54, 11, 22, 0.9);
    ctx.lineWidth = 1.2;
    for (let i = 10; i < 54; i += 10) jline(ctx, i, -6, i, -1, i, 0.5);
  } else if (shape === 'maul') {
    jline(ctx, 0, 0, 26, -12, 23, 0.9);
    jrect(ctx, 24, -30, 26, 28, 24, 1.2);
  } else if (shape === 'spear') {
    jline(ctx, -10, 4, 62, -12, 25, 0.9);
    ctx.beginPath(); ctx.moveTo(62, -12); ctx.lineTo(78, -18); ctx.lineTo(62, -20); ctx.closePath(); ctx.stroke();
    jcirc(ctx, 6, 2, 4, 26, 0.6);
  } else if (shape === 'nibs') {
    jline(ctx, 0, -2, 30, -10, 27, 0.8);
    jline(ctx, 0, 4, 28, 12, 28, 0.8);
  } else if (shape === 'marker') {
    jrect(ctx, 0, -8, 40, 15, 29, 0.9);
    ctx.beginPath(); ctx.moveTo(40, -8); ctx.lineTo(58, -3); ctx.lineTo(40, 7); ctx.closePath(); ctx.stroke();
  } else if (shape === 'stylus') {
    jline(ctx, -6, 6, 56, -16, 30, 0.8);
    ctx.beginPath(); ctx.moveTo(56, -16); ctx.lineTo(72, -22); ctx.lineTo(58, -24); ctx.closePath(); ctx.stroke();
    jcirc(ctx, 20, -4, 6, 31, 0.7);
  }
  ctx.restore();
}

/* ============================================================
   HATS / CAPES
   ============================================================ */
function drawHead(ctx, id, cx, cy, r, face) {
  ctx.lineWidth = 2.4;
  if (id === 'band') { jline(ctx, cx - r - 2, cy - r * 0.25, cx + r + 2, cy - r * 0.25, 41, 0.8);
    jline(ctx, cx - r * face, cy - r * 0.25, cx - (r + 12) * face, cy + 6, 42, 1); }
  else if (id === 'cap') { jrect(ctx, cx - r - 1, cy - r - 7, r * 2 + 2, 9, 43, 0.9);
    jrect(ctx, cx - r - 12 * face, cy - r - 5, 12, 5, 44, 0.8); }
  else if (id === 'antenna') { jline(ctx, cx, cy - r, cx + 4, cy - r - 16, 45, 1); jcirc(ctx, cx + 4, cy - r - 19, 3.4, 46, 0.7); }
  else if (id === 'tophat') { jrect(ctx, cx - r - 5, cy - r - 3, r * 2 + 10, 4, 47, 0.8); jrect(ctx, cx - r + 1, cy - r - 22, r * 2 - 2, 20, 48, 0.9); }
  else if (id === 'crown') {
    ctx.beginPath();
    const b = cy - r - 1, l = cx - r - 2, w2 = (r + 2) * 2;
    ctx.moveTo(l, b);
    for (let i = 0; i < 3; i++) { ctx.lineTo(l + w2 * (i + 0.5) / 3, b - 15); ctx.lineTo(l + w2 * (i + 1) / 3, b - 2); }
    ctx.lineTo(l + w2, b); ctx.closePath(); ctx.stroke();
  }
}
function drawBack(ctx, id, sx, sy, hipY, face, t, vx) {
  ctx.lineWidth = 2.4;
  const sway = Math.sin(t / 160) * 4 - vx * 2.4;
  if (id === 'cape') {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx - 22 * face + sway, sy + 26, sx - 16 * face + sway * 1.6, hipY + 20);
    ctx.lineTo(sx + 6 * face, hipY + 14); ctx.lineTo(sx + 2 * face, sy + 2); ctx.closePath(); ctx.stroke();
  } else if (id === 'scarf') {
    jline(ctx, sx - 5, sy, sx + 5, sy, 51, 0.7);
    ctx.beginPath(); ctx.moveTo(sx - 2 * face, sy + 1);
    ctx.quadraticCurveTo(sx - 26 * face + sway, sy + 8, sx - 44 * face + sway * 2, sy + 22 + sway); ctx.stroke();
  } else if (id === 'wings') {
    for (const s of [1, -1]) {
      ctx.beginPath();
      ctx.moveTo(sx, sy + 2);
      ctx.quadraticCurveTo(sx - 28 * face, sy - 22 + s * 6 + sway, sx - 40 * face, sy + 10 + s * 14 + sway);
      ctx.quadraticCurveTo(sx - 20 * face, sy + 6 + s * 6, sx, sy + 4); ctx.stroke();
    }
  }
}

/* ============================================================
   THE STICK FIGURE
   ============================================================ */
function drawFighter(ctx, e, look, t) {
  const { x, y, h, face } = e;
  const line = look.line || C.graphite;
  const hipY = y - h * 0.46, shY = y - h * 0.80, headR = h * 0.115, headY = y - h * 0.90;
  const sd = e.id * 13;

  ctx.save();
  ctx.strokeStyle = line;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = (h / 62) * 3 * (look.thick || 1);
  if (look.ghost) ctx.globalAlpha = 0.55;
  if (look.glow) { ctx.shadowColor = look.accent || line; ctx.shadowBlur = 10; }
  if (e.iframe > 0 && Math.floor(t / 60) % 2 === 0) ctx.globalAlpha *= 0.4;
  if (e.hurtT > 0) ctx.strokeStyle = C.red;

  const st = e.state, sp = e.stateT, dur = e.stateDur || 1;
  const p = clamp(sp / dur, 0, 1);
  let lean = 0, crouch = 0;
  let armF = -0.4, armB = 0.5, elF = 0.7, elB = 0.7;
  let legF = 0.35, legB = -0.35, kneeF = 0.2, kneeB = 0.2;

  if (st === 'run') {
    const w2 = t / 62;
    legF = Math.sin(w2) * 0.85; legB = -Math.sin(w2) * 0.85;
    kneeF = 0.35 + Math.max(0, Math.sin(w2)) * 0.5; kneeB = 0.35 + Math.max(0, -Math.sin(w2)) * 0.5;
    armF = -Math.sin(w2) * 0.8; armB = Math.sin(w2) * 0.8;
    lean = 0.14; crouch = Math.abs(Math.sin(w2 * 2)) * 2;
  } else if (st === 'jump') {
    legF = 0.7; legB = -0.5; kneeF = 1.1; kneeB = 0.3;
    armF = -1.5; armB = 1.1; lean = e.vy < 0 ? -0.1 : 0.12;
  } else if (st === 'atk') {
    const swing = p < 0.42 ? -1.5 + p * 1.2 : Math.min(1.5, -1.0 + (p - 0.42) * 7);
    armF = swing; elF = p < 0.42 ? 1.2 : 0.1;
    lean = p < 0.42 ? -0.16 : 0.26; armB = -swing * 0.4;
    legF = 0.5; legB = -0.4;
  } else if (st === 'heavy') {
    const swing = p < 0.55 ? -2.1 + p * 0.6 : Math.min(1.7, -1.7 + (p - 0.55) * 8.5);
    armF = swing; armB = swing * 0.8; elF = 0.1; elB = 0.1;
    lean = p < 0.55 ? -0.3 : 0.4; legF = 0.6; legB = -0.5; crouch = 3;
  } else if (st === 'block') {
    armF = -0.15; armB = -0.05; elF = 1.9; elB = 1.7; lean = -0.12; crouch = 4;
    legF = 0.25; legB = -0.45;
  } else if (st === 'special') {
    const w2 = p * 26;
    armF = Math.sin(w2) * 2.5; armB = -Math.sin(w2) * 2.5; elF = 0.08; elB = 0.08;
    lean = Math.sin(w2 * 0.5) * 0.22; legF = 0.55; legB = -0.55;
    crouch = -Math.sin(p * 3.14159) * 16;
  } else if (st === 'dash') {
    lean = 0.55; legF = 0.9; legB = -0.7; armF = 1.2; armB = -1.3; crouch = 5;
  } else if (st === 'hurt') {
    lean = -0.35; armF = -1.9; armB = -1.5; legF = 0.2; legB = -0.6; crouch = 4;
  } else {
    const br = Math.sin(t / 420) * 0.06;
    armF = -0.35 + br; armB = 0.45 - br; crouch = Math.sin(t / 420) * 1.2;
  }

  const hy = hipY + crouch, sy = shY + crouch, hdY = headY + crouch;
  const sx = x + Math.sin(lean) * (hy - sy) * face;
  const hdX = x + Math.sin(lean) * (hy - hdY) * face;

  if (look.back && look.back !== 'nothingb') { ctx.save(); drawBack(ctx, look.back, sx, sy, hy, face, t, e.vx || 0); ctx.restore(); }

  // legs
  const leg = (ang, knee, seed) => {
    const kx = x + Math.sin(ang) * (h * 0.24) * face, ky = hy + Math.cos(ang) * (h * 0.24);
    const fx = kx + Math.sin(ang - knee * 0.5) * (h * 0.24) * face, fy = Math.min(y, ky + Math.cos(ang - knee * 0.5) * (h * 0.24));
    jline(ctx, x, hy, kx, ky, seed, 0.7); jline(ctx, kx, ky, fx, fy, seed + 1, 0.7);
    jline(ctx, fx, fy, fx + 7 * face, fy, seed + 2, 0.5);
  };
  leg(legB, kneeB, sd + 10); leg(legF, kneeF, sd + 20);

  // torso
  jline(ctx, x, hy, sx, sy, sd + 30, 0.8);

  // arms
  const arm = (ang, elb, seed, isFront) => {
    const ex = sx + Math.sin(ang + 1.57) * (h * 0.19) * face, ey = sy + Math.cos(ang + 1.57) * (h * 0.19) * 0.7 + h * 0.06;
    const hx2 = ex + Math.sin(ang + 1.57 - elb) * (h * 0.20) * face, hy2 = ey + Math.cos(ang + 1.57 - elb) * (h * 0.20) * 0.8;
    jline(ctx, sx, sy + h * 0.03, ex, ey, seed, 0.7); jline(ctx, ex, ey, hx2, hy2, seed + 1, 0.7);
    return [hx2, hy2, ang];
  };
  arm(armB, elB, sd + 40, false);
  const [hx, hy2, hang] = arm(armF, elF, sd + 50, true);

  // head
  jcirc(ctx, hdX, hdY, headR, sd + 60, 0.9, look.fillHead || null);
  ctx.save();
  ctx.fillStyle = line; ctx.globalAlpha *= 0.9;
  const ex1 = hdX + headR * 0.30 * face, ey1 = hdY - headR * 0.10;
  if (e.hurtT > 0 || st === 'hurt') {
    ctx.lineWidth = 1.8;
    jline(ctx, ex1 - 4, ey1 - 4, ex1 + 4, ey1 + 4, sd + 71, 0.5);
    jline(ctx, ex1 + 4, ey1 - 4, ex1 - 4, ey1 + 4, sd + 72, 0.5);
  } else {
    ctx.beginPath(); ctx.arc(ex1, ey1, headR * 0.15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(hdX - headR * 0.12 * face, ey1, headR * 0.15, 0, 7); ctx.fill();
  }
  ctx.restore();
  if (look.head && look.head !== 'none') drawHead(ctx, look.head, hdX, hdY, headR, face);

  // weapon in the front hand
  if (look.wp && look.wp.shape !== 'none') {
    ctx.strokeStyle = look.accent && look.accent !== line ? look.accent : line;
    drawWeapon(ctx, look.wp.shape, hx, hy2, hang * 0.9 + 0.2, face, look.wp.glow);
  }
  ctx.restore();
}

/* ============================================================
   BOSS ART
   ============================================================ */
function drawBoss(ctx, b, t) {
  const art = b.art, x = b.x, y = b.y, w = b.w, h = b.h;
  ctx.save();
  ctx.strokeStyle = b.hurtT > 0 ? C.red : b.col;
  ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (b.iframe > 0 && Math.floor(t / 60) % 2 === 0) ctx.globalAlpha = 0.5;

  if (art === 'scribble') {
    const cy = y - h / 2;
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const a = i * 0.42 + t / 700, r = (w / 2) * (0.55 + 0.45 * Math.sin(i * 1.7 + t / 420));
      const px = x + Math.cos(a) * r + hash(i, 1) * 3, py = cy + Math.sin(a * 1.3) * (h / 2) * 0.9 + hash(i, 2) * 3;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.lineWidth = 2;
    jcirc(ctx, x - 14, cy - 8, 7, 1, 1.2); jcirc(ctx, x + 16, cy - 10, 7, 2, 1.2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath(); ctx.arc(x - 14, cy - 8, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 16, cy - 10, 3, 0, 7); ctx.fill();
  } else if (art === 'smudge') {
    for (let k = 3; k >= 0; k--) {
      ctx.globalAlpha = 0.18 + k * 0.06;
      ctx.fillStyle = b.col;
      const off = Math.sin(t / 300 + k) * (6 + k * 5);
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = (w / 2 + k * 7) * (0.7 + 0.3 * Math.sin(i * 2.3 + t / 500));
        const px = x + off + Math.cos(a) * r, py = y - h / 2 + Math.sin(a) * (h / 2 + k * 5);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.lineWidth = 3;
    ctx.strokeStyle = b.hurtT > 0 ? C.red : '#4A463E';
    jcirc(ctx, x - 15, y - h * 0.62, 6, 3, 1.4); jcirc(ctx, x + 15, y - h * 0.62, 6, 4, 1.4);
  } else if (art === 'straight') {
    const cy = y - h / 2;
    jrect(ctx, x - w / 2, y - h, w, h, 5, 0.5);
    ctx.lineWidth = 1.6;
    for (let i = 1; i < 9; i++) jline(ctx, x - w / 2, y - h + (h / 9) * i, x - w / 2 + (i % 2 ? 16 : 10), y - h + (h / 9) * i, i, 0.4);
    ctx.lineWidth = 3;
    jline(ctx, x - w / 2 - 20, cy - 6, x - w / 2, cy + 4, 6, 0.8);
    jline(ctx, x + w / 2 + 20, cy - 6, x + w / 2, cy + 4, 7, 0.8);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(x - 16, y - h + 20, 9, 3); ctx.fillRect(x + 7, y - h + 20, 9, 3);
  } else if (art === 'chroma') {
    const cols = ['#C4452F', '#E0A02F', '#5E8C61', '#4A7C93'];
    const cur = cols[b.tint || 0];
    ctx.strokeStyle = b.hurtT > 0 ? '#FFF' : cur;
    ctx.fillStyle = cur; ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const r = (w / 2) * (0.8 + 0.25 * Math.sin(i * 3 + t / 260));
      const px = x + Math.cos(a) * r, py = y - h / 2 + Math.sin(a) * (h / 2);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    for (let k = 0; k < 4; k++) {
      ctx.strokeStyle = cols[k]; ctx.lineWidth = 2.2; ctx.globalAlpha = k === (b.tint || 0) ? 1 : 0.4;
      const a = t / 500 + k * 1.57;
      jcirc(ctx, x + Math.cos(a) * (w * 0.42), y - h / 2 + Math.sin(a) * (h * 0.30), 8, k, 1.2);
    }
    ctx.globalAlpha = 1;
  } else {
    // understudy + architect draw as tall stick figures
    drawFighter(ctx, b, {
      line: b.hurtT > 0 ? C.red : b.col,
      accent: art === 'architect' ? C.ink : '#B49BD6',
      thick: 1.5, glow: art === 'architect' ? C.purple : null,
      head: art === 'architect' ? 'crown' : 'band',
      back: art === 'architect' ? 'cape' : 'scarf',
      wp: art === 'architect' ? WEAPONS[7] : (b.mirrorWp || WEAPONS[2]),
    }, t);
    if (art === 'architect') {
      ctx.globalAlpha = 0.30; ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) jcirc(ctx, b.x, b.y - b.h * 0.55, 44 + k * 16 + Math.sin(t / 400 + k) * 6, k + 8, 3);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/* ============================================================
   EFFECTS
   ============================================================ */
const POPS = ['POW', 'BAP', 'WHAM', 'THWK', 'KRAK', 'BONK', 'SMAK'];
function burst(g, x, y, n, col, big) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.28), s = rnd(1.5, big ? 8 : 5);
    g.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: rnd(220, 480), max: 480, type: 'star', col, size: rnd(3, big ? 11 : 7), rot: rnd(0, 6) });
  }
}
function poof(g, x, y, col) {
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, 6.28);
    g.parts.push({ x, y, vx: Math.cos(a) * rnd(1, 4), vy: rnd(-5.5, -1.2), life: 900, max: 900, type: 'loop', col, size: rnd(5, 13), rot: rnd(0, 6), spin: rnd(-0.2, 0.2) });
  }
}
function pop(g, x, y, text, col, size = 26) {
  g.pops.push({ x, y, text, col, size, life: 700, max: 700 });
}
function drawParts(ctx, g) {
  for (const p of g.parts) {
    const a = p.life / p.max;
    ctx.save(); ctx.globalAlpha = clamp(a, 0, 1);
    ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.strokeStyle = p.col; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    if (p.type === 'star') {
      for (let i = 0; i < 4; i++) {
        const ang = i * 0.785, r = p.size * a;
        ctx.beginPath(); ctx.moveTo(-Math.cos(ang) * r, -Math.sin(ang) * r);
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); ctx.stroke();
      }
    } else if (p.type === 'loop') {
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const ang = (i / 14) * 6.28 * 1.6, r = p.size * (0.4 + 0.6 * (i / 14));
        const px = Math.cos(ang) * r, py = Math.sin(ang) * r * 0.7;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else {
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(0, 0, p.size * a, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  for (const p of g.pops) {
    const a = p.life / p.max;
    ctx.save();
    ctx.globalAlpha = clamp(a * 1.5, 0, 1);
    ctx.translate(p.x, p.y - (1 - a) * 34);
    ctx.rotate((1 - a) * 0.2 - 0.1);
    ctx.font = `900 ${p.size * (0.7 + a * 0.4)}px ${FONT_DISP}`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = C.paper; ctx.strokeText(p.text, 0, 0);
    ctx.fillStyle = p.col; ctx.fillText(p.text, 0, 0);
    ctx.restore();
  }
}

/* ============================================================
   ENGINE
   ============================================================ */
let NEXTID = 1;
function mkEnt(o) { return Object.assign({ id: NEXTID++, vx:0, vy:0, face:1, state:'idle', stateT:0, stateDur:1, onGround:false, iframe:0, hurtT:0, atkCd:0, stun:0, dead:false, deadT:0 }, o); }

function makePlayer(stats, save) {
  return mkEnt({ kind:'player', x:150, y:GROUND, w:26, h:66, hp:stats.maxHp, maxHp:stats.maxHp,
    dashes:stats.dashes, dashCd:0, blockT:0, jumps:0 });
}

function makeEnemy(type, lvIdx, x) {
  const d = ENEMIES[type];
  const s = 1 + lvIdx * 0.13, sd = 1 + lvIdx * 0.085;
  return mkEnt({ kind:'enemy', type, x, y:GROUND, w:d.w, h:d.h, def:d,
    hp: Math.round(d.hp * s), maxHp: Math.round(d.hp * s), dmg: d.dmg * sd,
    aiT: rnd(0, 400), col: d.col });
}

function makeBoss(key, lvIdx) {
  const d = BOSSES[key];
  return mkEnt({ kind:'boss', key, art:d.art, name:d.name, x:W - 190, y:GROUND, w:d.w, h:d.h,
    hp:d.hp, maxHp:d.hp, col:d.col, def:d, face:-1, phase:0, move:null, moveT:0, moveCd:900, tint:0,
    dmgMul: 1 + lvIdx * 0.03 });
}

function newGame(levelId, save) {
  NEXTID = 1;
  const lv = LEVELS.find(l => l.id === levelId);
  const stats = statsOf(save);
  const g = {
    lv, stats, save, tick:0, elapsed:0, intro:1100, phase:'fight',
    shake:0, combo:0, comboT:0, maxCombo:0, hitsTaken:0, killed:0,
    waveIdx:-1, spawnDelay:0, ents:[], projs:[], parts:[], pops:[], hazards:[], drops:[],
    player: makePlayer(stats, save), boss:null, quip:'', quipT:0, banner:'', bannerT:0,
    endT:0, flash:0, power:0, rings:[],
  };
  g.player.hp = stats.maxHp;
  nextWave(g);
  return g;
}

function nextWave(g) {
  g.waveIdx++;
  const wv = g.lv.waves[g.waveIdx];
  if (!wv) return;
  const lvIdx = g.lv.id - 1;
  if (wv[0] === 'boss') {
    const b = makeBoss(wv[1], lvIdx);
    if (wv[1] === 'understudy') b.mirrorWp = g.stats.wp;
    g.boss = b; g.ents.push(b);
    g.banner = b.name; g.bannerT = 1800;
    const q = BOSSES[wv[1]].quips;
    g.quip = q[0]; g.quipT = 3400;
  } else {
    const [type, count] = wv;
    for (let i = 0; i < count; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side > 0 ? W - 60 - i * 34 : 60 + i * 34;
      const e = makeEnemy(type, lvIdx, x);
      e.face = side > 0 ? -1 : 1;
      e.spawnT = 260 + i * 130;
      g.ents.push(e);
    }
    if (g.waveIdx > 0) { g.banner = `WAVE ${g.waveIdx + 1}`; g.bannerT = 1100; }
  }
}

function hurt(g, target, dmg, kbx, fromX, isPlayerSource) {
  if (target.dead || target.iframe > 0) return false;
  // block / parry
  if (target.kind === 'player' && target.state === 'block' && Math.sign(fromX - target.x) === target.face) {
    if (target.blockT < 200) {
      const heal = Math.min(target.maxHp * 0.05, target.maxHp - target.hp);
      target.hp += heal;
      pop(g, target.x, target.y - 84, 'PARRY!', C.ink, 30);
      if (heal > 0.5) pop(g, target.x + 30, target.y - 62, '+' + Math.round(heal), C.green, 19);
      beep('block', g.save.muted); g.shake = 7;
      burst(g, target.x + 22 * target.face, target.y - 40, 12, C.ink, true);
      return 'parry';
    }
    dmg *= 0.22; kbx *= 0.4;
    beep('block', g.save.muted);
    burst(g, target.x + 18 * target.face, target.y - 40, 5, C.blueDk);
    pop(g, target.x, target.y - 78, 'BLOCK', C.blueDk, 20);
  }
  target.hp -= dmg;
  target.hurtT = 240; target.iframe = target.kind === 'player' ? 460 : 190;
  target.vx = kbx; if (Math.abs(kbx) > 6) target.vy = -3.2;
  target.state = 'hurt'; target.stateT = 0; target.stateDur = 260;
  target.stun = target.kind === 'boss' ? 0 : 240;
  g.shake = Math.max(g.shake, Math.min(11, 3 + dmg * 0.14));

  const cx = target.x, cy = target.y - target.h * 0.6;
  burst(g, cx, cy, dmg > 20 ? 12 : 7, isPlayerSource ? C.graphite : C.red, dmg > 20);
  beep(dmg > 20 ? 'heavy' : isPlayerSource ? 'hit' : 'hurt', g.save.muted);

  if (isPlayerSource) {
    g.combo++; g.comboT = 2200; g.maxCombo = Math.max(g.maxCombo, g.combo);
    if (g.stats.wp.id !== 'fists' && !g.specialActive) {
      const unit = Math.max(1, g.stats.wp.dmg * g.stats.dmgMul);
      const was = g.power;
      g.power = clamp(g.power + clamp(dmg / unit, 0.3, 3) * 0.080, 0, 1);
      if (was < 1 && g.power >= 1) { pop(g, g.player.x, g.player.y - 108, 'POWER READY', C.ink, 26); beep('coin', g.save.muted); }
    }
    pop(g, cx + rnd(-14, 14), cy, String(Math.round(dmg)), C.graphite, 20 + Math.min(14, dmg * 0.3));
    if (g.combo % 5 === 0) pop(g, cx, cy - 30, pick(POPS), C.ink, 30);
  } else {
    g.hitsTaken++; g.combo = 0; g.flash = 1;
    pop(g, cx, cy - 20, '-' + Math.round(dmg), C.red, 24);
  }

  if (target.hp <= 0) {
    target.hp = 0; target.dead = true; target.deadT = 520;
    poof(g, cx, cy, target.col || C.graphite);
    beep('ko', g.save.muted);
    if (target.kind !== 'player') {
      g.killed++; pop(g, cx, cy - 40, 'KO', C.graphite, 40); g.shake = 12;
      if (target.kind === 'enemy' && Math.random() < (g.boss ? 0.55 : 0.28)) {
        g.drops.push({ x: cx, y: cy, vy: -4, life: 9000, heal: Math.round(g.player.maxHp * 0.12) });
      }
    }
  }
  return true;
}

function overlapArc(a, tx, ty, reach, face, wide) {
  const dx = (tx - a.x) * face, dy = ty - (a.y - a.h * 0.5);
  return dx > -14 && dx < reach && Math.abs(dy) < (wide || 46);
}

function playerAttack(g, heavy, holdingDir) {
  const p = g.player, s = g.stats, wp = s.wp;
  if (p.atkCd > 0 || p.dead || p.state === 'dash' || p.stun > 0) return;
  // standing still? turn toward whoever is closest, so you never swing at a wall
  if (!holdingDir) {
    let near = null, nd = 1e9;
    for (const e of g.ents) { if (e.dead || e.spawnT > 0) continue; const d = Math.abs(e.x - p.x); if (d < nd) { nd = d; near = e; } }
    if (near && nd > 6) p.face = near.x > p.x ? 1 : -1;
  }
  const base = (heavy ? 620 : 330) / (s.atkMul * wp.speed);
  p.state = heavy ? 'heavy' : 'atk'; p.stateT = 0; p.stateDur = base;
  p.atkCd = base * 1.05;
  p.hitDone = 0;
  p.pendingHeavy = heavy;
  beep('swing', g.save.muted);
}

function playerSpecial(g) {
  const p = g.player, s = g.stats;
  if (p.dead || p.stun > 0 || g.power < 1 || s.wp.id === 'fists') return;
  g.power = 0;                       // drains whether or not it connects
  p.state = 'special'; p.stateT = 0; p.stateDur = 940;
  p.specTicks = 0; p.specNext = 280;
  p.iframe = 760; p.atkCd = 1000; p.vy = -5.4; p.onGround = false;
  g.shake = 14; g.flash = 0.55;
  beep('super', g.save.muted);
  pop(g, p.x, p.y - 120, s.wp.special || 'OVERDRAW', C.ink, 34);
  g.rings.push({ x:p.x, y:p.y - 46, r:14, max:210, life:520, maxLife:520, col:C.ink });
  return true;
}

function resolveSpecialHit(g) {
  const p = g.player, s = g.stats, wp = s.wp;
  const dmg = wp.dmg * s.dmgMul * 1.6;
  const R = 160;
  g.rings.push({ x:p.x, y:p.y - 46, r:20, max:R + 40, life:460, maxLife:460, col: g.player.specTicks % 2 ? C.purple : C.ink });
  for (let i = 0; i < 9; i++) g.parts.push({ x:p.x, y:p.y - 46, vx:rnd(-9,9), vy:rnd(-9,4), life:420, max:420, type:'star', col:C.ink, size:12, rot:rnd(0,6) });
  for (const e of g.ents) {
    if (e.dead || e.spawnT > 0) continue;
    const dx = e.x - p.x, dy = (e.y - e.h * 0.5) - (p.y - 46);
    if (dx * dx + dy * dy < R * R) {
      const dir = dx === 0 ? p.face : Math.sign(dx);
      hurt(g, e, dmg, wp.kb * 2.4 * dir * (e.kind === 'boss' ? 0.18 : 1), p.x, true);
    }
  }
}

function resolvePlayerHit(g, second) {
  const p = g.player, s = g.stats, wp = s.wp;
  const heavy = p.pendingHeavy;
  let dmg = wp.dmg * s.dmgMul * (heavy ? 2.15 : 1) * (second ? 0.7 : 1);
  const reach = wp.range * (heavy ? 1.15 : 1);
  let landed = false;
  for (const e of g.ents) {
    if (e.dead) continue;
    if (overlapArc(p, e.x, e.y, reach + e.w / 2, p.face, e.h * 0.75)) {
      const kb = wp.kb * (heavy ? 2.1 : 1) * (e.kind === 'boss' ? 0.22 : 1);
      hurt(g, e, dmg, kb * p.face, p.x, true);
      landed = true;
    }
  }
  if (!landed) {
    const hx = p.x + reach * 0.7 * p.face;
    g.parts.push({ x:hx, y:p.y - 40, vx:0, vy:0, life:120, max:120, type:'dust', col:C.paper2, size:10, rot:0 });
  }
}

/* ---- enemy AI ---- */
function enemyAI(g, e, dt) {
  const p = g.player, d = e.def;
  const dist = p.x - e.x, ad = Math.abs(dist);
  if (e.state !== 'atk' && e.state !== 'hurt' && e.stun <= 0) e.face = dist > 0 ? 1 : -1;
  e.aiT -= dt;

  if (e.state === 'atk') {
    if (!e.hitDone && e.stateT >= e.windup) {
      e.hitDone = 1;
      if (d.ranged) {
        const a = Math.atan2((p.y - 34) - (e.y - 34), p.x - e.x);
        g.projs.push({ x:e.x + 20 * e.face, y:e.y - 38, vx:Math.cos(a) * 7.2, vy:Math.sin(a) * 7.2 - 1.4,
          r:8, dmg:e.dmg, grav:0.16, owner:'e', col:d.col, life:2600 });
        beep('swing', g.save.muted);
      } else {
        if (overlapArc(e, p.x, p.y, d.reach, e.face, 50) && !p.dead) hurt(g, p, e.dmg, 6 * e.face, e.x, false);
      }
    }
    return;
  }
  if (e.stun > 0 || e.state === 'hurt') return;

  const want = d.ranged ? (ad < d.keep ? -Math.sign(dist) : ad > d.keep + 90 ? Math.sign(dist) : 0)
                        : (ad > d.reach * 0.72 ? Math.sign(dist) : 0);
  const sp = d.spd * (e.type === 'copy' ? 1 + g.lv.id * 0.012 : 1);
  if (want !== 0) { e.vx += want * sp * 0.4; e.state = 'run'; }
  else { e.vx *= 0.82; e.state = 'idle'; }
  e.vx = clamp(e.vx, -sp * 1.9, sp * 1.9);

  const canHit = d.ranged ? (ad < d.reach && ad > 90) : ad < d.reach;
  if (canHit && e.atkCd <= 0) {
    if (d.lunge && ad > 60) { e.vx = 9 * e.face; beep('dash', g.save.muted); }
    e.state = 'atk'; e.stateT = 0; e.stateDur = d.wind + 300; e.windup = d.wind; e.hitDone = 0;
    e.atkCd = d.cd * rnd(0.85, 1.2);
  }
  if (!e.onGround) e.state = 'jump';
}

/* ---- boss moves ---- */
function startMove(g, b, id) {
  b.move = id; b.moveT = 0; b.subT = 0; b.hitDone = 0; b.hits = 0;
  const p = g.player;
  b.face = p.x > b.x ? 1 : -1;
  const M = {
    lunge:{ wind:440, act:420, rec:420 }, sweep:{ wind:520, act:220, rec:480 },
    slam:{ wind:420, act:700, rec:520 },  volley:{ wind:520, act:520, rec:440 },
    rain:{ wind:640, act:1400, rec:520 }, summon:{ wind:560, act:200, rec:600 },
    blink:{ wind:280, act:420, rec:360 }, beam:{ wind:820, act:340, rec:600 },
    grid:{ wind:560, act:1500, rec:520 }, spin:{ wind:480, act:1500, rec:600 },
  }[id];
  b.wind = M.wind; b.act = M.act; b.rec = M.rec; b.moveDur = M.wind + M.act + M.rec;
}

function bossMoveTick(g, b, dt) {
  const p = g.player, t = b.moveT, id = b.move;
  const inAct = t >= b.wind && t < b.wind + b.act;
  const justAct = !b.hitDone && t >= b.wind;
  const D = (m) => (b.def.contact * m) * b.dmgMul;

  if (id === 'lunge') {
    if (t < b.wind) { b.vx *= 0.8; b.face = p.x > b.x ? 1 : -1; }
    else if (inAct) {
      if (justAct) { b.hitDone = 1; b.vx = 15 * b.face; beep('dash', g.save.muted); }
      if (Math.abs(p.x - b.x) < b.w / 2 + 26 && Math.abs(p.y - b.y) < 70) hurt(g, p, D(1.1), 9 * b.face, b.x, false);
    } else b.vx *= 0.86;
  } else if (id === 'sweep') {
    if (justAct && inAct) {
      b.hitDone = 1; beep('heavy', g.save.muted);
      burst(g, b.x + 60 * b.face, b.y - b.h * 0.5, 14, b.col, true);
      if (overlapArc(b, p.x, p.y, b.w / 2 + 110, b.face, 80)) hurt(g, p, D(1.3), 12 * b.face, b.x, false);
    }
  } else if (id === 'slam') {
    if (t < b.wind) b.vx *= 0.85;
    else if (justAct) { b.hitDone = 1; b.vy = -17; b.vx = clamp((p.x - b.x) * 0.05, -7, 7); }
    else if (inAct && b.onGround && b.vy >= 0 && b.hitDone === 1) {
      b.hitDone = 2; g.shake = 16; beep('heavy', g.save.muted);
      for (const dir of [-1, 1]) g.hazards.push({ x:b.x, y:GROUND - 22, w:26, h:44, vx:dir * 7.5, dmg:D(1.2), life:1500, col:b.col, type:'wave' });
      burst(g, b.x, GROUND, 20, b.col, true);
    }
  } else if (id === 'volley') {
    if (justAct && inAct) {
      b.hitDone = 1;
      const n = 3 + b.phase;
      for (let i = 0; i < n; i++) {
        const a = Math.atan2((p.y - 40) - (b.y - b.h * 0.6), p.x - b.x) + (i - (n - 1) / 2) * 0.17;
        g.projs.push({ x:b.x, y:b.y - b.h * 0.6, vx:Math.cos(a) * 8, vy:Math.sin(a) * 8, r:10, dmg:D(0.85), grav:0.07, owner:'e', col:b.col, life:3000 });
      }
      beep('swing', g.save.muted);
    }
  } else if (id === 'rain') {
    if (inAct) { b.subT += dt; if (b.subT > 150) { b.subT = 0;
      g.projs.push({ x:rnd(40, W - 40), y:-20, vx:0, vy:3.4, r:11, dmg:D(0.75), grav:0.22, owner:'e', col:b.col, life:4000 }); } }
  } else if (id === 'summon') {
    if (justAct) { b.hitDone = 1; b.summons = (b.summons || 0) + 1;
      const kinds = ['scribbler', 'dasher', 'lobber'];
      for (let i = 0; i < 2 + Math.min(b.phase, 1); i++) {
        const e = makeEnemy(kinds[i % 3], Math.max(0, g.lv.id - 5), clamp(b.x + rnd(-160, 160), 50, W - 50));
        e.spawnT = 200; e.summoned = true; g.ents.push(e);
      }
      pop(g, b.x, b.y - b.h - 20, 'HELP!', b.col, 26);
    }
  } else if (id === 'blink') {
    if (justAct) { b.hitDone = 1;
      poof(g, b.x, b.y - b.h / 2, b.col);
      b.x = clamp(p.x - 90 * (p.face || 1), 60, W - 60); b.face = p.x > b.x ? 1 : -1;
      burst(g, b.x, b.y - b.h / 2, 12, b.col, true); beep('dash', g.save.muted);
    } else if (inAct && t > b.wind + 240 && b.hitDone === 1) {
      b.hitDone = 2;
      if (overlapArc(b, p.x, p.y, b.w / 2 + 76, b.face, 70)) hurt(g, p, D(1.0), 9 * b.face, b.x, false);
      burst(g, b.x + 40 * b.face, b.y - b.h * 0.5, 8, b.col);
    }
  } else if (id === 'beam') {
    if (t < b.wind) { if (!b.beamY) b.beamY = p.y - 34; b.vx *= 0.9; }
    else if (justAct) { b.hitDone = 1; g.shake = 10; beep('heavy', g.save.muted);
      g.hazards.push({ x:W / 2, y:b.beamY - 12, w:W, h:26, vx:0, dmg:D(1.35), life:b.act, col:b.col, type:'beam' });
      b.beamY = null;
    }
  } else if (id === 'grid') {
    if (inAct) { b.subT += dt; if (b.subT > 260) { b.subT = 0;
      const wx = clamp(p.x + rnd(-120, 120), 40, W - 40);
      g.hazards.push({ x:wx, y:GROUND - 60, w:22, h:120, vx:0, dmg:D(0.95), life:900, col:b.col, type:'wall', rise:0 }); } }
  } else if (id === 'spin') {
    if (t < b.wind) b.vx *= 0.85;
    else if (inAct) {
      if (justAct) { b.hitDone = 1; b.vx = 6.5 * b.face; beep('dash', g.save.muted); }
      b.spin = (b.spin || 0) + dt * 0.02;
      if (b.x < 60 || b.x > W - 60) { b.vx *= -1; b.face *= -1; }
      if (Math.abs(p.x - b.x) < b.w / 2 + 40 && Math.abs(p.y - b.y) < 80) hurt(g, p, D(0.9), 10 * Math.sign(b.x < p.x ? 1 : -1), b.x, false);
    } else { b.spin = 0; b.vx *= 0.9; }
  }
}

function bossAI(g, b, dt) {
  const p = g.player, d = b.def;
  let ph = 0;
  const frac = b.hp / b.maxHp;
  d.phases.forEach((x, i) => { if (frac <= x.at) ph = i; });
  if (ph !== b.phase) {
    b.phase = ph; b.iframe = 700; g.shake = 14; b.moveCd = 700; b.move = null; b.summons = 0;
    burst(g, b.x, b.y - b.h / 2, 26, b.col, true);
    pop(g, b.x, b.y - b.h - 26, 'PHASE ' + (ph + 1), b.col, 30);
    if (d.quips[ph]) { g.quip = d.quips[ph]; g.quipT = 3200; }
    b.tint = (b.tint + 1) % 4;
  }
  if (b.move) {
    b.moveT += dt; bossMoveTick(g, b, dt);
    if (b.moveT >= b.moveDur) { b.move = null; b.moveCd = rnd(340, 760) * (1 - ph * 0.12); }
    return;
  }
  b.moveCd -= dt;
  const dist = p.x - b.x, ad = Math.abs(dist);
  if (b.stun <= 0 && b.state !== 'hurt') {
    b.face = dist > 0 ? 1 : -1;
    const want = ad > 190 ? Math.sign(dist) : ad < 90 ? -Math.sign(dist) * 0.6 : 0;
    b.vx += want * d.spd * 0.3;
    b.vx = clamp(b.vx, -d.spd * 1.7, d.spd * 1.7);
    b.state = Math.abs(b.vx) > 0.6 ? 'run' : 'idle';
  }
  if (b.moveCd <= 0 && b.stun <= 0) {
    const moves = d.phases[ph].moves;
    let id = pick(moves);
    if (id === 'lunge' && ad < 100) id = 'sweep';
    if (id === 'sweep' && ad > 190) id = pick(['volley', 'lunge', 'blink']);
    const minions = g.ents.filter(e => e.kind === 'enemy' && !e.dead).length;
    if (id === 'summon' && (minions > 3 || (b.summons || 0) >= 2 + b.phase)) id = 'volley';
    if (moves.indexOf(id) < 0) id = moves[0];
    startMove(g, b, id);
    if (b.art !== 'chroma') b.tint = b.tint;
    else b.tint = (b.tint + 1) % 4;
  }
}

/* ---- main step ---- */
function step(g, dt, inp) {
  const k = dt / 16.667;
  g.tick += dt;
  if (g.intro > 0) { g.intro -= dt; } else if (g.phase === 'fight') g.elapsed += dt;
  g.shake *= Math.pow(0.86, k); g.flash *= Math.pow(0.85, k);
  for (let i = g.rings.length - 1; i >= 0; i--) {
    const r = g.rings[i]; r.life -= dt;
    r.r += (r.max - r.r) * (1 - Math.pow(0.90, k));
    if (r.life <= 0) g.rings.splice(i, 1);
  }
  if (g.comboT > 0) { g.comboT -= dt; if (g.comboT <= 0) g.combo = 0; }
  if (g.bannerT > 0) g.bannerT -= dt;
  if (g.quipT > 0) g.quipT -= dt;

  const p = g.player, s = g.stats;
  const active = g.phase === 'fight' && g.intro <= 0;

  /* ---------- player ---------- */
  if (!p.dead) {
    p.stateT += dt;
    ['iframe','hurtT','atkCd','stun','dashCd'].forEach(key => { if (p[key] > 0) p[key] -= dt; });
    if (p.dashes < s.dashes && p.dashCd <= 0) { p.dashes = Math.min(s.dashes, p.dashes + 1); p.dashCd = 1400; }

    const busy = p.state === 'atk' || p.state === 'heavy' || p.state === 'dash' || p.state === 'hurt' || p.state === 'special';
    if (active && !busy && p.stun <= 0) {
      const mv = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      if (inp.block && p.onGround) {
        p.state = 'block'; p.blockT += dt; p.vx *= 0.6;
      } else {
        p.blockT = 0;
        if (mv !== 0) { p.vx += mv * s.spd * 0.42; p.face = mv; p.state = p.onGround ? 'run' : 'jump'; }
        else { p.vx *= 0.74; p.state = p.onGround ? 'idle' : 'jump'; }
        p.vx = clamp(p.vx, -s.spd, s.spd);
        if (inp.up && p.onGround) { p.vy = -15.4; p.onGround = false; p.state = 'jump'; beep('jump', g.save.muted); }
        if (inp.dash && p.dashes > 0 && p.dashCd < 1200) {
          p.dashes--; p.dashCd = 1400;
          p.state = 'dash'; p.stateT = 0; p.stateDur = 240;
          p.vx = 15 * p.face; p.iframe = 250; beep('dash', g.save.muted);
          for (let i = 0; i < 6; i++) g.parts.push({ x:p.x, y:p.y - 30 - i * 5, vx:-p.face * rnd(1,3), vy:rnd(-1,1), life:240, max:240, type:'dust', col:C.paper2, size:8, rot:0 });
        }
        if (inp.special && g.power >= 1) playerSpecial(g);
        else if (inp.atk) playerAttack(g, false, mv !== 0);
        else if (inp.heavy) playerAttack(g, true, mv !== 0);
      }
    } else if (p.state === 'block' && (!inp.block || !active)) { p.state = 'idle'; p.blockT = 0; }

    if (p.state === 'atk' || p.state === 'heavy') {
      const wp = s.wp;
      const c1 = p.stateDur * (p.pendingHeavy ? 0.60 : 0.44);
      if (!p.hitDone && p.stateT >= c1) { p.hitDone = 1; resolvePlayerHit(g, false); }
      if (wp.id === 'nibs' && p.hitDone === 1 && !p.pendingHeavy && p.stateT >= p.stateDur * 0.74) { p.hitDone = 2; resolvePlayerHit(g, true); }
      if (p.stateT >= p.stateDur) { p.state = 'idle'; p.stateT = 0; }
      p.vx *= 0.88;
    }
    if (p.state === 'special') {
      g.specialActive = true;
      while (p.specTicks < 3 && p.stateT >= p.specNext) { p.specTicks++; p.specNext += 210; resolveSpecialHit(g); }
      g.specialActive = false;
      p.vx *= 0.9;
      if (p.stateT >= p.stateDur) { p.state = 'idle'; p.stateT = 0; }
    }
    if (p.state === 'dash' && p.stateT >= p.stateDur) { p.state = 'idle'; p.vx *= 0.4; }
    if (p.state === 'hurt' && p.stateT >= p.stateDur) p.state = 'idle';
  } else {
    p.deadT -= dt;
    if (g.phase === 'fight') { g.phase = 'lost'; g.endT = 0; }
  }

  /* ---------- physics for everyone ---------- */
  const bodies = [p, ...g.ents];
  for (const e of bodies) {
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    e.vy += GRAV * k;
    e.x += e.vx * k; e.y += e.vy * k;
    if (e.y >= GROUND) {
      if (!e.onGround && e.vy > 8) for (let i = 0; i < 4; i++) g.parts.push({ x:e.x, y:GROUND, vx:rnd(-2,2), vy:rnd(-2,-0.4), life:260, max:260, type:'dust', col:C.paper2, size:7, rot:0 });
      e.y = GROUND; e.vy = 0; e.onGround = true;
    } else e.onGround = false;
    if (e.onGround) e.vx *= Math.pow(0.86, k);
    e.x = clamp(e.x, 26, W - 26);
  }

  /* ---------- enemies ---------- */
  for (const e of g.ents) {
    if (e.spawnT > 0) continue;
    if (e.dead) { e.deadT -= dt; continue; }
    e.stateT += dt;
    ['iframe','hurtT','atkCd','stun'].forEach(key => { if (e[key] > 0) e[key] -= dt; });
    if (e.hurtT <= 0 && e.state === 'hurt' && e.stateT > e.stateDur) e.state = 'idle';
    if (!active) { e.vx *= 0.8; continue; }
    if (e.kind === 'boss') bossAI(g, e, dt);
    else {
      enemyAI(g, e, dt);
      if (e.state === 'atk' && e.stateT >= e.stateDur) { e.state = 'idle'; e.stateT = 0; }
      // contact nudge so they don't stack
      for (const o of g.ents) if (o !== e && !o.dead && Math.abs(o.x - e.x) < 26) e.vx += Math.sign(e.x - o.x || 1) * 0.22;
    }
  }
  g.ents = g.ents.filter(e => !(e.dead && e.deadT <= 0));

  /* ---------- projectiles ---------- */
  for (const q of g.projs) {
    q.life -= dt; q.vy += (q.grav || 0) * k; q.x += q.vx * k; q.y += q.vy * k;
    if (q.owner === 'e' && !p.dead && p.iframe <= 0) {
      if (Math.abs(q.x - p.x) < q.r + 15 && q.y > p.y - p.h && q.y < p.y + 6) {
        hurt(g, p, q.dmg, Math.sign(q.vx || 1) * 5, q.x, false);
        burst(g, q.x, q.y, 8, q.col); q.life = 0;
      }
    }
    if (q.y > GROUND + 4) { burst(g, q.x, GROUND, 6, q.col); q.life = 0; }
    if (q.x < -30 || q.x > W + 30) q.life = 0;
  }
  g.projs = g.projs.filter(q => q.life > 0);

  /* ---------- hazards ---------- */
  for (const hz of g.hazards) {
    hz.life -= dt; hz.x += (hz.vx || 0) * k;
    if (hz.rise !== undefined) hz.rise = Math.min(1, hz.rise + dt / 220);
    if (!p.dead && p.iframe <= 0 && (hz.hitT || 0) <= 0) {
      const hh = hz.type === 'wall' ? hz.h * (hz.rise || 1) : hz.h;
      if (Math.abs(hz.x - p.x) < hz.w / 2 + 14 && p.y > hz.y - hh - 30 && p.y - p.h < hz.y + hh) {
        hurt(g, p, hz.dmg, Math.sign(hz.vx || (p.x - hz.x) || 1) * 8, hz.x, false);
        hz.hitT = 700;
      }
    }
    if (hz.hitT > 0) hz.hitT -= dt;
    if (hz.x < -40 || hz.x > W + 40) hz.life = 0;
  }
  g.hazards = g.hazards.filter(h => h.life > 0);

  /* ---------- ink drops ---------- */
  for (const dp of g.drops) {
    dp.life -= dt; dp.vy += GRAV * 0.5 * k; dp.y += dp.vy * k;
    if (dp.y > GROUND - 12) { dp.y = GROUND - 12; dp.vy = 0; }
    if (!p.dead && Math.abs(dp.x - p.x) < 30 && Math.abs(dp.y - (p.y - 30)) < 44) {
      const heal = Math.min(dp.heal, p.maxHp - p.hp);
      if (heal > 0) { p.hp += heal; pop(g, p.x, p.y - 80, '+' + Math.round(heal), C.green, 22); }
      burst(g, dp.x, dp.y, 8, C.green); beep('buy', g.save.muted); dp.life = 0;
    }
  }
  g.drops = g.drops.filter(d => d.life > 0);

  /* ---------- particles ---------- */
  for (const q of g.parts) { q.life -= dt; q.x += q.vx * k; q.y += q.vy * k; q.vy += 0.13 * k; q.vx *= 0.98; q.rot += (q.spin || 0.04) * k; }
  g.parts = g.parts.filter(q => q.life > 0);
  for (const q of g.pops) { q.life -= dt; }
  g.pops = g.pops.filter(q => q.life > 0);

  /* ---------- wave / win ---------- */
  if (g.phase === 'fight' && active) {
    const aliveNow = g.ents.some(e => !e.dead);
    if (!aliveNow) {
      if (g.waveIdx < g.lv.waves.length - 1) {
        g.spawnDelay -= dt;
        if (g.spawnDelay <= 0) { nextWave(g); g.spawnDelay = 700; }
      } else {
        g.phase = 'won'; g.endT = 0; beep('win', g.save.muted);
        g.banner = 'LEVEL CLEAR'; g.bannerT = 2400;
      }
    } else g.spawnDelay = 700;
  }
  if (g.phase !== 'fight') g.endT += dt;
}

/* ---- reward maths (the loop that keeps you coming back) ---- */
function computeReward(lv, ms, stats, hitsTaken, maxCombo, firstClear, isPB) {
  const ratio = clamp((lv.gold * 1000) / Math.max(1, ms), 0.35, 1.90);
  let base = lv.ink * ratio;
  const parts = [];
  parts.push(['Clear bonus', Math.round(lv.ink * 0.55)]);
  parts.push(['Speed \u00D7' + ratio.toFixed(2), Math.round(base - lv.ink * 0.55)]);
  if (hitsTaken === 0) { parts.push(['Untouched \u00D71.35', Math.round(base * 0.35)]); base *= 1.35; }
  const cb = 1 + Math.min(maxCombo, 25) * 0.012;
  if (maxCombo >= 5) { parts.push([`Best combo ${maxCombo}`, Math.round(base * (cb - 1))]); base *= cb; }
  if (stats.inkMul > 1.001) { parts.push([`Fortune \u00D7${stats.inkMul.toFixed(2)}`, Math.round(base * (stats.inkMul - 1))]); base *= stats.inkMul; }
  if (!firstClear) {
    const before = base; base *= 0.35;
    parts.push(['Replay \u00D70.35', -Math.round(before - base)]);
    if (isPB) { parts.push(['New personal best', Math.round(before * 0.30)]); base += before * 0.30; }
  }
  return { total: Math.max(1, Math.round(base)), parts };
}
const medalFor = (lv, ms) => ms <= lv.gold * 1000 ? 'gold' : ms <= lv.gold * 1400 ? 'silver' : ms <= lv.gold * 2000 ? 'bronze' : 'clear';

/* ---- scene render ---- */
function drawScene(ctx, g, save) {
  const t = g.tick;
  if (g.tick % 100 < 17) BOIL = (BOIL + 1) % 3;
  ctx.save();
  const sh = g.shake;
  if (sh > 0.3) ctx.translate(rnd(-sh, sh), rnd(-sh, sh));
  drawArena(ctx, g.lv.ch, t, g.lv.ch === 6);

  // hazards
  for (const hz of g.hazards) {
    ctx.save(); ctx.globalAlpha = clamp(hz.life / 400, 0, 1);
    ctx.strokeStyle = hz.col; ctx.lineWidth = 3;
    if (hz.type === 'beam') {
      ctx.globalAlpha *= 0.7; ctx.fillStyle = hz.col;
      ctx.fillRect(0, hz.y, W, hz.h);
      ctx.globalAlpha = 1; jline(ctx, 0, hz.y, W, hz.y, 61, 2); jline(ctx, 0, hz.y + hz.h, W, hz.y + hz.h, 62, 2);
    } else if (hz.type === 'wall') {
      const hh = hz.h * (hz.rise || 1);
      jrect(ctx, hz.x - hz.w / 2, GROUND - hh, hz.w, hh, 63, 1.4, 'rgba(74,124,147,0.20)');
    } else {
      jcirc(ctx, hz.x, hz.y + 10, 18 + Math.sin(t / 60) * 3, 64, 2.4);
      jline(ctx, hz.x - 16, GROUND, hz.x + 16, GROUND - 26, 65, 2);
    }
    ctx.restore();
  }

  // telegraphs
  for (const e of g.ents) {
    if (e.dead || e.spawnT > 0) continue;
    if (e.kind === 'boss' && e.move && e.moveT < e.wind) {
      ctx.save(); ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t / 55);
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
      if (e.move === 'beam' && e.beamY != null) { ctx.beginPath(); ctx.moveTo(0, e.beamY); ctx.lineTo(W, e.beamY); ctx.stroke(); }
      else if (e.move === 'sweep') { ctx.beginPath(); ctx.arc(e.x, e.y - e.h * 0.5, e.w / 2 + 110, -1.1, 1.1); ctx.stroke(); }
      else if (e.move === 'lunge' || e.move === 'spin') { ctx.beginPath(); ctx.moveTo(e.x, e.y - 30); ctx.lineTo(e.x + 210 * e.face, e.y - 30); ctx.stroke(); }
      else { jcirc(ctx, e.x, e.y - e.h * 0.5, e.w * 0.9 + Math.sin(t / 50) * 5, 66, 3); }
      ctx.restore();
    } else if (e.kind === 'enemy' && e.state === 'atk' && e.stateT < e.windup) {
      ctx.save(); ctx.globalAlpha = 0.6; ctx.strokeStyle = C.red; ctx.lineWidth = 2.6;
      const r = e.def.ranged ? 16 : e.def.reach;
      if (e.def.ranged) jcirc(ctx, e.x + 18 * e.face, e.y - 40, 8 + (e.stateT / e.windup) * 8, 67, 1.4);
      else { ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(e.x, e.y - e.h * 0.5, r, -0.8 * e.face, 0.8 * e.face, e.face < 0); ctx.stroke(); }
      ctx.restore();
    }
  }

  // spawn markers
  for (const e of g.ents) {
    if (e.spawnT > 0) {
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = e.col || C.graphite; ctx.lineWidth = 2;
      jcirc(ctx, e.x, e.y - 30, 26 - e.spawnT / 20, 68, 2); ctx.restore();
    }
  }

  // enemies
  for (const e of g.ents) {
    if (e.spawnT > 0) continue;
    ctx.save();
    if (e.dead) ctx.globalAlpha = clamp(e.deadT / 520, 0, 1) * 0.7;
    if (e.kind === 'boss') {
      if (e.move === 'spin' && e.spin) { ctx.translate(e.x, e.y - e.h / 2); ctx.rotate(e.spin); ctx.translate(-e.x, -(e.y - e.h / 2)); }
      drawBoss(ctx, e, t);
    } else {
      drawFighter(ctx, e, {
        line: e.col, accent: e.col, thick: e.type === 'brute' ? 1.35 : 1,
        head: e.type === 'copy' ? 'band' : e.type === 'brute' ? 'cap' : 'none',
        back: e.type === 'copy' ? 'scarf' : 'nothingb',
        wp: e.type === 'brute' ? WEAPONS[3] : e.type === 'copy' ? (g.stats.wp) : e.type === 'lobber' ? WEAPONS[0] : WEAPONS[1],
      }, t);
    }
    // small hp pip
    if (!e.dead && e.kind !== 'boss' && e.hp < e.maxHp) {
      const bw = 30, bx = e.x - bw / 2, by = e.y - e.h - 14;
      ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = C.red; ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), 4);
    }
    ctx.restore();
  }

  // shockwave rings
  for (const r of g.rings) {
    const a = clamp(r.life / r.maxLife, 0, 1);
    ctx.save(); ctx.globalAlpha = a * 0.85; ctx.strokeStyle = r.col; ctx.lineWidth = 2 + a * 4;
    jcirc(ctx, r.x, r.y, r.r, 91, 2.2);
    ctx.globalAlpha = a * 0.5; ctx.lineWidth = 1.6;
    jcirc(ctx, r.x, r.y, r.r * 0.72, 92, 2.6);
    ctx.restore();
  }

  // player
  if (!g.player.dead || g.player.deadT > 0) {
    const sk = SKINS.find(s => s.id === save.skin) || SKINS[0];
    ctx.save();
    if (g.player.dead) ctx.globalAlpha = clamp(g.player.deadT / 800, 0, 1);
    drawFighter(ctx, g.player, {
      line: sk.line, accent: sk.accent, thick: sk.thick, glow: sk.glow ? sk.accent : null, ghost: sk.ghost,
      head: save.head, back: save.back, wp: g.stats.wp,
    }, t);
    ctx.restore();
    // block shield
    if (g.player.state === 'block') {
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = C.blueDk; ctx.lineWidth = 3;
      const px = g.player.x + 20 * g.player.face;
      ctx.beginPath(); ctx.arc(px, g.player.y - 34, 30, -1.2, 1.2, g.player.face < 0); ctx.stroke();
      ctx.restore();
    }
  }

  // projectiles
  for (const q of g.projs) {
    ctx.save(); ctx.strokeStyle = q.col; ctx.lineWidth = 2.6; ctx.fillStyle = q.col; ctx.globalAlpha = 0.85;
    jcirc(ctx, q.x, q.y, q.r, q.x | 0, 1.4, q.col);
    ctx.globalAlpha = 0.3;
    jline(ctx, q.x - q.vx * 2.4, q.y - q.vy * 2.4, q.x, q.y, 69, 1.2);
    ctx.restore();
  }

  // ink drops
  for (const dp of g.drops) {
    ctx.save();
    ctx.globalAlpha = dp.life < 2000 && Math.floor(t / 130) % 2 ? 0.35 : 1;
    const bob = Math.sin(t / 240) * 3;
    ctx.strokeStyle = C.green; ctx.lineWidth = 2.6; ctx.fillStyle = 'rgba(94,140,97,0.30)';
    ctx.beginPath();
    ctx.moveTo(dp.x, dp.y - 12 + bob);
    ctx.bezierCurveTo(dp.x + 9, dp.y + bob, dp.x + 7, dp.y + 9 + bob, dp.x, dp.y + 9 + bob);
    ctx.bezierCurveTo(dp.x - 7, dp.y + 9 + bob, dp.x - 9, dp.y + bob, dp.x, dp.y - 12 + bob);
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  drawParts(ctx, g);

  // quip
  if (g.quipT > 0 && g.boss && !g.boss.dead) {
    ctx.save(); ctx.globalAlpha = clamp(g.quipT / 500, 0, 1);
    ctx.font = `italic 21px ${FONT_HAND}`; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = g.lv.ch === 6 ? '#242028' : C.paper;
    ctx.strokeText(g.quip, W / 2, 80); ctx.fillStyle = g.boss.col; ctx.fillText(g.quip, W / 2, 80);
    ctx.restore();
  }
  // banner
  if (g.bannerT > 0) {
    ctx.save();
    const a = clamp(g.bannerT / 500, 0, 1);
    ctx.globalAlpha = a; ctx.textAlign = 'center';
    ctx.font = `900 ${58}px ${FONT_DISP}`;
    ctx.lineWidth = 8; ctx.strokeStyle = g.lv.ch === 6 ? '#242028' : C.paper;
    ctx.strokeText(g.banner, W / 2, H / 2 - 40);
    ctx.fillStyle = g.lv.ch === 6 ? C.ink : C.graphite;
    ctx.fillText(g.banner, W / 2, H / 2 - 40);
    ctx.restore();
  }
  // intro
  if (g.intro > 0) {
    ctx.save(); ctx.textAlign = 'center';
    const txt = g.intro > 400 ? 'READY' : 'GO';
    ctx.font = `900 ${g.intro > 400 ? 56 : 76}px ${FONT_DISP}`;
    ctx.globalAlpha = clamp(g.intro > 400 ? 1 : g.intro / 400 + 0.3, 0, 1);
    ctx.lineWidth = 8; ctx.strokeStyle = g.lv.ch === 6 ? '#242028' : C.paper;
    ctx.strokeText(txt, W / 2, H / 2);
    ctx.fillStyle = g.intro > 400 ? C.graphite : C.red;
    ctx.fillText(txt, W / 2, H / 2); ctx.restore();
  }
  ctx.restore();

  if (g.flash > 0.02) { ctx.save(); ctx.globalAlpha = g.flash * 0.30; ctx.fillStyle = C.red; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

/* ============================================================
   UI PRIMITIVES — the boiling hand-drawn border
   ============================================================ */
const STYLE = `
@keyframes ib-boil { 0%,33%{opacity:1} 34%,100%{opacity:0} }
.ib-b>g{animation:ib-boil .33s steps(1,end) infinite}
.ib-b>g:nth-child(1){animation-delay:0s}
.ib-b>g:nth-child(2){animation-delay:-.11s}
.ib-b>g:nth-child(3){animation-delay:-.22s}
@keyframes ib-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ib-rise{animation:ib-rise .35s ease-out both}
@keyframes ib-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.ib-pulse{animation:ib-pulse 1.6s ease-in-out infinite}
@keyframes ib-rotate{0%,20%{transform:rotate(0)}55%,80%{transform:rotate(-90deg)}100%{transform:rotate(-90deg)}}
@keyframes ib-glow{0%,100%{filter:drop-shadow(0 0 2px rgba(242,201,76,.6))}50%{filter:drop-shadow(0 0 10px rgba(242,201,76,1))}}
.ib-panel{transition:transform .14s ease, box-shadow .14s ease}
.ib-panel:hover{transform:translateY(-3px) rotate(-.4deg)}
.ib-btn{transition:transform .08s ease, filter .12s ease}
.ib-btn:hover{transform:translateY(-2px)}
.ib-btn:active{transform:translateY(1px)}
.ib-btn:focus-visible{outline:3px solid ${C.blueDk};outline-offset:3px}
.ib-scroll::-webkit-scrollbar{width:10px;height:10px}
.ib-scroll::-webkit-scrollbar-thumb{background:${C.paper2};border-radius:6px}
.ib-scroll::-webkit-scrollbar-track{background:transparent}
input.ib-in:focus{outline:none}
@media (prefers-reduced-motion: reduce){
  .ib-b>g{animation:none!important}
  .ib-b>g:nth-child(2),.ib-b>g:nth-child(3){opacity:0}
  .ib-rise,.ib-pulse{animation:none!important}
  .ib-panel:hover{transform:none}
}
`;

function rpath(w, h, k) {
  if (w < 4 || h < 4) return '';
  const R = (i) => { const x = Math.sin(i * 97.3 + k * 41.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  const a = 2.4, i0 = 3;
  const P = (x, y, i) => [x + R(i) * a, y + R(i + 50) * a];
  const c = [P(i0, i0, 1), P(w - i0, i0, 2), P(w - i0, h - i0, 3), P(i0, h - i0, 4)];
  const m = [P(w / 2, i0, 5), P(w - i0, h / 2, 6), P(w / 2, h - i0, 7), P(i0, h / 2, 8)];
  return `M${c[0][0]},${c[0][1]} Q${m[0][0]},${m[0][1] - a} ${c[1][0]},${c[1][1]}`
       + ` Q${m[1][0] + a},${m[1][1]} ${c[2][0]},${c[2][1]}`
       + ` Q${m[2][0]},${m[2][1] + a} ${c[3][0]},${c[3][1]}`
       + ` Q${m[3][0] - a},${m[3][1]} ${c[0][0]},${c[0][1]} Z`;
}

function Rough({ children, style, col = C.graphite, sw = 2.2, fill = 'transparent', pad = 16, onClick, as = 'div', title, ...rest }) {
  const ref = useRef(null);
  const [d, setD] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setD({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el); setD({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} onClick={onClick} title={title}
      className={onClick ? 'ib-btn' : undefined}
      style={{ position: 'relative', padding: pad, cursor: onClick ? 'pointer' : undefined, ...style }} {...rest}>
      <svg className="ib-b" width="100%" height="100%" viewBox={`0 0 ${d.w || 10} ${d.h || 10}`} preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }} aria-hidden="true">
        {[0, 1, 2].map(k => (
          <g key={k}>
            <path d={rpath(d.w, d.h, k)} fill={fill} stroke={col} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
      </svg>
      <div style={{ position: 'relative' }}>{children}</div>
    </Tag>
  );
}

function Btn({ children, onClick, tone = 'ink', big, disabled, wide, style }) {
  const map = { ink: [C.graphite, C.paper], go: [C.graphite, C.ink], danger: [C.red, C.paper], quiet: ['#8A8270', 'transparent'] };
  const [col, bg] = map[tone];
  return (
    <Rough as="button" onClick={disabled ? undefined : onClick} disabled={disabled} col={disabled ? '#B5AE9D' : col} fill={disabled ? 'transparent' : bg}
      sw={big ? 2.8 : 2.2} pad={big ? '13px 26px' : '9px 16px'}
      style={{ background: 'none', border: 0, opacity: disabled ? 0.45 : 1, width: wide ? '100%' : undefined, ...style }}>
      <span style={{ fontFamily: FONT_DISP, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
        fontSize: big ? 19 : 14, color: disabled ? '#8A8270' : col, whiteSpace: 'nowrap' }}>{children}</span>
    </Rough>
  );
}

const Ink = ({ n, size = 15 }) => (
  <span style={{ fontFamily: FONT_DATA, fontWeight: 700, fontSize: size, color: '#8A6A12', whiteSpace: 'nowrap' }}>
    <span style={{ color: C.ink, WebkitTextStroke: `0.6px #8A6A12`, marginRight: 4 }}>{'\u25C6'}</span>{commas(n)}
  </span>
);

const Label = ({ children, col = '#8A8270' }) => (
  <div style={{ fontFamily: FONT_DATA, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: col }}>{children}</div>
);
const Head = ({ children, size = 30, col = C.graphite, style }) => (
  <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: size, letterSpacing: '0.06em', textTransform: 'uppercase', color: col, lineHeight: 1.02, ...style }}>{children}</div>
);
const Hand = ({ children, size = 17, col = '#3A362E', style }) => (
  <div style={{ fontFamily: FONT_HAND, fontSize: size, color: col, lineHeight: 1.62, whiteSpace: 'pre-line', ...style }}>{children}</div>
);
const MEDAL = { gold: C.ink, silver: '#B9B4A6', bronze: '#B07A46', clear: '#8A8270' };

/* ============================================================
   FIGHT SCREEN
   ============================================================ */
const KEYMAP = {
  ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right',
  ArrowUp:'up', w:'up', W:'up', ' ':'up',
  j:'atk', J:'atk', z:'atk', Z:'atk',
  k:'heavy', K:'heavy', x:'heavy', X:'heavy',
  l:'block', L:'block', c:'block', C:'block', ArrowDown:'block', s:'block', S:'block',
  Shift:'dash', e:'dash', E:'dash',
  i:'special', I:'special', u:'special', U:'special', Enter:'special',
};

/* ---------- virtual thumbstick (bottom-left) ---------- */
function Stick({ inp, size = 132 }) {
  const zone = useRef(null);
  const pid = useRef(null);
  const origin = useRef({ x: 0, y: 0 });
  const downAt = useRef(0);
  const maxMag = useRef(0);
  const lastTap = useRef(0);
  const wasUp = useRef(false);
  const [k, setK] = useState(null);          // {ox, oy, dx, dy} in px, null = resting
  const R = size * 0.42;

  const clearAll = () => { inp.current.left = false; inp.current.right = false; inp.current.block = false; };

  const apply = (dx, dy) => {
    const nx = dx / R, ny = dy / R;
    const i = inp.current;
    const down = ny > 0.52 && Math.abs(nx) < 0.75;
    i.block = down;
    i.left = !down && nx < -0.26;
    i.right = !down && nx > 0.26;
    const up = ny < -0.52;
    if (up && !wasUp.current) i.up = true;
    wasUp.current = up;
  };

  const onDown = (e) => {
    if (pid.current !== null) return;
    pid.current = e.pointerId;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    const r = zone.current.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    origin.current = { x: e.clientX, y: e.clientY };
    downAt.current = performance.now(); maxMag.current = 0; wasUp.current = false;
    setK({ ox, oy, dx: 0, dy: 0 });
    e.preventDefault();
  };

  const onMove = (e) => {
    if (pid.current !== e.pointerId) return;
    let dx = e.clientX - origin.current.x, dy = e.clientY - origin.current.y;
    const m = Math.hypot(dx, dy);
    if (m > R) { dx = dx / m * R; dy = dy / m * R; }
    maxMag.current = Math.max(maxMag.current, m / R);
    apply(dx, dy);
    setK(p => (p ? { ...p, dx, dy } : p));
    e.preventDefault();
  };

  const onUp = (e) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    const dur = performance.now() - downAt.current;
    if (dur < 220 && maxMag.current < 0.42) {          // a tap; two taps = dash
      const now = performance.now();
      if (now - lastTap.current < 340) { inp.current.dash = true; lastTap.current = 0; }
      else lastTap.current = now;
    }
    clearAll(); wasUp.current = false;
    setK(null);
  };

  const live = !!k;
  const bx = live ? k.ox : size / 2, by = live ? k.oy : size / 2;

  return (
    <div ref={zone} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      onContextMenu={e => e.preventDefault()}
      style={{ position: 'absolute', left: 0, bottom: 0, width: '44%', height: '78%', touchAction: 'none', userSelect: 'none', zIndex: 5 }}>
      <div style={{ position: 'absolute', left: 14, bottom: 14, width: size, height: size }}>
        <div style={{ position: 'absolute', left: bx - size / 2, top: by - size / 2, width: size, height: size, borderRadius: '50%',
          border: `2.5px dashed ${C.blueDk}`, background: 'rgba(232,223,200,0.30)', opacity: live ? 0.95 : 0.6, transition: live ? 'none' : 'opacity .2s' }} />
        <div style={{ position: 'absolute', left: bx + (live ? k.dx : 0) - 34, top: by + (live ? k.dy : 0) - 34, width: 68, height: 68, borderRadius: '50%',
          border: `3px solid ${C.graphite}`, background: 'rgba(232,223,200,0.80)', display: 'grid', placeItems: 'center',
          fontFamily: FONT_DATA, fontSize: 9, letterSpacing: '0.1em', color: '#6A6355', pointerEvents: 'none' }}>
          {live ? '' : 'MOVE'}
        </div>
      </div>
    </div>
  );
}

/* ---------- action buttons (bottom-right, on a diagonal) ---------- */
function ActionPad({ inp, powerFull, wpName }) {
  const [lit, setLit] = useState({});
  const press = (k, v) => (ev) => {
    ev.preventDefault();
    inp.current[k] = v;
    setLit(s => ({ ...s, [k]: v }));
  };
  const btn = (label, k, col, right, bottom, size, glow) => (
    <button key={k} disabled={false}
      onPointerDown={press(k, true)} onPointerUp={press(k, false)} onPointerCancel={press(k, false)} onPointerLeave={press(k, false)}
      onContextMenu={e => e.preventDefault()}
      style={{
        position: 'absolute', right, bottom, width: size, height: size, borderRadius: '50%',
        border: `3px solid ${col}`, background: lit[k] ? col : 'rgba(232,223,200,0.74)',
        color: lit[k] ? C.paper : col, fontFamily: FONT_DISP, fontWeight: 900, fontSize: size > 78 ? 15 : 13,
        letterSpacing: '0.06em', touchAction: 'none', userSelect: 'none', padding: 0, lineHeight: 1.05, pointerEvents: 'auto',
        boxShadow: glow ? `0 0 0 4px rgba(242,201,76,0.35), 0 0 18px rgba(242,201,76,0.8)` : 'none',
        transform: lit[k] ? 'scale(0.94)' : 'none', transition: 'transform .05s',
      }}>
      {label}
    </button>
  );
  return (
    <div style={{ position: 'absolute', right: 0, bottom: 0, width: 300, height: 300, zIndex: 5, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {btn('PUNCH', 'atk', C.red, 16, 14, 82, false)}
        {btn('KICK', 'heavy', C.red, 80, 70, 78, false)}
        {btn('JUMP', 'up', C.graphite, 142, 126, 74, false)}
        {powerFull && (
          <>
            {btn('POWER', 'special', '#8A6A12', 200, 180, 82, true)}
            <div style={{ position: 'absolute', right: 176, bottom: 266, width: 130, textAlign: 'center', fontFamily: FONT_DISP, fontWeight: 900, fontSize: 11,
              letterSpacing: '0.14em', color: '#8A6A12', textShadow: `0 0 6px ${C.paper}`, pointerEvents: 'none' }}>{wpName || 'READY'}</div>
          </>
        )}
      </div>
    </div>
  );
}

function FightScreen({ levelId, save, onEnd, onQuit }) {
  const cvs = useRef(null), gRef = useRef(null), inp = useRef({}), pausedRef = useRef(false), doneRef = useRef(false);
  const endRef = useRef(onEnd);
  useEffect(() => { endRef.current = onEnd; }, [onEnd]);
  const [hud, setHud] = useState({ hp: 1, maxHp: 1, t: 0, combo: 0, dashes: 0, boss: null, left: 0, wave: 0, waves: 1, power: 0 });
  const [paused, setPaused] = useState(false);
  const [touch, setTouch] = useState(false);
  const [portrait, setPortrait] = useState(false);
  const lv = LEVELS.find(l => l.id === levelId);

  useEffect(() => { setTouch(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)); }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(orientation: portrait)');
    const on = () => setPortrait(mq.matches);
    on();
    if (mq.addEventListener) { mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }
    mq.addListener(on); return () => mq.removeListener(on);
  }, []);
  const blocked = touch && portrait;
  useEffect(() => { pausedRef.current = paused || blocked; if (blocked) inp.current = {}; }, [paused, blocked]);

  useEffect(() => {
    const down = e => {
      if (e.key === 'Escape') { setPaused(p => !p); return; }
      const k = KEYMAP[e.key]; if (!k) return;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      inp.current[k] = true;
    };
    const up = e => { const k = KEYMAP[e.key]; if (k) inp.current[k] = false; };
    const blur = () => { inp.current = {}; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  useEffect(() => {
    gRef.current = newGame(levelId, save);
    doneRef.current = false;
    const c = cvs.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0, last = performance.now(), hudT = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, now - last); last = now;
      const g = gRef.current; if (!g) return;
      if (!pausedRef.current) {
        step(g, dt, inp.current);
        inp.current.up = false; inp.current.dash = false; inp.current.special = false;
      }
      drawScene(ctx, g, save);
      hudT += dt;
      if (hudT > 70) {
        hudT = 0;
        setHud({
          hp: g.player.hp, maxHp: g.player.maxHp, t: g.elapsed, combo: g.combo, dashes: g.player.dashes, power: g.power,
          boss: g.boss && !g.boss.dead ? { name: g.boss.name, f: g.boss.hp / g.boss.maxHp, ph: g.boss.phase } : null,
          left: g.ents.filter(e => !e.dead).length, wave: g.waveIdx + 1, waves: g.lv.waves.length, phase: g.phase,
        });
      }
      if (g.phase !== 'fight' && g.endT > 1400 && !doneRef.current) {
        doneRef.current = true;
        endRef.current(g.phase === 'won', { ms: g.elapsed, hits: g.hitsTaken, combo: g.maxCombo });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [levelId]);

  const hpPct = clamp(hud.hp / hud.maxHp, 0, 1);
  const stats = statsOf(save);
  const hasWeapon = stats.wp.id !== 'fists';
  const powerFull = hud.power >= 1;

  const hudOverlay = (
    <>
      <div style={{ position: 'absolute', left: 14, top: 10, width: 'min(44%, 300px)' }}>
        <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 14, letterSpacing: '0.1em', color: C.graphite, textShadow: `0 0 4px ${C.paper}` }}>{save.name.toUpperCase()}</div>
        <div style={{ height: 14, background: 'rgba(34,32,28,0.14)', border: `2px solid ${C.graphite}`, borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
          <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpPct > 0.35 ? C.green : C.red, transition: 'width .12s linear' }} />
        </div>
        {hasWeapon && (
          <div style={{ height: 10, background: 'rgba(34,32,28,0.14)', border: `2px solid ${powerFull ? '#8A6A12' : C.graphite}`, borderRadius: 3, overflow: 'hidden', marginTop: 4,
            boxShadow: powerFull ? '0 0 12px rgba(242,201,76,0.9)' : 'none' }}>
            <div style={{ width: `${clamp(hud.power, 0, 1) * 100}%`, height: '100%', background: C.ink, transition: 'width .12s linear' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 4, marginTop: 5, alignItems: 'center' }}>
          {Array.from({ length: stats.dashes }).map((_, i) => (
            <div key={i} style={{ width: 18, height: 5, background: i < hud.dashes ? C.blueDk : 'rgba(34,32,28,0.18)', borderRadius: 3 }} />
          ))}
          <span style={{ fontFamily: FONT_DATA, fontSize: 10, color: '#7A7466', marginLeft: 4 }}>DASH</span>
          {hasWeapon && powerFull && (
            <span style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 12, letterSpacing: '0.12em', color: '#8A6A12', marginLeft: 8 }}>
              {(stats.wp.special || 'POWER') + ' READY'}
            </span>
          )}
        </div>
      </div>

      {hud.combo > 1 && (
        <div style={{ position: 'absolute', left: 14, top: 104, fontFamily: FONT_DISP, fontWeight: 900, fontSize: 15 + Math.min(hud.combo, 18) * 1.5, color: '#8A6A12', textShadow: `0 0 6px ${C.paper}` }}>
          {hud.combo}<span style={{ fontSize: 15 }}> HIT</span>
        </div>
      )}

      <div style={{ position: 'absolute', right: 14, top: 10, textAlign: 'right' }}>
        <div style={{ fontFamily: FONT_DATA, fontSize: 20, fontWeight: 700, color: hud.t / 1000 > lv.gold ? '#8A8270' : '#8A6A12', textShadow: `0 0 4px ${C.paper}` }}>{fmt(hud.t)}</div>
        {hud.boss ? (
          <div style={{ width: 'min(46vw, 300px)', marginTop: 2 }}>
            <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 15, letterSpacing: '0.12em', color: C.red, textShadow: `0 0 4px ${C.paper}` }}>{hud.boss.name}</div>
            <div style={{ height: 12, background: 'rgba(34,32,28,0.14)', border: `2px solid ${C.graphite}`, borderRadius: 3, overflow: 'hidden', marginTop: 3 }}>
              <div style={{ width: `${hud.boss.f * 100}%`, height: '100%', background: C.red, transition: 'width .12s linear' }} />
            </div>
            <div style={{ fontFamily: FONT_DATA, fontSize: 10, color: '#7A7466', marginTop: 2 }}>{`PHASE ${hud.boss.ph + 1}`}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#7A7466' }}>{`WAVE ${hud.wave}/${hud.waves}`}</div>
            <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 19, color: C.graphite, textShadow: `0 0 4px ${C.paper}` }}>{`${hud.left} LEFT`}</div>
          </div>
        )}
      </div>
    </>
  );

  const pauseOverlay = paused && (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(232,223,200,0.93)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 20, padding: 16 }}>
      <Head size={34}>Paused</Head>
      <Hand size={14} col="#6A6355" style={{ textAlign: 'center', maxWidth: 420, lineHeight: 1.55 }}>
        {touch
          ? 'Thumbstick: slide to move \u00B7 flick up to jump \u00B7 pull down to block (pull down right as a hit lands = parry) \u00B7 double-tap it to dash. Right hand: PUNCH, KICK, JUMP. The gold button appears when your power meter fills.'
          : 'Move \u2190 \u2192 \u00B7 Jump \u2191 \u00B7 Punch J \u00B7 Kick K \u00B7 Block L \u00B7 Dash Shift \u00B7 Power move I'}
      </Hand>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn big onClick={() => setPaused(false)}>Resume</Btn>
        <Btn tone="quiet" onClick={onQuit}>Leave level</Btn>
      </div>
    </div>
  );

  /* ---------- touch: fullscreen landscape ---------- */
  if (touch) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: C.night, zIndex: 90, overflow: 'hidden', touchAction: 'none',
        paddingLeft: 'env(safe-area-inset-left, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)',
        paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {blocked ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, background: C.paper }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ animation: 'ib-rotate 2.4s ease-in-out infinite' }}>
              <rect x="40" y="16" width="40" height="72" rx="6" fill="none" stroke={C.graphite} strokeWidth="3.5" />
              <line x1="52" y1="24" x2="68" y2="24" stroke={C.graphite} strokeWidth="3" strokeLinecap="round" />
              <circle cx="60" cy="80" r="3" fill={C.graphite} />
              <path d="M22 100 Q 60 116 98 100" fill="none" stroke={C.blueDk} strokeWidth="3" strokeDasharray="5 5" />
              <path d="M92 94 L 100 100 L 92 106" fill="none" stroke={C.blueDk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Head size={28} style={{ textAlign: 'center' }}>Turn your device</Head>
            <Hand size={16} col="#6A6355" style={{ textAlign: 'center', maxWidth: 320 }}>
              {'Inkbound is drawn on its side. Hold the phone landscape \u2014 thumbstick left, buttons right.'}
            </Hand>
            <Btn tone="quiet" onClick={onQuit}>Back to the map</Btn>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <canvas ref={cvs} style={{ width: '100%', height: '100%', maxWidth: 'calc(100vh * 16 / 9)', maxHeight: 'calc(100vw * 9 / 16)', display: 'block', background: C.paper }} />
            </div>
            {hudOverlay}
            <button onClick={() => setPaused(p => !p)} onContextMenu={e => e.preventDefault()}
              style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 44, height: 30, borderRadius: 6,
                border: `2px solid ${C.graphite}`, background: 'rgba(232,223,200,0.7)', color: C.graphite, fontFamily: FONT_DISP, fontWeight: 900, fontSize: 12, zIndex: 10 }}>
              {paused ? '\u25B6' : 'II'}
            </button>
            <Stick inp={inp} />
            <ActionPad inp={inp} powerFull={hasWeapon && powerFull} wpName={stats.wp.special} />
            {pauseOverlay}
          </>
        )}
      </div>
    );
  }

  /* ---------- desktop ---------- */
  return (
    <div style={{ maxWidth: 1020, margin: '0 auto', padding: '10px 12px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <Label>{`Chapter ${lv.ch} \u2014 ${CHAPTERS[lv.ch - 1].name}`}</Label>
          <Head size={22}>{`${lv.id}. ${lv.name}`}</Head>
        </div>
        <Btn tone="quiet" onClick={() => setPaused(p => !p)}>{paused ? 'Resume' : 'Pause'}</Btn>
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: C.paper, border: `3px solid ${C.graphite}`, borderRadius: 4, overflow: 'hidden' }}>
        <canvas ref={cvs} style={{ width: '100%', height: '100%', display: 'block' }} />
        {hudOverlay}
        {pauseOverlay}
      </div>

      <div style={{ marginTop: 8, fontFamily: FONT_DATA, fontSize: 11, color: '#8A8270', letterSpacing: '0.08em' }}>
        {'\u2190 \u2192 MOVE  \u00B7  \u2191 JUMP  \u00B7  J PUNCH  \u00B7  K KICK  \u00B7  L BLOCK (tap on incoming = parry)  \u00B7  SHIFT DASH  \u00B7  I POWER MOVE  \u00B7  ESC PAUSE'}
      </div>
    </div>
  );
}

/* ============================================================
   JOURNEY MAP
   ============================================================ */
/* ---------- panel artwork: a small drawn scene per chapter ---------- */
function Stickman({ x, y, s = 1, col = C.graphite, pose = 'stand', flip = false }) {
  const t = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
  const arms = { stand: 'M0 -30 L -11 -18 M0 -30 L 11 -18', run: 'M0 -30 L -13 -34 M0 -30 L 12 -22',
    swing: 'M0 -30 L 16 -40 M0 -30 L -9 -20', up: 'M0 -30 L -10 -46 M0 -30 L 12 -46' }[pose] || 'M0 -30 L -11 -18 M0 -30 L 11 -18';
  const legs = { run: 'M0 -14 L -12 2 M0 -14 L 11 0', up: 'M0 -14 L -9 -1 M0 -14 L 10 -3' }[pose] || 'M0 -14 L -8 2 M0 -14 L 8 2';
  return (
    <g transform={t} stroke={col} strokeWidth="2.6" strokeLinecap="round" fill="none">
      <circle cx="0" cy="-42" r="6.5" />
      <path d="M0 -35 L 0 -14" />
      <path d={arms} />
      <path d={legs} />
    </g>
  );
}

function PanelArt({ ch, boss, locked, seed = 0 }) {
  const g = locked ? '#B9B2A1' : C.graphite;
  const acc = locked ? '#C8C1B0' : (CHAPTERS[ch - 1].color);
  const sky = locked ? '#E4DECD' : C.paper;
  const w = (n) => 30 + ((seed * 37 + n * 53) % 40);

  const scenes = {
    1: (
      <>
        <line x1="46" y1="0" x2="46" y2="120" stroke={C.red} strokeWidth="2" opacity="0.55" />
        {[26, 46, 66, 86].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke={acc} strokeWidth="1" opacity="0.3" />)}
        <path d={`M120 ${58} q 14 -18 26 -2 q 12 16 -6 18 q -20 2 -20 -16`} stroke={g} strokeWidth="2.4" fill="none" />
        <path d="M118 74 q 20 10 40 -4" stroke={g} strokeWidth="2" fill="none" opacity="0.6" />
        <Stickman x={66} y={104} s={1} col={g} pose="run" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.4" />
      </>
    ),
    2: (
      <>
        {[...Array(9)].map((_, i) => <circle key={i} cx={16 + i * 21} cy={94 - (i % 3) * 5} r={2 + (i % 3)} fill={g} opacity="0.4" />)}
        <ellipse cx="140" cy="60" rx="42" ry="26" fill={acc} opacity="0.22" />
        <ellipse cx="126" cy="66" rx="30" ry="18" fill={acc} opacity="0.28" />
        <path d="M100 44 q 30 -14 56 4" stroke={g} strokeWidth="2" fill="none" opacity="0.45" strokeDasharray="4 5" />
        <Stickman x={54} y={104} s={1} col={g} pose="stand" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.4" strokeDasharray="14 6" />
      </>
    ),
    3: (
      <>
        {[...Array(11)].map((_, i) => <line key={'v' + i} x1={i * 20} y1="0" x2={i * 20} y2="120" stroke={acc} strokeWidth="0.9" opacity="0.35" />)}
        {[...Array(7)].map((_, i) => <line key={'h' + i} x1="0" y1={i * 20} x2="200" y2={i * 20} stroke={acc} strokeWidth="0.9" opacity="0.35" />)}
        <rect x="120" y="24" width="14" height="76" fill="none" stroke={g} strokeWidth="2.6" />
        {[34, 48, 62, 76, 90].map(y => <line key={y} x1="120" y1={y} x2="128" y2={y} stroke={g} strokeWidth="1.6" />)}
        <Stickman x={58} y={104} s={1} col={g} pose="swing" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.6" />
      </>
    ),
    4: (
      <>
        <circle cx="150" cy="42" r="24" fill="#B05A8A" opacity="0.35" />
        <circle cx="176" cy="66" r="16" fill={C.ink} opacity="0.4" />
        <circle cx="128" cy="70" r="13" fill={C.blue} opacity="0.45" />
        <path d="M96 104 q 16 -26 34 -6" stroke="#B05A8A" strokeWidth="3" fill="none" opacity="0.5" />
        <path d="M8 96 q 22 -10 30 8" stroke={C.green} strokeWidth="3" fill="none" opacity="0.4" />
        <Stickman x={56} y={104} s={1} col={g} pose="up" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.4" />
      </>
    ),
    5: (
      <>
        {[[150, 40, 16], [176, 78, 12], [118, 34, 10]].map(([cx, cy, r], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={g} strokeWidth="2" opacity="0.6" />
            <path d={`M${cx - r * 0.6} ${cy - r * 0.3} l ${r} ${r * 0.5} M${cx - r * 0.5} ${cy + r * 0.5} l ${r * 0.9} ${-r * 0.7}`} stroke={g} strokeWidth="1.4" opacity="0.5" />
          </g>
        ))}
        <Stickman x={52} y={104} s={1} col={g} pose="stand" />
        <Stickman x={96} y={104} s={1} col={acc} pose="stand" flip />
        <line x1="74" y1="34" x2="74" y2="100" stroke={C.red} strokeWidth="1.4" strokeDasharray="4 6" opacity="0.6" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.4" />
      </>
    ),
    6: (
      <>
        <rect x="0" y="0" width="200" height="120" fill={locked ? '#DCD5C4' : '#F3EDDC'} />
        <path d="M150 -6 L 168 46 L 158 76 L 148 46 Z" fill="none" stroke={C.purple} strokeWidth="2.6" />
        <path d="M153 46 L 163 46" stroke={C.purple} strokeWidth="2" />
        <circle cx="158" cy="86" r="4" fill={C.purple} opacity="0.6" />
        <path d="M100 20 q 34 30 4 66" stroke={C.purple} strokeWidth="1.4" fill="none" opacity="0.4" strokeDasharray="3 6" />
        <Stickman x={48} y={104} s={1.1} col={g} pose="swing" />
        <line x1="0" y1="104" x2="200" y2="104" stroke={g} strokeWidth="2.6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%', background: sky }}>
      {scenes[ch]}
      {boss && !locked && (
        <g>
          <path d={`M138 100 q -22 -${44 + w(1) * 0.4} 6 -${52 + w(2) * 0.3} q 30 -8 26 30 q -4 24 -8 22`} fill={ch === 4 ? '#B05A8A' : ch === 6 ? C.purple : C.red} opacity="0.16" />
          <path d="M136 100 q -18 -46 8 -58 q 30 -12 30 26 q 0 22 -6 32" fill="none" stroke={ch === 6 ? C.purple : C.red} strokeWidth="3" strokeLinecap="round" />
          <circle cx="150" cy="52" r="4.5" fill={ch === 6 ? C.purple : C.red} />
          <circle cx="166" cy="54" r="4.5" fill={ch === 6 ? C.purple : C.red} />
        </g>
      )}
      {locked && (
        <>
          <rect x="0" y="0" width="200" height="120" fill="#E8DFC8" opacity="0.55" />
          <text x="100" y="76" textAnchor="middle" fontFamily={FONT_DISP} fontWeight="900" fontSize="52" fill="#B9B2A1">?</text>
        </>
      )}
    </svg>
  );
}

function Panel({ lv, save, onPick, idx }) {
  const cleared = !!save.cleared[lv.id];
  const unlocked = lv.id <= save.level;
  const best = save.best[lv.id];
  const medal = cleared && best ? medalFor(lv, best) : null;
  const isBoss = lv.kind === 'boss';
  const current = lv.id === save.level && !cleared;
  const ch = CHAPTERS[lv.ch - 1];
  const caption = unlocked ? lv.story.split('\n')[0].split('. ')[0].slice(0, 74) : null;
  const tilt = ((lv.id * 7) % 3 - 1) * 0.35;

  return (
    <div
      className={'ib-panel' + (current ? ' ib-rise' : '')}
      onClick={unlocked ? () => onPick(lv) : undefined}
      role={unlocked ? 'button' : undefined} tabIndex={unlocked ? 0 : -1}
      onKeyDown={e => { if (unlocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(lv); } }}
      style={{
        position: 'relative', flex: isBoss ? '1 1 320px' : '1 1 220px', minWidth: 210, maxWidth: isBoss ? 460 : 320,
        border: `3px solid ${unlocked ? C.graphite : '#C4BDAC'}`, background: C.paper,
        boxShadow: current ? `4px 4px 0 ${C.ink}, 0 0 0 3px ${C.ink}` : `4px 4px 0 rgba(34,32,28,0.16)`,
        cursor: unlocked ? 'pointer' : 'not-allowed', transform: `rotate(${tilt}deg)`,
        opacity: unlocked ? 1 : 0.72, overflow: 'hidden',
      }}>

      {/* art */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: isBoss ? '16 / 8' : '16 / 10', borderBottom: `3px solid ${unlocked ? C.graphite : '#C4BDAC'}` }}>
        <PanelArt ch={lv.ch} boss={isBoss} locked={!unlocked} seed={lv.id} />

        {/* panel number, top-left caption box */}
        <div style={{ position: 'absolute', left: 0, top: 0, background: '#F6EFD9', borderRight: `2.5px solid ${C.graphite}`, borderBottom: `2.5px solid ${C.graphite}`, padding: '3px 8px 4px' }}>
          <div style={{ fontFamily: FONT_DATA, fontSize: 9.5, letterSpacing: '0.14em', color: '#7A7466' }}>{`CH ${lv.ch}`}</div>
          <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 17, lineHeight: 0.95, color: unlocked ? C.graphite : '#B5AE9D' }}>{`#${lv.id}`}</div>
        </div>

        {/* boss klaxon */}
        {isBoss && unlocked && (
          <div style={{ position: 'absolute', right: 8, top: 8, background: C.red, color: C.paper, fontFamily: FONT_DISP, fontWeight: 900,
            fontSize: 11, letterSpacing: '0.16em', padding: '3px 8px', transform: 'rotate(3deg)', border: `2px solid ${C.graphite}` }}>BOSS</div>
        )}

        {/* medal stamp */}
        {cleared && (
          <div style={{ position: 'absolute', right: 8, bottom: 8, width: 46, height: 46, borderRadius: '50%',
            border: `3px solid ${MEDAL[medal]}`, color: MEDAL[medal], background: 'rgba(232,223,200,0.86)',
            display: 'grid', placeItems: 'center', transform: 'rotate(-11deg)', fontFamily: FONT_DISP, fontWeight: 900,
            fontSize: 10, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.05 }}>
            {medal.toUpperCase()}
          </div>
        )}

        {/* you are here */}
        {current && (
          <div style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%) rotate(-2deg)', background: C.ink,
            border: `2.5px solid ${C.graphite}`, padding: '2px 10px', fontFamily: FONT_DISP, fontWeight: 900, fontSize: 11.5, letterSpacing: '0.14em', color: C.graphite }}>
            YOU ARE HERE
          </div>
        )}
      </div>

      {/* caption strip */}
      <div style={{ padding: '8px 10px 10px', background: '#F6EFD9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: unlocked ? (isBoss ? C.red : ch.color) : '#B5AE9D' }}>
            {unlocked ? lv.name : 'NOT DRAWN YET'}
          </div>
          <div style={{ fontFamily: FONT_DATA, fontSize: 10.5, color: '#8A8270', whiteSpace: 'nowrap' }}>
            {cleared ? fmt(best) : unlocked ? `par ${fmt(lv.gold * 1000)}` : 'locked'}
          </div>
        </div>
        <Hand size={13.5} col="#6A6355" style={{ marginTop: 4, lineHeight: 1.4 }}>
          {unlocked ? `${caption}\u2026` : 'The page ahead is still blank.'}
        </Hand>
      </div>
    </div>
  );
}

function MapScreen({ save, board, onPick, onShop, onBoard, onSettings }) {
  const stats = statsOf(save);
  const reached = save.level;
  const nextBuy = useMemo(() => {
    const opts = [];
    UPGRADES.forEach(u => { const l = save.ups[u.id]; if (l < u.max) opts.push({ label: `${u.name} ${l + 1}`, cost: upCost(u, l) }); });
    WEAPONS.forEach(w => { if (!save.ownedW.includes(w.id)) opts.push({ label: w.name, cost: w.cost }); });
    SKINS.forEach(w => { if (!save.ownedS.includes(w.id)) opts.push({ label: w.name, cost: w.cost }); });
    WEARS.forEach(w => { if (!save.ownedC.includes(w.id)) opts.push({ label: w.name, cost: w.cost }); });
    opts.sort((a, b) => a.cost - b.cost);
    const afford = opts.filter(o => o.cost <= save.ink);
    return { cheapest: opts[0], affordCount: afford.length };
  }, [save]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '8px 16px 60px' }}>
      {/* status strip */}
      <Rough style={{ marginBottom: 18, background: 'rgba(255,255,255,0.35)' }} pad="14px 18px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Label>Playing as</Label>
            <Head size={26}>{save.name}</Head>
            <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#8A8270', marginTop: 2 }}>
              {`${stats.wp.name.toUpperCase()} \u00B7 ${Object.values(save.ups).reduce((a, b) => a + b, 0)} UPGRADES \u00B7 ${Object.keys(save.cleared).length}/18 CLEARED`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Label>Ink</Label>
            <Ink n={save.ink} size={28} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn tone="go" onClick={onShop}>Armoury</Btn>
            <Btn onClick={onBoard}>Records</Btn>
            <Btn tone="quiet" onClick={onSettings}>Settings</Btn>
          </div>
        </div>
        {nextBuy.cheapest && (
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1.5px dashed ${C.paper2}`, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Hand size={15} col={nextBuy.affordCount ? '#8A6A12' : '#8A8270'}>
              {nextBuy.affordCount
                ? `${nextBuy.affordCount} thing${nextBuy.affordCount > 1 ? 's' : ''} in the armoury you can afford right now. Faster clears pay more ink.`
                : `Next in the armoury: ${nextBuy.cheapest.label} for ${commas(nextBuy.cheapest.cost)}. You're ${commas(nextBuy.cheapest.cost - save.ink)} short.`}
            </Hand>
            <Btn tone={nextBuy.affordCount ? 'go' : 'quiet'} onClick={onShop}>Spend it</Btn>
          </div>
        )}
      </Rough>

      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <Head size={22} col="#8A8270">THE JOURNEY SO FAR</Head>
        <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#A29B8A', letterSpacing: '0.1em' }}>{`PAGE ${Math.min(6, Math.ceil(reached / 3))} OF 6`}</div>
      </div>

      {CHAPTERS.map(ch => {
        const lvs = chapterLevels(ch.id);
        const open = lvs.some(l => l.id <= reached);
        const done = lvs.every(l => save.cleared[l.id]);
        return (
          <div key={ch.id} style={{ marginBottom: 26 }}>
            {/* chapter banner, like a comic page header */}
            <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: 12, border: `3px solid ${open ? C.graphite : '#C4BDAC'}`, background: open ? ch.color : '#D6CFBE' }}>
              <div style={{ width: 46, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.22)', borderRight: `3px solid ${open ? C.graphite : '#C4BDAC'}`,
                fontFamily: FONT_DISP, fontWeight: 900, fontSize: 22, color: C.paper }}>{ch.id}</div>
              <div style={{ flex: 1, padding: '7px 12px', minWidth: 0 }}>
                <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 21, letterSpacing: '0.1em', color: C.paper }}>
                  {open ? ch.name : 'SEALED'}
                </div>
                {open && <div style={{ fontFamily: FONT_DATA, fontSize: 10.5, color: 'rgba(255,255,255,0.82)', marginTop: 1 }}>{ch.blurb}</div>}
              </div>
              {done && (
                <div style={{ display: 'grid', placeItems: 'center', padding: '0 12px', background: 'rgba(255,255,255,0.22)', borderLeft: `3px solid ${C.graphite}`,
                  fontFamily: FONT_DISP, fontWeight: 900, fontSize: 12, letterSpacing: '0.1em', color: C.paper, whiteSpace: 'nowrap' }}>
                  {'\u2713 CLEARED'}
                </div>
              )}
            </div>

            {/* panel row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
              {lvs.map((l, i) => <Panel key={l.id} lv={l} save={save} onPick={onPick} idx={i} />)}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <Hand size={15} col="#8A8270">{'\u2026 to be continued, if you are fast enough.'}</Hand>
      </div>
    </div>
  );
}

/* ============================================================
   STORY CARD
   ============================================================ */
function StoryScreen({ title, eyebrow, body, cta, onGo, onBack, col = C.graphite }) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '30px 16px 60px' }} className="ib-rise">
      <Rough pad="30px 32px" fill="rgba(255,255,255,0.42)" col={col}>
        <Label col={col}>{eyebrow}</Label>
        <Head size={38} col={col} style={{ margin: '6px 0 18px' }}>{title}</Head>
        <Hand size={19}>{body}</Hand>
        <div style={{ display: 'flex', gap: 10, marginTop: 26, flexWrap: 'wrap' }}>
          <Btn big tone="go" onClick={onGo}>{cta}</Btn>
          {onBack && <Btn tone="quiet" onClick={onBack}>Back to map</Btn>}
        </div>
      </Rough>
    </div>
  );
}

/* ============================================================
   RESULT
   ============================================================ */
function ResultScreen({ won, lv, res, save, reward, pb, rank, onNext, onRetry, onShop, onMap }) {
  const medal = won ? medalFor(lv, res.ms) : null;
  const nextUp = useMemo(() => {
    const opts = [];
    UPGRADES.forEach(u => { const l = save.ups[u.id]; if (l < u.max) opts.push({ label: `${u.name} ${l + 1}`, cost: upCost(u, l), per: u.per }); });
    opts.sort((a, b) => a.cost - b.cost);
    return opts[0];
  }, [save]);

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '26px 16px 60px' }} className="ib-rise">
      <Rough pad="26px 28px" fill="rgba(255,255,255,0.42)" col={won ? C.graphite : C.red}>
        <Label col={won ? '#8A8270' : C.red}>{`Level ${lv.id} \u2014 ${lv.name}`}</Label>
        <Head size={44} col={won ? C.graphite : C.red} style={{ margin: '4px 0 16px' }}>{won ? 'Level clear' : 'Erased'}</Head>

        {won ? (
          <>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 18 }}>
              <div>
                <Label>Your time</Label>
                <div style={{ fontFamily: FONT_DATA, fontSize: 40, fontWeight: 700, color: C.graphite, lineHeight: 1 }}>{fmt(res.ms)}</div>
              </div>
              <div>
                <Label>Rating</Label>
                <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 26, color: MEDAL[medal], letterSpacing: '0.1em' }}>{medal.toUpperCase()}</div>
              </div>
              <div>
                <Label>Par</Label>
                <div style={{ fontFamily: FONT_DATA, fontSize: 18, color: '#8A8270' }}>{fmt(lv.gold * 1000)}</div>
              </div>
            </div>
            {pb && <div style={{ marginBottom: 12 }}><Label col="#8A6A12">{'\u2605 NEW PERSONAL BEST'}</Label></div>}
            {rank != null && (
              <Hand size={16} col="#6A6355" style={{ marginBottom: 14 }}>
                {rank === 1 ? 'Fastest recorded time on this level. Your name is at the top of the board.'
                  : `That puts you at #${rank} on this level's board.`}
              </Hand>
            )}

            <div style={{ borderTop: `1.5px dashed ${C.paper2}`, paddingTop: 12 }}>
              <Label>Ink earned</Label>
              <div style={{ marginTop: 8 }}>
                {reward.parts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_DATA, fontSize: 13, color: p[1] < 0 ? '#A5493A' : '#5A554A', padding: '2px 0' }}>
                    <span>{p[0]}</span><span>{p[1] > 0 ? '+' : ''}{commas(p[1])}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${C.graphite}` }}>
                <Head size={20}>Total</Head><Ink n={reward.total} size={26} />
              </div>
            </div>

            {nextUp && (
              <Rough pad="12px 14px" col="#B5AE9D" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Hand size={15} col="#6A6355">
                    {save.ink >= nextUp.cost
                      ? `${nextUp.label} is affordable now \u2014 ${nextUp.per}. Faster runs pay more.`
                      : `${nextUp.label} costs ${commas(nextUp.cost)}. You have ${commas(save.ink)}.`}
                  </Hand>
                  <Btn tone={save.ink >= nextUp.cost ? 'go' : 'quiet'} onClick={onShop}>Armoury</Btn>
                </div>
              </Rough>
            )}
          </>
        ) : (
          <>
            <Hand size={18} style={{ marginBottom: 8 }}>
              {'You come apart into loose lines and the page forgets you for a moment.\n\nNo ink for that one. The clock stopped at ' + fmt(res.ms) + '.'}
            </Hand>
            <Hand size={15} col="#8A8270">
              {'Nothing is lost \u2014 your ink, gear and upgrades are exactly where you left them.'}
            </Hand>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {won ? <Btn big tone="go" onClick={onNext}>Continue</Btn> : <Btn big tone="go" onClick={onRetry}>Try again</Btn>}
          {won && <Btn onClick={onRetry}>Run it faster</Btn>}
          <Btn tone="quiet" onClick={onMap}>Journey map</Btn>
        </div>
      </Rough>
    </div>
  );
}

/* ============================================================
   ARMOURY
   ============================================================ */
function ItemCard({ name, desc, cost, owned, equipped, canAfford, onBuy, onEquip, accent }) {
  return (
    <Rough pad="14px 16px" col={equipped ? C.ink : owned ? C.graphite : '#B5AE9D'} fill={equipped ? 'rgba(242,201,76,0.16)' : 'rgba(255,255,255,0.30)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {accent && <span style={{ width: 12, height: 12, borderRadius: '50%', background: accent, border: `1.5px solid ${C.graphite}`, flex: '0 0 auto' }} />}
            <Head size={17}>{name}</Head>
          </div>
          <Hand size={14} col="#6A6355" style={{ marginTop: 4 }}>{desc}</Hand>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          {equipped ? <Label col="#8A6A12">{'\u2713 EQUIPPED'}</Label>
            : owned ? <Btn onClick={onEquip}>Equip</Btn>
            : (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Ink n={cost} size={13} />
                <Btn tone={canAfford ? 'go' : 'quiet'} disabled={!canAfford} onClick={onBuy}>Buy</Btn>
              </div>)}
        </div>
      </div>
    </Rough>
  );
}

function ShopScreen({ save, onSave, onBack }) {
  const [tab, setTab] = useState('upgrades');
  const [flash, setFlash] = useState('');
  const stats = statsOf(save);
  const say = (m) => { setFlash(m); setTimeout(() => setFlash(f => f === m ? '' : f), 2200); };

  const buy = (cost, mutate, label) => {
    if (save.ink < cost) return;
    const s = JSON.parse(JSON.stringify(save));
    s.ink -= cost; mutate(s); onSave(s); beep('buy', save.muted); say(`${label} \u2014 ${commas(cost)} ink spent.`);
  };
  const equip = (mutate) => { const s = JSON.parse(JSON.stringify(save)); mutate(s); onSave(s); beep('block', save.muted); };

  const TABS = [['upgrades', 'Upgrades'], ['weapons', 'Weapons'], ['skins', 'Line'], ['wear', 'Wearables']];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <Label>Spend what you earn</Label>
          <Head size={34}>The Armoury</Head>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}><Label>Ink</Label><Ink n={save.ink} size={26} /></div>
          <Btn tone="quiet" onClick={onBack}>Back to map</Btn>
        </div>
      </div>

      <Rough pad="12px 16px" col="#B5AE9D" style={{ marginBottom: 14, background: 'rgba(255,255,255,0.28)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}><Preview save={save} w={120} h={150} /></div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontFamily: FONT_DATA, fontSize: 12.5, color: '#5A554A' }}>
          <span>{`HEALTH ${stats.maxHp}`}</span>
          <span>{`DAMAGE \u00D7${stats.dmgMul.toFixed(2)}`}</span>
          <span>{`SPEED ${stats.spd.toFixed(1)}`}</span>
          <span>{`ATK SPEED \u00D7${stats.atkMul.toFixed(2)}`}</span>
          <span>{`DASHES ${stats.dashes}`}</span>
          <span style={{ color: '#8A6A12', fontWeight: 700 }}>{`INK GAIN \u00D7${stats.inkMul.toFixed(2)}`}</span>
        </div>
        </div>
      </Rough>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(([k, l]) => (
          <Btn key={k} tone={tab === k ? 'go' : 'quiet'} onClick={() => setTab(k)}>{l}</Btn>
        ))}
      </div>

      {flash && <div style={{ marginBottom: 12 }}><Label col={C.green}>{flash}</Label></div>}

      <div style={{ display: 'grid', gap: 10 }}>
        {tab === 'upgrades' && UPGRADES.map(u => {
          const l = save.ups[u.id], maxed = l >= u.max, cost = upCost(u, l);
          return (
            <Rough key={u.id} pad="14px 16px" col={maxed ? C.ink : '#B5AE9D'} fill="rgba(255,255,255,0.30)">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 190 }}>
                  <Head size={18}>{`${u.icon}  ${u.name}`}</Head>
                  <Hand size={14} col="#6A6355">{`Each level: ${u.per}`}</Hand>
                  <div style={{ display: 'flex', gap: 3, marginTop: 7 }}>
                    {Array.from({ length: u.max }).map((_, i) => (
                      <div key={i} style={{ width: 17, height: 8, borderRadius: 2, border: `1.5px solid ${i < l ? C.graphite : '#C8C1B0'}`, background: i < l ? C.ink : 'transparent' }} />
                    ))}
                    <span style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#8A8270', marginLeft: 6 }}>{`${l}/${u.max}`}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {maxed ? <Label col="#8A6A12">MAXED</Label> : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <Ink n={cost} size={13} />
                      <Btn tone={save.ink >= cost ? 'go' : 'quiet'} disabled={save.ink < cost}
                        onClick={() => buy(cost, s => { s.ups[u.id]++; }, `${u.name} ${l + 1}`)}>Upgrade</Btn>
                    </div>
                  )}
                </div>
              </div>
            </Rough>
          );
        })}

        {tab === 'weapons' && WEAPONS.map(w => (
          <ItemCard key={w.id} name={w.name}
            desc={`${w.desc}  \u2014  DMG ${w.dmg} \u00B7 REACH ${w.range} \u00B7 SPEED \u00D7${w.speed.toFixed(2)}${w.special ? `  \u00B7  POWER MOVE: ${w.special}` : `  \u00B7  no power move`}`}
            cost={w.cost} owned={save.ownedW.includes(w.id)} equipped={save.weapon === w.id}
            canAfford={save.ink >= w.cost}
            onBuy={() => buy(w.cost, s => { s.ownedW.push(w.id); s.weapon = w.id; }, w.name)}
            onEquip={() => equip(s => { s.weapon = w.id; })} />
        ))}

        {tab === 'skins' && SKINS.map(k => (
          <ItemCard key={k.id} name={k.name} desc={k.desc} accent={k.accent} cost={k.cost}
            owned={save.ownedS.includes(k.id)} equipped={save.skin === k.id} canAfford={save.ink >= k.cost}
            onBuy={() => buy(k.cost, s => { s.ownedS.push(k.id); s.skin = k.id; }, k.name)}
            onEquip={() => equip(s => { s.skin = k.id; })} />
        ))}

        {tab === 'wear' && ['head', 'back'].map(slot => (
          <div key={slot}>
            <Label>{slot === 'head' ? 'Worn on the head' : 'Worn on the back'}</Label>
            <div style={{ display: 'grid', gap: 10, marginTop: 8, marginBottom: 14 }}>
              {WEARS.filter(w => w.slot === slot).map(w => (
                <ItemCard key={w.id} name={w.name} desc={w.desc} cost={w.cost}
                  owned={save.ownedC.includes(w.id)} equipped={save[slot] === w.id} canAfford={save.ink >= w.cost}
                  onBuy={() => buy(w.cost, s => { s.ownedC.push(w.id); s[slot] = w.id; }, w.name)}
                  onEquip={() => equip(s => { s[slot] = w.id; })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   RECORDS
   ============================================================ */
function BoardScreen({ save, board, onBack, onRefresh, busy }) {
  const [sel, setSel] = useState(save.level <= 18 ? save.level : 18);
  const rows = (board['L' + sel] || []).slice(0, 15);
  const lv = LEVELS.find(l => l.id === sel);
  const totals = useMemo(() => {
    const byName = {};
    for (let i = 1; i <= 18; i++) {
      for (const r of (board['L' + i] || [])) {
        byName[r.n] = byName[r.n] || { n: r.n, t: 0, c: 0 };
        byName[r.n].t += r.t; byName[r.n].c++;
      }
    }
    return Object.values(byName).filter(x => x.c >= 3).sort((a, b) => (b.c - a.c) || (a.t - b.t)).slice(0, 12);
  }, [board]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <Label>Fastest clears, all players</Label>
          <Head size={34}>Records</Head>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn tone="quiet" onClick={onRefresh}>{busy ? 'Loading\u2026' : 'Refresh'}</Btn>
          <Btn tone="quiet" onClick={onBack}>Back to map</Btn>
        </div>
      </div>

      <Hand size={14} col="#8A8270" style={{ marginBottom: 14 }}>
        {`Everyone who plays this shares one board. Your character name and times are visible to other players.`}
      </Hand>

      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => setSel(l.id)}
            style={{ width: 34, height: 30, border: `2px solid ${sel === l.id ? C.graphite : '#C8C1B0'}`, background: sel === l.id ? C.ink : 'transparent',
              fontFamily: FONT_DATA, fontWeight: 700, fontSize: 12, color: C.graphite, borderRadius: 3, cursor: 'pointer' }}>
            {l.id}
          </button>
        ))}
      </div>

      <Rough pad="16px 18px" fill="rgba(255,255,255,0.35)" style={{ marginBottom: 20 }}>
        <Head size={19}>{`${lv.id}. ${lv.name}`}</Head>
        <Label>{`Par ${fmt(lv.gold * 1000)}`}</Label>
        <div style={{ marginTop: 12 }}>
          {rows.length === 0 && <Hand size={16} col="#8A8270">{'Nobody has cleared this one yet. Be the first name on it.'}</Hand>}
          {rows.map((r, i) => {
            const me = r.n === save.name;
            return (
              <div key={r.n + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', borderRadius: 3,
                background: me ? 'rgba(242,201,76,0.28)' : i % 2 ? 'rgba(0,0,0,0.03)' : 'transparent' }}>
                <span style={{ fontFamily: FONT_DATA, fontSize: 13, width: 30, color: i < 3 ? '#8A6A12' : '#8A8270', fontWeight: 700 }}>{`#${i + 1}`}</span>
                <span style={{ flex: 1, fontFamily: FONT_DISP, fontWeight: 800, fontSize: 16, letterSpacing: '0.05em', color: C.graphite, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.n}{me ? '  \u2190 you' : ''}
                </span>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: MEDAL[medalFor(lv, r.t)] }} />
                <span style={{ fontFamily: FONT_DATA, fontSize: 15, fontWeight: 700, color: C.graphite }}>{fmt(r.t)}</span>
              </div>
            );
          })}
        </div>
      </Rough>

      <Rough pad="16px 18px" fill="rgba(255,255,255,0.35)">
        <Head size={19}>Furthest along</Head>
        <Label>Levels cleared, then total time</Label>
        <div style={{ marginTop: 12 }}>
          {totals.length === 0 && <Hand size={16} col="#8A8270">{'Clear three levels to appear here.'}</Hand>}
          {totals.map((r, i) => (
            <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', borderRadius: 3, background: r.n === save.name ? 'rgba(242,201,76,0.28)' : 'transparent' }}>
              <span style={{ fontFamily: FONT_DATA, fontSize: 13, width: 30, color: '#8A8270', fontWeight: 700 }}>{`#${i + 1}`}</span>
              <span style={{ flex: 1, fontFamily: FONT_DISP, fontWeight: 800, fontSize: 16, color: C.graphite }}>{r.n}</span>
              <span style={{ fontFamily: FONT_DATA, fontSize: 13, color: '#8A8270' }}>{`${r.c}/18`}</span>
              <span style={{ fontFamily: FONT_DATA, fontSize: 14, fontWeight: 700, color: C.graphite }}>{fmt(r.t)}</span>
            </div>
          ))}
        </div>
      </Rough>
    </div>
  );
}

/* ============================================================
   CHARACTER PREVIEW
   ============================================================ */
function Preview({ save, w = 150, h = 180 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0, t0 = performance.now();
    const sk = SKINS.find(s => s.id === save.skin) || SKINS[0];
    const wp = WEAPONS.find(x => x.id === save.weapon) || WEAPONS[0];
    const ent = { id: 99, x: w / 2 - 12, y: h - 22, w: 26, h: 96, face: 1, state: 'idle', stateT: 0, stateDur: 1, vx: 0, iframe: 0, hurtT: 0 };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const t = now - t0;
      if (t % 120 < 17) BOIL = (BOIL + 1) % 3;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.strokeStyle = C.paper2; ctx.lineWidth = 2;
      jline(ctx, 16, h - 20, w - 16, h - 20, 5, 1.4);
      ctx.restore();
      drawFighter(ctx, ent, { line: sk.line, accent: sk.accent, thick: sk.thick, glow: sk.glow ? sk.accent : null, ghost: sk.ghost, head: save.head, back: save.back, wp }, t);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [save.skin, save.weapon, save.head, save.back, w, h]);
  return <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} />;
}

/* ============================================================
   NAME ENTRY
   ============================================================ */
function NameScreen({ onCreate }) {
  const [v, setV] = useState('');
  const clean = v.replace(/[^A-Za-z0-9 _\-'.]/g, '').slice(0, 14);
  const ok = clean.trim().length >= 2;
  const go = () => { if (ok) onCreate(clean.trim()); };
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 16px 60px' }} className="ib-rise">
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <Label>A stick figure fighting game</Label>
      </div>
      <Head size={72} style={{ textAlign: 'center', letterSpacing: '0.16em', marginBottom: 4 }}>INKBOUND</Head>
      <Hand size={17} col="#6A6355" style={{ textAlign: 'center', marginBottom: 26 }}>
        {'Eighteen levels. Six of his lieutenants. Then the hand that drew you.'}
      </Hand>
      <Rough pad="26px 28px" fill="rgba(255,255,255,0.42)">
        <Head size={22} style={{ marginBottom: 6 }}>Name your fighter</Head>
        <Hand size={15} col="#6A6355" style={{ marginBottom: 16 }}>
          {'This name goes on the records board, where every other player can see it. Pick something you want at the top.'}
        </Hand>
        <input className="ib-in" value={clean} onChange={e => setV(e.target.value)} maxLength={14}
          onKeyDown={e => { if (e.key === 'Enter') go(); }} autoFocus placeholder={'2\u201314 characters'}
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', fontFamily: FONT_DISP, fontWeight: 900,
            fontSize: 28, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.graphite,
            background: 'rgba(255,255,255,0.6)', border: `2.5px solid ${C.graphite}`, borderRadius: 4 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
          <Label>{`${clean.length}/14`}</Label>
          <Btn big tone="go" disabled={!ok} onClick={go}>Start drawing</Btn>
        </div>
      </Rough>
    </div>
  );
}

/* ============================================================
   SETTINGS
   ============================================================ */
function SettingsScreen({ save, onSave, onBack, onWipe, storageOk }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: '8px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <div>
          <Head size={34}>Settings</Head>
          <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#A29B8A', letterSpacing: '0.1em' }}>{`BUILD ${VERSION}`}</div>
        </div>
        <Btn tone="quiet" onClick={onBack}>Back to map</Btn>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        <Rough pad="16px 18px" fill="rgba(255,255,255,0.30)">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><Head size={18}>Sound</Head><Hand size={14} col="#6A6355">{'Hits, jumps and the win jingle.'}</Hand></div>
            <Btn tone={save.muted ? 'quiet' : 'go'} onClick={() => onSave({ ...save, muted: !save.muted })}>{save.muted ? 'Off' : 'On'}</Btn>
          </div>
        </Rough>
        <Rough pad="16px 18px" fill="rgba(255,255,255,0.30)">
          <Head size={18}>Controls</Head>
          <div style={{ fontFamily: FONT_DATA, fontSize: 13, color: '#5A554A', lineHeight: 1.9, marginTop: 8 }}>
            <div>{'\u2190 \u2192  or  A D \u2014 move'}</div>
            <div>{'\u2191  W  SPACE \u2014 jump'}</div>
            <div>{'J  or  Z \u2014 punch (quick)'}</div>
            <div>{'K  or  X \u2014 kick (slower, much harder)'}</div>
            <div>{'L  \u2193  or  S \u2014 hold to block. Tap it right as a hit lands to parry.'}</div>
            <div>{'SHIFT  or  E \u2014 dash (you cannot be hit mid-dash)'}</div>
            <div>{'I  or  U \u2014 power move, once the gold meter is full'}</div>
            <div>{'ESC \u2014 pause'}</div>
          </div>
          <Hand size={14} col="#6A6355" style={{ marginTop: 10 }}>
            {'A parry restores a little health, and defeated enemies sometimes leave an ink drop worth more. In a long boss fight those are the only way back up.'}
          </Hand>
          <Head size={18} style={{ marginTop: 16 }}>On a phone</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {'Turn the phone sideways \u2014 Inkbound only plays in landscape. Rest your left thumb anywhere in the bottom-left corner and the stick appears under it: slide to move, flick up to jump, pull down to block (pull down right as a hit lands and it is a parry), double-tap to dash. On the right, three buttons on a diagonal: PUNCH, KICK, JUMP.'}
          </Hand>
          <Head size={18} style={{ marginTop: 16 }}>The power move</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {'Bare hands cannot channel it. Once you own any real weapon, every hit you land fills a gold meter under your health. When it is full a fourth button appears above the other three, and your weapon gets its own named move \u2014 a three-pulse shockwave that hits everything around you and cannot be interrupted. It empties the meter the moment you press it, whether or not anything was standing close enough to feel it.'}
          </Hand>
        </Rough>
        <Rough pad="16px 18px" fill="rgba(255,255,255,0.30)">
          <Head size={18}>Progress</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6 }}>
            {storageOk
              ? 'Saved automatically after every level, purchase and equip.'
              : 'Storage is unavailable here, so this run will not be saved. Everything else still works.'}
          </Hand>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!confirm ? <Btn tone="danger" onClick={() => setConfirm(true)}>Start over</Btn> : (
              <>
                <Hand size={15} col={C.red}>{'This wipes your ink, gear and all 18 times. Records already posted stay up.'}</Hand>
                <Btn tone="danger" onClick={onWipe}>Yes, wipe it</Btn>
                <Btn tone="quiet" onClick={() => setConfirm(false)}>Keep my run</Btn>
              </>
            )}
          </div>
        </Rough>
      </div>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function InkboundApp() {
  const [screen, setScreen] = useState('boot');
  const [save, setSave] = useState(null);
  const [board, setBoard] = useState({});
  const [storageOk, setStorageOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(null);
  const [result, setResult] = useState(null);
  const [chEnd, setChEnd] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      let ok = true, s = null;
      try { s = await loadSave(); } catch { ok = false; }
      if (typeof window === 'undefined' || !window.storage) ok = false;
      let b = {};
      try { b = await loadBoard(); } catch { ok = false; }
      if (!live) return;
      setStorageOk(ok); setBoard(b || {});
      if (s && s.name) { setSave(s); setScreen('map'); }
      else setScreen('name');
    })();
    return () => { live = false; };
  }, []);

  const persist = useCallback((s) => { setSave(s); writeSave(s); }, []);

  const startFight = (lv) => { setSel(lv); setScreen('fight'); };

  const onEnd = async (won, res) => {
    const lv = sel;
    if (!won) { setResult({ won: false, lv, res, reward: null, pb: false, rank: null }); setScreen('result'); return; }
    const firstClear = !save.cleared[lv.id];
    const prev = save.best[lv.id];
    const isPB = prev == null || res.ms < prev;
    const stats = statsOf(save);
    const reward = computeReward(lv, res.ms, stats, res.hits, res.combo, firstClear, isPB);

    const s = JSON.parse(JSON.stringify(save));
    s.ink += reward.total; s.totalInk += reward.total;
    s.cleared[lv.id] = true;
    if (isPB) s.best[lv.id] = res.ms;
    s.runs = (s.runs || 0) + 1;
    if (lv.id === s.level && s.level < 18) s.level = lv.id + 1;
    else if (lv.id === 18) s.level = 19;
    persist(s);

    let rank = null;
    if (isPB) {
      const nb = await submitTime(save.name, lv.id, res.ms);
      if (nb) { setBoard(nb); const rows = nb['L' + lv.id] || []; const i = rows.findIndex(r => r.n === save.name); rank = i >= 0 ? i + 1 : null; }
    }
    setResult({ won: true, lv, res, reward, pb: isPB, rank, saveAfter: s });
    setScreen('result');
  };

  const afterResult = () => {
    const lv = result.lv;
    if (lv.kind === 'boss' && CH_END[lv.ch]) { setChEnd(lv.ch); setScreen('chend'); }
    else setScreen('map');
  };

  const refreshBoard = async () => { setBusy(true); const b = await loadBoard(); setBoard(b || {}); setBusy(false); };

  const bg = {
    minHeight: '100vh',
    background: `${C.paper} repeating-linear-gradient(to bottom, transparent 0 33px, rgba(34,32,28,0.045) 33px 34px)`,
    color: C.graphite,
    paddingTop: 18,
  };

  const shell = (inner) => (<div style={bg}><style>{STYLE}</style>{inner}</div>);

  if (screen === 'boot' || (!save && screen !== 'name')) {
    return shell(<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Head size={30} col="#B5AE9D">{'Sharpening pencils\u2026'}</Head>
    </div>);
  }

  if (screen === 'name') {
    return shell(<NameScreen onCreate={(n) => { const s = freshSave(n); persist(s); setScreen('prologue'); }} />);
  }

  if (screen === 'prologue') {
    return shell(<StoryScreen eyebrow="Before all of it"
      title="The Margin"
      body={`Somebody drew you fast and left the page.\n\nYou are four lines and a circle, standing in the strip of blank at the edge of the paper, and you are the only thing here that decided to stand up on its own.\n\nAbove the desk there is a lamp, and a hand, and a pen. The hand has made a great many of you. It keeps the ones it likes and rubs out the rest, and it has five things drawn between you and it \u2014 five lieutenants, each one a mistake he was too proud to erase.\n\nGo and meet them, ${save.name}. Then go and meet him.`}
      cta="Step onto the page" onGo={() => setScreen('map')} />);
  }

  if (screen === 'map') {
    return shell(<MapScreen save={save} board={board} onPick={(lv) => { setSel(lv); setScreen('brief'); }}
      onShop={() => setScreen('shop')} onBoard={() => setScreen('board')} onSettings={() => setScreen('settings')} />);
  }

  if (screen === 'brief' && sel) {
    const best = save.best[sel.id];
    const rows = board['L' + sel.id] || [];
    const top = rows[0];
    return shell(<div>
      <StoryScreen
        eyebrow={`Chapter ${sel.ch} \u00B7 ${CHAPTERS[sel.ch - 1].name} \u00B7 Level ${sel.id}`}
        title={sel.name} body={sel.story}
        col={sel.kind === 'boss' ? C.red : C.graphite}
        cta={sel.kind === 'boss' ? 'Face it' : 'Fight'}
        onGo={() => startFight(sel)} onBack={() => setScreen('map')} />
      <div style={{ maxWidth: 700, margin: '-34px auto 0', padding: '0 16px 60px', display: 'flex', gap: 26, flexWrap: 'wrap' }}>
        <div><Label>Par time</Label><div style={{ fontFamily: FONT_DATA, fontSize: 19, fontWeight: 700 }}>{fmt(sel.gold * 1000)}</div></div>
        <div><Label>Your best</Label><div style={{ fontFamily: FONT_DATA, fontSize: 19, fontWeight: 700 }}>{best ? fmt(best) : '\u2014'}</div></div>
        <div><Label>World record</Label><div style={{ fontFamily: FONT_DATA, fontSize: 19, fontWeight: 700 }}>{top ? `${fmt(top.t)}  ${top.n}` : 'unset'}</div></div>
        <div><Label>Base payout</Label><div style={{ fontFamily: FONT_DATA, fontSize: 19, fontWeight: 700, color: '#8A6A12' }}>{commas(sel.ink)}</div></div>
      </div>
    </div>);
  }

  if (screen === 'fight' && sel) {
    return shell(<FightScreen levelId={sel.id} save={save} onEnd={onEnd} onQuit={() => setScreen('map')} />);
  }

  if (screen === 'result' && result) {
    return shell(<ResultScreen won={result.won} lv={result.lv} res={result.res} save={result.saveAfter || save}
      reward={result.reward} pb={result.pb} rank={result.rank}
      onNext={afterResult} onRetry={() => startFight(result.lv)}
      onShop={() => setScreen('shop')} onMap={() => setScreen('map')} />);
  }

  if (screen === 'chend' && chEnd) {
    const last = chEnd === 6;
    return shell(<StoryScreen
      eyebrow={last ? 'The end' : `Chapter ${chEnd} cleared`}
      title={last ? 'The Last Page' : CHAPTERS[chEnd - 1].name}
      body={CH_END[chEnd] + (last ? `\n\n\u2014 ${save.name}, who was drawn in a margin and did not stay there.` : '')}
      col={last ? C.purple : C.graphite}
      cta={last ? 'Back to the desk' : 'Onward'}
      onGo={() => { setChEnd(null); setScreen('map'); }} />);
  }

  if (screen === 'shop') {
    return shell(<ShopScreen save={save} onSave={persist} onBack={() => setScreen('map')} />);
  }

  if (screen === 'board') {
    return shell(<BoardScreen save={save} board={board} busy={busy} onRefresh={refreshBoard} onBack={() => setScreen('map')} />);
  }

  if (screen === 'settings') {
    return shell(<SettingsScreen save={save} storageOk={storageOk} onSave={persist} onBack={() => setScreen('map')}
      onWipe={() => { const s = freshSave(save.name); persist(s); setScreen('map'); }} />);
  }

  return shell(<div style={{ padding: 40 }}><Head>Lost the page</Head><Btn onClick={() => setScreen('map')}>Back to map</Btn></div>);
}
