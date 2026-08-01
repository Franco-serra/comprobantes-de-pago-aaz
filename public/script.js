let itemIdCounter = 0;
function addItemRow(desc='', qty=1, price=0){
  const id = 'item-' + (itemIdCounter++);
  const tr = document.createElement('tr');
  tr.dataset.id = id;
  tr.innerHTML = `
    <td><input type="text" class="i-desc" placeholder="Ej: Cuota mensual julio" value="${desc}"></td>
    <td class="qty"><input type="number" class="i-qty" min="0" step="1" value="${qty}"></td>
    <td class="price"><input type="number" class="i-price" min="0" step="0.01" value="${price}"></td>
    <td class="subtotal-cell"><span class="i-subtotal">$ 0,00</span></td>
    <td><button type="button" class="del-item" title="Quitar ítem">✕</button></td>
  `;
  document.getElementById('itemsBody').appendChild(tr);
  tr.querySelectorAll('input').forEach(inp => inp.addEventListener('input', render));
  tr.querySelector('.del-item').addEventListener('click', () => { tr.remove(); render(); });
  render();
}

document.getElementById('addItem').addEventListener('click', () => addItemRow());

function money(n){
  return '$ ' + (isNaN(n) ? 0 : n).toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function fmtFecha(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

let issuedNumero = null; // null = todavía no se emitió este recibo

function render(){
  // header / socio
  document.getElementById('prSocio').textContent = document.getElementById('socioNombre').value || '—';
  document.getElementById('prSocioNum').textContent = document.getElementById('socioNum').value || '—';
  document.getElementById('prFecha').textContent = fmtFecha(document.getElementById('fecha').value);
  document.getElementById('prMetodo').textContent = document.getElementById('metodo').value;
  document.getElementById('prNumero').textContent = issuedNumero ? ('N° ' + issuedNumero) : '—';
  const obs = document.getElementById('observaciones').value.trim();
  document.getElementById('prObs').textContent = obs;
  document.getElementById('prObsWrap').style.display = obs ? 'block' : 'none';

  const estado = document.getElementById('estado').value;
  const badge = document.getElementById('badgeEstado');
  badge.textContent = estado;
  badge.style.borderColor = estado === 'Pagado' ? '#2f7a4f' : (estado === 'Pendiente' ? '#b5432c' : '#c98a1f');
  badge.style.color = badge.style.borderColor;

  // items
  const rows = [...document.querySelectorAll('#itemsBody tr')];
  const prBody = document.getElementById('prItems');
  prBody.innerHTML = '';
  let total = 0;
  rows.forEach(tr => {
    const desc = tr.querySelector('.i-desc').value || 'Concepto';
    const qty = parseFloat(tr.querySelector('.i-qty').value) || 0;
    const price = parseFloat(tr.querySelector('.i-price').value) || 0;
    const sub = qty * price;
    total += sub;
    tr.querySelector('.i-subtotal').textContent = money(sub);

    const r = document.createElement('tr');
    r.innerHTML = `<td>${desc}</td><td class="num">${qty}</td><td class="num">${money(price)}</td><td class="num">${money(sub)}</td>`;
    prBody.appendChild(r);
  });
  document.getElementById('prTotal').textContent = money(total);
}

// listeners for meta fields
['fecha','metodo','estado','socioNombre','socioNum']
  .forEach(id => document.getElementById(id).addEventListener('input', render));
document.getElementById('estado').addEventListener('change', render);
document.getElementById('metodo').addEventListener('change', render);

// default date = today
document.getElementById('fecha').valueAsDate = new Date();

// seed with one item
addItemRow('Cuota mensual', 1, 0);
render();

// ---------- Autocompletado de socios ----------
let sociosCache = [];

async function cargarSocios(){
  try {
    const resp = await fetch('/api/socios');
    if (!resp.ok) throw new Error('No se pudo cargar el listado de socios.');
    sociosCache = await resp.json();
  } catch (e) {
    console.error(e);
    // Si falla (por ejemplo, sin conexión), el campo sigue funcionando
    // como texto libre; simplemente no va a sugerir nada.
  }
}
cargarSocios();

function normalizar(txt){
  return (txt || '').toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca acentos
    .toLowerCase().trim();
}

const inputSocio = document.getElementById('socioNombre');
const listaSugerencias = document.getElementById('socioSuggestions');
let activeIndex = -1;

function cerrarSugerencias(){
  listaSugerencias.classList.remove('open');
  listaSugerencias.innerHTML = '';
  activeIndex = -1;
}

function mostrarSugerencias(query){
  const q = normalizar(query);
  if (q.length < 2) { cerrarSugerencias(); return; }

  const matches = sociosCache
    .filter(s => normalizar(s.nombre).includes(q))
    .slice(0, 8);

  if (matches.length === 0) {
    listaSugerencias.innerHTML = '<div class="autocomplete-empty">Sin coincidencias — podés cargarlo igual como invitado</div>';
    listaSugerencias.classList.add('open');
    activeIndex = -1;
    return;
  }

  listaSugerencias.innerHTML = matches.map((s, i) =>
    `<div class="autocomplete-item" data-i="${i}" data-numero="${s.numero}" data-nombre="${s.nombre.replace(/"/g, '&quot;')}">
       <span>${s.nombre}</span><span class="ac-num">N° ${s.numero}</span>
     </div>`
  ).join('');
  listaSugerencias.classList.add('open');
  activeIndex = -1;

  listaSugerencias.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('mousedown', (e) => {
      e.preventDefault(); // evita perder el foco antes del click
      elegirSocio(el.dataset.nombre, el.dataset.numero);
    });
  });
}

function elegirSocio(nombre, numero){
  inputSocio.value = nombre;
  document.getElementById('socioNum').value = numero;
  cerrarSugerencias();
  render();
}

inputSocio.addEventListener('input', () => mostrarSugerencias(inputSocio.value));
inputSocio.addEventListener('focus', () => { if (inputSocio.value.trim().length >= 2) mostrarSugerencias(inputSocio.value); });
inputSocio.addEventListener('blur', () => setTimeout(cerrarSugerencias, 120));

inputSocio.addEventListener('keydown', (e) => {
  const items = [...listaSugerencias.querySelectorAll('.autocomplete-item')];
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, items.length - 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0) {
      e.preventDefault();
      const el = items[activeIndex];
      elegirSocio(el.dataset.nombre, el.dataset.numero);
    }
    return;
  } else if (e.key === 'Escape') {
    cerrarSugerencias();
    return;
  } else {
    return;
  }

  items.forEach(el => el.classList.remove('active'));
  items[activeIndex].classList.add('active');
  items[activeIndex].scrollIntoView({ block: 'nearest' });
});

// ---------- Emitir recibo (pide número al backend) + descargar PDF ----------
function collectItems(){
  return [...document.querySelectorAll('#itemsBody tr')].map(tr => {
    const descripcion = tr.querySelector('.i-desc').value || 'Concepto';
    const cantidad = parseFloat(tr.querySelector('.i-qty').value) || 0;
    const precio = parseFloat(tr.querySelector('.i-price').value) || 0;
    return { descripcion, cantidad, precio, subtotal: cantidad * precio };
  });
}

function currentTotal(items){
  return items.reduce((acc, it) => acc + it.subtotal, 0);
}

function setFormDisabled(disabled){
  document.querySelectorAll('.panel input, .panel select, .panel textarea, #addItem, .del-item')
    .forEach(el => el.disabled = disabled);
}

document.getElementById('downloadBtn').addEventListener('click', async () => {
  const socio = document.getElementById('socioNombre').value.trim();
  if (!socio) {
    alert('Ingresá el nombre del socio antes de emitir el recibo.');
    return;
  }

  const btn = document.getElementById('downloadBtn');
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Emitiendo recibo…';

  try {
    const items = collectItems();
    const total = currentTotal(items);

    // 1) Pedimos el número correlativo al servidor y guardamos el recibo.
    const resp = await fetch('/api/recibos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fecha: document.getElementById('fecha').value,
        estado: document.getElementById('estado').value,
        metodo: document.getElementById('metodo').value,
        socio,
        socioNum: document.getElementById('socioNum').value.trim(),
        items,
        total,
        observaciones: document.getElementById('observaciones').value.trim()
      })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'No se pudo registrar el recibo en el servidor.');
    }

    const data = await resp.json();
    issuedNumero = data.numeroFormateado;
    render();

    // 2) Generamos el PDF ya con el número asignado.
    btn.textContent = 'Generando PDF…';
    const shell = document.querySelector('.ticket-shell');
    const canvas = await html2canvas(shell, { scale: 3, backgroundColor: null });
    const imgData = canvas.toDataURL('image/png');

    const { jsPDF } = window.jspdf;
    const pxToMm = 25.4 / 96;
    const wMm = canvas.width * pxToMm / 3;
    const hMm = canvas.height * pxToMm / 3;

    const pdf = new jsPDF({
      orientation: wMm > hMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [wMm, hMm]
    });
    pdf.addImage(imgData, 'PNG', 0, 0, wMm, hMm);
    pdf.save(`recibo-${issuedNumero}-${socio.toLowerCase().replace(/\s+/g, '-')}.pdf`);

    // 3) Bloqueamos el formulario: este recibo ya quedó emitido y numerado.
    setFormDisabled(true);
    btn.style.display = 'none';
    document.getElementById('newReceiptBtn').style.display = 'block';

  } catch (e) {
    alert(e.message || 'Hubo un problema emitiendo el recibo. Probá de nuevo.');
    console.error(e);
    btn.disabled = false;
    btn.textContent = original;
  }
});

document.getElementById('newReceiptBtn').addEventListener('click', () => {
  issuedNumero = null;
  setFormDisabled(false);
  document.getElementById('socioNombre').value = '';
  document.getElementById('socioNum').value = '';
  document.getElementById('observaciones').value = '';
  document.getElementById('estado').value = 'Pagado';
  document.getElementById('metodo').value = 'Efectivo';
  document.getElementById('fecha').valueAsDate = new Date();
  document.getElementById('itemsBody').innerHTML = '';
  addItemRow('Cuota mensual', 1, 0);

  const btn = document.getElementById('downloadBtn');
  btn.style.display = 'block';
  btn.disabled = false;
  btn.textContent = '⬇ Emitir y descargar recibo';
  document.getElementById('newReceiptBtn').style.display = 'none';
  render();
});
