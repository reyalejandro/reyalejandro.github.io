// v7 «Cromo vivo» (sobre la v6 «Cromo»). Comportamiento de la página: idioma, sonido, movimiento, entradas, prompts del catálogo y retoques.
const raiz = document.documentElement;
raiz.dataset.vivo = '';
const sistemaQuieto = matchMedia('(prefers-reduced-motion: reduce)');
const quieto = () => sistemaQuieto.matches || raiz.dataset.movimiento === 'off';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ——— Movimiento reducido propio (E259), además del del sistema ———
const botonMov = $('[data-movimiento]');
try { if (localStorage.getItem('cv6-movimiento') === 'off') raiz.dataset.movimiento = 'off'; } catch {}
const rotularMov = () => botonMov.setAttribute('aria-pressed', String(quieto()));
botonMov.addEventListener('click', () => {
  if (raiz.dataset.movimiento === 'off') delete raiz.dataset.movimiento; else raiz.dataset.movimiento = 'off';
  try { localStorage.setItem('cv6-movimiento', raiz.dataset.movimiento || 'sistema'); } catch {}
  rotularMov(); document.dispatchEvent(new Event('movimiento'));
});
rotularMov();

// ——— Sonido (E316, E341, E319–E322): sprite CC0 de Kenney incrustado (anda también con file://).
// Se activa con el primer clic o tecla, salvo que el visitante lo haya silenciado; la elección queda guardada.
const SPRITE = { click: [0, .097], on: [.247, .395], off: [.792, .622], success: [1.564, .29], error: [2.003, .162], case: [2.315, .1] };
const SPRITE_B64 = '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VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tSxKGDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1LEoYPAAAGkAAAAIAAANIAAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//tQxKIDwAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UsShg8AAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
const botonSonido = $('[data-sonido]'), textoSonido = $('[data-sonido-texto]');
let audio = null, sprite = null, sonidoOn = false, ultimoTic = 0;
function sonar(nombre, { tono = 1, vol } = {}) {
  if (!sonidoOn || !sprite || !SPRITE[nombre]) return;
  const [inicio, dur] = SPRITE[nombre], f = audio.createBufferSource(), v = audio.createGain();
  v.gain.value = vol ?? (nombre === 'click' ? .32 : .5); f.playbackRate.value = tono; f.buffer = sprite; f.connect(v).connect(audio.destination); f.start(0, inicio, dur);
}
// Tic al pasar sobre un control: agudo, bajo y con un mínimo de 70 ms entre uno y otro.
const tic = (tono = 1.7) => { const ahora = performance.now(); if (ahora - ultimoTic < 70) return; ultimoTic = ahora; sonar('click', { tono, vol: .1 }); };
const rotularSonido = estado => {
  botonSonido.dataset.estado = estado; botonSonido.setAttribute('aria-pressed', String(estado === 'on'));
  textoSonido.textContent = estado === 'on' ? t('Silenciar', 'Mute') : estado === 'error' ? t('Reintentar sonido', 'Retry sound') : t('Activar sonido', 'Turn sound on');
};
const preferencia = () => { try { return localStorage.getItem('cv-sonido'); } catch { return null; } };
const guardar = v => { try { localStorage.setItem('cv-sonido', v); } catch {} };
async function encender(conAviso) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)(); await audio.resume();
    sprite ??= await audio.decodeAudioData(Uint8Array.from(atob(SPRITE_B64), c => c.charCodeAt(0)).buffer);
    sonidoOn = true; rotularSonido('on'); if (conAviso) sonar('on');
  } catch { sonidoOn = false; rotularSonido('error'); }
}
botonSonido.addEventListener('click', () => {
  if (sonidoOn) { sonar('off'); sonidoOn = false; guardar('off'); rotularSonido('off'); return; }
  guardar('on'); encender(true);
});
const primerGesto = e => {
  removeEventListener('pointerdown', primerGesto, true); removeEventListener('keydown', primerGesto, true);
  if (e.target.closest?.('[data-sonido]')) return;
  if (preferencia() !== 'off') encender(false);
};
addEventListener('pointerdown', primerGesto, true); addEventListener('keydown', primerGesto, true);
document.addEventListener('click', e => {
  const a = e.target.closest('a[href], button'); if (!a || a === botonSonido || a.matches('[data-copiar], [download], [data-etapa], [data-celular-accion]')) return;
  sonar('click');
}, true);
document.addEventListener('pointerover', e => { const c = e.target.closest('a[href], button, [data-nodo]'); if (c && !c.contains(e.relatedTarget)) tic(); });
$$('a[download]').forEach(a => a.addEventListener('click', () => sonar('success')));

// ——— Idioma: español en la página, inglés en data-en; el cambio usa View Transitions si existe ———
const traducibles = $$('[data-en], [data-aria-en], [data-alt-en]').map(el => ({ el, es: el.dataset.en !== undefined ? el.textContent : null, aria: el.getAttribute('aria-label'), alt: el.getAttribute('alt') }));
let ingles = false;
function t(es, en) { return ingles ? en : es; }
function aplicarIdioma() {
  ingles = new URL(location.href).searchParams.get('lang') === 'en';
  raiz.lang = t('es', 'en');
  for (const { el, es, aria, alt } of traducibles) {
    if (es !== null) el.textContent = t(es, el.dataset.en);
    if (el.dataset.ariaEn) el.setAttribute('aria-label', t(aria, el.dataset.ariaEn));
    if (el.dataset.altEn) el.alt = t(alt, el.dataset.altEn);
  }
  const enlace = $('[data-idioma]'), sig = new URL(location.href);
  sig.searchParams.set('lang', t('en', 'es')); enlace.href = sig; enlace.hreflang = t('en', 'es'); enlace.setAttribute('aria-checked', String(ingles));
  rotularSonido(botonSonido.dataset.estado || 'off'); document.dispatchEvent(new Event('idioma'));
}
$('[data-idioma]').addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault(); history.pushState(null, '', e.currentTarget.href);
  if (document.startViewTransition && !quieto()) document.startViewTransition(aplicarIdioma); else aplicarIdioma();
});
addEventListener('popstate', aplicarIdioma);
// El interruptor también responde a la barra espaciadora, como cualquier switch
$('[data-idioma]').addEventListener('keydown', e => { if (e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } });

// ——— Entradas con respaldo: los títulos suben al verse; sin JS ya están visibles ———
const titulos = $$('.titulo');
const verTitulos = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.toggleAttribute('data-visto', true); verTitulos.unobserve(e.target); } }), { threshold: .25 });
titulos.forEach(h => verTitulos.observe(h));
requestAnimationFrame(() => requestAnimationFrame(() => { if (quieto()) titulos.forEach(h => h.toggleAttribute('data-visto', true)); }));

// ——— E013 · marquesina: base 40 px/s, factor 1 + min(|Δscroll|/16, 4) con lerp .1, pausa con el mouse ———
(function marquesina() {
  const caja = $('[data-marquesina]'); if (!caja) return;
  const filas = $$('.fila', caja).map(fila => {
    const pista = $('.pista', fila); pista.innerHTML += pista.innerHTML + pista.innerHTML;
    const f = { pista, x: 0, lado: Number(fila.dataset.lado), pausa: false, w: pista.scrollWidth / 3 };
    fila.addEventListener('pointerenter', () => { f.pausa = true; }); fila.addEventListener('pointerleave', () => { f.pausa = false; });
    return f;
  });
  const anchos = () => filas.forEach(f => { f.w = f.pista.scrollWidth / 3; });
  addEventListener('resize', anchos); document.fonts?.ready.then(anchos);
  let factor = 1, objetivo = 1, sentido = 1, ultimo = scrollY, antes = 0, enVista = false;
  addEventListener('scroll', () => { const d = scrollY - ultimo; ultimo = scrollY; objetivo = 1 + Math.min(Math.abs(d) / 16, 4); if (d) sentido = d > 0 ? 1 : -1; }, { passive: true });
  const mover = ahora => {
    if (!enVista || quieto()) return;
    const dt = Math.min(.05, (ahora - antes) / 1000); antes = ahora;
    factor += (objetivo - factor) * .1; objetivo += (1 - objetivo) * .1;
    for (const f of filas) {
      if (f.pausa) continue;
      const w = f.w; f.x -= f.lado * sentido * 40 * factor * dt; // ancho medido una vez: leer scrollWidth en cada cuadro forzaba layout
      if (f.x <= -w) f.x += w; if (f.x > 0) f.x -= w;
      f.pista.style.transform = `translate3d(${f.x}px,0,0)`;
    }
    requestAnimationFrame(mover);
  };
  new IntersectionObserver(([e]) => { const ya = enVista; enVista = e.isIntersecting; if (enVista && !ya) { antes = performance.now(); requestAnimationFrame(mover); } }).observe(caja);
  document.addEventListener('movimiento', () => { if (!quieto() && enVista) { antes = performance.now(); requestAnimationFrame(mover); } });
})();

// ——— E058 + E083 · arquitectura con haces y celular con capturas, con un solo reloj de 4,2 s y botón de pausa ———
(function escenario() {
  const descripciones = {
    tienda: [['Tienda', 'Store'], ['Catálogo, carrito de invitado y cupones en Astro y TypeScript.', 'Catalog, guest cart and coupons in Astro and TypeScript.']],
    api: [['API de comercio', 'Commerce API'], ['El servidor decide el precio, el stock y los descuentos: el navegador nunca fija un total.', 'The server decides price, stock and discounts: the browser never sets a total.']],
    datos: [['Base de datos', 'Database'], ['PostgreSQL guarda el catálogo, los pedidos y los clientes.', 'PostgreSQL stores the catalog, orders and customers.']],
    pagos: [['Pagos', 'Payments'], ['Mercado Pago Checkout Pro con conciliación e idempotencia: un reintento no cobra dos veces.', 'Mercado Pago Checkout Pro with reconciliation and idempotency: a retry never charges twice.']],
    envios: [['Envíos', 'Shipping'], ['Con el código postal se cotiza el envío.', 'Shipping is quoted from the postcode.']],
    operacion: [['Operación', 'Operations'], ['Automatizaciones en n8n y errores avisados por Sentry.', 'Automations in n8n and errors reported by Sentry.']],
  };
  const aristas = { tienda: ['e1'], api: ['e1', 'e2', 'e3', 'e4', 'e5'], datos: ['e2'], pagos: ['e3'], envios: ['e4'], operacion: ['e5'] };
  const orden = ['api', 'tienda', 'pagos', 'envios', 'datos', 'operacion'];
  const titulo = $('[data-arq-titulo]'), texto = $('[data-arq-texto]'), pausa = $('[data-arq-pausa]');
  const fotos = $$('[data-celular] img');
  let i = 0, actual = 'api', reloj = null, tomado = false;
  const viajar = id => $$(`[data-haz="${id}"]`).forEach(h => { if (quieto() || !h.getBoundingClientRect().width) return; h.removeAttribute('data-viaja'); h.getBoundingClientRect(); h.toggleAttribute('data-viaja', true); });
  function mostrar(clave) {
    actual = clave;
    $$('[data-nodo]').forEach(g => g.toggleAttribute('data-activo', g.dataset.nodo === clave));
    $$('.arq .arista').forEach(a => a.toggleAttribute('data-activa', aristas[clave].includes(a.id.slice(2))));
    aristas[clave].forEach(viajar);
    const [ti, de] = descripciones[clave]; titulo.textContent = t(...ti); texto.textContent = t(...de);
  }
  const pasar = () => { mostrar(orden[i = (i + 1) % orden.length]); fotos.forEach((f, k) => f.toggleAttribute('data-actual', k === i % fotos.length)); };
  const rotularPausa = () => { pausa.textContent = tomado ? t('Seguir recorrido', 'Resume tour') : t('Pausar recorrido', 'Pause tour'); };
  const detener = () => { clearInterval(reloj); reloj = null; };
  const arrancar = () => { if (!reloj && !tomado && !quieto()) reloj = setInterval(pasar, 4200); };
  $$('[data-nodo]').forEach(g => ['pointerenter', 'focus', 'click'].forEach(ev => g.addEventListener(ev, () => {
    tomado = true; detener(); rotularPausa(); texto.setAttribute('aria-live', 'polite'); if (actual !== g.dataset.nodo) mostrar(g.dataset.nodo);
  })));
  pausa.addEventListener('click', () => { tomado = !tomado; if (tomado) detener(); else { texto.removeAttribute('aria-live'); pasar(); arrancar(); } rotularPausa(); });
  document.addEventListener('idioma', () => { rotularPausa(); mostrar(actual); });
  mostrar('api'); texto.removeAttribute('aria-live');
  if (!quieto()) pausa.hidden = false;
  rotularPausa();
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { aristas[actual].forEach(viajar); arrancar(); } else detener(); }, { threshold: .3 }).observe($('.arquitectura'));
  document.addEventListener('movimiento', () => { pausa.hidden = quieto(); if (quieto()) detener(); });
})();

// ——— Números que giran: 0 → 250 al verse (NumberFlow si carga; si no, el texto ya dice 250) ———
(function numeros() {
  const n = $('[data-numero]'); if (!n) return;
  new IntersectionObserver(async ([e], io) => {
    if (!e.isIntersecting) return; io.disconnect();
    if (quieto()) return;
    const meta = Number(n.textContent), inicio = performance.now();
    const paso = ahora => { const p = Math.min(1, (ahora - inicio) / 900), suave = 1 - Math.pow(1 - p, 3); n.textContent = String(Math.round(meta * suave)); if (p < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  }, { threshold: .4 }).observe(n);
})();

// ——— Caso aparte: diagrama de secuencia + ícono de pestaña con estado mientras corre ———
(function caso() {
  const fig = $('[data-secuencia]'), boton = $('[data-repetir]'), icono = $('link[rel=icon]'); if (!fig) return;
  const lazo = 'M16 16c-2.2-3.1-3.9-4.6-6-4.6a4.6 4.6 0 0 0 0 9.2c2.1 0 3.8-1.5 6-4.6s3.9-4.6 6-4.6a4.6 4.6 0 0 1 0 9.2c-2.1 0-3.8-1.5-6-4.6Z';
  const svg = tramo => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='#0A0A0A'/><path d='${lazo}' fill='none' stroke='#2b2f45' stroke-width='2.6'/><path d='${lazo}' fill='none' stroke='#2D5BFF' stroke-width='2.6' pathLength='100' stroke-dasharray='${tramo} 100'/></svg>`)}`;
  const original = icono.href;
  const correr = () => {
    fig.removeAttribute('data-reproduciendo'); if (quieto()) return; fig.getBoundingClientRect(); fig.toggleAttribute('data-reproduciendo', true);
    sonar('case'); let p = 0; const reloj = setInterval(() => { p += 12; icono.href = svg(Math.min(100, p)); if (p >= 100) { clearInterval(reloj); sonar('success'); setTimeout(() => { icono.href = original; }, 1500); } }, 180);
  };
  boton.addEventListener('click', correr);
  if (!quieto()) boton.hidden = false;
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); correr(); } }, { threshold: .5 }).observe(fig);
  document.addEventListener('movimiento', () => { boton.hidden = quieto(); });
})();

// ——— E040 · copiar el correo: onda desde el toque, tilde que se dibuja y aviso; si falla, el correo a mano ———
(function copiar() {
  const b = $('[data-copiar]'), estado = $('[data-estado-copia]'), correo = $('[data-correo]').textContent.trim(), texto = $('[data-copiar-texto]');
  b.addEventListener('click', async e => {
    try {
      await navigator.clipboard.writeText(correo);
      if (!quieto()) { const r = b.getBoundingClientRect(), onda = document.createElement('span'); onda.className = 'onda'; onda.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) + 'px'; onda.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) + 'px'; b.append(onda); onda.addEventListener('animationend', () => onda.remove()); }
      b.toggleAttribute('data-ok', true); texto.textContent = t('Copiado', 'Copied'); estado.textContent = t('Correo copiado.', 'Email copied.'); sonar('success');
      setTimeout(() => { b.removeAttribute('data-ok'); texto.textContent = t('Copiar correo', 'Copy email'); estado.textContent = ''; }, 1800);
    } catch {
      estado.textContent = t('No se pudo copiar. El correo es ', 'Could not copy. The email is ') + correo; sonar('error');
      const sel = getSelection(), rango = document.createRange(); rango.selectNodeContents($('[data-correo]')); sel.removeAllRanges(); sel.addRange(rango);
    }
  });
})();

// ——— Dock del celular: la sección actual con un indicador que se mueve con resorte; se esconde al bajar ———
(function dock() {
  const nav = $('[data-dock]'); if (!nav) return;
  const enlaces = $$('a[href^="#"]', nav), indicador = $('.indicador', nav);
  const marcar = a => { enlaces.forEach(x => x === a ? x.setAttribute('aria-current', 'location') : x.removeAttribute('aria-current')); if (a) { indicador.style.width = a.offsetWidth + 'px'; indicador.style.transform = `translateX(${a.offsetLeft}px)`; } };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) marcar(enlaces.find(a => a.hash === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  enlaces.forEach(a => { const s = $(a.hash); if (s) io.observe(s); });
  let ultimo = scrollY;
  addEventListener('scroll', () => { const y = scrollY; nav.toggleAttribute('data-oculto', y > 400 && y > ultimo); ultimo = y; }, { passive: true });
})();


// ——— Las viñetas de backstage se animan al verse ———
$$('[data-pase]:not(.practica)').forEach(f => new IntersectionObserver(([e], io) => { if (e.isIntersecting && !quieto()) { f.toggleAttribute('data-visto', true); io.disconnect(); } }, { threshold: .5 }).observe(f));

// ——— En vivo: estado.json de la rama datos (lo escribe el workflow estado.yml cada hora) ———
(async function enVivo() {
  const caja = $('[data-vivo]'); if (!caja) return;
  const servicios = $('[data-servicios]'), total = $('[data-contrib-total]'), mapa = $('[data-mapa]'), actualizado = $('[data-vivo-actualizado]');
  let datos;
  try { datos = await fetch('https://raw.githubusercontent.com/reyalejandro/reyalejandro.github.io/datos/estado.json', { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  catch { servicios.innerHTML = `<p class="vivo-nota">${t('Ahora no se pudieron leer los datos en vivo.', 'The live data could not be read right now.')}</p>`; return; }
  const pintar = () => {
    servicios.innerHTML = datos.servicios.map(s => {
      const dias = Object.entries(s.dias).sort(([a], [b]) => a.localeCompare(b)).slice(-60);
      const ok = dias.reduce((n, [, d]) => n + d.ok, 0), tot = dias.reduce((n, [, d]) => n + d.total, 0);
      const ms = Math.round(dias.reduce((n, [, d]) => n + d.ms, 0) / Math.max(1, dias.length));
      const pct = tot ? ok / tot * 100 : 0;
      const barras = dias.map(([f, d], i) => { const r = d.total ? d.ok / d.total : 0; return `<i style="height:${Math.max(12, r * 100)}%;--i:${i}" class="${r === 1 ? '' : r > 0 ? 'parcial' : 'caida'}" title="${f}: ${d.ok}/${d.total}"></i>`; }).join('');
      return `<div class="servicio"><p class="servicio-cabeza"><b>${s.nombre}</b><span><span class="cifra">${pct.toLocaleString(ingles ? 'en' : 'es-AR', { maximumFractionDigits: 2 })}%</span> ${t('respondió', 'up')} · ${ms} ms ${t('de promedio', 'average')} · ${dias.length} ${t('días', 'days')}</span></p><div class="barras-dias" aria-hidden="true">${barras}</div></div>`;
    }).join('');
    const fecha = new Date(datos.actualizado);
    actualizado.textContent = t('Última medición: ', 'Last check: ') + fecha.toLocaleString(ingles ? 'en' : 'es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Argentina/Buenos_Aires' });
    if (datos.github) {
      total.textContent = String(datos.github.total);
      const max = Math.max(1, ...datos.github.dias.map(([, n]) => n));
      mapa.innerHTML = datos.github.dias.slice(-91).map(([f, n]) => `<i data-n="${n ? Math.ceil(n / max * 4) : 0}" title="${f}: ${n}"></i>`).join('');
    }
  };
  pintar(); document.addEventListener('idioma', pintar);
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { caja.toggleAttribute('data-visto', true); io.disconnect(); } }, { threshold: .3 }).observe(caja);
})();

// ═══════════ v7 «Cromo vivo» ═══════════

// ——— Fondo por sección: el tono de la sección que cruza el centro pinta el body, la barra del navegador y el ASCII ———
const TINTES = { '#0A0A0A': [143, 166, 255], '#060A1E': [143, 166, 255], '#0B0B12': [168, 176, 218], '#081133': [143, 166, 255], '#0D0A22': [190, 160, 255], '#06171B': [120, 220, 205], '#120C1C': [230, 165, 255], '#05121C': [120, 200, 255], '#2D5BFF': [255, 255, 255] };
// El tinte (ASCII y rastro del puntero) no salta: se acerca al de la sección con cada cuadro. En el Ciclo DevOps toma el
// color de la etapa activa y el fondo de la página se tiñe apenas con ese color.
let tinte = [...TINTES['#0A0A0A']], tinteMeta = tinte.slice();
const acercarTinte = () => { let falta = 0; tinte = tinte.map((c, i) => { const d = tinteMeta[i] - c; falta += Math.abs(d); return Math.abs(d) < .5 ? tinteMeta[i] : c + d * .08; }); return falta > 1.5; };
const deHex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
(function tonos() {
  const meta = $('meta[name="theme-color"]'), ciclo = $('[data-trayectoria]');
  let tono = '#0A0A0A', etapa = '#9B7BFF';
  const pintar = () => {
    const enCiclo = ciclo && tono === ciclo.dataset.tono;
    raiz.style.setProperty('--fondo', enCiclo ? `color-mix(in oklab, ${etapa} 9%, ${tono})` : tono); meta.content = tono;
    tinteMeta = enCiclo ? deHex(etapa) : (TINTES[tono] || tinteMeta); document.dispatchEvent(new Event('tono'));
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    tono = e.target.dataset.tono; raiz.toggleAttribute('data-claro', tono === '#2D5BFF'); pintar();
  }), { rootMargin: '-50% 0px -50% 0px' });
  $$('[data-tono]').forEach(s => io.observe(s));
  document.addEventListener('etapa', e => { const li = $$('[data-paso]')[e.detail]; if (li) { etapa = li.style.getPropertyValue('--c').trim(); pintar(); } });
})();

// ——— Fondo ASCII: la ciudad en puntos del sitio anterior, en caracteres. Bajo el puntero se aclara y se vuelve más densa;
// una onda lenta la recorre (E001) y deriva con el scroll. Si la imagen no se puede leer (file://), usa un campo de ruido. ———
(function ascii() {
  const cv = $('[data-ascii]'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const RAMPA = ' .·:-=+*#%@', CUBETAS = 7;
  // Rastro del puntero: letras y signos que el fondo no usa, más gruesos, con los colores del espectro del Ciclo
  const GLIFOS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789$&?!<>/\\{}[]()^~', COLORES = [[155, 123, 255], [77, 124, 255], [34, 196, 255], [46, 230, 168], [184, 240, 74], [255, 201, 61], [255, 138, 61], [255, 79, 139]];
  const VIDA_RASTRO = 1400;
  let cw = 9, ch = 15, cols, filas, lum = null, lw = 0, lh = 0, dpr = 1, t = 0, antes = 0, ultimo = 0, corriendo = false;
  let ondas = [], movido = 0, ultX = null, ultY = null, recorrido = 0;
  const rastro = new Map(); // celda → { c, col, t }
  const fuente = () => `500 ${ch * .78}px "IBM Plex Mono", ui-monospace, monospace`;
  const img = new Image(); img.src = 'ciudad-puntos.png';
  function muestrear() {
    // La grilla de luminancia es 1,6 veces más alta que la pantalla para poder derivar con el scroll.
    lw = cols; lh = Math.ceil(filas * 1.6); lum = new Float32Array(lw * lh);
    try {
      const o = document.createElement('canvas'); o.width = lw; o.height = lh; const c = o.getContext('2d', { willReadFrequently: true });
      const r = Math.max(lw / img.width, lh / img.height), w = img.width * r, h = img.height * r;
      c.drawImage(img, (lw - w) / 2, (lh - h) / 2, w, h);
      const d = c.getImageData(0, 0, lw, lh).data;
      for (let i = 0; i < lw * lh; i++) lum[i] = (d[i * 4] * .3 + d[i * 4 + 1] * .59 + d[i * 4 + 2] * .11) / 255 * (d[i * 4 + 3] / 255);
    } catch {
      for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) lum[y * lw + x] = Math.max(0, Math.sin(x * .21) * Math.cos(y * .17) * .5 + Math.sin((x + y) * .05) * .35);
    }
  }
  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    ch = innerWidth < 760 ? 18 : 15;
    // El ancho de cada columna es el avance real de la letra: con un valor fijo las filas quedaban comprimidas
    // a la izquierda (el lado derecho sin ASCII) y la onda del clic salía corrida respecto del mouse.
    ctx.font = fuente(); cw = ctx.measureText('M').width || 9;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cols = Math.ceil(innerWidth / cw); filas = Math.ceil(innerHeight / ch);
    if (img.complete && img.naturalWidth) muestrear();
    pedir();
  }
  function dibujar() {
    if (!lum) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = fuente(); ctx.textBaseline = 'top';
    // En la portada manda la ciudad en puntos del sitio anterior: el ASCII queda tenue y toma fuerza al bajar.
    const deriva = Math.floor(scrollY / ch * .18) % (lh - filas), portada = .3 + .7 * Math.min(1, scrollY / innerHeight);
    const filasTxt = Array.from({ length: CUBETAS }, () => new Array(filas));
    const ya = performance.now(); ondas = ondas.filter(o => ya - o.t < 1500);
    for (const [k, r] of rastro) if (ya - r.t > VIDA_RASTRO) rastro.delete(k);
    for (let y = 0; y < filas; y++) {
      const lineas = Array.from({ length: CUBETAS }, () => []);
      for (let x = 0; x < cols; x++) {
        if (rastro.has(y * cols + x)) { for (let j = 0; j < CUBETAS; j++) lineas[j].push(' '); continue; }
        const base = lum[(y + deriva) * lw + x] || 0;
        const onda = .5 + .5 * Math.sin(x * .16 + y * .1 - t * 1.1);
        // Anillo que sale del clic y se apaga mientras se abre
        let anillo = 0;
        for (const o of ondas) { const e = ya - o.t, d = Math.hypot(x * cw - o.x, y * ch - o.y); anillo += Math.max(0, 1 - Math.abs(d - e * .75) / 42) * (1 - e / 1500); }
        const v = Math.min(1, base * (.7 + onda * .45) + anillo * .9);
        const a = Math.min(.95, (.05 + base * .2 + onda * base * .08) * portada + anillo * .7);
        const k = Math.min(CUBETAS - 1, Math.floor(a * CUBETAS));
        const c = v < .06 ? ' ' : RAMPA[Math.min(RAMPA.length - 1, Math.floor(v * RAMPA.length))];
        for (let j = 0; j < CUBETAS; j++) lineas[j].push(j === k ? c : ' ');
      }
      for (let j = 0; j < CUBETAS; j++) filasTxt[j][y] = lineas[j].join('');
    }
    const [r, g, b] = tinte;
    for (let j = 0; j < CUBETAS; j++) {
      ctx.fillStyle = `rgba(${r},${g},${b},${((j + .5) / CUBETAS).toFixed(3)})`;
      for (let y = 0; y < filas; y++) if (filasTxt[j][y].trim()) ctx.fillText(filasTxt[j][y], 0, y * ch);
    }
    // El rastro va arriba, en negrita y más grande, y se apaga de a poco
    if (rastro.size) {
      ctx.font = `700 ${ch * .92}px "IBM Plex Mono", ui-monospace, monospace`; ctx.textAlign = 'center';
      for (const [celda, { c, col, t: t0 }] of rastro) {
        const vida = 1 - (ya - t0) / VIDA_RASTRO, x = celda % cols, y = (celda - x) / cols;
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(vida * vida).toFixed(3)})`;
        ctx.fillText(c, x * cw + cw / 2, y * ch - 1);
      }
      ctx.textAlign = 'start';
    }
  }
  // Suma las celdas que el puntero cruzó desde el último evento, con un vecino al azar cuando va rápido
  function trazar(xp, yp) {
    if (ultX === null) { ultX = xp; ultY = yp; }
    const dx = xp - ultX, dy = yp - ultY, pasos = Math.max(1, Math.ceil(Math.max(Math.abs(dx) / cw, Math.abs(dy) / ch))), rapido = Math.hypot(dx, dy) > 40, ya = performance.now();
    for (let s = 1; s <= pasos; s++) {
      const x = Math.floor((ultX + dx * s / pasos) / cw), y = Math.floor((ultY + dy * s / pasos) / ch);
      recorrido++;
      const marcar = (cx, cy) => { if (cx < 0 || cy < 0 || cx >= cols || cy >= filas) return; rastro.set(cy * cols + cx, { c: GLIFOS[Math.random() * GLIFOS.length | 0], col: COLORES[(recorrido >> 2) % COLORES.length], t: ya }); };
      marcar(x, y);
      if (rapido && Math.random() < .5) marcar(x + (Math.random() < .5 ? -1 : 1), y + (Math.random() < .5 ? 0 : Math.random() < .5 ? -1 : 1));
    }
    ultX = xp; ultY = yp;
  }
  // Onda lenta a 12 cuadros; a 30 mientras hay rastro, una onda de clic o el puntero se mueve.
  const tic = ahora => {
    if (document.hidden) { corriendo = false; return; }
    const dt = Math.min(.1, (ahora - antes) / 1000); antes = ahora;
    if (!quieto()) t += dt;
    const cambiaColor = acercarTinte();
    const vivo = ondas.length || rastro.size || ahora - movido < 400;
    if (ahora - ultimo >= (vivo ? 33 : 80)) { dibujar(); ultimo = ahora; }
    if (quieto() && !cambiaColor && !rastro.size && !ondas.length) { corriendo = false; return; }
    requestAnimationFrame(tic);
  };
  function pedir() { if (!corriendo) { corriendo = true; antes = performance.now(); requestAnimationFrame(tic); } }
  // Un clic en un lugar vacío manda una onda que recorre la ciudad en caracteres, con su sonido
  addEventListener('pointerdown', e => {
    if (quieto() || e.button !== 0 || e.target.closest('a,button,input,label,select,textarea,[role="button"],iframe,.celular') || raiz.hasAttribute('data-sobre-bucle')) return;
    ondas.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (ondas.length > 3) ondas.shift();
    sonar('click', { tono: .6 + Math.random() * .7, vol: .28 }); pedir();
  });
  addEventListener('pointermove', e => {
    movido = performance.now();
    if (e.pointerType === 'mouse' && !quieto()) trazar(e.clientX, e.clientY);
    pedir();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ultX = ultY = null; });
  addEventListener('scroll', () => { ultX = ultY = null; pedir(); }, { passive: true });
  addEventListener('resize', () => { rastro.clear(); medir(); });
  document.fonts?.ready.then(() => { rastro.clear(); medir(); });
  document.addEventListener('visibilitychange', pedir); document.addEventListener('movimiento', pedir); document.addEventListener('tono', pedir);
  img.onload = () => { muestrear(); pedir(); }; img.onerror = () => { muestrear(); pedir(); };
  medir();
})();

// ——— Íconos junto a cada herramienta nombrada en las etapas del ciclo (se rehace después de cada cambio de idioma) ———
const ICONOS = { 'GitHub Actions': 'i-githubactions', 'Google Cloud': 'i-googlecloud', 'Claude Code': 'i-claude', 'Mercado Pago': 'i-mercadopago', 'Azure DevOps': 'i-ciclo', 'PostgreSQL': 'i-postgresql', 'TypeScript': 'i-typescript', 'Kubernetes': 'i-kubernetes', 'Playwright': 'i-probeta', 'SonarQube': 'i-sonarqubeserver', 'Terraform': 'i-terraform', 'Dynatrace': 'i-dynatrace', 'Selenium': 'i-selenium', 'Cucumber': 'i-cucumber', 'CyberArk': 'i-escudo', 'Postman': 'i-postman', 'Ansible': 'i-ansible', 'Jenkins': 'i-jenkins', 'Node.js': 'i-nodedotjs', 'Medusa': 'i-medusa', 'Docker': 'i-docker', 'Sentry': 'i-sentry', 'JMeter': 'i-apachejmeter', 'Gradle': 'i-gradle', 'Maven': 'i-apachemaven', 'Astro': 'i-astro', 'JUnit': 'i-junit5', 'Codex': 'i-chip', 'Jira': 'i-jira', 'Xray': 'i-jira', 'AWS': 'i-nube', 'n8n': 'i-n8n', 'Git': 'i-git' };
const patronIconos = new RegExp(`(?<![\\w.])(${Object.keys(ICONOS).map(k => k.replace(/[.]/g, '\\.')).join('|')})(?![\\w])`, 'g');
function iconizar() {
  $$('.etapa-datos dd').forEach(li => {
    if (li.querySelector('.herr-ico')) return;
    const texto = li.textContent; if (!patronIconos.test(texto)) return; patronIconos.lastIndex = 0;
    li.innerHTML = texto.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(patronIconos, (m) => `<span class="herr-ico"><svg aria-hidden="true"><use href="#${ICONOS[m]}"/></svg>${m}</span>`);
  });
}
document.addEventListener('idioma', iconizar);

// ——— Ciclo DevOps fijo: la sección queda quieta y el scroll elige la etapa. El ∞ está entero desde el comienzo y cada etapa
// sale como un rayo de su color (un espectro dividido en ocho). Al lado, las herramientas de esa etapa y lo que hice en ella.
// El espectro de abajo lleva a cada etapa; cada herramienta resalta dónde la usé. ———
(function cicloFijo() {
  const sec = $('[data-trayectoria]'); if (!sec) return;
  const pasos = $$('[data-paso]', sec), botones = $$('[data-ir]', sec), lienzo = $('.tray-lienzo', sec);
  const tonos = [1, 1.122, 1.26, 1.498, 1.682, 2, 2.245, 2.52];
  let actual = -1, pedido = false;
  const recorrido = () => Math.max(1, sec.offsetHeight - innerHeight);
  const inicio = () => sec.getBoundingClientRect().top + scrollY;
  const lugar = i => inicio() + recorrido() * (i + .5) / pasos.length;
  const elegir = i => {
    if (i === actual) return;
    $$('dd[data-menciona], dd[data-atenua]', sec).forEach(dd => { dd.removeAttribute('data-menciona'); dd.removeAttribute('data-atenua'); });
    pasos.forEach((li, k) => { li.toggleAttribute('data-actual', k === i); li.toggleAttribute('data-pasado', k < i); });
    // La práctica de la etapa («Cómo lo hago») vuelve a animar su esquema cada vez que la etapa se activa
    $$('.practica', sec).forEach(pr => pr.removeAttribute('data-visto'));
    const pr = $('.practica', pasos[i]); if (pr && !quieto()) { void pr.offsetWidth; pr.toggleAttribute('data-visto', true); }
    botones.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); b.toggleAttribute('data-pasada', k < i); });
    sec.style.setProperty('--c-act', pasos[i].style.getPropertyValue('--c'));
    if (actual !== -1) {
      sonar('click', { tono: tonos[i], vol: .3 });
      if (!quieto()) { lienzo.removeAttribute('data-dispara'); void lienzo.offsetWidth; lienzo.toggleAttribute('data-dispara', true); }
    }
    actual = i; document.dispatchEvent(new CustomEvent('etapa', { detail: i }));
  };
  const medir = () => {
    pedido = false;
    const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / recorrido()));
    elegir(Math.min(pasos.length - 1, Math.floor(p * pasos.length)));
  };
  addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(medir); } }, { passive: true });
  addEventListener('resize', medir); medir();
  botones.forEach((b, i) => b.addEventListener('click', () => { scrollTo({ top: lugar(i), behavior: quieto() ? 'instant' : 'smooth' }); elegir(i); }));
  // Desde otra sección (Experiencia): salta a la etapa y marca la frase de esa empresa
  window.cvIrEtapa = (i, empresa) => {
    scrollTo({ top: lugar(i), behavior: 'instant' }); elegir(i);
    if (!empresa) return;
    $$('dt', pasos[i]).forEach(dt => { const dd = dt.nextElementSibling, si = dt.textContent.includes(empresa); dd?.toggleAttribute('data-menciona', si); dd?.toggleAttribute('data-atenua', !si); });
  };
  // Desde las etiquetas de los rayos: una herramienta usa el resaltado de su chip; una metodología busca su término en las frases
  // de la etapa y en su buena práctica. Un toque en una metodología la deja fija hasta cambiar de etapa o tocarla de nuevo.
  let fijada = null;
  window.cvResaltar = (texto, chip, fijar) => {
    const li = pasos[actual]; if (!li) return;
    if (chip) { chip.dispatchEvent(new PointerEvent(texto ? 'pointerenter' : 'pointerleave')); return; }
    if (fijar) fijada = fijada === texto ? null : texto;
    const termino = (fijar ? fijada : texto || fijada)?.toLowerCase();
    const partes = [...$$('dd', li), ...$$('.practica', li)];
    const usa = el => !!termino && el.textContent.toLowerCase().includes(termino), alguno = partes.some(usa);
    partes.forEach(el => { el.toggleAttribute('data-menciona', alguno && usa(el)); el.toggleAttribute('data-atenua', alguno && !usa(el)); });
  };
  document.addEventListener('etapa', () => { fijada = null; });
  // Con la sección fija, cada paso de la rueda es una etapa (en el trackpad se juntan los deltas chicos). En la primera y la
  // última etapa el paso siguiente sale de la sección, sin pasos muertos.
  let acumulado = 0, bloqueo = 0;
  addEventListener('wheel', e => {
    const r = sec.getBoundingClientRect();
    if (e.ctrlKey || r.top > 1 || r.bottom < innerHeight - 1 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) { acumulado = 0; return; }
    const sentido = Math.sign(e.deltaY), destino = actual + sentido;
    if (destino < 0) { e.preventDefault(); scrollTo({ top: inicio() - 2, behavior: 'instant' }); return; }
    if (destino >= pasos.length) { e.preventDefault(); scrollTo({ top: inicio() + recorrido() + 2, behavior: 'instant' }); return; }
    e.preventDefault();
    const ahora = performance.now();
    acumulado += Math.abs(e.deltaY);
    if (ahora < bloqueo || acumulado < 40) return;
    acumulado = 0; bloqueo = ahora + 380;
    scrollTo({ top: lugar(destino), behavior: 'instant' }); elegir(destino);
  }, { passive: false });
  $('.espectro', sec).addEventListener('keydown', e => {
    const i = botones.indexOf(document.activeElement), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (i < 0 || !d) return; e.preventDefault(); botones[(i + d + botones.length) % botones.length].focus();
  });
  // Herramientas: al pasar, enfocar o tocar una, se iluminan las frases donde aparece y se apagan las demás; un toque la fija.
  pasos.forEach(li => {
    const dds = $$('dd', li), chips = $$('.herramientas li', li);
    let fija = null;
    const mostrar = h => {
      const nombres = h ? h.textContent.split('·').map(x => x.trim().toLowerCase()).filter(Boolean) : [];
      const usa = dd => nombres.some(n => dd.textContent.toLowerCase().includes(n));
      const alguno = !!h && dds.some(usa);
      dds.forEach(dd => { dd.toggleAttribute('data-menciona', alguno && usa(dd)); dd.toggleAttribute('data-atenua', alguno && !usa(dd)); });
      chips.forEach(c => c.toggleAttribute('data-elegida', c === h));
    };
    chips.forEach(h => {
      h.tabIndex = 0; h.setAttribute('role', 'button'); h.setAttribute('aria-pressed', 'false');
      h.addEventListener('pointerenter', () => { if (!fija) mostrar(h); });
      h.addEventListener('focus', () => { if (!fija) mostrar(h); });
      h.addEventListener('pointerleave', () => { if (!fija) mostrar(null); });
      h.addEventListener('blur', () => { if (!fija) mostrar(null); });
      const tocar = () => {
        fija = fija === h ? null : h; chips.forEach(c => c.setAttribute('aria-pressed', String(c === fija)));
        mostrar(fija || h); sonar('click', { tono: 1.5, vol: .2 });
      };
      h.addEventListener('click', tocar);
      h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocar(); } });
    });
  });
})();

// ——— Celular: se inclina con interpolación en toda la sección; ▶ abre la tienda real con transición iris (E174);
// atrás y adelante usan el historial conjunto con un contador, así nunca sacan al visitante del CV. ———
(function celular() {
  const sec = $('#escenario'), cel = $('[data-celular]'), pantalla = $('[data-pantalla]'), controles = $('[data-celular-controles]'), estado = $('[data-celular-estado]');
  if (!cel) return;
  const boton = a => $(`[data-celular-accion="${a}"]`);
  const play = boton('abrir'), atras = boton('atras'), adelante = boton('adelante');
  let abierta = false, frame = null, cargas = 0, pasos = 0, adelantes = 0;
  // Inclinación: objetivo según el puntero en toda la sección, interpolado a .07 por cuadro.
  let tx = -8, ty = 4, x = -8, y = 4, moviendo = false;
  const mover = () => {
    x += (tx - x) * .07; y += (ty - y) * .07;
    cel.style.setProperty('--ry', x.toFixed(2) + 'deg'); cel.style.setProperty('--rx', y.toFixed(2) + 'deg');
    if (Math.abs(tx - x) + Math.abs(ty - y) > .03) requestAnimationFrame(mover); else moviendo = false;
  };
  const apuntar = (nx, ny) => { tx = nx; ty = ny; if (!moviendo) { moviendo = true; requestAnimationFrame(mover); } };
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    sec.addEventListener('pointermove', e => {
      if (quieto() || abierta) return;
      const b = cel.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (e.clientX - (b.left + b.width / 2)) / (innerWidth * .45)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (b.top + b.height / 2)) / (innerHeight * .6)));
      apuntar(nx * 24, -ny * 15);
    });
    sec.addEventListener('pointerleave', () => { if (!abierta) apuntar(-8, 4); });
  }
  const escala = () => pantalla.style.setProperty('--escala', (pantalla.clientWidth / 390).toFixed(4));
  const rotular = () => { atras.disabled = pasos <= 0; adelante.disabled = adelantes <= 0; };
  // La tienda navega con su propio enrutador (sin evento load), así que se cuentan las entradas nuevas del historial conjunto.
  // ponytail: si después de volver se navega a otra página, el largo no crece y «avanzar» queda activo sin efecto; nunca cuenta de más.
  let largo = history.length, vigia = null;
  // La base se toma cuando la tienda terminó de cargar por primera vez: lo que agrega esa primera carga no cuenta como paso.
  const revisar = () => { if (!cargas) return; const n = history.length; if (n > largo) { pasos += n - largo; adelantes = 0; largo = n; rotular(); } };
  const alCargar = () => { if (!cargas++) largo = history.length; revisar(); };
  function abrir() {
    if (abierta) return;
    if (!frame) {
      const capa = document.createElement('div'); capa.className = 'vivo-capa';
      frame = document.createElement('iframe');
      frame.title = t('Tienda de Master Pet en vivo', 'Live Master Pet store');
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.addEventListener('load', alCargar);
      frame.src = 'https://masterpet.com.ar/';
      capa.append(frame); pantalla.append(capa);
    }
    const p = play.getBoundingClientRect(), s = pantalla.getBoundingClientRect();
    pantalla.style.setProperty('--cx', (p.left + p.width / 2 - s.left) + 'px'); pantalla.style.setProperty('--cy', (p.top + p.height / 2 - s.top) + 'px');
    escala(); abierta = true; apuntar(0, 0); vigia = setInterval(revisar, 400);
    requestAnimationFrame(() => cel.toggleAttribute('data-abierta', true));
    controles.hidden = false; rotular(); sonar('on');
    estado.textContent = t('La tienda se abrió dentro del celular. Abajo están volver, inicio, avanzar y cerrar.', 'The store opened inside the phone. Back, home, forward and close are below it.');
    setTimeout(() => frame.focus(), quieto() ? 0 : 500);
  }
  function cerrar() {
    abierta = false; clearInterval(vigia); cel.removeAttribute('data-abierta'); controles.hidden = true; apuntar(-8, 4); sonar('off');
    estado.textContent = t('La tienda se cerró.', 'The store closed.'); play.focus();
  }
  play.addEventListener('click', abrir);
  boton('cerrar').addEventListener('click', cerrar);
  boton('inicio').addEventListener('click', () => { if (frame) { frame.src = 'https://masterpet.com.ar/?' + Date.now().toString(36); sonar('click'); } });
  atras.addEventListener('click', () => { if (pasos > 0) { pasos--; adelantes++; rotular(); history.back(); sonar('click', { tono: .85 }); } });
  adelante.addEventListener('click', () => { if (adelantes > 0) { pasos++; adelantes--; rotular(); history.forward(); sonar('click', { tono: 1.15 }); } });
  controles.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
  addEventListener('resize', () => { if (frame) escala(); });
  // Todo enlace del CV a masterpet.com.ar abre la tienda dentro del celular (con Ctrl o Cmd sigue abriendo una pestaña).
  $$('[data-abrir-celular]').forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); cel.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'center' }); setTimeout(abrir, quieto() ? 0 : 450);
  }));
})();

// ——— Portada: la ciudad en puntos del sitio anterior, con sus mismos efectos. Donde mira el puntero los puntos se enfocan;
// luces con estela recorren las calles (horizontal, vertical y diagonales) y una constelación une los puntos cercanos y al puntero.
// Se frenan fuera de pantalla, con la pestaña oculta y con movimiento reducido. ———
(function ciudadPortada() {
  const hero = $('.poster'), fig = $('.ciudad-portada'); if (!fig) return;
  const fina = $('.fina', fig), luz = $('[data-trafico]', fig).getContext('2d'), con = $('[data-constelacion]', fig).getContext('2d');
  let x = 50, y = 42, tx = 50, ty = 42, mov = false, px = -999, py = -999;
  const seguir = () => {
    x += (tx - x) * .12; y += (ty - y) * .12;
    fina.style.setProperty('--mx', x + '%'); fina.style.setProperty('--my', y + '%');
    if (Math.abs(tx - x) + Math.abs(ty - y) > .05) requestAnimationFrame(seguir); else mov = false;
  };
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top;
    if (quieto() || e.pointerType !== 'mouse') return;
    tx = px / r.width * 100; ty = py / r.height * 100;
    if (!hero.hasAttribute('data-foco')) hero.toggleAttribute('data-foco', true);
    if (!mov) { mov = true; requestAnimationFrame(seguir); }
  });
  hero.addEventListener('pointerleave', () => { hero.removeAttribute('data-foco'); px = py = -999; });
  let W = 0, H = 0;
  const medir = () => {
    const d = Math.min(devicePixelRatio || 1, 2); W = fig.clientWidth; H = fig.clientHeight;
    for (const c of [luz, con]) { c.canvas.width = W * d; c.canvas.height = H * d; c.setTransform(d, 0, 0, d, 0, 0); }
  };
  medir(); new ResizeObserver(medir).observe(fig);
  const dirs = [[1, 0], [0, 1], [.7071, .7071], [.7071, -.7071]];
  const nueva = () => { const [dx, dy] = dirs[Math.random() * 4 | 0], s = (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * 1.3); return { x: Math.random() * W, y: Math.random() * H, dx: dx * s, dy: dy * s, vida: 240 + Math.random() * 360, edad: 0 }; };
  const chico = innerWidth < 700, luces = Array.from({ length: chico ? 22 : 48 }, nueva);
  const pts = Array.from({ length: chico ? 40 : 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }));
  let activo = false, enVista = true;
  const cuadro = () => {
    if (!activo) return;
    luz.clearRect(0, 0, W, H); luz.lineCap = 'round'; luz.lineWidth = 1.6;
    for (const l of luces) {
      l.x += l.dx; l.y += l.dy; l.edad++;
      luz.strokeStyle = `rgba(232,226,214,${Math.sin(Math.PI * Math.min(1, l.edad / l.vida)) * .75})`;
      luz.beginPath(); luz.moveTo(l.x - l.dx * 14, l.y - l.dy * 14); luz.lineTo(l.x, l.y); luz.stroke();
      if (l.edad > l.vida || l.x < -40 || l.x > W + 40 || l.y < -40 || l.y > H + 40) Object.assign(l, nueva());
    }
    // ponytail: O(n²) entre 80 puntos (3.200 pares por cuadro); si suben de 200, agrupar en una grilla espacial.
    con.clearRect(0, 0, W, H); con.lineWidth = 1;
    for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) { const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y); if (d < 120) { con.strokeStyle = `rgba(232,226,214,${(1 - d / 120) * .35})`; con.beginPath(); con.moveTo(a.x, a.y); con.lineTo(b.x, b.y); con.stroke(); } }
      const dp = Math.hypot(a.x - px, a.y - py); if (dp < 170) { con.strokeStyle = `rgba(244,244,242,${(1 - dp / 170) * .6})`; con.beginPath(); con.moveTo(a.x, a.y); con.lineTo(px, py); con.stroke(); }
      con.fillStyle = 'rgba(244,244,242,.7)'; con.fillRect(a.x - 1, a.y - 1, 2, 2);
    }
    requestAnimationFrame(cuadro);
  };
  const prender = () => {
    const antes = activo; activo = !document.hidden && enVista && !quieto();
    if (activo && !antes) requestAnimationFrame(cuadro);
    if (!activo) { luz.clearRect(0, 0, W, H); con.clearRect(0, 0, W, H); }
  };
  new IntersectionObserver(([e]) => { enVista = e.isIntersecting; prender(); }).observe(hero);
  document.addEventListener('visibilitychange', prender); document.addEventListener('movimiento', prender); prender();
})();

// ——— Rastro del puntero (E370) y etiqueta de modo (E374). Sólo con mouse y con movimiento: una cinta que se afina hacia atrás,
// del color del tono de la sección; se alarga y brilla con la velocidad y desaparece al quedarse quieto. El cursor del sistema
// no se esconde nunca. Sobre el ∞ de la portada, la etiqueta avisa que se puede girar arrastrando. ———
if (matchMedia('(hover:hover) and (pointer:fine)').matches) (function estela() {
  const cv = document.createElement('canvas'), etq = document.createElement('span');
  cv.className = 'estela'; etq.className = 'estela-etiqueta'; cv.setAttribute('aria-hidden', 'true'); etq.setAttribute('aria-hidden', 'true');
  document.body.append(cv, etq);
  const ctx = cv.getContext('2d'), VIDA = 280;
  let dpr = 1, hx = -1e4, hy = -1e4, tx = -1e4, ty = -1e4, dentro = false, corriendo = false, rastro = [];
  const medir = () => { dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  medir(); addEventListener('resize', medir);
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY; if (!dentro) { hx = tx; hy = ty; dentro = true; }
    pedir();
  }, { passive: true });
  raiz.addEventListener('pointerleave', () => { dentro = false; pedir(); });
  function tic(ahora) {
    // La cinta de color ya no se dibuja: el rastro del puntero ahora son letras en el fondo ASCII
    while (rastro.length && ahora - rastro[0].t > VIDA) rastro.shift();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight); ctx.lineCap = 'round';
    const [r, g, b] = tinte;
    for (let i = 1; i < rastro.length; i++) {
      const p = rastro[i - 1], q = rastro[i], k = 1 - (ahora - q.t) / VIDA, rapidez = Math.min(1, Math.hypot(q.x - p.x, q.y - p.y) / 28);
      if (rapidez < .02) continue;
      ctx.strokeStyle = `rgba(${r},${g},${b},${(k * k * (.35 + .6 * rapidez)).toFixed(3)})`;
      ctx.lineWidth = .6 + k * (1.6 + 4.4 * rapidez);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }
    // Etiqueta de modo: sólo donde el gesto cambia de sentido (mirar → girar el ∞)
    const girando = raiz.hasAttribute('data-arrastre'), sobre = raiz.hasAttribute('data-sobre-bucle');
    etq.toggleAttribute('data-visible', dentro && (girando || sobre));
    if (dentro && (girando || sobre)) {
      etq.textContent = girando ? t('Girando', 'Rotating') : t('Arrastrá para girar', 'Drag to rotate');
      etq.style.transform = `translate(${tx + 18}px,${ty + 20}px)`;
    }
    if (rastro.length || (dentro && (girando || sobre))) requestAnimationFrame(tic); else corriendo = false;
  }
  function pedir() { if (!corriendo) { corriendo = true; requestAnimationFrame(tic); } }
})();

// ——— Imán suave en las pastillas (solo con mouse): se corren hacia el puntero y vuelven con resorte ———
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  $$('.pildora').forEach(p => {
    p.addEventListener('pointermove', e => { if (quieto()) return; const b = p.getBoundingClientRect(); p.style.setProperty('--mx', ((e.clientX - b.left - b.width / 2) * .16).toFixed(1) + 'px'); p.style.setProperty('--my', ((e.clientY - b.top - b.height / 2) * .28).toFixed(1) + 'px'); });
    p.addEventListener('pointerleave', () => { p.style.setProperty('--mx', '0px'); p.style.setProperty('--my', '0px'); });
  });
}

// ——— Retoques del 20/11 (tabla de retoques de design-unslopify): luz que sigue al puntero en las tarjetas, inclinación con
// resorte, onda desde el toque en los controles y el tinte de la sección como variable CSS (barra de lectura, selección, luces). ———
(function retoques() {
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) $$('.pase, .entrada, .acto').forEach(el => {
    const inclina = el.classList.contains('pase'); // .entrada ya anima su transform con el scroll
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--lx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
      if (inclina && !quieto()) { el.style.setProperty('--ix', ((.5 - y) * 6).toFixed(2) + 'deg'); el.style.setProperty('--iy', ((x - .5) * 8).toFixed(2) + 'deg'); }
    });
    el.addEventListener('pointerleave', () => { for (const [k, v] of [['--ix', '0deg'], ['--iy', '0deg'], ['--lx', '-50%'], ['--ly', '-50%']]) el.style.setProperty(k, v); });
  });
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.pildora, .espectro-etapa, .pdf-boton'); if (!b || quieto()) return;
    const r = b.getBoundingClientRect(), o = document.createElement('i'); o.className = 'onda-toque'; o.setAttribute('aria-hidden', 'true');
    o.style.left = (e.clientX - r.left) + 'px'; o.style.top = (e.clientY - r.top) + 'px'; b.append(o);
    o.addEventListener('animationend', () => o.remove());
  });
  const ponerTinte = () => raiz.style.setProperty('--tinte', `rgb(${tinteMeta.map(Math.round).join(' ')})`);
  document.addEventListener('tono', ponerTinte); ponerTinte();
})();

// ——— Experiencia: lo que hice en cada empresa vive en las etapas del ciclo. Acá, un botón por etapa con su color:
// al pasar o enfocar se lee qué hice en esa etapa; al tocar lleva a la etapa del ∞ con la frase marcada. ———
(function experiencia() {
  const pasos = $$('[data-paso]');
  const armar = () => $$('[data-empresa]').forEach(acto => {
    const caja = $('[data-acto-etapas]', acto), empresa = acto.dataset.empresa;
    const items = pasos.map((li, i) => {
      const dt = $$('dt', li).find(d => d.textContent.includes(empresa));
      return dt && { i, c: li.style.getPropertyValue('--c'), n: $('h3', li).textContent, texto: dt.nextElementSibling.innerHTML };
    }).filter(Boolean);
    caja.innerHTML = `<div class="acto-botones" role="group" aria-label="${t('Etapas del ciclo', 'Loop stages')}">${items.map((x, k) =>
      `<button type="button" class="acto-etapa" style="--c:${x.c}" data-i="${x.i}" aria-pressed="${k === 0}"><span class="etapa-n">${String(x.i + 1).padStart(2, '0')}</span>${x.n}</button>`).join('')}</div>` +
      `<p class="acto-detalle" aria-live="polite"></p>`;
    const detalle = $('.acto-detalle', caja), bts = $$('.acto-etapa', caja);
    const mostrar = k => {
      bts.forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
      detalle.style.setProperty('--c', items[k].c); detalle.innerHTML = items[k].texto;
      if (!quieto()) { detalle.removeAttribute('data-entra'); void detalle.offsetWidth; detalle.toggleAttribute('data-entra', true); }
    };
    bts.forEach((b, k) => {
      b.addEventListener('pointerenter', () => mostrar(k)); b.addEventListener('focus', () => mostrar(k));
      b.addEventListener('click', () => window.cvIrEtapa?.(items[k].i, empresa));
    });
    caja.querySelector('.acto-botones').addEventListener('keydown', e => {
      const k = bts.indexOf(document.activeElement), d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (k < 0 || !d) return; e.preventDefault(); bts[(k + d + bts.length) % bts.length].focus();
    });
    mostrar(0);
  });
  document.addEventListener('idioma', armar); // después de iconizar, así el detalle trae los íconos
})();

// ——— Celular: los esquemas que se deslizan de costado arrancan centrados (la arquitectura tiene la API en el medio) ———
(function centrarEsquemas() {
  const centrar = () => { if (innerWidth > 700) return; $$('.arq, [data-secuencia]').forEach(c => { c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2; }); };
  centrar(); addEventListener('resize', centrar);
})();

// ——— Celular: en las etapas con práctica, dos pestañas («Experiencia» / «Buena práctica») para que el panel entre sin tapar el espectro ———
(function vistasEtapa() {
  const pasos = $$('[data-paso]').filter(li => $('.practica', li));
  const rotular = () => pasos.forEach(li => $$('.vista', li).forEach((b, k) => { b.textContent = k ? t('Buena práctica', 'Best practice') : t('Experiencia', 'Experience'); }));
  pasos.forEach(li => {
    const barra = document.createElement('div'); barra.className = 'vistas'; barra.setAttribute('role', 'group');
    barra.innerHTML = '<button type="button" class="vista" aria-pressed="true"></button><button type="button" class="vista" aria-pressed="false"></button>';
    $('dl', li).before(barra);
    const bts = $$('.vista', barra);
    bts.forEach((b, k) => b.addEventListener('click', () => {
      bts.forEach((x, j) => x.setAttribute('aria-pressed', String(j === k)));
      if (k) li.dataset.vista = 'como'; else delete li.dataset.vista;
      const pr = $('.practica', li); if (k && pr && !quieto()) { pr.removeAttribute('data-visto'); void pr.offsetWidth; pr.toggleAttribute('data-visto', true); }
      sonar('click', { tono: k ? 1.5 : 1.2, vol: .2 });
    }));
  });
  rotular(); document.addEventListener('idioma', rotular);
})();

// ═══════════ 20/11 · fondos y funciones nuevas (pedido del dueño con design-unslopify) ═══════════

// ——— E051 · hora en Buenos Aires con día o noche y la diferencia con el visitante; se actualiza al cambiar el minuto ———
(function hora() {
  const el = $('[data-hora]'); if (!el) return;
  const ZONA = 'America/Argentina/Buenos_Aires', OFFSET_BA = -180; // ponytail: Argentina no usa horario de verano; si vuelve, calcular el offset con Intl
  const SOL = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></svg>';
  const LUNA = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 10.6A5 5 0 0 1 5.4 4.5a5 5 0 1 0 6.1 6.1Z"/></svg>';
  const pintar = () => {
    const ahora = new Date();
    const hBA = Number(new Intl.DateTimeFormat('en-US', { timeZone: ZONA, hour: 'numeric', hourCycle: 'h23' }).format(ahora));
    const texto = new Intl.DateTimeFormat(ingles ? 'en-US' : 'es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: ingles }).format(ahora);
    const dif = Math.round((OFFSET_BA + ahora.getTimezoneOffset()) / 60);
    const rel = dif === 0 ? t('tu misma hora', 'same time as you') : dif > 0 ? t(`${dif} h más que vos`, `${dif} h ahead of you`) : t(`${-dif} h menos que vos`, `${-dif} h behind you`);
    el.innerHTML = `${hBA >= 7 && hBA < 19 ? SOL : LUNA}<time>${texto}</time> · ${rel}`;
  };
  pintar(); document.addEventListener('idioma', pintar);
  const programar = () => setTimeout(() => { pintar(); programar(); }, 60000 - Date.now() % 60000);
  programar();
})();

// ——— E008 · curvas de nivel detrás de Experiencia: ruido de valor en una grilla de 64×36, marching squares, Catmull-Rom.
// Se calcula en un Web Worker; cada 8 s cambia de forma con un fundido de 1,6 s y el puntero levanta una loma que las curvas rodean. ———
(function topografia() {
  const svg = $('[data-topo]'); if (!svg || !window.Worker) return;
  const sec = svg.closest('section'), [g1, g2] = $$('g', svg);
  const codigo = `
  const hash = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const suav = t => t * t * (3 - 2 * t);
  const ruido = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), u = suav(x - xi), v = suav(y - yi), a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const CASOS = [[], [['l','b']], [['b','r']], [['l','r']], [['t','r']], [['l','t'],['b','r']], [['t','b']], [['l','t']], [['l','t']], [['t','b']], [['t','r'],['l','b']], [['t','r']], [['l','r']], [['b','r']], [['l','b']], []];
  self.onmessage = ({ data: { W, H, niveles, z, px, py } }) => {
    const campo = new Float32Array((W + 1) * (H + 1)); let min = 9, max = -9;
    for (let j = 0; j <= H; j++) for (let i = 0; i <= W; i++) {
      let v = 0, amp = 1, fr = 1 / 11, tot = 0;
      for (let o = 0; o < 3; o++) { v += ruido(i * fr, j * fr, z + o * 31) * amp; tot += amp; amp *= .5; fr *= 2; }
      v /= tot; if (px > -1) { const d2 = (i - px) ** 2 + (j - py) ** 2; v += .3 * Math.exp(-d2 / 36); }
      campo[j * (W + 1) + i] = v; if (v < min) min = v; if (v > max) max = v;
    }
    const val = (i, j) => campo[j * (W + 1) + i];
    const salida = [];
    for (let k = 0; k < niveles; k++) {
      const L = min + (max - min) * (k + .5) / niveles, pt = new Map(), ady = new Map();
      const punto = (i, j, lado) => {
        const ii = lado === 'r' ? i + 1 : i, jj = lado === 'b' ? j + 1 : j, horiz = lado === 't' || lado === 'b', clave = (horiz ? 'h' : 'v') + ii + ',' + jj;
        if (!pt.has(clave)) { const a = val(ii, jj), b = horiz ? val(ii + 1, jj) : val(ii, jj + 1), f = (L - a) / ((b - a) || 1e-9); pt.set(clave, horiz ? [ii + f, jj] : [ii, jj + f]); }
        return clave;
      };
      const unir = (a, b) => { (ady.get(a) || ady.set(a, []).get(a)).push(b); (ady.get(b) || ady.set(b, []).get(b)).push(a); };
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const c = (val(i, j) > L) << 3 | (val(i + 1, j) > L) << 2 | (val(i + 1, j + 1) > L) << 1 | (val(i, j + 1) > L);
        for (const [a, b] of CASOS[c]) unir(punto(i, j, a), punto(i, j, b));
      }
      let d = '';
      const quitar = (a, b) => { const l = ady.get(a); l.splice(l.indexOf(b), 1); };
      const inicios = [...ady.keys()].sort((a, b) => ady.get(a).length - ady.get(b).length);
      for (const ini of inicios) {
        while (ady.get(ini).length) {
          const linea = [ini]; let actual = ini;
          while (ady.get(actual).length) { const sig = ady.get(actual)[0]; quitar(actual, sig); quitar(sig, actual); linea.push(sig); actual = sig; }
          const p = linea.map(c => pt.get(c)); if (p.length < 3) continue;
          const f = n => n.toFixed(2);
          d += 'M' + f(p[0][0]) + ' ' + f(p[0][1]);
          for (let n = 0; n < p.length - 1; n++) {
            const p0 = p[n - 1] || p[n], p1 = p[n], p2 = p[n + 1], p3 = p[n + 2] || p2;
            d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
          }
        }
      }
      salida.push(d);
    }
    self.postMessage(salida);
  };`;
  let trabajador; try { trabajador = new Worker(URL.createObjectURL(new Blob([codigo], { type: 'text/javascript' }))); } catch { return; }
  const chico = innerWidth < 760, W = 64, H = 36, niveles = chico ? 8 : 14;
  let z = 1, visible = 0, ocupado = false, fundir = false, px = -1, py = -1, pendiente = false, enVista = false;
  const capas = [g1, g2];
  trabajador.onmessage = ({ data }) => {
    ocupado = false;
    const destino = fundir ? capas[1 - visible] : capas[visible];
    // Cada cuarta curva es «maestra», como en los mapas: más marcada
    destino.innerHTML = `<path d="${data.filter((_, k) => k % 4 !== 3).join('')}"/><path class="maestra" d="${data.filter((_, k) => k % 4 === 3).join('')}"/>`;
    if (fundir) {
      fundir = false; const viejo = capas[visible]; visible = 1 - visible;
      if (quieto()) { destino.style.opacity = 1; viejo.style.opacity = 0; }
      else { destino.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, easing: 'ease-in-out', fill: 'forwards' }); viejo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1600, easing: 'ease-in-out', fill: 'forwards' }); }
    }
    if (pendiente) { pendiente = false; pedir(); }
  };
  const pedir = (cruzar = false) => { if (ocupado) { pendiente = true; return; } ocupado = true; fundir = cruzar; trabajador.postMessage({ W, H, niveles, z, px, py }); };
  capas[0].style.opacity = 1; capas[1].style.opacity = 0; pedir();
  setInterval(() => { if (enVista && !quieto() && !document.hidden) { z++; pedir(true); } }, 8000);
  new IntersectionObserver(([e]) => { enVista = e.isIntersecting; }).observe(sec);
  let ultimo = 0;
  sec.addEventListener('pointermove', e => {
    if (quieto() || e.pointerType !== 'mouse') return;
    const ahora = performance.now(); if (ahora - ultimo < 90) return; ultimo = ahora;
    const r = svg.getBoundingClientRect(), esc = Math.max(r.width / W, r.height / H); // preserveAspectRatio slice
    px = (e.clientX - r.left - (r.width - W * esc) / 2) / esc; py = (e.clientY - r.top - (r.height - H * esc) / 2) / esc; pedir();
  });
  sec.addEventListener('pointerleave', () => { px = py = -1; pedir(); });
})();

// ——— E010 · separadores con estrellas: tres capas que se mueven a distinta velocidad con el scroll; 3 % titila ———
(function estrellas() {
  const seps = $$('.estrellas'); if (!seps.length) return;
  const capa = (n, rmax, alfa) => {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
    for (let k = 0; k < n; k++) { x.fillStyle = `rgba(232,236,255,${(alfa * (.5 + Math.random() * .5)).toFixed(2)})`; x.beginPath(); x.arc(Math.random() * 512, Math.random() * 512, .5 + Math.random() * rmax, 0, 7); x.fill(); }
    return `url(${c.toDataURL()})`;
  };
  const densidad = .0009 * 512 * 512;
  [[densidad * 1.2, .6, .45], [densidad * .7, .9, .7], [densidad * .35, 1.25, .95], [densidad * .03 * 3, 1.3, 1]].forEach(([n, r, a], k) => raiz.style.setProperty(`--estrellas-${k + 1}`, capa(Math.round(n), r, a)));
  if (CSS.supports('animation-timeline: view()')) return;
  // Sin línea de tiempo de scroll: un solo cuadro por scroll mueve las capas
  let pedido = false;
  addEventListener('scroll', () => { if (pedido) return; pedido = true; requestAnimationFrame(() => { pedido = false; seps.forEach(s => s.style.setProperty('--desp', (s.getBoundingClientRect().top / innerHeight).toFixed(3))); }); }, { passive: true });
})();

// ——— E009 · metal líquido detrás del contacto: dos gotas de cromo que se juntan y se separan; el puntero empuja la más cercana ———
(function mercurio() {
  const caja = $('[data-mercurio]'); if (!caja) return;
  const sec = caja.closest('section'), gotas = $$('.gotas i', caja);
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  sec.addEventListener('pointermove', e => {
    if (quieto()) return;
    let cerca = null, dmin = Infinity, vx = 0, vy = 0;
    gotas.forEach(g => { const r = g.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy); if (d < dmin) { dmin = d; cerca = g; vx = dx; vy = dy; } });
    gotas.forEach(g => { if (g !== cerca) { g.style.setProperty('--nx', '0px'); g.style.setProperty('--ny', '0px'); } });
    const k = Math.min(30, dmin * .15) / (dmin || 1);
    cerca.style.setProperty('--nx', (vx * k).toFixed(1) + 'px'); cerca.style.setProperty('--ny', (vy * k).toFixed(1) + 'px');
  });
  sec.addEventListener('pointerleave', () => gotas.forEach(g => { g.style.setProperty('--nx', '0px'); g.style.setProperty('--ny', '0px'); }));
})();

// ——— E240 · talones que se arrancan: se arrastra (o se toca) el talón perforado y detrás aparece un dato real de esa entrada ———
(function talones() {
  $$('[data-talon]').forEach(tal => {
    const entrada = tal.closest('.entrada'), pegar = $('[data-pegar]', entrada);
    let ini = null, dx = 0, dy = 0, arrastro = false;
    const mover = () => tal.style.setProperty('--tx', `${dx}px`) || tal.style.setProperty('--ty', `${dy}px`) || tal.style.setProperty('--tr', `${(dx / 6).toFixed(1)}deg`);
    const arrancar = () => {
      entrada.toggleAttribute('data-arrancado', true); tal.setAttribute('aria-expanded', 'true'); sonar('success', { vol: .35 });
      dx = dy = 0; mover(); setTimeout(() => pegar.focus({ preventScroll: true }), quieto() ? 0 : 420);
    };
    tal.addEventListener('pointerdown', e => { if (e.button) return; ini = { x: e.clientX, y: e.clientY }; arrastro = false; tal.setPointerCapture(e.pointerId); tal.toggleAttribute('data-tirando', true); });
    tal.addEventListener('pointermove', e => {
      if (!ini) return; dx = Math.max(-10, e.clientX - ini.x); dy = e.clientY - ini.y;
      if (Math.hypot(dx, dy) > 6) arrastro = true; if (!quieto()) mover();
    });
    const soltar = () => {
      if (!ini) return; ini = null; tal.removeAttribute('data-tirando');
      if (!arrastro || Math.hypot(dx, dy) > 60) arrancar(); else { dx = dy = 0; mover(); }
    };
    tal.addEventListener('pointerup', soltar); tal.addEventListener('pointercancel', () => { ini = null; dx = dy = 0; mover(); tal.removeAttribute('data-tirando'); });
    tal.addEventListener('click', e => { if (e.detail === 0) arrancar(); }); // teclado (Enter o espacio)
    pegar.addEventListener('click', () => { entrada.removeAttribute('data-arrancado'); tal.setAttribute('aria-expanded', 'false'); sonar('click', { vol: .25 }); tal.focus({ preventScroll: true }); });
  });
})();

// ——— E096 · ícono de pestaña vivo: en el Ciclo toma el color de la etapa y marca cuántas van; «Medir ahora» lo usa para mostrar
// midiendo, listo o falla. Fuera del ciclo vuelve al ∞ de siempre. ———
const iconoPestana = (() => {
  const icono = $('[data-icono]'); if (!icono) return { etapa() {}, estado() {} };
  const original = icono.href, LAZO = 'M16 16c-2.2-3.1-3.9-4.6-6-4.6a4.6 4.6 0 0 0 0 9.2c2.1 0 3.8-1.5 6-4.6s3.9-4.6 6-4.6a4.6 4.6 0 0 1 0 9.2c-2.1 0-3.8-1.5-6-4.6Z';
  const svg = (color, parte, extra = '') => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0A0A0A"/><path d="${LAZO}" fill="none" stroke="#3a3f5c" stroke-width="2.6"/><path d="${LAZO}" pathLength="100" stroke-dasharray="${parte} 100" fill="none" stroke="${color}" stroke-width="2.8" stroke-linecap="round"/>${extra}</svg>`);
  let enCiclo = false, ultima = null, midiendo = false;
  const ciclo = $('[data-trayectoria]');
  if (ciclo) new IntersectionObserver(([e]) => { enCiclo = e.isIntersecting; if (!midiendo) icono.href = enCiclo && ultima ? ultima : original; }, { rootMargin: '-45% 0px -45% 0px' }).observe(ciclo);
  document.addEventListener('etapa', e => { const li = $$('[data-paso]')[e.detail]; if (!li) return; ultima = svg(li.style.getPropertyValue('--c').trim(), Math.round((e.detail + 1) / 8 * 100)); if (enCiclo && !midiendo) icono.href = ultima; });
  return {
    estado(tipo, parte = 30) {
      midiendo = tipo === 'midiendo';
      if (tipo === 'midiendo') icono.href = svg('#8FA6FF', parte);
      else if (tipo === 'listo') icono.href = svg('#2EE6A8', 100);
      else if (tipo === 'falla') icono.href = svg('#FF4F8B', 100);
      if (tipo !== 'midiendo') setTimeout(() => { if (!midiendo) icono.href = enCiclo && ultima ? ultima : original; }, 2500);
    },
  };
})();

// ——— «Medir ahora»: desde el navegador del visitante, tres pedidos a cada sitio y la mediana; borde de luz mientras mide ———
(function medirAhora() {
  const caja = $('[data-medir]'); if (!caja) return;
  const boton = $('[data-medir-boton]', caja), lista = $('[data-medir-res]', caja);
  const SITIOS = [['masterpet.com.ar', 'https://masterpet.com.ar/', 'no-cors'], ['reyalejandro.github.io', location.origin + location.pathname, 'same-origin']];
  const una = async (url, modo) => { const t0 = performance.now(); await fetch(url + (url.includes('?') ? '&' : '?') + 'medir=' + Date.now(), { mode: modo, cache: 'no-store', method: modo === 'no-cors' ? 'GET' : 'HEAD' }); return performance.now() - t0; };
  boton.addEventListener('click', async () => {
    if (caja.hasAttribute('data-midiendo')) return;
    caja.toggleAttribute('data-midiendo', true); boton.setAttribute('aria-busy', 'true'); sonar('case', { vol: .3 });
    lista.innerHTML = SITIOS.map(([n]) => `<li><b>${n}</b><span class="cifra">…</span></li>`).join('');
    let hechos = 0, fallas = 0; const total = SITIOS.length * 3;
    await Promise.all(SITIOS.map(async ([nombre, url, modo], k) => {
      const tiempos = [];
      for (let n = 0; n < 3; n++) {
        try { tiempos.push(await una(url, modo)); } catch { fallas++; }
        hechos++; iconoPestana.estado('midiendo', Math.round(hechos / total * 100));
      }
      const li = lista.children[k], cifra = $('.cifra', li);
      if (!tiempos.length) { cifra.textContent = t('no respondió', 'no answer'); li.toggleAttribute('data-falla', true); return; }
      const mediana = tiempos.sort((a, b) => a - b)[Math.floor(tiempos.length / 2)];
      cifra.textContent = `${Math.round(mediana)} ms`; li.style.setProperty('--ms', Math.min(1, mediana / 1500).toFixed(3)); li.toggleAttribute('data-listo', true);
    }));
    caja.removeAttribute('data-midiendo'); boton.removeAttribute('aria-busy');
    iconoPestana.estado(fallas === total ? 'falla' : 'listo'); sonar(fallas === total ? 'click' : 'success', { vol: .35 });
  });
})();

// ——— PDF flotante: aparece después de la portada (en el celular desde el comienzo), se esconde en el ciclo fijo y en el contacto (ya tiene el suyo) y su anillo marca cuánto se leyó ———
(function pdfFlotante() {
  const caja = $('[data-pdf-flotante]'); if (!caja) return;
  const contacto = $('#contacto'); let pedido = false;
  const medir = () => {
    pedido = false;
    const total = Math.max(1, document.documentElement.scrollHeight - innerHeight), c = contacto?.getBoundingClientRect();
    const ciclo = $('[data-trayectoria]')?.getBoundingClientRect(), fijo = ciclo && ciclo.top <= 1 && ciclo.bottom >= innerHeight - 1;
    caja.toggleAttribute('data-visible', (innerWidth < 600 || scrollY > innerHeight * .75) && !fijo && !(c && c.top < innerHeight * .8));
    caja.style.setProperty('--leido', (scrollY / total).toFixed(3));
  };
  addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(medir); } }, { passive: true });
  addEventListener('resize', medir); medir();
})();

aplicarIdioma();
