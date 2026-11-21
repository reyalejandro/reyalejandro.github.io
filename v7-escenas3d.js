// Gráficos en 3D (pedido del dueño: «mejorar la calidad de los gráficos, pasarlos de vectores 2D a objetos 3D»). Tres escenas
// con el mismo motor: arquitectura de la tienda (E250 vista explosionada + E376 vínculo causal), la carrera por la última
// unidad y el pipeline de Tsoft. Modelos con luz y material, cámara casi isométrica que se gira arrastrando y se mece con
// el mouse, y etiquetas HTML que siguen a cada modelo. Si no hay WebGL, queda el dibujo isométrico de antes.
// Arreglos de la skill: dibuja sólo si la escena se ve y algo cambió, DPR limitado, pausa con la pestaña oculta, contexto
// recuperable y estado final quieto con movimiento reducido.
const raiz = document.documentElement;
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.dataset.movimiento === 'off';
const cajas = [...document.querySelectorAll('[data-escena]')];
if (cajas.length) try {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const suave = x => 1 - (1 - x) ** 3, sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const caja3 = (w, h, d, r = .08) => new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
  // Paleta: la del sitio (azules oscuros con laca, azul eléctrico, cromo y LED verde)
  const M = {
    cuerpo: () => new THREE.MeshPhysicalMaterial({ color: 0x1f2858, roughness: .32, metalness: .25, clearcoat: .8, clearcoatRoughness: .2 }),
    tapa: () => new THREE.MeshPhysicalMaterial({ color: 0x34428c, roughness: .3, metalness: .2, clearcoat: .8 }),
    azul: () => new THREE.MeshPhysicalMaterial({ color: 0x2d5bff, roughness: .25, metalness: .3, clearcoat: 1, emissive: 0x1b3ad1, emissiveIntensity: .25 }),
    cromo: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .1, envMapIntensity: 1.8 }),
    led: c => new THREE.MeshBasicMaterial({ color: c ?? 0x7dffb8, toneMapped: false }),
    carton: () => new THREE.MeshStandardMaterial({ color: 0xc9a36b, roughness: .85 }),
    cinta: () => new THREE.MeshStandardMaterial({ color: 0xf2e4c8, roughness: .6 }),
  };
  const lienzoTex = (w, h, dibujar) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.repintar = () => { dibujar(c.getContext('2d'), w, h); t.needsUpdate = true; }; t.userData.repintar(); return t; };

  function motor(caja, armar) {
    const canvas = caja.querySelector('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x0a0f2a, .9));
    const sol = new THREE.DirectionalLight(0xffffff, 1.6); sol.position.set(-5, 9, 6); scene.add(sol);
    const azul = new THREE.PointLight(0x2d5bff, 18, 18); azul.position.set(3, 2.5, 4); scene.add(azul);
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    const mundo = new THREE.Group(); scene.add(mundo);
    const suelo = new THREE.GridHelper(16, 16, 0x3a4a9a, 0x1b2350); suelo.material.transparent = true; suelo.material.opacity = .35; mundo.add(suelo);
    const escena = armar({ mundo, caja });
    if (escena.fov) camera.fov = escena.fov; // la vista del pipeline, en primera persona, pide un ángulo más abierto
    const etiquetas = [...caja.querySelectorAll('[data-ancla]')].map(el => ({ el, ancla: escena.anclas[el.dataset.ancla] })).filter(e => e.ancla);
    let yaw = escena.yaw ?? -.62, pitch = escena.pitch ?? .62, metaYaw = yaw, extra = 0, mx = 0, my = 0, radio = escena.radio ?? 11;
    let sucio = true, enVista = false, corriendo = false, arr = null, antes = performance.now();
    const medir = () => { const w = caja.clientWidth, h = caja.clientHeight; if (!w || !h) return; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5)); renderer.setSize(w, h, false); camera.aspect = w / h; radio = (escena.radio ?? 11) * Math.max(1, 1.45 / camera.aspect) * (innerWidth < 700 ? 1.3 : 1); camera.updateProjectionMatrix(); sucio = true; };
    new ResizeObserver(medir).observe(caja); medir();
    caja.addEventListener('pointermove', e => { const r = caja.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; if (arr) { extra = arr.extra + (e.clientX - arr.x) * .008; } sucio = true; arrancar(); });
    caja.addEventListener('pointerleave', () => { mx = my = 0; arrancar(); });
    caja.addEventListener('pointerdown', e => { if (e.button || e.target.closest('button')) return; arr = { x: e.clientX, extra }; caja.setPointerCapture(e.pointerId); caja.toggleAttribute('data-arrastrando', true); });
    const soltar = () => { arr = null; caja.removeAttribute('data-arrastrando'); };
    caja.addEventListener('pointerup', soltar); caja.addEventListener('pointercancel', soltar);
    const v = new THREE.Vector3();
    function ubicarEtiquetas() {
      const w = caja.clientWidth, h = caja.clientHeight;
      for (const { el, ancla } of etiquetas) {
        (ancla.isVector3 ? v.copy(ancla) : ancla.getWorldPosition(v)).project(camera);
        el.style.setProperty('--x', ((v.x + 1) / 2 * w).toFixed(1) + 'px'); el.style.setProperty('--y', ((1 - v.y) / 2 * h).toFixed(1) + 'px');
      }
    }
    function cuadro(ahora) {
      if (!enVista || document.hidden) { corriendo = false; return; }
      const dt = Math.min(.05, (ahora - antes) / 1000); antes = ahora;
      const q = quieto(), k = q ? 1 : .08;
      metaYaw = (escena.yaw ?? -.62) + extra + (q ? 0 : mx * .18);
      const metaPitch = (escena.pitch ?? .62) + (q ? 0 : -my * .08);
      const dy = metaYaw - yaw, dp = metaPitch - pitch; yaw += dy * k; pitch += dp * k;
      camera.position.set(Math.sin(yaw) * Math.cos(pitch) * radio, Math.sin(pitch) * radio, Math.cos(yaw) * Math.cos(pitch) * radio).add(escena.mira ?? v.set(0, .6, 0));
      camera.lookAt(escena.mira ?? v.set(0, .6, 0));
      const anima = escena.tic ? escena.tic(ahora, dt, q) : false;
      if (sucio || anima || Math.abs(dy) + Math.abs(dp) > 1e-4) { renderer.render(scene, camera); ubicarEtiquetas(); sucio = false; }
      requestAnimationFrame(cuadro);
    }
    function arrancar() { if (corriendo || !enVista) return; corriendo = true; antes = performance.now(); requestAnimationFrame(cuadro); }
    new IntersectionObserver(([e]) => { enVista = e.isIntersecting; if (enVista) { sucio = true; arrancar(); } }, { rootMargin: '80px' }).observe(caja);
    document.addEventListener('visibilitychange', arrancar);
    escena.despertar = () => { sucio = true; arrancar(); };
    // Tocar un modelo es como tocar su etiqueta
    if (escena.tocables) {
      const rayo = new THREE.Raycaster(), p2 = new THREE.Vector2();
      caja.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        const r = caja.getBoundingClientRect(); p2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); rayo.setFromCamera(p2, camera);
        const hit = rayo.intersectObjects(escena.tocables, true)[0]; if (!hit) return;
        let o = hit.object; while (o && !o.userData.clave) o = o.parent; if (o) caja.querySelector(`[data-ancla="${o.userData.clave}"]`)?.click();
      });
    }
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); caja.removeAttribute('data-listo'); });
    canvas.addEventListener('webglcontextrestored', () => { caja.toggleAttribute('data-listo', true); escena.despertar(); });
    renderer.render(scene, camera); caja.toggleAttribute('data-listo', true);
    const titulo = caja.parentElement.querySelector('svg.iso title')?.textContent; if (titulo && !caja.querySelector('button')) { caja.setAttribute('role', 'img'); caja.setAttribute('aria-label', titulo); }
    return escena;
  }

  // ——— Arquitectura de la tienda: seis nodos con forma propia sobre una grilla; el elegido se ilumina y se separa en capas,
  // y por sus conexiones viajan paquetes de luz. Lo elige la misma lógica de recorrido de antes (atributo data-activo). ———
  const arq = document.querySelector('[data-escena="arquitectura"]');
  if (arq) motor(arq, ({ mundo }) => {
    const nodos = {}, anclas = {}, tocables = [];
    const nodo = (clave, x, z, alto) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.userData = { clave, act: 0, capas: [] }; mundo.add(g); nodos[clave] = g; tocables.push(g); anclas[clave] = new THREE.Object3D(); anclas[clave].position.set(0, alto, 0); g.add(anclas[clave]); return g; };
    const base = g => { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .04, 48), new THREE.MeshBasicMaterial({ color: 0x2d5bff, transparent: true, opacity: .12 })); b.position.y = .02; g.add(b); g.userData.base = b; };
    // Tienda: pantalla con la grilla del catálogo
    const tienda = nodo('tienda', -3.6, .2, 2.35); base(tienda);
    const catalogo = lienzoTex(256, 170, (c, w, h) => { c.fillStyle = '#0b1030'; c.fillRect(0, 0, w, h); for (let f = 0; f < 2; f++) for (let k = 0; k < 3; k++) { c.fillStyle = '#3d5bd8'; c.fillRect(18 + k * 78, 22 + f * 72, 64, 58); c.fillStyle = '#8fa6ff'; c.fillRect(18 + k * 78, 66 + f * 72, 40, 6); } });
    const pie = new THREE.Mesh(caja3(.9, .08, .6), M.cuerpo()); pie.position.y = .06; tienda.add(pie);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, .7, 16), M.cromo()); palo.position.y = .45; tienda.add(palo);
    const monitor = new THREE.Mesh(caja3(2, 1.35, .14, .07), M.cuerpo()); monitor.position.y = 1.4; tienda.add(monitor);
    const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.17), new THREE.MeshBasicMaterial({ map: catalogo, toneMapped: false })); pantalla.position.set(0, 1.4, .075); tienda.add(pantalla);
    // API de comercio: tres placas de servidor con LED; al elegirlas se separan
    const api = nodo('api', 0, 0, 2.1); base(api);
    for (let k = 0; k < 3; k++) {
      const placa = new THREE.Group(); placa.position.y = .22 + k * .42; api.add(placa); api.userData.capas.push(placa);
      placa.add(new THREE.Mesh(caja3(1.9, .32, 1.4, .06), M.cuerpo()));
      const tapa = new THREE.Mesh(caja3(1.86, .02, 1.36, .01), M.tapa()); tapa.position.y = .165; placa.add(tapa);
      for (let l = 0; l < 2; l++) { const led = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), M.led()); led.position.set(-.75 + l * .12, 0, .71); placa.add(led); }
      const raya = new THREE.Mesh(caja3(.5, .05, .02, .01), M.led(0x8fa6ff)); raya.position.set(.55, 0, .71); placa.add(raya);
    }
    // Base de datos: tres discos
    const datos = nodo('datos', 3.6, .2, 1.95); base(datos);
    for (let k = 0; k < 3; k++) { const disco = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .34, 48), M.cuerpo()); disco.position.y = .2 + k * .4; datos.add(disco); datos.userData.capas.push(disco); const aro = new THREE.Mesh(new THREE.TorusGeometry(.785, .015, 8, 48), M.led(0x8fa6ff)); aro.rotation.x = Math.PI / 2; aro.position.y = .17; disco.add(aro); }
    // Pagos: tarjeta azul con su logo, flotando
    const pagos = nodo('pagos', 1.7, -3.1, 1.25); base(pagos);
    const logo = lienzoTex(256, 160, (c, w, h) => { c.fillStyle = '#2d5bff'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.ellipse(64, 80, 34, 24, 0, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#fff'; c.font = '600 26px "IBM Plex Mono", monospace'; c.fillText('Mercado', 112, 74); c.fillText('Pago', 112, 104); c.fillStyle = '#ffd34d'; c.fillRect(20, 120, 40, 22); });
    const tarjeta = new THREE.Mesh(caja3(1.6, .07, 1, .05), [M.azul(), M.azul(), new THREE.MeshPhysicalMaterial({ map: logo, roughness: .3, clearcoat: 1 }), M.azul(), M.azul(), M.azul()]);
    tarjeta.position.y = .75; tarjeta.rotation.z = -.08; pagos.add(tarjeta); pagos.userData.flota = tarjeta;
    // Envíos: caja de cartón con cinta
    const envios = nodo('envios', -1.6, 3.1, 1.45); base(envios);
    const carton = new THREE.Mesh(caja3(1.05, .85, 1.05, .04), M.carton()); carton.position.y = .45; envios.add(carton);
    const cinta1 = new THREE.Mesh(new THREE.BoxGeometry(.18, .02, 1.07), M.cinta()); cinta1.position.y = .885; envios.add(cinta1);
    const cinta2 = new THREE.Mesh(new THREE.BoxGeometry(.18, .86, .02), M.cinta()); cinta2.position.set(0, .45, .535); envios.add(cinta2);
    // Operación: caja con antena y una señal que late
    const operacion = nodo('operacion', -3.1, -2.8, 1.95); base(operacion);
    const op = new THREE.Mesh(caja3(.95, .7, .95, .08), M.cuerpo()); op.position.y = .37; operacion.add(op);
    const antena = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 10), M.cromo()); antena.position.y = 1.07; operacion.add(antena);
    const senal = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), M.led(0x8fa6ff)); senal.position.y = 1.45; operacion.add(senal);
    const onda = new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 8, 40), new THREE.MeshBasicMaterial({ color: 0x8fa6ff, transparent: true })); onda.position.y = 1.45; operacion.add(onda);
    // Conexiones al API, por el suelo, y paquetes de luz que viajan por las del nodo elegido
    const CONEX = { e1: 'tienda', e2: 'datos', e3: 'pagos', e4: 'envios', e5: 'operacion' }, cables = {};
    for (const [id, clave] of Object.entries(CONEX)) {
      const a = nodos[clave].position, b = api.position, largo = a.distanceTo(b);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, largo, 8), new THREE.MeshBasicMaterial({ color: 0x2b3a7a, toneMapped: false }));
      cable.position.copy(a).add(b).multiplyScalar(.5).setY(.04); cable.rotation.z = Math.PI / 2; cable.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x); mundo.add(cable);
      const paquetes = [0, 1, 2].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 10), M.led(0xffffff)); p.visible = false; mundo.add(p); return p; });
      cables[id] = { cable, a, b, paquetes, clave };
    }
    const aristasDe = { tienda: ['e1'], datos: ['e2'], pagos: ['e3'], envios: ['e4'], operacion: ['e5'], api: ['e1', 'e2', 'e3', 'e4', 'e5'] };
    let activo = 'api';
    const caja = document.querySelector('[data-escena="arquitectura"]');
    const leer = () => { const b = caja.querySelector('.etq3d[data-activo]'); if (b) { activo = b.dataset.nodo; escenaArq.despertar?.(); } };
    new MutationObserver(leer).observe(caja.querySelector('.etiquetas3d'), { attributes: true, subtree: true, attributeFilter: ['data-activo'] });
    const escenaArq = {
      anclas, tocables, radio: 13.4, yaw: -.68, pitch: .62, mira: new THREE.Vector3(0, .55, 0),
      tic(ahora, dt, q) {
        let anima = !q; const t = ahora / 1000;
        for (const [clave, g] of Object.entries(nodos)) {
          const meta = clave === activo ? 1 : 0; g.userData.act += (meta - g.userData.act) * (q ? 1 : .1);
          const a = g.userData.act;
          g.userData.capas.forEach((c, k) => { c.position.y = (clave === 'api' ? .22 + k * .42 : .2 + k * .4) + k * .3 * suave(a); });
          g.userData.base.material.opacity = .1 + .28 * a; g.userData.base.scale.setScalar(1 + .12 * a);
          g.traverse(o => { if (o.material?.emissive && o.material.emissiveIntensity !== undefined && !o.material.map) o.material.emissiveIntensity = .05 + .4 * a; });
        }
        if (!q) { pagos.userData.flota.position.y = .75 + Math.sin(t * 1.6) * .06; const f = (t * .8) % 1; onda.scale.setScalar(1 + f * 2.5); onda.material.opacity = 1 - f; senal.material.color.setHSL(.63, .9, .6 + .2 * Math.sin(t * 4)); }
        const vivas = aristasDe[activo] || [];
        for (const [id, c] of Object.entries(cables)) {
          const si = vivas.includes(id); c.cable.material.color.setHex(si ? 0x8fa6ff : 0x2b3a7a);
          c.paquetes.forEach((p, k) => { p.visible = si && !q; if (!p.visible) return; const f = ((t * .7) + k / 3) % 1, desde = activo === 'api' ? c.b : c.a, hacia = activo === 'api' ? c.a : c.b; p.position.lerpVectors(desde, hacia, f).setY(.12 + Math.sin(f * Math.PI) * .25); });
        }
        return anima;
      },
    };
    return escenaArq;
  });

  // ——— La última unidad: dos compradores, Medusa en el medio y una sola caja. Corre cuando la figura recibe
  // data-reproduciendo (la misma lógica de antes, con su sonido e ícono de pestaña). ———
  const car = document.querySelector('[data-escena="carrera"]');
  if (car) motor(car, ({ mundo }) => {
    const anclas = {};
    const terminal = (x, z, color) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); mundo.add(g);
      const pie = new THREE.Mesh(caja3(1.3, .1, .8, .05), M.cuerpo()); pie.position.y = .05; g.add(pie);
      const tex = lienzoTex(256, 180, (c, w, h) => { c.fillStyle = '#0b1030'; c.fillRect(0, 0, w, h); c.fillStyle = color; c.globalAlpha = .4; c.fillRect(20, 20, w - 40, 10); c.fillRect(20, 44, w - 90, 10); c.globalAlpha = 1; });
      const pant = new THREE.Mesh(caja3(1.5, 1.05, .12, .06), [M.cuerpo(), M.cuerpo(), M.cuerpo(), M.cuerpo(), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), M.cuerpo()]);
      pant.position.y = .75; g.add(pant); g.userData.tex = tex; return g;
    };
    const A = terminal(-3.3, -.6, '#8fa6ff'), B = terminal(3.3, -.6, '#c9b8ff');
    A.rotation.y = .18; B.rotation.y = -.42;
    const servidor = new THREE.Group(); servidor.position.set(0, 0, .8); mundo.add(servidor);
    for (let k = 0; k < 2; k++) { const placa = new THREE.Mesh(caja3(1.8, .38, 1.4, .06), M.cuerpo()); placa.position.y = .22 + k * .46; servidor.add(placa); const led = new THREE.Mesh(new THREE.SphereGeometry(.04, 10, 8), M.led()); led.position.set(-.75, .22 + k * .46, .71); servidor.add(led); }
    const unidad = new THREE.Mesh(caja3(.5, .5, .5, .05), M.cromo()); unidad.position.set(0, 1.18, .8); mundo.add(unidad);
    const pedidos = [A, B].map(() => { const p = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), M.led(0xffffff)); p.visible = false; mundo.add(p); return p; });
    anclas.a = new THREE.Vector3(-3.3, 1.75, -.6); anclas.b = new THREE.Vector3(3.3, 1.75, -.6); anclas.m = new THREE.Vector3(0, 2.05, .8);
    const fig = car.closest('[data-secuencia]') || car.parentElement;
    let t0 = null, terminado = false;
    const pintarPantalla = (g, tipo) => {
      const tex = g.userData.tex, c = tex.image.getContext('2d'), w = 256, h = 180;
      c.fillStyle = '#0b1030'; c.fillRect(0, 0, w, h);
      if (tipo === 'ok') { c.fillStyle = '#2d5bff'; c.beginPath(); c.arc(128, 92, 52, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(104, 92); c.lineTo(122, 112); c.lineTo(156, 74); c.stroke(); }
      else if (tipo === 'no') { c.strokeStyle = '#ff6b8b'; c.lineWidth = 8; c.beginPath(); c.arc(128, 92, 50, 0, 7); c.stroke(); c.lineWidth = 12; c.lineCap = 'round'; c.beginPath(); c.moveTo(108, 72); c.lineTo(148, 112); c.moveTo(148, 72); c.lineTo(108, 112); c.stroke(); }
      else { c.fillStyle = '#8fa6ff'; c.globalAlpha = .4; c.fillRect(20, 20, w - 40, 10); c.fillRect(20, 44, w - 90, 10); c.globalAlpha = 1; }
      tex.needsUpdate = true;
    };
    const reiniciar = () => { t0 = null; terminado = false; unidad.position.set(0, 1.18, .8); unidad.visible = true; pedidos.forEach(p => { p.visible = false; }); pintarPantalla(A, ''); pintarPantalla(B, ''); car.removeAttribute('data-stock0'); };
    const final = () => { terminado = true; unidad.visible = false; pedidos.forEach(p => { p.visible = false; }); pintarPantalla(A, 'ok'); pintarPantalla(B, 'no'); car.toggleAttribute('data-stock0', true); };
    const escena = {
      anclas, radio: 8.6, yaw: -.18, pitch: .42, mira: new THREE.Vector3(0, .75, 0),
      tic(ahora, dt, q) {
        if (t0 === null) return false;
        if (q) { if (!terminado) final(); return false; }
        const t = (ahora - t0) / 1000, desdeA = new THREE.Vector3(-3.3, 1.05, -.6), desdeB = new THREE.Vector3(3.3, 1.05, -.6), medio = new THREE.Vector3(0, 1.2, .8);
        pedidos.forEach((p, k) => { const f = sstep(k * .12, k * .12 + .8, t); p.visible = f > 0 && f < 1; p.position.lerpVectors(k ? desdeB : desdeA, medio, f).y += Math.sin(f * Math.PI) * .6; });
        if (t > 1.05) { car.toggleAttribute('data-stock0', true); const f = sstep(1.15, 1.85, t); unidad.position.lerpVectors(medio, desdeA, f).y += Math.sin(f * Math.PI) * 1.1 + .1; unidad.rotation.y = f * Math.PI; unidad.visible = f < .98; }
        if (t > 1.85 && t < 1.9) pintarPantalla(A, 'ok');
        if (t > 2.25) { pintarPantalla(B, 'no'); final(); t0 = null; }
        return true;
      },
    };
    new MutationObserver(() => { if (fig.hasAttribute('data-reproduciendo')) { reiniciar(); t0 = performance.now(); escena.despertar?.(); } }).observe(fig, { attributes: true, attributeFilter: ['data-reproduciendo'] });
    reiniciar(); if (quieto()) final();
    return escena;
  });

  // ——— Pipeline de Tsoft (pedido del dueño, boceto «rueda de mouse para abajo = se mueve la cinta»): vista desde atrás del
  // paquete, que va en primer plano sobre la cinta. Al bajar con la rueda la cinta avanza y el paquete pasa por debajo de
  // cada gate (01 Código, 02 Build, 03 Pruebas, 04 Nube), con su cartel arriba. Al cruzar uno, su cortina de luz destella,
  // el cartel se enciende y el paquete cambia: crudo → compilado → probado (verde) → en la nube (azul). ———
  const pipe = document.querySelector('[data-escena="pipeline"]');
  if (pipe) motor(pipe, ({ mundo, caja }) => {
    const anclas = {};
    mundo.children[0].visible = false; // la grilla del motor no se mueve: esta escena trae la suya, que corre con la cinta
    const CLAVES = ['codigo', 'build', 'pruebas', 'nube'], GAP = 4.2, D0 = 3.4, LARGO = D0 + GAP * 3 + 6;
    const viaje = D0 + GAP * 3 + 1.6; // lo que avanza la cinta de punta a punta (el último gate queda atrás del paquete)
    const marco = M.cuerpo();
    // Bastidor fijo a los costados y, adentro, todo lo que corre: tablillas, grilla del piso y gates
    for (const x of [-.72, .72]) { const riel = new THREE.Mesh(caja3(.12, .3, LARGO + 6, .04), marco); riel.position.set(x, .15, -LARGO / 2 + 3); mundo.add(riel); }
    const corre = new THREE.Group(); mundo.add(corre);
    const tablaGeo = caja3(1.32, .08, .32, .03), tablaMat = new THREE.MeshStandardMaterial({ color: 0x232c5e, roughness: .55, metalness: .2 });
    for (let z = 3; z > -LARGO - viaje; z -= .42) { const t = new THREE.Mesh(tablaGeo, tablaMat); t.position.set(0, .26, z); corre.add(t); }
    const piso = new THREE.GridHelper(48, 48, 0x3a4a9a, 0x1b2350); piso.material.transparent = true; piso.material.opacity = .3; piso.position.z = -20; corre.add(piso);
    const COLORES = [0x9b7bff, 0x4d7cff, 0x2ee6a8, 0x2d5bff];
    const gates = CLAVES.map((clave, k) => {
      const g = new THREE.Group(); g.position.z = -(D0 + GAP * k); corre.add(g);
      for (const x of [-.86, .86]) { const pilar = new THREE.Mesh(caja3(.16, 1.9, .16, .04), M.cuerpo()); pilar.position.set(x, .95, 0); g.add(pilar); }
      const viga = new THREE.Mesh(caja3(2.1, .26, .3, .06), k === 3 ? M.azul() : M.cromo()); viga.position.y = 1.95; g.add(viga);
      const cortina = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 1.6), new THREE.MeshBasicMaterial({ color: COLORES[k], transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      cortina.position.y = .98; g.add(cortina);
      const tira = new THREE.Mesh(new THREE.BoxGeometry(1.7, .05, .05), M.led(COLORES[k])); tira.position.set(0, 1.8, .16); g.add(tira);
      const ancla = new THREE.Object3D(); ancla.position.y = 2.42; g.add(ancla); anclas[clave] = ancla;
      return { g, cortina, tira };
    });
    // El paquete: en primer plano, quieto respecto de la cámara (lo que se mueve es el mundo)
    const estados = [
      new THREE.MeshStandardMaterial({ color: 0xc9a36b, roughness: .85 }), // crudo: cartón
      new THREE.MeshStandardMaterial({ color: 0xd8b77f, roughness: .7, emissive: 0x4d7cff, emissiveIntensity: .12 }), // compilado
      new THREE.MeshPhysicalMaterial({ color: 0xe9fff4, roughness: .3, clearcoat: 1, emissive: 0x2ee6a8, emissiveIntensity: .35 }), // probado
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .2, clearcoat: 1, emissive: 0x2d5bff, emissiveIntensity: .45 }), // en la nube
    ];
    const paquete = new THREE.Group(); paquete.position.set(0, .64, 0); paquete.scale.setScalar(1.25); mundo.add(paquete);
    const cuerpo = new THREE.Mesh(caja3(.62, .52, .62, .05), estados[0]); paquete.add(cuerpo);
    const cinta = new THREE.Mesh(caja3(.64, .53, .12, .02), M.cinta()); paquete.add(cinta);
    const carteles = CLAVES.map(c => caja.querySelector(`[data-ancla="${c}"]`));
    let prog = 0, meta = 0, t = 0, estado = -1;
    const objetivo = () => { const r = caja.getBoundingClientRect(), H = innerHeight; return Math.min(1, Math.max(0, (H * .9 - r.top) / (H * .78))); };
    const colocar = () => {
      corre.position.z = prog * viaje;
      let pasados = 0;
      gates.forEach(({ g, cortina, tira }, k) => {
        const z = g.position.z + corre.position.z; // dónde está el gate respecto del paquete (0 = encima)
        if (z > 0) pasados = k + 1;
        cortina.material.opacity = Math.max(0, .55 - Math.abs(z) * .5);
        tira.scale.x = z > 0 ? 1 : .35 + .65 * Math.max(0, 1 - Math.abs(z) / GAP);
        const el = carteles[k]; if (!el) return;
        // Sólo el cartel del próximo gate (los lejanos se apilaban en el horizonte); se va al pasar por encima del paquete
        const ver = z > -GAP * 1.05 && z < .6; el.style.opacity = ver ? Math.min(1, (.6 - z) * 2, (z + GAP * 1.05) * 1.2).toFixed(2) : '0';
        el.toggleAttribute('data-activo', z > -GAP * .55 && z < .9);
      });
      const nuevo = Math.max(0, pasados - 1);
      if (nuevo !== estado) { estado = nuevo; cuerpo.material = estados[pasados ? nuevo : 0]; }
      paquete.position.y = .7 + Math.sin(t * 2.2) * .015; paquete.rotation.y = Math.sin(t * .9) * .05;
    };
    meta = prog = objetivo(); colocar();
    return {
      // Cámara detrás y un poco arriba del paquete, mirando a lo largo de la cinta
      anclas, fov: 48, radio: 5.6, yaw: 0, pitch: .42, mira: new THREE.Vector3(0, .8, -2.3),
      tic(ahora, dt, q) {
        meta = objetivo();
        const antes = prog; prog = q ? meta : prog + (meta - prog) * (1 - Math.pow(.86, dt * 60));
        if (!q) t += dt;
        colocar();
        return !q || Math.abs(prog - antes) > 1e-5;
      },
    };
  });
} catch (e) { console.warn('Escenas 3D no disponibles:', e); }
