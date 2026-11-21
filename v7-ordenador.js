// Contacto · una computadora retro en 3D que mira al mouse (pedido del dueño: «un modelo 3D… que sigue su cabeza con la
// posición del mouse… pero en vez de ser una persona es un ordenador»). Reemplaza al metal líquido (E009), que no decía nada.
// Base: E261 (objeto-mascota 3D) + la inclinación hacia el puntero de los retoques. El monitor es la cabeza: gira sobre el
// cuello hacia el cursor con interpolación; en la pantalla, dos ojos de píxel miran al mouse y parpadean, y abajo dice
// «escribime_». El teclado queda quieto.
// Arreglos de la skill: dibuja sólo si la sección se ve y algo cambió, DPR limitado, pausa con la pestaña oculta,
// quieto (de frente, sin parpadeo) con movimiento reducido, y nada si no hay WebGL.
const caja = document.querySelector('[data-ordenador]');
const raiz = document.documentElement;
const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.dataset.movimiento === 'off';
if (caja) try {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const canvas = caja.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 50); camera.position.set(0, .35, 9.2); camera.lookAt(0, .1, 0);
  const luz = new THREE.DirectionalLight(0xffffff, 1.4); luz.position.set(-3, 5, 6); scene.add(luz);
  const brillo = new THREE.PointLight(0x8fa6ff, 6, 8); brillo.position.set(0, .6, 2.2); scene.add(brillo); // la pantalla ilumina la cara del frente

  const plastico = new THREE.MeshPhysicalMaterial({ color: 0xf1efe8, roughness: .32, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.1 });
  const oscuro = new THREE.MeshPhysicalMaterial({ color: 0x15182a, roughness: .5, clearcoat: .6 });
  const cromo = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: .1, envMapIntensity: 1.8 });

  // Pantalla: un lienzo 2D como textura (ojos y texto), con líneas de barrido y un velo de vidrio curvo
  const L = document.createElement('canvas'); L.width = 512; L.height = 384;
  const c = L.getContext('2d'), pantallaTex = new THREE.CanvasTexture(L); pantallaTex.colorSpace = THREE.SRGBColorSpace;
  let ojoX = 0, ojoY = 0, metaOjoX = 0, metaOjoY = 0, parpado = 1, cursorVisible = true;
  const VERDE = '#9fe8ff';
  function dibujarPantalla(ahora) {
    c.fillStyle = '#071027'; c.fillRect(0, 0, 512, 384);
    const g = c.createRadialGradient(256, 170, 20, 256, 190, 300); g.addColorStop(0, 'rgba(70,110,255,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 512, 384);
    c.fillStyle = VERDE; c.shadowColor = VERDE; c.shadowBlur = 18;
    // Ojos: dos bloques de píxel que se corren hacia el mouse; el parpadeo los achata
    const alto = 74 * parpado, ox = ojoX * 34, oy = ojoY * 22;
    for (const x of [178, 334]) c.fillRect(x - 21 + ox, 150 - alto / 2 + oy, 42, Math.max(4, alto));
    c.shadowBlur = 10; c.font = '600 34px "IBM Plex Mono", ui-monospace, monospace'; c.textAlign = 'center';
    const en = raiz.lang === 'en', texto = en ? 'write to me' : 'escribime';
    c.fillText(texto + (cursorVisible ? '_' : ' '), 256, 290);
    c.shadowBlur = 0; c.fillStyle = 'rgba(0,0,0,.22)';
    for (let y = 0; y < 384; y += 4) c.fillRect(0, y, 512, 1.4);
    pantallaTex.needsUpdate = true;
  }

  const ordenador = new THREE.Group(), cabeza = new THREE.Group(); scene.add(ordenador);
  // Teclado y base: quietos
  const teclado = new THREE.Mesh(new RoundedBoxGeometry(2.9, .22, 1.05, 4, .08), plastico); teclado.position.set(0, -1.62, 1.15); ordenador.add(teclado);
  const teclaGeo = new RoundedBoxGeometry(.19, .08, .17, 2, .03), teclas = new THREE.InstancedMesh(teclaGeo, oscuro, 4 * 12), m4 = new THREE.Matrix4();
  for (let f = 0, n = 0; f < 4; f++) for (let k = 0; k < 12; k++, n++) { m4.makeTranslation(-1.17 + k * .213 + (f % 2) * .05, -1.48, .78 + f * .21); teclas.setMatrixAt(n, m4); }
  ordenador.add(teclas);
  const pie = new THREE.Mesh(new RoundedBoxGeometry(1.5, .16, 1.2, 4, .07), plastico); pie.position.set(0, -1.5, -.25); ordenador.add(pie);
  const cuello = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .55, 24), cromo); cuello.position.set(0, -1.18, -.25); ordenador.add(cuello);
  // Cabeza: el monitor, que gira sobre el cuello
  cabeza.position.set(0, -.9, -.25); ordenador.add(cabeza);
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(2.7, 2.2, 1.7, 6, .26), plastico); cuerpo.position.set(0, 1.12, 0); cabeza.add(cuerpo);
  const marco = new THREE.Mesh(new RoundedBoxGeometry(2.25, 1.72, .12, 4, .1), oscuro); marco.position.set(0, 1.2, .82); cabeza.add(marco);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(2.02, 1.5), new THREE.MeshBasicMaterial({ map: pantallaTex, toneMapped: false })); pantalla.position.set(0, 1.2, .885); cabeza.add(pantalla);
  const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 1.52), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: .14, roughness: .05, clearcoat: 1, metalness: 0, envMapIntensity: 1.6 })); vidrio.position.set(0, 1.2, .9); cabeza.add(vidrio);
  const ranura = new THREE.Mesh(new RoundedBoxGeometry(.7, .06, .05, 2, .02), oscuro); ranura.position.set(.55, .28, .86); cabeza.add(ranura);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 8), new THREE.MeshBasicMaterial({ color: 0x7dffb8 })); led.position.set(-.95, .28, .86); cabeza.add(led);
  ordenador.rotation.y = -.35; ordenador.position.y = .25;

  const medir = () => {
    const w = caja.clientWidth, h = caja.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 1.25 : 1.5)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix(); sucio = true;
  };
  // Mirada: hacia el mouse en toda la página (más fuerte cerca), con interpolación; quieto de frente con movimiento reducido
  let mx = 0, my = 0, yaw = 0, pitch = 0, sucio = true, enVista = false, corriendo = false, proximoParpadeo = performance.now() + 2500;
  addEventListener('pointermove', e => {
    const r = caja.getBoundingClientRect(), cx = r.left + r.width * .5, cy = r.top + r.height * .42;
    mx = Math.max(-1, Math.min(1, (e.clientX - cx) / (innerWidth * .5))); my = Math.max(-1, Math.min(1, (e.clientY - cy) / (innerHeight * .5)));
  }, { passive: true });
  function cuadro(ahora) {
    if (!enVista || document.hidden) { corriendo = false; return; }
    const k = quieto() ? 1 : .085, metaYaw = quieto() ? .35 : mx * .75 + .35, metaPitch = quieto() ? 0 : my * .38;
    const antesYaw = yaw, antesPitch = pitch;
    yaw += (metaYaw - yaw) * k; pitch += (metaPitch - pitch) * k;
    cabeza.rotation.set(pitch, yaw, -mx * .05 * (quieto() ? 0 : 1));
    metaOjoX = quieto() ? 0 : mx; metaOjoY = quieto() ? 0 : my;
    ojoX += (metaOjoX - ojoX) * .18; ojoY += (metaOjoY - ojoY) * .18;
    // Parpadeo cada 2,5 a 6 s (150 ms) y cursor de terminal que titila cada 530 ms
    if (!quieto() && ahora > proximoParpadeo) { const p = (ahora - proximoParpadeo) / 150; parpado = p < 1 ? Math.abs(1 - p * 2) : 1; if (p >= 1) proximoParpadeo = ahora + 2500 + Math.random() * 3500; }
    const cv = quieto() || Math.floor(ahora / 530) % 2 === 0; if (cv !== cursorVisible) { cursorVisible = cv; sucio = true; }
    if (Math.abs(yaw - antesYaw) + Math.abs(pitch - antesPitch) > 1e-4 || parpado < 1 || Math.abs(metaOjoX - ojoX) > 1e-3) sucio = true;
    if (sucio) { dibujarPantalla(ahora); renderer.render(scene, camera); sucio = false; }
    requestAnimationFrame(cuadro);
  }
  const arrancar = () => { if (corriendo || !enVista) return; corriendo = true; requestAnimationFrame(cuadro); };
  new ResizeObserver(medir).observe(caja); medir();
  new IntersectionObserver(([e]) => { enVista = e.isIntersecting; if (enVista) { sucio = true; arrancar(); } }).observe(caja);
  document.addEventListener('visibilitychange', arrancar);
  document.addEventListener('idioma', () => { sucio = true; });
  dibujarPantalla(0); renderer.render(scene, camera); caja.toggleAttribute('data-listo', true);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); caja.removeAttribute('data-listo'); });
  canvas.addEventListener('webglcontextrestored', () => { caja.toggleAttribute('data-listo', true); sucio = true; arrancar(); });
} catch (e) { caja.removeAttribute('data-listo'); console.warn('Computadora 3D no disponible:', e); }
