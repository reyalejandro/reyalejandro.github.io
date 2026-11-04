// Mide la disponibilidad de los sitios y trae las contribuciones públicas de GitHub; escribe estado.json.
// Uso: node estado.mjs <ruta de estado.json>   ·   Prueba: node estado.mjs --prueba
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SERVICIOS = [['masterpet.com.ar', 'https://masterpet.com.ar/'], ['reyalejandro.github.io', 'https://reyalejandro.github.io/']];
const USUARIO = 'reyalejandro', DIAS = 90;

// Del HTML público de contribuciones: cada día tiene su fecha en la celda y su cantidad en el tooltip.
export function contribuciones(html) {
  const fechas = new Map([...html.matchAll(/data-date="(\d{4}-\d\d-\d\d)" id="(contribution-day-component-\d+-\d+)"/g)].map(m => [m[2], m[1]]));
  const dias = [];
  for (const m of html.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>(No|\d+) contributions? on/g)) {
    const f = fechas.get(m[1]); if (f) dias.push([f, m[2] === 'No' ? 0 : Number(m[2])]);
  }
  dias.sort(([a], [b]) => a.localeCompare(b));
  return { total: dias.reduce((n, [, c]) => n + c, 0), dias };
}

// Suma una medición al día de hoy y descarta lo que pasó de DIAS.
export function sumar(servicio, hoy, { ok, ms }) {
  const d = servicio.dias[hoy] ||= { ok: 0, total: 0, ms: 0 };
  d.ms = ok ? Math.round((d.ms * d.ok + ms) / (d.ok + 1)) : d.ms;
  d.total++; if (ok) d.ok++;
  servicio.ultimo = { ok, ms: ok ? ms : null, cuando: new Date().toISOString() };
  const limite = new Date(Date.parse(hoy) - DIAS * 864e5).toISOString().slice(0, 10);
  for (const f of Object.keys(servicio.dias)) if (f < limite) delete servicio.dias[f];
  return servicio;
}

async function medir(url) {
  const t = performance.now();
  try { const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'estado-cv (GitHub Actions)' } }); return { ok: r.ok, ms: Math.round(performance.now() - t) }; }
  catch { return { ok: false, ms: null }; }
}

if (process.argv[2] === '--prueba') {
  const html = '<td data-date="2026-01-01" id="contribution-day-component-0-0"></td><td data-date="2026-01-02" id="contribution-day-component-1-0"></td>'
    + '<tool-tip for="contribution-day-component-0-0" x>No contributions on January 1st.</tool-tip><tool-tip for="contribution-day-component-1-0" x>3 contributions on January 2nd.</tool-tip>';
  const c = contribuciones(html);
  console.assert(c.total === 3 && c.dias.length === 2 && c.dias[1][1] === 3, 'contribuciones', c);
  const s = sumar({ dias: { '2025-01-01': { ok: 1, total: 1, ms: 100 } } }, '2026-01-10', { ok: true, ms: 200 });
  sumar(s, '2026-01-10', { ok: false, ms: null });
  console.assert(!s.dias['2025-01-01'] && s.dias['2026-01-10'].ok === 1 && s.dias['2026-01-10'].total === 2 && s.ultimo.ok === false, 'sumar', s);
  console.log('ok');
} else {
  const ruta = process.argv[2] || 'estado.json';
  let previo = {}; try { previo = existsSync(ruta) ? JSON.parse(readFileSync(ruta, 'utf8')) : {}; } catch {}
  const hoy = new Date().toISOString().slice(0, 10);
  const servicios = [];
  for (const [nombre, url] of SERVICIOS) {
    const sv = (previo.servicios || []).find(x => x.url === url) || { nombre, url, dias: {} };
    servicios.push(sumar(sv, hoy, await medir(url)));
  }
  let github = previo.github || null;
  try { const r = await fetch(`https://github.com/users/${USUARIO}/contributions`, { signal: AbortSignal.timeout(15000) }); if (r.ok) { const g = contribuciones(await r.text()); if (g.dias.length) github = g; } } catch {}
  writeFileSync(ruta, JSON.stringify({ actualizado: new Date().toISOString(), servicios, github }) + '\n');
  console.log(servicios.map(s => `${s.nombre}: ${s.ultimo.ok ? 'ok ' + s.ultimo.ms + ' ms' : 'sin respuesta'}`).join(' · '), '· GitHub:', github?.total ?? '—');
}
