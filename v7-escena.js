// v7 · el ∞ que viaja (E261 logo 3D, E155 objeto ligado al scroll, E153 notas sobre el modelo).
// Una sola capa fija. Los lugares los marcan los elementos [data-pose]:
// - portada: quieto; se inclina un poco hacia el mouse y se gira arrastrando con el clic izquierdo;
// - trayectoria (Ciclo DevOps fijo): el ∞ entero, dividido en ocho tramos de espectro; la etapa activa sale como un rayo
//   que recorre su tramo y lo enciende con su color.
// Arreglos de la skill: DPR limitado, dibujo cada 12,5 ms como mucho, pausa con la pestaña oculta, contexto recuperable,
// sin movimiento automático con movimiento reducido y el ∞ plano si no hay WebGL.
const raiz = document.documentElement, capa = document.querySelector('[data-bucle]');
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.dataset.movimiento === 'off';
const mezclar = (a, b, k) => a + (b - a) * k;
// Un color por etapa (planificar → monitorear), el mismo que usan el texto y el espectro de la sección.
const ESPECTRO = [0x9b7bff, 0x4d7cff, 0x22c4ff, 0x2ee6a8, 0xb8f04a, 0xffc93d, 0xff8a3d, 0xff4f8b];
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
  const rayoLuz = new THREE.PointLight(0xffffff, 0, 12); scene.add(rayoLuz); // la punta del rayo ilumina el cromo con el color de la etapa

  class Lemniscata extends THREE.Curve {
    constructor(desde = 0, hasta = 1) { super(); this.desde = desde; this.hasta = hasta; }
    getPoint(u, v = new THREE.Vector3()) { const a = (this.desde + (this.hasta - this.desde) * u) * Math.PI * 2, d = 1 + Math.sin(a) ** 2; return v.set(2.9 * Math.cos(a) / d, 2.9 * Math.sin(a) * Math.cos(a) / d, .55 * Math.sin(a)); }
  }
  const curva = new Lemniscata(), grupo = new THREE.Group(); scene.add(grupo);
  grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 600, .36, 48, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .06, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 2 })));
  // Ocho tramos: lóbulo izquierdo = desarrollo (planificar, código, build, pruebas), derecho = operación.
  const INICIO = .25, centro = k => (INICIO + (k + .5) / 8) % 1;
  const tramoCurva = k => new Lemniscata(INICIO + k / 8, INICIO + (k + 1) / 8);
  const tramos = ESPECTRO.map((c, k) => {
    const geo = new THREE.TubeGeometry(tramoCurva(k), 60, .42, 24, false);
    // Poca emisión: con el mapeo ACES un color muy emisivo se lava a blanco.
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .35, metalness: .2, roughness: .25, transparent: true, opacity: 0 }));
    m.userData.total = geo.index.count; grupo.add(m); return m;
  });
  const cuentaGeo = new THREE.SphereGeometry(.5, 40, 28);
  const cuentas = ESPECTRO.map(() => {
    const m = new THREE.Mesh(cuentaGeo, new THREE.MeshPhysicalMaterial({ color: 0x3d68ff, emissive: 0x1b3cff, emissiveIntensity: .8, roughness: .03, clearcoat: 1, iridescence: .7, envMapIntensity: 2.2, transparent: true, opacity: .93 }));
    m.userData.s = 1; grupo.add(m); return m;
  });
  const azulCuenta = new THREE.Color(0x3d68ff), azulBrillo = new THREE.Color(0x1b3cff), tono = new THREE.Color();

  const poses = [...document.querySelectorAll('[data-pose]')].map(el => ({ el, tipo: el.dataset.pose }));
  const tray = document.querySelector('[data-trayectoria]');
  const ANCHO = 6.6; // ancho del ∞ en unidades del mundo
  let activa = 0, rayo = 1, nx = 0, ny = 0;
  document.addEventListener('etapa', e => { if (e.detail !== activa) { activa = e.detail; rayo = quieto() ? 1 : 0; } });
  // Portada: el ∞ queda quieto. Se inclina un poco hacia el mouse y se gira arrastrando con el clic izquierdo (con inercia).
  let arrastre = null, vel = 0, incl = 0, ultimo = null, giro = 0;
  const unidad = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight;
  const sobreBucle = (x, y) => {
    if (!ultimo || ultimo.w.portada < .5 || cur.o < .3) return false;
    const u = unidad(), mitad = ANCHO * cur.s / u / 2;
    return Math.abs(x - (innerWidth / 2 + cur.x / u)) < mitad + 24 && Math.abs(y - (innerHeight / 2 - cur.y / u)) < mitad * .45 + 24;
  };
  const marcar = (nombre, si) => { if (raiz.hasAttribute(nombre) !== si) raiz.toggleAttribute(nombre, si); };
  addEventListener('pointerdown', e => {
    if (e.button !== 0 || e.pointerType !== 'mouse' || e.target.closest('a,button,input,label,select,textarea') || !sobreBucle(e.clientX, e.clientY)) return;
    e.preventDefault(); arrastre = { x: e.clientX, y: e.clientY }; vel = 0; marcar('data-arrastre', true);
  });
  addEventListener('pointermove', e => {
    nx = e.clientX / innerWidth * 2 - 1; ny = e.clientY / innerHeight * 2 - 1;
    if (!arrastre) { if (e.pointerType === 'mouse') marcar('data-sobre-bucle', sobreBucle(e.clientX, e.clientY)); return; }
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y; arrastre.x = e.clientX; arrastre.y = e.clientY;
    giro += dx * .01; vel = Math.max(-.15, Math.min(.15, dx * .01)); incl = Math.max(-.9, Math.min(.9, incl + dy * .006));
  }, { passive: true });
  const soltar = () => { if (!arrastre) return; arrastre = null; marcar('data-arrastre', false); if (quieto()) vel = 0; };
  addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar); addEventListener('blur', soltar);

  const medir = () => {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5));
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  };
  medir(); addEventListener('resize', medir);

  const anchoPx = (tipo, r) => tipo === 'portada' ? (innerWidth < 860 ? r.width * .92 : Math.min(r.width * .52, r.height * 1.25, 820)) : Math.min(r.width * .9, r.height * 1.8);
  const progresoTray = () => { if (!tray) return 0; const r = tray.getBoundingClientRect(); return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))); };
  function objetivo() {
    const H = innerHeight, u = unidad();
    const w = { portada: 0, trayectoria: 0 }; let suma = 0, x = 0, y = 0, s = 0, max = 0;
    for (const p of poses) {
      const r = p.el.getBoundingClientRect(); if (!r.width) continue;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const peso = Math.max(0, 1 - Math.abs(cy - H / 2) / (H * .8)) ** 1.5;
      w[p.tipo] = peso; suma += peso; max = Math.max(max, peso);
      x += peso * (cx - innerWidth / 2) * u; y += peso * -(cy - H / 2) * u; s += peso * anchoPx(p.tipo, r) * u / ANCHO;
    }
    if (suma) { x /= suma; y /= suma; s /= suma; for (const k in w) w[k] /= suma; }
    return { x, y, s: s || .5, o: Math.min(1, max * 1.7), w };
  }

  const ahora0 = objetivo(), cur = { x: ahora0.x, y: ahora0.y, s: ahora0.s, o: ahora0.o, park: ahora0.w.trayectoria, ry: 0, rx: .2 };
  let antes = performance.now(), dibujado = 0, corriendo = false;
  const v = new THREE.Vector3(), b = new THREE.Vector3();
  const suave = x => 1 - (1 - x) ** 3;

  function paso(dt) {
    const o = objetivo(), k = quieto() ? 1 : .1, p = progresoTray(), mouse = quieto() ? 0 : 1, wt = o.w.trayectoria; ultimo = o;
    if (!arrastre && o.w.portada < .5) marcar('data-sobre-bucle', false); // al bajar con la rueda no hay pointermove que la apague
    if (!arrastre) { giro += vel; vel *= .9; incl *= .96; }
    rayo = Math.min(1, rayo + dt / .65);
    const vueltas = Math.round(giro / (Math.PI * 2)) * Math.PI * 2;
    // En el ciclo el ∞ queda casi de frente (para leer los tramos) y apenas se mece con el progreso y el mouse.
    const ry = (giro + nx * .22 * mouse) * (1 - wt) + wt * (vueltas + (p - .5) * .5 + nx * .12 * mouse);
    const rx = (.2 + incl + ny * .14 * mouse) * (1 - wt) + wt * (.22 + Math.sin(p * Math.PI) * .12 - ny * .08 * mouse);
    const px = o.x + nx * .1 * mouse * o.w.portada, py = o.y - ny * .07 * mouse * o.w.portada;
    for (const [c, val] of [['x', px], ['y', py], ['s', o.s], ['o', o.o], ['park', wt], ['ry', ry], ['rx', rx]]) cur[c] = mezclar(cur[c], val, k);
    grupo.position.set(cur.x, cur.y, 0); grupo.scale.setScalar(cur.s); grupo.rotation.set(cur.rx, cur.ry, 0);
    // Espectro: todos los tramos se ven tenues con su color; el de la etapa activa sale como un rayo que lo recorre y queda encendido.
    tramos.forEach((m, i) => {
      const si = i === activa;
      m.material.opacity = mezclar(m.material.opacity, cur.park * (si ? 1 : .5), k);
      m.material.emissiveIntensity = si ? .22 + 1.2 * (1 - suave(rayo)) : .1;
      const n = si ? Math.max(6, Math.floor(m.userData.total * suave(rayo) / 6) * 6) : m.userData.total;
      m.geometry.setDrawRange(0, n);
    });
    tramoCurva(activa).getPoint(suave(rayo), v); rayoLuz.position.copy(v.applyMatrix4(grupo.matrixWorld)); rayoLuz.position.z += .8;
    rayoLuz.color.setHex(ESPECTRO[activa]); rayoLuz.intensity = mezclar(rayoLuz.intensity, cur.park * (14 + 46 * (1 - rayo)), .3);
    // Cuentas: en la portada quietas sobre el ∞; en el ciclo, una en el centro de cada tramo; la activa crece y toma su color.
    cuentas.forEach((c, i) => {
      curva.getPoint(i / 8, v); curva.getPoint(centro(i), b); c.position.copy(v.lerp(b, cur.park));
      const si = cur.park > .5 && i === activa;
      c.userData.s = mezclar(c.userData.s, si ? 1.35 : 1, k); c.scale.setScalar(c.userData.s);
      tono.setHex(ESPECTRO[i]);
      c.material.color.lerpColors(azulCuenta, tono, si ? 1 : 0); c.material.emissive.lerpColors(azulBrillo, tono, si ? 1 : 0);
      c.material.emissiveIntensity = si ? .45 : .8;
    });
    capa.style.opacity = cur.o.toFixed(3);
  }
  const tic = ahora => {
    if (document.hidden) { corriendo = false; return; }
    paso(Math.min(.05, (ahora - antes) / 1000)); antes = ahora;
    if (cur.o > .004 && ahora - dibujado >= 12.5) { renderer.render(scene, camera); dibujado = ahora; }
    requestAnimationFrame(tic);
  };
  const arrancar = () => { if (corriendo) return; corriendo = true; antes = performance.now(); requestAnimationFrame(tic); };
  paso(0); renderer.render(scene, camera); raiz.dataset.tres = '';
  document.addEventListener('visibilitychange', arrancar);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); corriendo = false; delete raiz.dataset.tres; capa.style.opacity = 0; });
  canvas.addEventListener('webglcontextrestored', () => { raiz.dataset.tres = ''; arrancar(); });
  arrancar();
} catch (e) { delete raiz.dataset.tres; console.warn('∞ 3D no disponible:', e); }
