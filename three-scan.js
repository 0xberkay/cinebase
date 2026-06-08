import * as THREE from 'three';

// AI "scan & resolve" effect: a gold scan beam sweeps down the image,
// turning a pixelated / desaturated frame into a sharp, graded master.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const VERT = /* glsl */`
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */`
  precision highp float;
  uniform sampler2D tex;
  uniform float time;
  uniform float hover;
  varying vec2 vUv;

  void main(){
    // scan position sweeps top(1.0) -> bottom(0.0), looping
    float sweep = fract(time * 0.16);
    float line  = 1.0 - sweep;

    vec2 uv = vUv;
    bool resolved = uv.y > line;            // the beam has already passed here = mastered

    // pixelate + desaturate the not-yet-scanned region
    float blocks = mix(70.0, 150.0, hover);
    vec2 puv = (floor(uv * blocks) + 0.5) / blocks;
    vec2 suv = resolved ? uv : puv;

    vec3 col = texture2D(tex, suv).rgb;
    if(!resolved){
      float g = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(g), 0.55);        // wash out the "before"
      col *= 0.82;
    }

    // gold scan beam glow
    float d = abs(uv.y - line);
    vec3 gold = vec3(0.91, 0.72, 0.28);
    col += gold * smoothstep(0.07, 0.0, d) * 0.55;   // soft halo
    col += gold * smoothstep(0.006, 0.0, d) * 1.3;   // bright core

    // faint horizontal scanlines on the unresolved side
    if(!resolved){
      col *= 0.92 + 0.08 * sin(uv.y * 900.0);
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

function mount(el) {
  const src = el.dataset.tex;
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.appendChild(renderer.domElement);

  const uniforms = {
    tex: { value: null },
    time: { value: 0 },
    hover: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  new THREE.TextureLoader().load(src, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearFilter;
    uniforms.tex.value = t;
  });

  function resize() {
    const r = el.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
  }
  resize();
  new ResizeObserver(resize).observe(el);

  let targetHover = 0;
  el.addEventListener('pointerenter', () => (targetHover = 1));
  el.addEventListener('pointerleave', () => (targetHover = 0));

  const clock = new THREE.Clock();
  function loop() {
    uniforms.time.value += reduce ? 0 : clock.getDelta();
    uniforms.hover.value += (targetHover - uniforms.hover.value) * 0.08;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  // hold a static frame for reduced-motion users
  if (reduce) uniforms.time.value = 0.5;
  loop();
}

document.querySelectorAll('.scanner').forEach(mount);
