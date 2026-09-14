/* =========================================================
   Nermine El-Behery — Background Particle Scene (Three.js)
   Renders a soft particle field that morphs from a scattered
   "chaos" cloud into a blooming flower shape as the visitor
   scrolls from the Hero down to the Interviews section.
   Falls back to a plain background if the module fails to
   load (e.g. offline), since all text has its own visible
   default styling regardless of this script.
   ========================================================= */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

gsap.registerPlugin(ScrollTrigger);
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function hexToVec3(hex){ const n = parseInt(hex.slice(1),16); return new THREE.Vector3(((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255); }

/* =========================================================
   PARTICLE JOURNEY — a head (hijab silhouette, no facial detail)
   that you approach, enter, and move through, resolving into a
   blooming flower. One particle system, three target shapes,
   blended by a single uMorph value (0 = head, 1 = chaos, 2 = flower).
========================================================= */
const canvas = document.getElementById('tunnel-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf6f4f1);
scene.fog = new THREE.Fog(0xf6f4f1, 4, 30);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 400);
camera.position.set(0,0,11);

const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

/* ---------- shape A: a head + hijab + shoulders silhouette, sampled from a canvas path
   (no facial features — the outline is the only detail) ---------- */
function buildHeadPositions(count){
  const cw=420, ch=520;
  const c = document.createElement('canvas'); c.width=cw; c.height=ch;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,cw,ch);
  ctx.fillStyle = '#fff';
  const cx = cw/2;
  ctx.beginPath();
  ctx.moveTo(cx, 28);
  ctx.bezierCurveTo(cx+92, 28, cx+128, 108, cx+116, 172);
  ctx.bezierCurveTo(cx+150, 226, cx+184, 298, cx+190, 378);
  ctx.bezierCurveTo(cx+192, 428, cx+180, 468, cx+150, 494);
  ctx.lineTo(cx-150, 494);
  ctx.bezierCurveTo(cx-180, 468, cx-192, 428, cx-190, 378);
  ctx.bezierCurveTo(cx-184, 298, cx-150, 226, cx-116, 172);
  ctx.bezierCurveTo(cx-128, 108, cx-92, 28, cx, 28);
  ctx.closePath();
  ctx.fill();

  const img = ctx.getImageData(0,0,cw,ch).data;
  const pos = new Float32Array(count*3);
  const colorFactor = new Float32Array(count);
  let filled = 0, attempts = 0;
  const maxAttempts = count*300;
  while(filled < count && attempts < maxAttempts){
    attempts++;
    const px = Math.random()*cw, py = Math.random()*ch;
    const idx = ((py|0)*cw + (px|0))*4;
    if(img[idx+3] > 20){
      const nx = (px/cw - 0.5) * 5.4;
      const ny = -(py/ch - 0.5) * 6.6;
      const nz = (Math.random()*2-1) * 0.22;
      pos[filled*3]=nx; pos[filled*3+1]=ny; pos[filled*3+2]=nz;
      colorFactor[filled] = clamp(py/ch, 0, 1);
      filled++;
    }
  }
  for(let i=filled;i<count;i++){ pos[i*3]=0; pos[i*3+1]=0; pos[i*3+2]=0; colorFactor[i]=0.5; }
  return { pos, colorFactor };
}

/* ---------- shape B: scattered inner chaos (thought-space) ---------- */
function buildChaosPositions(count){
  const pos = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    let x,y,z,d2;
    do{ x=Math.random()*2-1; y=Math.random()*2-1; z=Math.random()*2-1; d2=x*x+y*y+z*z; }
    while(d2>1 || d2===0);
    pos[i*3]=x*3.2; pos[i*3+1]=y*3.7; pos[i*3+2]=z*3.2;
  }
  return pos;
}

/* ---------- shape C: a blooming flower, built from rings of petals ---------- */
function buildFlowerPositions(count){
  const pos = new Float32Array(count*3);
  const petalsPerRing = 10, rings = 4, totalSlots = petalsPerRing*rings;
  for(let i=0;i<count;i++){
    const slot = i % totalSlots;
    const ring = Math.floor(slot/petalsPerRing);
    const petal = slot % petalsPerRing;
    const angleBase = (petal/petalsPerRing)*Math.PI*2 + ring*0.3;
    const ringRadius0 = 0.35 + ring*0.55;
    const petalLen = 1.0 + ring*0.22;
    const s = Math.random();
    const widthAtS = Math.sin(s*Math.PI) * (0.32 - ring*0.025);
    const perp = (Math.random()*2-1) * widthAtS;
    const radius = ringRadius0 + s*petalLen;
    const x = Math.cos(angleBase)*radius - Math.sin(angleBase)*perp;
    const y = Math.sin(angleBase)*radius + Math.cos(angleBase)*perp;
    const z = -radius*0.07 + (Math.random()*2-1)*0.12;
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
  }
  return pos;
}

const N = 12000;
const { pos:headPos, colorFactor } = buildHeadPositions(N);
const chaosPos = buildChaosPositions(N);
const flowerPos = buildFlowerPositions(N);

const tUniforms = {
  uTime:{value:0}, uAppear:{value:0},
  uColLow:{value:hexToVec3('#e7cdea')}, uColHigh:{value:hexToVec3('#47a1a2')},
  uOpacity:{value:1.3}, uSize:{value:4.2}, uBrightness:{value:.05},
  uMorph:{value:0}, uJitter:{value:.035},
  uCursor:{value:new THREE.Vector3()}, uRepelRadius:{value:1.6}, uRepelStrength:{value:.5}, uActivity:{value:0}
};

const tVert = `
uniform float uTime; uniform float uSize; uniform float uMorph; uniform float uJitter;
uniform vec3 uColLow; uniform vec3 uColHigh;
uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
attribute vec3 positionB; attribute vec3 positionC; attribute float aColor;
varying float vFade; varying vec3 vColor;
${SNOISE}
void main() {
  float t1 = clamp(uMorph, 0.0, 1.0);
  float t2 = clamp(uMorph - 1.0, 0.0, 1.0);
  vec3 basePos = mix(mix(position, positionB, t1), positionC, t2);

  float n1 = snoise(vec3(basePos.x*0.6, basePos.y*0.6, uTime*0.15));
  float n2 = snoise(vec3(basePos.y*0.9, basePos.z*0.9, uTime*0.22+10.0));
  float n3 = snoise(vec3(basePos.z*0.7, basePos.x*0.7, uTime*0.18+20.0));
  vec3 finalPos = basePos + vec3(n1,n2,n3) * uJitter;

  vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
  vec3 toP = modelPosition.xyz - uCursor;
  float cd = length(toP);
  float fall = smoothstep(uRepelRadius, 0.0, cd);
  modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
  vec4 mvPosition = viewMatrix * modelPosition;

  vColor = mix(uColLow, uColHigh, clamp(aColor, 0.0, 1.0));
  vFade = 1.0;

  gl_PointSize = uSize * (10.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.3);
  gl_Position = projectionMatrix * mvPosition;
}`;

const tFrag = `
uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
varying float vFade; varying vec3 vColor;
void main() {
  vec2 xy = gl_PointCoord - 0.5;
  float ll = length(xy);
  if (ll > 0.5) discard;
  float a = smoothstep(0.5, 0.1, ll);
  gl_FragColor = vec4(vColor, vFade * a * uOpacity * uAppear * clamp(uBrightness * 6.0, 0.12, 0.92));
}`;

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(headPos, 3));
geo.setAttribute('positionB', new THREE.BufferAttribute(chaosPos, 3));
geo.setAttribute('positionC', new THREE.BufferAttribute(flowerPos, 3));
geo.setAttribute('aColor', new THREE.BufferAttribute(colorFactor, 1));

const tMat = new THREE.ShaderMaterial({
  uniforms:tUniforms, vertexShader:tVert, fragmentShader:tFrag,
  transparent:true, depthWrite:false, blending:THREE.NormalBlending
});
const points = new THREE.Points(geo, tMat);
points.frustumCulled = false;
const group = new THREE.Group();
group.add(points);
scene.add(group);

/* soft bloom */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.05, 0.55, 0);
composer.addPass(bloomPass);

function onResize(){
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w,h,false);
  composer.setSize(w,h);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ---------- pointer ---------- */
const mouseTarget = {x:0,y:0}, mouse = {x:0,y:0};
const POINTER = { active:false, lastMove:0, activity:0, world:new THREE.Vector3() };
window.addEventListener('mousemove', (e)=>{
  mouseTarget.x = (e.clientX/window.innerWidth)*2-1;
  mouseTarget.y = -((e.clientY/window.innerHeight)*2-1);
  POINTER.active = true; POINTER.lastMove = performance.now();
});
window.addEventListener('mouseout', ()=>{ POINTER.active = false; });

const _ndc=new THREE.Vector3(), _dir=new THREE.Vector3(), _tgt=new THREE.Vector3();
function updatePointerWorld(){
  _tgt.set(0,0,0);
  if(POINTER.active && !reduce){
    _ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
    _dir.copy(_ndc).sub(camera.position).normalize();
    const dn = _dir.z;
    if(Math.abs(dn) > 1e-4){
      const tt = -camera.position.z/dn;
      if(tt > 0 && Number.isFinite(tt)) _tgt.copy(camera.position).addScaledVector(_dir, tt);
    }
  }
  POINTER.world.lerp(_tgt, 0.12);
  const idle = (performance.now()-POINTER.lastMove)/1000;
  POINTER.activity += (((POINTER.active && idle<3)?1:0) - POINTER.activity)*0.06;
}

/* ---------- camera dolly + head-turn, driven by stage tweens + mouse ---------- */
const camState = { z: 11 };
let groupYaw = 0, groupPitch = 0;
const appearStart = performance.now();

function render(){
  requestAnimationFrame(render);
  mouse.x += (mouseTarget.x-mouse.x)*0.06;
  mouse.y += (mouseTarget.y-mouse.y)*0.06;

  const t = performance.now()/1000;
  tUniforms.uTime.value = t;

  camera.position.set(mouse.x*0.35, mouse.y*0.22, camState.z);
  camera.lookAt(0, mouse.y*0.12, 0);
  updatePointerWorld();

  // the head only "turns" to follow the cursor while it still reads as a head —
  // that responsiveness fades out naturally as uMorph moves past the head shape.
  const headness = clamp(1 - tUniforms.uMorph.value, 0, 1);
  groupYaw += ((mouse.x*0.5*headness) - groupYaw) * 0.05;
  groupPitch += ((mouse.y*0.12*headness) - groupPitch) * 0.05;
  group.rotation.y = groupYaw;
  group.rotation.x = groupPitch;

  tUniforms.uCursor.value.copy(POINTER.world);
  tUniforms.uActivity.value = POINTER.activity;
  const elapsed = (performance.now()-appearStart)/1000;
  tUniforms.uAppear.value = clamp((elapsed-0.2)/1.6, 0, 1);

  composer.render();
}
render();

/* =========================================================
   STORY — six stages carry the particle system from head,
   through inner chaos, to the final bloom.
========================================================= */
/* Colour is fixed across every stage now: dim = the page's own plum background
   (so unlit points melt into it) and lit = the requested teal (#47a1a2).
   Only brightness, jitter, morph and camera distance carry the story now. */
const journeyStages = [
  { name:'Approach', morph:0.00, camZ:11.0, jitter:.035, colLow:'#e7cdea', colHigh:'#47a1a2', bright:.050, bloom:.050 },
  { name:'Enter',    morph:0.55, camZ:5.5,  jitter:.09,  colLow:'#e7cdea', colHigh:'#47a1a2', bright:.062, bloom:.062 },
  { name:'Wander',   morph:1.00, camZ:2.0,  jitter:.20,  colLow:'#e7cdea', colHigh:'#47a1a2', bright:.080, bloom:.090 },
  { name:'Awaken',   morph:1.35, camZ:2.8,  jitter:.15,  colLow:'#e7cdea', colHigh:'#47a1a2', bright:.096, bloom:.100 },
  { name:'Open',     morph:1.70, camZ:6.2,  jitter:.08,  colLow:'#e7cdea', colHigh:'#47a1a2', bright:.110, bloom:.115 },
  { name:'Bloom',    morph:2.00, camZ:10.5, jitter:.035, colLow:'#e7cdea', colHigh:'#47a1a2', bright:.120, bloom:.130 }
];

document.querySelectorAll('.stage').forEach((el)=>{
  const i = parseInt(el.dataset.stage,10);
  const stage = journeyStages[i];
  ScrollTrigger.create({
    trigger: el, start:'top 65%', end:'bottom 35%',
    onEnter:()=>tuneScene(stage), onEnterBack:()=>tuneScene(stage)
  });
});
function tuneScene(stage){
  const lo = hexToVec3(stage.colLow), hi = hexToVec3(stage.colHigh);
  if(reduce){
    tUniforms.uMorph.value = stage.morph;
    tUniforms.uJitter.value = stage.jitter;
    tUniforms.uColLow.value.copy(lo);
    tUniforms.uColHigh.value.copy(hi);
    tUniforms.uBrightness.value = stage.bright;
    bloomPass.strength = stage.bloom;
    camState.z = stage.camZ;
    return;
  }
  gsap.to(tUniforms.uMorph, { value:stage.morph, duration:1.7, ease:'power2.inOut' });
  gsap.to(tUniforms.uJitter, { value:stage.jitter, duration:1.7, ease:'power2.inOut' });
  gsap.to(tUniforms.uBrightness, { value:stage.bright, duration:1.6, ease:'power2.inOut' });
  gsap.to(bloomPass, { strength:stage.bloom, duration:1.6, ease:'power2.inOut' });
  gsap.to(camState, { z:stage.camZ, duration:1.8, ease:'power2.inOut' });
  gsap.to(tUniforms.uColLow.value, { x:lo.x, y:lo.y, z:lo.z, duration:1.6, ease:'power2.inOut' });
  gsap.to(tUniforms.uColHigh.value, { x:hi.x, y:hi.y, z:hi.z, duration:1.6, ease:'power2.inOut' });
}

/* ---------- one continuous growth, tied to scroll, across the whole journey ----------
   The circle and the type are driven by the same value (--jp, 0 → 1): small together
   at Approach, large together at Bloom. In the last stretch the pool itself (--pool-op)
   fades toward 0, so by the time About begins the background is just the resting
   bloomed flower again — no pool left to fade out abruptly. */
const root = document.documentElement;
if(reduce){
  root.style.setProperty('--jp', 1);
  root.style.setProperty('--pool-op', 0.6);
} else {
  ScrollTrigger.create({
    trigger:'#journey-stages', start:'top top', end:'bottom bottom', scrub:true,
    onUpdate:(self)=>{
      const jp = self.progress;
      const poolOp = jp > 0.86 ? Math.max(0, 1 - (jp-0.86)/0.14) : 1;
      root.style.setProperty('--jp', jp.toFixed(3));
      root.style.setProperty('--pool-op', poolOp.toFixed(3));
    }
  });
}

/* ---------- text reveals: blur-to-focus (understanding made literal) ----------
   These are progressive enhancements only. All text defaults to fully visible
   in CSS, so if this script never runs (blocked CDN, offline file://, ad
   blocker, etc.) the page is still completely readable — the JS just adds
   a nicer entrance on top of that guaranteed-visible baseline. */
gsap.utils.toArray('.hero-logo, .hero-line, .hero-sub, .hero-cta, .scroll-cue').forEach((el,i)=>{
  gsap.fromTo(el, {opacity:0}, { opacity:1, duration:1.1, delay:0.2+i*0.15, ease:'power2.out' });
});

gsap.utils.toArray('.stage-line, .stage-sub, .final-line').forEach((el)=>{
  if(reduce){ return; }
  ScrollTrigger.create({
    trigger: el, start:'top 82%',
    onEnter:()=> gsap.fromTo(el, {opacity:0, filter:'blur(8px)'}, { opacity:1, filter:'blur(0px)', duration:1.2, ease:'power2.out' }),
    once:true
  });
});

window.addEventListener('load', ()=> ScrollTrigger.refresh());