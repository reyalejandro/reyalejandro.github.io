// v7 · el ∞ que viaja (E261 logo 3D, E155 objeto ligado al scroll, E153 notas sobre el modelo).
// Una sola capa fija. Los lugares los marcan los elementos [data-pose]: portada (gira), trayectoria (queda fijo y se arma
// con el progreso, como el objeto de oryzo.ai) y ciclo (se detiene de frente y cada tramo es una etapa interactiva).
// Arreglos de la skill: DPR limitado, dibujo cada 12,5 ms como mucho, pausa con la pestaña oculta, contexto recuperable,
// sin giro con movimiento reducido y el ∞ plano si no hay WebGL.
const raiz = document.documentElement, capa = document.querySelector('[data-bucle]');
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.dataset.movimiento === 'off';
const mezclar = (a, b, k) => a + (b - a) * k;
try {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const canvas = capa.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.6; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(26, 1, .1, 60); camera.position.set(0, 0, 10);
  const azul = new THREE.PointLight(0x2d5bff, 40, 30); azul.position.set(0, -4, 3); scene.add(azul);
  const borde = new THREE.PointLight(0xffffff, 0, 30); scene.add(borde); // luz que recorre el ∞ en la trayectoria

  class Lemniscata extends THREE.Curve {
    constructor(desde = 0, hasta = 1) { super(); this.desde = desde; this.hasta = hasta; }
    getPoint(u, v = new THREE.Vector3()) { const a = (this.desde + (this.hasta - this.desde) * u) * Math.PI * 2, d = 1 + Math.sin(a) ** 2; return v.set(2.9 * Math.cos(a) / d, 2.9 * Math.sin(a) * Math.cos(a) / d, .55 * Math.sin(a)); }
  }
  const curva = new Lemniscata(), grupo = new THREE.Group(); scene.add(grupo);
  const tuboGeo = new THREE.TubeGeometry(curva, 600, .36, 48, true), totalIndices = tuboGeo.index.count;
  grupo.add(new THREE.Mesh(tuboGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .06, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 2 })));
  // Ocho tramos: lóbulo izquierdo = desarrollo (planificar, código, build, pruebas), derecho = operación.
  const INICIO = .25, centro = k => (INICIO + (k + .5) / 8) % 1;
  const tramos = Array.from({ length: 8 }, (_, k) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(new Lemniscata(INICIO + k / 8, INICIO + (k + 1) / 8), 60, .42, 24, false),
      new THREE.MeshPhysicalMaterial({ color: 0x8fa6ff, emissive: 0x2d5bff, emissiveIntensity: 1.6, roughness: .1, transparent: true, opacity: 0, depthWrite: false }));
    m.userData.k = k; grupo.add(m); return m;
  });
  const vidrio = new THREE.MeshPhysicalMaterial({ color: 0x3d68ff, emissive: 0x1b3cff, emissiveIntensity: .8, roughness: .03, clearcoat: 1, iridescence: .7, envMapIntensity: 2.2, transparent: true, opacity: .93 });
  const cuentaGeo = new THREE.SphereGeometry(.5, 40, 28);
  const cuentas = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(cuentaGeo, vidrio); m.userData.s = 1; grupo.add(m); return m; });

  const poses = [...document.querySelectorAll('[data-pose]')].map(el => ({ el, tipo: el.dataset.pose }));
  const tray = document.querySelector('[data-trayectoria]'), etapas = document.querySelector('.etapas'), lienzoCiclo = document.querySelector('.ciclo-lienzo');
  const botones = [...document.querySelectorAll('[data-etapa]')];
  const ANCHO = 6.6; // ancho del ∞ en unidades del mundo
  let activa = 0, nx = 0, ny = 0;
  document.addEventListener('etapa', e => { activa = e.detail; });
  addEventListener('pointermove', e => { nx = e.clientX / innerWidth * 2 - 1; ny = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  const ancho = () => innerWidth >= 860;
  const medir = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5));
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    etapas.toggleAttribute('data-ubicadas', ancho());
  };
  medir(); addEventListener('resize', medir);

  const anchoPx = (tipo, r) => tipo === 'portada' ? (innerWidth < 860 ? r.width * .92 : Math.min(r.width * .52, r.height * 1.25, 820)) : tipo === 'trayectoria' ? Math.min(r.width * .9, r.height * 1.8) : etapas.hasAttribute('data-ubicadas') ? r.width * .66 : Math.min(r.width * .9, 520);
  const progresoTray = () => { const r = tray.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))); };
  function objetivo() {
    const H = innerHeight, u = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / H;
    const w = { portada: 0, trayectoria: 0, ciclo: 0 }; let suma = 0, x = 0, y = 0, s = 0, max = 0;
    for (const p of poses) {
      const r = p.el.getBoundingClientRect(); if (!r.width) continue;
      const cx = r.left + r.width / 2, cy = p.tipo === 'ciclo' && !etapas.hasAttribute('data-ubicadas') ? r.top + Math.min(r.width * .62, 420) / 2 : r.top + r.height / 2;
      const peso = Math.max(0, 1 - Math.abs(cy - H / 2) / (H * .8)) ** 1.5;
      const px = anchoPx(p.tipo, r);
      w[p.tipo] = peso; suma += peso; max = Math.max(max, peso);
      x += peso * (cx - innerWidth / 2) * u; y += peso * -(cy - H / 2) * u; s += peso * px * u / ANCHO;
    }
    if (suma) { x /= suma; y /= suma; s /= suma; for (const k in w) w[k] /= suma; }
    return { x, y, s: s || .5, o: Math.min(1, max * 1.7), w };
  }

  const ahora0 = objetivo(), cur = { x: ahora0.x, y: ahora0.y, s: ahora0.s, o: ahora0.o, frac: 1, park: ahora0.w.ciclo, ry: 0, rx: .2 };
  let t = 0, giro = 0, antes = performance.now(), dibujado = 0, corriendo = false;
  const v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();

  function paso(dt) {
    const o = objetivo(), k = quieto() ? 1 : .1, p = progresoTray();
    if (!quieto()) { t += dt; giro += dt * .6 * o.w.portada; }
    const vueltas = Math.round(giro / (Math.PI * 2)) * Math.PI * 2;
    const ry = giro * (1 - o.w.ciclo - o.w.trayectoria) + o.w.trayectoria * (vueltas + p * Math.PI * 1.6) + o.w.ciclo * (vueltas + nx * .28);
    const rx = mezclar(.2 + ny * .35, .25 + Math.sin(p * Math.PI) * .85, o.w.trayectoria) * (1 - o.w.ciclo) + o.w.ciclo * (.16 - ny * .1);
    const frac = 1 - o.w.trayectoria * (1 - (.12 + .88 * p));
    for (const [c, val] of [['x', o.x], ['y', o.y], ['s', o.s], ['o', o.o], ['frac', frac], ['park', o.w.ciclo], ['ry', ry], ['rx', rx]]) cur[c] = mezclar(cur[c], val, k);
    grupo.position.set(cur.x, cur.y, 0); grupo.scale.setScalar(cur.s); grupo.rotation.set(cur.rx, cur.ry, 0);
    tuboGeo.setDrawRange(0, Math.max(6, Math.floor(totalIndices * cur.frac / 6) * 6));
    // Luz de borde que recorre el ∞ mientras se arma
    borde.intensity = mezclar(borde.intensity, 60 * o.w.trayectoria, k); borde.position.set(Math.cos(p * Math.PI * 3) * 6, 3, Math.sin(p * Math.PI * 3) * 6);
    // En la trayectoria cada cuenta se apoya sobre la parte ya armada del tubo y aparece cuando el tubo llega a ella
    cuentas.forEach((c, i) => {
      const enTubo = (i + .5) / 8;
      curva.getPoint((i / 8 + t * .07) % 1, a); curva.getPoint(enTubo, v); a.lerp(v, o.w.trayectoria);
      curva.getPoint(centro(i), b); c.position.copy(a.lerp(b, cur.park));
      const meta = (o.w.trayectoria > .5 && enTubo > cur.frac ? 0 : 1) * (cur.park > .5 && i === activa ? 1.35 : 1);
      c.userData.s = mezclar(c.userData.s, meta, k); c.scale.setScalar(Math.max(.001, c.userData.s));
    });
    tramos.forEach((m, i) => { m.material.opacity = mezclar(m.material.opacity, i === activa ? .92 * cur.park : 0, k); });
    capa.style.opacity = cur.o.toFixed(3);
    ubicarEtapas();
  }
  // Las etiquetas de etapa se calculan con la pose final del ciclo (no con la mezcla), así quedan pegadas a su sección
  // y el ∞ llega a ellas cuando la sección se centra. Cada una se corre hacia afuera: radio de la cuenta + medio botón.
  const fantasma = new THREE.Object3D();
  function ubicarEtapas() {
    if (!etapas.hasAttribute('data-ubicadas')) return;
    const r = lienzoCiclo.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
    const H = innerHeight, u = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / H, s = anchoPx('ciclo', r) * u / ANCHO;
    fantasma.position.set((r.left + r.width / 2 - innerWidth / 2) * u, -(r.top + r.height / 2 - H / 2) * u, 0); fantasma.scale.setScalar(s); fantasma.rotation.set(.16, 0, 0); fantasma.updateMatrixWorld();
    const re = etapas.getBoundingClientRect(), radio = .5 * 1.35 * s / u + 10;
    v.set(0, 0, 0).applyMatrix4(fantasma.matrixWorld).project(camera); const ox = (v.x + 1) / 2 * innerWidth, oy = (1 - v.y) / 2 * H;
    botones.forEach((btn, i) => {
      curva.getPoint(centro(i), v); v.applyMatrix4(fantasma.matrixWorld).project(camera);
      const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * H, dx = sx - ox, dy = (sy - oy) * 2.2, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
      btn.style.setProperty('--x', (sx + ux * (radio + btn.offsetWidth / 2) - re.left).toFixed(1) + 'px');
      btn.style.setProperty('--y', (sy + uy * (radio + btn.offsetHeight / 2) - re.top).toFixed(1) + 'px');
    });
  }
  const tic = ahora => {
    if (document.hidden) { corriendo = false; return; }
    paso(Math.min(.05, (ahora - antes) / 1000)); antes = ahora;
    if (cur.o > .004 && ahora - dibujado >= 12.5) { renderer.render(scene, camera); dibujado = ahora; }
    requestAnimationFrame(tic);
  };
  const arrancar = () => { if (corriendo) return; corriendo = true; antes = performance.now(); requestAnimationFrame(tic); };
  // Pasar el mouse por un tramo del ∞ elige esa etapa
  const rayo = new THREE.Raycaster(), puntero = new THREE.Vector2(); let pendiente = null;
  lienzoCiclo.addEventListener('pointermove', e => {
    if (pendiente || cur.park < .5) return;
    pendiente = requestAnimationFrame(() => {
      pendiente = null; puntero.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); rayo.setFromCamera(puntero, camera);
      const hit = rayo.intersectObjects(tramos, false)[0];
      if (hit && window.cvEtapa) window.cvEtapa(botones[hit.object.userData.k].dataset.etapa);
    });
  });
  paso(0); renderer.render(scene, camera); raiz.dataset.tres = '';
  document.addEventListener('visibilitychange', arrancar);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); corriendo = false; delete raiz.dataset.tres; capa.style.opacity = 0; });
  canvas.addEventListener('webglcontextrestored', () => { raiz.dataset.tres = ''; arrancar(); });
  arrancar();
} catch (e) { delete raiz.dataset.tres; console.warn('∞ 3D no disponible:', e); }
