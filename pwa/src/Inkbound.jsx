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
  { id:'pencil', special:'GRAFFITO',  name:'Pencil Shiv',       cost:205,  dmg:13, range:46, speed:1.05, kb:5,  shape:'pencil', desc:'Snapped in half, sharpened on the desk edge.' },
  { id:'ruler', special:'STRAIGHT EDGE',   name:'Ruler Blade',       cost:585,  dmg:18, range:60, speed:0.94, kb:7,  shape:'ruler',  desc:'Thirty centimetres of unforgiving straight.' },
  { id:'eraser', special:'BLANK SLATE',  name:'Eraser Maul',       cost:1370,  dmg:31, range:50, speed:0.66, kb:16, shape:'maul',   desc:'Slow. Removes the problem entirely.' },
  { id:'compass', special:'FULL CIRCLE', name:'Compass Spear',     cost:2500, dmg:21, range:82, speed:0.84, kb:8,  shape:'spear',  desc:'Keeps everyone at arm\u2019s length. Then some.' },
  { id:'nibs', special:'CROSSHATCH',    name:'Twin Nibs',         cost:4670, dmg:12, range:44, speed:1.55, kb:3,  shape:'nibs',   desc:'Two fast hits where one used to go.' },
  { id:'marker', special:'HIGHLIGHT REEL',  name:'Highlighter',       cost:8460, dmg:26, range:66, speed:1.10, kb:9,  shape:'marker', glow:C.ink, desc:'Marks what matters. Loudly.' },
  { id:'stylus', special:'REVISION',  name:'Architect\u2019s Stylus', cost:15200, dmg:38, range:72, speed:1.18, kb:11, shape:'stylus', glow:C.purple, desc:'A prototype. It was never meant to leave the desk.' },
];

/* ---------------- SKINS ---------------- */
const SKINS = [
  { id:'graphite', name:'Graphite',      cost:0,    line:'#22201C', accent:'#5A554A', desc:'Standard 2B. How everyone starts.' },
  { id:'roughs',   name:'Non-Photo Blue',cost:175,  line:'#4A7C93', accent:'#8EC5DC', desc:'The colour of a drawing not finished yet.' },
  { id:'redpen',   name:'Editor\u2019s Red', cost:400, line:'#C4452F', accent:'#E88A72', desc:'Every line on you is a correction.' },
  { id:'charcoal', name:'Charcoal',      cost:725,  line:'#0D0D0D', accent:'#4A4A4A', thick:1.4, desc:'Thick, smudged, hard to erase.' },
  { id:'mint',     name:'Ditto Green',   cost:1160, line:'#3F7A4A', accent:'#9BD3A4', desc:'Fresh off the copier, still warm.' },
  { id:'gold',     name:'Gold Leaf',     cost:1875, line:'#B8860B', accent:'#F2C94C', glow:true, desc:'Reserved for finished work.' },
  { id:'violet',   name:'Duplicator',    cost:2885, line:'#6B4E9B', accent:'#B49BD6', glow:true, desc:'The Architect\u2019s own purple. Stolen.' },
  { id:'ghost',    name:'Tracing Paper', cost:4045, line:'#7E7A70', accent:'#C9C3B4', ghost:true, desc:'You can see straight through. So can they.' },
];

/* ---------------- CLOTHING ---------------- */
const WEARS = [
  { id:'none',    name:'Nothing',        cost:0,    slot:'head', desc:'Bare line.' },
  { id:'band',    name:'Headband',       cost:175,  slot:'head', perk:{ speed:0.04 },  desc:'Keeps the graphite out of your eyes. +4% move speed.' },
  { id:'cap',     name:'Backwards Cap',  cost:465,  slot:'head', perk:{ atkSpeed:0.04 },desc:'+4% attack speed. Purely psychological.' },
  { id:'antenna', name:'Antenna',        cost:870,  slot:'head', perk:{ ink:0.05 },    desc:'Picks up loose signal. +5% shards earned.' },
  { id:'tophat',  name:'Top Hat',        cost:1380, slot:'head', perk:{ hp:10 },       desc:'+10 max health. Dignity is armour.' },
  { id:'crown',   name:'Paper Crown',    cost:2745, slot:'head', perk:{ ink:0.10 },    desc:'+10% shards earned. Folded from a losing draft.' },
  { id:'cape',    name:'Draft Cape',     cost:1010,  slot:'back', perk:{ speed:0.06 },  desc:'+6% move speed. It catches the air from the fan.' },
  { id:'wings',   name:'Sketch Wings',   cost:3180, slot:'back', perk:{ speed:0.05, dash:1 }, desc:'+5% speed and one extra dash charge.' },
  { id:'scarf',   name:'Long Scarf',     cost:1735, slot:'back', perk:{ hp:15 },       desc:'+15 max health. Mostly for the trailing.' },
  { id:'nothingb',name:'No Back',        cost:0,    slot:'back', desc:'Nothing behind you.' },
];

/* ---------------- UPGRADES (the compounding loop) ---------------- */
const UPGRADES = [
  { id:'vit',  name:'Vitality',  max:8,  base:170, mult:1.46, per:'+14 max health',      icon:'\u2665' },
  { id:'pow',  name:'Power',     max:10, base:202, mult:1.48, per:'+8% damage',          icon:'\u2694' },
  { id:'swift',name:'Swiftness', max:8,  base:226, mult:1.5, per:'+5% move speed',      icon:'\u21C9' },
  { id:'fero', name:'Ferocity',  max:8,  base:250, mult:1.5, per:'+6% attack speed',    icon:'\u26A1' },
  { id:'wind', name:'Second Wind',max:4, base:723, mult:1.78, per:'+1 dash charge',      icon:'\u21BB' },
  { id:'fort', name:'Fortune',   max:8,  base:369, mult:1.52, per:'+9% shards from levels', icon:'\u2726' },
];
const upCost = (u, lvl) => Math.round(u.base * Math.pow(u.mult, lvl));

/* ---------------- SPECIAL MOVES ----------------
   Bought with shards, one equipped at a time. The power meter fills as you
   land hits and empties the moment you fire, hit or miss. */
const SPECIALS = [
  { id:'inkburst', name:'INK BURST', cost:0, kind:'nova', dmg:1.60, pulses:3, radius:210,
    desc:'Three shockwaves straight out from where you stand.',
    note:'Yours from the start. Reliable, no thinking required.' },
  { id:'crosshatch', name:'CROSSHATCH', cost:5200, kind:'cone', dmg:1.35, pulses:5, radius:230,
    desc:'Five slashes carved forward in a wedge. Nothing behind you.',
    note:'More total damage than Ink Burst, but only in front.' },
  { id:'flipbook', name:'FLIPBOOK', cost:11300, kind:'flurry', dmg:0.62, pulses:9, radius:170,
    desc:'Nine hits in under a second, everything close in.',
    note:'Shreds crowds. Feeds your combo counter hard.' },
  { id:'blotstorm', name:'BLOT STORM', cost:20800, kind:'rain', dmg:1.05, pulses:12, radius:420,
    desc:'Ink falls across the whole width of the page.',
    note:'Reaches things you cannot. Slow to finish.' },
  { id:'vanishing', name:'VANISHING POINT', cost:33600, kind:'blink', dmg:3.40, pulses:2, radius:190,
    desc:'You are somewhere else, then it is over.',
    note:'Steps you behind the furthest enemy and detonates twice.' },
  { id:'revision', name:'REVISION', cost:54000, kind:'heal', dmg:2.40, pulses:3, radius:250,
    desc:'Rubs out the page around you and redraws you whole.',
    note:'Heals 30% of your health as well as clearing the room.' },
];
const specOf = (s) => SPECIALS.find(x => x.id === s.special) || SPECIALS[0];

/* Planned shard packs. Nothing here is connected to a payment processor and
   the buttons are inert; the table exists so the pricing can be reviewed. */
const SHARD_PACKS = [
  { id:'pocket',  name:'A Pocketful',      ink:9000,   bonus:0,  price:'$1.99',  note:'A weapon, or a couple of upgrade levels.' },
  { id:'well',    name:'The Inkwell',      ink:28000,  bonus:20, price:'$4.99',  note:'About a third of the way to a top power move.' },
  { id:'res',     name:'The Reservoir',    ink:65000,  bonus:32, price:'$9.99',  note:'A strong loadout in one go.' },
  { id:'flood',   name:'The Flood',        ink:150000, bonus:45, price:'$19.99', note:'Most of the power move ladder.' },
  { id:'bottle',  name:'The Whole Bottle', ink:410000, bonus:62, price:'$49.99', note:'Everything in the Armoury, with change.' },
];



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
  mk(1,1,'First Line','fight',[['scribbler',3]],8,150,
    'You wake up as four lines and a circle. Someone drew you in the margin and then stopped paying attention.\n\nThere is scribbling nearby. It is coming toward you.'),
  mk(2,1,'Crossed Out','fight',[['scribbler',3],['scribbler',4]],11,188,
    'A voice from somewhere above the page: "Rough. Keep going."\n\nYou keep going.'),
  mk(3,1,'Rough Pass','fight',[['scribbler',4],['scribbler',4]],14,226,
    'The margin widens. Somebody was practising here — the same shape over and over, each one abandoned halfway.\n\nNone of them got legs. You did.'),
  mk(4,1,'Loose Ends','fight',[['scribbler',5],['scribbler',4]],18,264,
    'Lines that go nowhere. They start with intent and give up two inches later.\n\nOne of them notices you walking past on finished feet and follows you for a while, trailing off.'),
  mk(5,1,'Overworked','fight',[['scribbler',4],['scribbler',3],['scribbler',3],['scribbler',3]],21,302,
    'Too many passes over the same spot. The paper here has gone soft and grey and it tears if you stand still.\n\nYou keep moving.\n\nThe scribbling here is all loops, and cutting across a loop only pulls the knot tighter. The ones that come apart are the ones something lifted off the page first.'),
  mk(6,1,'The Knot','fight',[['scribbler',4],['scribbler',4],['scribbler',3],['scribbler',3]],24,340,
    'Ahead the loops stop being separate things and start being one thing.\n\nYou pass a ball of crossed-out lines twitching in the gutter. It holds together fine until a draught gets under it, and then it just unwinds.'),
  mk(7,1,'SCRIBBLE','boss',[['scribbler',3],['scribbler',4],['boss','scribble']],28,540,
    'It is what happens to a drawing when the hand gets angry. Every wrong line the Architect ever made, balled up and left alive in the margin.\n\nIt does not want anything. That is what makes it hard.'),
  mk(8,2,'White Noise','fight',[['dasher',3],['scribbler',3],['dasher',3]],18,300,
    'Past the margin, the page goes pale. Whole shapes stand around with their outlines missing, waiting to be finished. They will not be.\n\nOne of them notices you still have all of yours.'),
  mk(9,2,'Half-Erased','fight',[['scribbler',4],['lobber',2],['dasher',4]],20,348,
    'A stick figure with no legs drags itself out of your way. "He erases the ones who ask questions," it says. "Ask fewer."\n\nYou ask which way.'),
  mk(10,2,'Ghost Lines','fight',[['dasher',5],['scribbler',5],['scribbler',3]],23,396,
    'Everything here was drawn and then taken back. What is left is the dent in the paper where it used to be.\n\nThe dents still move.'),
  mk(11,2,'Rubbings','fight',[['dasher',5],['scribbler',5],['scribbler',4]],25,444,
    'Pink crumbs everywhere, piled in drifts. Each one is a piece of somebody.\n\nYou try not to think about how many.'),
  mk(12,2,'Pressure Marks','fight',[['dasher',4],['scribbler',4],['lobber',4],['dasher',3]],28,492,
    'Someone pressed hard enough that the line went through to the next page. Whatever they drew is still down there, on the other side, keeping pace with you.\n\nA half-finished shape watches you swing at a smear and pass clean through it. “No edge on those,” it says. “You can’t cut a puddle. You have to get above it and put your weight through it.”'),
  mk(13,2,'The Smear','fight',[['dasher',4],['scribbler',4],['lobber',4],['dasher',4]],30,540,
    'The grey gets thicker. It has stopped being erased things and started being one erased thing.\n\nYou corner something grey against the margin and hit it flat from the side four times for nothing. Then you jump, come down on it, and it makes a sound like a wet page tearing.'),
  mk(14,2,'SMUDGE','boss',[['dasher',3],['scribbler',4],['brute',2],['boss','smudge']],52,840,
    'The Architect\u2019s second mistake: he tried to rub out the first one. SMUDGE is what the rubbing became.\n\nIt has no edge to hit. You will have to find where it stops being blurry.'),
  mk(15,3,'Ruled Lines','fight',[['brute',2],['scribbler',4],['lobber',2]],19,450,
    'The Grid begins exactly where the Eraser Fields end, on a line you could measure. Everything stands at right angles. Everything is waiting for permission.\n\nYou are the only curve here.'),
  mk(16,3,'Right Angles','fight',[['dasher',4],['brute',2],['lobber',3]],22,516,
    'They march in squares. They turn in ninety degrees. A guard stops you and asks for your reference number.\n\nYou tell it your name instead.'),
  mk(17,3,'Set Square','fight',[['brute',5],['lobber',5]],24,582,
    'Everything is measured from the top. You are the only object here without a stated width.\n\nThe grid does not like that, and the grid has opinions.'),
  mk(18,3,'Perspective','fight',[['brute',5],['lobber',5],['lobber',3]],27,648,
    'The lines all lean toward one point on the horizon. Stand in the wrong place and you get smaller.\n\nStand in the right place and you get very large indeed. Briefly.'),
  mk(19,3,'Vanishing Lines','fight',[['brute',4],['lobber',3],['dasher',4],['brute',3]],29,714,
    'The rules converge ahead of you and something is standing exactly where they meet.\n\nEverything here is measured down from a line at the top of the page. You duck under a ruled beam and notice the measuring simply stops — below the baseline nothing is marked at all.'),
  mk(20,3,'True Edge','fight',[['brute',4],['lobber',4],['dasher',4],['brute',3]],32,780,
    'The last stretch before the ruler itself. Every angle is exact and none of them are on your side.\n\nA lobber tells you the ruled things only see what they can measure. “They have no number for your ankles,” it says, and goes back to throwing.'),
  mk(21,3,'THE STRAIGHTEDGE','boss',[['lobber',3],['brute',2],['dasher',4],['boss','straightedge']],56,1280,
    'It was drawn to keep the world tidy and it has never once been wrong, because it decides what wrong means.\n\nIt has read your file. It is disappointed.'),
  mk(22,4,'Wet Paint','fight',[['lobber',3],['dasher',4],['brute',2]],21,590,
    'Colour gets out of the tray and nothing behaves. The ground is tacky. Shapes bleed into each other and come apart wrong.\n\nSomething red is having a very good time up ahead.'),
  mk(23,4,'Running Colours','fight',[['brute',2],['copy',2],['lobber',3],['dasher',3]],24,680,
    'The Architect keeps his failures separated by hue so they cannot mix and organise.\n\nYou walk through the dividing line. They mix.'),
  mk(24,4,'Bleed','fight',[['lobber',5],['dasher',5],['dasher',3]],26,770,
    'The colours have got out of the tray and into the paper. Everything runs.\n\nStand in one place too long and you start to run with it.'),
  mk(25,4,'Undercoat','fight',[['lobber',5],['dasher',5],['dasher',4]],29,860,
    'Beneath the loud layer there is a duller one that was meant to stay hidden.\n\nIt resents being walked on by something in ink.'),
  mk(26,4,'Colour Wash','fight',[['lobber',4],['dasher',4],['brute',4],['copy',3]],31,950,
    'A flat wash across the whole page, and shapes moving under it like fish.\n\nThe colours here arrive as throws. Take one on the guard at the moment it lands and it stains you the same shade, and for a breath the thing that threw it cannot tell where it stops and you start.'),
  mk(27,4,'Saturation','fight',[['lobber',4],['dasher',4],['brute',4],['copy',4]],34,1040,
    'Too much of everything. The page cannot hold any more pigment and it is starting to buckle.\n\nYou watch a swatch batter itself against its own reflection in a puddle of thinner, unable to work out which one to hit.'),
  mk(28,4,'CHROMA','boss',[['dasher',4],['lobber',3],['brute',3],['boss','chroma']],78,1860,
    'Four moods in one body, and it changes which one it is whenever it gets bored.\n\nRead the colour. The colour is the only warning you get.'),
  mk(29,5,'Rough Sketch','fight',[['copy',2],['brute',2],['dasher',4],['scribbler',4]],26,780,
    'The Draft is a drawer. Every version of everything that got thrown out is still in here, still moving.\n\nYou see three of yourself before you stop counting.'),
  mk(30,5,'Tracing Paper','fight',[['copy',4],['lobber',3],['brute',3],['copy',3]],28,904,
    'They copy your stance. Your weapon. The way you favour one side when you\u2019re tired.\n\nThe only thing they cannot copy is that you chose to come here.'),
  mk(31,5,'Second Pass','fight',[['copy',5],['brute',5],['brute',4]],31,1028,
    'Version two of a drawing you have not seen version one of. It is better than you in three specific ways and it knows which three.\n\nYou find out the hard way.'),
  mk(32,5,'Redlines','fight',[['copy',5],['brute',5],['brute',5]],33,1152,
    'Corrections in a hand that is not the Architect’s. Someone else was here, marking his work.\n\nWhatever they suggested, he did not take it well.'),
  mk(33,5,'Version Seven','fight',[['copy',4],['brute',4],['dasher',4],['scribbler',4]],36,1276,
    'Seven of you, stacked in a drawer. Six were wrong. Nobody wrote down why.\n\nThe drafts in this drawer have been rehearsing. One is working through a routine of your own moves — every one you have ever thrown, in order, and nothing else. It has no answer for anything it has not been shown.'),
  mk(34,5,'The Understudies','fight',[['copy',5],['brute',4],['dasher',4],['scribbler',4]],38,1400,
    'They have been waiting a long time to be needed.\n\nA copy mirrors you for a while and does it well, right up until you do something new. Then it stands there with its hands up, waiting for a page that was never drawn.'),
  mk(35,5,'THE UNDERSTUDY','boss',[['copy',2],['brute',3],['dasher',4],['boss','understudy']],62,2700,
    'Version one. Drawn before you, with the same hand, on a better morning \u2014 and then set aside for reasons never written down.\n\nIt has been practising for this the entire time you were alive.'),
  mk(36,6,'The Gutter','fight',[['brute',3],['copy',3],['dasher',4],['lobber',4]],22,1030,
    'The seam where two pages meet. The lamp is close enough now to feel warm.\n\nEverything he has left throws itself into the gap.'),
  mk(37,6,'Last Margin','fight',[['copy',4],['brute',4],['dasher',5],['lobber',4]],26,1196,
    'One strip of blank between you and him. It is the same margin you woke up in, at the other end of the page.\n\nThe hand above stops moving. It has seen you.'),
  mk(38,6,'Deadline','fight',[['brute',5],['copy',5],['copy',5],['copy',3]],29,1362,
    'A hard black line across the page with nothing drawn past it.\n\nEverything that lives on this side has worked out that it is running out of room.'),
  mk(39,6,'The Last Ream','fight',[['brute',5],['copy',5],['copy',5],['copy',4]],33,1528,
    'Paper stacked to the ceiling, all of it blank, all of it already spoken for.\n\nThe pen passes overhead and everything it is not touching goes soft. He can draw or he can rub out, you realise. He has never once done both.'),
  mk(40,6,'Bleed Edge','fight',[['brute',5],['copy',5],['lobber',5],['dasher',5]],36,1694,
    'Past this the ink runs off and does not come back.\n\nYou wait out a long stroke pressed flat against the margin. While the pen is moving nothing else on the page is being held together — including, you suspect, him.'),
  mk(41,6,'The Signature','fight',[['brute',5],['copy',5],['lobber',5],['dasher',5],['dasher',3]],40,1860,
    'He signs every page. It is the only part of him that is always the same.\n\nThe last of them stand between you and it, and they know what happens to a drawing after the signature goes on.\n\nOne of them has been counting. \u201cWatch the pen, not him,\u201d it says. \u201cWhile it is moving he is doing one thing and one thing only. He has never once been able to do both at the same time.\u201d'),
  mk(42,6,'THE ARCHITECT','boss',[['brute',3],['copy',3],['lobber',4],['dasher',4],['boss','architect']],124,4860,
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

/* Everything about how you are currently drawn, in one place. */
function lookOf(save) {
  const sk = SKINS.find(x => x.id === save.skin) || SKINS[0];
  return {
    line: sk.line, accent: sk.accent, thick: sk.thick,
    glow: sk.glow ? sk.accent : null, ghost: sk.ghost,
    head: save.head, back: save.back,
    wp: WEAPONS.find(w => w.id === save.weapon) || WEAPONS[0],
  };
}

/* ---------------- ENEMIES ---------------- */
/* every move has its own impact */
const HIT_SFX = {
  jab:'punch', cross:'punch', airjab:'punch', charge:'crunch',
  kick:'kick', spin:'kick', divekick:'crunch', stomp:'crunch', elbow:'crunch',
  upper:'rise', sweep:'low', slide:'low', special:'super',
};

const WALLPOPS = ['SLAM!', 'THUD!', 'KRUNCH!', 'WHUMP!', 'CLANG!', 'DOOF!'];

const ENEMIES = {
  scribbler:{ hp:36, spd:1.9, dmg:8,  reach:46, cd:1150, wind:300, w:24, h:62, ink:3,  col:C.graphite, label:'Scribbler' },
  dasher:   { hp:28, spd:3.6, dmg:10, reach:44, cd:900,  wind:210, w:22, h:58, ink:4,  col:'#7A6A55',  label:'Dasher', lunge:true },
  lobber:   { hp:30, spd:1.5, dmg:9,  reach:340,cd:1700, wind:520, w:24, h:60, ink:5,  col:C.blueDk,   label:'Lobber', ranged:true, keep:230 },
  brute:    { hp:96, spd:1.25,dmg:19, reach:60, cd:1900, wind:640, w:38, h:80, ink:9,  col:'#5A554A',  label:'Brute', heavy:true },
  copy:     { hp:62, spd:2.9, dmg:14, reach:56, cd:1100, wind:300, w:26, h:66, ink:11, col:'#8A7FA8',  label:'Copy', mirror:true },
};

/* ---------------- BOSS WEAKNESSES ----------------
   Each boss shrugs off most of what you throw at it. There is one thing
   it cannot shrug off, and the two levels before it tell you what.
   Hitting the weakness is worth roughly five ordinary hits, so a player
   who has worked it out beats the fight comfortably and a player who has
   not is in for a long, losing grind. */
const WEAK = {
  scribble: {
    tag: 'UNRAVELLING!', resist: 0.46, bonus: 1.95,
    note: 'It is a knot. Cut across it and it only pulls tighter \u2014 hook it from underneath and it comes undone.',
    test: (g, b, mv) => mv === 'upper',
  },
  smudge: {
    tag: 'FLATTENED!', resist: 0.44, bonus: 2.70,
    note: 'Wet ink has no edge to cut. Swinging across it just moves it around. You have to come down on top of it and press it into the page \u2014 anything thrown from above.',
    test: (g, b, mv) => mv === 'stomp' || mv === 'divekick',
  },
  straightedge: {
    tag: 'BELOW SCALE!', resist: 0.46, bonus: 2.55,
    note: 'It measures everything from its own baseline. Anything under that line it cannot see at all. Stay low and take its feet.',
    test: (g, b, mv) => mv === 'sweep' || mv === 'slide',
  },
  chroma: {
    tag: 'COLOUR MATCHED!', resist: 0.45, bonus: 2.80,
    note: 'It only ever wears the colour it just threw at you. Catch that throw on the guard and for a moment you are the same colour, and it cannot tell where it ends.',
    test: (g) => (g.parryT || 0) > 0,
  },
  understudy: {
    tag: 'NEW TO HIM!', resist: 0.45, bonus: 2.65,
    note: 'He has been rehearsing against a recording of you. Show him a move and he has the answer to it a few seconds later \u2014 so keep showing him different ones, and by the time he has learned the last one you are three ahead.',
    /* He remembers each move for about twelve seconds after you land it. */
    test: (g, b, mv) => !!mv && !((g.seen || {})[mv] > g.tick),
  },
  architect: {
    tag: 'MID-STROKE!', resist: 0.42, bonus: 2.70,
    note: 'He can draw or he can rub out. Never both at once. While the pen is moving he has nothing left over to defend with.',
    test: (g, b) => !!b.move && b.moveT >= b.wind && b.moveT < b.wind + Math.min(b.act, 340),
  },
};

/* ---------------- BOSSES ---------------- */
const BOSSES = {
  scribble:{ name:'SCRIBBLE', hp:420, weak:WEAK.scribble, w:88, h:104, col:C.graphite, spd:1.7, contact:9, art:'scribble',
    phases:[{at:1,moves:['lunge','sweep']},{at:0.55,moves:['lunge','sweep','summon','spin']}],
    quips:['[it does not speak. it only tangles.]'] },
  smudge:{ name:'SMUDGE', hp:1500, weak:WEAK.smudge, w:96, h:100, col:'#8B8478', spd:2.1, contact:13, art:'smudge',
    phases:[{at:1,moves:['blink','sweep','volley']},{at:0.5,moves:['blink','volley','rain','summon']}],
    quips:['"you can\u2019t hit what hasn\u2019t settled."','"i was a mistake he tried to fix. now i\u2019m two."'] },
  straightedge:{ name:'THE STRAIGHTEDGE', hp:2200, weak:WEAK.straightedge, w:64, h:132, col:C.blueDk, spd:2.2, contact:21, art:'straight',
    phases:[{at:1,moves:['beam','slam','sweep']},{at:0.6,moves:['beam','slam','grid','lunge']},{at:0.3,moves:['beam','grid','slam','lunge','volley']}],
    quips:['"you are not to scale."','"i have measured you. you are within tolerance of nothing."','"correction is not cruelty."'] },
  chroma:{ name:'CHROMA', hp:1550, weak:WEAK.chroma, w:82, h:118, col:'#B05A8A', spd:2.4, contact:13, art:'chroma',
    phases:[{at:1,moves:['volley','lunge','sweep']},{at:0.7,moves:['rain','blink','volley','spin']},{at:0.35,moves:['rain','spin','volley','summon','lunge']}],
    quips:['"pick a favourite. i\u2019ll be the other one."','"red now. keep up."','"you\u2019re all one colour. how do you stand it?"'] },
  understudy:{ name:'THE UNDERSTUDY', hp:1850, weak:WEAK.understudy, w:44, h:104, col:'#7A6A55', spd:3.5, contact:10, art:'stick',
    phases:[{at:1,moves:['lunge','sweep','blink']},{at:0.65,moves:['lunge','sweep','blink','volley','slam']},{at:0.3,moves:['lunge','blink','spin','slam','sweep']}],
    quips:['"he used your name on me first."','"i know the ending. i was drawn holding it."','"go on. finish the sketch."'] },
  architect:{ name:'THE ARCHITECT', hp:6200, weak:WEAK.architect, w:52, h:124, col:C.purple, spd:3.4, contact:14, art:'architect',
    phases:[{at:1,moves:['beam','volley','lunge','sweep']},
            {at:0.75,moves:['grid','beam','summon','blink','slam']},
            {at:0.45,moves:['rain','spin','beam','blink','volley','slam']},
            {at:0.18,moves:['rain','grid','spin','beam','lunge','summon','volley']}],
    quips:['"stand still. you\u2019re smudging."','"i drew the floor you\u2019re standing on."','"do you know how many of you there have been?"','"fine. FINE. hold still and i\u2019ll do it properly."'] },
};

/* ---------------- SAVE / STORAGE ---------------- */
const SAVE_KEY = 'inkbound-save-v1';
const LB_KEY = 'inkbound-leaderboard-v1';
const SECRET_KEY = 'inkbound-secret-v1';

/* The API base URL, set by a <script> tag in index.html when this is deployed
   as a real site. Left undefined (as it is inside a Claude artifact) the game
   falls back to window.storage and the board is device-local. */
const API = (typeof window !== 'undefined' && window.INKBOUND_API) || null;

/* ---------------- identity ----------------
   There is no login. On first launch the device generates a long random
   secret and keeps it forever. The pair (name, secret) is the account: the
   server hands a name to whoever claims it first, and only that secret can
   post times under it afterwards. The player can read the secret out of
   Settings as a recovery code to move their name to another device. */
let SECRET = null;
async function getSecret() {
  if (SECRET) return SECRET;
  try { const r = await window.storage.get(SECRET_KEY); if (r && r.value) { SECRET = r.value; return SECRET; } }
  catch { /* first run */ }
  const bytes = new Uint8Array(24);
  (window.crypto || window.msCrypto).getRandomValues(bytes);
  SECRET = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  try { await window.storage.set(SECRET_KEY, SECRET); } catch { /* offline */ }
  return SECRET;
}
async function setSecret(v) {
  SECRET = v;
  try { await window.storage.set(SECRET_KEY, v); } catch { /* offline */ }
}

async function api(path, opts = {}) {
  if (!API) return null;
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), 8000) : null;
  try {
    const r = await fetch(API.replace(/\/+$/, '') + path, {
      ...opts,
      signal: ctl ? ctl.signal : undefined,
      headers: opts.body ? { 'Content-Type': 'application/json', ...(opts.headers || {}) } : opts.headers,
    });
    const body = await r.json().catch(() => null);
    return { ok: r.ok, status: r.status, body };
  } catch { return null; }
  finally { if (timer) clearTimeout(timer); }
}

/* Ask the server for a name. Returns 'ok', 'taken', or 'offline'. */
async function claimName(name) {
  if (!API) return 'ok';
  const secret = await getSecret();
  const r = await api('/claim', { method: 'POST', body: JSON.stringify({ name, secret }) });
  if (!r) return 'offline';
  if (r.status === 409) return 'taken';
  return r.ok ? 'ok' : 'offline';
}

/* Move an existing name onto this device using its recovery code. */
async function restoreName(name, code) {
  if (!API) return 'offline';
  const r = await api('/verify', { method: 'POST', body: JSON.stringify({ name, secret: code }) });
  if (!r) return 'offline';
  if (!r.ok) return 'nomatch';
  await setSecret(code);
  return 'ok';
}

const freshSave = (name) => ({
  name, ink:0, totalInk:0, level:1, cleared:{}, best:{}, deaths:0, runs:0,
  weapon:'fists', skin:'graphite', head:'none', back:'nothingb', special:'inkburst',
  ownedW:['fists'], ownedS:['graphite'], ownedC:['none','nothingb'], ownedSp:['inkburst'],
  ups:{ vit:0, pow:0, swift:0, fero:0, wind:0, fort:0 },
  seenStory:{}, muted:false, music:true, campaign:2, created:Date.now(),
});

/* Bump VERSION on every deploy so testers can tell you which build they are on.
   It is shown at the bottom of Settings. */
const VERSION = '3.1.0';

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
  ['ownedW', 'ownedS', 'ownedC', 'ownedSp'].forEach(k => {
    out[k] = Array.isArray(raw[k]) ? Array.from(new Set([...base[k], ...raw[k]])) : base[k];
  });
  if (!WEAPONS.some(w => w.id === out.weapon)) out.weapon = 'fists';
  if (!SKINS.some(w => w.id === out.skin)) out.skin = 'graphite';
  if (!out.ownedW.includes(out.weapon)) out.weapon = 'fists';
  if (!out.ownedS.includes(out.skin)) out.skin = 'graphite';
  if (!out.ownedC.includes(out.head)) out.head = 'none';
  if (!out.ownedC.includes(out.back)) out.back = 'nothingb';
  if (!SPECIALS.some(x => x.id === out.special) || !out.ownedSp.includes(out.special)) out.special = 'inkburst';

  /* The campaign went from eighteen levels to forty-two, and the numbers
     moved: what used to be level 3 is now level 7. Anyone with an older
     save gets their clears and times carried across to where those levels
     actually live now, rather than having them land on the wrong ones. */
  if (!raw.campaign) {
    const MOVED = { 1:1, 2:2, 3:7, 4:8, 5:9, 6:14, 7:15, 8:16, 9:21, 10:22, 11:23,
                    12:28, 13:29, 14:30, 15:35, 16:36, 17:37, 18:42 };
    const cl = {}, bs = {};
    Object.keys(out.cleared || {}).forEach(k => { const n = MOVED[+k]; if (n) cl[n] = out.cleared[k]; });
    Object.keys(out.best || {}).forEach(k => { const n = MOVED[+k]; if (n) bs[n] = out.best[k]; });
    out.cleared = cl; out.best = bs;
    /* They keep everything they had already unlocked. The new levels
       slotted in between are open too, and simply unplayed. */
    const done = Object.keys(cl).map(Number);
    out.level = done.length ? Math.min(LEVELS.length + 1, Math.max(...done) + 1) : 1;
    out.campaign = 2;
  }
  out.ink = Math.max(0, Number(out.ink) || 0);
  out.level = clamp(Math.round(Number(out.level) || 1), 1, LEVELS.length);
  return out;
}

async function loadLocalSave() {
  try { const r = await window.storage.get(SAVE_KEY); return r ? migrateSave(JSON.parse(r.value)) : null; }
  catch { return null; }
}

/* Local save is the source of truth for speed. The cloud copy is a mirror
   used to move a player between devices, so on boot we take whichever was
   written more recently. */
async function loadSave() {
  const local = await loadLocalSave();
  if (!API || !local || !local.name) return local;
  const secret = await getSecret();
  const r = await api(`/save?name=${encodeURIComponent(local.name)}&secret=${encodeURIComponent(secret)}`);
  const cloud = r && r.ok ? migrateSave(r.body) : null;
  if (!cloud) return local;
  return (cloud.updated || 0) > (local.updated || 0) ? cloud : local;
}

/* Pull a save down for a name just restored from a recovery code. */
async function pullSave(name) {
  if (!API) return null;
  const secret = await getSecret();
  const r = await api(`/save?name=${encodeURIComponent(name)}&secret=${encodeURIComponent(secret)}`);
  return r && r.ok ? migrateSave(r.body) : null;
}

/* KV has a daily write allowance on the free plan, so the cloud copy is
   pushed at most once every 20 seconds. Local writes are not throttled. */
let cloudTimer = null, cloudPending = null;
async function writeSave(s) {
  s.updated = Date.now();
  try { await window.storage.set(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* offline */ }
  if (!API || !s.name) return;
  cloudPending = s;
  if (cloudTimer) return;
  cloudTimer = setTimeout(async () => {
    cloudTimer = null;
    const payload = cloudPending; cloudPending = null;
    if (!payload) return;
    const secret = await getSecret();
    await api('/save', { method: 'PUT', body: JSON.stringify({ name: payload.name, secret, save: payload }) });
  }, 20000);
}

async function loadBoard() {
  if (API) {
    const r = await api('/board');
    if (r && r.ok && r.body && typeof r.body === 'object') return r.body;
  }
  try { const r = await window.storage.get(LB_KEY, true); return r ? JSON.parse(r.value) : {}; }
  catch { return {}; }
}

async function submitTime(name, levelId, ms) {
  if (API) {
    const secret = await getSecret();
    const r = await api('/submit', { method: 'POST', body: JSON.stringify({ name, secret, level: levelId, ms }) });
    if (r && r.ok && r.body && typeof r.body === 'object') return r.body;
    // fall through to the local board if the server is unreachable, so a
    // clear is never lost just because the player was on a bad connection
  }
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
    sp: specOf(s),
  };
}

/* ---------------- SMALL UTILS ---------------- */
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const mod = (v, m) => ((v % m) + m) % m;
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
let AC = null, SFXBUS = null, MUSBUS = null, NOISE = null;

function audio() {
  if (AC) return AC;
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    AC = new Ctor();
    SFXBUS = AC.createGain(); SFXBUS.gain.value = 0.9; SFXBUS.connect(AC.destination);
    MUSBUS = AC.createGain(); MUSBUS.gain.value = 0.0; MUSBUS.connect(AC.destination);
    const n = AC.sampleRate * 0.5;
    NOISE = AC.createBuffer(1, n, AC.sampleRate);
    const d = NOISE.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
  return AC;
}
function wake() { const a = audio(); if (a && a.state === 'suspended') { try { a.resume(); } catch (e) { /* ignore */ } } return a; }

/* ---- single-voice helpers ---- */
function tone(t, { f, f2, dur, type = 'sine', g = 0.1, bus }) {
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2 && f2 !== f) o.frequency.exponentialRampToValueAtTime(Math.max(24, f2), t + dur);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(g, t + 0.004);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(gn); gn.connect(bus || SFXBUS);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, { dur, g = 0.1, lo = 300, hi = 3000, q = 0.8, bus, sweep }) {
  const src = AC.createBufferSource(); src.buffer = NOISE;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
  bp.frequency.setValueAtTime(hi, t); bp.Q.value = q;
  if (sweep) bp.frequency.exponentialRampToValueAtTime(Math.max(80, lo), t + dur);
  const gn = AC.createGain();
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(gn); gn.connect(bus || SFXBUS);
  src.start(t); src.stop(t + dur + 0.02);
}

/* ---- the impact vocabulary ----
   `str` is 0..1 and scales weight: a jab and a stomp use the same recipe
   at different sizes. */
const SFX = {
  punch: (t, s) => {
    tone(t, { f: 190 - s * 40, f2: 70, dur: 0.085 + s * 0.05, type: 'triangle', g: 0.16 + s * 0.10 });
    noise(t, { dur: 0.055 + s * 0.04, g: 0.11 + s * 0.09, hi: 2200, lo: 500, sweep: 1 });
  },
  kick: (t, s) => {
    tone(t, { f: 150 - s * 30, f2: 48, dur: 0.13 + s * 0.08, type: 'sawtooth', g: 0.16 + s * 0.10 });
    noise(t, { dur: 0.09 + s * 0.05, g: 0.12 + s * 0.08, hi: 1500, lo: 260, sweep: 1 });
  },
  crunch: (t, s) => {                       // elbow, stomp, dive kick, wall slam
    tone(t, { f: 120, f2: 38, dur: 0.22 + s * 0.10, type: 'square', g: 0.17 + s * 0.10 });
    noise(t, { dur: 0.20, g: 0.16, hi: 900, lo: 140, sweep: 1, q: 0.5 });
    tone(t + 0.012, { f: 900 + s * 500, f2: 300, dur: 0.06, type: 'square', g: 0.07 });
  },
  rise: (t, s) => {                          // uppercut
    tone(t, { f: 130, f2: 520 + s * 260, dur: 0.24, type: 'sawtooth', g: 0.14 });
    noise(t, { dur: 0.16, g: 0.10, hi: 600, lo: 2600, sweep: 1 });
  },
  low: (t, s) => {                           // sweep, slide
    tone(t, { f: 96, f2: 40, dur: 0.17, type: 'sine', g: 0.16 });
    noise(t, { dur: 0.20, g: 0.13, hi: 700, lo: 180, sweep: 1, q: 0.4 });
  },
  weak: (t) => {                             // you found the soft spot
    tone(t, { f: 300, f2: 1500, dur: 0.34, type: 'triangle', g: 0.13 });
    tone(t + 0.05, { f: 450, f2: 1900, dur: 0.30, type: 'sine', g: 0.09 });
    noise(t, { dur: 0.30, g: 0.08, hi: 800, lo: 5000, sweep: 1 });
  },
  shrug: (t) => {                            // it barely noticed
    tone(t, { f: 150, f2: 120, dur: 0.10, type: 'sine', g: 0.07 });
    noise(t, { dur: 0.07, g: 0.05, hi: 400, lo: 240, sweep: 1 });
  },
  hurt:  (t, s) => { tone(t, { f: 210, f2: 66, dur: 0.17, type: 'sawtooth', g: 0.15 + s * 0.06 });
                     noise(t, { dur: 0.12, g: 0.10, hi: 1200, lo: 200, sweep: 1 }); },
  swing: (t, s) => { noise(t, { dur: 0.10 + s * 0.05, g: 0.055, hi: 3400, lo: 700, sweep: 1, q: 1.6 }); },
  block: (t) => { tone(t, { f: 1100, f2: 620, dur: 0.07, type: 'square', g: 0.09 });
                  noise(t, { dur: 0.05, g: 0.07, hi: 4000, lo: 1200, sweep: 1 }); },
  parry: (t) => { tone(t, { f: 900, f2: 1800, dur: 0.20, type: 'triangle', g: 0.12 });
                  tone(t + 0.04, { f: 1350, f2: 2400, dur: 0.18, type: 'sine', g: 0.08 });
                  noise(t, { dur: 0.10, g: 0.07, hi: 6000, lo: 2000, sweep: 1 }); },
  ko:    (t) => { tone(t, { f: 320, f2: 44, dur: 0.42, type: 'square', g: 0.15 });
                  noise(t, { dur: 0.34, g: 0.13, hi: 1200, lo: 90, sweep: 1, q: 0.4 }); },
  wall:  (t) => { SFX.crunch(t, 1); tone(t + 0.02, { f: 70, f2: 32, dur: 0.34, type: 'sine', g: 0.16 }); },
  jump:  (t) => { tone(t, { f: 300, f2: 620, dur: 0.09, type: 'triangle', g: 0.07 }); },
  land:  (t) => { tone(t, { f: 110, f2: 55, dur: 0.09, type: 'sine', g: 0.09 });
                  noise(t, { dur: 0.07, g: 0.06, hi: 900, lo: 300, sweep: 1 }); },
  dash:  (t) => { noise(t, { dur: 0.16, g: 0.08, hi: 4200, lo: 500, sweep: 1, q: 2.2 }); },
  down:  (t) => { tone(t, { f: 140, f2: 40, dur: 0.30, type: 'sine', g: 0.16 });
                  noise(t, { dur: 0.26, g: 0.12, hi: 700, lo: 110, sweep: 1, q: 0.4 }); },
  super: (t) => { tone(t, { f: 110, f2: 1500, dur: 0.55, type: 'sawtooth', g: 0.15 });
                  tone(t + 0.08, { f: 220, f2: 1800, dur: 0.45, type: 'square', g: 0.08 });
                  noise(t, { dur: 0.50, g: 0.10, hi: 300, lo: 6000, sweep: 1 }); },
  win:   (t) => { [0, 0.11, 0.22, 0.36].forEach((o, i) => tone(t + o, { f: [440, 554, 659, 880][i], f2: [440, 554, 659, 880][i], dur: 0.22, type: 'triangle', g: 0.11 })); },
  buy:   (t) => { tone(t, { f: 660, f2: 990, dur: 0.15, type: 'sine', g: 0.10 });
                  tone(t + 0.07, { f: 990, f2: 1320, dur: 0.14, type: 'sine', g: 0.07 }); },
  coin:  (t) => { tone(t, { f: 880, f2: 1320, dur: 0.18, type: 'triangle', g: 0.09 }); },
};
/* old names still used around the codebase */
SFX.hit = SFX.punch; SFX.heavy = SFX.crunch;

function beep(type, muted, str = 0.4) {
  if (muted) return;
  try {
    const a = wake(); if (!a) return;
    const fn = SFX[type]; if (!fn) return;
    const jitter = 1 + (Math.random() - 0.5) * 0.06;
    fn(a.currentTime + 0.001, clamp(str, 0, 1) * jitter);
  } catch (e) { /* no audio */ }
}

/* ============================================================
   THE SCORE
   ------------------------------------------------------------
   A small step sequencer. Each chapter gets its own key and tempo,
   and every boss gets a faster, darker arrangement of it: four to
   the floor, a driving eighth-note bass, a tritone stab and a low
   drone underneath. Same world, worse mood.
   ============================================================ */

const SEMI = (root, n) => root * Math.pow(2, n / 12);

/* root note, scale degrees, tempo — one per chapter */
const CHAPTER_KEY = [
  { root: 110.0, scale: [0, 3, 5, 7, 10], bpm: 96,  name: 'margin' },      // A minor pentatonic
  { root: 98.0,  scale: [0, 2, 3, 5, 7, 9, 10], bpm: 100, name: 'erasers' }, // G dorian
  { root: 123.5, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 108, name: 'grid' },   // B aeolian
  { root: 146.8, scale: [0, 2, 4, 5, 7, 9, 10], bpm: 116, name: 'palette' },// D mixolydian
  { root: 130.8, scale: [0, 2, 3, 5, 7, 8, 11], bpm: 112, name: 'draft' },  // C harmonic minor
  { root: 92.5,  scale: [0, 1, 3, 5, 7, 8, 10], bpm: 104, name: 'page' },   // F# phrygian
];

const PATTERNS = {
  level: {
    tempoMul: 1.0, gain: 0.30,
    kick:  [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    bass:  [0,null,null,null, 4,null,null,null, 2,null,null,null, 6,null,null,null],
    lead:  [null,null,7,null, null,5,null,null, null,null,4,null, 2,null,null,null],
    drone: false, bassWave: 'triangle', leadWave: 'triangle', leadGain: 0.055,
  },
  boss: {
    tempoMul: 1.42, gain: 0.34,
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
    hat:   [0,1,1,1, 0,1,1,1, 0,1,1,1, 0,1,1,1],
    bass:  [0,0,null,0, 0,null,0,0, -2,-2,null,-2, -2,null,-5,-5],
    lead:  [null,null,null,null, null,null,null,11, null,null,6,null, null,null,11,6],
    drone: true, bassWave: 'sawtooth', leadWave: 'square', leadGain: 0.070,
  },
};

const MUSIC = { on: false, timer: null, step: 0, next: 0, mood: null, ch: 1, boss: false, droneNodes: null };

function musVoice(t, f, dur, wave, g, cut) {
  const o = AC.createOscillator(), gn = AC.createGain(), lp = AC.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = cut || 1800;
  o.type = wave; o.frequency.setValueAtTime(f, t);
  gn.gain.setValueAtTime(0.0001, t);
  gn.gain.exponentialRampToValueAtTime(g, t + 0.012);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(gn); gn.connect(MUSBUS);
  o.start(t); o.stop(t + dur + 0.02);
}
function musKick(t) {
  const o = AC.createOscillator(), gn = AC.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
  gn.gain.setValueAtTime(0.34, t);
  gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
  o.connect(gn); gn.connect(MUSBUS); o.start(t); o.stop(t + 0.22);
}
function musSnare(t) {
  const src = AC.createBufferSource(); src.buffer = NOISE;
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
  const gn = AC.createGain();
  gn.gain.setValueAtTime(0.18, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  src.connect(hp); hp.connect(gn); gn.connect(MUSBUS); src.start(t); src.stop(t + 0.16);
}
function musHat(t) {
  const src = AC.createBufferSource(); src.buffer = NOISE;
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
  const gn = AC.createGain();
  gn.gain.setValueAtTime(0.055, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  src.connect(hp); hp.connect(gn); gn.connect(MUSBUS); src.start(t); src.stop(t + 0.06);
}

function droneStart(key) {
  if (MUSIC.droneNodes) return;
  const t = AC.currentTime;
  const nodes = [];
  /* root and a tritone above it, barely moving */
  [[key.root / 2, 0.055], [SEMI(key.root / 2, 6), 0.030]].forEach(([f, g], i) => {
    const o = AC.createOscillator(), gn = AC.createGain(), lp = AC.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    o.type = 'sawtooth'; o.frequency.value = f * (i ? 1.004 : 1);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(g, t + 1.4);
    o.connect(lp); lp.connect(gn); gn.connect(MUSBUS);
    o.start(t); nodes.push({ o, gn });
  });
  MUSIC.droneNodes = nodes;
}
function droneStop() {
  if (!MUSIC.droneNodes) return;
  const t = AC.currentTime;
  for (const { o, gn } of MUSIC.droneNodes) {
    try { gn.gain.cancelScheduledValues(t); gn.gain.setValueAtTime(gn.gain.value || 0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.stop(t + 0.6); } catch (e) { /* ignore */ }
  }
  MUSIC.droneNodes = null;
}

function musicTick() {
  if (!AC || !MUSIC.on) return;
  const key = CHAPTER_KEY[clamp(MUSIC.ch, 1, 6) - 1];
  const P = PATTERNS[MUSIC.boss ? 'boss' : 'level'];
  const spb = 60 / (key.bpm * P.tempoMul) / 4;          // seconds per sixteenth
  const ahead = AC.currentTime + 0.16;
  let guard = 0;
  while (MUSIC.next < ahead && guard++ < 64) {
    const t = Math.max(MUSIC.next, AC.currentTime + 0.01);
    const i = MUSIC.step % 16;
    const bar = Math.floor(MUSIC.step / 16);
    if (P.kick[i]) musKick(t);
    if (P.snare[i]) musSnare(t);
    if (P.hat[i]) musHat(t);
    const bd = P.bass[i];
    if (bd != null) {
      const deg = key.scale[((bd % key.scale.length) + key.scale.length) % key.scale.length];
      let f = SEMI(key.root / 2, deg + (bd < 0 ? -12 : 0));
      /* below about 45Hz a phone speaker reproduces nothing at all, so
         fold those notes up an octave rather than waste the voice */
      while (f < 45) f *= 2;
      musVoice(t, f, spb * (MUSIC.boss ? 1.6 : 3.4), P.bassWave, 0.13, MUSIC.boss ? 900 : 620);
    }
    const ld = P.lead[i];
    if (ld != null && (MUSIC.boss || bar % 2 === 0)) {
      const deg = key.scale[ld % key.scale.length] + (ld >= key.scale.length ? 12 : 0);
      musVoice(t, SEMI(key.root * 2, deg), spb * 2.6, P.leadWave, P.leadGain, MUSIC.boss ? 2600 : 1500);
    }
    MUSIC.step++;
    MUSIC.next += spb;
  }
}

function musicStart(ch, boss, enabled) {
  if (!enabled) return musicStop();
  const a = wake(); if (!a) return;
  MUSIC.ch = ch; MUSIC.boss = !!boss;
  const P = PATTERNS[MUSIC.boss ? 'boss' : 'level'];
  MUSBUS.gain.cancelScheduledValues(a.currentTime);
  MUSBUS.gain.setValueAtTime(Math.max(0.0001, MUSBUS.gain.value), a.currentTime);
  MUSBUS.gain.linearRampToValueAtTime(P.gain, a.currentTime + 1.1);
  if (MUSIC.boss && P.drone) droneStart(CHAPTER_KEY[clamp(ch, 1, 6) - 1]); else droneStop();
  if (MUSIC.on) return;                     // already running, just re-moodied
  MUSIC.on = true; MUSIC.step = 0; MUSIC.next = a.currentTime + 0.10;
  MUSIC.timer = setInterval(musicTick, 25);
}
function musicMood(ch, boss, enabled) {
  if (!MUSIC.on) return musicStart(ch, boss, enabled);
  if (MUSIC.ch === ch && MUSIC.boss === !!boss) return;
  MUSIC.ch = ch; MUSIC.boss = !!boss;
  MUSIC.step = 0;                            // drop onto the downbeat of the new mood
  const P = PATTERNS[MUSIC.boss ? 'boss' : 'level'];
  try {
    MUSBUS.gain.cancelScheduledValues(AC.currentTime);
    MUSBUS.gain.setValueAtTime(Math.max(0.0001, MUSBUS.gain.value), AC.currentTime);
    MUSBUS.gain.linearRampToValueAtTime(P.gain, AC.currentTime + 0.6);
  } catch (e) { /* ignore */ }
  if (MUSIC.boss && P.drone) droneStart(CHAPTER_KEY[clamp(ch, 1, 6) - 1]); else droneStop();
}
function musicStop() {
  if (MUSIC.timer) { clearInterval(MUSIC.timer); MUSIC.timer = null; }
  MUSIC.on = false;
  droneStop();
  if (!AC || !MUSBUS) return;
  try {
    MUSBUS.gain.cancelScheduledValues(AC.currentTime);
    MUSBUS.gain.setValueAtTime(Math.max(0.0001, MUSBUS.gain.value), AC.currentTime);
    MUSBUS.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.35);
  } catch (e) { /* ignore */ }
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
/* A segment drawn as a bowed curve. `bow` is how far the middle bulges
   sideways — driven by joint speed, this is what makes a limb whip. */
function jcurve(ctx, x1, y1, x2, y2, bow, seed = 0, amp = 1.1) {
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const cx = (x1 + x2) / 2 + nx * bow, cy = (y1 + y2) / 2 + ny * bow;
  ctx.beginPath();
  ctx.moveTo(x1 + hash(seed, 1) * amp, y1 + hash(seed, 2) * amp);
  ctx.quadraticCurveTo(cx + hash(seed, 3) * amp, cy + hash(seed, 4) * amp,
                       x2 + hash(seed, 5) * amp, y2 + hash(seed, 6) * amp);
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
function drawArena(ctx, ch, tick, dark, cam = 0) {
  const par = -cam * 0.35;   // background drifts slower than the foreground
  const bg = dark ? C.night : (ch === 2 ? '#EFEADC' : ch === 6 ? '#242028' : C.paper);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const lineCol = dark ? '#3A3630' : C.paper2;
  ctx.save();
  ctx.lineWidth = 1; ctx.strokeStyle = lineCol;

  if (ch === 1) {
    ctx.strokeStyle = 'rgba(196,69,47,0.35)'; ctx.lineWidth = 2;
    jline(ctx, 96 + par * 0.5, 0, 96 + par * 0.5, H, 900, 2);
    ctx.strokeStyle = lineCol; ctx.lineWidth = 1;
    for (let y = 60; y < H; y += 34) jline(ctx, 0, y, W, y, y, 1.4);
  } else if (ch === 2) {
    for (let i = 0; i < 14; i++) {
      const x = mod(((i * 137) % (W - 100)) + 50 + par, W + 200) - 100, y = 120 + ((i * 91) % 300);
      ctx.strokeStyle = `rgba(120,114,100,${0.05 + (i % 4) * 0.03})`;
      ctx.lineWidth = 3;
      jcirc(ctx, x, y, 26 + (i % 5) * 9, i * 7, 5);
    }
  } else if (ch === 3) {
    ctx.strokeStyle = dark ? '#2E3D45' : 'rgba(142,197,220,0.55)';
    for (let x = mod(par, 32) - 32; x <= W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = dark ? '#3E5560' : 'rgba(74,124,147,0.5)'; ctx.lineWidth = 2;
    for (let x = mod(par, 160) - 160; x <= W; x += 160) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  } else if (ch === 4) {
    const cols = ['#B05A8A','#E0A02F','#5E8C61','#4A7C93','#C4452F'];
    for (let i = 0; i < 11; i++) {
      const x = mod(((i * 197) % (W - 80)) + 40 + par, W + 200) - 100, y = 80 + ((i * 131) % 340);
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
      const x = mod(70 + i * 130 + par, W + 240) - 120, y = GROUND;
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
    jline(ctx, W / 2 + par * 0.4, 0, W / 2 + par * 0.4, GROUND, 77, 3);
  }

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
   ------------------------------------------------------------
   Bones stay rigid: every limb segment is a fixed length, always.
   What flexes is the joints. Each angle is a little spring chasing
   a target, deliberately under-damped, so limbs lag on the way out,
   overshoot, and wobble back. Segments are then drawn as curves bowed
   by how fast that joint is currently moving, which is what sells the
   boneless whip without the figure ever coming apart.
   ============================================================ */

const POSE_KEYS = ['armF', 'armB', 'elF', 'elB', 'legF', 'legB', 'kneeF', 'kneeB', 'lean', 'crouch'];
/* stiffness: how hard the joint chases its target.
   damping: how much velocity survives each frame, so a HIGH number wobbles
   and a low one arrives and stops. An athlete arrives and stops: the limb
   gets there in three or four frames, holds, and only the very ends of it
   carry any follow-through at all. */
const P_STIFF = { lean: 0.58, crouch: 0.62, armF: 0.66, armB: 0.60, elF: 0.68, elB: 0.62, legF: 0.70, legB: 0.66, kneeF: 0.66, kneeB: 0.62 };
const P_DAMP = { lean: 0.50, crouch: 0.48, armF: 0.52, armB: 0.50, elF: 0.50, elB: 0.48, legF: 0.46, legB: 0.45, kneeF: 0.48, kneeB: 0.47 };
/* limbs barely bow now \u2014 bowing is what made it look boneless */
const BOW = { armF: 16, armB: 15, elF: 12, elB: 11, legF: 10, legB: 10, kneeF: 9, kneeB: 8 };

/* The shape of a strike. Nothing athletic is linear: it coils, fires in a
   couple of frames, HOLDS at full extension so the eye can read the pose,
   then recovers. Returns -1..1, negative being the wind-up. */
function strike(p, coil = 0.26, fire = 0.10, hold = 0.34) {
  if (p < coil) return -Math.sin((p / coil) * 1.5708);
  const q = (p - coil) / fire;
  if (q < 1) return -Math.cos(q * 1.5708) + Math.sin(q * 1.5708) * 1.06;
  const h = (p - coil - fire) / hold;
  if (h < 1) return 1 - h * 0.06;
  const r = clamp((p - coil - fire - hold) / Math.max(0.001, 1 - coil - fire - hold), 0, 1);
  return (1 - r) * 0.94 - r * 0.12;
}

function poseTargets(e, t) {
  const st = e.state, dur = e.stateDur || 1;
  const p = clamp(e.stateT / dur, 0, 1);
  const o = { armF: -0.4, armB: 0.5, elF: 0.7, elB: 0.7, legF: 0.35, legB: -0.35, kneeF: 0.2, kneeB: 0.2, lean: 0, crouch: 0 };

  if (st === 'run') {
    const w2 = t / 62;
    o.legF = Math.sin(w2) * 0.85; o.legB = -Math.sin(w2) * 0.85;
    o.kneeF = 0.35 + Math.max(0, Math.sin(w2)) * 0.5; o.kneeB = 0.35 + Math.max(0, -Math.sin(w2)) * 0.5;
    o.armF = -Math.sin(w2) * 0.8; o.armB = Math.sin(w2) * 0.8;
    o.lean = 0.14; o.crouch = Math.abs(Math.sin(w2 * 2)) * 2;
  } else if (st === 'jump') {
    o.legF = 0.7; o.legB = -0.5; o.kneeF = 1.1; o.kneeB = 0.3;
    o.armF = -1.5; o.armB = 1.1; o.lean = e.vy < 0 ? -0.1 : 0.12;
  } else if (st === 'atk') {
    const swing = p < 0.42 ? -1.5 + p * 1.2 : Math.min(1.5, -1.0 + (p - 0.42) * 7);
    o.armF = swing; o.elF = p < 0.42 ? 1.2 : 0.1;
    o.lean = p < 0.42 ? -0.16 : 0.26; o.armB = -swing * 0.4;
    o.legF = 0.5; o.legB = -0.4;
  } else if (st === 'heavy') {
    const swing = p < 0.55 ? -2.1 + p * 0.6 : Math.min(1.7, -1.7 + (p - 0.55) * 8.5);
    o.armF = swing; o.armB = swing * 0.8; o.elF = 0.1; o.elB = 0.1;
    o.lean = p < 0.55 ? -0.3 : 0.4; o.legF = 0.6; o.legB = -0.5; o.crouch = 3;
  } else if (st === 'jab' || st === 'cross') {
    const punch = st === 'cross';
    const e = strike(p, 0.20, 0.09, 0.34);
    o.armF = e * 1.62; o.elF = 1.35 - Math.max(0, e) * 1.29;
    o.armB = -e * 0.6; o.elB = 1.1 - Math.max(0, e) * 0.4;
    /* the hips turn into it, which is where a punch actually comes from */
    o.lean = e * (punch ? 0.32 : 0.22);
    o.legF = 0.42 + Math.max(0, e) * 0.22; o.legB = -0.34 - Math.max(0, e) * 0.20;
    o.crouch = (punch ? 2 : 1) + Math.max(0, e) * 3;
  } else if (st === 'elbow') {
    const e = strike(p, 0.30, 0.08, 0.32);
    o.armF = e * 1.5; o.elF = 2.1 - Math.max(0, e) * 1.5;
    o.armB = 1.3 - e * 0.5; o.elB = 1.6;
    o.lean = e * 0.48;
    o.legF = 0.66 + Math.max(0, e) * 0.24; o.legB = -0.52 - Math.max(0, e) * 0.22;
    o.crouch = 4 + Math.max(0, e) * 5;
  } else if (st === 'upper') {
    /* sinks into the legs, then the whole body extends at once */
    const e = strike(p, 0.24, 0.08, 0.36);
    const rise = Math.max(0, e);
    o.armF = -1.1 + rise * 3.5 + Math.min(0, e) * 0.5; o.elF = 1.5 - rise * 1.46;
    o.armB = 0.9 - rise * 1.3; o.elB = 1.3;
    o.lean = e * 0.42;
    o.crouch = 12 * -Math.min(0, e) - rise * 26;
    o.legF = 0.30 + rise * 0.40; o.legB = -0.28 - rise * 0.56;
    o.kneeF = 0.95 - rise * 0.88; o.kneeB = 0.78 - rise * 0.70;
  } else if (st === 'sweep') {
    /* drops to one hand and takes the legs out from under them */
    const e = strike(p, 0.22, 0.09, 0.36), out = Math.max(0, e);
    o.crouch = 16 + out * 9;
    o.legF = 1.48 * out + 0.2; o.kneeF = 0.05;
    o.legB = -0.9 - out * 0.3; o.kneeB = 1.7;
    o.armF = 0.9 + out * 0.5; o.elF = 0.3; o.armB = -1.0 - out * 0.4; o.elB = 0.5;
    o.lean = -0.34 - out * 0.14;
  } else if (st === 'slide') {
    const out = p > 0.76 ? (1 - p) / 0.24 : 1;
    o.crouch = 22 * out + 4;
    o.legF = 1.48 * out + 0.2; o.kneeF = 0.05;
    o.legB = -0.5; o.kneeB = 1.9;
    o.armF = -1.4; o.elF = 0.9; o.armB = 1.5; o.elB = 0.4;
    o.lean = -0.48 * out;
  } else if (st === 'airjab') {
    const ext = p < 0.30 ? -1.3 : Math.min(1.7, -1.0 + (p - 0.30) * 10);
    o.armF = ext; o.elF = p < 0.30 ? 1.2 : 0.05; o.armB = -0.9; o.elB = 1.2;
    o.legF = 0.62; o.legB = -0.42; o.kneeF = 0.9; o.kneeB = 0.35; o.lean = 0.16;
  } else if (st === 'divekick') {
    /* leg out and locked, arms trailing — held all the way down */
    o.legF = 1.52; o.kneeF = 0.02;
    o.legB = -0.65; o.kneeB = 1.75;
    o.armF = -1.55; o.elF = 0.7; o.armB = 1.55; o.elB = 0.6;
    o.lean = 0.30; o.crouch = 2;
  } else if (st === 'stomp') {
    const drop = clamp((p - 0.12) / 0.3, 0, 1);
    o.legF = 0.16 + drop * 0.30; o.legB = -0.16 - drop * 0.30;
    o.kneeF = 1.5 - drop * 1.45; o.kneeB = 1.5 - drop * 1.45;
    o.armF = -2.2; o.armB = 2.2; o.elF = 0.3; o.elB = 0.3;
    o.lean = 0; o.crouch = 10 - drop * 14;
  } else if (st === 'charge') {
    o.lean = 0.52; o.armF = 1.45; o.elF = 0.12; o.armB = -1.2; o.elB = 0.9;
    o.legF = 0.82; o.legB = -0.66; o.crouch = 5;
  } else if (st === 'cartwheel') {
    /* legs split wide, arms locked out — the body is a spoke */
    o.legF = 1.15; o.legB = -1.05; o.kneeF = 0.06; o.kneeB = 0.10;
    o.armF = -2.5; o.armB = 2.4; o.elF = 0.05; o.elB = 0.05;
    o.lean = 0.10; o.crouch = -6;
  } else if (st === 'backflip') {
    /* tucked at the top, opening out on the way down */
    const tuck = Math.sin(clamp(p, 0, 1) * 3.14159);
    o.legF = 0.55 + tuck * 0.55; o.legB = -0.35 - tuck * 0.35;
    o.kneeF = 0.35 + tuck * 1.75; o.kneeB = 0.35 + tuck * 1.85;
    o.armF = -1.5 - tuck * 0.9; o.armB = 1.3 + tuck * 0.8;
    o.elF = 0.4 + tuck * 1.5; o.elB = 0.4 + tuck * 1.4;
    o.lean = -0.14; o.crouch = 6 + tuck * 12;
  } else if (st === 'vault') {
    /* one arm down onto them, legs scissoring over the top */
    const over = Math.sin(clamp(p, 0, 1) * 3.14159);
    o.armF = 2.45; o.elF = 0.06;
    o.armB = -1.6 - over * 0.7; o.elB = 0.5;
    o.legF = 0.75 + over * 0.85; o.legB = -0.55 - over * 0.75;
    o.kneeF = 0.15; o.kneeB = 0.9 - over * 0.7;
    o.lean = 0.34 + over * 0.24; o.crouch = -4 - over * 8;
  } else if (st === 'wallkick') {
    /* pushed off, twisting to face back out */
    const t2 = clamp(p, 0, 1);
    o.legF = 1.25 - t2 * 0.75; o.legB = -0.45 - t2 * 0.3;
    o.kneeF = 0.10 + t2 * 0.8; o.kneeB = 1.3 - t2 * 0.9;
    o.armF = -1.9; o.armB = 1.7; o.elF = 0.3; o.elB = 0.9;
    o.lean = -0.28 + t2 * 0.34; o.crouch = -4;
  } else if (st === 'land') {
    /* knees take it, arms come out for balance, then up */
    const ab = 1 - clamp(p, 0, 1);
    o.crouch = 20 * ab; o.kneeF = 1.4 * ab + 0.2; o.kneeB = 1.4 * ab + 0.2;
    o.legF = 0.42 + ab * 0.30; o.legB = -0.36 - ab * 0.26;
    o.armF = -0.9 - ab * 1.1; o.armB = 0.9 + ab * 1.0; o.elF = 0.7 - ab * 0.5; o.elB = 0.7 - ab * 0.5;
    o.lean = 0.16 * ab;
  } else if (st === 'down') {
    o.crouch = 0; o.lean = 0; o.armF = -0.6; o.armB = 0.7; o.elF = 0.4; o.elB = 0.4;
    o.legF = 0.5; o.legB = -0.2; o.kneeF = 0.7; o.kneeB = 0.4;
  } else if (st === 'getup') {
    const up = clamp((p - 0.25) / 0.6, 0, 1);
    o.crouch = 20 * (1 - up);
    o.armF = -0.9 + up * 0.5; o.elF = 1.5 - up * 0.8; o.armB = 0.8; o.elB = 1.2 - up * 0.5;
    o.legF = 0.9 - up * 0.55; o.legB = -0.7 + up * 0.35;
    o.kneeF = 1.5 - up * 1.3; o.kneeB = 1.2 - up * 1.0;
    o.lean = -0.24 * (1 - up);
  } else if (st === 'spin') {
    /* the whole body is being rotated by the caller; the pose is the shape
       held during the rotation — one leg locked out, the other tucked. */
    const ext = p < 0.20 ? p / 0.20 : p > 0.82 ? (1 - p) / 0.18 : 1;
    o.legF = 1.45 * ext + 0.25; o.kneeF = 0.05;
    o.legB = -0.35 - 0.55 * ext; o.kneeB = 1.5 * ext + 0.2;
    o.armF = -1.9 * ext; o.armB = 1.7 * ext; o.elF = 1.5 * ext; o.elB = 0.9 * ext;
    o.lean = -0.18 * ext; o.crouch = -10 * ext;
  } else if (st === 'block') {
    o.armF = -0.15; o.armB = -0.05; o.elF = 1.9; o.elB = 1.7; o.lean = -0.12; o.crouch = 4;
    o.legF = 0.25; o.legB = -0.45;
  } else if (st === 'special') {
    const w2 = p * 26;
    o.armF = Math.sin(w2) * 2.5; o.armB = -Math.sin(w2) * 2.5; o.elF = 0.08; o.elB = 0.08;
    o.lean = Math.sin(w2 * 0.5) * 0.22; o.legF = 0.55; o.legB = -0.55;
    o.crouch = -Math.sin(p * 3.14159) * 16;
  } else if (st === 'dash') {
    o.lean = 0.55; o.legF = 0.9; o.legB = -0.7; o.armF = 1.2; o.armB = -1.3; o.crouch = 5;
  } else if (st === 'hurt') {
    o.lean = -0.35; o.armF = -1.9; o.armB = -1.5; o.legF = 0.2; o.legB = -0.6; o.crouch = 4;
  } else {
    const br = Math.sin(t / 420) * 0.06;
    o.armF = -0.35 + br; o.armB = 0.45 - br; o.crouch = Math.sin(t / 420) * 1.2;
  }
  return o;
}

/* Integrate the springs. Returns the live pose plus its velocities. */
function flowPose(e, tgt, t) {
  const dt = e._pt == null ? 16.7 : clamp(t - e._pt, 0, 64);
  e._pt = t;
  if (!e.pose) { e.pose = { ...tgt }; e.pv = {}; for (const k of POSE_KEYS) e.pv[k] = 0; return e.pose; }
  const f = clamp(dt / 16.7, 0, 2.2);
  for (const k of POSE_KEYS) {
    e.pv[k] += (tgt[k] - e.pose[k]) * P_STIFF[k] * f;
    e.pv[k] *= Math.pow(P_DAMP[k], f);
    e.pose[k] += e.pv[k] * f;
  }
  return e.pose;
}

function drawFighter(ctx, e, look, t) {
  const { x, y, h, face } = e;
  const line = look.line || C.graphite;
  const headR = h * 0.115;
  const sd = e.id * 13;

  ctx.save();

  /* a launched body tumbles, then settles flat on the page */
  if (e.dead && e.launched) {
    ctx.translate(x, y - h * 0.22);
    ctx.rotate(e.spin || 0);
    ctx.translate(-x, -(y - h * 0.22));
  } else if (e.state === 'spin') {
    const p = clamp(e.stateT / (e.stateDur || 1), 0, 1);
    ctx.translate(x, y - h * 0.50);
    ctx.rotate(p * Math.PI * 2 * face);
    ctx.translate(-x, -(y - h * 0.50));
  } else if (e.state === 'cartwheel' || e.state === 'backflip' || e.state === 'vault' || e.state === 'wallkick') {
    /* the whole figure turns; the pivot sits at the hips so it wheels
       rather than swinging from the feet */
    const p = clamp(e.stateT / (e.stateDur || 1), 0, 1);
    const turns = { cartwheel: 1, backflip: -1.35, vault: 0.55, wallkick: -0.85 }[e.state] || 1;
    const ease = e.state === 'cartwheel' ? p : p < 0.86 ? p / 0.86 : 1;
    ctx.translate(x, y - h * 0.48);
    ctx.rotate(ease * Math.PI * 2 * turns * face);
    ctx.translate(-x, -(y - h * 0.48));
  } else if (e.state === 'down' || e.state === 'getup') {
    /* tips flat onto the page, then levers back upright */
    const p = clamp(e.stateT / (e.stateDur || 1), 0, 1);
    const side = e.downSide || 1;
    const a = e.state === 'down' ? Math.min(1, p * 3.2) : clamp(1 - (p - 0.2) / 0.6, 0, 1);
    ctx.translate(x, y - h * 0.14);
    ctx.rotate(a * 1.48 * side);
    ctx.translate(-x, -(y - h * 0.14));
  }

  ctx.strokeStyle = line;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = (h / 62) * 3 * (look.thick || 1);
  if (look.ghost) ctx.globalAlpha = 0.55;
  if (look.glow) { ctx.shadowColor = look.accent || line; ctx.shadowBlur = 10; }
  if (e.iframe > 0 && Math.floor(t / 60) % 2 === 0) ctx.globalAlpha *= 0.4;
  if (e.hurtT > 0) ctx.strokeStyle = C.red;

  const P = flowPose(e, poseTargets(e, t), t);
  const V = e.pv;
  const { armF, armB, elF, elB, legF, legB, kneeF, kneeB, lean, crouch } = P;

  const hipY = y - h * 0.46, shY = y - h * 0.80, headY = y - h * 0.90;
  const hy = hipY + crouch, sy = shY + crouch, hdY = headY + crouch;
  const sx = x + Math.sin(lean) * (hy - sy) * face;
  /* the head is the last thing to arrive: it trails the shoulders */
  const trail = clamp(V.lean * 26, -9, 9);
  const hdX = x + Math.sin(lean) * (hy - hdY) * face - trail * face;
  const hdYo = hdY + Math.abs(trail) * 0.18;

  if (look.back && look.back !== 'nothingb') { ctx.save(); drawBack(ctx, look.back, sx, sy, hy, face, t, e.vx || 0); ctx.restore(); }

  const sc = h / 62;

  // legs — fixed segment lengths, bowed by how fast the joint is travelling
  const leg = (ang, knee, vAng, vKnee, seed) => {
    const kx = x + Math.sin(ang) * (h * 0.24) * face, ky = hy + Math.cos(ang) * (h * 0.24);
    const fx = kx + Math.sin(ang - knee * 0.5) * (h * 0.24) * face;
    const airborne = e.state === 'cartwheel' || e.state === 'backflip' || e.state === 'vault' || e.state === 'wallkick';
    const fy = ((e.dead && e.launched) || airborne || e.state === 'down' || e.state === 'getup') ? ky + Math.cos(ang - knee * 0.5) * (h * 0.24)
      : Math.min(y, ky + Math.cos(ang - knee * 0.5) * (h * 0.24));
    jcurve(ctx, x, hy, kx, ky, vAng * BOW.legF * sc * face, seed, 0.7);
    jcurve(ctx, kx, ky, fx, fy, vKnee * BOW.kneeF * sc * face, seed + 1, 0.7);
    jline(ctx, fx, fy, fx + 7 * face, fy, seed + 2, 0.5);
  };
  leg(legB, kneeB, V.legB, V.kneeB, sd + 10);
  leg(legF, kneeF, V.legF, V.kneeF, sd + 20);

  // torso — a spine that curves when the body snaps
  jcurve(ctx, x, hy, sx, sy, clamp(V.lean * 90, -14, 14) * sc * face, sd + 30, 0.8);

  // arms
  const arm = (ang, elb, vAng, vElb, seed) => {
    const ex = sx + Math.sin(ang + 1.57) * (h * 0.19) * face, ey = sy + Math.cos(ang + 1.57) * (h * 0.19) * 0.7 + h * 0.06;
    const hx2 = ex + Math.sin(ang + 1.57 - elb) * (h * 0.20) * face, hy2 = ey + Math.cos(ang + 1.57 - elb) * (h * 0.20) * 0.8;
    jcurve(ctx, sx, sy + h * 0.03, ex, ey, clamp(vAng * BOW.armF, -22, 22) * sc * face, seed, 0.7);
    jcurve(ctx, ex, ey, hx2, hy2, clamp(vElb * BOW.elF, -20, 20) * sc * face, seed + 1, 0.7);
    return [hx2, hy2, ang];
  };
  arm(armB, elB, V.armB, V.elB, sd + 40);
  const [hx, hy2, hang] = arm(armF, elF, V.armF, V.elF, sd + 50);

  // head
  jcirc(ctx, hdX, hdYo, headR, sd + 60, 0.9, look.fillHead || null);
  // neck, so a trailing head still reads as attached
  jline(ctx, sx, sy, hdX + (sx - hdX) * 0.34, hdYo + headR * 0.9, sd + 63, 0.5);
  ctx.save();
  ctx.fillStyle = line; ctx.globalAlpha *= 0.9;
  const ex1 = hdX + headR * 0.30 * face, ey1 = hdYo - headR * 0.10;
  if (e.hurtT > 0 || e.state === 'hurt' || (e.dead && e.launched)) {
    ctx.lineWidth = 1.8;
    jline(ctx, ex1 - 4, ey1 - 4, ex1 + 4, ey1 + 4, sd + 71, 0.5);
    jline(ctx, ex1 + 4, ey1 - 4, ex1 - 4, ey1 + 4, sd + 72, 0.5);
  } else {
    ctx.beginPath(); ctx.arc(ex1, ey1, headR * 0.15, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(hdX - headR * 0.12 * face, ey1, headR * 0.15, 0, 7); ctx.fill();
  }
  ctx.restore();
  if (look.head && look.head !== 'none') drawHead(ctx, look.head, hdX, hdYo, headR, face);

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
      thick: art === 'architect' ? 1.15 : 1.25, glow: art === 'architect' ? C.purple : null,
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
   WORLD BUILDING — levels are routes, not arenas
   ------------------------------------------------------------
   Every level is a strip of paper several screens wide. The floor is a
   list of solid segments; the gaps between them are pits. Encounters are
   placed along the route and each one locks a gate behind it, so you have
   to finish a fight before the paper lets you walk on. Boss levels end in
   a sealed arena with flat ground.
   ============================================================ */

/* Small deterministic RNG so a level looks identical every time it loads. */
function seeded(n) {
  let s = (n * 1103515245 + 12345) >>> 0;
  return () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
}

/* A standing jump covers roughly this much ground, so pits stay comfortably
   under it. Dashing clears more, but nothing should ever REQUIRE a dash. */
const JUMP_REACH = 176;

function buildWorld(lv) {
  const rand = seeded(lv.id * 7919);
  const encounters = lv.waves.filter(w => w[0] !== 'boss');
  const bossWave = lv.waves.find(w => w[0] === 'boss');

  const START = 260;
  const RUN = 1000;                      // walking room around each encounter
  const ARENA = 900;                     // sealed boss arena at the end
  const bodyLen = START + encounters.length * RUN + (bossWave ? 420 : 340);
  const w = bodyLen + (bossWave ? ARENA : 200);

  /* --- encounters, evenly spaced along the route --- */
  const encs = encounters.map((wv, i) => {
    const x = START + RUN * i + 420;
    return { x, gate: x + 250, spawn: wv, fired: false, cleared: false, ids: [] };
  });

  const bossX = bossWave ? bodyLen + 160 : null;

  /* --- pits, dropped into the gaps between encounters --- */
  const pits = [];
  const blocked = (a, b) => {
    if (a < START) return true;
    if (bossX && b > bossX - 260) return true;       // never in the boss run-up
    return encs.some(e => b > e.x - 230 && a < e.gate + 90);
  };
  const pitCount = lv.kind === 'boss' ? 2 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 3);
  let guard = 0;
  while (pits.length < pitCount && guard++ < 260) {
    const width = 84 + Math.floor(rand() * 52);       // 84..136, all clearable
    const a = START + Math.floor(rand() * (bodyLen - START - width - 200));
    const b = a + width;
    if (blocked(a, b)) continue;
    if (pits.some(p => b > p[0] - 190 && a < p[1] + 190)) continue;   // room to land
    pits.push([a, b]);
  }
  pits.sort((a, b) => a[0] - b[0]);

  /* --- ground segments are the paper left between the pits --- */
  const segs = [];
  let cur = 0;
  for (const [a, b] of pits) { segs.push([cur, a]); cur = b; }
  segs.push([cur, w]);

  /* --- a stepping stone over the wider pits, and a few to climb on --- */
  const plats = [];
  for (const [a, b] of pits) {
    if (b - a > 112) plats.push({ x: (a + b) / 2 - 44, y: GROUND - 104, w: 88 });
  }
  const extra = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < extra; i++) {
    const px = START + 120 + rand() * (bodyLen - START - 320);
    if (pits.some(p => px + 100 > p[0] - 40 && px < p[1] + 40)) continue;
    plats.push({ x: px, y: GROUND - (96 + Math.floor(rand() * 62)), w: 96 + Math.floor(rand() * 60) });
  }

  /* Inkwells: a drink of health on the road. One sits outside every boss
     door, because arriving at a boss on the fumes of three fights with no
     way to top up is not difficulty, it is just an unwinnable run. */
  const wells = [];
  encs.forEach((e, i) => { if (i > 0) wells.push({ x: e.gate + 170, used: false }); });
  if (bossX != null) wells.push({ x: bossX - 210, used: false });

  return { w, segs, pits, plats, encs, wells, bossX, bossWave, exit: w - 120 };
}

/* Height of the floor under a point, or null when there is nothing there. */
function groundAt(g, x) {
  for (const [a, b] of g.world.segs) if (x >= a && x <= b) return GROUND;
  return null;
}

/* One-way platforms: you land on them falling, and jump up through them. */
function platformUnder(g, e, prevY) {
  if (e.vy < 0) return null;
  for (const p of g.world.plats) {
    if (e.x < p.x - 6 || e.x > p.x + p.w + 6) continue;
    if (prevY <= p.y + 2 && e.y >= p.y) return p;
  }
  return null;
}

/* The furthest right the player may walk, given any gate that is still shut. */
function activeGate(g) {
  for (const e of g.world.encs) if (e.fired && !e.cleared) return e.gate;
  if (g.world.bossX != null && g.bossFired && g.boss && !g.boss.dead) return g.world.w - 60;
  return null;
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
    cam:0, bossFired:false, safeX:150, falls:0, reached:0,
    player: makePlayer(stats, save), boss:null, quip:'', quipT:0, banner:'', bannerT:0,
    endT:0, flash:0, power:0, rings:[],
  };
  g.world = buildWorld(lv);
  g.player.hp = stats.maxHp;
  g.player.x = 120;
  g.banner = 'GO'; g.bannerT = 1200;
  return g;
}

/* Spawn one encounter's enemies just ahead of the player, on solid ground. */
/* Nothing should ever appear in your lap. A third of the screen is the
   least room you get, and it is enforced twice: once when the fight is
   triggered, and again when the body actually becomes solid, because you
   are usually still running forward while it fades in. */
const SPAWN_GAP = 300;

/* Nearest x to `want` that has floor under it, searched outward. */
function solidNear(g, want, lo, hi) {
  const w = clamp(want, lo, hi);
  if (groundAt(g, w) != null) return w;
  for (let step = 24; step <= 420; step += 24) {
    const r = clamp(w + step, lo, hi), l = clamp(w - step, lo, hi);
    if (groundAt(g, r) != null) return r;
    if (groundAt(g, l) != null) return l;
  }
  return w;
}

function fireEncounter(g, enc) {
  enc.fired = true;
  const lvIdx = g.lv.id - 1;
  const [type, count] = enc.spawn;
  /* Line them up ahead of you, never on top of you and never behind. */
  const first = Math.max(enc.x - 60, g.player.x + SPAWN_GAP);
  const lo = Math.max(40, g.player.x + SPAWN_GAP);
  const hi = Math.min(g.world.w - 40, enc.gate - 30);
  for (let i = 0; i < count; i++) {
    const want = first + i * 76 + (i % 2 ? 26 : 0);
    const x = solidNear(g, want, lo, Math.max(lo, hi));
    const e = makeEnemy(type, lvIdx, x);
    e.face = x > g.player.x ? -1 : 1;
    e.spawnT = 260 + i * 120;
    e.minGap = 1;                     // hold him off until he is solid
    enc.ids.push(e.id);
    g.ents.push(e);
  }
  g.banner = count > 2 ? 'AMBUSH' : 'TROUBLE'; g.bannerT = 1000;
}

function fireBoss(g) {
  g.bossFired = true;
  const wv = g.world.bossWave;
  const b = makeBoss(wv[1], g.lv.id - 1);
  b.x = clamp(g.player.x + 420, g.player.x + SPAWN_GAP, g.world.w - 150);
  if (wv[1] === 'understudy') b.mirrorWp = g.stats.wp;
  g.boss = b; g.ents.push(b);
  g.banner = b.name; g.bannerT = 1800;
  const q = BOSSES[wv[1]].quips;
  g.quip = q[0]; g.quipT = 3400;
  g.shake = 14;
}

function hurt(g, target, dmg, kbx, fromX, isPlayerSource) {
  if (target.dead || target.iframe > 0) return false;
  // block / parry
  if (target.kind === 'player' && target.state === 'block' && Math.sign(fromX - target.x) === target.face) {
    if (target.blockT < 200) {
      const heal = Math.min(target.maxHp * 0.05, target.maxHp - target.hp);
      target.hp += heal;
      g.parryT = 2600;                 // a window where you are wearing its colour
      pop(g, target.x, target.y - 84, 'PARRY!', C.ink, 30);
      if (heal > 0.5) pop(g, target.x + 30, target.y - 62, '+' + Math.round(heal), C.green, 19);
      beep('parry', g.save.muted, 1); g.shake = 7;
      burst(g, target.x + 22 * target.face, target.y - 40, 12, C.ink, true);
      return 'parry';
    }
    dmg *= 0.22; kbx *= 0.4;
    beep('block', g.save.muted);
    burst(g, target.x + 18 * target.face, target.y - 40, 5, C.blueDk);
    pop(g, target.x, target.y - 78, 'BLOCK', C.blueDk, 20);
  }
  /* Bosses resist almost everything except the one thing they cannot. */
  let weakHit = false;
  if (target.kind === 'boss' && isPlayerSource && target.def.weak) {
    const W = target.def.weak;
    weakHit = !!W.test(g, target, g.curMove || null);
    dmg *= weakHit ? W.bonus : W.resist;
    if (weakHit) {
      pop(g, target.x, target.y - target.h - 18, W.tag, C.ink, 30);
      g.shake = Math.max(g.shake, 12);
      g.rings.push({ x:target.x, y:target.y - target.h * 0.5, r:14, max:120, life:340, maxLife:340, col:C.ink });
      beep('weak', g.save.muted, 1);
      g.freeze = Math.max(g.freeze || 0, 150);
      if (!g.weakFound) {
        g.weakFound = true;
        g.banner = 'WEAK POINT'; g.bannerT = 1500;
      }
    } else {
      target.shrug = (target.shrug || 0) + 1;
      if (target.shrug % 9 === 0) { pop(g, target.x, target.y - target.h - 10, 'SHRUGS IT OFF', '#8A8270', 20); beep('shrug', g.save.muted, 0.4); }
    }
  }

  target.hp -= dmg;
  target.hurtT = 240; target.iframe = target.kind === 'player' ? 460 : 190;
  target.vx = kbx; if (Math.abs(kbx) > 6) target.vy = -3.2;
  target.state = 'hurt'; target.stateT = 0; target.stateDur = 260;
  target.stun = target.kind === 'boss' ? 0 : 240;

  /* A solid hit puts you on the floor. Not every time — enough that it
     matters, not so often that you spend the fight getting up. */
  if (target.kind === 'player' && target.hp > 0) {
    const share = dmg / Math.max(1, target.maxHp);
    const chance = share >= 0.20 ? 1 : share >= 0.13 ? 0.55 : share >= 0.09 ? 0.22 : 0;
    if (chance && Math.random() < chance) {
      knockDown(g, target, Math.sign(kbx) || -target.face);
      target.iframe = 300;
      pop(g, target.x, target.y - 96, 'DOWN', C.red, 26);
    }
  }
  g.shake = Math.max(g.shake, Math.min(11, 3 + dmg * 0.14));

  const cx = target.x, cy = target.y - target.h * 0.6;
  burst(g, cx, cy, dmg > 20 ? 12 : 7, isPlayerSource ? C.graphite : C.red, dmg > 20);
  /* weight the sound by how much of the target's health that took */
  const bite = clamp(dmg / Math.max(1, target.maxHp * 0.14), 0.15, 1);
  if (isPlayerSource) beep(HIT_SFX[g.curMove] || 'punch', g.save.muted, bite);
  else beep('hurt', g.save.muted, bite);

  if (isPlayerSource) {
    g.combo++; g.comboT = 2200; g.maxCombo = Math.max(g.maxCombo, g.combo);
    if (!g.specialActive) {
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
    beep('ko', g.save.muted);
    if (target.kind !== 'player') {
      g.killed++; pop(g, cx, cy - 40, 'KO', C.graphite, 40); g.shake = 12;
      if (target.kind === 'enemy' && Math.random() < (g.boss ? 0.55 : 0.28)) {
        g.drops.push({ x: cx, y: cy, vy: -4, life: 9000, heal: Math.round(g.player.maxHp * 0.12) });
      }
      /* Some bodies go flying. A super move always sends them. */
      if (target.kind === 'enemy') {
        const forced = !!g.specialActive;
        if (forced || Math.random() < 0.34) {
          const dir = Math.sign(kbx) || (target.x >= g.player.x ? 1 : -1);
          target.launched = 1; target.slam = 0; target.deadT = 2200;
          target.vx = dir * (forced ? rnd(30, 40) : rnd(22, 31));
          target.vy = -rnd(3.4, 7.0);
          target.spin = 0; target.spinV = dir * rnd(0.20, 0.42);
          target.iframe = 0;
        }
      }
    }
    /* a body that stayed put dissolves on the spot; a thrown one keeps its ink */
    if (!target.launched) poof(g, cx, cy, target.col || C.graphite);
  }
  return true;
}

function overlapArc(a, tx, ty, reach, face, wide) {
  const dx = (tx - a.x) * face, dy = ty - (a.y - a.h * 0.5);
  return dx > -14 && dx < reach && Math.abs(dy) < (wide || 46);
}

/* `up` and `dn` are how far above and below your own middle a move reaches,
   in player heights. Low moves also demand the target have its feet down. */
const MOVES = {
  jab:      { dmg:0.85, dur:250, reach:0.92, kb:0.8,  hit:0.36, up:0.60, dn:0.55 },
  cross:    { dmg:1.05, dur:290, reach:1.00, kb:1.1,  hit:0.40, up:0.60, dn:0.55 },
  elbow:    { dmg:1.75, dur:420, reach:1.05, kb:2.4,  hit:0.46, up:0.65, dn:0.60 },
  kick:     { dmg:2.15, dur:620, reach:1.15, kb:2.1,  hit:0.60, up:0.70, dn:0.60 },
  spin:     { dmg:2.50, dur:700, reach:1.30, kb:3.4,  hit:0.30, up:0.95, dn:0.70, second:0.66 },
  upper:    { dmg:2.00, dur:470, reach:0.86, kb:1.0,  hit:0.34, up:1.35, dn:0.40, launch:true },
  sweep:    { dmg:1.25, dur:430, reach:1.22, kb:1.4,  hit:0.38, up:0.25, dn:0.85, low:true, trip:true },
  slide:    { dmg:1.45, dur:520, reach:1.30, kb:1.8,  hit:0.26, up:0.25, dn:0.85, low:true, trip:true },
  airjab:   { dmg:0.95, dur:250, reach:0.95, kb:1.0,  hit:0.32, up:0.60, dn:1.35 },
  divekick: { dmg:2.30, dur:1400, reach:1.20, kb:2.6, hit:null,  up:0.55, dn:1.70 },
  stomp:    { dmg:2.60, dur:900, reach:1.05, kb:2.2,  hit:null,  up:0.45, dn:1.20 },
  charge:   { dmg:1.70, dur:330, reach:1.10, kb:2.6,  hit:0.30, up:0.65, dn:0.60 },
};
const ATTACK_STATES = ['jab', 'cross', 'elbow', 'kick', 'spin', 'upper', 'sweep', 'slide', 'airjab', 'divekick', 'stomp', 'charge'];

/* Which move comes out, given the situation. */
function chooseMove(g, p, heavy, holdingDir) {
  const crouched = p.state === 'block' && p.onGround;
  /* Coming out of a roundoff you are already travelling, so a punch turns
     into a shoulder charge. Out of a vault you are above them, so it
     turns into something thrown downward. */
  if (p.state === 'cartwheel') return heavy ? 'kick' : 'charge';
  if (p.state === 'vault') return heavy ? 'stomp' : 'divekick';
  if (crouched) return heavy ? 'sweep' : 'upper';        // rise out of the guard
  if (!p.onGround) {
    if (!heavy) return 'airjab';
    return holdingDir ? 'divekick' : 'stomp';
  }
  if (heavy) {
    if (holdingDir && Math.abs(p.vx) > 3.0 && Math.random() < 0.42) return 'slide';
    return Math.random() < 0.34 ? 'spin' : 'kick';
  }
  /* punches chain: jab, cross, elbow, then reset */
  if (p.chainT > 0 && p.chain < 2) return p.chain === 0 ? 'cross' : 'elbow';
  return 'jab';
}

function playerAttack(g, heavy, holdingDir) {
  const p = g.player, s = g.stats, wp = s.wp;
  if (p.atkCd > 0 || p.dead || p.stun > 0 || p.state === 'down' || p.state === 'getup') return;
  if (ATTACK_STATES.includes(p.state)) return;

  const mv = chooseMove(g, p, heavy, holdingDir);
  const M = MOVES[mv];

  // standing still? turn toward whoever is closest, so you never swing at a wall
  if (!holdingDir) {
    let near = null, nd = 1e9;
    for (const e of g.ents) { if (e.dead || e.spawnT > 0) continue; const d = Math.abs(e.x - p.x); if (d < nd) { nd = d; near = e; } }
    if (near && nd > 6) p.face = near.x > p.x ? 1 : -1;
  }

  const dur = M.dur / (s.atkMul * wp.speed);
  p.move = mv; p.state = mv; p.stateT = 0; p.stateDur = dur;
  p.atkCd = mv === 'divekick' || mv === 'stomp' ? 0 : dur * 1.05;
  p.hitDone = 0; p.hitSet = null;
  p.pendingHeavy = heavy;

  if (mv === 'jab' || mv === 'cross' || mv === 'elbow') {
    p.chain = mv === 'jab' ? 0 : mv === 'cross' ? 1 : 2;
    p.chainT = mv === 'elbow' ? 0 : 620;                 // the elbow ends the string
    p.vx += p.face * (mv === 'elbow' ? 3.4 : 1.2);
  } else if (mv === 'upper') {
    p.vy = -6.2; p.onGround = false; p.jumps = 1; p.blockT = 0;
    for (let i = 0; i < 6; i++) g.parts.push({ x:p.x, y:p.y - 10, vx:rnd(-2.4,2.4), vy:rnd(-2,-0.3), life:300, max:300, type:'dust', col:C.paper2, size:7, rot:0 });
  } else if (mv === 'sweep') {
    p.vx = p.face * 4.4; p.blockT = 0;
  } else if (mv === 'slide') {
    p.vx = p.face * 15; p.iframe = Math.max(p.iframe, 200);   // you go under things
    for (let i = 0; i < 8; i++) g.parts.push({ x:p.x, y:p.y - 4, vx:-p.face * rnd(1,4), vy:rnd(-1.6,0), life:340, max:340, type:'dust', col:C.paper2, size:8, rot:0 });
  } else if (mv === 'spin') {
    p.vy = -8.6; p.onGround = false; p.jumps = 1; p.vx = p.face * 4.2;
    g.shake = Math.max(g.shake, 4);
    for (let i = 0; i < 7; i++) g.parts.push({ x:p.x, y:p.y - 14, vx:rnd(-3.4,3.4), vy:rnd(-1.6,0.4), life:300, max:300, type:'dust', col:C.paper2, size:8, rot:0 });
  } else if (mv === 'divekick') {
    /* Leg goes out and stays out. It holds until he is nearly down, then
       he plants it and lands on his feet. */
    p.vx = p.face * 11.5; p.vy = Math.min(p.vy, -1.2);
    p.hitSet = [];
  } else if (mv === 'stomp') {
    p.vx *= 0.3; p.vy = -3.0; p.hitSet = [];
  } else if (mv === 'charge') {
    p.vx = p.face * 13; p.iframe = Math.max(p.iframe, 160);
  }
  beep('swing', g.save.muted, M.dmg / 2.6);
}

/* Resolve a swing. `phase` distinguishes the second hit of a two-part move. */
function resolveHit(g, mv, phase) {
  const p = g.player, s = g.stats, wp = s.wp;
  g.curMove = mv;
  const M = MOVES[mv] || MOVES.jab;
  const dmg = wp.dmg * s.dmgMul * M.dmg * (phase ? 0.7 : 1);
  const reach = wp.range * M.reach;
  let landed = false;

  for (const e of g.ents) {
    if (e.dead || e.spawnT > 0) continue;
    if (p.hitSet && p.hitSet.includes(e.id)) continue;         // continuous moves hit once each
    if (M.low && !e.onGround) continue;                        // you cannot sweep a man in the air

    /* measured middle-to-middle, so a low move is genuinely low and a
       rising one genuinely reaches over your own head */
    const dx = (e.x - p.x) * p.face;
    if (dx < -18 || dx > reach + e.w / 2) continue;
    const span = (e.h + p.h) * 0.5;
    if (M.low) {
      /* a sweep goes for the legs — measured off the floor, so it works on
         something four times your height as well as something your own size */
      const foot = e.y - (p.y - p.h * 0.30);
      if (foot < -40 || foot > 120) continue;
    } else {
      const dy = (e.y - e.h * 0.5) - (p.y - p.h * 0.5);
      if (dy < -M.up * span || dy > M.dn * span) continue;
    }

    const boss = e.kind === 'boss';
    hurt(g, e, dmg, wp.kb * M.kb * (boss ? 0.22 : 1) * p.face, p.x, true);
    if (p.hitSet) p.hitSet.push(e.id);
    landed = true;

    if (!e.dead && (!boss || (mv === 'upper' && e.key === 'scribble'))) {
      if (M.launch) { e.vy = -13.5; e.onGround = false; e.state = 'jump'; e.stun = Math.max(e.stun, 420); }
      if (M.trip) knockDown(g, e, p.face);
    }
  }

  if (landed) {
    /* heavier moves hold contact longer */
    const stop = { jab: 34, cross: 40, airjab: 34, charge: 62, kick: 62, sweep: 55, slide: 55,
                   spin: 78, elbow: 82, upper: 74, divekick: 88, stomp: 96 }[mv] || 40;
    g.freeze = Math.max(g.freeze || 0, phase ? stop * 0.6 : stop);
    /* anything you land is now something you have shown people */
    g.seen = g.seen || {};
    g.seen[mv] = g.tick + 12000;
    if (mv === 'spin' || mv === 'elbow' || mv === 'divekick' || mv === 'stomp') g.shake = Math.max(g.shake, 10);
    if (mv === 'upper') {
      g.shake = Math.max(g.shake, 9);
      g.rings.push({ x:p.x + 22 * p.face, y:p.y - p.h * 0.9, r:8, max:62, life:280, maxLife:280, col:C.ink });
    }
    if (mv === 'spin') g.rings.push({ x:p.x + 26 * p.face, y:p.y - p.h * 0.5, r:12, max:74, life:300, maxLife:300, col:C.graphite });
  } else if (!p.hitSet) {
    const hx = p.x + reach * 0.7 * p.face;
    g.parts.push({ x:hx, y:p.y - 40, vx:0, vy:0, life:120, max:120, type:'dust', col:C.paper2, size:10, rot:0 });
  }
  return landed;
}

/* Put a body on the floor. Works for the player and for enemies. */
function knockDown(g, e, dir) {
  if (e.dead || e.state === 'down' || e.state === 'getup') return;
  e.state = 'down'; e.stateT = 0; e.stateDur = e.kind === 'player' ? 780 : 900;
  e.vx = (dir || e.face * -1) * 6.5; e.vy = -5.2; e.onGround = false;
  e.stun = e.stateDur + (e.kind === 'player' ? 0 : 520);
  e.downSide = dir >= 0 ? 1 : -1;
  beep('down', g.save.muted, e.kind === 'player' ? 1 : 0.6);
  if (e.kind === 'player') g.shake = Math.max(g.shake, 13);
  for (let i = 0; i < 6; i++) g.parts.push({ x:e.x, y:e.y - 6, vx:rnd(-3,3), vy:rnd(-2.4,-0.4), life:360, max:360, type:'dust', col:C.paper2, size:8, rot:0 });
}

function playerSpecial(g) {
  const p = g.player, s = g.stats, sp = s.sp;
  if (p.dead || p.stun > 0 || g.power < 1) return;
  if (p.state === 'down' || p.state === 'getup') return;
  g.power = 0;                       // drains whether or not it connects
  p.state = 'special'; p.stateT = 0; p.stateDur = sp.kind === 'rain' ? 1300 : sp.kind === 'flurry' ? 900 : 940;
  p.specTicks = 0; p.specGap = p.stateDur / (sp.pulses + 1); p.specNext = p.specGap;
  p.iframe = p.stateDur * 0.85; p.atkCd = p.stateDur + 90;
  p.vy = sp.kind === 'flurry' ? -2.2 : -5.4; p.onGround = false;
  g.shake = 14; g.flash = 0.55;
  beep('super', g.save.muted);
  pop(g, p.x, p.y - 120, sp.name, C.ink, 34);

  if (sp.kind === 'blink') {
    /* step past the furthest thing still standing */
    let far = null, fd = -1;
    for (const e of g.ents) { if (e.dead || e.spawnT > 0) continue; const d = Math.abs(e.x - p.x); if (d > fd) { fd = d; far = e; } }
    if (far) {
      const side = far.x >= p.x ? 1 : -1;
      for (let i = 0; i < 10; i++) g.parts.push({ x:p.x, y:p.y - rnd(10, 70), vx:rnd(-4,4), vy:rnd(-4,1), life:340, max:340, type:'dust', col:C.purple, size:9, rot:0 });
      p.x = clamp(far.x + 52 * side, 30, g.world.w - 30);
      p.face = -side;
    }
  }
  g.rings.push({ x:p.x, y:p.y - 46, r:14, max:sp.radius + 50, life:520, maxLife:520, col:C.ink });
  return true;
}

function resolveSpecialHit(g) {
  const p = g.player, s = g.stats, wp = s.wp, sp = s.sp;
  g.curMove = 'special';
  const dmg = wp.dmg * s.dmgMul * sp.dmg;
  const R = sp.radius;
  const n = p.specTicks;

  if (sp.kind === 'rain') {
    /* ink falls in a column; most fall where somebody is standing */
    const live = g.ents.filter(e => !e.dead && e.spawnT <= 0);
    const aim = live.length && Math.random() < 0.62 ? pick(live) : null;
    const cx = aim ? aim.x + rnd(-40, 40) : p.x + rnd(-R, R);
    for (let i = 0; i < 5; i++) g.parts.push({ x:cx + rnd(-24,24), y:p.y - 200 + i * 20, vx:rnd(-1,1), vy:rnd(6,11), life:340, max:340, type:'dust', col:C.ink, size:10, rot:0 });
    g.rings.push({ x:cx, y:GROUND - 10, r:8, max:82, life:320, maxLife:320, col:C.ink });
    for (const e of g.ents) {
      if (e.dead || e.spawnT > 0) continue;
      if (Math.abs(e.x - cx) >= 80) continue;
      e.iframe = 0;                       // a downpour does not wait its turn
      hurt(g, e, dmg, 5 * Math.sign(e.x - cx || 1) * (e.kind === 'boss' ? 0.3 : 1), cx, true);
    }
    return;
  }

  g.rings.push({ x:p.x, y:p.y - 46, r:20, max:R + 40, life:460, maxLife:460, col: n % 2 ? C.purple : C.ink });
  for (let i = 0; i < 9; i++) g.parts.push({ x:p.x, y:p.y - 46, vx:rnd(-9,9), vy:rnd(-9,4), life:420, max:420, type:'star', col:C.ink, size:12, rot:rnd(0,6) });

  if (sp.kind === 'heal' && n === 1) {
    const heal = Math.min(p.maxHp * 0.30, p.maxHp - p.hp);
    if (heal > 0.5) { p.hp += heal; pop(g, p.x, p.y - 78, '+' + Math.round(heal), C.green, 24); }
  }

  for (const e of g.ents) {
    if (e.dead || e.spawnT > 0) continue;
    const dx = e.x - p.x, dy = (e.y - e.h * 0.5) - (p.y - 46);
    if (sp.kind === 'cone' && dx * p.face < -20) continue;        // forward only
    if (dx * dx + dy * dy >= R * R) continue;
    const dir = dx === 0 ? p.face : Math.sign(dx);
    if (sp.kind === 'flurry' || sp.kind === 'cone') e.iframe = 0;   // these land faster than anyone can flinch
    hurt(g, e, dmg, wp.kb * 2.4 * dir * (e.kind === 'boss' ? 0.18 : 1), p.x, true);
  }
}

/* ---- enemy AI ---- */
function enemyAI(g, e, dt) {
  const p = g.player, d = e.def;
  const dist = p.x - e.x, ad = Math.abs(dist);

  /* An enemy on its back stays there for a moment. */
  if (e.state === 'down') {
    e.vx *= 0.90;
    if (e.stateT >= e.stateDur && e.onGround) { e.state = 'getup'; e.stateT = 0; e.stateDur = 420; }
    return;
  }
  if (e.state === 'getup') {
    e.vx *= 0.84;
    if (e.stateT >= e.stateDur) { e.state = 'idle'; e.stateT = 0; e.stun = 0; }
    return;
  }

  /* They won't hit a man who is down. They back off and wait. */
  if (p.state === 'down' || p.state === 'getup') {
    e.face = dist > 0 ? 1 : -1;
    const room = d.ranged ? 300 : 190;
    if (ad < room) { e.vx += -Math.sign(dist || 1) * d.spd * 0.34; e.state = 'run'; }
    else { e.vx *= 0.84; e.state = 'idle'; }
    e.vx = clamp(e.vx, -d.spd * 1.6, d.spd * 1.6);
    e.atkCd = Math.max(e.atkCd, 260);
    return;
  }
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
  /* even the bosses wait for you to stand up */
  if ((g.player.state === 'down' || g.player.state === 'getup') && !b.move) {
    b.moveCd = Math.max(b.moveCd, 300);
  }
  const p = g.player, d = b.def;
  if (b.settle > 0) b.settle -= dt;
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
    if (b.moveT >= b.moveDur) {
      /* after a blink it has to stop and re-form, and for a moment it is solid */
      if (b.move === 'blink') b.settle = 1500;
      b.move = null; b.moveCd = rnd(340, 760) * (1 - ph * 0.12);
    }
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
  /* Hit stop: on a solid connection everything holds for a few frames.
     The cheapest thing there is for making a blow feel like it landed. */
  if (g.freeze > 0) {
    g.freeze -= dt;
    g.shake *= Math.pow(0.94, dt / 16.667);
    /* The clock pauses with everything else. Hit stop is presentation, not
       play, and it is identical for everyone \u2014 charging it to the run
       would mean the leaderboard quietly punished you for landing hits. */
    g.tick += dt;
    return;
  }
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
  if (g.parryT > 0) g.parryT -= dt;
  if (g.bannerT > 0) g.bannerT -= dt;
  if (g.quipT > 0) g.quipT -= dt;

  const p = g.player, s = g.stats;
  const active = g.phase === 'fight' && g.intro <= 0;

  /* ---------- player ---------- */
  if (!p.dead) {
    p.stateT += dt;
    ['iframe','hurtT','atkCd','stun','dashCd'].forEach(key => { if (p[key] > 0) p[key] -= dt; });
    if (p.dashes < s.dashes && p.dashCd <= 0) { p.dashes = Math.min(s.dashes, p.dashes + 1); p.dashCd = 1400; }

    if (p.chainT > 0) { p.chainT -= dt; if (p.chainT <= 0) p.chain = 0; }
    const attacking = ATTACK_STATES.includes(p.state);
    const floored = p.state === 'down' || p.state === 'getup';
    const ACRO = p.state === 'cartwheel' || p.state === 'backflip' || p.state === 'vault' || p.state === 'wallkick';
    const CANCELABLE = p.state === 'cartwheel' || p.state === 'vault';
    const busy = attacking || p.state === 'hurt' || p.state === 'special' || p.state === 'land' || floored
      || (ACRO && !CANCELABLE);
    const mvDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    /* Attacks come out of a guard and out of a dash as well as from
       standing, which is what makes the crouching and dashing moves
       reachable at all. */
    if (active && !busy && p.stun <= 0) {
      if (inp.special && g.power >= 1) playerSpecial(g);
      else if (inp.atk) playerAttack(g, false, mvDir !== 0);
      else if (inp.heavy) playerAttack(g, true, mvDir !== 0);
    }

    const stillBusy = ATTACK_STATES.includes(p.state) || p.state === 'dash' || p.state === 'hurt'
      || p.state === 'special' || p.state === 'down' || p.state === 'getup' || p.state === 'land' || ACRO;
    if (active && !stillBusy && p.stun <= 0) {
      const mv = mvDir;
      if (inp.block && p.onGround) {
        p.state = 'block'; p.blockT += dt; p.vx *= 0.6;
      } else {
        p.blockT = 0;
        if (mv !== 0) { p.vx += mv * s.spd * 0.42; p.face = mv; p.state = p.onGround ? 'run' : 'jump'; }
        else { p.vx *= 0.74; p.state = p.onGround ? 'idle' : 'jump'; }
        p.vx = clamp(p.vx, -s.spd, s.spd);
        if (inp.up && p.onGround) {
          /* If there is somebody right in front of you, the jump becomes a
             handspring over their head instead of a hop on the spot. */
          let over = null;
          if (mv === p.face) {
            for (const e of g.ents) {
              if (e.dead || e.spawnT > 0 || e.kind === 'boss') continue;
              const d = (e.x - p.x) * p.face;
              if (d > 10 && d < 56) { over = e; break; }
            }
          }
          if (over) {
            p.state = 'vault'; p.stateT = 0; p.stateDur = 640;
            p.vy = -14.2; p.vx = p.face * 12.5; p.onGround = false;
            p.iframe = 420; p.jumps = 1; p.vaultX = over.x;
            g.shake = Math.max(g.shake, 4);
            for (let i = 0; i < 6; i++) g.parts.push({ x:p.x, y:p.y - 6, vx:rnd(-3,3), vy:rnd(-2,-0.4), life:280, max:280, type:'dust', col:C.paper2, size:8, rot:0 });
          } else { p.vy = -15.4; p.onGround = false; p.state = 'jump'; }
          beep('jump', g.save.muted);
        }
        if (inp.dash && p.dashes > 0 && p.dashCd < 1200) {
          p.dashes--; p.dashCd = 1400;
          /* Which way you are leaning decides what comes out. Pushing away
             from where you are facing is a backflip; anything else is a
             roundoff that carries you through whatever is in front. */
          const away = mv === 0;
          if (away && p.onGround) {
            p.state = 'backflip'; p.stateT = 0; p.stateDur = 620;
            p.vx = -p.face * 11; p.vy = -11.5; p.onGround = false;
            p.iframe = 560; p.jumps = 1;
          } else {
            p.state = 'cartwheel'; p.stateT = 0; p.stateDur = 460;
            p.vx = p.face * 16; p.iframe = 430;
            if (p.onGround) { p.vy = -7.6; p.onGround = false; p.jumps = 1; }
          }
          beep('dash', g.save.muted);
          for (let i = 0; i < 8; i++) g.parts.push({ x:p.x, y:p.y - 30 - i * 5, vx:-p.face * rnd(1,4), vy:rnd(-2,1), life:280, max:280, type:'dust', col:C.paper2, size:8, rot:0 });
        }
      }
    } else if (p.state === 'block' && (!inp.block || !active)) { p.state = 'idle'; p.blockT = 0; }

    /* ---------- attacks ---------- */
    if (ATTACK_STATES.includes(p.state)) {
      const mv = p.state, M = MOVES[mv];

      if (mv === 'divekick') {
        /* The leg stays out for the whole descent. He only pulls it in when
           the page is close, and lands standing. */
        const floorY = groundAt(g, p.x);
        const plat = platformUnder(g, p, p.y);
        const land = plat ? plat.y : (floorY == null ? GROUND + 400 : floorY);
        resolveHit(g, mv, false);
        p.vx = p.face * 11.5 * (1 - clamp(p.stateT / 1600, 0, 0.45));
        const nearly = (land - p.y) < 62 || p.onGround;
        if (nearly || p.stateT >= p.stateDur) {
          p.state = 'land'; p.stateT = 0; p.stateDur = 190; p.atkCd = 190;
          g.shake = Math.max(g.shake, 6); beep('land', g.save.muted, 0.5);
          for (let i = 0; i < 6; i++) g.parts.push({ x:p.x, y:land, vx:-p.face * rnd(1,3.4), vy:rnd(-2,-0.2), life:300, max:300, type:'dust', col:C.paper2, size:8, rot:0 });
        }
      } else if (mv === 'stomp') {
        if (p.stateT > 130) p.vy = Math.max(p.vy, 15);          // hang, then drop hard
        resolveHit(g, mv, false);
        if (p.onGround || p.stateT >= p.stateDur) {
          p.state = 'land'; p.stateT = 0; p.stateDur = 240; p.atkCd = 240;
          g.shake = Math.max(g.shake, 13);
          g.rings.push({ x:p.x, y:p.y - 6, r:10, max:130, life:360, maxLife:360, col:C.graphite });
          for (const e of g.ents) {
            if (e.dead || Math.abs(e.x - p.x) > 120 || !e.onGround) continue;
            hurt(g, e, s.wp.dmg * s.dmgMul * 0.9, 9 * Math.sign(e.x - p.x || 1), p.x, true);
            if (!e.dead && e.kind !== 'boss') knockDown(g, e, Math.sign(e.x - p.x || 1));
          }
          for (let i = 0; i < 10; i++) g.parts.push({ x:p.x, y:p.y - 4, vx:rnd(-6,6), vy:rnd(-4,-0.5), life:380, max:380, type:'dust', col:C.paper2, size:9, rot:0 });
        }
      } else {
        if (!p.hitDone && p.stateT >= p.stateDur * M.hit) { p.hitDone = 1; resolveHit(g, mv, false); }
        if (M.second && p.hitDone === 1 && p.stateT >= p.stateDur * M.second) { p.hitDone = 2; resolveHit(g, mv, true); }
        if (s.wp.id === 'nibs' && !M.second && p.hitDone === 1 && p.stateT >= p.stateDur * 0.78) { p.hitDone = 2; resolveHit(g, mv, true); }
        if (p.stateT >= p.stateDur) { p.state = 'idle'; p.stateT = 0; }
        if (mv === 'slide') p.vx *= Math.pow(0.94, k);
        else if (mv !== 'spin' && mv !== 'upper' && mv !== 'charge') p.vx *= 0.88;
      }
    }
    if (p.state === 'land' && p.stateT >= p.stateDur) { p.state = 'idle'; p.stateT = 0; }

    /* ---------- acrobatics ---------- */
    if (p.state === 'cartwheel' || p.state === 'backflip' || p.state === 'vault') {
      if (p.state === 'cartwheel') p.vx *= Math.pow(0.965, k);
      if (p.stateT >= p.stateDur || (p.onGround && p.stateT > p.stateDur * 0.55)) {
        p.state = 'land'; p.stateT = 0; p.stateDur = 150;
        p.vaultX = null;
        if (p.onGround) for (let i = 0; i < 5; i++) g.parts.push({ x:p.x, y:p.y, vx:rnd(-2.6,2.6), vy:rnd(-1.8,-0.2), life:260, max:260, type:'dust', col:C.paper2, size:7, rot:0 });
      }
    }
    /* A shut gate is a wall, and a wall is something to kick off. */
    if (!p.onGround && inp.up && !p.wallUsed && p.state !== 'special') {
      const gx = activeGate(g);
      if (gx != null && gx - p.x < 34 && p.vy > -4) {
        p.wallUsed = 1;
        p.state = 'wallkick'; p.stateT = 0; p.stateDur = 520;
        p.vy = -14.6; p.vx = -9.5; p.face = -1; p.iframe = 260;
        beep('jump', g.save.muted); g.shake = Math.max(g.shake, 5);
        for (let i = 0; i < 7; i++) g.parts.push({ x:gx - 6, y:p.y - 40 + rnd(-16,16), vx:rnd(-4,-1), vy:rnd(-2,2), life:300, max:300, type:'dust', col:C.paper2, size:8, rot:0 });
      }
    }
    if (p.onGround) p.wallUsed = 0;
    if (p.state === 'wallkick' && (p.stateT >= p.stateDur || p.onGround)) { p.state = p.onGround ? 'land' : 'jump'; p.stateT = 0; p.stateDur = 150; }

    /* ---------- flat on your back ---------- */
    if (p.state === 'down') {
      p.vx *= Math.pow(0.90, k);
      if (p.stateT >= p.stateDur && p.onGround) {
        p.state = 'getup'; p.stateT = 0; p.stateDur = 520;
        p.iframe = Math.max(p.iframe, 640);        // nobody gets a free hit on the way up
        p.vx = 0;
      }
    } else if (p.state === 'getup') {
      p.vx *= Math.pow(0.82, k);
      if (p.stateT >= p.stateDur) { p.state = 'idle'; p.stateT = 0; p.stun = 0; }
    }
    if (p.state === 'special') {
      g.specialActive = true;
      while (p.specTicks < s.sp.pulses && p.stateT >= p.specNext) { p.specTicks++; p.specNext += p.specGap; resolveSpecialHit(g); }
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
  const gate = activeGate(g);
  for (const e of bodies) {
    if (e.spawnT > 0) { e.spawnT -= dt; continue; }
    const prevY = e.y;
    e.vy += GRAV * k * ((e.dead && e.launched && !e.slam) ? 0.26 : 1);
    e.x += e.vx * k; e.y += e.vy * k;

    const floor = groundAt(g, e.x);
    const plat = platformUnder(g, e, prevY);
    const land = plat ? plat.y : floor;

    if (land != null && e.y >= land) {
      if (!e.onGround && e.vy > 8) for (let i = 0; i < 4; i++) g.parts.push({ x:e.x, y:land, vx:rnd(-2,2), vy:rnd(-2,-0.4), life:260, max:260, type:'dust', col:C.paper2, size:7, rot:0 });
      e.y = land; e.vy = 0; e.onGround = true;
      if (e === p && floor != null && !plat) g.safeX = e.x;   // remember dry land
    } else e.onGround = false;
    if (e.onGround) e.vx *= Math.pow(0.86, k);

    /* fell in a pit */
    if (e.y > GROUND + 190) {
      if (e === p) {
        g.falls++;
        p.y = GROUND - 40; p.x = clamp(g.safeX, 40, g.world.w - 40); p.vx = 0; p.vy = 0;
        p.iframe = 900; p.state = 'hurt'; p.stateT = 0; p.stateDur = 300;
        const dmg = Math.round(p.maxHp * 0.16);
        p.hp -= dmg; g.hitsTaken++; g.combo = 0; g.flash = 1;
        pop(g, p.x, p.y - 90, 'OFF THE PAGE', C.red, 26);
        pop(g, p.x, p.y - 62, '-' + dmg, C.red, 22);
        beep('hurt', g.save.muted); g.shake = 10;
        if (p.hp <= 0) { p.hp = 0; p.dead = true; p.deadT = 800; }
      } else if (!e.dead) { e.dead = true; e.deadT = 200; g.killed++; }
    }

    const left = e === p ? 26 : 20;
    e.x = clamp(e.x, left, g.world.w - 26);
    if (e === p) {
      if (gate != null && e.x > gate) { e.x = gate; if (e.vx > 0) e.vx = 0; }
    } else if (gate != null && !(e.dead && e.launched)) {
      /* A shut gate is a fight box, and it holds the enemies as well as the
         player. Without this, ranged types back away to keep their distance,
         end up on the far side of the gate, and the fight can never be
         finished because nobody can reach anybody. */
      const boxL = Math.max(18, gate - 820), boxR = gate - 24;
      if (e.x < boxL) { e.x = boxL; if (e.vx < 0) e.vx = 0; }
      if (e.x > boxR) { e.x = boxR; if (e.vx > 0) e.vx = 0; }
    }
  }

  /* ---------- camera ---------- */
  {
    const want = clamp(p.x - W * 0.42, 0, Math.max(0, g.world.w - W));
    g.cam += (want - g.cam) * (1 - Math.pow(0.86, k));
    g.reached = Math.max(g.reached, p.x);
  }

  /* ---------- inkwells ---------- */
  for (const wl of g.world.wells) {
    if (wl.used || p.dead) continue;
    if (Math.abs(p.x - wl.x) < 34 && Math.abs(p.y - GROUND) < 90) {
      const heal = Math.min(p.maxHp * 0.45, p.maxHp - p.hp);
      wl.used = true;
      if (heal > 0.5) {
        p.hp += heal;
        pop(g, p.x, p.y - 96, '+' + Math.round(heal), C.green, 28);
        beep('coin', g.save.muted);
        for (let i = 0; i < 10; i++) g.parts.push({ x:wl.x, y:GROUND - 16, vx:rnd(-3,3), vy:rnd(-6,-1), life:520, max:520, type:'star', col:C.green, size:9, rot:0 });
      } else pop(g, p.x, p.y - 96, 'FULL', C.green, 20);
    }
  }

  /* ---------- encounters and the boss ---------- */
  if (active && g.phase === 'fight') {
    for (const enc of g.world.encs) {
      if (!enc.fired && p.x > enc.x - 470) fireEncounter(g, enc);
      if (enc.fired && !enc.cleared) {
        const alive = g.ents.some(e => enc.ids.includes(e.id) && !e.dead);
        if (!alive) { enc.cleared = true; g.banner = 'PATH CLEAR'; g.bannerT = 900; beep('coin', g.save.muted); }
      }
    }
    if (g.world.bossX != null && !g.bossFired && p.x > g.world.bossX) fireBoss(g);
  }

  /* ---------- enemies ---------- */
  for (const e of g.ents) {
    if (e.spawnT > 0) {
      /* You are usually still running forward while it materialises, so
         hold the gap open right up until the moment it can be touched. */
      if (e.minGap) {
        const gap = e.x - p.x;
        if (Math.abs(gap) < SPAWN_GAP) {
          const dir = gap === 0 ? 1 : Math.sign(gap);
          const hi = g.world.w - 40;
          const want = p.x + SPAWN_GAP * dir;
          e.x = solidNear(g, want, 40, hi);
          const gateX = activeGate(g);
          if (gateX != null && e.x > gateX - 30) e.x = solidNear(g, gateX - 30, 40, hi);
          e.y = groundAt(g, e.x) ?? e.y;
          e.vx = 0; e.vy = 0;
          e.face = e.x > p.x ? -1 : 1;
        }
      }
      continue;
    }
    if (e.minGap) e.minGap = 0;
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
  /* ---------- bodies in flight ---------- */
  for (const e of g.ents) {
    if (!e.dead || !e.launched) continue;
    e.spin = (e.spin || 0) + (e.spinV || 0) * k;

    /* the wall is simply the edge of what you can see */
    const L = g.cam + 30, R = g.cam + W - 30;
    if (!e.slam && (e.x <= L || e.x >= R)) {
      e.slam = 1;
      e.x = clamp(e.x, L, R);
      e.vx = -e.vx * 0.30; e.vy = Math.min(e.vy, -5.2);
      e.spinV = -(e.spinV || 0) * 0.55;
      g.shake = Math.max(g.shake, 14);
      burst(g, e.x, e.y - e.h * 0.5, 12, e.col || C.graphite, true);
      pop(g, e.x, e.y - e.h * 0.9, pick(WALLPOPS), C.graphite, 32);
      beep('wall', g.save.muted, 1);
      for (let i = 0; i < 7; i++) {
        g.parts.push({ x: e.x, y: e.y - e.h * rnd(0.2, 0.9), vx: -Math.sign(e.vx || 1) * rnd(1, 5), vy: rnd(-4, 2), life: 420, max: 420, type: 'dust', col: C.paper2, size: 9, rot: 0 });
      }
    }

    /* down. now it just lies there and flickers out. */
    if (e.onGround) {
      if (!e.landed) {
        e.landed = 1;
        e.deadT = Math.min(e.deadT, 980);
        burst(g, e.x, e.y - 8, 6, e.col || C.graphite);
        g.shake = Math.max(g.shake, 6);
      }
      e.spinV = (e.spinV || 0) * Math.pow(0.74, k);
      const flat = 1.5708 * (e.spin >= 0 ? 1 : -1);
      e.spin += (flat - e.spin) * (1 - Math.pow(0.80, k));
      e.vx *= Math.pow(0.80, k);
    }
    if (e.deadT <= 150 && !e.gone) { e.gone = 1; poof(g, e.x, e.y - e.h * 0.35, e.col || C.graphite); }
    if (e.y > GROUND + 200) e.deadT = 0;      // fell off the page, just go
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

  /* ---------- win ---------- */
  if (g.phase === 'fight' && active) {
    const bossDown = g.world.bossX == null || (g.bossFired && g.boss && g.boss.dead);
    const reachedEnd = p.x >= g.world.exit;
    if (bossDown && (g.world.bossX != null ? reachedEnd || (g.boss && g.boss.dead) : reachedEnd)) {
      g.phase = 'won'; g.endT = 0; beep('win', g.save.muted);
      g.banner = 'LEVEL CLEAR'; g.bannerT = 2400;
    }
  }
  if (g.phase !== 'fight') g.endT += dt;
}

/* ---- reward maths (the loop that keeps you coming back) ---- */
/* What a level is worth at each finishing tier, as a multiple of its base.
   You are paid for the tier you reach, minus whatever that level has
   already paid you \u2014 so a second run only pays for the improvement. */
const TIER_VALUE = { clear: 0.45, bronze: 1.00, silver: 1.55, gold: 2.30 };
const TIER_RANK = { clear: 0, bronze: 1, silver: 2, gold: 3 };
const tierPay = (lv, tier) => Math.round(lv.ink * TIER_VALUE[tier]);
/* Once a level has nothing left to give, it still pays a trickle:
   a quarter of what the lowest tier was originally worth. */
const residualPay = (lv) => Math.max(1, Math.round(lv.ink * TIER_VALUE.clear * 0.25));

function computeReward(lv, ms, stats, hitsTaken, maxCombo, bestTier) {
  const tier = medalFor(lv, ms);
  const had = bestTier ? tierPay(lv, bestTier) : 0;
  const now = tierPay(lv, tier);
  const parts = [];
  let base, improved = now > had;

  if (improved) {
    base = now - had;
    parts.push([bestTier ? `${bestTier.toUpperCase()} \u2192 ${tier.toUpperCase()}` : `${tier.toUpperCase()} on your first clear`, base]);
  } else {
    /* nothing new to pay for */
    base = residualPay(lv);
    parts.push([bestTier ? `Already ${bestTier} here` : 'Repeat run', base]);
  }

  if (improved) {
    if (hitsTaken === 0) { parts.push(['Untouched \u00D71.35', Math.round(base * 0.35)]); base *= 1.35; }
    const cb = 1 + Math.min(maxCombo, 25) * 0.012;
    if (maxCombo >= 5) { parts.push([`Best combo ${maxCombo}`, Math.round(base * (cb - 1))]); base *= cb; }
  }
  if (stats.inkMul > 1.001) { parts.push([`Fortune \u00D7${stats.inkMul.toFixed(2)}`, Math.round(base * (stats.inkMul - 1))]); base *= stats.inkMul; }

  return { total: Math.max(1, Math.round(base)), parts, tier, improved, had, now };
}
const medalFor = (lv, ms) => ms <= lv.gold * 1000 ? 'gold' : ms <= lv.gold * 1400 ? 'silver' : ms <= lv.gold * 2000 ? 'bronze' : 'clear';

/* ---- scene render ---- */
/* Ground, pits, stepping stones, gates and the exit — all in world space,
   clipped to whatever the camera can actually see. */
function drawTerrain(ctx, g, t) {
  const dark = g.lv.ch === 6;
  const x0 = g.cam - 40, x1 = g.cam + W + 40;
  const edge = dark ? '#6A6355' : C.graphite;

  ctx.save();
  ctx.lineWidth = 3; ctx.strokeStyle = edge;
  for (const [a, b] of g.world.segs) {
    if (b < x0 || a > x1) continue;
    const s0 = Math.max(a, x0), s1 = Math.min(b, x1);
    jline(ctx, s0, GROUND, s1, GROUND, 4242 + ((a | 0) % 97), 1.8);
    ctx.globalAlpha = 0.25; ctx.lineWidth = 1.5;
    for (let x = s0 + 10; x < s1; x += 26) jline(ctx, x, GROUND + 3, x - 9, GROUND + 13, x, 1.6);
    ctx.globalAlpha = 1; ctx.lineWidth = 3;
    // torn paper edge either side of a pit
    if (a > 0) jline(ctx, a, GROUND, a - 4, GROUND + 40, a * 3, 2.6);
    if (b < g.world.w) jline(ctx, b, GROUND, b + 4, GROUND + 40, b * 3, 2.6);
  }
  ctx.restore();

  // pits: a dark bite out of the page
  ctx.save();
  for (const [a, b] of g.world.pits) {
    if (b < x0 || a > x1) continue;
    ctx.fillStyle = dark ? 'rgba(0,0,0,0.62)' : 'rgba(34,32,28,0.30)';
    ctx.beginPath();
    ctx.moveTo(a, GROUND);
    for (let x = a; x <= b; x += 14) ctx.lineTo(x, GROUND + 10 + Math.sin((x + a) * 0.35) * 4);
    ctx.lineTo(b, H + 60); ctx.lineTo(a, H + 60); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = C.red; ctx.lineWidth = 2;
    jline(ctx, a + 6, GROUND + 22, b - 6, GROUND + 22, a, 2.4);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // platforms
  ctx.save();
  ctx.strokeStyle = edge; ctx.lineWidth = 3;
  for (const p of g.world.plats) {
    if (p.x + p.w < x0 || p.x > x1) continue;
    jrect(ctx, p.x, p.y, p.w, 12, (p.x | 0), 1.3, dark ? 'rgba(107,78,155,0.22)' : 'rgba(221,210,182,0.75)');
    ctx.globalAlpha = 0.35; ctx.lineWidth = 1.4;
    for (let x = p.x + 8; x < p.x + p.w; x += 18) jline(ctx, x, p.y + 12, x - 6, p.y + 22, x, 1.4);
    ctx.globalAlpha = 1; ctx.lineWidth = 3;
  }
  ctx.restore();

  // gate: a wall of live scribble you cannot pass until the fight is done
  const gate = activeGate(g);
  if (gate != null && gate > x0 && gate < x1) {
    ctx.save();
    ctx.strokeStyle = C.red; ctx.globalAlpha = 0.72; ctx.lineWidth = 2.6;
    for (let i = 0; i < 7; i++) {
      const y = GROUND - 8 - i * 30, wob = Math.sin(t / 160 + i) * 7;
      jline(ctx, gate + wob, y, gate - wob, y - 30, i * 13 + (t / 240 | 0), 3.4);
    }
    ctx.globalAlpha = 0.30; ctx.lineWidth = 8;
    jline(ctx, gate, GROUND, gate, GROUND - 220, 55, 2);
    ctx.restore();
  }

  // inkwells
  for (const wl of g.world.wells) {
    if (wl.x < x0 || wl.x > x1) continue;
    ctx.save();
    const bob = Math.sin(t / 300 + wl.x) * 3;
    if (wl.used) {
      ctx.globalAlpha = 0.30; ctx.strokeStyle = edge; ctx.lineWidth = 2.4;
      jrect(ctx, wl.x - 15, GROUND - 26, 30, 26, 81, 1.4, 'transparent');
    } else {
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      jrect(ctx, wl.x - 16, GROUND - 28 + bob, 32, 28, 81, 1.3, 'rgba(94,140,97,0.28)');
      jline(ctx, wl.x - 20, GROUND - 28 + bob, wl.x + 20, GROUND - 28 + bob, 82, 1.6);
      ctx.globalAlpha = 0.75;
      jcirc(ctx, wl.x, GROUND - 46 + bob, 6 + Math.sin(t / 200) * 1.5, 83, 2.2);
      ctx.globalAlpha = 1;
      ctx.font = `900 11px ${FONT_DISP}`; ctx.fillStyle = C.green; ctx.textAlign = 'center';
      ctx.fillText('INKWELL', wl.x, GROUND - 60 + bob);
    }
    ctx.restore();
  }

  // exit marker
  const ex = g.world.exit;
  if (ex > x0 && ex < x1) {
    ctx.save();
    ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.globalAlpha = 0.85;
    jline(ctx, ex, GROUND, ex, GROUND - 150, 71, 2);
    for (let i = 0; i < 3; i++) {
      const ax = ex + 14 + i * 22, bob = Math.sin(t / 220 + i) * 4;
      jline(ctx, ax, GROUND - 74 + bob, ax + 18, GROUND - 74 + bob, 72 + i, 1.6);
      jline(ctx, ax + 10, GROUND - 84 + bob, ax + 18, GROUND - 74 + bob, 73 + i, 1.6);
      jline(ctx, ax + 10, GROUND - 64 + bob, ax + 18, GROUND - 74 + bob, 74 + i, 1.6);
    }
    ctx.font = `900 15px ${FONT_DISP}`; ctx.fillStyle = C.green; ctx.textAlign = 'left';
    ctx.fillText('EDGE OF THE PAGE', ex + 12, GROUND - 118);
    ctx.restore();
  }
}

function drawScene(ctx, g, save) {
  const t = g.tick;
  if (g.tick % 100 < 17) BOIL = (BOIL + 1) % 3;
  ctx.save();
  const sh = g.shake;
  if (sh > 0.3) ctx.translate(rnd(-sh, sh), rnd(-sh, sh));
  drawArena(ctx, g.lv.ch, t, g.lv.ch === 6, g.cam);

  ctx.save();
  ctx.translate(-Math.round(g.cam), 0);   // everything below is in world space
  drawTerrain(ctx, g, t);

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
    if (e.dead) {
      if (e.launched) {
        ctx.globalAlpha = e.landed ? (Math.floor(e.deadT / 95) % 2 ? 1 : 0.16) : 1;
      } else ctx.globalAlpha = clamp(e.deadT / 520, 0, 1) * 0.7;
    }
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

  ctx.restore();   // back to screen space

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

const Shards = ({ n, size = 15 }) => (
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

  /* Reaching a fight is always the result of a tap, which is the gesture
     browsers require before they will make a sound. */
  useEffect(() => {
    const lv = LEVELS.find(l => l.id === levelId);
    if (save.music !== false) musicStart(lv ? lv.ch : 1, false, true);
    return () => musicStop();
  }, [levelId]);
  const [hud, setHud] = useState({ hp: 1, maxHp: 1, t: 0, combo: 0, dashes: 0, boss: null, left: 0, power: 0, prog: 0, gated: false, falls: 0 });
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

    /* The canvas element is replaced whenever the layout switches between the
       desktop and touch trees, or when the device rotates out of the "turn
       your phone" screen. React does not re-run this effect for that, so the
       context is re-acquired whenever the element underneath us changes.
       Caching it once meant drawing into a detached canvas forever. */
    let ctx = null, canvasEl = null;
    const ensureCtx = () => {
      const c = cvs.current;
      if (!c) { ctx = null; canvasEl = null; return null; }
      if (c !== canvasEl) {
        canvasEl = c;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = W * dpr; c.height = H * dpr;
        ctx = c.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return ctx;
    };

    let raf = 0, last = performance.now(), hudT = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, now - last); last = now;
      const g = gRef.current; if (!g) return;
      if (!pausedRef.current) {
        step(g, dt, inp.current);
        inp.current.up = false; inp.current.dash = false; inp.current.special = false;
      }
      const cx = ensureCtx();
      if (cx) drawScene(cx, g, save);
      hudT += dt;
      if (hudT > 70) {
        hudT = 0;
        /* the score follows the fight: chapter theme until the boss lands */
        if (save.music !== false) {
          const inBoss = !!(g.boss && !g.boss.dead) && g.phase === 'fight';
          musicMood(g.lv.ch, inBoss, true);
        }
        setHud({
          hp: g.player.hp, maxHp: g.player.maxHp, t: g.elapsed, combo: g.combo, dashes: g.player.dashes, power: g.power,
          boss: g.boss && !g.boss.dead ? { name: g.boss.name, f: g.boss.hp / g.boss.maxHp, ph: g.boss.phase } : null,
          left: g.ents.filter(e => !e.dead).length, phase: g.phase,
          prog: clamp(g.player.x / g.world.exit, 0, 1), gated: activeGate(g) != null, falls: g.falls,
        });
      }
      if (g.phase !== 'fight' && g.endT > 1400 && !doneRef.current) {
        doneRef.current = true;
        musicStop();
        endRef.current(g.phase === 'won', { ms: g.elapsed, hits: g.hitsTaken, combo: g.maxCombo });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [levelId]);

  const hpPct = clamp(hud.hp / hud.maxHp, 0, 1);
  const stats = statsOf(save);
  const hasWeapon = true;   // the power meter now belongs to the special, not the weapon
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
              {stats.sp.name + ' READY'}
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
          <div style={{ width: 'min(40vw, 230px)', marginTop: 2 }}>
            <div style={{ fontFamily: FONT_DATA, fontSize: 10.5, color: '#7A7466', letterSpacing: '0.08em' }}>
              {hud.gated ? 'BLOCKED \u2014 CLEAR THEM OUT' : 'DISTANCE'}
            </div>
            <div style={{ height: 10, background: 'rgba(34,32,28,0.14)', border: `2px solid ${C.graphite}`, borderRadius: 3, overflow: 'hidden', marginTop: 3, position: 'relative' }}>
              <div style={{ width: `${(hud.prog || 0) * 100}%`, height: '100%', background: hud.gated ? C.red : C.blueDk, transition: 'width .2s linear' }} />
            </div>
            {hud.left > 0 && (
              <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 17, color: C.graphite, textShadow: `0 0 4px ${C.paper}` }}>{`${hud.left} LEFT`}</div>
            )}
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
              <canvas ref={cvs} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: C.paper }} />
            </div>
            {hudOverlay}
            <button onClick={() => setPaused(p => !p)} onContextMenu={e => e.preventDefault()}
              style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 44, height: 30, borderRadius: 6,
                border: `2px solid ${C.graphite}`, background: 'rgba(232,223,200,0.7)', color: C.graphite, fontFamily: FONT_DISP, fontWeight: 900, fontSize: 12, zIndex: 10 }}>
              {paused ? '\u25B6' : 'II'}
            </button>
            <Stick inp={inp} />
            <ActionPad inp={inp} powerFull={powerFull} wpName={stats.sp.name} />
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
function Node({ lv, save, onPick }) {
  const cleared = !!save.cleared[lv.id];
  const unlocked = lv.id <= save.level;
  const best = save.best[lv.id];
  const medal = cleared && best ? medalFor(lv, best) : null;
  const isBoss = lv.kind === 'boss';
  const current = lv.id === save.level && !cleared;
  const col = !unlocked ? '#B5AE9D' : isBoss ? C.red : C.graphite;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 128 }}>
      <div className={current ? 'ib-pulse' : undefined}
        onClick={unlocked ? () => onPick(lv) : undefined}
        role={unlocked ? 'button' : undefined} tabIndex={unlocked ? 0 : -1}
        onKeyDown={e => { if (unlocked && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(lv); } }}
        style={{
          width: isBoss ? 74 : 58, height: isBoss ? 74 : 58,
          transform: isBoss ? 'rotate(45deg)' : 'none',
          border: `3px solid ${col}`, background: cleared ? (medal ? MEDAL[medal] : C.paper2) : unlocked ? C.paper : 'transparent',
          borderRadius: isBoss ? 8 : '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.45,
          boxShadow: current ? `0 0 0 5px rgba(242,201,76,0.45)` : 'none',
        }}>
        <span style={{ transform: isBoss ? 'rotate(-45deg)' : 'none', fontFamily: FONT_DISP, fontWeight: 900, fontSize: isBoss ? 22 : 20, color: col }}>
          {unlocked ? lv.id : '\u2715'}
        </span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_DISP, fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: unlocked ? C.graphite : '#B5AE9D' }}>
          {unlocked ? lv.name : '\u2014\u2014\u2014'}
        </div>
        <div style={{ fontFamily: FONT_DATA, fontSize: 10.5, color: '#8A8270' }}>
          {cleared ? fmt(best) : unlocked ? `par ${fmt(lv.gold * 1000)}` : 'locked'}
        </div>
      </div>
    </div>
  );
}

const TRAIL_W = 360;          // the strip the path is laid out inside
const STOP_GAP = 118;         // vertical distance between stops

/* Where each level sits. The path snakes so consecutive stops are never
   in a straight line, which is what makes it read as a journey. */
function trailPoints(levels) {
  const pts = [];
  const inset = 58;
  levels.forEach((lv, i) => {
    /* a slow S down the page: the stops swing left and right so no three
       in a row line up, which is what makes it read as a route */
    const swing = 0.5 + 0.46 * Math.sin(i * 0.92 + 0.6);
    const wob = Math.sin(i * 2.7) * 9;
    pts.push({
      lv,
      x: inset + swing * (TRAIL_W - inset * 2) + wob,
      y: 62 + i * STOP_GAP,
    });
  });
  return pts;
}

/* A smooth path through the stops, so the dots follow a curve not a zigzag. */
function trailPath(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
  }
  return d;
}

/* The scenery either side of the path. Deterministic from the index so it
   does not reshuffle every render. */
function Scenery({ n, h }) {
  const bits = [];
  for (let i = 0; i < n; i++) {
    const r = (k) => {
      const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const left = r(1) < 0.5;
    const x = left ? 4 + r(2) * 44 : TRAIL_W - 52 + r(2) * 44;
    const y = 40 + (i / n) * (h - 80) + r(3) * 40;
    const kind = Math.floor(r(4) * 4);
    const s = 0.75 + r(5) * 0.75;
    const col = ['#4E7C51', '#69976C', '#8FB47F', '#C2A24E', '#B05A8A', '#7BA47E'][Math.floor(r(6) * 6)];
    bits.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.8">
        {kind === 0 && (<>
          <path d="M0 0 L0 -14" stroke="#6B5A3A" strokeWidth="3" />
          <circle cx="0" cy="-22" r="12" fill={col} />
          <circle cx="-7" cy="-16" r="8" fill={col} opacity="0.85" />
          <circle cx="8" cy="-17" r="7" fill={col} opacity="0.9" />
        </>)}
        {kind === 1 && (<>
          <ellipse cx="0" cy="0" rx="18" ry="6" fill={col} opacity="0.55" />
          <path d="M-8 0 q 3 -12 8 -14 q 5 2 8 14" fill="none" stroke={col} strokeWidth="2.5" />
        </>)}
        {kind === 2 && (<>
          <path d="M-10 0 L0 -18 L10 0 Z" fill={col} />
          <path d="M-6 0 L0 -11 L6 0 Z" fill="#EDE4CE" opacity="0.5" />
        </>)}
        {kind === 3 && (<>
          <circle cx="0" cy="-4" r="5" fill="#F2C94C" opacity="0.9" />
          <circle cx="0" cy="-4" r="2" fill="#C4452F" />
          <path d="M0 1 L0 8" stroke="#5E8C61" strokeWidth="2" />
        </>)}
      </g>
    );
  }
  return <g>{bits}</g>;
}

/* The little figure standing on the trail, in whatever you have on. */
function TrailWalker({ x, y, face = 1, phase = 0, look }) {
  const c = look.line || C.graphite;
  const w = Math.sin(phase) * 0.9;
  const bob = Math.abs(Math.cos(phase)) * 1.6;
  return (
    <g transform={`translate(${x} ${y - bob}) scale(${face} 1)`}>
      {look.back === 'cape' && <path d="M0 -22 q -11 6 -8 18 l 12 -4 z" fill={look.accent || c} opacity="0.75" />}
      {look.back === 'wings' && (<>
        <path d="M-2 -22 q -14 -3 -17 9 q 9 3 16 -3 z" fill={look.accent || c} opacity="0.6" />
        <path d="M2 -22 q 14 -3 17 9 q -9 3 -16 -3 z" fill={look.accent || c} opacity="0.6" />
      </>)}
      <g stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round">
        <circle cx="0" cy="-27" r="4.6" />
        <path d="M0 -22 L0 -10" />
        <path d={`M0 -19 L ${-6 - w * 4} ${-12 + w * 2}`} />
        <path d={`M0 -19 L ${6 - w * 4} ${-12 - w * 2}`} />
        <path d={`M0 -10 L ${-5 - w * 5} 0`} />
        <path d={`M0 -10 L ${5 - w * 5} 0`} />
      </g>
      {look.head === 'cap' && <path d="M-5 -30 q 5 -4 10 0 l 4 1 l -14 1 z" fill={look.accent || c} />}
      {look.head === 'crown' && <path d="M-5 -31 l 2 -5 l 3 3 l 3 -4 l 2 6 z" fill={C.ink} stroke={C.ink} strokeWidth="1" />}
      {look.head === 'band' && <path d="M-5 -29 L5 -29" stroke={look.accent || C.red} strokeWidth="2.4" />}
      {look.wp && look.wp.shape !== 'none' && (
        <path d={`M${6 - w * 4} ${-12 - w * 2} l 7 -9`} stroke={look.accent || c} strokeWidth="2.6" strokeLinecap="round" />
      )}
    </g>
  );
}

function TrailStop({ p, save, onPick }) {
  const lv = p.lv;
  const cleared = !!save.cleared[lv.id];
  const unlocked = lv.id <= save.level;
  const best = save.best[lv.id];
  const medal = cleared && best ? medalFor(lv, best) : null;
  const boss = lv.kind === 'boss';
  const current = lv.id === save.level && !cleared;
  const R = boss ? 34 : 26;
  const ring = !unlocked ? '#B5AE9D' : boss ? C.red : CHAPTERS[lv.ch - 1].color;
  const fill = !unlocked ? '#D8D2C2' : medal ? MEDAL[medal] : cleared ? C.paper2 : C.paper;

  return (
    <g transform={`translate(${p.x} ${p.y})`}
      onClick={unlocked ? () => onPick(lv) : undefined}
      style={{ cursor: unlocked ? 'pointer' : 'not-allowed' }}>
      <ellipse cx="0" cy={R * 0.72} rx={R * 0.86} ry={R * 0.26} fill="rgba(34,32,28,0.18)" />
      {current && <circle r={R + 9} fill="none" stroke={C.ink} strokeWidth="4" opacity="0.55" className="ib-pulse" />}
      <circle r={R + 4} fill="#FFFDF6" opacity={unlocked ? 0.9 : 0.5} />
      <circle r={R} fill={fill} stroke={ring} strokeWidth={boss ? 4.5 : 3.5} />
      {boss && [0, 1, 2, 3, 4].map(i => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={Math.cos(a) * (R + 9)} cy={Math.sin(a) * (R + 9)} r="3.2" fill={C.red} opacity="0.8" />;
      })}
      <text textAnchor="middle" dy={boss ? 9 : 7}
        style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: boss ? 25 : 21, fill: unlocked ? ring : '#8A8270' }}>
        {unlocked ? lv.id : '\u2715'}
      </text>
      {medal && <circle cx={R * 0.72} cy={-R * 0.72} r="7" fill={MEDAL[medal]} stroke={C.graphite} strokeWidth="1.6" />}
      <rect x={-((unlocked ? lv.name : '\u2014\u2014\u2014').length * 3.6 + 8)} y={R + 8}
        width={(unlocked ? lv.name : '\u2014\u2014\u2014').length * 7.2 + 16} height="16" rx="8"
        fill="#FFFDF6" opacity="0.85" />
      <text textAnchor="middle" dy={R + 20}
        style={{ fontFamily: FONT_DISP, fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', fill: unlocked ? '#4A463E' : '#A9A292' }}>
        {(unlocked ? lv.name : '\u2014\u2014\u2014').toUpperCase()}
      </text>
    </g>
  );
}

function MapScreen({ save, board, onPick, onShop, onBoard, onSettings, walk, onWalkDone }) {
  const stats = statsOf(save);
  const reached = save.level;
  const look = useMemo(() => lookOf(save), [save.skin, save.head, save.back, save.weapon]);

  /* After a win the figure walks the gap from the level you just finished
     to the next stop, wearing whatever you have on. */
  const [walker, setWalker] = useState(null);
  useEffect(() => {
    if (!walk) { setWalker(null); return; }
    const from = LEVELS.find(l => l.id === walk.from);
    const to = LEVELS.find(l => l.id === walk.to);
    if (!from || !to || from.ch !== to.ch) { if (onWalkDone) onWalkDone(); return; }
    const pts = trailPoints(chapterLevels(from.ch));
    const a2 = pts.find(q => q.lv.id === from.id), b2 = pts.find(q => q.lv.id === to.id);
    if (!a2 || !b2) { if (onWalkDone) onWalkDone(); return; }
    let raf = 0, t0 = 0;
    const DUR = 1500;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const u = clamp((ts - t0) / DUR, 0, 1);
      const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;   // ease in and out
      setWalker({
        ch: from.ch,
        x: a2.x + (b2.x - a2.x) * e,
        y: a2.y + (b2.y - a2.y) * e - Math.sin(e * 3.14159) * 6,
        face: b2.x >= a2.x ? 1 : -1,
        phase: (ts - t0) / 90,
      });
      if (u < 1) raf = requestAnimationFrame(tick);
      else { setWalker(null); if (onWalkDone) onWalkDone(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [walk && walk.from, walk && walk.to]);
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
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '8px 16px 60px' }}>
      {/* status strip */}
      <Rough style={{ marginBottom: 18, background: 'rgba(255,255,255,0.35)' }} pad="14px 18px">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Label>Playing as</Label>
            <Head size={26}>{save.name}</Head>
            <div style={{ fontFamily: FONT_DATA, fontSize: 11, color: '#8A8270', marginTop: 2 }}>
              {`${stats.wp.name.toUpperCase()} \u00B7 ${Object.values(save.ups).reduce((a, b) => a + b, 0)} UPGRADES \u00B7 ${Object.keys(save.cleared).length}/${LEVELS.length} CLEARED`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Label>Shards</Label>
            <Shards n={save.ink} size={28} />
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

      {/* the trail itself, chapter by chapter */}
      {CHAPTERS.map(ch => {
        const lvs = chapterLevels(ch.id);
        const open = lvs.some(l => l.id <= reached);
        const done = lvs.every(l => save.cleared[l.id]);
        const pts = trailPoints(lvs);
        const H = pts[pts.length - 1].y + 76;
        return (
          <div key={ch.id} className="ib-rise" style={{ marginBottom: 10, opacity: open ? 1 : 0.55 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              background: open ? ch.color : '#C8C1B0', border: `3px solid ${C.graphite}`,
              padding: '8px 14px', marginBottom: -8, position: 'relative', zIndex: 2,
              boxShadow: '3px 3px 0 rgba(34,32,28,0.2)',
            }}>
              <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>{ch.id}</div>
              <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 21, letterSpacing: '0.08em', color: C.paper }}>
                {open ? ch.name : 'SEALED'}
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: FONT_DATA, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                {done ? 'CHAPTER CLEARED' : `${lvs.filter(l => save.cleared[l.id]).length}/${lvs.length}`}
              </div>
            </div>

            <div style={{ overflow: 'hidden', border: `3px solid ${C.graphite}`, background: '#E9F0DC' }}>
              <svg viewBox={`0 0 ${TRAIL_W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
                <defs>
                  <linearGradient id={`grass${ch.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DCE9C8" />
                    <stop offset="100%" stopColor="#C3DCA8" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width={TRAIL_W} height={H} fill={`url(#grass${ch.id})`} />
                <Scenery n={Math.round(H / 26)} h={H} />
                {/* the path: a wide pale band with dashes down the middle */}
                <path d={trailPath(pts)} fill="none" stroke="#FFFDF6" strokeWidth="26" strokeLinecap="round" opacity="0.92" />
                <path d={trailPath(pts)} fill="none" stroke={ch.color} strokeWidth="26" strokeLinecap="round" opacity="0.16" />
                <path d={trailPath(pts)} fill="none" stroke={C.graphite} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray="2 13" opacity="0.45" />
                {pts.map(p => <TrailStop key={p.lv.id} p={p} save={save} onPick={onPick} />)}
                {walker && walker.ch === ch.id && (
                  <TrailWalker x={walker.x} y={walker.y} face={walker.face} phase={walker.phase} look={look} />
                )}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   COMIC CUTSCENES
   ------------------------------------------------------------
   Story beats are drawn as comic pages. A scene is a short spec:
   a background, a list of figures placed in a 200x120 frame, and
   optional effects. The paragraphs of the story become the caption
   boxes, one per panel.
   ============================================================ */

function CFig({ kind, x, y, s = 1, col = C.graphite, flip = false, pose = 'stand' }) {
  const T = `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`;
  const P = { stroke: col, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

  if (kind === 'hero' || kind === 'copy') {
    const arms = {
      stand: 'M0 -30 L -11 -18 M0 -30 L 11 -18',
      run: 'M0 -30 L -14 -35 M0 -30 L 13 -21',
      swing: 'M0 -30 L 18 -42 M0 -30 L -9 -19',
      up: 'M0 -30 L -11 -48 M0 -30 L 13 -48',
      guard: 'M0 -30 L -9 -40 M0 -30 L 9 -40',
      fallen: 'M0 -8 L -14 -2 M0 -8 L 12 -14',
      look: 'M0 -30 L -12 -20 M0 -30 L 10 -40',
    }[pose] || 'M0 -30 L -11 -18 M0 -30 L 11 -18';
    const legs = {
      run: 'M0 -14 L -13 2 M0 -14 L 12 -1',
      up: 'M0 -14 L -10 -2 M0 -14 L 11 -4',
      fallen: 'M0 -8 L 16 2 M0 -8 L 13 -6',
      swing: 'M0 -14 L -11 2 M0 -14 L 11 1',
    }[pose] || 'M0 -14 L -8 2 M0 -14 L 8 2';
    if (pose === 'fallen') {
      return (
        <g transform={T} {...P}>
          <circle cx="-16" cy="-8" r="6.5" />
          <path d="M-10 -8 L 0 -8" /><path d={arms} /><path d={legs} />
        </g>
      );
    }
    return (
      <g transform={T} {...P}>
        <circle cx="0" cy="-42" r="6.5" />
        <path d="M0 -35 L 0 -14" /><path d={arms} /><path d={legs} />
        {kind === 'copy' && <path d="M-7 -46 L 7 -46" strokeWidth="3" />}
      </g>
    );
  }

  if (kind === 'scribble') {
    return (
      <g transform={T} {...P} strokeWidth="3">
        <path d="M-22 0 q -10 -26 8 -34 q 22 -10 30 10 q 8 22 -8 24 q -18 2 -30 0" />
        <path d="M-14 -12 q 12 -14 24 -2 q 8 8 -4 12" strokeWidth="2" opacity="0.7" />
        <circle cx="-6" cy="-20" r="2.6" fill={col} stroke="none" />
        <circle cx="8" cy="-22" r="2.6" fill={col} stroke="none" />
      </g>
    );
  }
  if (kind === 'smudge') {
    return (
      <g transform={T}>
        <ellipse cx="0" cy="-18" rx="30" ry="20" fill={col} opacity="0.28" />
        <ellipse cx="-8" cy="-12" rx="20" ry="13" fill={col} opacity="0.24" />
        <circle cx="-8" cy="-22" r="2.8" fill={col} />
        <circle cx="8" cy="-24" r="2.8" fill={col} />
      </g>
    );
  }
  if (kind === 'ruler') {
    return (
      <g transform={T} {...P} strokeWidth="3">
        <rect x="-8" y="-56" width="16" height="56" />
        {[-48, -38, -28, -18, -8].map(ty => <path key={ty} d={`M-8 ${ty} L -1 ${ty}`} strokeWidth="1.7" />)}
        <circle cx="-3" cy="-50" r="2" fill={col} stroke="none" />
        <circle cx="3" cy="-50" r="2" fill={col} stroke="none" />
      </g>
    );
  }
  if (kind === 'chroma') {
    return (
      <g transform={T}>
        {[['#B05A8A', -12, -30, 17], ['#F2C94C', 10, -26, 14], ['#4A7C93', 0, -14, 12]].map(([c, cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={c} opacity="0.5" />
        ))}
        <circle cx="-6" cy="-30" r="2.6" fill={C.graphite} />
        <circle cx="7" cy="-28" r="2.6" fill={C.graphite} />
      </g>
    );
  }
  if (kind === 'architect') {
    return (
      <g transform={T} {...P} stroke={C.purple} strokeWidth="3">
        <circle cx="0" cy="-46" r="7" />
        <path d="M0 -39 L 0 -14 M0 -32 L -14 -22 M0 -32 L 16 -40 M0 -14 L -9 2 M0 -14 L 9 2" />
        <path d="M16 -40 L 30 -50" stroke={C.ink} strokeWidth="3.4" />
      </g>
    );
  }
  if (kind === 'nib') {   // the pen, coming down out of the sky
    return (
      <g transform={T}>
        <path d="M0 -120 L 14 -18 L 0 22 L -14 -18 Z" fill="none" stroke={col} strokeWidth="3" />
        <path d="M-5 -18 L 5 -18" stroke={col} strokeWidth="2.4" />
        <path d="M0 -6 L 0 14" stroke={col} strokeWidth="2" />
      </g>
    );
  }
  if (kind === 'hand') {
    /* A hand seen from the side, gripping a pen: cuff, wrist, knuckles,
       four curled fingers stacked back to front, thumb across the barrel. */
    const skin = spec2 => ({ stroke: col, strokeWidth: spec2 || 2.2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' });
    return (
      <g transform={T}>
        {/* sleeve and cuff */}
        <path d="M-64 -34 L -34 -46 L -26 -20 L -58 -8 Z" {...skin(2.4)} />
        <path d="M-34 -46 L -26 -20" {...skin(2.4)} />
        <path d="M-31 -44 L -23 -18" {...skin(1.3)} />
        {/* back of the hand */}
        <path d="M-30 -44 q 20 -8 34 -2 q 12 5 14 16 l 3 20 q 1 13 -12 17 l -26 8 q -13 4 -18 -7 l -9 -22 q -4 -11 6 -18 z" {...skin(2.6)} />
        {/* knuckle line */}
        <path d="M-4 -44 q 12 6 15 18" {...skin(1.4)} />
        {/* fingers, curled around the barrel — back to front */}
        <path d="M18 -26 q 13 3 14 13 q 1 10 -10 12 q -10 2 -13 -5" {...skin(2.2)} />
        <path d="M20 -13 q 14 2 15 13 q 1 11 -11 12 q -11 1 -14 -6" {...skin(2.4)} />
        <path d="M19 1 q 14 2 14 12 q 0 11 -12 12 q -11 0 -14 -6" {...skin(2.4)} />
        <path d="M15 15 q 12 2 12 11 q 0 10 -11 10 q -10 0 -12 -6" {...skin(2.2)} />
        {/* thumb, laid over the front */}
        <path d="M-16 -12 q 16 -4 26 4 q 9 7 6 16" {...skin(2.6)} />
        {/* the pen itself, held in the grip */}
        <g transform="rotate(24 26 6)">
          <path d="M22 -44 L 34 -44 L 34 30 L 28 46 L 22 30 Z" {...skin(2.4)} />
          <path d="M22 22 L 34 22" {...skin(1.6)} />
          <path d="M28 30 L 28 44" {...skin(1.4)} />
          <path d="M22 -34 L 34 -34" {...skin(1.4)} />
        </g>
      </g>
    );
  }
  if (kind === 'lamp') {
    /* An anglepoise: weighted base, two jointed arms with their tension
       springs, and a conical shade throwing light down onto the page. */
    const L = w => ({ stroke: col, strokeWidth: w, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' });
    return (
      <g transform={T}>
        {/* the light it casts */}
        <path d="M46 -30 L 88 26 L -6 26 Z" fill={C.ink} opacity="0.16" stroke="none" />
        {/* base */}
        <ellipse cx="0" cy="-2" rx="26" ry="6" {...L(2.8)} />
        <path d="M-26 -2 q 0 -9 26 -9 q 26 0 26 9" {...L(2.8)} />
        <path d="M-13 -9 L 13 -9" {...L(1.2)} />
        {/* lower arm + its spring */}
        <path d="M0 -11 L -14 -60" {...L(3)} />
        <path d="M-2 -18 L -12 -55" {...L(1.1)} />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={`M${-1 - i * 2.1} ${-20 - i * 6.2} l 7 -3`} {...L(1.1)} />
        ))}
        {/* elbow joint */}
        <circle cx="-14" cy="-60" r="4.6" {...L(2.4)} />
        {/* upper arm + spring */}
        <path d="M-14 -60 L 34 -76" {...L(3)} />
        <path d="M-9 -55 L 30 -68" {...L(1.1)} />
        {[0, 1, 2, 3, 4].map(i => (
          <path key={'b' + i} d={`M${-6 + i * 8} ${-59 - i * 2.6} l 3 6`} {...L(1.1)} />
        ))}
        {/* shade joint and cone */}
        <circle cx="34" cy="-76" r="4.2" {...L(2.4)} />
        <path d="M30 -80 L 60 -66 L 46 -30 L 22 -50 Z" {...L(3)} />
        <path d="M22 -50 L 46 -30" {...L(1.6)} />
        {/* bulb */}
        <circle cx="36" cy="-46" r="5" {...L(1.6)} />
        {[0, 1, 2].map(i => (
          <path key={'r' + i} d={`M${30 + i * 8} -34 l ${-3 + i * 3} 12`} {...L(1.2)} opacity="0.6" />
        ))}
      </g>
    );
  }
  if (kind === 'crumple') {
    return (
      <g transform={T} {...P} strokeWidth="2.2">
        <circle cx="0" cy="-12" r="14" />
        <path d="M-9 -16 l 10 6 M-4 -4 l 9 -8 M2 -20 l 7 5" strokeWidth="1.6" opacity="0.7" />
      </g>
    );
  }
  if (kind === 'drawer') {
    return (
      <g transform={T} {...P} strokeWidth="3">
        <rect x="-34" y="-38" width="68" height="38" />
        <path d="M-34 -20 L 34 -20" />
        <circle cx="0" cy="-10" r="3.4" />
      </g>
    );
  }
  if (kind === 'eraser') {
    return (
      <g transform={T} {...P} strokeWidth="3">
        <path d="M-22 0 L -10 -26 L 24 -26 L 12 0 Z" />
        <path d="M-10 -26 L 24 -26" />
      </g>
    );
  }
  return null;
}

/* deterministic wobble, so the drawing does not reshuffle every render */
const pk = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };

/* A block of parallel strokes at an angle, clipped to a shape.
   `d` is how tight the strokes are; smaller means darker. */
function Hatch({ id, x, y, w, h, ang = -38, d = 5, op = 0.5, wob = 1.2, weight = 0.9, seed = 0, lit = null }) {
  const rad = (ang * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  const span = Math.abs(w * dy) + Math.abs(h * dx);
  const L = Math.hypot(w, h);
  const strokes = [];
  const n = Math.ceil(span / d);
  for (let i = 0; i <= n; i++) {
    const off = -span / 2 + i * d;
    const cx = x + w / 2 - dy * off, cy = y + h / 2 + dx * off;
    /* Each line is broken into short marks with gaps between them, so the
       fill reads as strokes laid down by hand. Where the lamp reaches, the
       marks are simply left out \u2014 light is paper, not white paint. */
    let t = -L * 0.5;
    let g = 0;
    while (t < L * 0.5 && g < 16) {
      g++;
      const len = 12 + pk(seed + i, g) * 26;
      const gap = 2 + pk(seed + i, g + 50) * 7;
      const t2 = Math.min(L * 0.5, t + len);
      const mx = cx + dx * (t + t2) / 2, my = cy + dy * (t + t2) / 2;
      let keep = true;
      if (lit) {
        const q = Math.hypot((mx - lit.x) / lit.rx, (my - lit.y) / lit.ry);
        const shade = clamp((q - 0.28) / 0.72, 0, 1);      // 0 in the middle of the pool
        if (pk(seed + i, g + 300) > shade * shade) keep = false;
      }
      if (keep) {
        const j = (pk(seed + i, g + 90) - 0.5) * wob * 2.4;
        const wt = weight * (0.45 + pk(seed + i, g + 20) * 0.75);
        strokes.push(
          <line key={i + '-' + g}
            x1={cx + dx * t + j} y1={cy + dy * t + j}
            x2={cx + dx * t2 - j * 0.5} y2={cy + dy * t2 - j * 0.5}
            strokeWidth={wt} strokeLinecap="round" />
        );
      }
      t = t2 + gap;
    }
  }
  return <g clipPath={`url(#${id})`} stroke="#1E1C1A" opacity={op}>{strokes}</g>;
}

/* A pencil contour: a line drawn twice, slightly off, the way a hand does it. */
function Edge({ d, w = 1.4, op = 0.85, seed = 0 }) {
  return (
    <g stroke="#232120" fill="none" strokeLinecap="round" opacity={op}>
      <path d={d} strokeWidth={w} />
      <path d={d} strokeWidth={w * 0.6} opacity="0.5"
        transform={`translate(${(pk(seed, 3) - 0.5) * 1.6} ${(pk(seed, 7) - 0.5) * 1.6})`} />
    </g>
  );
}

function CDesk({ spec }) {
  const K = spec.id || 'd';
  const u = (n) => `${K}-${n}`;
  const lampOn = spec.lamp !== false;
  const close = !!spec.close;
  const vb = close ? '70 96 260 150' : '0 0 400 240';

  /* wall panel grid, as in the room: big plates with seams between them */
  const cols = [0, 96, 190, 284, 400];
  const rows = [0, 84, 168, 240];

  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', width: '100%', height: '100%', background: '#EFEBE0' }}>
      <defs>
        {/* the lit part of the wall — everything outside this gets hatched down */}
        <radialGradient id={u('glow')} cx="60%" cy="44%" r="40%">
          <stop offset="0%" stopColor="#000" stopOpacity="1" />
          <stop offset="46%" stopColor="#000" stopOpacity="0.80" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* the wall gets shaded everywhere except where the lamp reaches */}
        <mask id={u('dark')}>
          <rect x="0" y="0" width="400" height="240" fill="#fff" />
          <ellipse cx="252" cy="104" rx="132" ry="86" fill={`url(#${u('glow')})`} />
        </mask>
        {/* and the desktop is brightest of all, under the shade */}
        <radialGradient id={u('glow2')} cx="52%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#000" stopOpacity="1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <mask id={u('deskLit')}>
          <rect x="100" y="168" width="220" height="72" fill="#fff" />
          <ellipse cx="216" cy="192" rx="96" ry="30" fill={`url(#${u('glow2')})`} />
        </mask>
        <clipPath id={u('wall')}><rect x="0" y="0" width="400" height="196" /></clipPath>
        <clipPath id={u('floor')}><rect x="0" y="196" width="400" height="44" /></clipPath>
        <clipPath id={u('top')}><path d="M118 196 L296 196 L302 206 L112 206 Z" /></clipPath>
        <clipPath id={u('front')}><rect x="112" y="206" width="190" height="26" /></clipPath>
        <clipPath id={u('shade')}><path d="M330 30 Q352 20 374 30 L386 60 Q358 74 336 60 Z" /></clipPath>
        <clipPath id={u('under')}><rect x="112" y="230" width="190" height="12" /></clipPath>
      </defs>

      {/* ---------- paper ---------- */}
      <rect x="-20" y="-20" width="440" height="280" fill="#EFEBE0" />
      {/* tooth of the paper */}
      <g stroke="#B9B2A1" opacity="0.18">
        {[...Array(90)].map((_, i) => (
          <line key={i} x1={pk(i, 1) * 400} y1={pk(i, 2) * 240}
            x2={pk(i, 1) * 400 + 2} y2={pk(i, 2) * 240 + 1.4} strokeWidth="0.5" />
        ))}
      </g>

      {/* ---------- the wall, hatched down into the dark ---------- */}
      {(() => {
        const lit = lampOn ? { x: 288, y: 108, rx: 132, ry: 92 } : null;
        return (<>
          <Hatch id={u('wall')} x={0} y={0} w={400} h={196} ang={-42} d={2.6} op={0.55} weight={1.1} seed={1} lit={lit} />
          <Hatch id={u('wall')} x={0} y={0} w={400} h={196} ang={36} d={3.2} op={0.45} weight={1.0} seed={2} lit={lit} />
          <Hatch id={u('wall')} x={0} y={0} w={400} h={196} ang={-76} d={4.4} op={0.34} seed={3} lit={lit} />
          <Hatch id={u('wall')} x={0} y={0} w={400} h={196} ang={8} d={5.5} op={0.26} seed={7} lit={lit} />
          {/* the far corners go almost black */}
          <Hatch id={u('wall')} x={0} y={0} w={96} h={196} ang={-42} d={2.1} op={0.55} weight={1.2} seed={4} />
          <Hatch id={u('wall')} x={0} y={0} w={62} h={196} ang={46} d={2.3} op={0.5} weight={1.1} seed={5} />
          <Hatch id={u('wall')} x={0} y={0} w={400} h={30} ang={-42} d={2.4} op={0.48} weight={1.1} seed={6} lit={lit && { ...lit, ry: 44 }} />
          <Hatch id={u('wall')} x={0} y={168} w={400} h={28} ang={-42} d={2.8} op={0.4} seed={8} lit={lit && { ...lit, y: 150 }} />
        </>);
      })()}
      {/* panel seams */}
      {cols.slice(1, -1).map((cx, i) => (
        <Edge key={'c' + i} d={`M${cx} 0 L${cx + (pk(i, 9) - 0.5) * 3} 196`} w={1.5} op={0.5} seed={10 + i} />
      ))}
      {rows.slice(1, -1).map((ry, i) => (
        <Edge key={'r' + i} d={`M0 ${ry} L400 ${ry + (pk(i, 11) - 0.5) * 3}`} w={1.5} op={0.5} seed={20 + i} />
      ))}
      {/* a few stains and bolt marks, as in the room */}
      {[[58, 132], [176, 118], [212, 92], [330, 150], [86, 62]].map(([sx, sy], i) => (
        <g key={i} opacity="0.4">
          <circle cx={sx} cy={sy} r={2 + pk(i, 13) * 2} fill="#2A2724" opacity="0.5" />
          <path d={`M${sx} ${sy} q ${2 + pk(i, 15) * 3} ${5 + pk(i, 17) * 8} ${-1} ${11 + pk(i, 19) * 9}`}
            stroke="#2A2724" strokeWidth="1.4" fill="none" opacity="0.45" />
        </g>
      ))}

      {/* ---------- the light thrown onto the wall ---------- */}
      {lampOn && (
        <g>
          {/* the edges of the beam, faint, the way you would indicate them */}
          <Edge d="M344 70 L150 200" w={0.9} op={0.3} seed={30} />
          <Edge d="M378 66 L300 200" w={0.9} op={0.24} seed={31} />
        </g>
      )}

      {/* ---------- floor ---------- */}
      <Hatch id={u('floor')} x={0} y={196} w={400} h={44} ang={-8} d={2.4} op={0.55} weight={1.1} seed={40}
        lit={lampOn ? { x: 250, y: 206, rx: 90, ry: 26 } : null} />
      <Hatch id={u('floor')} x={0} y={196} w={400} h={44} ang={-54} d={2.8} op={0.45} seed={41}
        lit={lampOn ? { x: 250, y: 206, rx: 78, ry: 22 } : null} />
      <Hatch id={u('floor')} x={0} y={196} w={130} h={44} ang={-8} d={2} op={0.5} seed={42} />
      <Hatch id={u('floor')} x={300} y={196} w={100} h={44} ang={-8} d={2} op={0.5} seed={43} />

      {/* ---------- the table ---------- */}
      {/* legs first, behind the top */}
      <Edge d="M132 206 L124 240" w={2} seed={50} />
      <Edge d="M284 206 L292 240" w={2} seed={51} />
      <Hatch id={u('under')} x={112} y={230} w={190} h={12} ang={-20} d={2.6} op={0.5} seed={52} />
      {/* top surface, catching the light */}
      <Edge d="M118 196 L296 196 L302 206 L112 206 Z" w={1.8} seed={53} />
      <Hatch id={u('top')} x={112} y={196} w={190} h={10} ang={-14} d={3.4} op={0.34} seed={54}
        lit={lampOn ? { x: 232, y: 200, rx: 118, ry: 26 } : null} />
      {/* front rail and the two open drawers */}
      <Edge d="M112 206 L302 206 L300 232 L114 232 Z" w={1.6} seed={55} />
      <Hatch id={u('front')} x={112} y={206} w={190} h={26} ang={-30} d={3} op={0.42} seed={56} />
      {[[124, 196], [212, 196]].map(([dx], i) => (
        <g key={i}>
          <Edge d={`M${dx} 210 L${dx + 78} 210 L${dx + 78} 228 L${dx} 228 Z`} w={1.5} seed={60 + i} />
          {/* the dark inside of the drawer */}
          <Hatch id={u('front')} x={dx} y={212} w={78} h={15} ang={-46} d={2.4} op={0.62} seed={62 + i} />
          {/* things lying in it */}
          {[...Array(5)].map((_, j) => (
            <line key={j} x1={dx + 8 + j * 14} y1={218 + pk(i * 5 + j, 21) * 4}
              x2={dx + 18 + j * 14} y2={218 + pk(i * 5 + j, 23) * 4}
              stroke="#EFEBE0" strokeWidth="1.6" opacity="0.75" />
          ))}
          <circle cx={dx + 39} cy={219} r="2.6" fill="none" stroke="#232120" strokeWidth="1.3" opacity="0.7" />
        </g>
      ))}

      {/* ---------- what is on the table ---------- */}
      {/* paper sorter at the left */}
      <Edge d="M136 174 L176 172 L178 196 L136 196 Z" w={1.5} seed={70} />
      <Edge d="M136 174 L176 172" w={1.2} op={0.6} seed={71} />
      <Edge d="M148 176 L168 175" w={1} op={0.5} seed={72} />
      {/* a sheet of paper, the brightest thing in the room */}
      <Edge d="M182 186 L232 184 L236 196 L180 196 Z" w={1.3} seed={73} />
      <g stroke="#4A463E" opacity="0.35">
        {[188, 191].map(yy => <line key={yy} x1="188" y1={yy} x2="228" y2={yy - 0.6} strokeWidth="0.7" />)}
      </g>
      {/* a small frame, and a scatter of odds and ends */}
      <Edge d="M244 176 L266 175 L267 194 L244 195 Z" w={1.4} seed={74} />
      <Hatch id={u('top')} x={244} y={176} w={23} h={19} ang={-52} d={2.4} op={0.55} seed={75} />
      <Edge d="M272 184 L292 183 L293 195 L272 196 Z" w={1.3} seed={76} />
      {[[206, 179], [214, 177], [222, 180]].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r="2.2" fill="none" stroke="#232120" strokeWidth="1.1" opacity="0.6" />
      ))}
      {/* what the objects cast, away from the lamp */}
      <g opacity="0.42">
        <Hatch id={u('top')} x={120} y={192} w={70} h={8} ang={-10} d={2.2} op={0.7} seed={77} />
      </g>

      {/* ---------- the lamp, reaching in from the right ---------- */}
      <g>
        {/* post and the jointed arm */}
        <Edge d="M392 240 L390 96" w={2.6} seed={80} />
        <Edge d="M390 100 L352 40" w={2.4} seed={81} />
        <Edge d="M352 40 L332 46" w={2.2} seed={82} />
        {/* springs along the arm */}
        <g stroke="#232120" strokeWidth="0.9" fill="none" opacity="0.55">
          {[...Array(9)].map((_, i) => {
            const t = i / 8, ax = 390 - t * 38, ay = 100 - t * 60;
            return <path key={i} d={`M${ax - 3} ${ay} l 6 -3`} />;
          })}
        </g>
        <circle cx="352" cy="40" r="4" fill="none" stroke="#232120" strokeWidth="1.6" />
        <circle cx="390" cy="99" r="4.4" fill="none" stroke="#232120" strokeWidth="1.6" />
        {/* the shade: a cone seen from the side, dark against the lit wall */}
        <Edge d="M330 30 Q352 20 374 30 L386 60 Q358 74 336 60 Z" w={2.1} seed={83} />
        <Hatch id={u('shade')} x={328} y={20} w={60} h={56} ang={-58} d={1.9} op={0.72} weight={1.2} seed={84} />
        <Hatch id={u('shade')} x={328} y={20} w={60} h={56} ang={30} d={2.6} op={0.5} seed={85} />
        <Edge d="M336 60 Q358 74 386 60" w={2.3} seed={86} />
        {/* the mouth of it, where the paper is left alone */}
        {lampOn && (<>
          <ellipse cx="361" cy="64" rx="24" ry="7" fill="#EFEBE0" stroke="#232120" strokeWidth="1.3" />
          <ellipse cx="361" cy="64" rx="14" ry="3.6" fill="#EFEBE0" stroke="#6E6A62" strokeWidth="0.8" />
        </>)}
      </g>

      {/* ---------- grade: darken the far edges a little more ---------- */}
      <Hatch id={u('wall')} x={330} y={0} w={70} h={196} ang={-40} d={3.6} op={0.30} seed={90} />
    </svg>
  );
}

function CScene({ spec }) {
  if (spec.photo) return <CDesk spec={spec} />;
  const bgCol = spec.dark ? '#242028' : spec.bg || C.paper;
  const line = spec.dark ? '#6A6355' : C.graphite;
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice" style={{ display: 'block', width: '100%', height: '100%', background: bgCol }}>
      {/* backdrop */}
      {spec.rules && [22, 42, 62, 82].map(y => <line key={y} x1="0" y1={y} x2="200" y2={y} stroke={line} strokeWidth="0.8" opacity="0.22" />)}
      {spec.margin && <line x1="40" y1="0" x2="40" y2="120" stroke={C.red} strokeWidth="1.6" opacity="0.5" />}
      {spec.grid && (
        <g opacity="0.3">
          {[...Array(11)].map((_, i) => <line key={'v' + i} x1={i * 20} y1="0" x2={i * 20} y2="120" stroke={C.blueDk} strokeWidth="0.7" />)}
          {[...Array(7)].map((_, i) => <line key={'h' + i} x1="0" y1={i * 20} x2="200" y2={i * 20} stroke={C.blueDk} strokeWidth="0.7" />)}
        </g>
      )}
      {spec.spot && (
        <>
          <defs>
            <radialGradient id={'sp' + spec.id} cx="50%" cy="18%" r="80%">
              <stop offset="0%" stopColor={C.ink} stopOpacity="0.42" />
              <stop offset="100%" stopColor={C.ink} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="200" height="120" fill={`url(#sp${spec.id})`} />
        </>
      )}
      {spec.blobs && [[152, 34, 20, '#B05A8A'], [176, 62, 14, C.ink], [130, 66, 12, C.blue]].map(([cx, cy, r, c], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={c} opacity="0.34" />
      ))}
      {/* horizon */}
      {spec.ground !== false && <line x1="0" y1="104" x2="200" y2="104" stroke={line} strokeWidth="2.6" />}
      {spec.pit && (
        <path d={`M${spec.pit[0]} 104 L ${spec.pit[0]} 120 L ${spec.pit[1]} 120 L ${spec.pit[1]} 104`} fill="rgba(34,32,28,0.34)" stroke="none" />
      )}
      {/* speed lines */}
      {spec.speed && [...Array(6)].map((_, i) => (
        <line key={i} x1={spec.speed[0]} y1={30 + i * 12} x2={spec.speed[0] + spec.speed[1]} y2={30 + i * 12}
          stroke={line} strokeWidth="1.4" opacity="0.35" />
      ))}
      {(spec.items || []).map((it, i) => <CFig key={i} {...it} />)}
      {/* impact starburst */}
      {spec.star && (
        <g transform={`translate(${spec.star[0]} ${spec.star[1]})`}>
          {[...Array(9)].map((_, i) => {
            const a = (i / 9) * Math.PI * 2, r1 = 9, r2 = 22;
            return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
              stroke={C.red} strokeWidth="2.4" strokeLinecap="round" />;
          })}
        </g>
      )}
    </svg>
  );
}

/* Scene specs, one list per story beat. Panels pair up with the paragraphs
   of the level's story text, in order. */
const SC = {
  pro: [
    { rules: 1, margin: 1, items: [{ kind: 'hero', x: 66, y: 104, pose: 'fallen' }] },
    { rules: 1, margin: 1, items: [{ kind: 'hero', x: 70, y: 104, pose: 'look' }], speed: [110, 40] },
    { photo: 1, id: 'p3', lamp: true },
    { dark: 1, spot: 1, id: 'p4', items: [{ kind: 'hero', x: 44, y: 104, pose: 'swing', col: '#B9B2A1' }, { kind: 'architect', x: 156, y: 104 }] },
  ],
  ch: {
    1: [{ rules: 1, margin: 1, items: [{ kind: 'scribble', x: 120, y: 96, col: '#9A9384' }, { kind: 'hero', x: 56, y: 104, pose: 'stand' }], star: [120, 70] },
        { rules: 1, margin: 1, items: [{ kind: 'hero', x: 60, y: 104, pose: 'look' }], speed: [120, 46] }],
    2: [{ items: [{ kind: 'smudge', x: 132, y: 96, col: '#8B8478' }, { kind: 'hero', x: 54, y: 104, pose: 'swing' }], star: [110, 66] },
        { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }] }],
    3: [{ grid: 1, items: [{ kind: 'ruler', x: 138, y: 100, col: C.blueDk }, { kind: 'hero', x: 56, y: 104, pose: 'stand' }] },
        { blobs: 1, items: [{ kind: 'hero', x: 50, y: 104, pose: 'run' }] }],
    4: [{ blobs: 1, items: [{ kind: 'chroma', x: 140, y: 98 }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
        { items: [{ kind: 'drawer', x: 140, y: 100 }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] }],
    5: [{ items: [{ kind: 'copy', x: 138, y: 104, col: '#7A6A55', pose: 'fallen' }, { kind: 'hero', x: 58, y: 104, pose: 'stand' }] },
        { items: [{ kind: 'crumple', x: 150, y: 100, col: '#8A8270' }, { kind: 'hero', x: 56, y: 104, pose: 'look' }] }],
    6: [{ dark: 1, spot: 1, id: 'c61', items: [{ kind: 'nib', x: 150, y: 118, col: C.purple }, { kind: 'hero', x: 52, y: 104, pose: 'stand', col: '#B9B2A1' }] },
        { photo: 1, id: 'c62', lamp: true },
        { dark: 1, id: 'c63', items: [{ kind: 'hero', x: 150, y: 104, pose: 'run', col: C.ink }], speed: [20, 60] }],
  },
  lv: {
    1: [{ rules: 1, margin: 1, items: [{ kind: 'hero', x: 62, y: 104, pose: 'fallen' }] },
        { rules: 1, margin: 1, items: [{ kind: 'hero', x: 54, y: 104, pose: 'guard' }, { kind: 'scribble', x: 142, y: 98, col: '#9A9384' }], speed: [170, -28] }],
    2: [{ rules: 1, margin: 1, ground: true, items: [{ kind: 'hero', x: 60, y: 104, pose: 'look' }], spot: 1, id: 'l2' },
        { rules: 1, margin: 1, items: [{ kind: 'hero', x: 70, y: 104, pose: 'run' }, { kind: 'scribble', x: 156, y: 98, col: '#9A9384' }] }],
    3: [{ rules: 1, margin: 1, items: [{ kind: 'scribble', x: 148, y: 98, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { rules: 1, margin: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    4: [{ rules: 1, margin: 1, items: [{ kind: 'scribble', x: 148, y: 98, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { rules: 1, margin: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [104, 138] }],
    5: [{ rules: 1, margin: 1, items: [{ kind: 'scribble', x: 148, y: 98, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] },
         { rules: 1, margin: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand' }], speed: [116, 44] }],
    6: [{ rules: 1, margin: 1, items: [{ kind: 'scribble', x: 148, y: 98, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { rules: 1, margin: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    7: [{ rules: 1, items: [{ kind: 'scribble', x: 132, y: 100, s: 1.5, col: C.graphite }, { kind: 'hero', x: 44, y: 104, pose: 'guard' }] },
        { rules: 1, items: [{ kind: 'scribble', x: 128, y: 100, s: 1.5 }, { kind: 'hero', x: 48, y: 104, pose: 'swing' }], star: [96, 72] }],
    8: [{ items: [{ kind: 'eraser', x: 140, y: 100, col: '#9A9384' }, { kind: 'hero', x: 54, y: 104, pose: 'stand' }], pit: [96, 126] },
        { items: [{ kind: 'hero', x: 64, y: 104, pose: 'up' }], pit: [96, 132] }],
    9: [{ items: [{ kind: 'hero', x: 56, y: 104, pose: 'run' }, { kind: 'crumple', x: 148, y: 100, col: '#9A9384' }] },
        { items: [{ kind: 'smudge', x: 140, y: 96, col: '#8B8478', s: 0.8 }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] }],
    10: [{ items: [{ kind: 'crumple', x: 152, y: 100, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    11: [{ items: [{ kind: 'eraser', x: 146, y: 100, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [104, 138] }],
    12: [{ items: [{ kind: 'smudge', x: 142, y: 96, col: '#8B8478', s: 0.9 }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand' }], speed: [116, 44] }],
    13: [{ items: [{ kind: 'crumple', x: 152, y: 100, col: '#9A9384' }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    14: [{ items: [{ kind: 'smudge', x: 134, y: 98, col: '#8B8478', s: 1.4 }, { kind: 'hero', x: 46, y: 104, pose: 'guard' }] },
        { items: [{ kind: 'smudge', x: 130, y: 98, col: '#8B8478', s: 1.4 }, { kind: 'hero', x: 50, y: 104, pose: 'swing' }], star: [98, 74] }],
    15: [{ grid: 1, items: [{ kind: 'hero', x: 56, y: 104, pose: 'run' }] },
        { grid: 1, items: [{ kind: 'hero', x: 60, y: 104, pose: 'up' }], pit: [104, 136] }],
    16: [{ grid: 1, items: [{ kind: 'hero', x: 54, y: 104, pose: 'guard' }, { kind: 'ruler', x: 152, y: 100, s: 0.7, col: C.blueDk }] },
        { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'swing' }], star: [110, 70] }],
    17: [{ grid: 1, items: [{ kind: 'ruler', x: 150, y: 100, s: 0.8, col: C.blueDk }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    18: [{ grid: 1, items: [{ kind: 'ruler', x: 150, y: 100, s: 0.8, col: C.blueDk }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [104, 138] }],
    19: [{ grid: 1, items: [{ kind: 'ruler', x: 150, y: 100, s: 0.8, col: C.blueDk }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] },
         { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand' }], speed: [116, 44] }],
    20: [{ grid: 1, items: [{ kind: 'ruler', x: 150, y: 100, s: 0.8, col: C.blueDk }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { grid: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    21: [{ grid: 1, items: [{ kind: 'ruler', x: 140, y: 104, s: 1.25, col: C.blueDk }, { kind: 'hero', x: 46, y: 104, pose: 'stand' }] },
        { grid: 1, items: [{ kind: 'ruler', x: 138, y: 104, s: 1.25, col: C.blueDk }, { kind: 'hero', x: 50, y: 104, pose: 'guard' }], speed: [96, 40] }],
    22: [{ blobs: 1, items: [{ kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [110, 142] }],
    23: [{ blobs: 1, items: [{ kind: 'hero', x: 54, y: 104, pose: 'guard' }, { kind: 'chroma', x: 150, y: 98, s: 0.7 }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'swing' }], star: [116, 68] }],
    24: [{ blobs: 1, items: [{ kind: 'chroma', x: 146, y: 98, s: 0.8 }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    25: [{ blobs: 1, items: [{ kind: 'chroma', x: 146, y: 98, s: 0.8 }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [104, 138] }],
    26: [{ blobs: 1, items: [{ kind: 'chroma', x: 146, y: 98, s: 0.8 }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand' }], speed: [116, 44] }],
    27: [{ blobs: 1, items: [{ kind: 'chroma', x: 146, y: 98, s: 0.8 }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { blobs: 1, items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    28: [{ blobs: 1, items: [{ kind: 'chroma', x: 140, y: 100, s: 1.4 }, { kind: 'hero', x: 48, y: 104, pose: 'stand' }] },
         { blobs: 1, items: [{ kind: 'chroma', x: 136, y: 100, s: 1.4 }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }], speed: [100, 44] }],
    29: [{ items: [{ kind: 'crumple', x: 132, y: 100, col: '#8A8270' }, { kind: 'crumple', x: 166, y: 96, col: '#8A8270', s: 0.7 }, { kind: 'hero', x: 54, y: 104, pose: 'look' }] },
         { items: [{ kind: 'copy', x: 146, y: 104, col: '#7A6A55' }, { kind: 'hero', x: 56, y: 104, pose: 'guard' }] }],
    30: [{ items: [{ kind: 'copy', x: 140, y: 104, col: '#7A6A55' }, { kind: 'copy', x: 168, y: 104, col: '#7A6A55', s: 0.85 }, { kind: 'hero', x: 50, y: 104, pose: 'guard' }] },
         { items: [{ kind: 'drawer', x: 144, y: 100 }, { kind: 'hero', x: 52, y: 104, pose: 'stand' }] }],
    31: [{ items: [{ kind: 'drawer', x: 146, y: 100 }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    32: [{ items: [{ kind: 'copy', x: 146, y: 104, col: '#7A6A55' }, { kind: 'hero', x: 52, y: 104, pose: 'look' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'run' }], pit: [104, 138] }],
    33: [{ items: [{ kind: 'crumple', x: 154, y: 100, col: '#8A8270' }, { kind: 'hero', x: 52, y: 104, pose: 'guard' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand' }], speed: [116, 44] }],
    34: [{ items: [{ kind: 'drawer', x: 146, y: 100 }, { kind: 'hero', x: 52, y: 104, pose: 'swing' }] },
         { items: [{ kind: 'hero', x: 58, y: 104, pose: 'up' }], star: [110, 72] }],
    35: [{ items: [{ kind: 'copy', x: 140, y: 104, s: 1.3, col: '#7A6A55' }, { kind: 'hero', x: 52, y: 104, pose: 'stand' }] },
         { items: [{ kind: 'copy', x: 136, y: 104, s: 1.3, col: '#7A6A55' }, { kind: 'hero', x: 56, y: 104, pose: 'swing' }], star: [102, 74] }],
    36: [{ dark: 1, spot: 1, id: 'l16', items: [{ kind: 'hero', x: 52, y: 104, pose: 'run', col: '#B9B2A1' }, { kind: 'nib', x: 164, y: 116, col: C.purple }] },
         { dark: 1, id: 'l16b', items: [{ kind: 'hero', x: 58, y: 104, pose: 'up', col: '#B9B2A1' }], pit: [104, 140] }],
    37: [{ dark: 1, margin: 1, id: 'l17', items: [{ kind: 'hero', x: 54, y: 104, pose: 'guard', col: '#B9B2A1' }] },
         { photo: 1, id: 'l41b', lamp: true, close: 1 }],
    38: [{ dark: 1, id: 'g38', items: [{ kind: 'nib', x: 162, y: 116, col: C.purple }, { kind: 'hero', x: 52, y: 104, pose: 'swing', col: '#B9B2A1' }] },
         { dark: 1, id: 'g38', items: [{ kind: 'hero', x: 58, y: 104, pose: 'up', col: '#B9B2A1' }], star: [110, 72] }],
    39: [{ dark: 1, id: 'g39', items: [{ kind: 'copy', x: 148, y: 104, col: '#5A4A6B' }, { kind: 'hero', x: 52, y: 104, pose: 'look', col: '#B9B2A1' }] },
         { dark: 1, id: 'g39', items: [{ kind: 'hero', x: 58, y: 104, pose: 'run', col: '#B9B2A1' }], pit: [104, 138] }],
    40: [{ dark: 1, id: 'g40', items: [{ kind: 'nib', x: 162, y: 116, col: C.purple }, { kind: 'hero', x: 52, y: 104, pose: 'guard', col: '#B9B2A1' }] },
         { dark: 1, id: 'g40', items: [{ kind: 'hero', x: 58, y: 104, pose: 'stand', col: '#B9B2A1' }], speed: [116, 44] }],
    41: [{ dark: 1, id: 'g41', items: [{ kind: 'copy', x: 148, y: 104, col: '#5A4A6B' }, { kind: 'hero', x: 52, y: 104, pose: 'swing', col: '#B9B2A1' }] },
         { dark: 1, id: 'g41', items: [{ kind: 'hero', x: 58, y: 104, pose: 'up', col: '#B9B2A1' }], star: [110, 72] }],
    42: [{ dark: 1, spot: 1, id: 'l42', items: [{ kind: 'architect', x: 150, y: 104 }, { kind: 'hero', x: 48, y: 104, pose: 'stand', col: '#B9B2A1' }] },
         { dark: 1, spot: 1, id: 'l42b', items: [{ kind: 'architect', x: 146, y: 104 }, { kind: 'hero', x: 52, y: 104, pose: 'swing', col: C.ink }], star: [100, 72] }],
  },
};

/* One comic panel: art on top, caption box below. */
function CutPanel({ spec, text, wide, i }) {
  const tilt = ((i * 5) % 3 - 1) * 0.4;
  return (
    <div className="ib-rise" style={{
      flex: wide ? '1 1 100%' : '1 1 300px', minWidth: 250,
      border: `3px solid ${C.graphite}`, background: C.paper,
      boxShadow: '4px 4px 0 rgba(34,32,28,0.18)', transform: `rotate(${tilt}deg)`,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      animationDelay: `${i * 90}ms`,
    }}>
      <div style={{ width: '100%', aspectRatio: wide ? '20 / 7' : '16 / 9', borderBottom: `3px solid ${C.graphite}` }}>
        <CScene spec={spec} />
      </div>
      <div style={{ padding: '9px 12px 11px', background: '#F6EFD9', flex: 1 }}>
        <Hand size={15.5} col="#3A362E" style={{ lineHeight: 1.5 }}>{text}</Hand>
      </div>
    </div>
  );
}

function StoryScreen({ title, eyebrow, body, cta, onGo, onBack, col = C.graphite, scenes }) {
  const paras = String(body).split('\n\n').map(s => s.trim()).filter(Boolean);
  const specs = scenes && scenes.length ? scenes : [{ rules: 1, margin: 1, items: [{ kind: 'hero', x: 60, y: 104 }] }];
  const panels = paras.map((text, i) => ({ text, spec: specs[Math.min(i, specs.length - 1)] }));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 16px 60px' }}>
      {/* title bar, like the top of a comic page */}
      <div style={{ border: `3px solid ${C.graphite}`, background: col, marginBottom: 14, padding: '10px 16px' }}>
        <div style={{ fontFamily: FONT_DATA, fontSize: 10.5, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.80)' }}>
          {String(eyebrow).toUpperCase()}
        </div>
        <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 34, letterSpacing: '0.08em', color: C.paper, lineHeight: 1.05 }}>
          {title}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {panels.map((p, i) => (
          <CutPanel key={i} spec={p.spec} text={p.text} i={i}
            wide={panels.length > 2 && i === panels.length - 1} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Btn big tone="go" onClick={onGo}>{cta}</Btn>
        {onBack && <Btn tone="quiet" onClick={onBack}>Back to map</Btn>}
      </div>
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
              <Label>{reward.improved ? 'Shards earned' : 'Shards earned \u00B7 nothing new to pay for'}</Label>
              <div style={{ marginTop: 8 }}>
                {reward.parts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT_DATA, fontSize: 13, color: p[1] < 0 ? '#A5493A' : '#5A554A', padding: '2px 0' }}>
                    <span>{p[0]}</span><span>{p[1] > 0 ? '+' : ''}{commas(p[1])}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${C.graphite}` }}>
                <Head size={20}>Total</Head><Shards n={reward.total} size={26} />
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
              {'You come apart into loose lines and the page forgets you for a moment.\n\nNo shards for that one. The clock stopped at ' + fmt(res.ms) + '.'}
            </Hand>
            <Hand size={15} col="#8A8270">
              {'Nothing is lost \u2014 your shards, gear and upgrades are exactly where you left them.'}
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
                <Shards n={cost} size={13} />
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
    s.ink -= cost; mutate(s); onSave(s); beep('buy', save.muted); say(`${label} \u2014 ${commas(cost)} shards spent.`);
  };
  const equip = (mutate) => { const s = JSON.parse(JSON.stringify(save)); mutate(s); onSave(s); beep('block', save.muted); };

  const TABS = [['upgrades', 'Upgrades'], ['weapons', 'Weapons'], ['specials', 'Power Moves'], ['skins', 'Line'], ['wear', 'Wearables'], ['ink', 'Shard Packs']];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '8px 16px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <Label>Spend what you earn</Label>
          <Head size={34}>The Armoury</Head>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}><Label>Shards</Label><Shards n={save.ink} size={26} /></div>
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
          <span style={{ color: '#8A6A12', fontWeight: 700 }}>{`SHARD GAIN \u00D7${stats.inkMul.toFixed(2)}`}</span>
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
                      <Shards n={cost} size={13} />
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
            desc={`${w.desc}  \u2014  DMG ${w.dmg} \u00B7 REACH ${w.range} \u00B7 SPEED \u00D7${w.speed.toFixed(2)}`}
            cost={w.cost} owned={save.ownedW.includes(w.id)} equipped={save.weapon === w.id}
            canAfford={save.ink >= w.cost}
            onBuy={() => buy(w.cost, s => { s.ownedW.push(w.id); s.weapon = w.id; }, w.name)}
            onEquip={() => equip(s => { s.weapon = w.id; })} />
        ))}

        {tab === 'specials' && (<>
          <Hand size={15} col="#6A6355" style={{ marginBottom: 2 }}>
            {'Your power meter fills as you land hits and empties the moment you fire, whether or not it connects. One power move can be equipped at a time.'}
          </Hand>
          {SPECIALS.map(sp => (
            <ItemCard key={sp.id} name={sp.name}
              desc={`${sp.desc}  \u2014  ${sp.note}`}
              cost={sp.cost} owned={save.ownedSp.includes(sp.id)} equipped={save.special === sp.id}
              canAfford={save.ink >= sp.cost}
              onBuy={() => buy(sp.cost, s2 => { s2.ownedSp.push(sp.id); s2.special = sp.id; }, sp.name)}
              onEquip={() => equip(s2 => { s2.special = sp.id; })} />
          ))}
        </>)}

        {tab === 'ink' && (<>
          <Rough pad="14px 16px" col={C.red} fill="rgba(196,69,47,0.08)">
            <Head size={17} col={C.red}>{'Not switched on'}</Head>
            <Hand size={14.5} col="#6A6355" style={{ marginTop: 5 }}>
              {'These are the planned shard packs. Nothing here takes payment and none of the buttons do anything \u2014 there is no payment processor connected to this build. They are shown so the pricing can be looked at before any of it is wired up.'}
            </Hand>
          </Rough>
          {SHARD_PACKS.map(pk => (
            <Rough key={pk.id} pad="14px 16px" col="#C8C1B0" fill="rgba(255,255,255,0.22)">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', opacity: 0.72 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Head size={17}>{pk.name}</Head>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                    <Shards n={pk.ink} size={15} />
                    {pk.bonus > 0 && <span style={{ fontFamily: FONT_DATA, fontSize: 11.5, color: C.green, fontWeight: 700 }}>{`+${pk.bonus}% BONUS`}</span>}
                  </div>
                  <Hand size={13.5} col="#8A8270" style={{ marginTop: 3 }}>{pk.note}</Hand>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONT_DATA, fontSize: 20, fontWeight: 700, color: '#8A8270' }}>{pk.price}</div>
                  <Btn tone="quiet" disabled onClick={() => {}}>Unavailable</Btn>
                </div>
              </div>
            </Rough>
          ))}
        </>)}

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
  const [sel, setSel] = useState(Math.min(save.level, LEVELS.length));
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
              <span style={{ fontFamily: FONT_DATA, fontSize: 13, color: '#8A8270' }}>{`${r.c}/${LEVELS.length}`}</span>
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
function NameScreen({ onCreate, onRestore }) {
  const [v, setV] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('new');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const clean = v.replace(/[^A-Za-z0-9 _\-'.]/g, '').slice(0, 14);
  const ok = clean.trim().length >= 2;

  const go = async () => {
    if (!ok || busy) return;
    setBusy(true); setErr('');
    const name = clean.trim();
    if (mode === 'restore') {
      const r = await onRestore(name, code.trim());
      setBusy(false);
      if (r === 'nomatch') setErr('That code does not match that name. Check both and try again.');
      else if (r === 'offline') setErr('Cannot reach the server right now.');
      return;
    }
    const r = await claimName(name);
    if (r === 'taken') { setBusy(false); setErr('Someone already has that name. Pick another, or restore it with your recovery code.'); return; }
    setBusy(false);
    onCreate(name);
  };
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
        {mode === 'restore' && (
          <input className="ib-in" value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') go(); }} placeholder="paste your recovery code"
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', fontFamily: FONT_DATA,
              fontSize: 14, color: C.graphite, marginTop: 12, letterSpacing: '0.04em',
              background: 'rgba(255,255,255,0.6)', border: `2.5px solid ${C.blueDk}`, borderRadius: 4 }} />
        )}
        {err && (
          <div style={{ marginTop: 12, padding: '9px 12px', border: `2.5px solid ${C.red}`, background: 'rgba(196,69,47,0.10)',
            fontFamily: FONT_DATA, fontSize: 12.5, color: C.red, lineHeight: 1.5 }}>{err}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, gap: 12, flexWrap: 'wrap' }}>
          <Label>{`${clean.length}/14`}</Label>
          <Btn big tone="go" disabled={!ok || busy || (mode === 'restore' && code.trim().length < 16)} onClick={go}>
            {busy ? 'Checking\u2026' : mode === 'restore' ? 'Restore my name' : 'Start drawing'}
          </Btn>
        </div>
      </Rough>
      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button onClick={() => { setMode(m => m === 'new' ? 'restore' : 'new'); setErr(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT_DATA, fontSize: 12.5,
            color: C.blueDk, textDecoration: 'underline', letterSpacing: '0.04em' }}>
          {mode === 'new' ? 'Already played on another device? Restore your name' : 'Never mind \u2014 start a new fighter'}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS
   ============================================================ */
function SettingsScreen({ save, onSave, onBack, onWipe, storageOk }) {
  const [confirm, setConfirm] = useState(false);
  const [secret, setSecret] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => { let live = true; getSecret().then(v => { if (live) setSecret(v); }); return () => { live = false; }; }, []);
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1600); }
    catch { /* clipboard blocked; the code is selectable on screen */ }
  };
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <div><Head size={18}>Music</Head><Hand size={14} col="#6A6355">{'A theme for each chapter, and a nastier one for the bosses.'}</Hand></div>
            <Btn tone={save.music === false ? 'quiet' : 'go'} onClick={() => onSave({ ...save, music: save.music === false })}>{save.music === false ? 'Off' : 'On'}</Btn>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div><Head size={18}>Sound</Head><Hand size={14} col="#6A6355">{'Impacts, jumps and the win jingle.'}</Hand></div>
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
          <Head size={18} style={{ marginTop: 16 }}>Getting through a level</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {'Each level is a strip of paper several screens long. Walk right. Where the page is torn there is a pit \u2014 jump it, or use a stepping stone. Falling costs you health and puts you back on the last solid ground you stood on. Trouble finds you along the way, and while a fight is unfinished a wall of live scribble blocks the road forward. Green inkwells on the route restore health, one drink each, and there is always one waiting outside a boss door. Reach the torn edge at the far end to clear the level \u2014 or on a boss level, put the boss down.'}
          </Hand>
          <Head size={18} style={{ marginTop: 16 }}>The power move</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {'Bare hands cannot channel it. Once you own any real weapon, every hit you land fills a gold meter under your health. When it is full a fourth button appears above the other three, and your weapon gets its own named move \u2014 a three-pulse shockwave that hits everything around you and cannot be interrupted. It empties the meter the moment you press it, whether or not anything was standing close enough to feel it.'}
          </Hand>
        </Rough>
        <Rough pad="16px 18px" fill="rgba(255,255,255,0.30)">
          <Head size={18}>Your name and recovery code</Head>
          <Hand size={14} col="#6A6355" style={{ marginTop: 6, lineHeight: 1.6 }}>
            {'There are no passwords. This device holds a secret code, and the code is what proves the records board name below belongs to you. Save it somewhere. To play the same name on another device, choose "Restore your name" on the opening screen and paste it in.'}
          </Hand>
          <div style={{ marginTop: 10, padding: '10px 12px', border: `2.5px dashed ${C.blueDk}`, background: 'rgba(255,255,255,0.45)' }}>
            <Label>Name</Label>
            <div style={{ fontFamily: FONT_DISP, fontWeight: 900, fontSize: 20, letterSpacing: '0.08em' }}>{save.name}</div>
            <Label>Recovery code</Label>
            <div style={{ fontFamily: FONT_DATA, fontSize: 12, wordBreak: 'break-all', color: '#5A554A', userSelect: 'all' }}>{secret || '\u2026'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <Btn tone="quiet" onClick={copyCode}>{copied ? 'Copied' : 'Copy code'}</Btn>
          </div>
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
                <Hand size={15} col={C.red}>{'This wipes your shards, gear and every time you have posted. Records already posted stay up.'}</Hand>
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
  const [walk, setWalk] = useState(null);
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
    const prev = save.best[lv.id];
    const isPB = prev == null || res.ms < prev;
    const stats = statsOf(save);
    /* the tier this level has already been paid for, read off its best time */
    const bestTier = (save.cleared[lv.id] && prev != null) ? medalFor(lv, prev) : null;
    const reward = computeReward(lv, res.ms, stats, res.hits, res.combo, bestTier);

    const s = JSON.parse(JSON.stringify(save));
    s.ink += reward.total; s.totalInk += reward.total;
    s.cleared[lv.id] = true;
    if (isPB) s.best[lv.id] = res.ms;
    s.runs = (s.runs || 0) + 1;
    if (lv.id === s.level && s.level < LEVELS.length) s.level = lv.id + 1;
    else if (lv.id === LEVELS.length) s.level = LEVELS.length + 1;
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
    else {
      /* walk to the next stop on the way back to the map */
      const next = LEVELS.find(l => l.id === lv.id + 1);
      setWalk(result.won && next && next.ch === lv.ch ? { from: lv.id, to: next.id } : null);
      setScreen('map');
    }
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
    return shell(<NameScreen
      onCreate={(n) => { const s = freshSave(n); persist(s); setScreen('prologue'); }}
      onRestore={async (n, code) => {
        const r = await restoreName(n, code);
        if (r !== 'ok') return r;
        const cloud = await pullSave(n);
        const s = cloud || freshSave(n);
        persist(s);
        setBoard(await loadBoard() || {});
        setScreen(cloud ? 'map' : 'prologue');
        return 'ok';
      }} />);
  }

  if (screen === 'prologue') {
    return shell(<StoryScreen eyebrow="Before all of it" scenes={SC.pro}
      title="The Margin"
      body={`Somebody drew you fast and left the page.\n\nYou are four lines and a circle, standing in the strip of blank at the edge of the paper, and you are the only thing here that decided to stand up on its own.\n\nAbove the desk there is a lamp, and a hand, and a pen. The hand has made a great many of you. It keeps the ones it likes and rubs out the rest, and it has five things drawn between you and it \u2014 five lieutenants, each one a mistake he was too proud to erase.\n\nGo and meet them, ${save.name}. Then go and meet him.`}
      cta="Step onto the page" onGo={() => setScreen('map')} />);
  }

  if (screen === 'map') {
    return shell(<MapScreen save={save} board={board} onPick={(lv) => { setSel(lv); setScreen('brief'); }}
      walk={walk} onWalkDone={() => setWalk(null)}
      onShop={() => setScreen('shop')} onBoard={() => setScreen('board')} onSettings={() => setScreen('settings')} />);
  }

  if (screen === 'brief' && sel) {
    const best = save.best[sel.id];
    const rows = board['L' + sel.id] || [];
    const top = rows[0];
    return shell(<div>
      <StoryScreen
        eyebrow={`Chapter ${sel.ch} \u00B7 ${CHAPTERS[sel.ch - 1].name} \u00B7 Level ${sel.id}`}
        title={sel.name} body={sel.story} scenes={SC.lv[sel.id]}
        col={sel.kind === 'boss' ? C.red : C.graphite}
        cta={sel.kind === 'boss' ? 'Face it' : 'Fight'}
        onGo={() => startFight(sel)} onBack={() => setScreen('map')} />
      {(() => {
        /* Once you have walked the two levels that describe it, the note
           you could have pieced together yourself is written out for you. */
        const b = sel.waves.find(w => w[0] === 'boss');
        const wk = b && BOSSES[b[1]] && BOSSES[b[1]].weak;
        const read = sel.id > 2 ? (save.cleared[sel.id - 1] && save.cleared[sel.id - 2]) : save.cleared[sel.id - 1];
        if (!wk || !read) return null;
        return (
          <div style={{ maxWidth: 700, margin: '14px auto 0', padding: '0 16px' }}>
            <Rough pad="13px 16px" col={C.ink} fill="rgba(242,201,76,0.14)">
              <Label col="#8A6A12">{'Field note \u00B7 from what you saw on the way here'}</Label>
              <Hand size={16} col="#4A463E" style={{ marginTop: 5 }}>{wk.note}</Hand>
            </Rough>
          </div>
        );
      })()}
      <div style={{ maxWidth: 700, margin: '10px auto 0', padding: '0 16px 60px', display: 'flex', gap: 26, flexWrap: 'wrap' }}>
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
      title={last ? 'The Last Page' : CHAPTERS[chEnd - 1].name} scenes={SC.ch[chEnd]}
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
