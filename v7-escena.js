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
  const canvas = capa.querySelector('canvas:not([data-rayos])'), lienzoRayos = capa.querySelector('[data-rayos]'), rctx = lienzoRayos.getContext('2d');
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
  const cromo = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .06, clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 2 });
  // Ocho tramos: lóbulo izquierdo = desarrollo (planificar, código, build, pruebas), derecho = operación.
  const INICIO = .25, centro = k => (INICIO + (k + .5) / 8) % 1;
  const tramoCurva = k => new Lemniscata(INICIO + k / 8, INICIO + (k + 1) / 8);
  // El tubo son ocho piezas (pedido del dueño, boceto rojo): en el ciclo la pieza de la etapa activa se desprende del bucle,
  // sube y crece, como una vista explosionada (E250). Cada pieza lleva adentro su tramo de color; las geometrías están
  // centradas en el medio del tramo para que la pieza escale sobre sí misma.
  const piezas = [], tramos = ESPECTRO.map((c, k) => {
    const medio = tramoCurva(k).getPoint(.5), pieza = new THREE.Group(); pieza.position.copy(medio); pieza.userData = { medio, alza: 0 };
    const tubo = new THREE.TubeGeometry(tramoCurva(k), 56, .36, 32, false); tubo.translate(-medio.x, -medio.y, -medio.z);
    pieza.add(new THREE.Mesh(tubo, cromo));
    const geo = new THREE.TubeGeometry(tramoCurva(k), 60, .42, 24, false); geo.translate(-medio.x, -medio.y, -medio.z);
    // Poca emisión: con el mapeo ACES un color muy emisivo se lava a blanco.
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: .35, metalness: .2, roughness: .25, transparent: true, opacity: 0 }));
    m.userData.total = geo.index.count; pieza.add(m); grupo.add(pieza); piezas.push(pieza); return m;
  });
  // Punto u (0–1) del tramo k tal como se ve hoy: con la pieza corrida y escalada (en coordenadas del grupo)
  const puntoPieza = (k, u, salida) => { const pz = piezas[k]; return tramoCurva(k).getPoint(u, salida).sub(pz.userData.medio).multiplyScalar(pz.scale.x).add(pz.position); };
  const cuentaGeo = new THREE.SphereGeometry(.5, 32, 22);
  // Sin iridiscencia: era lo más caro del sombreado y apenas se notaba.
  const cuentas = ESPECTRO.map(() => {
    const m = new THREE.Mesh(cuentaGeo, new THREE.MeshPhysicalMaterial({ color: 0x3d68ff, emissive: 0x1b3cff, emissiveIntensity: .8, roughness: .03, clearcoat: 1, envMapIntensity: 2.2, transparent: true, opacity: .93 }));
    grupo.add(m); return m;
  });

  // ——— Rayos con contenido: cuando una etapa se activa, de su tramo salen haces de su color que terminan en sus herramientas
  // (con ícono) y en sus metodologías y prácticas. Las etiquetas se acomodan alrededor del ∞ sin pisarse ni invadir el panel;
  // al pasar el mouse marcan la frase donde se usaron y un toque la fija. En el celular no hay lugar: siguen en el panel. ———
  let forzar = true, rayosLimpio = true, rayosDibujo = 0, tCambio = 0;
  const pantalla = (p, salida) => { p.applyMatrix4(grupo.matrixWorld).project(camera); salida.x = (p.x + 1) / 2 * innerWidth; salida.y = (1 - p.y) / 2 * innerHeight; return salida; };
  const pRayo = new THREE.Vector3(), c2 = { x: 0, y: 0 };
  const capaEtq = document.createElement('div'); capaEtq.className = 'rayos-etq'; capaEtq.setAttribute('aria-hidden', 'true'); document.body.append(capaEtq);
  const pasosLi = [...document.querySelectorAll('[data-paso]')];
  let etiquetas = []; // { el, w, h, x, y, ax, ay, k }
  const enDesktop = () => innerWidth > 860;
  function armarEtiquetas() {
    const li = pasosLi[activa]; capaEtq.innerHTML = ''; etiquetas = [];
    if (!li) return;
    const en = document.documentElement.lang === 'en', color = '#' + ESPECTRO[activa].toString(16).padStart(6, '0');
    capaEtq.style.setProperty('--c', color);
    const herramientas = [...li.querySelectorAll('.herramientas li')].map(c => ({ html: c.innerHTML, texto: c.textContent.trim(), tipo: 'herr', chip: c }));
    const metodos = (li.dataset.metodos || '').split('|').filter(Boolean).map(m => { const [es, enTxt] = m.split('::'); const tx = en ? enTxt : es; return { html: tx, texto: tx, tipo: 'metodo' }; });
    // Se intercalan para que herramientas y prácticas se repartan por todo el abanico
    const todas = []; for (let i = 0; i < Math.max(herramientas.length, metodos.length); i++) { if (herramientas[i]) todas.push(herramientas[i]); if (metodos[i]) todas.push(metodos[i]); }
    todas.forEach((d, k) => {
      const el = document.createElement('span'); el.className = 'etq ' + d.tipo; el.innerHTML = d.html; capaEtq.append(el);
      const resaltar = si => window.cvResaltar?.(si ? d.texto : null, d.chip);
      el.addEventListener('pointerenter', () => resaltar(true)); el.addEventListener('pointerleave', () => resaltar(false));
      el.addEventListener('click', () => { if (d.chip) d.chip.click(); else window.cvResaltar?.(d.texto, null, true); });
      etiquetas.push({ el, w: 0, h: 0, x: 0, y: 0, ax: 0, ay: 0, k, n: todas.length });
    });
    etiquetas.forEach(e => { e.w = e.el.offsetWidth; e.h = e.el.offsetHeight; });
    tCambio = performance.now(); rayosDibujo = 0;
  }
  document.addEventListener('idioma', armarEtiquetas);
  function ubicarEtiquetas(ahora) {
    const fuerza = cur.park * cur.o, mostrar = enDesktop() && fuerza > .3;
    capaEtq.style.opacity = mostrar ? Math.min(1, (fuerza - .3) / .4).toFixed(2) : '0';
    capaEtq.toggleAttribute('data-visible', mostrar);
    if (!mostrar || !etiquetas.length) return false;
    // Zona libre: entre el texto de la etapa (arriba) y el espectro (abajo), a todo el ancho
    const panel = document.querySelector('.tray-pasos')?.getBoundingClientRect(), espectro = document.querySelector('.espectro')?.getBoundingClientRect();
    const minX = 16, maxX = innerWidth - 16, minY = (panel ? panel.bottom : 0) + 6, maxY = (espectro ? espectro.top : innerHeight) - 10;
    const vivo = !quieto();
    // Con el zoom, el tramo activo ocupa el centro de la zona: las etiquetas lo rodean en un óvalo ancho (la zona es baja y
    // ancha), repartidas parejo y escalonadas. Cada haz sale del punto del tramo más cercano a su etiqueta.
    const muestras = []; for (let m = 0; m <= 12; m++) { const q = { x: 0, y: 0 }; pantalla(puntoPieza(activa, m / 12, pRayo), q); muestras.push(q); }
    const xs = muestras.map(q => q.x), ys = muestras.map(q => q.y);
    c2.x = (Math.min(...xs) + Math.max(...xs)) / 2; c2.y = (Math.min(...ys) + Math.max(...ys)) / 2;
    const n = etiquetas.length, alto = Math.max(60, maxY - minY);
    const rx = Math.max((Math.max(...xs) - Math.min(...xs)) / 2 + 110, 300), ry = Math.min((Math.max(...ys) - Math.min(...ys)) / 2 + 46, alto / 2 - 18);
    // Si a los costados del ∞ entero hay lugar, las etiquetas van en dos columnas (mitad a cada lado) y no pisan el tubo;
    // si no (pantallas de 861 a ~1150 px), rodean el tramo en el óvalo.
    const todo = []; for (let m = 0; m < 32; m++) { const q = { x: 0, y: 0 }; pantalla(curva.getPoint(m / 32, pRayo), q); todo.push(q); }
    const margen = 30 + .42 * cur.s / unidad(); // aire más el grosor del tubo
    const bIzq = Math.min(...todo.map(q => q.x)) - margen, bDer = Math.max(...todo.map(q => q.x)) + margen;
    const anchoMax = Math.max(...etiquetas.map(e => e.w)) + 34, columnas = bIzq - minX >= anchoMax && maxX - bDer >= anchoMax;
    const lado = [[], []]; etiquetas.forEach((e, k) => lado[k % 2].push(e));
    etiquetas.forEach((e, k) => {
      const extra = (k % 2) * 40; // escalonadas, para que las vecinas no queden en fila
      if (columnas) {
        const grupoLado = lado[k % 2], i = grupoLado.indexOf(e), m = grupoLado.length, corrimiento = (i % 2) * 30;
        e.y = minY + (i + .5) / m * alto - e.h / 2;
        e.x = k % 2 ? bDer + corrimiento : bIzq - corrimiento - e.w;
      } else {
        const th = -Math.PI / 2 + (k + .5) / n * Math.PI * 2, cx = Math.cos(th), cy = Math.sin(th);
        e.x = c2.x + cx * (rx + extra) - e.w / 2; e.y = c2.y + cy * (ry + extra * .25) - e.h / 2;
      }
      // Cada haz sale de un punto distinto de la pieza: el de su columna más cercano a la etiqueta, sin repetir
      let mejor = muestras[0], dmin = Infinity;
      for (const q of muestras) { if (q.usado) continue; const d = Math.hypot(q.x - (e.x + e.w / 2), q.y - (e.y + e.h / 2)); if (d < dmin) { dmin = d; mejor = q; } }
      mejor.usado = etiquetas.length <= muestras.length; e.ax = mejor.x; e.ay = mejor.y;
    });
    // Se separan las que se pisan (unas pasadas alcanzan) y se mantienen dentro de la zona libre
    for (let pasada = 0; pasada < 10; pasada++) {
      for (const e of etiquetas) { e.x = Math.min(Math.max(e.x, minX), maxX - e.w); e.y = Math.min(Math.max(e.y, minY), maxY - e.h); }
      for (let i = 0; i < etiquetas.length; i++) for (let j = i + 1; j < etiquetas.length; j++) {
        const a = etiquetas[i], b = etiquetas[j], sx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 8, sy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 6;
        if (sx > 0 && sy > 0) { if (sy < sx) { const m = sy / 2 * Math.sign((b.y - a.y) || 1); a.y -= m; b.y += m; } else { const m = sx / 2 * Math.sign((b.x - a.x) || 1); a.x -= m; b.x += m; } }
      }
    }
    // Salen del tramo en cascada y quedan quietas; con movimiento reducido aparecen directo
    for (const e of etiquetas) {
      const p = vivo ? Math.min(1, Math.max(0, (ahora - tCambio - e.k * 45) / 520)) : 1, s = 1 - (1 - p) ** 3;
      e.px = e.ax + (e.x + e.w / 2 - e.ax) * s - e.w / 2; e.py = e.ay + (e.y + e.h / 2 - e.ay) * s - e.h / 2; e.p = s;
      e.el.style.transform = `translate(${e.px.toFixed(1)}px,${e.py.toFixed(1)}px) scale(${(.6 + .4 * s).toFixed(3)})`; e.el.style.opacity = s.toFixed(3);
    }
    return true;
  }
  function dibujarRayos(ahora) {
    const hay = ubicarEtiquetas(ahora);
    if (!hay) { if (!rayosLimpio) { rctx.clearRect(0, 0, lienzoRayos.width, lienzoRayos.height); rayosLimpio = true; } return; }
    if (ahora - rayosDibujo < 33) return; rayosDibujo = ahora; rayosLimpio = false;
    const dpr = lienzoRayos.width / innerWidth, col = ESPECTRO[activa], rgb = `${col >> 16 & 255},${col >> 8 & 255},${col & 255}`;
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0); rctx.clearRect(0, 0, innerWidth, innerHeight);
    rctx.globalCompositeOperation = 'lighter'; rctx.lineCap = 'round';
    const fuerza = cur.park * cur.o;
    for (const e of etiquetas) {
      if (!e.p) continue;
      const fx = e.px + e.w / 2, fy = e.py + e.h / 2;
      // Haz: más ancho y tenue en el ∞, fino y firme al llegar a la etiqueta
      const g = rctx.createLinearGradient(e.ax, e.ay, fx, fy);
      g.addColorStop(0, `rgba(${rgb},${(.9 * fuerza).toFixed(3)})`); g.addColorStop(1, `rgba(${rgb},${(.35 * fuerza * e.p).toFixed(3)})`);
      for (const [ancho, alfa] of [[7, .14], [1.4, 1]]) { rctx.globalAlpha = alfa; rctx.strokeStyle = g; rctx.lineWidth = ancho; rctx.beginPath(); rctx.moveTo(e.ax, e.ay); rctx.lineTo(fx, fy); rctx.stroke(); }
      rctx.globalAlpha = 1; rctx.fillStyle = `rgba(${rgb},${fuerza.toFixed(3)})`; rctx.beginPath(); rctx.arc(e.ax, e.ay, 2.6, 0, 7); rctx.fill();
    }
  }
  const azulCuenta = new THREE.Color(0x3d68ff), azulBrillo = new THREE.Color(0x1b3cff), tono = new THREE.Color();

  const poses = [...document.querySelectorAll('[data-pose]')].map(el => ({ el, tipo: el.dataset.pose }));
  const tray = document.querySelector('[data-trayectoria]');
  const ANCHO = 6.6; // ancho del ∞ en unidades del mundo
  let activa = 0, rayo = 1, nx = 0, ny = 0;
  document.addEventListener('etapa', e => { if (e.detail !== activa) { activa = e.detail; rayo = quieto() ? 1 : 0; armarEtiquetas(); } });
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
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1 : 1.25));
    renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    const d = Math.min(devicePixelRatio || 1, 1.25); lienzoRayos.width = innerWidth * d; lienzoRayos.height = innerHeight * d; rayosLimpio = false; forzar = true;
  };
  medir(); addEventListener('resize', medir);

  const anchoPx = (tipo, r) => tipo === 'portada' ? (innerWidth < 860 ? r.width * .92 : Math.min(r.width * .94, r.height * 1.52, 820)) : innerWidth > 860 ? Math.max(240, Math.min(r.width * .46, r.height * 1.25, innerWidth - 2 * (16 + 300) - 70)) : Math.min(r.width * .9, r.height * 1.8);
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
  // Alza por etapa (pedido del dueño, boceto rojo): la pieza activa sube, se acerca a cámara, se corre un poco hacia su lado
  // y crece; las demás vuelven a su lugar. El ∞ entero queda abajo de la zona para dejarle aire arriba.
  const ALZA = { arriba: 2.3, frente: .35, costado: .25, crece: .55 };
  let alzaArriba = ALZA.arriba;
  const textoCiclo = document.querySelector('.tray-pasos'), espectroCiclo = document.querySelector('.espectro');
  // Ancho de una columna de etiquetas: la etiqueta más ancha de la etapa, su escalonado y el aire hasta el tubo
  const columnaEtq = () => (etiquetas.length ? Math.max(...etiquetas.map(e => e.w)) : 220) + 30 + 34;
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
    // Sólo se vuelve a dibujar el 3D si algo se movió: con la página quieta la GPU descansa.
    let cambio = rayo < 1 || !!arrastre || Math.abs(vel) > 1e-4 || Math.abs(incl) > 1e-4;
    for (const [c, val] of [['x', px], ['y', py], ['s', o.s], ['o', o.o], ['park', wt], ['ry', ry], ['rx', rx]]) { const nuevo = mezclar(cur[c], val, k); if (Math.abs(nuevo - cur[c]) > 1e-5) cambio = true; cur[c] = nuevo; }
    // Piezas: la activa sube con su alza; el resto vuelve. Fuera del ciclo ninguna se mueve.
    piezas.forEach((pz, i) => {
      const meta = i === activa ? cur.park : 0, a = mezclar(pz.userData.alza, meta, quieto() ? 1 : .09);
      if (Math.abs(a - pz.userData.alza) > 1e-4) cambio = true;
      pz.userData.alza = a; const e = suave(a), m = pz.userData.medio;
      pz.position.set(m.x + Math.sign(m.x || 1) * ALZA.costado * e, m.y + alzaArriba * e, m.z + ALZA.frente * e);
      pz.scale.setScalar(1 + ALZA.crece * e);
    });
    grupo.scale.setScalar(cur.s); grupo.rotation.set(cur.rx, cur.ry, 0);
    grupo.position.set(cur.x, cur.y, 0); grupo.updateMatrixWorld();
    // En el ciclo el ∞ se apoya abajo de la zona (sobre el espectro), así la pieza que sube tiene aire hasta el texto.
    if (cur.park > .05) {
      const panel = textoCiclo?.getBoundingClientRect(), pie = espectroCiclo?.getBoundingClientRect(), u = unidad(), grosor = .42 * cur.s / u;
      let arriba = Infinity, abajo = -Infinity, izq = Infinity, der = -Infinity;
      for (let m = 0; m < 24; m++) { pantalla(curva.getPoint(m / 24, v), c2); arriba = Math.min(arriba, c2.y - grosor); abajo = Math.max(abajo, c2.y + grosor); izq = Math.min(izq, c2.x - grosor); der = Math.max(der, c2.x + grosor); }
      const tope = (panel ? panel.bottom : 0) + 4, piso = (pie ? pie.top : innerHeight) - 6;
      const dy = abajo - piso;
      // La pieza no sube más que el aire que queda entre el ∞ y el texto (lo que mide el tubo crecido incluido)
      const aire = (arriba - dy) - tope - (1 + ALZA.crece) * .55 * cur.s / u;
      alzaArriba = Math.max(.35, Math.min(ALZA.arriba, aire * u / cur.s));
      // En escritorio quedan libres las dos columnas de etiquetas, una a cada lado
      const col = enDesktop() ? columnaEtq() : 0, limIzq = 16 + col, limDer = innerWidth - 16 - col;
      let dx = 0; if (izq < limIzq && der > limDer) dx = (izq + der) / 2 - innerWidth / 2; else if (izq < limIzq) dx = izq - limIzq; else if (der > limDer) dx = der - limDer;
      if (dy || dx) { grupo.position.y += dy * u * cur.park; grupo.position.x -= dx * u * cur.park; grupo.updateMatrixWorld(); }
    }
    // Espectro: todos los tramos se ven tenues con su color; el de la etapa activa sale como un rayo que lo recorre y queda encendido.
    tramos.forEach((m, i) => {
      // La pieza que sube lleva su color a media luz, para que se siga viendo el cromo
      const si = i === activa, op = mezclar(m.material.opacity, cur.park * (si ? .55 : .5), k);
      if (Math.abs(op - m.material.opacity) > 1e-4) cambio = true;
      m.material.opacity = op;
      m.material.emissiveIntensity = si ? .22 + 1.2 * (1 - suave(rayo)) : .1;
      const n = si ? Math.max(6, Math.floor(m.userData.total * suave(rayo) / 6) * 6) : m.userData.total;
      m.geometry.setDrawRange(0, n);
    });
    puntoPieza(activa, suave(rayo), v); rayoLuz.position.copy(v.applyMatrix4(grupo.matrixWorld)); rayoLuz.position.z += .8;
    rayoLuz.color.setHex(ESPECTRO[activa]); rayoLuz.intensity = mezclar(rayoLuz.intensity, cur.park * (14 + 46 * (1 - rayo)), .3);
    // Cuentas: en la portada quietas sobre el ∞; en el ciclo, una en el centro de cada tramo. La activa no crece: se ilumina con su color.
    cuentas.forEach((c, i) => {
      // En el ciclo cada cuenta va en el medio de su pieza: si la pieza sube, la cuenta sube con ella
      curva.getPoint(i / 8, v); c.position.copy(v.lerp(b.copy(piezas[i].position), cur.park)); c.scale.setScalar(1 + .35 * suave(piezas[i].userData.alza));
      const si = cur.park > .5 && i === activa;
      tono.setHex(ESPECTRO[i]);
      c.material.color.lerpColors(azulCuenta, tono, si ? 1 : 0); c.material.emissive.lerpColors(azulBrillo, tono, si ? 1 : 0);
      c.material.emissiveIntensity = si ? 1.1 + .6 * (1 - suave(rayo)) : .8;
    });
    const op = cur.o.toFixed(3); if (capa.style.opacity !== op) capa.style.opacity = op;
    return cambio;
  }

  const tic = ahora => {
    if (document.hidden) { corriendo = false; return; }
    const cambio = paso(Math.min(.05, (ahora - antes) / 1000)); antes = ahora;
    if (cur.o > .004 && (cambio || forzar) && ahora - dibujado >= 16) { renderer.render(scene, camera); dibujado = ahora; forzar = false; }
    dibujarRayos(ahora);
    requestAnimationFrame(tic);
  };
  const arrancar = () => { if (corriendo) return; corriendo = true; antes = performance.now(); requestAnimationFrame(tic); };
  armarEtiquetas(); paso(0); renderer.render(scene, camera); raiz.dataset.tres = '';
  document.addEventListener('visibilitychange', arrancar);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); corriendo = false; delete raiz.dataset.tres; capa.style.opacity = 0; });
  canvas.addEventListener('webglcontextrestored', () => { raiz.dataset.tres = ''; arrancar(); });
  arrancar();
} catch (e) { delete raiz.dataset.tres; console.warn('∞ 3D no disponible:', e); }
