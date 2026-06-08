import * as THREE from 'three';

// Respect reduced-motion preference
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1200);
camera.position.z = 360;

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

// ---- soft round gold sprite ----
function discTexture() {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d').createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(243,210,126,1)');
  g.addColorStop(0.35, 'rgba(233,185,73,0.55)');
  g.addColorStop(1, 'rgba(233,185,73,0)');
  const ctx = c.getContext('2d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}
const sprite = discTexture();

// ---- floating dust field ----
const COUNT = innerWidth < 720 ? 260 : 520;
const positions = new Float32Array(COUNT * 3);
const speeds = new Float32Array(COUNT);
const sizes = new Float32Array(COUNT);
const spread = 700;

for (let i = 0; i < COUNT; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * spread;
  positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
  speeds[i] = 0.15 + Math.random() * 0.5;
  sizes[i]  = 6 + Math.random() * 16;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const mat = new THREE.PointsMaterial({
  size: 14,
  map: sprite,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0xE9B949,
  opacity: 0.7,
  sizeAttenuation: true,
});
const points = new THREE.Points(geo, mat);
scene.add(points);

// ---- subtle parallax from pointer + scroll ----
let mx = 0, my = 0, tx = 0, ty = 0;
addEventListener('pointermove', (e) => {
  mx = (e.clientX / innerWidth - 0.5);
  my = (e.clientY / innerHeight - 0.5);
}, { passive: true });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const pos = geo.attributes.position.array;
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  // drift dust upward and recycle
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3 + 1] += speeds[i] * (reduce ? 0 : dt * 28);
    pos[i * 3]     += Math.sin((clock.elapsedTime + i) * 0.3) * 0.05;
    if (pos[i * 3 + 1] > spread / 2) pos[i * 3 + 1] = -spread / 2;
  }
  geo.attributes.position.needsUpdate = true;

  // parallax easing
  tx += (mx - tx) * 0.04;
  ty += (my - ty) * 0.04;
  const scrollK = scrollY * 0.00018;
  points.rotation.y = tx * 0.4 + clock.elapsedTime * 0.01;
  points.rotation.x = -ty * 0.3 - scrollK;
  camera.position.x = tx * 40;
  camera.position.y = -ty * 30;
  camera.lookAt(scene.position);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
