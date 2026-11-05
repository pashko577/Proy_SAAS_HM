/* ==========================================================================
   School HR SaaS — Prototipo (Bootstrap 5.3 + design_system.md)
   SPA con rutas por hash. Datos simulados en memoria.
   ========================================================================== */
(() => {
'use strict';

/* ---------- Utilidades ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('shr.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('shr.' + k, JSON.stringify(v)); } catch {} }
};
const money = n => 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = n => String(n).padStart(2, '0');
const hhmm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const TODAY = new Date();
const fmtDateLong = d => d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDate = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
/* Fecha local AAAA-MM-DD para inputs date (toISOString usa UTC y de noche daba el día siguiente) · v2 */
const isoD = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/* ---------- Estados (§18) ---------- */
const ST = {
  puntual:      { ico: '✓', txt: 'Puntual' },
  tardanza:     { ico: '▲', txt: 'Tardanza' },
  inasistencia: { ico: '✕', txt: 'Inasistencia' },
  justificada:  { ico: '◆', txt: 'Justificada' },
  salida:       { ico: '◀', txt: 'Salida anticipada' },
  pendiente:    { ico: '○', txt: 'Pendiente' }
};
const badge = (st, extra = '', solid = false) =>
  `<span class="status-badge status-badge--${st}${solid ? ' solid' : ''}"><span class="sb-ico" aria-hidden="true">${ST[st].ico}</span>${ST[st].txt}${extra ? ' · ' + esc(extra) : ''}</span>`;

/* Estados de una solicitud de justificación (§18.1) — mismos badges en Admin y Docente */
const JST = {
  pendiente: { cls: 'pendiente',    ico: '○', txt: 'Pendiente de revisión' },
  aprobada:  { cls: 'justificada',  ico: '◆', txt: 'Aprobada' },
  rechazada: { cls: 'inasistencia', ico: '✕', txt: 'Rechazada' }
};
const justifBadge = estado => { const s = JST[estado];
  return `<span class="status-badge status-badge--${s.cls}"><span class="sb-ico" aria-hidden="true">${s.ico}</span>${s.txt}</span>`; };
/* Tipo de registro que se justifica → estado de asistencia */
const JTIPO = { tardanza: 'Tardanza', inasistencia: 'Inasistencia', salida: 'Salida anticipada' };
const tipoBadge = tipo => badge(Object.keys(JTIPO).find(k => JTIPO[k] === tipo) || 'inasistencia');

/* ---------- Datos simulados ---------- */
const PEOPLE = [
  ['María Torres Vega',       '41235678', 'Matemática',        'Sede Central', 'Docente',        'puntual',      '07:38', '14:35'],
  ['Jorge Huamán Ríos',       '42567812', 'Comunicación',      'Sede Central', 'Docente',        'tardanza',     '08:07', '14:40'],
  ['Rosa Chávez Paredes',     '43678123', 'Ciencia y Tecnología','Sede Norte', 'Docente',        'puntual',      '07:41', '14:31'],
  ['Luis Quispe Mamani',      '40891234', 'Historia',          'Sede Central', 'Docente',        'puntual',      '07:44', '14:30'],
  ['Carmen Flores Díaz',      '44912345', 'Inglés',            'Sede Norte',   'Docente',        'inasistencia', '',      ''],
  ['Marco Salazar Núñez',     '70112233', 'Matemática',        'Sede Norte',   'Docente',        'puntual',      '07:36', '14:32'],
  ['Ana Gutiérrez León',      '45123456', 'Arte y Cultura',    'Sede Central', 'Docente',        'justificada',  '',      ''],
  ['Pedro Mendoza Salas',     '46234567', 'Educación Física',  'Sede Central', 'Docente',        'puntual',      '07:30', '14:35'],
  ['Lucía Vargas Soto',       '47345678', 'Comunicación',      'Sede Norte',   'Docente',        'tardanza',     '08:12', '14:30'],
  ['Raúl Castillo Pérez',     '48456789', 'Ciencia y Tecnología','Sede Central','Docente',       'salida',       '07:40', '12:10'],
  ['Silvia Rojas Campos',     '49567890', 'Religión',          'Sede Central', 'Docente',        'puntual',      '07:42', '14:33'],
  ['Diego Ramírez Cruz',      '41678901', 'Computación',       'Sede Norte',   'Docente',        'puntual',      '07:39', '14:31'],
  ['Elena Paredes Ruiz',      '42789012', 'Matemática',        'Sede Central', 'Docente',        'puntual',      '07:35', '14:36'],
  ['Patricia Ramos Aguilar',  '45781234', 'Recursos Humanos',  'Sede Central', 'Administrativo', 'puntual',      '07:50', ''],
  ['Óscar Medina Luna',       '43890123', 'Secretaría',        'Sede Central', 'Administrativo', 'puntual',      '07:52', ''],
  ['Julia Espinoza Vera',     '44901234', 'Contabilidad',      'Sede Norte',   'Administrativo', 'tardanza',     '08:15', '']
];
const DB = {
  people: PEOPLE.map((p, i) => ({
    id: 'D-' + String(i + 1).padStart(3, '0'), n: p[0], dni: p[1], area: p[2], sede: p[3], tipo: p[4], st: p[5], in: p[6], out: p[7],
    email: p[0].split(' ')[0][0].toLowerCase() + p[0].split(' ')[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@sanjose.edu.pe',
    tel: '9' + String(10000000 + i * 734219).slice(0, 8),
    ingreso: fmtDate(addDays(TODAY, -(300 + i * 211))),
    basico: [2400, 2200, 2350, 2500, 2100, 2300, 2150, 2250, 2200, 2400, 2100, 2300, 2450, 3200, 1900, 2600][i]
  })),
  contracts: [],
  replacements: [
    { id: 'R-031', ausente: 'Carmen Flores Díaz', curso: 'Inglés · 3.° B', fecha: fmtDate(TODAY), hora: '08:00 – 09:30', sede: 'Sede Norte', estado: 'pendiente', asignado: '' },
    { id: 'R-032', ausente: 'Carmen Flores Díaz', curso: 'Inglés · 4.° A', fecha: fmtDate(TODAY), hora: '10:00 – 11:30', sede: 'Sede Norte', estado: 'pendiente', asignado: '' },
    { id: 'R-033', ausente: 'Ana Gutiérrez León', curso: 'Arte y Cultura · 1.° C', fecha: fmtDate(TODAY), hora: '11:30 – 13:00', sede: 'Sede Central', estado: 'pendiente', asignado: '' },
    { id: 'R-029', ausente: 'Raúl Castillo Pérez', curso: 'Ciencia y Tecnología · 5.° A', fecha: fmtDate(addDays(TODAY, -1)), hora: '12:30 – 14:00', sede: 'Sede Central', estado: 'asignado', asignado: 'Rosa Chávez Paredes' }
  ],
  justifs: [
    { id: 'J-118', n: 'Ana Gutiérrez León', fecha: fmtDate(TODAY), tipo: 'Inasistencia', motivo: 'Cita médica (EsSalud)', adj: 'constancia_cita.pdf', estado: 'pendiente' },
    { id: 'J-117', n: 'Jorge Huamán Ríos', fecha: fmtDate(TODAY), tipo: 'Tardanza', motivo: 'Paro de transporte en Av. Arequipa', adj: '', estado: 'pendiente' },
    { id: 'J-115', n: 'Lucía Vargas Soto', fecha: fmtDate(addDays(TODAY, -2)), tipo: 'Tardanza', motivo: 'Trámite en UGEL', adj: 'cargo_ugel.jpg', estado: 'aprobada' },
    { id: 'J-116', n: 'Diego Ramírez Cruz', fecha: fmtDate(addDays(TODAY, -6)), tipo: 'Inasistencia', motivo: 'Duelo por familiar directo', adj: 'acta_defuncion.pdf', estado: 'aprobada' },
    { id: 'J-113', n: 'Rosa Chávez Paredes', fecha: fmtDate(addDays(TODAY, -9)), tipo: 'Tardanza', motivo: 'Tráfico en la Panamericana', adj: '', estado: 'rechazada' },
    { id: 'J-112', n: 'Carmen Flores Díaz', fecha: fmtDate(addDays(TODAY, -12)), tipo: 'Inasistencia', motivo: 'Descanso médico de 1 día', adj: 'certificado_medico.pdf', estado: 'aprobada' },
    { id: 'J-109', n: 'Marco Salazar Núñez', fecha: fmtDate(addDays(TODAY, -45)), tipo: 'Tardanza', motivo: 'Transporte / fuerza mayor', adj: '', estado: 'aprobada' }
  ],
  audit: [
    ['Patricia Ramos', addDays(TODAY, 0), '09:12', 'Aprobó justificación', 'J-116 · Silvia Rojas Campos', true],
    ['Patricia Ramos', addDays(TODAY, -1), '17:40', 'Modificó contrato', 'C-0207 · Diego Ramírez Cruz — fin 31/12/2026', true],
    ['Óscar Medina', addDays(TODAY, -1), '11:05', 'Registró docente', 'D-013 · Elena Paredes Ruiz', false],
    ['Patricia Ramos', addDays(TODAY, -2), '16:22', 'Asignó reemplazo', 'R-029 · Rosa Chávez → 5.° A', false],
    ['Julia Espinoza', addDays(TODAY, -3), '12:48', 'Registró pago', 'Planilla agosto · 13 docentes', true],
    ['Sistema', addDays(TODAY, -3), '00:05', 'Cálculo automático', 'Tardanzas del día: 3', false]
  ]
};
DB.people.forEach((p, i) => {
  const tipos = ['Plazo fijo', 'Indeterminado', 'Por horas'];
  const ini = addDays(TODAY, -(120 + i * 37));
  const fin = [12, 25, 180, 360, 8, 200, 95, 400, 28, 150, 60, 310, 250, 500, 45, 330][i];
  DB.contracts.push({ id: 'C-02' + String(i + 1).padStart(2, '0'), pid: p.id, n: p.n, tipo: tipos[i % 3], ini, fin: addDays(TODAY, fin), anulado: false });
});
const findPerson = n => DB.people.find(p => p.n === n);
/* Búsqueda de personas: parcial, sin mayúsculas ni tildes, por nombre, DNI o código (Personal, Historial · MV-05) */
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const matchPerson = (p, q) => { q = norm(q); return !q || norm(p.n).includes(q) || p.dni.includes(q) || norm(p.id).includes(q); };
const contractState = c => {
  if (c.anulado) return { k: 'anulado', ico: '✕', txt: 'Anulado', cls: 'status-badge--pendiente' };
  const d = Math.round((c.fin - TODAY) / 864e5);
  if (d < 0) return { k: 'vencido', ico: '✕', txt: 'Vencido', cls: 'status-badge--inasistencia' };
  if (d <= 30) return { k: 'porvencer', ico: '▲', txt: `Vence en ${d} días`, cls: 'status-badge--tardanza' };
  return { k: 'vigente', ico: '✓', txt: 'Vigente', cls: 'status-badge--puntual' };
};
/* MV-06 · P04: badge de contrato = calendario + glifo de atención (▲ / ✕ / ✓) + texto, forma rectangular */
const contractBadge = (c, extra = "") => { const s = contractState(c); return `<span class="status-badge is-contract ${s.cls}${extra}"><i class="bi bi-calendar3 sb-cal" aria-hidden="true"></i><span class="sb-ico" aria-hidden="true">${s.ico}</span>${s.txt}</span>`; };
const lateMin = p => p.in ? Math.max(0, toMin(p.in) - toMin(SCHEDULE_START) - 0) : 0;
const SCHEDULE_START = '07:45';
const SCHEDULE_END = '14:30';

/* ---------- Apariencia: temas y modo (§39–§41) ---------- */
const THEMES = {
  bosque:  { label: 'Bosque',  desc: 'Verde petróleo · por defecto', s: { 50: '#ECF6F3', 100: '#D3EBE4', 200: '#A7DCCB', 300: '#6FC2AA', 500: '#2A8C72', 700: '#1D6B57', 800: '#175545', 900: '#0F3B30' } },
  indigo:  { label: 'Índigo',  desc: 'Violeta azulado, tecnológico', s: { 50: '#EEF0FE', 100: '#DEE1FC', 200: '#C7CBFA', 300: '#A3A9F7', 500: '#5B5FE0', 700: '#4338CA', 800: '#3730A3', 900: '#262073' } },
  ciruela: { label: 'Ciruela', desc: 'Morado cálido, editorial', s: { 50: '#F8EFF7', 100: '#EFDDEE', 200: '#E6C6E4', 300: '#D19BCE', 500: '#9E4C9B', 700: '#7A3478', 800: '#62295F', 900: '#421B40' } },
  grafito: { label: 'Grafito', desc: 'Neutro sobrio, máxima calma', s: { 50: '#F1F3F6', 100: '#E3E7EC', 200: '#CDD5E0', 300: '#AEBACB', 500: '#66758A', 700: '#3D4A57', 800: '#2E3843', 900: '#1E252D' } },
  oceano:  { label: 'Océano',  desc: 'Azul institucional clásico', s: { 50: '#EAF3F9', 100: '#D5E6F2', 200: '#B5D3EA', 300: '#86B7DA', 500: '#3A78A6', 700: '#24557A', 800: '#1D4563', 900: '#17324D' } }
};
const hexToRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = c => '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v + (y[i] - v) * t)); };
function contrast(hex, other = '#FFFFFF') {
  const L = h => { const c = hexToRgb(h).map(v => v / 255).map(x => x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const a = L(hex), b = L(other); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
/* Genera una escala accesible desde el color del colegio (§40.3):
   700 se oscurece hasta 4.5:1 con blanco; 300 se aclara hasta 4.5:1 con 900 y con la superficie oscura. */
function generateScale(hex) {
  let c700 = hex.toUpperCase(), steps = 0;
  while (contrast(c700) < 4.5 && steps < 30) { c700 = mix(c700, '#000000', .06); steps++; }
  const s = { 700: c700, 800: mix(c700, '#000000', .2), 900: mix(c700, '#000000', .45), 500: mix(c700, '#FFFFFF', .22) };
  let t = .45; s[300] = mix(c700, '#FFFFFF', t);
  while ((contrast(s[300], s[900]) < 4.5 || contrast(s[300], '#161B22') < 4.5) && t < .9) { t += .05; s[300] = mix(c700, '#FFFFFF', t); }
  s[200] = mix(c700, '#FFFFFF', Math.min(.95, t + .2)); s[100] = mix(c700, '#FFFFFF', .86); s[50] = mix(c700, '#FFFFFF', .93);
  return { scale: s, adjusted: c700 !== hex.toUpperCase() };
}
const scaleOf = key => key === 'institucional' ? generateScale(S.school.color).scale : THEMES[key].s;
const themeLabel = k => k === 'institucional' ? 'Institucional' : THEMES[k].label;
const themeKeys = () => [...Object.keys(THEMES), 'institucional'];
const mql = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = () => S.look.mode === 'dark' || (S.look.mode === 'system' && mql.matches);

function applyAppearance(animate = true) {
  const r = document.documentElement;
  if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    r.classList.add('theme-anim'); clearTimeout(applyAppearance.t); applyAppearance.t = setTimeout(() => r.classList.remove('theme-anim'), 320);
  }
  r.setAttribute('data-bs-theme', isDark() ? 'dark' : 'light');
  r.setAttribute('data-theme-color', S.look.theme);
  r.setAttribute('data-sidebar', S.look.sidebar);
  const custom = S.look.theme === 'institucional' ? scaleOf('institucional') : null;
  [50, 100, 200, 300, 500, 700, 800, 900].forEach(k => custom ? r.style.setProperty('--p-' + k, custom[k]) : r.style.removeProperty('--p-' + k));
  store.set('customScale', custom);
  $$('[data-mode-toggle]').forEach(b => { b.setAttribute('aria-label', isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'); $('i', b).className = 'bi bi-' + (isDark() ? 'sun' : 'moon-stars'); });
  $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === S.look.mode)));
  $$('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === S.look.theme)));
  $$('[data-sb-style]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sbStyle === S.look.sidebar)));
}
function setLook(key, val, silent = false) {
  const prev = S.look[key];
  if (prev === val) return;
  S.look[key] = val; store.set(key, val); applyAppearance();
  if (!silent && key === 'theme') toast('info', `Tema ${themeLabel(val)} aplicado`, 'Los colores de estado no cambian con el tema.', { undo: () => setLook('theme', prev, true) });
}
function renderAppearanceMenu() {
  $('#appearanceMenu').innerHTML = `
    <h3>Modo</h3>
    <div class="segmented w-100" role="group" aria-label="Modo de color">
      <button data-mode="light"><i class="bi bi-sun"></i> Claro</button>
      <button data-mode="dark"><i class="bi bi-moon-stars"></i> Oscuro</button>
      <button data-mode="system"><i class="bi bi-circle-half"></i> Sistema</button>
    </div>
    <h3 class="mt-3">Tema</h3>
    <div class="theme-dots" role="group" aria-label="Tema de color">
      ${themeKeys().map(k => `<button class="theme-dot" data-theme="${k}" style="background:${scaleOf(k)[700]}" aria-label="Tema ${themeLabel(k)}" title="${themeLabel(k)}"></button>`).join('')}
    </div>
    <h3 class="mt-3">Sidebar</h3>
    <div class="segmented w-100" role="group" aria-label="Estilo del sidebar">
      <button data-sb-style="claro"><i class="bi bi-layout-sidebar"></i> Claro</button>
      <button data-sb-style="color"><i class="bi bi-layout-sidebar-inset"></i> De color</button>
    </div>
    <a href="#/apariencia" class="btn btn-outline-secondary btn-sm w-100 mt-3" data-close-appearance>Vista previa y más opciones</a>`;
  applyAppearance(false);
}

/* ---------- Estado global ---------- */
const S = {
  user: null,
  collapsed: store.get('collapsed', false),
  groups: store.get('groups', {}),
  online: navigator.onLine,
  forceOffline: false,
  school: store.get('school', { name: 'I.E.P. San José', color: '#B4532A', tol: 10 }),
  look: { mode: store.get('mode', 'system'), theme: store.get('theme', 'bosque'), sidebar: store.get('sidebar', 'claro') },
  punch: { in: null, out: null, st: null, queued: false },
  simTime: 'now',
  sort: { key: 'n', dir: 1 },
  filters: { q: '', area: '', contrato: '' },
  sel: {}
};
const USERS = {
  admin:   { role: 'admin', name: 'Patricia Ramos', short: 'RR. HH.', roleLabel: 'Administración / RR. HH.', dni: '45781234' },
  docente: { role: 'docente', name: 'Marco Salazar', short: 'Docente', roleLabel: 'Docente · Sede Norte', dni: '70112233' }
};

/* ---------- Navegación por rol (§26) ---------- */
const NAV = {
  admin: [
    { n: '00', ico: 'grid-1x2', label: 'Inicio', href: '#/inicio' },
    { section: 'Gestión' },
    { n: '01', ico: 'people', label: 'Personal', id: 'personal', children: [
      { label: 'Docentes', href: '#/personal/docentes' },
      { label: 'Administrativos', href: '#/personal/administrativos' } ] },
    { n: '02', ico: 'clock-history', label: 'Asistencia', id: 'asistencia', children: [
      { label: 'Registro diario', href: '#/asistencia/diario' },
      { label: 'Historial', href: '#/asistencia/historial' },
      { label: 'Justificaciones', href: '#/asistencia/justificaciones' } ] },
    { n: '03', ico: 'calendar-week', label: 'Horarios', href: '#/horarios' },
    { n: '04', ico: 'file-earmark-text', label: 'Contratos', href: '#/contratos' },
    { n: '05', ico: 'arrow-left-right', label: 'Reemplazos', href: '#/reemplazos' },
    { n: '06', ico: 'cash-stack', label: 'Planillas', href: '#/planillas' },
    { n: '07', ico: 'bar-chart-line', label: 'Reportes', href: '#/reportes' },
    { section: 'Sistema' },
    { n: '08', ico: 'shield-check', label: 'Auditoría', href: '#/auditoria' },
    { n: '09', ico: 'gear', label: 'Configuración', href: '#/configuracion' }
  ],
  docente: [
    { n: '00', ico: 'grid-1x2', label: 'Mi panel', href: '#/inicio' },
    { section: 'Mi información' },
    { n: '01', ico: 'clock-history', label: 'Mi asistencia', href: '#/mi-asistencia' },
    { n: '02', ico: 'calendar-week', label: 'Mi horario', href: '#/mi-horario' },
    { n: '03', ico: 'cash-stack', label: 'Mis pagos', href: '#/mis-pagos' }
  ]
};
const allowedHrefs = role => NAV[role].flatMap(i => i.children ? i.children.map(c => c.href) : i.href ? [i.href] : []).concat('#/perfil', '#/apariencia');

function renderNav() {
  const html = NAV[S.user.role].map(item => {
    if (item.section) return `<div class="sb-section">${item.section}</div>`;
    if (item.children) {
      const open = !!S.groups[item.id];
      return `<div class="sb-group">
        <button class="sb-item" data-group="${item.id}" aria-expanded="${open}" aria-controls="grp-${item.id}" data-tip="${item.label}">
          <i class="bi bi-${item.ico}" aria-hidden="true"></i><span class="sb-num">${item.n}</span><span class="sb-label">${item.label}</span><i class="bi bi-chevron-right sb-chev sb-label" aria-hidden="true"></i>
        </button>
        <ul class="sb-sub collapse${open ? ' show' : ''}" id="grp-${item.id}">
          ${item.children.map(c => `<li><a href="${c.href}">${c.label}</a></li>`).join('')}
        </ul></div>`;
    }
    return `<a class="sb-item" href="${item.href}" data-tip="${item.label}"><i class="bi bi-${item.ico}" aria-hidden="true"></i><span class="sb-num">${item.n}</span><span class="sb-label">${item.label}</span></a>`;
  }).join('');
  $('#sbNav').innerHTML = html;

  $$('#sbNav [data-group]').forEach(btn => {
    const id = btn.dataset.group;
    const el = $('#grp-' + id);
    const col = bootstrap.Collapse.getOrCreateInstance(el, { toggle: false });
    el.addEventListener('show.bs.collapse', () => { btn.setAttribute('aria-expanded', 'true'); S.groups[id] = true; store.set('groups', S.groups); });
    el.addEventListener('hide.bs.collapse', () => { btn.setAttribute('aria-expanded', 'false'); S.groups[id] = false; store.set('groups', S.groups); });
    btn.addEventListener('click', e => {
      // MV-02: en modo íconos el clic abre el submenú flotante (antes saltaba directo al primer submódulo)
      if (isCompact()) { if (flyBtn === btn && e.detail === 0) closeFlyout(); else openFlyout(btn, e.detail === 0); return; }
      col.toggle();
    });
  });
}
function markActiveNav() {
  const h = location.hash;
  $$('#sbNav .active').forEach(e => e.classList.remove('active'));
  $$('#sbNav [aria-current]').forEach(e => e.removeAttribute('aria-current'));
  const link = $$('#sbNav a').filter(a => !a.closest('#sbFlyout')).find(a => h === a.getAttribute('href'));
  if (!link) return;
  link.classList.add('active'); link.setAttribute('aria-current', 'page');
  const sub = link.closest('.sb-sub');
  if (sub) {
    const btn = $(`[data-group="${sub.id.replace('grp-', '')}"]`);
    btn.classList.add('active');
    if (!sub.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(sub, { toggle: false }).show();
  }
}

/* ---------- Sidebar plegable (§11) ---------- */
const isDesktop = () => window.matchMedia('(min-width: 992px)').matches;
const isRail = () => window.matchMedia('(min-width: 768px) and (max-width: 991.98px)').matches;
/* Menú en modo íconos: plegado por el usuario en escritorio, o riel en 768–991 px sin desplegar */
const isCompact = () => (S.collapsed && isDesktop()) || (isRail() && !$('#app').classList.contains('sb-open'));

/* ---------- Submenú flotante (MV-02 · §11.1) ---------- */
let flyBtn = null, flyTimer = null;
function openFlyout(btn, focusFirst = false) {
  clearTimeout(flyTimer);
  const item = NAV[S.user.role].find(i => i.id === btn.dataset.group);
  let fly = $('#sbFlyout');
  if (!fly) { fly = document.createElement('div'); fly.id = 'sbFlyout'; fly.className = 'sb-flyout'; fly.hidden = true; }
  if (flyBtn && flyBtn !== btn) flyBtn.setAttribute('aria-expanded', 'false');
  fly.innerHTML = `<p class="sb-fly-title" id="flyTitle">${item.label}</p>
    <ul aria-labelledby="flyTitle">${item.children.map(c => `<li><a href="${c.href}"${location.hash === c.href ? ' class="active" aria-current="page"' : ''}>${c.label}</a></li>`).join('')}</ul>`;
  btn.after(fly); // justo después del botón: el orden de tabulación sigue siendo natural
  const r = btn.getBoundingClientRect();
  fly.hidden = false;
  fly.style.left = (r.right + 8) + 'px';
  fly.style.top = Math.min(r.top, window.innerHeight - fly.offsetHeight - 8) + 'px';
  flyBtn = btn; btn.setAttribute('aria-expanded', 'true');
  const tip = $('.sb-tip'); if (tip) tip.hidden = true;
  if (focusFirst) $('a', fly).focus();
}
function closeFlyout(returnFocus = false) {
  clearTimeout(flyTimer);
  const fly = $('#sbFlyout');
  if (!fly || fly.hidden) return;
  fly.hidden = true;
  if (flyBtn) { flyBtn.setAttribute('aria-expanded', 'false'); if (returnFocus) flyBtn.focus(); }
  flyBtn = null;
}
function applyCollapsed() {
  $('#app').classList.toggle('sb-collapsed', S.collapsed);
  const b = $('#collapseBtn');
  b.setAttribute('aria-expanded', String(!S.collapsed));
  // AC-03: desplegado, el nombre sale del texto visible ("Plegar menú Ctrl B"); plegado no hay texto visible
  if (S.collapsed) b.setAttribute('aria-label', 'Expandir menú'); else b.removeAttribute('aria-label');
}
function toggleCollapsed() { S.collapsed = !S.collapsed; store.set('collapsed', S.collapsed); applyCollapsed(); }
function setMobileOpen(open) {
  $('#app').classList.toggle('sb-open', open);
  $('#menuBtn').setAttribute('aria-expanded', String(open));
  if (open) setTimeout(() => $('#sbNav a, #sbNav button')?.focus(), 50);
}

/* ---------- Toasts v2 (§19) ----------
   toast(type, title, msg, { undo, action:{label,run}, persistent, duration })
   type: success | error | warning | info | loading
   Devuelve { update(type,title,msg,opts), close() } — útil para "cargando → resultado". */
const TOAST_ICO = { success: '✓', error: '✕', warning: '▲', info: 'i' };
const TOAST_DUR = { success: 4500, info: 4500, warning: 6500, error: 8000, loading: 0 };
function toast(type, title, msg = '', opts = {}) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('aria-atomic', 'true');
  let timer = null, remaining = 0, startedAt = 0, closed = false;
  const inst = new bootstrap.Toast(el, { autohide: false });

  const close = () => { if (closed) return; closed = true; el.dataset.closing = 1; clearTimeout(timer); inst.hide(); };
  const pause = () => { if (!timer) return; clearTimeout(timer); timer = null; remaining -= Date.now() - startedAt; };
  const resume = () => { if (timer || remaining <= 0 || closed) return; startedAt = Date.now(); timer = setTimeout(close, remaining); };

  function render(t, ti, m, o) {
    clearTimeout(timer); timer = null;
    const dur = o.persistent ? 0 : (o.duration ?? TOAST_DUR[t]);
    el.dataset.type = t;
    el.setAttribute('role', t === 'error' ? 'alert' : 'status');
    el.setAttribute('aria-live', t === 'error' ? 'assertive' : 'polite');
    const actions = [];
    if (o.undo) actions.push('<button class="btn btn-ghost btn-sm" data-t-undo>Deshacer</button>');
    if (o.action) actions.push(`<button class="btn btn-ghost btn-sm" data-t-action>${esc(o.action.label)}</button>`);
    el.innerHTML = `<div class="toast-body">
        <span class="t-ico" aria-hidden="true">${t === 'loading' ? '<span class="spinner-border t-spin"></span>' : TOAST_ICO[t]}</span>
        <div class="flex-grow-1" style="min-width:0"><p class="t-title">${esc(ti)}</p>${m ? `<p class="t-msg">${esc(m)}</p>` : ''}
          ${actions.length ? `<div class="t-actions">${actions.join('')}</div>` : ''}</div>
        ${t === 'loading' ? '' : '<button type="button" class="btn-close btn-sm" aria-label="Cerrar notificación"></button>'}
      </div>${dur ? `<span class="t-progress" style="--t-dur:${dur}ms" aria-hidden="true"></span>` : ''}`;
    $('.btn-close', el)?.addEventListener('click', close);
    if (o.undo) $('[data-t-undo]', el).onclick = () => { o.undo(); close(); };
    if (o.action) $('[data-t-action]', el).onclick = () => { o.action.run(); close(); };
    remaining = dur;
    if (dur && !el.matches(':hover')) resume();
  }

  render(type, title, msg, opts);
  el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', resume);
  el.addEventListener('focusin', pause);    el.addEventListener('focusout', resume);
  el.addEventListener('hidden.bs.toast', () => el.remove());

  // Máximo 3 visibles: se descarta el más antiguo
  const live = $$('.toast', box).filter(t => !t.dataset.closing);
  if (live.length >= 3) { live[0].dataset.closing = 1; bootstrap.Toast.getInstance(live[0])?.hide(); }
  box.appendChild(el);
  inst.show();
  return { close, update: (t, ti, m = '', o = {}) => { if (!closed) render(t, ti, m, o); } };
}

/* ---------- Auditoría ---------- */
function audit(action, detail, sensitive = false) {
  DB.audit.unshift([S.user.name, new Date(), hhmm(new Date()), action, detail, sensitive]);
}

/* ---------- Confirmación / formularios ---------- */
/* tone: 'danger' (destructiva, por defecto) | estado de asistencia ('salida', 'tardanza'…) para advertencias (§19.6)
   list: elementos afectados (texto) · alt: { label, run } acción secundaria destructiva (§19.6, MV-04) */
function confirmAction({ title, msg, ok = 'Confirmar', cancel = 'Cancelar', onOk, tone = 'danger', audit = true, list = null, alt = null }) {
  $('#confirmCancel').textContent = cancel;   // MV-11: evita "Cancelar" junto a "Cancelar asignación"
  $('#confirmTitle').textContent = title;
  $('#confirmMsg').textContent = msg;
  const ul = $('#confirmList');
  ul.hidden = !list; ul.innerHTML = list ? list.map(t => `<li>${esc(t)}</li>`).join('') : '';
  $('#confirmModal .modal-dialog').style.maxWidth = list || alt ? '600px' : '440px';
  const altBtn = $('#confirmAlt');
  altBtn.hidden = !alt;
  if (alt) {
    altBtn.textContent = alt.label;
    altBtn.onclick = () => { $('#confirmModal').addEventListener('hidden.bs.modal', () => alt.run(), { once: true }); bootstrap.Modal.getInstance('#confirmModal').hide(); };
  }
  const sem = tone === 'danger' ? 'danger' : ({ salida: 'early', tardanza: 'warning' }[tone] || 'warning');
  const ico = $('#confirmIco');
  ico.textContent = tone === 'danger' ? '✕' : (ST[tone]?.ico || '▲');
  ico.style.background = `var(--color-${sem}-soft)`; ico.style.color = `var(--color-${sem}-text)`;
  $('#confirmAudit').hidden = !audit;
  const btn = $('#confirmOk');
  btn.className = 'btn ' + (tone === 'danger' ? 'btn-danger' : 'btn-primary');
  btn.textContent = ok;
  const m = bootstrap.Modal.getOrCreateInstance('#confirmModal');
  btn.onclick = () => { m.hide(); onOk(); };
  m.show();
}
function openForm({ title, body, submit = 'Guardar', auditNote = true, onSubmit }) {
  $('#formTitle').textContent = title;
  $('#formBody').innerHTML = body;
  $('#formSubmit').textContent = submit;
  $('#formAudit').hidden = !auditNote;
  const form = $('#formModalForm');
  const m = bootstrap.Modal.getOrCreateInstance('#formModal');
  form.onsubmit = e => {
    e.preventDefault();
    const invalid = validateForm(form);
    if (invalid.length) { invalid[0].focus(); return; }
    const btn = $('#formSubmit');
    const label = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Guardando…`;
    setTimeout(() => {
      btn.disabled = false; btn.textContent = label;
      m.hide();
      onSubmit(Object.fromEntries(new FormData(form)));
    }, 650);
  };
  $$('input, select, textarea', form).forEach(el => el.addEventListener('blur', () => { if (el.dataset.touched || el.value) { el.dataset.touched = 1; validateField(el); } }));
  m.show();
  $('#formModal').addEventListener('shown.bs.modal', () => $('input, select, textarea', form)?.focus(), { once: true });
}
function validateField(el) {
  let ok = el.checkValidity();
  if (ok && el.dataset.pattern) ok = new RegExp(el.dataset.pattern).test(el.value);
  el.classList.toggle('is-invalid', !ok);
  el.setAttribute('aria-invalid', String(!ok));
  return ok;
}
function validateForm(form) { return $$('[required], [data-pattern]', form).filter(el => !validateField(el)); }
const field = (id, label, input, err = '', help = '') => `
  <div class="mb-3">
    <label class="form-label" for="${id}">${label}</label>
    ${input}
    ${help ? `<div class="form-text" id="${id}Help">${help}</div>` : ''}
    ${err ? `<div class="invalid-feedback" id="${id}Err">${err}</div>` : ''}
  </div>`;
const REQ = ' <span class="req" aria-hidden="true">*</span>';

/* ---------- Componentes de vista ---------- */
const pageHeader = ({ crumbs, title, desc, actions = '' }) => `
  <nav aria-label="Ruta"><ol class="breadcrumb">${crumbs.map((c, i) => i === crumbs.length - 1
    ? `<li class="breadcrumb-item active" aria-current="page">${c[0]}</li>`
    : `<li class="breadcrumb-item"><a href="${c[1]}">${c[0]}</a></li>`).join('')}</ol></nav>
  <div class="page-header">
    <div><h1 tabindex="-1">${title}</h1>${desc ? `<p>${desc}</p>` : ''}</div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </div>`;
/* ---------- Ayuda contextual "?" (v2 · MV-10 ← P10 · design_system §19.9) ----------
   Patrón disclosure: botón con aria-expanded + panel .help-pop flotante (position:fixed, no se recorta).
   Abre con clic, Enter/Espacio o pasando el puntero; Esc o clic fuera lo cierran y el foco queda en el botón. */
const HELP = {
  tol: () => {
    const lim = hhmm(new Date(0, 0, 0, 7, 45 + S.school.tol)), late = hhmm(new Date(0, 0, 0, 7, 46 + S.school.tol));
    return { t: 'Tolerancia', b: `Minutos de gracia después de la hora de ingreso. Con ingreso ${SCHEDULE_START} y ${S.school.tol} min de tolerancia: hasta las <strong>${lim}</strong> es <strong>✓ Puntual</strong>; desde las ${late} es <strong>▲ Tardanza</strong>.`,
      link: S.user?.role === 'admin' && location.hash !== '#/configuracion' ? ['Cambiar en Configuración', '#/configuracion'] : null };
  },
  desc: () => ({ t: 'Cómo se calculan los descuentos', b: `<ul class="mb-0 ps-3"><li><strong>▲ Tardanza:</strong> ${money(DESC_TARD)} por cada una.</li><li><strong>✕ Inasistencia:</strong> 1/30 de la remuneración básica (un día).</li><li><strong>◆ Justificada:</strong> no descuenta.</li></ul><p class="mb-0 mt-2">El monto es estimado hasta el cierre de planilla. Una justificación aprobada antes del cierre anula el descuento.</p>`,
    link: S.user?.role === 'docente' ? ['Solicitar una justificación', '#/mi-asistencia'] : null })
};
const helpTip = (k, label) => `<button type="button" class="help-tip" data-help="${k}" aria-expanded="false" aria-label="Ayuda: ${label}"><i class="bi bi-question-lg" aria-hidden="true"></i></button>`;
let helpOpen = null;
function closeHelp(returnFocus = false) {
  if (!helpOpen) return;
  const { btn, pop } = helpOpen; helpOpen = null;
  btn.setAttribute('aria-expanded', 'false'); pop.remove();
  if (returnFocus) btn.focus();
}
function openHelp(btn, byHover = false) {
  if (helpOpen?.btn === btn) return;
  closeHelp();
  const h = HELP[btn.dataset.help](); const id = 'help-' + btn.dataset.help;
  const pop = document.createElement('div');
  pop.className = 'help-pop'; pop.id = id; pop.setAttribute('role', 'note');
  pop.innerHTML = `<strong class="d-block mb-1">${h.t}</strong><div>${h.b}</div>${h.link ? `<a class="help-link" href="${h.link[1]}">${h.link[0]} →</a>` : ''}`;
  btn.after(pop); btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-controls', id);
  helpOpen = { btn, pop, byHover }; placeHelp();
}
/* Coloca el panel junto al botón; si el botón sale de la pantalla al desplazarse, se cierra */
function placeHelp() {
  if (!helpOpen) return;
  const { btn, pop } = helpOpen, r = btn.getBoundingClientRect(), w = Math.min(320, innerWidth - 16);
  if (r.bottom < 0 || r.top > innerHeight) return closeHelp();
  pop.style.width = w + 'px';
  pop.style.left = Math.max(8, Math.min(r.left + r.width / 2 - 24, innerWidth - w - 8)) + 'px';
  const below = r.bottom + 8, ph = pop.offsetHeight;
  pop.style.top = (below + ph > innerHeight - 8 && r.top - ph - 8 > 8 ? r.top - ph - 8 : below) + 'px';
}
function initHelp() {
  document.addEventListener('click', e => {
    const b = e.target.closest('.help-tip');
    if (b) { e.preventDefault(); e.stopPropagation(); if (helpOpen?.btn === b && !helpOpen.byHover) closeHelp(); else { closeHelp(); openHelp(b); } return; }
    if (helpOpen && !e.target.closest('.help-pop')) closeHelp();
    if (e.target.closest('.help-link')) closeHelp();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && helpOpen) { e.stopPropagation(); closeHelp(true); } }, true);
  document.addEventListener('mouseover', e => { const b = e.target.closest('.help-tip'); if (b && !helpOpen) openHelp(b, true); });
  document.addEventListener('mouseout', e => {
    if (!helpOpen?.byHover) return;
    const to = e.relatedTarget;
    if (to && (to.closest('.help-pop') || to.closest('.help-tip') === helpOpen.btn)) return;
    if (e.target.closest('.help-tip, .help-pop')) closeHelp();
  });
  document.addEventListener('focusout', e => { if (helpOpen && e.relatedTarget && !e.relatedTarget.closest('.help-pop, .help-tip')) closeHelp(); });
  addEventListener('resize', placeHelp); addEventListener('scroll', placeHelp, true);
  addEventListener('hashchange', () => closeHelp());
}
/* Descarga CSV real (separador ; y BOM UTF-8 para que Excel muestre bien las tildes) · MV-09, N03, N04 */
function downloadCSV(name, header, rows, what) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['\ufeff' + [header, ...rows].map(l => l.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('success', 'Archivo exportado', `${name} · ${what}.`);
}
const stampToday = () => isoD(TODAY);
const attendanceRows = list => list.map(p => [p.id, p.n, p.dni, p.tipo, p.area, p.sede, p.in || '', p.out || '', ST[p.st]?.txt || p.st, p.st === 'tardanza' ? lateMin(p) : '']);
const ATT_HEADER = ['Código', 'Nombre', 'DNI', 'Tipo', 'Área', 'Sede', 'Entrada', 'Salida', 'Estado', 'Minutos de tardanza'];
const emptyState = (ico, title, msg, action = '') => `
  <div class="empty-state"><div class="es-ico"><i class="bi bi-${ico}" aria-hidden="true"></i></div>
    <h3>${title}</h3><p>${msg}</p>${action}</div>`;
const personCell = p => `<div class="person"><span class="avatar avatar-sm">${initials(p.n)}</span><div class="min-w-0"><strong>${esc(p.n)}</strong><span>${esc(p.area)} · ${esc(p.id)}</span></div></div>`;
const kpi = ({ label, value, sub = '', context = '', ico, tone, bar = '' }) => `
  <div class="card h-100"><div class="kpi">
    <div class="kpi-top"><span class="overline">${label}</span>${ico ? `<span class="kpi-ico" style="background:var(--color-${tone}-soft);color:var(--color-${tone}-text)" aria-hidden="true">${ico}</span>` : ''}</div>
    <div class="kpi-value">${value}${sub ? ` <small>${sub}</small>` : ''}</div>
    ${bar}
    <div class="kpi-context">${context}</div>
  </div></div>`;
const skeleton = () => `
  <div class="skeleton mb-2" style="width:180px;height:14px"></div>
  <div class="skeleton mb-5" style="width:320px;height:32px"></div>
  <div class="row g-3 mb-4">${'<div class="col-6 col-xl-3"><div class="skeleton" style="height:128px"></div></div>'.repeat(4)}</div>
  <div class="skeleton" style="height:360px"></div>`;
const counts = list => list.reduce((a, p) => (a[p.st] = (a[p.st] || 0) + 1, a), {});

/* ==========================================================================
   VISTAS — ADMINISTRACIÓN
   ========================================================================== */
const V = {};

V['#/inicio'] = () => S.user.role === 'admin' ? adminHome() : docenteHome();

function adminHome() {
  const docentes = DB.people.filter(p => p.tipo === 'Docente');
  const c = counts(docentes);
  const presentes = (c.puntual || 0) + (c.tardanza || 0) + (c.salida || 0);
  const pend = DB.replacements.filter(r => r.estado === 'pendiente').length;
  const porVencer = DB.contracts.filter(k => contractState(k).k === 'porvencer');
  const justPend = DB.justifs.filter(j => j.estado === 'pendiente').length;
  const h = TODAY.getHours();
  const greet = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const segs = [['puntual', c.puntual], ['tardanza', c.tardanza], ['salida', c.salida], ['justificada', c.justificada], ['inasistencia', c.inasistencia]].filter(s => s[1]);
  const colorOf = { puntual: 'success', tardanza: 'warning', salida: 'early', justificada: 'info', inasistencia: 'danger' };

  return {
    html: pageHeader({
      crumbs: [['Inicio']],
      title: `${greet}, Patricia`,
      desc: `Resumen de la jornada del ${fmtDateLong(TODAY)}. Hora de ingreso programada ${SCHEDULE_START} · tolerancia ${S.school.tol} min ${helpTip('tol', '¿qué es la tolerancia?')}`,
      actions: `<button class="btn btn-outline-secondary" id="expDay"><i class="bi bi-download" aria-hidden="true"></i> Exportar día</button><a class="btn btn-primary" href="#/asistencia/diario"><i class="bi bi-clock-history"></i> Ver registro diario</a>`
    }) + `
    <div class="row g-3 mb-4">
      <div class="col-6 col-xl-3">${kpi({ label: 'Presentes', value: presentes, sub: `/ ${docentes.length}`, ico: '✓', tone: 'success', context: `${Math.round(presentes / docentes.length * 100)} % del personal docente`,
        bar: `<div class="kpi-bar" aria-hidden="true"><span style="width:${presentes / docentes.length * 100}%;background:var(--color-success)"></span></div>` })}</div>
      <div class="col-6 col-xl-3">${kpi({ label: 'Tardanzas', value: c.tardanza || 0, ico: '▲', tone: 'warning', context: '<span class="text-warning-sys fw-semibold">+1</span> respecto a ayer' })}</div>
      <div class="col-6 col-xl-3">${kpi({ label: 'Inasistencias', value: (c.inasistencia || 0) + (c.justificada || 0), ico: '✕', tone: 'danger', context: `${c.justificada || 0} justificada · ${c.inasistencia || 0} sin justificar` })}</div>
      <div class="col-6 col-xl-3">${kpi({ label: 'Reemplazos pendientes', value: pend, ico: '⇄', tone: 'info', context: pend ? '<a href="#/reemplazos">Asignar ahora →</a>' : 'Todo cubierto' })}</div>
    </div>

    <div class="row g-4">
      <div class="col-xl-8">
        <div class="card">
          <div class="card-header flex-wrap">
            <h2>Asistencia del día</h2>
            <div class="btn-group btn-group-sm" role="group" aria-label="Filtrar por estado" id="dayFilter">
              <button class="btn btn-outline-secondary active" data-f="" aria-pressed="true">Todos</button>
              <button class="btn btn-outline-secondary" data-f="tardanza" aria-pressed="false">▲ Tardanzas</button>
              <button class="btn btn-outline-secondary" data-f="inasistencia" aria-pressed="false">✕ Ausentes</button>
            </div>
          </div>
          <div class="table-scroll" style="max-height:440px">
            <table class="table table-stack"><thead><tr><th scope="col">Docente</th><th scope="col">Sede</th><th scope="col" class="num">Entrada</th><th scope="col">Estado</th></tr></thead>
            <tbody id="dayBody"></tbody></table>
          </div>
          <div class="table-footer"><span id="dayCount"></span><a href="#/asistencia/diario">Ver registro completo →</a></div>
        </div>
      </div>
      <div class="col-xl-4 d-flex flex-column gap-4">
        <div class="card">
          <div class="card-header"><h2>Alertas operativas</h2><span class="tag">${porVencer.length + pend + justPend}</span></div>
          <div>
            ${porVencer.slice(0, 3).map(k => `
              <div class="alert-card" style="--ac:var(--color-warning)">
                <span class="ac-ico" style="background:var(--color-warning-soft);color:var(--color-warning-text)" aria-hidden="true">▲</span>
                <div><p class="ac-title">Contrato por vencer</p><p class="small text-muted">${esc(k.n)} · ${contractState(k).txt.toLowerCase()}</p><a class="small" href="#/contratos">Revisar contrato</a></div>
              </div>`).join('')}
            ${pend ? `<div class="alert-card" style="--ac:var(--color-info)">
                <span class="ac-ico" style="background:var(--color-info-soft);color:var(--color-info-text)" aria-hidden="true">i</span>
                <div><p class="ac-title">${pend} clases sin reemplazo</p><p class="small text-muted">Hoy · Sede Norte y Central</p><a class="small" href="#/reemplazos">Asignar reemplazos</a></div></div>` : ''}
            ${justPend ? `<div class="alert-card" style="--ac:var(--color-early)">
                <span class="ac-ico" style="background:var(--color-early-soft);color:var(--color-early-text)" aria-hidden="true">◆</span>
                <div><p class="ac-title">${justPend} justificaciones por revisar</p><p class="small text-muted">Afectan el cálculo de planilla</p><a class="small" href="#/asistencia/justificaciones">Revisar</a></div></div>` : ''}
          </div>
        </div>
        <div class="card"><div class="card-body">
          <h2 class="h3 mb-1">Distribución de hoy</h2>
          <p class="small text-muted mb-3">${docentes.length} docentes programados</p>
          <div class="stack-bar" role="img" aria-label="${segs.map(s => `${ST[s[0]].txt}: ${s[1]}`).join(', ')}">
            ${segs.map(s => `<span style="flex:${s[1]};background:var(--color-${colorOf[s[0]]});color:var(--color-on-${colorOf[s[0]]})">${ST[s[0]].ico}</span>`).join('')}
          </div>
          <div class="legend">${segs.map(s => `<span>${ST[s[0]].ico} ${ST[s[0]].txt} <b class="tnum">${s[1]}</b></span>`).join('')}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <h2 class="h3 mb-3">Accesos rápidos</h2>
          <div class="d-grid gap-2">
            <a class="btn btn-outline-secondary justify-content-start" href="#/planillas"><i class="bi bi-cash-stack"></i> Cierre de planilla de ${TODAY.toLocaleDateString('es-PE', { month: 'long' })}</a>
            <a class="btn btn-outline-secondary justify-content-start" href="#/reportes"><i class="bi bi-bar-chart-line"></i> Reporte de asistencia mensual</a>
            <button class="btn btn-outline-secondary justify-content-start" data-action="new-person"><i class="bi bi-person-plus"></i> Registrar docente</button>
          </div>
        </div></div>
      </div>
    </div>`,
    bind() {
      $('#expDay').onclick = () => downloadCSV(`asistencia_${stampToday()}.csv`, ATT_HEADER, attendanceRows(DB.people), `${DB.people.length} registros del día`);   // N04
      const draw = f => {
        const rows = docentes.filter(p => !f || p.st === f || (f === 'inasistencia' && p.st === 'justificada'));
        $('#dayBody').innerHTML = rows.map(p => `<tr>
          <td class="td-main" data-label="Docente">${personCell(p)}</td>
          <td data-label="Sede">${esc(p.sede)}</td>
          <td data-label="Entrada" class="num">${p.in || '—'}</td>
          <td data-label="Estado">${badge(p.st, p.st === 'tardanza' ? `${lateMin(p)} min` : '')}</td></tr>`).join('');
        $('#dayCount').textContent = `Mostrando ${rows.length} de ${docentes.length}`;
      };
      draw('');
      $$('#dayFilter button').forEach(b => b.onclick = () => {
        $$('#dayFilter button').forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
        draw(b.dataset.f);
      });
    }
  };
}

/* ---------- Personal ---------- */
function personList(tipo) {
  const isDoc = tipo === 'Docente';
  const title = isDoc ? 'Docentes' : 'Administrativos';
  const areas = [...new Set(DB.people.filter(p => p.tipo === tipo).map(p => p.area))].sort();
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Personal', '#/personal/docentes'], [title]],
      title, desc: isDoc ? 'Información laboral, contratos y asistencia del personal docente.' : 'Personal administrativo de la institución.',
      actions: `<button class="btn btn-outline-secondary" id="plExport"><i class="bi bi-download" aria-hidden="true"></i> Exportar lista</button><button class="btn btn-primary" data-action="new-person"><i class="bi bi-person-plus"></i> Nuevo ${isDoc ? 'docente' : 'administrativo'}</button>`
    }) + `
    <div class="filter-bar" role="search">
      <div class="grow"><label class="form-label" for="fq">Buscar</label>
        <div class="input-icon"><i class="bi bi-search"></i><input id="fq" class="form-control" placeholder="Nombre, DNI o código" value="${esc(S.filters.q)}"></div></div>
      <div class="fb-item"><label class="form-label" for="farea">Área</label>
        <select id="farea" class="form-select"><option value="">Todas</option>${areas.map(a => `<option ${S.filters.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
      <div class="fb-item"><label class="form-label" for="fcon">Contrato</label>
        <select id="fcon" class="form-select"><option value="">Todos</option><option value="vigente">✓ Vigente</option><option value="porvencer">▲ Por vencer</option></select></div>
    </div>
    <div class="active-filters" id="chips"></div>
    <div class="table-card">
      <div class="bulk-bar" id="bulkBar" role="region" aria-label="Acciones para la selección" hidden>
        <span class="bulk-count" id="bulkCount" aria-live="polite"></span>
        <div class="bulk-actions">
          <button class="btn btn-sm btn-outline-secondary" data-bulk="export"><i class="bi bi-filetype-csv" aria-hidden="true"></i> Exportar selección</button>
          <button class="btn btn-sm btn-outline-secondary" data-bulk="notify"><i class="bi bi-send" aria-hidden="true"></i> Enviar comunicado</button>
          <button class="btn btn-sm btn-ghost" data-bulk="clear"><i class="bi bi-x-lg" aria-hidden="true"></i> Limpiar selección</button>
        </div>
      </div>
      <div class="table-scroll">
        <table class="table table-stack">
          <thead><tr>
            <th scope="col" class="td-select" style="width:44px"><input class="form-check-input" type="checkbox" id="selAll" aria-label="Seleccionar todos los visibles"></th>
            <th scope="col" aria-sort="${S.sort.key === 'n' ? (S.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="th-sort" data-sort="n">Nombre <i class="bi bi-arrow-${S.sort.key === 'n' && S.sort.dir < 0 ? 'up' : 'down'}"></i></button></th>
            <th scope="col">DNI</th>
            <th scope="col" aria-sort="${S.sort.key === 'sede' ? (S.sort.dir > 0 ? 'ascending' : 'descending') : 'none'}"><button class="th-sort" data-sort="sede">Sede <i class="bi bi-arrow-${S.sort.key === 'sede' && S.sort.dir < 0 ? 'up' : 'down'}"></i></button></th>
            <th scope="col">Contrato</th>
            <th scope="col">Hoy</th>
            <th scope="col" style="width:56px"><span class="visually-hidden">Acciones</span></th>
          </tr></thead>
          <tbody id="plBody"></tbody>
        </table>
      </div>
      <div id="plEmpty"></div>
      <div class="table-footer"><span id="plCount"></span>
        <nav aria-label="Paginación"><ul class="pagination pagination-sm"><li class="page-item disabled"><span class="page-link">‹</span></li><li class="page-item active"><span class="page-link">1</span></li><li class="page-item disabled"><span class="page-link">›</span></li></ul></nav>
      </div>
    </div>`,
    bind() {
      /* MV-09 · P06: la selección se guarda por id y sobrevive a filtros y orden; la barra aparece con ≥ 1 fila */
      const sel = S.sel[tipo] = S.sel[tipo] || new Set(); let visible = [];
      const plural = n => `${n} ${tipo === 'Docente' ? (n === 1 ? 'docente' : 'docentes') : (n === 1 ? 'persona' : 'personas')}`;
      const syncSel = () => {
        const vis = visible.filter(p => sel.has(p.id)).length, hidden = sel.size - vis;
        const all = $('#selAll'); all.checked = visible.length > 0 && vis === visible.length; all.indeterminate = vis > 0 && vis < visible.length;
        $('#bulkBar').hidden = !sel.size;
        $('#bulkCount').innerHTML = sel.size ? `<strong>${sel.size}</strong> ${sel.size === 1 ? 'seleccionado' : 'seleccionados'}${hidden ? ` <span class="text-muted">· ${hidden} oculto${hidden > 1 ? 's' : ''} por los filtros</span>` : ''}` : '';
      };
      const csv = (list, name) => downloadCSV(name, ['Código', 'Nombre', 'DNI', 'Área', 'Sede', 'Contrato', 'Estado hoy'],
        list.map(p => { const k = DB.contracts.find(x => x.pid === p.id); return [p.id, p.n, p.dni, p.area, p.sede, k ? contractState(k).txt : '', ST[p.st]?.txt || p.st]; }), plural(list.length));
      const stamp = fmtDate(TODAY).split('/').reverse().join('-');
      const draw = () => {
        let rows = DB.people.filter(p => p.tipo === tipo)
          .filter(p => matchPerson(p, S.filters.q))
          .filter(p => !S.filters.area || p.area === S.filters.area)
          .filter(p => { if (!S.filters.contrato) return true; const k = DB.contracts.find(c => c.pid === p.id); return contractState(k).k === S.filters.contrato; });
        rows.sort((a, b) => a[S.sort.key].localeCompare(b[S.sort.key]) * S.sort.dir);
        visible = rows;
        $('#plBody').innerHTML = rows.map(p => {
          const k = DB.contracts.find(c => c.pid === p.id);
          const on = sel.has(p.id);
          return `<tr data-id="${p.id}"${on ? ' class="selected"' : ''}>
            <td class="td-select"><input class="form-check-input row-sel" type="checkbox" value="${p.id}" aria-label="Seleccionar ${esc(p.n)}"${on ? ' checked' : ''}></td>
            <td class="td-main" data-label="Nombre"><a href="#" class="text-reset text-decoration-none" data-open="${p.id}">${personCell(p)}</a></td>
            <td data-label="DNI" class="tnum">${p.dni}</td>
            <td data-label="Sede">${esc(p.sede)}</td>
            <td data-label="Contrato">${contractBadge(k)}</td>
            <td data-label="Hoy">${badge(p.st)}</td>
            <td class="td-actions text-end">
              <div class="dropdown"><button class="btn btn-ghost btn-icon btn-sm" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}' aria-label="Acciones para ${esc(p.n)}"><i class="bi bi-three-dots"></i></button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><button class="dropdown-item" data-open="${p.id}"><i class="bi bi-person-vcard"></i> Ver ficha</button></li>
                  <li><a class="dropdown-item" href="#/horarios"><i class="bi bi-calendar-week"></i> Ver horario</a></li>
                  <li><a class="dropdown-item" href="#/contratos"><i class="bi bi-file-earmark-text"></i> Ver contrato</a></li>
                </ul></div>
            </td></tr>`;
        }).join('');
        const total = DB.people.filter(p => p.tipo === tipo).length;
        $('#plCount').textContent = `Mostrando ${rows.length} de ${total}`;
        $('#plEmpty').innerHTML = rows.length ? '' : emptyState('search', 'No hay resultados para estos filtros', 'Revisa la búsqueda o limpia los filtros para ver a todo el personal.', '<button class="btn btn-outline-secondary" data-clear>Limpiar filtros</button>');
        const chips = [];
        if (S.filters.q) chips.push(['q', `Búsqueda: "${S.filters.q}"`]);
        if (S.filters.area) chips.push(['area', `Área: ${S.filters.area}`]);
        if (S.filters.contrato) chips.push(['contrato', `Contrato: ${S.filters.contrato === 'vigente' ? 'Vigente' : 'Por vencer'}`]);
        $('#chips').innerHTML = chips.map(c => `<span class="chip">${esc(c[1])}<button aria-label="Quitar filtro ${esc(c[1])}" data-rm="${c[0]}"><i class="bi bi-x"></i></button></span>`).join('')
          + (chips.length ? '<button class="btn btn-ghost btn-sm" data-clear>Limpiar filtros</button>' : '');
        syncSel();
      };
      $('#fcon').value = S.filters.contrato;
      $('#fq').oninput = e => { S.filters.q = e.target.value; draw(); };
      $('#farea').onchange = e => { S.filters.area = e.target.value; draw(); };
      $('#fcon').onchange = e => { S.filters.contrato = e.target.value; draw(); };
      $$('[data-sort]').forEach(b => b.onclick = () => {
        const k = b.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : 1 }; route();
      });
      $('#main').addEventListener('click', e => {
        const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openPerson(o.dataset.open); }
        const rm = e.target.closest('[data-rm]'); if (rm) { S.filters[rm.dataset.rm] = ''; if (rm.dataset.rm === 'q') $('#fq').value = ''; if (rm.dataset.rm === 'area') $('#farea').value = ''; if (rm.dataset.rm === 'contrato') $('#fcon').value = ''; draw(); }
        if (e.target.closest('[data-clear]')) { S.filters = { q: '', area: '', contrato: '' }; $('#fq').value = ''; $('#farea').value = ''; $('#fcon').value = ''; draw(); }
      });
      $('#main').addEventListener('change', e => {
        if (e.target.id === 'selAll') $$('.row-sel').forEach(c => { c.checked = e.target.checked; sel[c.checked ? 'add' : 'delete'](c.value); c.closest('tr').classList.toggle('selected', c.checked); });
        if (e.target.classList.contains('row-sel')) { sel[e.target.checked ? 'add' : 'delete'](e.target.value); e.target.closest('tr').classList.toggle('selected', e.target.checked); }
        if (e.target.id === 'selAll' || e.target.classList.contains('row-sel')) syncSel();
      });
      $('#plExport').onclick = () => csv(visible, `personal_${tipo === 'Docente' ? 'docentes' : 'administrativos'}_${stamp}.csv`);
      $('#bulkBar').addEventListener('click', e => {
        const b = e.target.closest('[data-bulk]'); if (!b) return;
        const list = DB.people.filter(p => sel.has(p.id));
        if (b.dataset.bulk === 'export') csv(list, `seleccion_${list.length}_${stamp}.csv`);
        if (b.dataset.bulk === 'notify') openForm({ title: `Enviar comunicado · ${plural(list.length)}`, submit: 'Enviar comunicado',
          body: `<p class="small text-muted mb-3">Para: ${list.slice(0, 3).map(p => esc(p.n.split(' ').slice(0, 2).join(' '))).join(', ')}${list.length > 3 ? ` y ${list.length - 3} más` : ''}</p>
            ${field('bnAsunto', 'Asunto' + REQ, '<input id="bnAsunto" name="asunto" class="form-control" required maxlength="80" aria-describedby="bnAsuntoErr">', 'Escribe un asunto.')}
            ${field('bnMsg', 'Mensaje' + REQ, '<textarea id="bnMsg" name="msg" class="form-control" rows="4" required aria-describedby="bnMsgErr"></textarea>', 'Escribe el mensaje.')}`,
          onSubmit(d) { audit('Envió comunicado', `${d.asunto} · ${plural(list.length)}`); toast('success', 'Comunicado enviado', `"${d.asunto}" llegará a ${plural(list.length)} por correo y en su panel.`); } });
        if (b.dataset.bulk === 'clear') { sel.clear(); draw(); $('#selAll').focus(); }
      });
      draw();
    }
  };
}
V['#/personal/docentes'] = () => personList('Docente');
V['#/personal/administrativos'] = () => personList('Administrativo');

function openPerson(id) {
  const p = DB.people.find(x => x.id === id);
  const k = DB.contracts.find(c => c.pid === id);
  $('#drawerTitle').textContent = 'Ficha del personal';
  $('#drawerBody').innerHTML = `
    <div class="d-flex gap-3 align-items-center mb-4">
      <span class="avatar avatar-lg">${initials(p.n)}</span>
      <div><h3 class="h2 mb-1">${esc(p.n)}</h3><p class="text-muted mb-2">${esc(p.tipo)} · ${esc(p.area)}</p>${badge(p.st, p.st === 'tardanza' ? `${lateMin(p)} min` : '')}</div>
    </div>
    <ul class="nav nav-tabs mb-4" role="tablist">
      <li class="nav-item" role="presentation"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-datos" role="tab">Datos</button></li>
      <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-asis" role="tab">Asistencia</button></li>
      <li class="nav-item" role="presentation"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-hist" role="tab">Historial</button></li>
    </ul>
    <div class="tab-content">
      <div class="tab-pane fade show active" id="tab-datos" role="tabpanel">
        <dl class="detail-list">
          <dt>Código</dt><dd class="tnum">${p.id}</dd>
          <dt>DNI</dt><dd class="tnum">${p.dni}</dd>
          <dt>Correo</dt><dd>${p.email}</dd>
          <dt>Teléfono</dt><dd class="tnum">${p.tel}</dd>
          <dt>Sede</dt><dd>${esc(p.sede)}</dd>
          <dt>Fecha de ingreso</dt><dd class="tnum">${p.ingreso}</dd>
          <dt>Contrato</dt><dd>${k.id} · ${k.tipo}<br>${contractBadge(k, " mt-1")}</dd>
          <dt>Remuneración</dt><dd class="tnum">${money(p.basico)}</dd>
        </dl>
      </div>
      <div class="tab-pane fade" id="tab-asis" role="tabpanel">
        <ul class="list-plain">${historyFor(p, 7).map(r => `<li class="row-line"><span class="tnum small">${r.fecha}</span><span class="tnum small text-muted">${r.in || '—'}</span>${badge(r.st)}</li>`).join('')}</ul>
      </div>
      <div class="tab-pane fade" id="tab-hist" role="tabpanel">
        <ul class="list-plain">${DB.audit.filter(a => a[4].includes(p.n) || a[4].includes(p.id)).map(a => `<li class="row-line"><div><strong class="small d-block">${a[3]}</strong><span class="small text-muted">${a[0]} · ${fmtDate(a[1])} ${a[2]}</span></div>${a[5] ? '<span title="Acción sensible"><i class="bi bi-shield-lock text-muted" aria-hidden="true"></i><span class="visually-hidden">Acción sensible</span></span>' : ''}</li>`).join('') || '<p class="text-muted small">Sin acciones registradas para esta persona.</p>'}</ul>
      </div>
    </div>
    <div class="d-flex gap-2 mt-4 pt-3 border-top">
      <button class="btn btn-primary flex-grow-1" id="editPerson"><i class="bi bi-pencil"></i> Editar datos</button>
      <a class="btn btn-outline-secondary" href="#/contratos" data-bs-dismiss="offcanvas">Contrato</a>
    </div>`;
  const dr = bootstrap.Offcanvas.getOrCreateInstance('#drawer');
  $('#editPerson').onclick = () => { dr.hide(); personForm(p); };
  dr.show();
}

function personForm(p = null) {
  const areas = [...new Set(DB.people.map(x => x.area))].sort();
  const [nom, ...ap] = p ? p.n.split(' ') : ['', ''];
  openForm({
    title: p ? `Editar · ${p.n}` : 'Registrar personal',
    submit: p ? 'Guardar cambios' : 'Registrar',
    body: `
      <p class="small text-muted">Los campos con <span class="text-danger-sys">*</span> son obligatorios.</p>
      <fieldset class="mb-2"><legend>Datos personales</legend>
        <div class="row g-3">
          <div class="col-sm-6">${field('fNom', 'Nombres' + REQ, `<input id="fNom" name="nom" class="form-control" required value="${esc(nom)}" aria-describedby="fNomErr">`, 'Ingresa los nombres.')}</div>
          <div class="col-sm-6">${field('fAp', 'Apellidos' + REQ, `<input id="fAp" name="ap" class="form-control" required value="${esc(ap.join(' '))}" aria-describedby="fApErr">`, 'Ingresa los apellidos.')}</div>
          <div class="col-sm-6">${field('fDni', 'DNI' + REQ, `<input id="fDni" name="dni" class="form-control" inputmode="numeric" maxlength="8" required data-pattern="^\\d{8}$" value="${p ? p.dni : ''}" placeholder="8 dígitos" aria-describedby="fDniErr">`, 'Ingresa un DNI de 8 dígitos numéricos.')}</div>
          <div class="col-sm-6">${field('fMail', 'Correo institucional' + REQ, `<input id="fMail" name="mail" type="email" class="form-control" required value="${p ? p.email : ''}" placeholder="nombre@sanjose.edu.pe" aria-describedby="fMailErr">`, 'Ingresa un correo válido, p. ej. nombre@sanjose.edu.pe')}</div>
        </div>
      </fieldset>
      <fieldset><legend>Datos laborales</legend>
        <div class="row g-3">
          <div class="col-sm-6">${field('fTipo', 'Tipo' + REQ, `<select id="fTipo" name="tipo" class="form-select" required><option ${!p || p.tipo === 'Docente' ? 'selected' : ''}>Docente</option><option ${p && p.tipo === 'Administrativo' ? 'selected' : ''}>Administrativo</option></select>`)}</div>
          <div class="col-sm-6">${field('fArea', 'Área' + REQ, `<select id="fArea" name="area" class="form-select" required aria-describedby="fAreaErr"><option value="">Selecciona…</option>${areas.map(a => `<option ${p && p.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select>`, 'Selecciona un área.')}</div>
          <div class="col-sm-6">${field('fSede', 'Sede' + REQ, `<select id="fSede" name="sede" class="form-select" required><option ${!p || p.sede === 'Sede Central' ? 'selected' : ''}>Sede Central</option><option ${p && p.sede === 'Sede Norte' ? 'selected' : ''}>Sede Norte</option></select>`)}</div>
          <div class="col-sm-6">${field('fBas', 'Remuneración básica (S/)' + REQ, `<input id="fBas" name="bas" type="number" min="1025" step="0.01" class="form-control" required value="${p ? p.basico : ''}" aria-describedby="fBasErr">`, 'Debe ser igual o mayor a la RMV (S/ 1 025.00).')}</div>
        </div>
      </fieldset>`,
    onSubmit(d) {
      const n = `${d.nom.trim()} ${d.ap.trim()}`;
      if (p) {
        const prev = { ...p };
        Object.assign(p, { n, dni: d.dni, email: d.mail, tipo: d.tipo, area: d.area, sede: d.sede, basico: +d.bas });
        audit('Modificó datos de personal', `${p.id} · ${n}`, true);
        toast('success', 'Cambios guardados', `${n} se actualizó correctamente.`, { undo: () => { Object.assign(p, prev); route(); toast('info', 'Cambios revertidos'); } });
      } else {
        const id = 'D-' + String(DB.people.length + 1).padStart(3, '0');
        DB.people.push({ id, n, dni: d.dni, email: d.mail, tipo: d.tipo, area: d.area, sede: d.sede, st: 'pendiente', in: '', out: '', tel: '—', ingreso: fmtDate(TODAY), basico: +d.bas });
        DB.contracts.push({ id: 'C-02' + (DB.contracts.length + 1), pid: id, n, tipo: 'Plazo fijo', ini: TODAY, fin: addDays(TODAY, 365), anulado: false });
        audit('Registró personal', `${id} · ${n}`, false);
        toast('success', 'Personal registrado', `${n} (${id}) ya aparece en la lista.`);
      }
      route();
    }
  });
}

/* ---------- Asistencia ---------- */
function historyFor(p, days) {
  const out = []; let d = TODAY; let seed = p.dni.split('').reduce((a, c) => a + +c, 0);
  while (out.length < days) {
    d = addDays(d, -1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    seed = (seed * 9301 + 49297) % 233280; const r = seed / 233280;
    const st = r < .76 ? 'puntual' : r < .88 ? 'tardanza' : r < .93 ? 'justificada' : r < .97 ? 'salida' : 'inasistencia';
    const inT = st === 'puntual' ? `07:${pad(30 + Math.floor(r * 100) % 15)}` : st === 'tardanza' ? `07:${pad(56 + Math.floor(r * 100) % 4)}` : st === 'salida' ? '07:40' : '';
    out.push({ fecha: fmtDate(d), d, st, in: st === 'tardanza' ? '08:0' + (Math.floor(r * 10) % 9 + 1) : inT, out: st === 'salida' ? '12:15' : inT ? '14:3' + Math.floor(r * 10) % 9 : '' });
  }
  return out;
}

V['#/asistencia/diario'] = () => {
  const list = DB.people;
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Asistencia', '#/asistencia/diario'], ['Registro diario']],
      title: 'Registro diario',
      desc: `El estado se calcula automáticamente: ingreso programado ${SCHEDULE_START} + tolerancia de ${S.school.tol} min ${helpTip('tol', '¿qué es la tolerancia?')}`,
      actions: `<button class="btn btn-outline-secondary" id="adExport"><i class="bi bi-download" aria-hidden="true"></i> Exportar</button>`
    }) + `
    <div class="filter-bar">
      <div class="fb-item"><label class="form-label" for="dDate">Fecha</label><input id="dDate" type="date" class="form-control" value="${isoD(TODAY)}"></div>
      <div class="fb-item"><label class="form-label" for="dSt">Estado</label>
        <select id="dSt" class="form-select"><option value="">Todos</option>${Object.keys(ST).map(k => `<option value="${k}">${ST[k].ico} ${ST[k].txt}</option>`).join('')}</select></div>
      <div class="fb-item"><label class="form-label" for="dSede">Sede</label><select id="dSede" class="form-select"><option value="">Todas</option><option>Sede Central</option><option>Sede Norte</option></select></div>
    </div>
    <div class="table-card">
      <div class="table-scroll"><table class="table table-stack">
        <thead><tr><th scope="col">Personal</th><th scope="col">Sede</th><th scope="col" class="num">Entrada</th><th scope="col" class="num">Salida</th><th scope="col">Estado</th><th scope="col" style="width:56px"><span class="visually-hidden">Acciones</span></th></tr></thead>
        <tbody id="adBody"></tbody></table></div>
      <div id="adEmpty"></div>
      <div class="table-footer"><span id="adCount"></span><span class="audit-note"><i class="bi bi-shield-lock"></i> Las correcciones manuales quedan en auditoría</span></div>
    </div>`,
    bind() {
      /* MV-11 · M-09: desde una inasistencia se llega directo a sus clases sin reemplazo (sin mover el módulo) */
      let visibleAd = [];
      const pendOf = p => DB.replacements.filter(r => r.estado === 'pendiente' && r.ausente === p.n);
      const replLink = p => { const n = pendOf(p).length; return n ? `<a class="repl-link" href="#/reemplazos" data-goto-repl="${pendOf(p)[0].id}"><i class="bi bi-arrow-left-right" aria-hidden="true"></i> ${n} ${n === 1 ? 'clase' : 'clases'} sin reemplazo · Asignar</a>` : ''; };
      const draw = () => {
        const st = $('#dSt').value, sede = $('#dSede').value;
        const rows = list.filter(p => (!st || p.st === st) && (!sede || p.sede === sede)); visibleAd = rows;
        $('#adBody').innerHTML = rows.map(p => `<tr>
          <td class="td-main" data-label="Personal">${personCell(p)}</td>
          <td data-label="Sede">${esc(p.sede)}</td>
          <td data-label="Entrada" class="num">${p.in || '—'}</td>
          <td data-label="Salida" class="num">${p.out || '—'}</td>
          <td data-label="Estado">${badge(p.st, p.st === 'tardanza' ? `${lateMin(p)} min` : '')}${replLink(p)}</td>
          <td class="td-actions text-end"><div class="dropdown"><button class="btn btn-ghost btn-icon btn-sm" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}' aria-label="Acciones para ${esc(p.n)}"><i class="bi bi-three-dots"></i></button>
            <ul class="dropdown-menu dropdown-menu-end">
              ${['tardanza', 'inasistencia'].includes(p.st) ? `<li><button class="dropdown-item" data-justify="${p.id}"><i class="bi bi-patch-check"></i> Registrar justificación</button></li>` : ''}
              ${pendOf(p).length ? `<li><a class="dropdown-item" href="#/reemplazos" data-goto-repl="${pendOf(p)[0].id}"><i class="bi bi-arrow-left-right"></i> Asignar reemplazo</a></li>` : ''}
              <li><button class="dropdown-item" data-open="${p.id}"><i class="bi bi-person-vcard"></i> Ver ficha</button></li>
            </ul></div></td></tr>`).join('');
        $('#adCount').textContent = `Mostrando ${rows.length} de ${list.length}`;
        $('#adEmpty').innerHTML = rows.length ? '' : emptyState('funnel', 'Sin registros con ese estado', 'Prueba con otro estado o sede.', '<button class="btn btn-outline-secondary" data-clear>Limpiar filtros</button>');
      };
      ['#dSt', '#dSede'].forEach(s => $(s).onchange = draw);
      $('#adExport').onclick = () => downloadCSV(`registro_diario_${stampToday()}${$('#dSt').value ? '_' + $('#dSt').value : ''}.csv`, ATT_HEADER, attendanceRows(visibleAd), `${visibleAd.length} registros (filtros aplicados)`);   // N03
      $('#dDate').onchange = () => toast('info', 'Vista de ejemplo', 'En el prototipo solo hay datos de la jornada actual.');
      $('#main').addEventListener('click', e => {
        const g = e.target.closest('[data-goto-repl]'); if (g) S.flash = '#rc-' + g.dataset.gotoRepl;
        const j = e.target.closest('[data-justify]'); if (j) justifyForm(DB.people.find(p => p.id === j.dataset.justify), draw);
        const o = e.target.closest('[data-open]'); if (o) openPerson(o.dataset.open);
        if (e.target.closest('[data-clear]')) { $('#dSt').value = ''; $('#dSede').value = ''; draw(); }
      });
      draw();
    }
  };
};

function justifyForm(p, after) {
  openForm({
    title: `Justificar · ${p.n}`,
    submit: 'Aprobar justificación',
    body: `
      <div class="alert alert-sys-info small mb-3"><span class="a-ico">i</span><span>Estado actual: ${badge(p.st, p.st === 'tardanza' ? `${lateMin(p)} min` : '')}. Al aprobar, cambiará a ${badge('justificada')} y no generará descuento.</span></div>
      ${field('jMot', 'Motivo' + REQ, `<select id="jMot" name="mot" class="form-select" required aria-describedby="jMotErr"><option value="">Selecciona…</option><option>Salud</option><option>Trámite oficial</option><option>Transporte / fuerza mayor</option><option>Comisión de servicio</option><option>Otro</option></select>`, 'Selecciona un motivo.')}
      ${field('jDet', 'Detalle' + REQ, `<textarea id="jDet" name="det" class="form-control" rows="3" required minlength="10" aria-describedby="jDetErr jDetHelp"></textarea>`, 'Describe el motivo en al menos 10 caracteres.', 'Este texto será visible para el docente.')}
      ${field('jAdj', 'Sustento (opcional)', `<input id="jAdj" type="file" class="form-control" accept=".pdf,.jpg,.png" aria-describedby="jAdjHelp">`, '', 'PDF, JPG o PNG. Máx. 5 MB.')}`,
    onSubmit(d) {
      const prev = p.st; p.st = 'justificada';
      audit('Aprobó justificación', `${p.id} · ${p.n} — ${d.mot}`, true);
      toast('success', 'Justificación aprobada', `${p.n}: ${ST[prev].txt.toLowerCase()} → justificada.`, { undo: () => { p.st = prev; after?.(); } });
      after?.();
    }
  });
}

/* MV-05 (M-03): buscador de docente (combobox ARIA) + 5 periodos */
V['#/asistencia/historial'] = () => {
  const doc = DB.people.filter(p => p.tipo === 'Docente');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const first = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const prevFirst = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
  const POOL_DAYS = 70; // ~3 meses de registros simulados
  const minDate = historyFor(doc[0], POOL_DAYS).at(-1).d;
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Asistencia', '#/asistencia/diario'], ['Historial']],
      title: 'Historial de asistencia', desc: 'Busca a un docente por nombre o DNI y elige el periodo que quieres revisar.'
    }) + `
    <div class="filter-bar" role="search">
      <div class="grow combo">
        <label class="form-label" for="hQ">Docente</label>
        <div class="input-icon"><i class="bi bi-search" aria-hidden="true"></i>
          <input id="hQ" class="form-control" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="hList" autocomplete="off" placeholder="Escribe un nombre o DNI" value="${esc(doc[0].n)}" aria-describedby="hQHelp"></div>
        <ul id="hList" class="combo-list" role="listbox" aria-label="Docentes" hidden></ul>
        <span class="visually-hidden" id="hQHelp">Escribe para filtrar. Usa las flechas para recorrer las sugerencias y Enter para elegir.</span>
        <span class="visually-hidden" role="status" id="hQStatus"></span>
      </div>
      <div class="fb-item fb-item-wide"><label class="form-label" for="hPer">Periodo</label>
        <select id="hPer" class="form-select">
          <option value="d10">Últimos 10 días hábiles</option><option value="d20">Últimos 20 días hábiles</option>
          <option value="mes">Este mes</option><option value="mesAnt">Mes anterior</option><option value="custom">Personalizado…</option>
        </select></div>
      <div class="fb-item" id="hRange" hidden>
        <div class="d-flex gap-2">
          <div><label class="form-label" for="hDesde">Desde</label><input id="hDesde" type="date" class="form-control" min="${iso(minDate)}" max="${iso(addDays(TODAY, -1))}" value="${iso(prevFirst)}"></div>
          <div><label class="form-label" for="hHasta">Hasta</label><input id="hHasta" type="date" class="form-control" min="${iso(minDate)}" max="${iso(addDays(TODAY, -1))}" value="${iso(addDays(TODAY, -1))}"></div>
        </div></div>
    </div>
    <div class="row g-4">
      <div class="col-lg-8"><div class="table-card"><div class="table-scroll"><table class="table table-stack">
        <thead><tr><th scope="col">Fecha</th><th scope="col" class="num">Entrada</th><th scope="col" class="num">Salida</th><th scope="col">Estado</th></tr></thead>
        <tbody id="hBody"></tbody></table></div><div id="hEmpty"></div></div></div>
      <div class="col-lg-4"><div class="card"><div class="card-body" id="hSum"></div></div></div>
    </div>`,
    bind() {
      let sel = doc[0], opts = [], active = -1;
      const q = $('#hQ'), list = $('#hList');
      const rowsFor = p => {
        const pool = historyFor(p, POOL_DAYS), per = $('#hPer').value;
        if (per === 'd10') return pool.slice(0, 10);
        if (per === 'd20') return pool.slice(0, 20);
        let from, to;
        if (per === 'mes') { from = first; to = TODAY; }
        else if (per === 'mesAnt') { from = prevFirst; to = addDays(first, -1); }
        else { from = new Date($('#hDesde').value + 'T00:00'); to = new Date($('#hHasta').value + 'T23:59'); }
        return pool.filter(r => r.d >= from && r.d <= to);
      };
      const draw = () => {
        $('#hRange').hidden = $('#hPer').value !== 'custom';
        const rows = rowsFor(sel);
        $('#hBody').innerHTML = rows.map(r => `<tr>
          <td class="td-main tnum" data-label="Fecha"><strong>${r.fecha}</strong> <span class="text-muted small">${r.d.toLocaleDateString('es-PE', { weekday: 'short' })}</span></td>
          <td class="num" data-label="Entrada">${r.in || '—'}</td><td class="num" data-label="Salida">${r.out || '—'}</td><td data-label="Estado">${badge(r.st)}</td></tr>`).join('');
        $('#hEmpty').innerHTML = rows.length ? '' : emptyState('calendar-x', 'Sin registros en este periodo', 'Elige otro periodo o amplía el rango de fechas.');
        const c = counts(rows);
        $('#hSum').innerHTML = `<h2 class="h3 mb-1">Resumen del periodo</h2>
          <p class="small text-muted mb-3">${esc(sel.n)} · ${sel.id} · ${esc(sel.area)} · ${rows.length} días</p>
          <ul class="list-plain">${Object.keys(ST).filter(k => k !== 'pendiente').map(k => `<li class="row-line">${badge(k)}<b class="tnum">${c[k] || 0}</b></li>`).join('')}</ul>`;
      };
      const setActive = i => {
        active = i;
        $$('[role="option"]', list).forEach((li, j) => li.setAttribute('aria-selected', String(j === i)));
        const li = $('#hOpt-' + i);
        if (li) { q.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
      };
      const open = text => {
        opts = doc.filter(p => matchPerson(p, text));
        list.innerHTML = opts.length
          ? opts.map((p, i) => `<li role="option" id="hOpt-${i}" aria-selected="false" data-i="${i}"><span class="avatar avatar-sm" aria-hidden="true">${initials(p.n)}</span><span class="min-w-0"><strong>${esc(p.n)}</strong><span class="small text-muted d-block">DNI ${p.dni} · ${esc(p.area)}</span></span></li>`).join('')
          : `<li class="combo-empty" aria-disabled="true">Sin coincidencias para “${esc(text)}”. Prueba con otro nombre o DNI.</li>`;
        list.hidden = false; q.setAttribute('aria-expanded', 'true');
        $('#hQStatus').textContent = opts.length ? `${opts.length} docente${opts.length === 1 ? '' : 's'} encontrado${opts.length === 1 ? '' : 's'}` : 'Sin coincidencias';
        setActive(opts.length && text ? 0 : -1);
      };
      const close = () => { list.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); active = -1; };
      const choose = i => { const p = opts[i]; if (!p) return; sel = p; q.value = p.n; close(); draw(); };
      q.addEventListener('focus', () => { q.select(); open(''); });
      q.addEventListener('input', () => open(q.value));
      q.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (list.hidden) open(q.value); else if (opts.length) setActive((active + 1) % opts.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (opts.length) setActive((active - 1 + opts.length) % opts.length); }
        else if (e.key === 'Enter') { if (!list.hidden && active >= 0) { e.preventDefault(); choose(active); } }
        else if (e.key === 'Escape') { if (!list.hidden) { e.preventDefault(); e.stopPropagation(); close(); q.value = sel.n; } }
      });
      q.addEventListener('blur', () => setTimeout(() => { close(); if (q.value !== sel.n) q.value = sel.n; }, 120));
      list.addEventListener('mousedown', e => { e.preventDefault(); const li = e.target.closest('[role="option"]'); if (li) choose(+li.dataset.i); });
      $('#hPer').onchange = draw; $('#hDesde').onchange = draw; $('#hHasta').onchange = draw;
      draw();
    }
  };
};

/* ---------- Vista previa de documento (v2 · MV-07; reutilizable en MV-13) ----------
   openDoc({ title, sub, viewer, meta: [[k, v]], file, actions: [{ label, ico, cls, run }] })
   "Cerrar" a la izquierda; "Descargar" si hay archivo; las acciones extra se ejecutan al cerrar el modal. */
function openDoc({ title, sub = '', viewer, meta = [], file = '', actions = [], opener = '' }) {
  const m = $('#docModal');
  // Al cerrar, el foco vuelve al botón que abrió la vista previa (o a su equivalente si la fila se redibujó)
  const from = document.activeElement;
  m.addEventListener('hidden.bs.modal', () => setTimeout(() => { const t = from?.isConnected ? from : opener && $(opener); t?.focus(); }), { once: true });
  $('#docTitle').textContent = title; $('#docSub').textContent = sub;
  $('#docViewer').innerHTML = viewer;
  $('#docMeta').innerHTML = meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('');
  const order = [{ label: 'Cerrar', cls: 'btn-outline-secondary', close: true },
    ...(file ? [{ label: 'Descargar', ico: 'download', cls: actions.length ? 'btn-outline-secondary' : 'btn-primary', keep: true, run: () => toast('success', 'Descarga iniciada', `${file} · se guarda en tu carpeta de descargas.`) }] : []),
    ...actions];
  $('#docFooter').innerHTML = order.map((a, i) => `<button type="button" class="btn ${a.cls}${i === 0 ? ' me-auto' : ''}" data-doc-act="${i}">${a.ico ? `<i class="bi bi-${a.ico}" aria-hidden="true"></i> ` : ''}${esc(a.label)}</button>`).join('');
  const modal = bootstrap.Modal.getOrCreateInstance(m);
  $('#docFooter').onclick = e => {
    const b = e.target.closest('[data-doc-act]'); if (!b) return;
    const a = order[+b.dataset.docAct];
    if (a.close) return modal.hide();
    if (a.keep) return a.run();
    m.addEventListener('hidden.bs.modal', () => a.run(), { once: true }); modal.hide();
  };
  modal.show();
}
/* Contenido simulado de los adjuntos de ejemplo. Un adjunto nuevo (subido en Mi asistencia) usa la plantilla genérica. */
const ADJ_DOCS = {
  'constancia_cita.pdf': { emisor: 'EsSalud · Policlínico Chincha', titulo: 'Constancia de atención', cuerpo: 'Se deja constancia de que el(la) paciente fue atendido(a) en consulta externa de Medicina General el día indicado, entre las 07:30 y 10:15 h.', firma: 'Dr. J. Palomino · CMP 45821' },
  'cargo_ugel.jpg': { emisor: 'UGEL 03 · Mesa de partes', titulo: 'Cargo de recepción de expediente', cuerpo: 'Expediente N.° 2026-118734 recibido para trámite de escalafón. Hora de recepción: 08:05 h.', firma: 'Sello de mesa de partes' },
  'acta_defuncion.pdf': { emisor: 'RENIEC', titulo: 'Acta de defunción (copia)', cuerpo: 'Copia certificada del acta de defunción de familiar directo, presentada como sustento de licencia por duelo.', firma: 'Registrador civil' },
  'certificado_medico.pdf': { emisor: 'Clínica San Gabriel', titulo: 'Certificado de incapacidad temporal', cuerpo: 'Se indica descanso médico de 1 (un) día por cuadro febril agudo.', firma: 'Dra. M. Ccori · CMP 51207' }
};
const isImg = f => /\.(jpe?g|png)$/i.test(f);
const adjViewer = j => {
  const d = ADJ_DOCS[j.adj] || { emisor: 'Documento adjuntado por el docente', titulo: j.adj, cuerpo: `Sustento de la solicitud ${j.id}: ${j.motivo}.`, firma: '' };
  return `<figure class="doc-page${isImg(j.adj) ? ' is-photo' : ''}" role="img" aria-label="Vista previa de ${esc(j.adj)}: ${esc(d.titulo)}, emitido por ${esc(d.emisor)}">
    <div class="doc-emisor">${esc(d.emisor)}</div>
    <div class="doc-titulo">${esc(d.titulo)}</div>
    <p>A nombre de: <strong>${esc(j.n)}</strong> · Fecha: <span class="tnum">${j.fecha}</span></p>
    <p>${esc(d.cuerpo)}</p>
    <div class="doc-lines" aria-hidden="true"><span></span><span></span><span style="width:70%"></span></div>
    ${d.firma ? `<div class="doc-firma">${esc(d.firma)}</div>` : ''}
  </figure>
  <p class="small text-muted mt-2 mb-0"><i class="bi bi-info-circle" aria-hidden="true"></i> Vista previa simulada del prototipo.</p>`;
};
const parseFecha = s => { const [d, m, y] = s.split('/'); return `${y}-${m}-${d}`; };

V['#/asistencia/justificaciones'] = () => {
  S.jf = S.jf || { doc: '', est: '', desde: '', hasta: '' };
  const solicitantes = [...new Set(DB.justifs.map(j => j.n))].sort((a, b) => a.localeCompare(b, 'es'));
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Asistencia', '#/asistencia/diario'], ['Justificaciones']],
      title: 'Justificaciones', desc: 'Solicitudes de justificación de tardanzas e inasistencias. Aprobar evita el descuento en planilla.'
    }) + `
    <div class="filter-bar" role="search" aria-label="Filtrar solicitudes">
      <div class="fb-item fb-item-wide"><label class="form-label" for="jDoc">Docente</label>
        <select id="jDoc" class="form-select"><option value="">Todos</option>${solicitantes.map(n => `<option>${esc(n)}</option>`).join('')}</select></div>
      <div class="fb-item"><label class="form-label" for="jEst">Estado</label>
        <select id="jEst" class="form-select"><option value="">Todos</option><option value="pendiente">○ Pendiente de revisión</option><option value="aprobada">◆ Aprobada</option><option value="rechazada">✕ Rechazada</option></select></div>
      <div class="fb-item"><label class="form-label" for="jDesde">Desde</label><input id="jDesde" type="date" class="form-control"></div>
      <div class="fb-item"><label class="form-label" for="jHasta">Hasta</label><input id="jHasta" type="date" class="form-control"></div>
    </div>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="active-filters m-0" id="jChips"></div>
      <p class="small text-muted mb-0 ms-auto" id="jCount" role="status" aria-live="polite"></p>
    </div>
    <div class="table-card"><div class="table-scroll"><table class="table table-stack">
      <thead><tr><th scope="col">Solicitante</th><th scope="col">Fecha</th><th scope="col">Tipo</th><th scope="col">Motivo y sustento</th><th scope="col">Estado</th><th scope="col" class="text-end">Acciones</th></tr></thead>
      <tbody id="jBody"></tbody></table></div><div id="jEmpty"></div></div>`,
    bind() {
      const F = S.jf;
      const approve = j => {
        const p = findPerson(j.n), prevSt = p?.st;
        j.estado = 'aprobada'; if (p && j.fecha === fmtDate(TODAY)) p.st = 'justificada';
        audit('Aprobó justificación', `${j.id} · ${j.n}`, true);
        // N01: misma salida de emergencia que en el Registro diario
        toast('success', 'Justificación aprobada', `${j.n} no tendrá descuento por este registro.`, { undo: () => {
          j.estado = 'pendiente'; if (p) p.st = prevSt; audit('Deshizo aprobación de justificación', `${j.id} · ${j.n}`, true);
          if ($('#jBody')) { draw(); $(`[data-ok="${j.id}"]`)?.focus(); }
          toast('info', 'Aprobación deshecha', `${j.id} vuelve a estar pendiente de revisión.`);
        } });
        draw();
      };
      const reject = j => confirmAction({ title: 'Rechazar justificación', msg: `Se rechazará la solicitud ${j.id} de ${j.n}. El registro mantendrá su estado original y podrá generar descuento.`, ok: 'Rechazar justificación', onOk() { j.estado = 'rechazada'; audit('Rechazó justificación', `${j.id} · ${j.n}`, true); toast('info', 'Justificación rechazada', 'Se notificará al docente.'); draw(); } });
      const preview = j => openDoc({
        title: j.adj, sub: `Sustento de ${j.id} · ${j.n}`, file: j.adj, opener: `[data-adj="${j.id}"]`, viewer: adjViewer(j),
        meta: [['Solicitud', `${j.id} · ${tipoBadge(j.tipo)}`], ['Motivo', esc(j.motivo)], ['Fecha del registro', `<span class="tnum">${j.fecha}</span>`], ['Formato', isImg(j.adj) ? 'Imagen JPG' : 'Documento PDF'], ['Estado', justifBadge(j.estado)]],
        actions: j.estado === 'pendiente' ? [{ label: 'Rechazar', cls: 'btn-outline-secondary', run: () => reject(j) }, { label: 'Aprobar', cls: 'btn-primary', run: () => approve(j) }] : []
      });
      const draw = () => {
        const rows = DB.justifs.filter(j => (!F.doc || j.n === F.doc) && (!F.est || j.estado === F.est)
          && (!F.desde || parseFecha(j.fecha) >= F.desde) && (!F.hasta || parseFecha(j.fecha) <= F.hasta));
        $('#jBody').innerHTML = rows.map(j => {
          const p = findPerson(j.n);
          return `<tr id="j-${j.id}">
          <td class="td-main" data-label="Solicitante">${personCell(p)}</td>
          <td data-label="Fecha" class="tnum">${j.fecha}</td>
          <td data-label="Tipo">${tipoBadge(j.tipo)}</td>
          <td data-label="Motivo y sustento">${esc(j.motivo)}<br>${j.adj ? `<button type="button" class="btn btn-link btn-sm adj-link" data-adj="${j.id}"><i class="bi bi-${isImg(j.adj) ? 'file-earmark-image' : 'file-earmark-pdf'}" aria-hidden="true"></i><span class="adj-name">${esc(j.adj)}</span> <span class="adj-cta">Ver</span><span class="visually-hidden"> adjunto de ${esc(j.n)}</span></button>` : '<span class="small text-muted">Sin sustento adjunto</span>'}</td>
          <td data-label="Estado">${justifBadge(j.estado)}</td>
          <td class="text-end" data-label="">${j.estado === 'pendiente' ? `<div class="d-flex gap-2 justify-content-end"><button class="btn btn-outline-secondary btn-sm" data-rej="${j.id}">Rechazar</button><button class="btn btn-primary btn-sm" data-ok="${j.id}">Aprobar</button></div>` : '<span class="small text-muted">Resuelta</span>'}</td></tr>`;
        }).join('');
        $('#jEmpty').innerHTML = rows.length ? '' : emptyState('funnel', 'Ninguna solicitud coincide con estos filtros', 'Cambia el docente, el estado o las fechas, o limpia los filtros.', '<button class="btn btn-outline-secondary" data-clear>Limpiar filtros</button>');
        const fd = s => s.split('-').reverse().join('/');
        const chips = [];
        if (F.doc) chips.push(['doc', `Docente: ${F.doc}`]);
        if (F.est) chips.push(['est', `Estado: ${JST[F.est].txt}`]);
        if (F.desde) chips.push(['desde', `Desde: ${fd(F.desde)}`]);
        if (F.hasta) chips.push(['hasta', `Hasta: ${fd(F.hasta)}`]);
        $('#jChips').innerHTML = chips.map(c => `<span class="chip">${esc(c[1])}<button aria-label="Quitar filtro ${esc(c[1])}" data-rm="${c[0]}"><i class="bi bi-x" aria-hidden="true"></i></button></span>`).join('')
          + (chips.length ? '<button class="btn btn-link btn-sm" data-clear>Limpiar filtros</button>' : '');
        const pend = rows.filter(j => j.estado === 'pendiente').length;
        $('#jCount').textContent = `${rows.length} de ${DB.justifs.length} solicitudes${pend ? ` · ${pend} pendiente${pend > 1 ? 's' : ''}` : ''}`;
      };
      const sync = () => { $('#jDoc').value = F.doc; $('#jEst').value = F.est; $('#jDesde').value = F.desde; $('#jHasta').value = F.hasta; $('#jHasta').min = F.desde; $('#jDesde').max = F.hasta; };
      [['jDoc', 'doc'], ['jEst', 'est'], ['jDesde', 'desde'], ['jHasta', 'hasta']].forEach(([id, k]) => $('#' + id).onchange = e => { F[k] = e.target.value; sync(); draw(); });
      $('#main').addEventListener('click', e => {
        const find = id => DB.justifs.find(x => x.id === id);
        const ok = e.target.closest('[data-ok]'), rej = e.target.closest('[data-rej]'), adj = e.target.closest('[data-adj]');
        if (ok) approve(find(ok.dataset.ok));
        if (rej) reject(find(rej.dataset.rej));
        if (adj) preview(find(adj.dataset.adj));
        const rm = e.target.closest('[data-rm]'); if (rm) { F[rm.dataset.rm] = ''; sync(); draw(); $('#jDoc').focus(); }
        if (e.target.closest('[data-clear]')) { Object.assign(F, { doc: '', est: '', desde: '', hasta: '' }); sync(); draw(); $('#jDoc').focus(); }
      });
      sync(); draw();
    }
  };
};

/* ---------- Horarios ---------- */
/* MV-06: cada área tiene su catálogo de cursos; el color sale de la posición del curso en el catálogo
   (c1–c5; Tutoría siempre c6), así un curso conserva siempre el mismo color, en toda la semana y en cada visita. */
const COURSES = {
  'Matemática': ['Álgebra', 'Geometría', 'Aritmética', 'Tutoría'],
  'Comunicación': ['Comprensión lectora', 'Gramática', 'Redacción', 'Tutoría'],
  'Ciencia y Tecnología': ['Biología', 'Química', 'Física', 'Tutoría'],
  'Inglés': ['Inglés básico', 'Inglés intermedio', 'Conversación', 'Tutoría'],
  'Historia': ['Historia del Perú', 'Geografía', 'Formación cívica', 'Tutoría'],
  'Arte y Cultura': ['Dibujo', 'Música', 'Teatro', 'Tutoría'],
  'Educación Física': ['Deportes', 'Psicomotricidad', 'Salud', 'Tutoría'],
  'Religión': ['Religión', 'Valores', 'Tutoría'],
  'Computación': ['Ofimática', 'Programación', 'Robótica', 'Tutoría']
};
const coursesOf = p => COURSES[p.area] || [p.area, 'Taller', 'Tutoría'];
/* Tutoría es común a todas las áreas: color fijo c6 en toda la institución. Los cursos del área usan c1–c5. */
const courseClass = (p, nm) => nm === 'Tutoría' ? 'c6' : 'c' + (coursesOf(p).indexOf(nm) % 5 + 1);
function weekGrid(p, highlightRepl = false) {
  const hours = ['07:45', '08:30', '09:15', '10:00', '10:45', '11:30', '12:15', '13:00', '13:45'];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const seed = +p.dni.slice(-3);
  const names = coursesOf(p);
  const used = new Set(); let hasRepl = false;
  let cells = '<div class="wg-h"></div>' + days.map(d => `<div class="wg-h">${d}</div>`).join('');
  hours.forEach((h, hi) => {
    cells += `<div class="wg-t">${h}</div>`;
    days.forEach((d, di) => {
      const v = (seed + hi * 7 + di * 13) % 10;
      if (hi === 4) { cells += `<div class="wg-c"><div class="class-block break"><strong>Recreo</strong></div></div>`; return; }
      if (v < 6) {
        const nm = names[(v + di) % names.length], sec = `${(v % 5) + 1}.° ${'ABC'[v % 3]}`;
        const repl = highlightRepl && di === 2 && hi === 2;
        if (repl) hasRepl = true; else used.add(nm);
        cells += `<div class="wg-c"><div class="class-block ${repl ? 'repl' : courseClass(p, nm)}"><strong>${repl ? '⇄ Reemplazo · ' : ''}${esc(nm)}</strong><span>${sec} · Aula ${100 + v * 3 + di}</span></div></div>`;
      } else cells += '<div class="wg-c"></div>';
    });
  });
  const legend = names.filter(n => used.has(n)).map(n => `<li><span class="legend-swatch ${courseClass(p, n)}" aria-hidden="true"></span>${esc(n)}</li>`).join('')
    + (hasRepl ? '<li><span class="legend-swatch is-repl" aria-hidden="true"></span>⇄ Reemplazo (rayado)</li>' : '')
    + '<li><span class="legend-swatch is-break" aria-hidden="true"></span>Recreo</li>';
  return `<div class="table-card"><ul class="legend wg-legend" aria-label="Leyenda de cursos">${legend}</ul><div class="wg-scroll" style="overflow:auto"><div class="week-grid">${cells}</div></div></div>`;
}
V['#/horarios'] = () => {
  const doc = DB.people.filter(p => p.tipo === 'Docente');
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Horarios']], title: 'Horarios', desc: 'Horario semanal por docente. Las horas de ingreso definen el cálculo de tardanzas.',
      actions: `<button class="btn btn-primary" id="editSched"><i class="bi bi-pencil"></i> Editar horario</button>`
    }) + `
    <div class="filter-bar"><div class="grow" style="max-width:360px"><label class="form-label" for="sDoc">Docente</label><select id="sDoc" class="form-select">${doc.map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join('')}</select></div></div>
    <div id="sGrid"></div>`,
    bind() {
      const draw = () => $('#sGrid').innerHTML = weekGrid(DB.people.find(p => p.id === $('#sDoc').value), true);
      $('#sDoc').onchange = draw; draw();
      $('#editSched').onclick = () => toast('info', 'Editor de horario', 'En el prototipo, el editor se simula. Arrastrar y soltar bloques estaría disponible aquí.');
    }
  };
};

/* ---------- Contratos ---------- */
V['#/contratos'] = () => {
  const cs = DB.contracts.map(contractState);
  const n = k => cs.filter(c => c.k === k).length;
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Contratos']], title: 'Contratos', desc: 'Vigencia y condiciones laborales. Toda modificación queda registrada en auditoría.',
      actions: `<button class="btn btn-primary" id="newC"><i class="bi bi-file-earmark-plus"></i> Nuevo contrato</button>`
    }) + `
    <div class="row g-3 mb-4">
      <div class="col-6 col-lg-3">${kpi({ label: 'Vigentes', value: n('vigente'), ico: '✓', tone: 'success', context: 'Más de 30 días de vigencia' })}</div>
      <div class="col-6 col-lg-3">${kpi({ label: 'Por vencer', value: n('porvencer'), ico: '▲', tone: 'warning', context: 'En los próximos 30 días' })}</div>
    </div>
    <div class="table-card"><div class="table-scroll"><table class="table table-stack">
      <thead><tr><th scope="col">Código</th><th scope="col">Titular</th><th scope="col">Tipo</th><th scope="col">Vigencia</th><th scope="col">Estado</th><th scope="col" style="width:56px"><span class="visually-hidden">Acciones</span></th></tr></thead>
      <tbody id="cBody"></tbody></table></div></div>`,
    bind() {
      const draw = () => {
        const rows = [...DB.contracts].sort((a, b) => a.fin - b.fin);
        $('#cBody').innerHTML = rows.map(k => {
          const s = contractState(k);
          const pct = Math.min(100, Math.max(0, (TODAY - k.ini) / (k.fin - k.ini) * 100));
          return `<tr id="c-${k.id}"${k.anulado ? ' class="text-muted"' : ''}>
            <td data-label="Código" class="tnum hide-mobile">${k.id}</td>
            <td class="td-main" data-label="Titular">${personCell(DB.people.find(p => p.id === k.pid))}</td>
            <td data-label="Tipo">${k.tipo}</td>
            <td data-label="Vigencia" style="min-width:180px"><div class="small tnum mb-1">${fmtDate(k.ini)} – ${fmtDate(k.fin)}</div><div class="progress" role="progressbar" aria-label="Avance de vigencia" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${pct}%${s.k === 'porvencer' ? ';background:var(--color-warning)' : ''}"></div></div></td>
            <td data-label="Estado">${contractBadge(k)}</td>
            <td class="td-actions text-end">${k.anulado ? '' : `<div class="dropdown"><button class="btn btn-ghost btn-icon btn-sm" data-bs-toggle="dropdown" data-bs-popper-config='{"strategy":"fixed"}' aria-label="Acciones contrato ${k.id}"><i class="bi bi-three-dots"></i></button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button class="dropdown-item" data-renew="${k.id}"><i class="bi bi-arrow-clockwise"></i> Renovar</button></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-danger-sys" data-void="${k.id}"><i class="bi bi-x-octagon"></i> Anular contrato</button></li>
              </ul></div>`}</td></tr>`;
        }).join('');
      };
      $('#main').addEventListener('click', e => {
        const v = e.target.closest('[data-void]'), r = e.target.closest('[data-renew]');
        if (v) { const k = DB.contracts.find(c => c.id === v.dataset.void);
          confirmAction({ title: 'Anular contrato', msg: `Se anulará el contrato ${k.id} de ${k.n}. La persona dejará de figurar en planilla desde el próximo periodo. Esta acción no se puede deshacer.`, ok: 'Anular contrato',
            onOk() { k.anulado = true; audit('Anuló contrato', `${k.id} · ${k.n}`, true); toast('success', 'Contrato anulado', `${k.id} · ${k.n}. Registrado en auditoría.`); draw(); } }); }
        if (r) { const k = DB.contracts.find(c => c.id === r.dataset.renew);
          openForm({ title: `Renovar · ${k.id}`, submit: 'Renovar contrato', body: `
            <p class="text-muted">${esc(k.n)} · vigente hasta <b class="tnum">${fmtDate(k.fin)}</b></p>
            ${field('rFin', 'Nueva fecha de término' + REQ, `<input id="rFin" name="fin" type="date" class="form-control" required min="${isoD(k.fin)}" aria-describedby="rFinErr">`, 'Elige una fecha posterior al término actual.')}
            ${field('rTipo', 'Tipo', `<select id="rTipo" name="tipo" class="form-select"><option>${k.tipo}</option><option>Plazo fijo</option><option>Indeterminado</option><option>Por horas</option></select>`)}`,
            onSubmit(d) { const prev = k.fin; k.fin = new Date(d.fin + 'T12:00'); k.tipo = d.tipo; audit('Modificó contrato', `${k.id} · ${k.n} — fin ${fmtDate(k.fin)}`, true); toast('success', 'Contrato renovado', `${k.id} vigente hasta ${fmtDate(k.fin)}.`, { undo: () => { k.fin = prev; draw(); } }); draw(); } }); }
      });
      $('#newC').onclick = () => toast('info', 'Nuevo contrato', 'Registra primero a la persona en Personal → Docentes; el contrato se crea con su ficha.');
      draw();
    }
  };
};

/* ---------- Reemplazos ---------- */
V['#/reemplazos'] = () => ({
  html: pageHeader({
    crumbs: [['Inicio', '#/inicio'], ['Reemplazos']], title: 'Reemplazos', desc: 'Clases sin docente por inasistencia. El sistema sugiere docentes del mismo turno sin clase en ese horario.'
  }) + `<div class="row g-4"><div class="col-xl-8"><div class="section-title"><h2>Pendientes de hoy</h2></div><div id="rPend" class="d-grid gap-3"></div></div>
    <div class="col-xl-4"><div class="section-title"><h2>Asignados recientemente</h2></div><div class="card"><div class="card-body py-2" id="rDone"></div></div></div></div>`,
  bind() {
    const avail = ['Rosa Chávez Paredes', 'Elena Paredes Ruiz', 'Diego Ramírez Cruz', 'Silvia Rojas Campos'];
    let lastId = null;
    const unassign = (r, how) => {
      const who = r.asignado; r.estado = 'pendiente'; r.asignado = ''; delete r.at; lastId = null;
      audit(how === 'undo' ? 'Deshizo asignación de reemplazo' : 'Canceló reemplazo', `${r.id} · ${who} → ${r.curso}`, true);
      if ($('#rPend')) { draw(); const card = $('#rc-' + r.id); card?.classList.add('flash-target'); $('#sel-' + r.id)?.focus(); setTimeout(() => card?.classList.remove('flash-target'), 2600); }
      return who;
    };
    const draw = () => {
      const pend = DB.replacements.filter(r => r.estado === 'pendiente');
      $('#rPend').innerHTML = pend.length ? pend.map(r => `
        <div class="card" id="rc-${r.id}"><div class="card-body">
          <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <div><span class="overline">${r.id} · ${r.fecha} · ${r.hora}</span><h3 class="mt-1 mb-1">${esc(r.curso)}</h3><p class="small text-muted mb-0">Titular: ${esc(r.ausente)} · ${r.sede}</p></div>
            <div>${badge('inasistencia', 'titular')}</div>
          </div>
          <div class="row g-2 align-items-end">
            <div class="col-sm"><label class="form-label" for="sel-${r.id}">Docente de reemplazo</label>
              <select class="form-select" id="sel-${r.id}" data-rsel="${r.id}"><option value="">Selecciona…</option>${avail.map((a, i) => `<option value="${a}">${a}${i < 2 ? ' — sugerido' : ''}</option>`).join('')}</select></div>
            <div class="col-sm-auto d-flex gap-2"><button class="btn btn-ghost" data-rclear="${r.id}" disabled>Limpiar</button><button class="btn btn-primary flex-grow-1" data-assign="${r.id}">Asignar</button></div>
          </div>
          <div class="invalid-feedback d-none" id="err-${r.id}">Selecciona un docente antes de asignar.</div>
        </div></div>`).join('')
        : `<div class="card">${emptyState('check2-circle', 'Todo cubierto', 'No hay clases pendientes de reemplazo para hoy.')}</div>`;
      /* MV-11: lo recién asignado primero; las asignaciones de hoy se pueden cancelar (las pasadas ya se dictaron) */
      const done = DB.replacements.filter(r => r.estado === 'asignado').sort((a, b) => (b.at || 0) - (a.at || 0));
      $('#rDone').innerHTML = done.length ? done.map(r => `
        <div class="row-line repl-done${r.id === lastId ? ' is-new' : ''}" id="rd-${r.id}" tabindex="-1"><div class="min-w-0"><strong class="small d-block">${esc(r.curso)}</strong><span class="small text-muted">${r.fecha} · ${r.hora} · ⇄ ${esc(r.asignado)}</span>
          ${r.fecha === fmtDate(TODAY) ? `<button class="btn btn-link btn-sm p-0 d-block text-danger-sys" data-rcancel="${r.id}" aria-label="Cancelar asignación de ${esc(r.asignado)} en ${esc(r.curso)}">Cancelar asignación</button>` : '<span class="small text-muted d-block">Clase dictada</span>'}</div>
          <span class="status-badge status-badge--puntual"><span class="sb-ico" aria-hidden="true">✓</span>Asignado</span></div>`).join('')
        : '<p class="small text-muted py-3 mb-0">Aún no hay asignaciones.</p>';
    };
    $('#main').addEventListener('change', e => {
      const s = e.target.closest('[data-rsel]'); if (!s) return;
      $(`[data-rclear="${s.dataset.rsel}"]`).disabled = !s.value;
      if (s.value) { s.classList.remove('is-invalid'); $('#err-' + s.dataset.rsel).classList.replace('d-block', 'd-none'); }
    });
    $('#main').addEventListener('click', e => {
      const cl = e.target.closest('[data-rclear]');
      if (cl) { const s = $('#sel-' + cl.dataset.rclear); s.value = ''; s.classList.remove('is-invalid'); $('#err-' + cl.dataset.rclear).classList.replace('d-block', 'd-none'); cl.disabled = true; s.focus(); return; }
      const cx = e.target.closest('[data-rcancel]');
      if (cx) { const r = DB.replacements.find(x => x.id === cx.dataset.rcancel);
        confirmAction({ title: 'Cancelar asignación', tone: 'tardanza', ok: 'Cancelar asignación', cancel: 'Mantener asignación', msg: `${r.asignado} ya no cubrirá ${r.curso} (${r.hora}). La clase volverá a "Pendientes de hoy" sin docente y se le avisará del cambio.`,
          onOk() { const who = unassign(r, 'cancel'); toast('info', 'Asignación cancelada', `${r.curso} vuelve a estar pendiente. Se avisó a ${who}.`); } });
        return; }
      const b = e.target.closest('[data-assign]'); if (!b) return;
      const r = DB.replacements.find(x => x.id === b.dataset.assign);
      const sel = $('#sel-' + r.id), err = $('#err-' + r.id);
      if (!sel.value) { sel.classList.add('is-invalid'); sel.setAttribute('aria-describedby', 'err-' + r.id); err.classList.remove('d-none'); err.classList.add('d-block'); sel.focus(); return; }
      b.disabled = true; b.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Asignando…';
      setTimeout(() => {
        r.estado = 'asignado'; r.asignado = sel.value; r.at = Date.now(); lastId = r.id;
        audit('Asignó reemplazo', `${r.id} · ${r.asignado} → ${r.curso}`, false);
        toast('success', 'Reemplazo asignado', `${r.asignado} cubrirá ${r.curso}. Se le notificó.`, { undo: () => { unassign(r, 'undo'); toast('info', 'Asignación deshecha', `${r.curso} vuelve a estar pendiente.`); } });
        draw(); $('#rd-' + r.id)?.focus();
      }, 600);
    });
    draw();
  }
});

/* ---------- Planillas ---------- */
const DESC_TARD = 15, DESC_FALTA_PCT = 1 / 30;
function payroll(p) {
  const h = historyFor(p, 20); const c = counts(h);
  const tard = (c.tardanza || 0) * DESC_TARD;
  const falt = Math.round((c.inasistencia || 0) * p.basico * DESC_FALTA_PCT * 100) / 100;
  const afp = Math.round(p.basico * .13 * 100) / 100;
  return { c, tard, falt, afp, neto: p.basico - tard - falt - afp };
}
V['#/planillas'] = () => {
  const rows = DB.people.map(p => ({ p, ...payroll(p) }));
  const tot = rows.reduce((a, r) => ({ b: a.b + r.p.basico, t: a.t + r.tard + r.falt, n: a.n + r.neto }), { b: 0, t: 0, n: 0 });
  const mes = TODAY.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  return {
    html: pageHeader({
      crumbs: [['Inicio', '#/inicio'], ['Planillas']], title: `Planilla de ${mes}`,
      desc: `Descuentos calculados automáticamente desde asistencia: tardanza ${money(DESC_TARD)} c/u · inasistencia = 1/30 de la remuneración ${helpTip('desc', '¿cómo se calculan los descuentos?')}`,
      actions: `<button class="btn btn-outline-secondary" id="expP"><i class="bi bi-file-earmark-spreadsheet"></i> Exportar Excel</button><button class="btn btn-primary" id="closeP"><i class="bi bi-lock"></i> Cerrar planilla</button>`
    }) + `
    <div class="alert alert-sys-warning mb-4"><span class="a-ico">▲</span><div><b>${DB.justifs.filter(j => j.estado === 'pendiente').length} justificaciones pendientes</b> pueden modificar los descuentos. <a href="#/asistencia/justificaciones">Revísalas antes de cerrar.</a></div></div>
    <div class="row g-3 mb-4">
      <div class="col-sm-4">${kpi({ label: 'Remuneraciones', value: money(tot.b).replace('S/ ', '<small>S/</small> '), context: `${rows.length} trabajadores` })}</div>
      <div class="col-sm-4">${kpi({ label: 'Descuentos por asistencia', value: money(tot.t).replace('S/ ', '<small>S/</small> '), context: 'Tardanzas e inasistencias' })}</div>
      <div class="col-sm-4">${kpi({ label: 'Neto a pagar', value: money(tot.n).replace('S/ ', '<small>S/</small> '), context: 'Después de AFP/ONP (13 %)' })}</div>
    </div>
    <div class="table-card"><div class="table-scroll"><table class="table table-stack">
      <thead><tr><th scope="col">Trabajador</th><th scope="col" class="num">Básico</th><th scope="col" class="num">▲ Tardanzas</th><th scope="col" class="num">✕ Inasist.</th><th scope="col" class="num">AFP/ONP</th><th scope="col" class="num">Neto</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td class="td-main" data-label="Trabajador">${personCell(r.p)}</td>
        <td class="num" data-label="Básico">${money(r.p.basico)}</td>
        <td class="num" data-label="Tardanzas">${r.tard ? `<span class="text-warning-sys">− ${money(r.tard)}</span> <span class="small text-muted">(${r.c.tardanza})</span>` : '—'}</td>
        <td class="num" data-label="Inasistencias">${r.falt ? `<span class="text-danger-sys">− ${money(r.falt)}</span> <span class="small text-muted">(${r.c.inasistencia})</span>` : '—'}</td>
        <td class="num" data-label="AFP/ONP">− ${money(r.afp)}</td>
        <td class="num fw-semibold" data-label="Neto">${money(r.neto)}</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="table-footer"><span>${rows.length} trabajadores</span><span class="fw-semibold text-body tnum">Total neto: ${money(tot.n)}</span></div></div>`,
    bind() {
      $('#expP').onclick = () => toast('success', 'Exportación lista', `planilla_${mes.replace(' ', '_')}.xlsx se descargó.`);
      const closeFinal = () => confirmAction({ title: 'Cerrar planilla', msg: `Se cerrará la planilla de ${mes}. Después del cierre no se podrán modificar asistencias ni descuentos de este periodo.`, ok: 'Cerrar planilla',
        onOk() { audit('Cerró planilla', `${mes} · ${money(tot.n)}`, true); toast('success', 'Planilla cerrada', `Periodo ${mes} cerrado. Los docentes ya pueden ver su boleta.`); } });
      // MV-04 (P05): si hay justificaciones pendientes, el modal las nombra y la acción principal es revisarlas
      $('#closeP').onclick = () => {
        const pend = DB.justifs.filter(j => j.estado === 'pendiente');
        if (!pend.length) return closeFinal();
        confirmAction({ tone: 'tardanza', audit: false,
          title: `Hay ${pend.length} justificaci${pend.length === 1 ? 'ón pendiente' : 'ones pendientes'}`,
          msg: `Si cierras la planilla de ${mes} ahora, estos descuentos quedarán aplicados aunque luego se aprueben las justificaciones:`,
          list: pend.map(j => `${j.id} · ${j.n} — ${j.tipo} del ${j.fecha}`),
          ok: 'Revisar justificaciones', onOk() { location.hash = '#/asistencia/justificaciones'; },
          alt: { label: 'Cerrar de todos modos', run: closeFinal } });
      };
    }
  };
};

/* ---------- Reportes ---------- */
V['#/reportes'] = () => ({
  html: pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Reportes']], title: 'Reportes', desc: 'Elige el tipo y periodo, previsualiza y exporta.' }) + `
    <div class="row g-4">
      <div class="col-lg-4"><form class="card" id="repForm" novalidate><div class="card-body">
        ${field('rT', 'Tipo de reporte', `<select id="rT" class="form-select"><option>Asistencia mensual</option><option>Tardanzas por docente</option><option>Cumplimiento por área</option><option>Personal y contratos</option></select>`)}
        <div class="row g-2">
          <div class="col-6">${field('rDe', 'Desde' + REQ, `<input id="rDe" type="date" class="form-control" required value="${isoD(addDays(TODAY, -30))}" aria-describedby="rDeErr">`, 'Indica la fecha de inicio.')}</div>
          <div class="col-6">${field('rHa', 'Hasta' + REQ, `<input id="rHa" type="date" class="form-control" required value="${isoD(TODAY)}" aria-describedby="rHaErr">`, 'Indica la fecha de fin.')}</div>
        </div>
        ${field('rA', 'Área', `<select id="rA" class="form-select"><option>Todas</option>${[...new Set(DB.people.map(p => p.area))].sort().map(a => `<option>${a}</option>`).join('')}</select>`)}
        <button class="btn btn-primary w-100" type="submit"><i class="bi bi-eye"></i> Previsualizar</button>
      </div></form></div>
      <div class="col-lg-8"><div class="card h-100" id="repOut">${emptyState('bar-chart-line', 'Aún no hay vista previa', 'Configura los filtros y pulsa “Previsualizar” para ver el reporte antes de exportarlo.')}</div></div>
    </div>`,
  bind() {
    $('#repForm').onsubmit = e => {
      e.preventDefault();
      if (validateForm(e.target).length) return;
      if ($('#rDe').value > $('#rHa').value) { $('#rHa').classList.add('is-invalid'); $('#rHaErr').textContent = 'La fecha “Hasta” debe ser posterior a “Desde”.'; $('#rHa').focus(); return; }
      $('#repOut').innerHTML = `<div class="card-body"><div class="skeleton mb-3" style="height:20px;width:40%"></div><div class="skeleton mb-4" style="height:180px"></div><div class="skeleton" style="height:120px"></div></div>`;
      setTimeout(() => {
        const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const data = [[86, 8, 4, 2], [82, 11, 5, 2], [88, 7, 3, 2], [84, 9, 5, 2]];
        const cols = ['success', 'warning', 'danger', 'info'];
        $('#repOut').innerHTML = `<div class="card-header"><h2>${$('#rT').value}</h2>
          <div class="d-flex gap-2"><button class="btn btn-outline-secondary btn-sm" data-exp="PDF"><i class="bi bi-file-earmark-pdf"></i> PDF</button><button class="btn btn-outline-secondary btn-sm" data-exp="Excel"><i class="bi bi-file-earmark-spreadsheet"></i> Excel</button></div></div>
          <div class="card-body">
            <p class="small text-muted mb-1">${fmtDate(new Date($('#rDe').value + 'T12:00'))} – ${fmtDate(new Date($('#rHa').value + 'T12:00'))} · Área: ${esc($('#rA').value)}</p>
            <div class="bars" role="img" aria-label="Porcentaje de registros por semana: ${weeks.map((w, i) => `${w}: ${data[i][0]} % puntual, ${data[i][1]} % tardanza, ${data[i][2]} % inasistencia, ${data[i][3]} % justificada`).join('; ')}">
              ${weeks.map((w, i) => `<div class="bar-col"><span class="small fw-semibold tnum">${data[i][0]} %</span><div class="bar-stack" style="height:100%">${data[i].map((v, j) => `<span style="height:${v}%;background:var(--color-${cols[j]})"></span>`).join('')}</div><span class="bar-lbl">${w}</span></div>`).join('')}
            </div>
            <div class="legend">${['puntual', 'tardanza', 'inasistencia', 'justificada'].map(k => `<span>${ST[k].ico} ${ST[k].txt}</span>`).join('')}</div>
            <table class="table table-sm mt-4"><thead><tr><th>Semana</th>${['puntual', 'tardanza', 'inasistencia', 'justificada'].map(k => `<th class="num">${ST[k].ico} ${ST[k].txt}</th>`).join('')}</tr></thead>
              <tbody>${weeks.map((w, i) => `<tr><td>${w}</td>${data[i].map(v => `<td class="num">${v} %</td>`).join('')}</tr>`).join('')}</tbody></table>
          </div>`;
        $$('[data-exp]').forEach(b => b.onclick = () => { audit('Exportó reporte', `${$('#rT').value} (${b.dataset.exp})`); toast('success', `Reporte exportado en ${b.dataset.exp}`, 'El archivo se guardó en tu carpeta de descargas.'); });
      }, 700);
    };
  }
});

/* ---------- Auditoría ---------- */
V['#/auditoria'] = () => ({
  html: pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Auditoría']], title: 'Auditoría', desc: 'Registro de acciones realizadas en el sistema. Las acciones sensibles se marcan con 🔒.' }) + `
    <div class="filter-bar"><div class="fb-item"><label class="form-label" for="aSens">Tipo de acción</label><select id="aSens" class="form-select"><option value="">Todas</option><option value="1">Solo sensibles</option></select></div></div>
    <div class="table-card"><div class="table-scroll"><table class="table table-stack">
      <thead><tr><th scope="col">Fecha y hora</th><th scope="col">Usuario</th><th scope="col">Acción</th><th scope="col">Detalle</th></tr></thead>
      <tbody id="aBody"></tbody></table></div></div>`,
  bind() {
    const draw = () => {
      const only = $('#aSens').value === '1';
      $('#aBody').innerHTML = DB.audit.filter(a => !only || a[5]).map(a => `<tr>
        <td class="tnum" data-label="Fecha">${fmtDate(a[1])} · ${a[2]}</td>
        <td class="td-main" data-label="Usuario"><div class="person"><span class="avatar avatar-sm">${initials(a[0])}</span><strong>${esc(a[0])}</strong></div></td>
        <td data-label="Acción">${a[5] ? '<i class="bi bi-shield-lock me-1" aria-hidden="true" style="color:var(--color-accent-text)"></i><span class="visually-hidden">Acción sensible: </span>' : ''}<span class="fw-semibold">${esc(a[3])}</span></td>
        <td data-label="Detalle" class="text-muted">${esc(a[4])}</td></tr>`).join('');
    };
    $('#aSens').onchange = draw; draw();
  }
});

/* ---------- Configuración multi-colegio (§4.3, §40.3) ---------- */
function applySchool() {
  $$('[data-school-name]').forEach(e => e.textContent = S.school.name);
  $$('[data-school-initials]').forEach(e => e.textContent = initials(S.school.name.replace(/^I\.E\.P\.\s*/, '')) || 'SJ');
}
V['#/configuracion'] = () => ({
  html: pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Configuración']], title: 'Configuración de la institución', desc: 'Identidad y reglas de asistencia. El color del colegio genera el tema “Institucional”; los colores de estado nunca cambian.' }) + `
    <div class="row g-4"><div class="col-lg-7"><form class="card" id="cfgForm" novalidate><div class="card-body">
      <fieldset class="mb-4"><legend>Identidad</legend>
        ${field('cName', 'Nombre de la institución' + REQ, `<input id="cName" name="name" class="form-control" required value="${esc(S.school.name)}" aria-describedby="cNameErr">`, 'Ingresa el nombre de la institución.')}
        <label class="form-label" for="cColor">Color del colegio</label>
        <div class="d-flex gap-3 align-items-center mb-2"><input id="cColor" name="color" type="color" class="form-control form-control-color" value="${S.school.color}" style="width:56px;height:40px"><code id="cHex" class="tnum">${S.school.color}</code></div>
        <div id="cCheck" class="small" aria-live="polite"></div>
      </fieldset>
      <fieldset><legend>Reglas de asistencia ${helpTip('tol', '¿qué es la tolerancia?')}</legend>
        <div class="row g-3"><div class="col-sm-6">${field('cIn', 'Hora de ingreso', `<input id="cIn" type="time" class="form-control" value="${SCHEDULE_START}" readonly aria-describedby="cInHelp">`, '', 'Se define por horario de cada docente.')}</div>
        <div class="col-sm-6">${field('cTol', 'Tolerancia (minutos)' + REQ, `<input id="cTol" name="tol" type="number" min="0" max="30" class="form-control" required value="${S.school.tol}" aria-describedby="cTolErr cTolHelp">`, 'Ingresa un valor entre 0 y 30 minutos.', 'Minutos de gracia después de la hora de ingreso antes de contar tardanza.')}</div></div>
      </fieldset>
      <div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="cUse" ${S.look.theme === 'institucional' ? 'checked' : ''}><label class="form-check-label" for="cUse">Usar el color del colegio como tema de la plataforma</label></div>
      <div class="d-flex justify-content-end gap-2 mt-3"><span class="audit-note me-auto"><i class="bi bi-shield-lock"></i> Quedará en auditoría</span><button class="btn btn-primary" type="submit">Guardar configuración</button></div>
    </div></form></div>
    <div class="col-lg-5"><div class="card"><div class="card-body">
      <h2 class="h3 mb-3">Escala generada</h2>
      <div class="swatches mb-2" id="pvScale" aria-hidden="true"></div>
      <div class="d-flex small text-muted tnum mb-4 text-center">${[50, 100, 200, 300, 500, 700, 800, 900].map(k => `<span class="flex-fill">${k}</span>`).join('')}</div>
      <p class="small text-muted mb-2">Los estados no cambian con la marca:</p>
      <div class="d-flex flex-wrap gap-2">${['puntual', 'tardanza', 'inasistencia', 'justificada', 'salida'].map(k => badge(k)).join('')}</div>
    </div></div></div></div>`,
  bind() {
    const preview = () => {
      const c = $('#cColor').value.toUpperCase();
      $('#cHex').textContent = c;
      const { scale, adjusted } = generateScale(c);
      $('#pvScale').innerHTML = [50, 100, 200, 300, 500, 700, 800, 900].map(k => `<i style="background:${scale[k]}"></i>`).join('');
      $('#cCheck').innerHTML = adjusted
        ? `<span class="text-warning-sys fw-semibold">▲ ${c} tiene contraste ${contrast(c).toFixed(2)}:1 con blanco (mín. 4.5:1).</span> Para botones y enlaces se usará <b class="tnum">${scale[700]}</b> (${contrast(scale[700]).toFixed(2)}:1).`
        : `<span class="text-success-sys fw-semibold">✓ Contraste ${contrast(c).toFixed(2)}:1 con blanco.</span> Se usa tal cual en botones y enlaces.`;
    };
    $('#cColor').oninput = preview; preview();
    $('#cfgForm').onsubmit = e => {
      e.preventDefault(); if (validateForm(e.target).length) return;
      if (+$('#cTol').value < 0 || +$('#cTol').value > 30) { $('#cTol').classList.add('is-invalid'); $('#cTol').focus(); return; }
      S.school = { name: $('#cName').value.trim(), color: $('#cColor').value.toUpperCase(), tol: +$('#cTol').value };
      store.set('school', S.school); applySchool();
      if ($('#cUse').checked) setLook('theme', 'institucional', true); else if (S.look.theme === 'institucional') setLook('theme', 'bosque', true);
      renderAppearanceMenu();
      audit('Modificó configuración', `Color ${S.school.color} · tolerancia ${S.school.tol} min`, true);
      toast('success', 'Configuración guardada', $('#cUse').checked ? 'Se aplicó el tema Institucional en toda la plataforma.' : 'La identidad se actualizó.');
    };
  }
});

/* ---------- Apariencia (§39–§41) ---------- */
const MODES = [
  { k: 'light', label: 'Claro', ico: 'sun', desc: 'Máxima legibilidad de día', bg: '#F6F7F8', sb: '#FFFFFF', line: '#DCE0E5' },
  { k: 'dark', label: 'Oscuro', ico: 'moon-stars', desc: 'Menos brillo, ideal de noche', bg: '#0F1318', sb: '#161B22', line: '#2A333E' },
  { k: 'system', label: 'Sistema', ico: 'circle-half', desc: 'Sigue la configuración del equipo' }
];
V['#/apariencia'] = () => ({
  html: pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Apariencia']], title: 'Apariencia', desc: 'Elige modo, tema y estilo del sidebar. Se guarda en este dispositivo. Los colores de estado (✓ ▲ ✕ ◆ ◀) son fijos en todos los temas.' }) + `
    <section class="mb-5">
      <div class="section-title"><h2>Modo</h2></div>
      <div class="theme-grid" role="group" aria-label="Modo de color">
        ${MODES.map(m => `
          <button class="theme-card" data-mode="${m.k}">
            ${m.bg ? `<div class="mode-preview" style="background:${m.bg}"><div class="mp-sb" style="background:${m.sb}"></div><div class="mp-main"><i style="width:60%;background:${m.line}"></i><i style="width:85%;background:${m.line}"></i><i style="width:40%;background:var(--primary)"></i></div></div>`
              : `<div class="mode-preview" style="background:linear-gradient(135deg,#F6F7F8 50%,#0F1318 50%)"></div>`}
            <strong><i class="bi bi-${m.ico} me-1" aria-hidden="true"></i>${m.label}</strong><span class="desc">${m.desc}</span>
          </button>`).join('')}
      </div>
    </section>
    <section class="mb-5">
      <div class="section-title"><h2>Tema de color</h2><span class="small text-muted">Contraste del botón primario</span></div>
      <div class="theme-grid" role="group" aria-label="Tema de color">
        ${themeKeys().map(k => { const s = scaleOf(k); return `
          <button class="theme-card" data-theme="${k}">
            <div class="swatches" aria-hidden="true">${[100, 300, 500, 700, 900].map(n => `<i style="background:${s[n]}"></i>`).join('')}</div>
            <strong>${themeLabel(k)}</strong>
            <span class="desc">${k === 'institucional' ? 'Desde el color del colegio' : THEMES[k].desc} · ${contrast(s[700]).toFixed(1)}:1</span>
          </button>`; }).join('')}
      </div>
    </section>
    <section class="mb-5">
      <div class="section-title"><h2>Estilo del sidebar</h2></div>
      <div class="theme-grid" role="group" aria-label="Estilo del sidebar" style="max-width:420px">
        <button class="theme-card" data-sb-style="claro"><div class="mode-preview" style="background:var(--color-bg)"><div class="mp-sb" style="background:var(--color-surface)"></div><div class="mp-main"><i style="width:70%;background:var(--color-border)"></i><i style="width:50%;background:var(--color-border)"></i></div></div><strong>Claro</strong><span class="desc">Superficie neutra; el tema va en acentos</span></button>
        <button class="theme-card" data-sb-style="color"><div class="mode-preview" style="background:var(--color-bg)"><div class="mp-sb" style="background:var(--p-900)"></div><div class="mp-main"><i style="width:70%;background:var(--color-border)"></i><i style="width:50%;background:var(--color-border)"></i></div></div><strong>De color</strong><span class="desc">Fondo del tono 900 del tema</span></button>
      </div>
    </section>
    <div class="row g-4">
      <div class="col-xl-6"><div class="card h-100"><div class="card-header"><h2>Vista previa de componentes</h2></div><div class="card-body">
        <div class="d-flex flex-wrap gap-2 mb-3"><button class="btn btn-primary">Primario</button><button class="btn btn-outline-secondary">Secundario</button><button class="btn btn-ghost">Terciario</button><button class="btn btn-danger">Destructivo</button></div>
        <div class="d-flex flex-wrap gap-2 mb-3">${Object.keys(ST).map(k => badge(k)).join('')}</div>
        <div class="d-flex flex-wrap gap-2 mb-3">${['puntual', 'tardanza', 'inasistencia', 'justificada'].map(k => badge(k, '', true)).join('')}</div>
        ${field('pvIn', 'Campo de ejemplo', '<input id="pvIn" class="form-control" placeholder="Escribe algo…">')}
        <div class="d-flex flex-wrap gap-2 align-items-center mb-3"><span class="chip">Área: Matemática<button type="button" aria-label="Quitar filtro"><i class="bi bi-x"></i></button></span><span class="tag">Etiqueta</span><a href="#/apariencia">Enlace de texto</a></div>
        <div class="alert alert-sys-info small mb-0"><span class="a-ico" aria-hidden="true">i</span><span>Alerta informativa en línea: icono + texto + color.</span></div>
      </div></div></div>
      <div class="col-xl-6"><div class="card h-100"><div class="card-header"><h2>Toasts</h2><span class="small text-muted">Pasa el cursor para pausar</span></div><div class="card-body">
        <div class="d-grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="success"><span class="text-success-sys fw-bold" aria-hidden="true">✓</span> Éxito</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="error"><span class="text-danger-sys fw-bold" aria-hidden="true">✕</span> Error</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="warning"><span class="text-warning-sys fw-bold" aria-hidden="true">▲</span> Advertencia</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="info"><span class="text-info-sys fw-bold" aria-hidden="true">i</span> Información</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="undo"><i class="bi bi-arrow-counterclockwise"></i> Con “Deshacer”</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="loading"><i class="bi bi-hourglass-split"></i> Carga → resultado</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="action"><i class="bi bi-arrow-repeat"></i> Error con acción</button>
          <button class="btn btn-outline-secondary justify-content-start" data-demo-toast="persistent"><i class="bi bi-pin-angle"></i> Persistente</button>
        </div>
        <p class="small text-muted mt-3 mb-0">Máximo 3 visibles. Éxito e info 4,5 s · advertencia 6,5 s · error 8 s · carga y persistente sin autocierre.</p>
      </div></div></div>
    </div>`,
  bind() {
    applyAppearance(false);
    $('#main').addEventListener('click', e => {
      const b = e.target.closest('[data-demo-toast]'); if (!b) return;
      const k = b.dataset.demoToast;
      if (k === 'success') toast('success', 'Docente registrado', 'Elena Paredes Ruiz (D-013) ya aparece en la lista.');
      if (k === 'error') toast('error', 'No se pudo exportar el reporte', 'El servidor tardó demasiado. Inténtalo de nuevo en unos minutos.');
      if (k === 'warning') toast('warning', 'Marcación pendiente de sincronizar', 'Se enviará automáticamente al recuperar la conexión.');
      if (k === 'info') toast('info', 'Planilla abierta', 'El cierre de este periodo es el día 30.');
      if (k === 'undo') toast('success', 'Contrato renovado', 'C-0205 vigente hasta 31/12/2026.', { undo: () => toast('info', 'Cambio revertido') });
      if (k === 'action') toast('error', 'Falló la sincronización', 'Tu marcación de las 07:52 no se envió.', { action: { label: 'Reintentar', run: () => toast('success', 'Marcación sincronizada') } });
      if (k === 'persistent') toast('warning', 'Cierre de planilla mañana', 'Hay justificaciones pendientes que afectan descuentos.', { persistent: true, action: { label: 'Revisar', run: () => { location.hash = '#/asistencia/justificaciones'; } } });
      if (k === 'loading') { const t = toast('loading', 'Generando reporte…', 'Asistencia mensual · PDF'); setTimeout(() => t.update('success', 'Reporte listo', 'asistencia_mensual.pdf se descargó.'), 1800); }
    });
  }
});

/* ==========================================================================
   VISTAS — DOCENTE
   ========================================================================== */
const ME = () => DB.people.find(p => p.dni === '70112233');
function simNow() {
  if (S.simTime === 'now') return new Date();
  const [h, m] = S.simTime.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d;
}
function docenteHome() {
  const me = ME();
  const hist = historyFor(me, 20); const c = counts(hist);
  const pay = payroll(me);
  const P = S.punch;
  const state = P.out ? 'done' : P.in ? 'in' : 'none';
  const todayBadge = P.st ? badge(P.st, P.st === 'tardanza' ? `${P.late} min` : '', true) : badge('pendiente', 'sin marcar', true);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const sched = [['07:45', 'Ingreso', 'Sede Norte · Puerta principal'], ['08:00', 'Álgebra · 3.° A', 'Aula 204'], ['09:30', 'Geometría · 4.° B', 'Aula 207'], ['11:00', 'Recreo', ''], ['11:30', 'Aritmética · 2.° C', 'Aula 110'], ['13:00', 'Tutoría · 3.° A', 'Aula 204'], ['14:30', 'Salida', '']];
  const nowIdx = sched.reduce((a, s, i) => toMin(s[0]) <= nowMin ? i : a, -1);

  return {
    html: `
    <nav aria-label="Ruta"><ol class="breadcrumb"><li class="breadcrumb-item active" aria-current="page">Mi panel</li></ol></nav>
    <div class="page-header"><div><h1 tabindex="-1">Hola, Marco</h1><p>${fmtDateLong(TODAY)} · Sede Norte</p></div></div>

    <div class="card mb-4">
      <div class="punch-card">
        <div>
          <span class="overline">Estado de hoy</span>
          <div class="mt-2 mb-3" id="todayBadge">${todayBadge}</div>
          <div class="punch-clock" id="clock" aria-hidden="true">${hhmm(simNow())}</div>
          <div class="punch-meta">
            <span>Ingreso programado <strong class="tnum">${SCHEDULE_START}</strong></span>
            <span>Tolerancia <strong class="tnum">${S.school.tol} min</strong> ${helpTip('tol', '¿qué es la tolerancia?')}</span>
            <span>Salida <strong class="tnum">${SCHEDULE_END}</strong></span>
          </div>
        </div>
        <div class="text-lg-end">
          ${state === 'done'
            ? (P.st === 'salida'
              ? `<div class="status-badge status-badge--salida solid"><span class="sb-ico" aria-hidden="true">◀</span>Jornada cerrada · salida anticipada</div>`
              : `<div class="status-badge status-badge--puntual solid"><span class="sb-ico" aria-hidden="true">✓</span>Jornada completa</div>`)
            : `<button class="btn btn-primary punch-btn" id="punchBtn"><i class="bi bi-${state === 'none' ? 'box-arrow-in-right' : 'box-arrow-right'}"></i> ${state === 'none' ? 'Registrar entrada' : 'Registrar salida'}</button>`}
          <p class="small text-muted mt-2 mb-0">${state === 'none' ? 'Un toque. Te confirmaremos la hora y el estado.' : state === 'in' ? `Entrada registrada a las <b class="tnum">${P.in}</b>` : `Entrada ${P.in} · Salida ${P.out}`}</p>
        </div>
      </div>
      <div class="px-4 pb-4" id="punchResult" aria-live="assertive">${P.msg ? punchMsg(P) : ''}</div>
      <details class="border-top px-4 py-3 small">
        <summary class="text-muted">Herramientas de demostración</summary>
        <div class="d-flex flex-wrap gap-3 align-items-end mt-3">
          <div><label class="form-label" for="simT">Simular hora</label>
            <select id="simT" class="form-select form-select-sm" style="min-height:32px">
              <option value="now" ${S.simTime === 'now' ? 'selected' : ''}>Hora actual</option>
              <option value="07:38" ${S.simTime === '07:38' ? 'selected' : ''}>07:38 (a tiempo)</option>
              <option value="08:03" ${S.simTime === '08:03' ? 'selected' : ''}>08:03 (tarde)</option>
              <option value="12:20" ${S.simTime === '12:20' ? 'selected' : ''}>12:20 (salida anticipada)</option>
              <option value="14:34" ${S.simTime === '14:34' ? 'selected' : ''}>14:34 (salida normal)</option>
            </select></div>
          <div class="form-check form-switch mb-1"><input class="form-check-input" type="checkbox" role="switch" id="simOff" ${S.forceOffline ? 'checked' : ''}><label class="form-check-label" for="simOff">Simular sin conexión</label></div>
          <button class="btn btn-ghost btn-sm" id="resetPunch">Reiniciar marcación</button>
        </div>
      </details>
    </div>

    <div class="row g-4">
      <div class="col-lg-5"><div class="card h-100"><div class="card-header"><h2>Horario de hoy</h2><a class="small" href="#/mi-horario">Semana →</a></div><div class="card-body">
        <ol class="timeline">${sched.map((s, i) => `<li class="${i < nowIdx ? 'done' : i === nowIdx ? 'now' : ''}"><span class="tl-time">${s[0]}</span><span class="tl-dot" aria-hidden="true"></span><div class="tl-body"><strong>${coursesOf(me).includes(s[1].split(' · ')[0]) ? `<span class="legend-swatch ${courseClass(me, s[1].split(' · ')[0])}" aria-hidden="true"></span>` : ''}${s[1]}${i === nowIdx ? ' <span class="tag ms-1">Ahora</span>' : ''}</strong>${s[2] ? `<span>${s[2]}</span>` : ''}</div></li>`).join('')}</ol>
      </div></div></div>
      <div class="col-lg-7 d-flex flex-column gap-4">
        <div class="card"><div class="card-header"><h2>Mi mes</h2><a class="small" href="#/mi-asistencia">Ver detalle →</a></div><div class="card-body">
          <div class="row g-3 text-center">${['puntual', 'tardanza', 'inasistencia', 'justificada'].map(k => `<div class="col-6 col-sm-3"><div class="kpi-value" style="font-size:2rem">${c[k] || 0}</div><div class="mt-2">${badge(k)}</div></div>`).join('')}</div>
        </div></div>
        <div class="card"><div class="card-header"><h2>Descuentos estimados ${helpTip('desc', '¿cómo se calculan los descuentos?')}</h2><span class="tag">Antes del cierre</span></div><div class="card-body">
          <div class="d-flex align-items-baseline gap-2 mb-3"><span class="kpi-value" style="font-size:2rem">${money(pay.tard + pay.falt)}</span><span class="text-muted small">este mes</span></div>
          <ul class="list-plain small">
            <li class="row-line"><span>▲ ${c.tardanza || 0} tardanza(s) × ${money(DESC_TARD)}</span><b class="tnum">${money(pay.tard)}</b></li>
            <li class="row-line"><span>✕ ${c.inasistencia || 0} inasistencia(s) × 1/30 de ${money(me.basico)}</span><b class="tnum">${money(pay.falt)}</b></li>
            <li class="row-line"><span>◆ ${c.justificada || 0} justificada(s)</span><b class="tnum">${money(0)}</b></li>
          </ul>
          <p class="small text-muted mb-0 mt-2"><i class="bi bi-info-circle"></i> ¿Algo no cuadra? Puedes solicitar una justificación desde <a href="#/mi-asistencia">Mi asistencia</a>.</p>
        </div></div>
      </div>
    </div>`,
    bind() {
      clearInterval(S.clockTimer);
      S.clockTimer = setInterval(() => { const c = $('#clock'); if (c) c.textContent = hhmm(simNow()); else clearInterval(S.clockTimer); }, 5000);
      $('#punchBtn')?.addEventListener('click', doPunch);
      bindUndoPunch();
      $('#simT').onchange = e => { S.simTime = e.target.value; $('#clock').textContent = hhmm(simNow()); };
      $('#simOff').onchange = e => { S.forceOffline = e.target.checked; updateNet(); };
      $('#resetPunch').onclick = () => { S.punch = { in: null, out: null, st: null }; route(); };
    }
  };
}
const UNDO_PUNCH_MS = 10000;
function punchMsg(P) {
  const canUndo = P.undoUntil && Date.now() < P.undoUntil;
  return `<div class="punch-result"><span class="t-ico kpi-ico" style="background:var(--color-${P.tone}-soft);color:var(--color-${P.tone}-text)" aria-hidden="true">${P.ico}</span>
    <div class="flex-grow-1"><p class="fw-semibold mb-1">${P.msg}</p><p class="small text-muted mb-0">${P.detail}</p></div>
    ${canUndo ? `<button class="btn btn-outline-secondary btn-sm align-self-center" id="undoPunch"><i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Deshacer</button>` : ''}</div>`;
}
function bindUndoPunch() {
  const b = $('#undoPunch'); if (!b) return;
  b.onclick = () => {
    const P = S.punch, prev = P.prev; if (!prev) return;
    Object.assign(P, prev, { out: null, prev: null, undoUntil: 0,
      msg: 'Salida anulada · Tu jornada sigue abierta', detail: `Entrada registrada a las ${P.in}. Registra tu salida cuando termines.`, tone: 'info', ico: 'i' });
    ME().out = ''; ME().st = prev.st;
    route();
  };
}
/* MV-03: la salida antes de la hora programada pide confirmación (P01) */
function doPunch() {
  const P = S.punch; const t = hhmm(simNow());
  if (P.in && !P.out && toMin(t) < toMin(SCHEDULE_END)) {
    confirmAction({ title: '¿Registrar salida anticipada?',
      msg: `Tu salida programada es ${SCHEDULE_END} y son las ${t}. Si registras ahora, el día quedará como salida anticipada. Podrás deshacerlo durante 10 segundos.`,
      ok: 'Registrar salida anticipada', tone: 'salida', audit: false, onOk: registerPunch });
    return;
  }
  registerPunch();
}
function registerPunch() {
  const btn = $('#punchBtn'); if (!btn) return;
  const P = S.punch; const now = simNow(); const t = hhmm(now); const nowMin = toMin(t);
  btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span> Registrando…';
  const offline = !isOnline();
  setTimeout(() => {
    if (!P.in) {
      const late = nowMin - toMin(SCHEDULE_START);
      P.in = t; P.late = Math.max(0, late);
      P.st = late > S.school.tol ? 'tardanza' : 'puntual';
      P.tone = P.st === 'puntual' ? 'success' : 'warning'; P.ico = ST[P.st].ico;
      P.msg = `Entrada registrada a las ${t} · ${ST[P.st].txt}${P.st === 'tardanza' ? ` (${P.late} min)` : ''}`;
      P.detail = P.st === 'puntual'
        ? `Ingreso programado ${SCHEDULE_START} + ${S.school.tol} min de tolerancia = ${hhmm(new Date(0, 0, 0, 7, 45 + S.school.tol))}. Llegaste a tiempo.`
        : `Ingreso programado ${SCHEDULE_START} + ${S.school.tol} min de tolerancia. Se descontará ${money(DESC_TARD)} salvo que se apruebe una justificación.`;
      ME().st = P.st; ME().in = t;
    } else {
      const early = nowMin < toMin(SCHEDULE_END);
      if (early) P.prev = { st: P.st, tone: P.tone, ico: P.ico, msg: P.msg, detail: P.detail, queued: P.queued };
      P.out = t;
      if (early) { P.st = 'salida'; P.tone = 'early'; P.ico = '◀'; P.undoUntil = Date.now() + UNDO_PUNCH_MS; }
      else { P.tone = 'success'; P.ico = '✓'; }
      P.msg = `Salida registrada a las ${t}${early ? ' · Salida anticipada' : ''}`;
      P.detail = early ? `Tu salida programada es ${SCHEDULE_END}. Si tienes un permiso, solicita la justificación en Mi asistencia.` : `Jornada completa: ${P.in} – ${t}.`;
      ME().out = t; if (early) ME().st = 'salida';
    }
    if (offline) { P.queued = true; P.detail += ' Sin conexión: se guardó en este dispositivo y se enviará al reconectar.'; }
    route();
    // MV-03 / P11: el resultado se muestra una sola vez, en la tarjeta (región aria-live). Sin toast duplicado.
    if (P.undoUntil) setTimeout(() => { if (S.punch === P && $('#punchResult')) { P.undoUntil = 0; $('#punchResult').innerHTML = punchMsg(P); } }, UNDO_PUNCH_MS);
  }, 500);
}

V['#/mi-asistencia'] = () => {
  const me = ME();
  /* MV-01: el estado mostrado considera la solicitud de justificación del día (aprobada → Justificada) */
  const reqOf = x => DB.justifs.find(j => j.n === me.n && j.fecha === x.fecha);
  const rows = historyFor(me, 20).map(x => ({ ...x, st: reqOf(x)?.estado === 'aprobada' ? 'justificada' : x.st }));
  const c = counts(rows);
  const segs = [['puntual', 'success'], ['tardanza', 'warning'], ['salida', 'early'], ['justificada', 'info'], ['inasistencia', 'danger']].filter(s => c[s[0]]);
  return {
    html: pageHeader({ crumbs: [['Mi panel', '#/inicio'], ['Mi asistencia']], title: 'Mi asistencia', desc: 'Tus registros de los últimos 20 días hábiles. Cada estado indica cómo se calculó.' }) + `
    <div class="card mb-4"><div class="card-body">
      <div class="stack-bar" role="img" aria-label="${segs.map(s => `${ST[s[0]].txt}: ${c[s[0]]}`).join(', ')}">${segs.map(s => `<span style="flex:${c[s[0]]};background:var(--color-${s[1]});color:var(--color-on-${s[1]})">${ST[s[0]].ico} ${c[s[0]]}</span>`).join('')}</div>
      <div class="legend">${segs.map(s => `<span>${ST[s[0]].ico} ${ST[s[0]].txt}: <b class="tnum">${c[s[0]]}</b></span>`).join('')}</div>
    </div></div>
    <div class="card mb-4" id="misSolicitudes"><div class="card-header"><h2>Mis solicitudes</h2><span class="small text-muted">RR. HH. las revisa antes del cierre de planilla</span></div>
      <div class="card-body py-2"><div id="msNotice" role="status" aria-live="polite"></div><div id="msBody"></div></div></div>
    <div class="filter-bar"><div class="fb-item"><label class="form-label" for="maSt">Estado</label><select id="maSt" class="form-select"><option value="">Todos</option>${Object.keys(ST).filter(k => k !== 'pendiente').map(k => `<option value="${k}">${ST[k].ico} ${ST[k].txt}</option>`).join('')}</select></div></div>
    <div class="table-card"><div class="table-scroll"><table class="table table-stack">
      <thead><tr><th scope="col">Fecha</th><th scope="col" class="num">Entrada</th><th scope="col" class="num">Salida</th><th scope="col">Estado</th><th scope="col" class="text-end">Justificación</th></tr></thead>
      <tbody id="maBody"></tbody></table></div><div id="maEmpty"></div></div>`,
    bind() {
      let newId = null;
      const drawReqs = () => {
        const mine = DB.justifs.filter(j => j.n === me.n);
        $('#msBody').innerHTML = mine.length ? `<ul class="list-plain">${mine.map(j => `
          <li class="row-line req-item${j.id === newId ? ' is-new' : ''}" id="req-${j.id}" tabindex="-1">
            <div class="min-w-0"><strong class="d-block">${j.id} · <span class="tnum">${j.fecha}</span> ${j.id === newId ? '<span class="tag ms-1">Nueva</span>' : ''}</strong>
              <span class="small text-muted">${esc(j.tipo)} · ${esc(j.motivo)}${j.adj ? ` · <i class="bi bi-paperclip" aria-hidden="true"></i> ${esc(j.adj)}` : ''}</span>
              ${j.estado === 'rechazada' ? '<span class="small text-muted d-block">El descuento se mantiene. Consulta a RR. HH. si tienes dudas.</span>' : ''}</div>
            <div class="d-flex flex-column align-items-end gap-1 flex-shrink-0">${justifBadge(j.estado)}${j.estado === 'pendiente' ? `<button type="button" class="btn btn-link btn-sm p-0 text-danger-sys" data-withdraw="${j.id}">Retirar solicitud</button>` : ''}</div></li>`).join('')}</ul>`
          : emptyState('inbox', 'Aún no tienes solicitudes', 'Cuando pidas una justificación, aquí verás si está pendiente, aprobada o rechazada.');
      };
      const draw = () => {
        const f = $('#maSt').value; const r = rows.filter(x => !f || x.st === f);
        $('#maBody').innerHTML = r.map(x => { const j = reqOf(x);
          return `<tr>
          <td class="td-main tnum" data-label="Fecha"><strong>${x.fecha}</strong> <span class="small text-muted">${x.d.toLocaleDateString('es-PE', { weekday: 'long' })}</span></td>
          <td class="num" data-label="Entrada">${x.in || '—'}</td><td class="num" data-label="Salida">${x.out || '—'}</td>
          <td data-label="Estado">${badge(x.st)}</td>
          <td class="text-end" data-label="Justificación">${j ? justifBadge(j.estado)
            : ['tardanza', 'inasistencia', 'salida'].includes(x.st) ? `<button class="btn btn-ghost btn-sm" data-req="${x.fecha}">Solicitar justificación</button>` : ''}</td></tr>`; }).join('');
        $('#maEmpty').innerHTML = r.length ? '' : emptyState('emoji-smile', `Sin registros de “${ST[f].txt}”`, 'No tienes registros con este estado en el periodo.');
      };
      $('#maSt').onchange = draw; draw(); drawReqs();
      $('#main').addEventListener('click', e => {
        if (e.target.closest('[data-notice-close]')) { $('#msNotice').innerHTML = ''; ($('#req-' + newId) || $('#misSolicitudes h2'))?.focus(); return; }
        const w = e.target.closest('[data-withdraw]');
        if (w) { const j = DB.justifs.find(x => x.id === w.dataset.withdraw);
          // N02: el docente puede retirar una solicitud enviada por error mientras siga pendiente
          confirmAction({ title: 'Retirar solicitud', tone: 'tardanza', audit: false, ok: 'Retirar solicitud', cancel: 'Mantener solicitud',
            msg: `Se retirará la solicitud ${j.id} del ${j.fecha}. RR. HH. ya no la verá y el registro volverá a su estado original (${j.tipo.toLowerCase()}). Podrás enviar una nueva si lo necesitas.`,
            onOk() {
              DB.justifs.splice(DB.justifs.indexOf(j), 1); if (newId === j.id) newId = null;
              draw(); drawReqs();
              $('#msNotice').innerHTML = `<div class="alert alert-sys-info submit-notice mt-2 mb-2"><span class="a-ico" aria-hidden="true">i</span><div class="flex-grow-1"><b>Solicitud ${j.id} retirada.</b> El registro del ${j.fecha} vuelve a mostrar "Solicitar justificación".</div><button type="button" class="btn-close btn-sm" aria-label="Cerrar aviso" data-notice-close></button></div>`;
              const again = $(`[data-req="${j.fecha}"]`); (again || $('#misSolicitudes h2'))?.focus();
            } });
          return; }
        const b = e.target.closest('[data-req]'); if (!b) return;
        const x = rows.find(r => r.fecha === b.dataset.req);
        if (!x || reqOf(x)) return; // ya existe una solicitud para este registro
        openForm({ title: `Solicitar justificación · ${x.fecha}`, submit: 'Enviar solicitud', auditNote: false, body: `
          <p class="mb-3">Registro: ${badge(x.st)}</p>
          ${field('sMot', 'Motivo' + REQ, `<select id="sMot" name="mot" class="form-select" required aria-describedby="sMotErr"><option value="">Selecciona…</option><option>Salud</option><option>Trámite oficial</option><option>Transporte / fuerza mayor</option><option>Otro</option></select>`, 'Selecciona un motivo.')}
          ${field('sDet', 'Explica brevemente' + REQ, `<textarea id="sDet" name="det" class="form-control" rows="3" required minlength="10" aria-describedby="sDetErr"></textarea>`, 'Escribe al menos 10 caracteres.')}
          ${field('sAdj', 'Adjuntar sustento (opcional)', `<input id="sAdj" name="adj" type="file" class="form-control" accept=".pdf,.jpg,.png" aria-describedby="sAdjHelp">`, '', 'PDF, JPG o PNG. Máx. 5 MB.')}`,
          onSubmit(d) {
            const id = 'J-' + (Math.max(...DB.justifs.map(j => +j.id.slice(2))) + 1);
            DB.justifs.unshift({ id, n: me.n, fecha: x.fecha, tipo: JTIPO[x.st], motivo: d.mot, det: d.det, adj: d.adj?.name || '', estado: 'pendiente' });
            newId = id; draw(); drawReqs();
            /* MV-12 · M-07: la confirmación queda en el área de trabajo, junto a la solicitud (no solo un toast en la esquina).
               Sin toast duplicado: misma regla que la marcación (MV-03 · P11). */
            $('#msNotice').innerHTML = `<div class="alert alert-sys-success submit-notice mt-2 mb-2"><span class="a-ico" aria-hidden="true">✓</span>
              <div class="flex-grow-1"><b>Solicitud ${id} enviada.</b> Quedó en estado <b>○ Pendiente de revisión</b>. RR. HH. la revisará antes del cierre de planilla y te avisaremos en <i class="bi bi-bell" aria-hidden="true"></i> Notificaciones.</div>
              <button type="button" class="btn-close btn-sm" aria-label="Cerrar confirmación" data-notice-close></button></div>`;
            $('#misSolicitudes').scrollIntoView({ block: 'start', behavior: 'smooth' });
            $('#req-' + id)?.focus({ preventScroll: true });
          } });
      });
    }
  };
};

V['#/mi-horario'] = () => ({
  html: pageHeader({ crumbs: [['Mi panel', '#/inicio'], ['Mi horario']], title: 'Mi horario', desc: 'Semana actual · Sede Norte. Los bloques rayados son reemplazos asignados.' }) + weekGrid(ME(), true),
  bind() {}
});

V['#/mis-pagos'] = () => {
  const me = ME(); const p = payroll(me);
  const months = [0, 1, 2, 3].map(i => { const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1); return d.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }); });
  return {
    html: pageHeader({ crumbs: [['Mi panel', '#/inicio'], ['Mis pagos']], title: 'Mis pagos', desc: 'Boletas y detalle de descuentos. Solo tú y RR. HH. pueden ver esta información.' }) + `
    <div class="row g-4">
      <div class="col-lg-5"><div class="card"><div class="card-header"><h2>${months[0].charAt(0).toUpperCase() + months[0].slice(1)}</h2><span class="tag">En curso</span></div><div class="card-body">
        <ul class="list-plain">
          <li class="row-line"><span>Remuneración básica</span><b class="tnum">${money(me.basico)}</b></li>
          <li class="row-line"><span>▲ Tardanzas (${p.c.tardanza || 0})</span><span class="tnum text-warning-sys">− ${money(p.tard)}</span></li>
          <li class="row-line"><span>✕ Inasistencias (${p.c.inasistencia || 0})</span><span class="tnum text-danger-sys">− ${money(p.falt)}</span></li>
          <li class="row-line"><span>AFP / ONP (13 %)</span><span class="tnum">− ${money(p.afp)}</span></li>
          <li class="row-line"><strong>Neto estimado</strong><strong class="tnum fs-5">${money(p.neto)}</strong></li>
        </ul>
        <p class="small text-muted mt-3 mb-0"><i class="bi bi-info-circle"></i> Monto estimado. Se confirma al cierre de planilla.</p>
      </div></div></div>
      <div class="col-lg-7"><div class="table-card"><table class="table table-stack">
        <thead><tr><th scope="col">Periodo</th><th scope="col" class="num">Neto</th><th scope="col">Estado</th><th scope="col" class="text-end"><span class="visually-hidden">Boleta</span></th></tr></thead>
        <tbody>${months.slice(1).map((m, i) => `<tr id="bol-${i}"><td class="td-main" data-label="Periodo"><strong>${m.charAt(0).toUpperCase() + m.slice(1)}</strong></td><td class="num" data-label="Neto">${money(me.basico - Math.max(0, p.tard - (i - 1) * 15) - p.falt - p.afp)}</td><td data-label="Estado"><span class="status-badge status-badge--puntual"><span class="sb-ico">✓</span>Pagado</span></td>
          <td class="text-end" data-label=""><button class="btn btn-outline-secondary btn-sm text-nowrap" data-bol="${i}" aria-label="Ver boleta de ${m}"><i class="bi bi-eye" aria-hidden="true"></i> Ver boleta</button></td></tr>`).join('')}</tbody></table></div></div>
    </div>`,
    bind() {
      /* MV-13 · M-10: la boleta se consulta en pantalla (vista previa) y se descarga solo si se necesita */
      $$('[data-bol]').forEach(b => b.onclick = () => {
        const i = +b.dataset.bol, m = months[i + 1], adj = (i - 1) * 15;
        const tard = Math.max(0, p.tard - adj), neto = me.basico - tard - p.falt - p.afp;
        const file = `boleta_${m.replace(/ de /g, '_').replace(/\s/g, '_')}.pdf`;
        const row = (k, v, cls = '') => `<tr><td>${k}</td><td class="num tnum ${cls}">${v}</td></tr>`;
        openDoc({
          title: `Boleta de ${m}`, sub: `${me.n} · ${me.id}`, file, opener: `[data-bol="${i}"]`,
          viewer: `<figure class="doc-page boleta" role="img" aria-label="Boleta de pago de ${m}: neto ${money(neto)}">
            <div class="doc-emisor">${esc(S.school.name)} · RUC 20481234567</div>
            <div class="doc-titulo">Boleta de pago · ${m.charAt(0).toUpperCase() + m.slice(1)}</div>
            <p class="mb-3">Trabajador: <strong>${esc(me.n)}</strong> · DNI ${me.dni}<br>Cargo: Docente de ${esc(me.area)} · ${esc(me.sede)}</p>
            <table class="boleta-tabla"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>
              ${row('Remuneración básica', money(me.basico))}
              ${row('▲ Descuento por tardanzas', '− ' + money(tard))}
              ${row('✕ Descuento por inasistencias', '− ' + money(p.falt))}
              ${row('AFP / ONP (13 %)', '− ' + money(p.afp))}
            </tbody><tfoot><tr><th>Neto pagado</th><th class="num tnum">${money(neto)}</th></tr></tfoot></table>
            <div class="doc-firma">Recursos Humanos</div>
          </figure>`,
          meta: [['Periodo', `${m.charAt(0).toUpperCase() + m.slice(1)}`], ['Estado', '<span class="status-badge status-badge--puntual"><span class="sb-ico" aria-hidden="true">✓</span>Pagado</span>'], ['Neto', `<strong class="tnum">${money(neto)}</strong>`], ['Formato', 'Documento PDF']]
        });
      });
    }
  };
};

V['#/perfil'] = () => {
  const u = S.user; const p = DB.people.find(x => x.dni === u.dni);
  return {
    html: pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Mi perfil']], title: 'Mi perfil' }) + `
    <div class="card" style="max-width:640px"><div class="card-body">
      <div class="d-flex gap-3 align-items-center mb-4"><span class="avatar avatar-lg">${initials(p.n)}</span><div><h2 class="mb-1">${esc(p.n)}</h2><p class="text-muted mb-0">${u.roleLabel}</p></div></div>
      <dl class="detail-list"><dt>DNI</dt><dd class="tnum">${p.dni}</dd><dt>Correo</dt><dd>${p.email}</dd><dt>Sede</dt><dd>${p.sede}</dd><dt>Área</dt><dd>${p.area}</dd></dl>
    </div></div>`,
    bind() {}
  };
};

/* ==========================================================================
   Router
   ========================================================================== */
let routeToken = 0;
function route() {
  if (!S.user) return;
  let h = location.hash || '#/inicio';
  if (!V[h]) { h = '#/inicio'; history.replaceState(null, '', h); }
  const main = $('#main');
  const allowed = allowedHrefs(S.user.role).includes(h);
  markActiveNav(); renderNotifs();   // MV-08: las notificaciones se recalculan con los datos actuales
  if (window.innerWidth < 992) setMobileOpen(false);
  bootstrap.Offcanvas.getInstance('#drawer')?.hide();

  // Clonar <main> elimina listeners delegados de la vista anterior
  const fresh = main.cloneNode(false); main.replaceWith(fresh);
  if (!allowed) {
    fresh.innerHTML = pageHeader({ crumbs: [['Inicio', '#/inicio'], ['Sin acceso']], title: 'Sin acceso' }) +
      `<div class="card">${emptyState('lock', 'Este módulo no está disponible para tu rol', 'Si necesitas acceso, solicítalo al área de RR. HH.', '<a class="btn btn-primary" href="#/inicio">Volver al inicio</a>')}</div>`;
    return;
  }
  const token = ++routeToken;
  const firstLoad = !fresh.dataset.loaded;
  fresh.innerHTML = skeleton();
  setTimeout(() => {
    if (token !== routeToken) return;
    const v = V[h]();
    fresh.innerHTML = `<div class="view-enter">${v.html}</div>`;
    fresh.dataset.loaded = 1;
    v.bind?.();
    bindGlobalActions(fresh);
    const h1 = $('h1', fresh);
    if (!firstLoad && h1) h1.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    // MV-08: al llegar desde una notificación, resaltar y enfocar el elemento al que se refiere
    const fl = S.flash && $(S.flash, fresh); S.flash = null;
    if (fl) { if (!fl.hasAttribute('tabindex')) fl.setAttribute('tabindex', '-1'); fl.classList.add('flash-target'); fl.scrollIntoView({ block: 'center', behavior: 'instant' }); fl.focus({ preventScroll: true }); setTimeout(() => fl.classList.remove('flash-target'), 2600); }
    document.title = `${h1 ? h1.textContent : 'Inicio'} · School HR`;
  }, 220);
}
/* AC-02 · WCAG 2.1.1: un contenedor que se desplaza debe poder recorrerse con teclado.
   Solo recibe tabindex si de verdad desborda (no se agregan paradas de Tab innecesarias). */
function a11yScrollRegions() {
  $$('.table-scroll, .wg-scroll').forEach(el => {
    const over = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    if (over) {
      if (el.getAttribute('tabindex') !== '0') {
        el.setAttribute('tabindex', '0'); el.setAttribute('role', 'region');
        const card = el.closest('.card, .table-card'), col = card?.parentElement;
        const head = card?.querySelector('.card-header h2') || col?.querySelector(':scope > .section-title h2') || card?.closest('[class*="col-"]')?.querySelector('.section-title h2');
        const name = (head || $('#main h1'))?.textContent.trim() || 'Contenido';
        el.setAttribute('aria-label', `${name} (tabla con desplazamiento)`);
      }
    } else if (el.getAttribute('tabindex') === '0') { el.removeAttribute('tabindex'); el.removeAttribute('role'); el.removeAttribute('aria-label'); }
  });
}
let a11yRaf = 0;
const a11yQueue = () => { cancelAnimationFrame(a11yRaf); a11yRaf = requestAnimationFrame(a11yScrollRegions); };
function bindGlobalActions(root) {
  $$('[data-action="new-person"]', root).forEach(b => b.onclick = () => personForm());
}

/* ==========================================================================
   Command menu (§21)
   ========================================================================== */
let cmdItems = [], cmdSel = 0;
function cmdSource() {
  const role = S.user.role;
  const mods = NAV[role].flatMap(i => i.children ? i.children.map(c => ({ label: `${i.label} › ${c.label}`, href: c.href })) : i.href ? [{ label: i.label, href: i.href, ico: i.ico }] : [])
    .map(m => ({ group: 'Módulos', ico: m.ico || 'folder2-open', label: m.label, hint: '', run: () => location.hash = m.href }));
  const actions = role === 'admin'
    ? [{ group: 'Acciones', ico: 'person-plus', label: 'Registrar docente', run: () => personForm() },
       { group: 'Acciones', ico: 'cash-stack', label: 'Cerrar planilla', run: () => location.hash = '#/planillas' }]
    : [{ group: 'Acciones', ico: 'box-arrow-in-right', label: 'Registrar entrada / salida', run: () => location.hash = '#/inicio' }];
  const people = role === 'admin' ? DB.people.map(p => ({ group: 'Personas', ico: 'person', label: p.n, hint: `${p.id} · DNI ${p.dni}`, key: `${p.n} ${p.dni} ${p.id}`, run: () => { location.hash = '#/personal/' + (p.tipo === 'Docente' ? 'docentes' : 'administrativos'); setTimeout(() => openPerson(p.id), 400); } })) : [];
  return [...people, ...mods, ...actions];
}
function cmdRender() {
  const q = $('#cmdkInput').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const src = cmdSource();
  cmdItems = (q ? src.filter(i => (i.key || i.label).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)) : src.filter(i => i.group !== 'Personas').concat(src.filter(i => i.group === 'Personas').slice(0, 4))).slice(0, 12);
  cmdSel = Math.min(cmdSel, Math.max(0, cmdItems.length - 1));
  let last = '';
  $('#cmdkList').innerHTML = cmdItems.length ? cmdItems.map((it, i) => {
    const g = it.group !== last ? `<li class="cmdk-group" role="presentation">${it.group}</li>` : ''; last = it.group;
    return g + `<li class="cmdk-item" role="option" id="cmd-${i}" data-i="${i}" aria-selected="${i === cmdSel}"><i class="bi bi-${it.ico}" aria-hidden="true"></i><span>${esc(it.label)}</span>${it.hint ? `<small class="tnum">${esc(it.hint)}</small>` : ''}</li>`;
  }).join('') : `<li class="p-4 text-center text-muted">Sin resultados para “${esc(q)}”. Prueba con un nombre, DNI o módulo.</li>`;
  $('#cmdkInput').setAttribute('aria-activedescendant', cmdItems.length ? 'cmd-' + cmdSel : '');
}
function cmdOpen() { if (!S.user) return; $('#cmdkInput').value = ''; cmdSel = 0; cmdRender(); bootstrap.Modal.getOrCreateInstance('#cmdk').show(); }
function cmdRun(i) { const it = cmdItems[i]; if (!it) return; bootstrap.Modal.getInstance('#cmdk').hide(); setTimeout(it.run, 150); }

/* ==========================================================================
   Red / offline (§30)
   ========================================================================== */
const isOnline = () => S.online && !S.forceOffline;
function updateNet() {
  const on = isOnline();
  $('#offlineBanner').hidden = on;
  const n = $('#netStatus'); n.classList.toggle('offline', !on); $('.net-text', n).textContent = on ? 'En línea' : 'Sin conexión';
  if (on && S.punch.queued) { S.punch.queued = false; toast('success', 'Marcación sincronizada', 'Tu registro pendiente se envió correctamente.'); }
}

/* ==========================================================================
   Sesión
   ========================================================================== */
/* MV-08 · P09: cada notificación es un enlace real a su pantalla, se calcula desde los datos
   (nada fijo como "15/09") y, al llegar, resalta el elemento al que se refiere (S.flash). */
const NOTIFS = {
  admin: () => {
    const k = DB.contracts.filter(c => contractState(c).k === 'porvencer').sort((a, b) => a.fin - b.fin)[0];
    const sinRepl = DB.replacements.filter(r => r.estado === 'pendiente').length;
    const j = DB.justifs.find(x => x.estado === 'pendiente');
    return [
      k && { id: 'n-contrato', ico: '▲', tone: 'warning', title: 'Contrato por vencer', sub: `${k.n} · ${contractState(k).txt.toLowerCase()}`, href: '#/contratos', dest: 'Contratos', flash: `#c-${k.id}` },
      sinRepl && { id: 'n-repl', ico: '⇄', tone: 'early', title: `${sinRepl} ${sinRepl === 1 ? 'clase' : 'clases'} sin reemplazo`, sub: 'Hoy · asigna un docente disponible', href: '#/reemplazos', dest: 'Reemplazos', flash: '#rPend > .card' },
      j && { id: 'n-justif', ico: '○', tone: 'neutral', title: 'Nueva justificación', sub: `${j.n} · ${j.tipo.toLowerCase()} del ${j.fecha.slice(0, 5)}`, href: '#/asistencia/justificaciones', dest: 'Justificaciones', flash: `#j-${j.id}`, pre: () => { S.jf = { doc: j.n, est: 'pendiente', desde: '', hasta: '' }; } }
    ].filter(Boolean);
  },
  docente: () => {
    const me = ME();
    const j = DB.justifs.filter(x => x.n === me.n && x.estado !== 'pendiente')[0];
    const bol = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    return [
      j && { id: 'n-justif-' + j.id, ico: j.estado === 'aprobada' ? '◆' : '✕', tone: j.estado === 'aprobada' ? 'info' : 'danger', title: `Justificación ${j.estado}`, sub: `${j.id} · ${j.tipo.toLowerCase()} del ${j.fecha.slice(0, 5)}`, href: '#/mi-asistencia', dest: 'Mi asistencia', flash: `#req-${j.id}` },
      { id: 'n-boleta', ico: 'i', tone: 'info', title: 'Boleta disponible', sub: bol.charAt(0).toUpperCase() + bol.slice(1), href: '#/mis-pagos', dest: 'Mis pagos', flash: '#bol-0' },
      { id: 'n-repl', ico: '⇄', tone: 'early', title: 'Reemplazo asignado', sub: 'Miércoles 09:15 · cubres una clase', href: '#/mi-horario', dest: 'Mi horario', flash: '.class-block.repl' }
    ].filter(Boolean);
  }
};
function renderNotifs() {
  const list = NOTIFS[S.user.role](); S.notifItems = list;
  S.notifRead = S.notifRead || new Set();
  const unread = list.filter(n => !S.notifRead.has(n.id)).length;
  $('#notifList').innerHTML = list.length ? list.map(n => `<a href="${n.href}" class="notif-item${S.notifRead.has(n.id) ? '' : ' is-unread'}" data-notif="${n.id}">
      <span class="ac-ico kpi-ico notif-ico" style="background:var(--color-${n.tone}-soft);color:var(--color-${n.tone}-text)" aria-hidden="true">${n.ico}</span>
      <span class="min-w-0 flex-grow-1"><strong class="small d-block">${esc(n.title)}${S.notifRead.has(n.id) ? '' : '<span class="visually-hidden"> (nueva)</span>'}</strong><span class="small text-muted d-block">${esc(n.sub)}</span>
        <span class="notif-dest">Ir a ${esc(n.dest)} <i class="bi bi-arrow-right" aria-hidden="true"></i></span></span>
      ${S.notifRead.has(n.id) ? '' : '<span class="notif-unread" aria-hidden="true"></span>'}</a>`).join('')
    : '<p class="small text-muted px-3 py-4 mb-0 text-center">No tienes notificaciones.</p>';
  $('#notifCount').hidden = !unread; $('#notifCount').textContent = unread;
  $('#notifBtn').setAttribute('aria-label', unread ? `Notificaciones, ${unread} ${unread === 1 ? 'nueva' : 'nuevas'}` : 'Notificaciones, sin nuevas');
  $('#markRead').disabled = !unread;
}
function login(role) {
  S.user = USERS[role];
  store.set('role', role);
  $('#login').hidden = true; $('#app').hidden = false;
  $('#uName').textContent = S.user.name; $('#uRole').textContent = S.user.short; $('#uChipSr').textContent = window.innerWidth < 576 ? `${S.user.name}, ${S.user.short}: menú de usuario` : ': menú de usuario'; $('#uAvatar').textContent = initials(S.user.name);
  $('#sbRole').textContent = S.user.roleLabel;
  $('#switchRole span').textContent = role === 'admin' ? 'Cambiar a vista Docente (demo)' : 'Cambiar a vista RR. HH. (demo)';
  S.notifRead = new Set(); renderNotifs();
  renderNav(); applyCollapsed();
  if (!location.hash || !allowedHrefs(role).includes(location.hash)) location.hash = '#/inicio'; else route();
}
function logout() {
  S.user = null; store.set('role', null);
  $('#app').hidden = true; $('#login').hidden = false;
  history.replaceState(null, '', location.pathname);
  $('#dni').value = ''; $('#pwd').value = ''; $('#loginError').hidden = true;
  $('#dni').focus();
}

/* ==========================================================================
   Init
   ========================================================================== */
function init() {
  applySchool();
  renderAppearanceMenu();
  mql.addEventListener('change', () => { if (S.look.mode === 'system') applyAppearance(); });
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'); if (m) setLook('mode', m.dataset.mode);
    const t = e.target.closest('[data-theme]'); if (t) setLook('theme', t.dataset.theme);
    const s = e.target.closest('[data-sb-style]'); if (s) setLook('sidebar', s.dataset.sbStyle);
    if (e.target.closest('[data-mode-toggle]')) setLook('mode', isDark() ? 'light' : 'dark');
    if (e.target.closest('[data-close-appearance]')) bootstrap.Dropdown.getInstance('#appearanceBtn')?.hide();
  });

  // Login
  $('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const dni = $('#dni'), pwd = $('#pwd');
    const okD = /^\d{8}$/.test(dni.value), okP = !!pwd.value;
    dni.classList.toggle('is-invalid', !okD); dni.setAttribute('aria-invalid', String(!okD));
    pwd.classList.toggle('is-invalid', !okP); pwd.setAttribute('aria-invalid', String(!okP));
    $('#loginError').hidden = true;
    if (!okD) return dni.focus(); if (!okP) return pwd.focus();
    const btn = $('#loginBtn'); btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Validando…';
    setTimeout(() => {
      btn.disabled = false; btn.textContent = 'Ingresar';
      const role = Object.keys(USERS).find(r => USERS[r].dni === dni.value);
      if (!role) { $('#loginError').hidden = false; dni.focus(); return; }
      login(role);
    }, 600);
  });
  $('#dni').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });
  $('#togglePwd').onclick = () => { const p = $('#pwd'); const show = p.type === 'password'; p.type = show ? 'text' : 'password'; $('#togglePwd').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña'); $('#togglePwd i').className = 'bi bi-eye' + (show ? '-slash' : ''); };
  $$('[data-demo]').forEach(b => b.onclick = () => login(b.dataset.demo));

  // Shell
  initHelp();
  new MutationObserver(a11yQueue).observe(document.getElementById('app'), { childList: true, subtree: true });
  addEventListener('resize', a11yQueue);
  $('#collapseBtn').onclick = toggleCollapsed;
  $('#menuBtn').onclick = () => setMobileOpen(true);
  $('#sbOverlay').onclick = () => setMobileOpen(false);
  $('#searchBtn').onclick = cmdOpen; $('#searchBtnMobile').onclick = cmdOpen;
  $('#logout').onclick = logout;
  $('#switchRole').onclick = () => { login(S.user.role === 'admin' ? 'docente' : 'admin'); location.hash = '#/inicio'; };
  $('#markRead').onclick = () => { S.notifItems.forEach(n => S.notifRead.add(n.id)); renderNotifs(); };
  $('#notifList').addEventListener('click', e => {
    const a = e.target.closest('[data-notif]'); if (!a) return;
    const n = S.notifItems.find(x => x.id === a.dataset.notif);
    S.notifRead.add(n.id); n.pre?.(); S.flash = n.flash || null;
    bootstrap.Dropdown.getOrCreateInstance('#notifBtn').hide();
    if (location.hash === n.href) { e.preventDefault(); route(); }   // misma pantalla: volver a dibujar para aplicar filtro/resaltado
    setTimeout(renderNotifs, 0);
  });
  $('#sbNav').addEventListener('click', e => { if (e.target.closest('a') && window.innerWidth < 992) setMobileOpen(false); });

  // Tooltip del sidebar en modo íconos (los grupos muestran el submenú flotante en su lugar)
  const tip = document.createElement('div');
  tip.className = 'sb-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  const showTip = e => {
    const it = e.target.closest?.('.sb-item[data-tip]');
    if (!it || !isCompact() || it.dataset.group) { tip.hidden = true; return; }
    const r = it.getBoundingClientRect();
    tip.textContent = it.dataset.tip; tip.style.top = (r.top + r.height / 2) + 'px'; tip.style.left = (r.right + 12) + 'px'; tip.hidden = false;
  };
  const hideTip = () => { tip.hidden = true; };
  $('#sidebar').addEventListener('mouseover', showTip);
  $('#sidebar').addEventListener('focusin', showTip);
  $('#sidebar').addEventListener('mouseleave', hideTip);
  $('#sidebar').addEventListener('focusout', hideTip);
  $('#sidebar').addEventListener('click', hideTip);

  // Submenú flotante (MV-02): se abre al pasar el cursor o con Enter/Espacio; Esc lo cierra y devuelve el foco
  $('#sidebar').addEventListener('mouseover', e => {
    if (!isCompact()) return;
    if (e.target.closest('#sbFlyout')) { clearTimeout(flyTimer); return; }
    const g = e.target.closest('.sb-item[data-group]');
    if (g) openFlyout(g);
    else if (e.target.closest('.sb-item')) closeFlyout();
  });
  $('#sidebar').addEventListener('mouseleave', () => { flyTimer = setTimeout(() => closeFlyout(), 250); });
  $('#sidebar').addEventListener('focusin', e => { if (flyBtn && !e.target.closest('#sbFlyout') && e.target !== flyBtn) closeFlyout(); });
  $('#sidebar').addEventListener('keydown', e => { if (e.key === 'Escape' && flyBtn) { e.stopPropagation(); closeFlyout(true); } });
  $('#sidebar').addEventListener('click', e => { if (e.target.closest('#sbFlyout a')) closeFlyout(); });
  document.addEventListener('click', e => { if (flyBtn && !e.target.closest('#sidebar')) closeFlyout(); });
  window.addEventListener('resize', () => { closeFlyout(); if (isDesktop() && $('#app').classList.contains('sb-open')) setMobileOpen(false); });

  // Command menu
  $('#cmdkInput').addEventListener('input', () => { cmdSel = 0; cmdRender(); });
  $('#cmdkInput').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); cmdSel = (cmdSel + 1) % Math.max(1, cmdItems.length); cmdRender(); $('#cmd-' + cmdSel)?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'ArrowUp') { e.preventDefault(); cmdSel = (cmdSel - 1 + cmdItems.length) % Math.max(1, cmdItems.length); cmdRender(); $('#cmd-' + cmdSel)?.scrollIntoView({ block: 'nearest' }); }
    if (e.key === 'Enter') { e.preventDefault(); cmdRun(cmdSel); }
  });
  $('#cmdkList').addEventListener('click', e => { const li = e.target.closest('[data-i]'); if (li) cmdRun(+li.dataset.i); });
  $('#cmdk').addEventListener('shown.bs.modal', () => $('#cmdkInput').focus());

  // Atajos
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdOpen(); }
    if (mod && e.key.toLowerCase() === 'b' && S.user && isDesktop()) { e.preventDefault(); toggleCollapsed(); }
    if (e.key === 'Escape' && $('#app').classList.contains('sb-open')) setMobileOpen(false);
  });

  // Red
  window.addEventListener('online', () => { S.online = true; updateNet(); });
  window.addEventListener('offline', () => { S.online = false; updateNet(); });
  updateNet();

  window.addEventListener('hashchange', route);

  const saved = store.get('role', null);
  if (saved && USERS[saved]) login(saved); else { $('#login').hidden = false; }
}
init();
})();
