// 1. HORARIO SEMANAL
const horarioSemanal = {
  1: [
    { id:"quimica_mon", nombre:"Química del Carbono", horas:"3:00 - 5:00 PM" },
    { id:"arte_mon", nombre:"El Mundo a través del Arte", horas:"5:00 - 7:00 PM" },
    { id:"mate_mon", nombre:"Pensamiento Matemático", horas:"7:00 - 8:00 PM" }
  ],
  2: [
    { id:"inno_tue", nombre:"Innovación Tecnológica y P.C.", horas:"2:00 - 5:00 PM" },
    { id:"arte_tue", nombre:"El Mundo a través del Arte", horas:"5:00 - 7:00 PM" },
    { id:"lectura_tue", nombre:"Comprensión Lectora", horas:"7:00 - 8:00 PM" }
  ],
  3: [
    { id:"vocal_wed", nombre:"Elementos de la Técnica Vocal", horas:"2:00 - 5:00 PM" },
    { id:"quimica_wed", nombre:"Química del Carbono", horas:"5:00 - 7:00 PM" },
    { id:"ingles_wed", nombre:"Inglés Nivel 3", horas:"7:00 - 8:00 PM" }
  ],
  4: [
    { id:"tutoria_thu", nombre:"Tutoría de Trayectoria", horas:"2:00 - 4:00 PM" },
    { id:"lectura_thu", nombre:"Comprensión Lectora", horas:"4:00 - 6:00 PM" },
    { id:"deporte_thu", nombre:"Deporte y Recreación", horas:"6:00 - 8:00 PM" }
  ],
  5: [
    { id:"mate_fri", nombre:"Pensamiento Matemático", horas:"3:00 - 5:00 PM" },
    { id:"ingles_fri", nombre:"Inglés Nivel 3", horas:"6:00 - 8:00 PM" }
  ]
};

let tareas = JSON.parse(localStorage.getItem('tareas_dashboard') || '[]');
let recursos = JSON.parse(localStorage.getItem('recursos_dashboard') || '[]');
let diaSeleccionado = null;       // "YYYY-MM-DD"
let posponerAbierto = null;       // id de tarea con el panel de posponer abierto
let calendarioFecha = new Date(); // mes que se muestra en el calendario

const opcionesFecha = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
document.getElementById('fecha-actual').textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);

const fechaHoy = new Date();
const numeroDia = fechaHoy.getDay();
const contenedorHoy = document.getElementById("contenedor-materias-hoy");
const contenedorTareasGlobales = document.getElementById("contenedor-tareas-globales");
const contenedorRecursosGlobales = document.getElementById("contenedor-recursos-globales");
const statsStrip = document.getElementById("stats-strip");

// ---------- CLIMA ----------
function descripcionClima(code){
  if(code>=95) return "⛈️ Tormenta eléctrica";
  if(code>=80 && code<=82) return "🌧️ Chubascos";
  if(code>=71 && code<=77) return "🌨️ Nieve";
  if(code>=61 && code<=67) return "🌧️ Lluvia";
  if(code>=51 && code<=57) return "🌦️ Llovizna";
  if(code===45 || code===48) return "🌫️ Niebla";
  if(code>=1 && code<=3) return "☁️ Nublado";
  return "🌤️ Despejado";
}
function esLluvia(code){ return (code>=51 && code<=82) || code>=95; }

async function cargarClima(){
  const climaBox = document.getElementById("widget-clima");
  const alertaBox = document.getElementById("lluvia-alerta");
  try{
    const url = "https://api.open-meteo.com/v1/forecast?latitude=21.01&longitude=-102.16"
      + "&hourly=temperature_2m,apparent_temperature,precipitation_probability,weathercode"
      + "&timezone=auto&forecast_days=2";
    const res = await fetch(url);
    const data = await res.json();
    const horas = data.hourly.time;
    const ahoraISO = new Date().toISOString().slice(0,13);
    let idxAhora = horas.findIndex(h => h.slice(0,13) === ahoraISO);
    if(idxAhora === -1) idxAhora = 0;

    const temp = Math.round(data.hourly.temperature_2m[idxAhora]);
    const sensacion = Math.round(data.hourly.apparent_temperature[idxAhora]);
    const codeAhora = data.hourly.weathercode[idxAhora];
    climaBox.innerHTML = `📍 San Julián: <strong>${temp}°C</strong> · sensación ${sensacion}°C · ${descripcionClima(codeAhora)}`;

    const ventana = 12;
    let horaLluvia = -1, probLluvia = 0;
    for(let i = idxAhora; i < idxAhora + ventana && i < horas.length; i++){
      if(data.hourly.precipitation_probability[i] >= 40){
        horaLluvia = i; probLluvia = data.hourly.precipitation_probability[i];
        break;
      }
    }
    if(esLluvia(codeAhora)){
      alertaBox.className = "lluvia-alerta activa";
      alertaBox.innerHTML = `🌧️ Está lloviendo ahora mismo en San Julián.`;
    } else if(horaLluvia !== -1){
      const hora = new Date(horas[horaLluvia]).toLocaleTimeString('es-ES', {hour:'numeric', minute:'2-digit'});
      const enCuantasHoras = horaLluvia - idxAhora;
      const cuando = enCuantasHoras <= 1 ? "en la próxima hora" : `en ~${enCuantasHoras} horas`;
      alertaBox.className = "lluvia-alerta activa";
      alertaBox.innerHTML = `🌂 Lloverá ${cuando}, cerca de las <strong>${hora}</strong> (${probLluvia}% de probabilidad).`;
    } else {
      alertaBox.className = "lluvia-alerta";
      alertaBox.innerHTML = `☀️ Sin lluvia prevista en las próximas ${ventana} horas.`;
    }
  }catch(e){
    climaBox.innerHTML = "📍 San Julián: clima no disponible";
    alertaBox.className = "lluvia-alerta";
    alertaBox.innerHTML = "No se pudo consultar el pronóstico de lluvia.";
  }
}

function horaActualEnRango(horas){
  const [ini,fin] = horas.split(" - ");
  const parse = s => {
    const [h,m] = s.replace(/AM|PM/,'').trim().split(':').map(Number);
    let hh = h % 12; if(/PM/.test(s)) hh += 12;
    return hh*60+m;
  };
  const ahora = fechaHoy.getHours()*60+fechaHoy.getMinutes();
  return ahora >= parse(ini) && ahora <= parse(fin);
}

// ---------- MATERIAS DE HOY ----------
function cargarMateriasDeHoy(){
  if(numeroDia === 0 || numeroDia === 6){
    contenedorHoy.innerHTML = "<p class='mensaje-vacio'>Fin de semana — sin clases hoy. 🎉</p>";
    return;
  }
  const materiasDeHoy = horarioSemanal[numeroDia] || [];
  contenedorHoy.innerHTML = "";
  materiasDeHoy.forEach(materia=>{
    const enCurso = horaActualEnRango(materia.horas);
    const tarjeta = document.createElement("div");
    tarjeta.className = "materia-card" + (enCurso ? " now" : "");
    tarjeta.innerHTML = `
      <h3>${materia.nombre}</h3>
      <p class="hora">🕒 ${materia.horas}</p>
      <div class="form-tarea">
        <input type="text" id="input-${materia.id}" placeholder="Añadir tarea…">
        <input type="datetime-local" id="fecha-${materia.id}" title="Fecha y hora de entrega (opcional)">
        <select id="urgencia-${materia.id}">
          <option value="1">🔴 Urgente</option>
          <option value="2" selected>🟡 Media</option>
          <option value="3">🟢 Baja</option>
        </select>
        <button class="btn" onclick="agregarTarea('${materia.nombre}','${materia.id}')">Guardar</button>
      </div>
      <div class="form-recurso">
        <input type="text" id="rec-titulo-${materia.id}" placeholder="Nombre del recurso…">
        <input type="url" id="rec-url-${materia.id}" placeholder="https://…">
        <button class="btn ghost" onclick="agregarRecurso('${materia.nombre}','${materia.id}')">📎 Link</button>
      </div>`;
    contenedorHoy.appendChild(tarjeta);
  });
}

// ---------- SEMÁFORO / DÍAS RESTANTES ----------
// Si la tarea tiene fecha de entrega, la urgencia se calcula sola.
// Si no tiene fecha, se respeta el nivel elegido a mano.
function calcularEstado(t){
  if(!t.fecha) return { nivel: t.urgencia, etiqueta: null };
  const ahora = new Date();
  const limite = new Date(t.fecha);
  const diffH = (limite - ahora) / 3600000;
  const mismaFechaCal = limite.toDateString() === ahora.toDateString();
  if(diffH < 0) return { nivel:1, etiqueta:"⏰ Atrasada" };
  if(mismaFechaCal) return { nivel:1, etiqueta:"🔴 Vence hoy" };
  const diffDias = Math.ceil(diffH/24);
  if(diffDias === 1) return { nivel:1, etiqueta:"🟠 Entrega mañana" };
  if(diffDias <= 3) return { nivel:2, etiqueta:`🟡 Entrega en ${diffDias} días` };
  return { nivel:3, etiqueta:`🟢 Entrega en ${diffDias} días` };
}

// ---------- TAREAS ----------
function agregarTarea(nombreMateria, materiaId){
  const input = document.getElementById(`input-${materiaId}`);
  const fechaInput = document.getElementById(`fecha-${materiaId}`);
  const sel = document.getElementById(`urgencia-${materiaId}`);
  const texto = input.value.trim();
  if(!texto) return;
  tareas.push({
    id:Date.now(), materia:nombreMateria, texto,
    fecha: fechaInput.value || null,
    urgencia:parseInt(sel.value), completada:false, completadaEn:null, pospuesta:false
  });
  guardarYActualizar();
  input.value = ""; fechaInput.value = "";
}
function toggleTarea(id){
  tareas = tareas.map(t => t.id===id
    ? {...t, completada:!t.completada, completadaEn: !t.completada ? new Date().toISOString() : null}
    : t);
  guardarYActualizar();
}
function eliminarTarea(id){
  tareas = tareas.filter(t => t.id!==id);
  guardarYActualizar();
}

// Posponer inteligente: revela opciones rápidas en vez de solo subir un nivel
function abrirPosponer(id){
  posponerAbierto = (posponerAbierto === id) ? null : id;
  renderizarTareasGlobales();
}
function posponerA(id, offsetDias){
  const nueva = new Date();
  nueva.setDate(nueva.getDate() + offsetDias);
  aplicarNuevaFecha(id, nueva.toISOString().slice(0,16));
}
function posponerFechaManual(id){
  const input = document.getElementById(`posponer-fecha-${id}`);
  if(input && input.value) aplicarNuevaFecha(id, input.value + "T20:00");
}
function aplicarNuevaFecha(id, nuevaFechaISO){
  tareas = tareas.map(t => t.id===id ? {...t, fecha:nuevaFechaISO, pospuesta:true} : t);
  posponerAbierto = null;
  guardarYActualizar();
}

// ---------- RECURSOS ----------
function agregarRecurso(nombreMateria, materiaId){
  const inputTitulo = document.getElementById(`rec-titulo-${materiaId}`);
  const inputUrl = document.getElementById(`rec-url-${materiaId}`);
  const titulo = inputTitulo.value.trim();
  let url = inputUrl.value.trim();
  if(!titulo || !url) return;
  if(!/^https?:\/\//.test(url)) url = "https://" + url;
  recursos.push({ id:Date.now(), materia:nombreMateria, titulo, url });
  localStorage.setItem('recursos_dashboard', JSON.stringify(recursos));
  renderizarRecursosGlobales();
  inputTitulo.value = ""; inputUrl.value = "";
}
function eliminarRecurso(id){
  recursos = recursos.filter(r => r.id!==id);
  localStorage.setItem('recursos_dashboard', JSON.stringify(recursos));
  renderizarRecursosGlobales();
}

// ---------- RECORDATORIOS (al abrir la página) ----------
function revisarRecordatorios(){
  const cont = document.getElementById('recordatorios');
  const ahora = new Date();
  const avisos = [];
  tareas.filter(t=>!t.completada && t.fecha).forEach(t=>{
    const diffH = (new Date(t.fecha) - ahora)/3600000;
    if(diffH > 0 && diffH <= 3) avisos.push(`⏳ <strong>${t.texto}</strong> (${t.materia}) vence en menos de 3 horas.`);
    else if(diffH > 3 && diffH <= 24) avisos.push(`🔔 <strong>${t.texto}</strong> (${t.materia}) vence en menos de 24 horas.`);
  });
  cont.innerHTML = avisos.map(a=>`<div class="recordatorio-item">${a}</div>`).join('');
}

// ---------- RENDER: STATS, TAREAS, RECURSOS ----------
function renderizarStats(){
  const pendientes = tareas.filter(t=>!t.completada).length;
  const completadas = tareas.filter(t=>t.completada).length;
  const urgentes = tareas.filter(t=>!t.completada && calcularEstado(t).nivel===1).length;
  statsStrip.innerHTML = `
    <div class="stat-card"><div class="n">${pendientes}</div><div class="l">Tareas pendientes</div></div>
    <div class="stat-card u1"><div class="n">${urgentes}</div><div class="l">Urgentes ahora</div></div>
    <div class="stat-card u3"><div class="n">${completadas}</div><div class="l">Entregadas</div></div>
    <div class="stat-card"><div class="n">${recursos.length}</div><div class="l">Enlaces guardados</div></div>`;
}

function renderizarTareasGlobales(){
  if(tareas.length===0){
    contenedorTareasGlobales.innerHTML = "<p class='mensaje-vacio'>No tienes tareas pendientes. Todo al día ✨</p>";
    return;
  }
  const conEstado = tareas.map(t => ({...t, _estado: calcularEstado(t)}));
  conEstado.sort((a,b)=> a.completada-b.completada || a._estado.nivel-b._estado.nivel);
  contenedorTareasGlobales.innerHTML = "";
  conEstado.forEach(t=>{
    const item = document.createElement("div");
    item.className = `tarea-item urgencia-${t._estado.nivel} ${t.completada?'completada':''}`;
    const fechaTxt = t.fecha ? new Date(t.fecha).toLocaleString('es-ES',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}) : '';
    item.innerHTML = `
      <div class="tarea-header">
        <span class="badge-materia">${t.materia}</span>
        ${t._estado.etiqueta ? `<span class="badge-dias n${t._estado.nivel}">${t._estado.etiqueta}</span>` : ''}
      </div>
      <p class="tarea-texto">${t.texto}${fechaTxt ? ` <span style="color:var(--ink-faint);font-weight:400">· ${fechaTxt}</span>` : ''}</p>
      <div class="tarea-acciones">
        <button class="btn-check" onclick="toggleTarea(${t.id})">${t.completada?'↩️ Deshacer':'✅ Entregada'}</button>
        ${!t.completada?`<button class="btn-posponer" onclick="abrirPosponer(${t.id})">⏩ Posponer</button>`:''}
        <button class="btn-eliminar" onclick="eliminarTarea(${t.id})">🗑️</button>
      </div>
      ${posponerAbierto===t.id ? `
        <div class="posponer-panel">
          <button class="btn ghost" onclick="posponerA(${t.id},1)">Mañana</button>
          <button class="btn ghost" onclick="posponerA(${t.id},2)">Pasado mañana</button>
          <input type="date" id="posponer-fecha-${t.id}">
          <button class="btn" onclick="posponerFechaManual(${t.id})">Confirmar</button>
        </div>` : ''}`;
    contenedorTareasGlobales.appendChild(item);
  });
}

function renderizarRecursosGlobales(){
  if(recursos.length===0){
    contenedorRecursosGlobales.innerHTML = "<p class='mensaje-vacio'>Aún no hay enlaces guardados.</p>";
    return;
  }
  contenedorRecursosGlobales.innerHTML = "";
  recursos.forEach(r=>{
    const item = document.createElement("div");
    item.className = "recurso-item";
    item.innerHTML = `
      <div><span class="badge-materia">${r.materia}</span>
      <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="recurso-link">🔗 ${r.titulo}</a></div>
      <button onclick="eliminarRecurso(${r.id})">🗑️</button>`;
    contenedorRecursosGlobales.appendChild(item);
  });
}

// ---------- CALENDARIO ----------
function cambiarMes(delta){
  calendarioFecha.setMonth(calendarioFecha.getMonth()+delta);
  diaSeleccionado = null;
  renderizarCalendario();
}
function tareasDelDia(fechaStr){
  return tareas.filter(t => t.fecha && t.fecha.slice(0,10) === fechaStr);
}
function renderizarCalendario(){
  const year = calendarioFecha.getFullYear(), month = calendarioFecha.getMonth();
  const nombreMes = calendarioFecha.toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  document.getElementById('cal-mes-label').textContent = nombreMes.charAt(0).toUpperCase()+nombreMes.slice(1);

  const primerDia = new Date(year, month, 1);
  const offset = (primerDia.getDay()+6)%7; // lunes=0
  const diasEnMes = new Date(year, month+1, 0).getDate();
  const hoyStr = new Date().toISOString().slice(0,10);

  const grid = document.getElementById('calendario-grid');
  grid.innerHTML = "";
  for(let i=0;i<offset;i++){
    const vacio = document.createElement('div');
    vacio.className = 'cal-dia vacio';
    grid.appendChild(vacio);
  }
  for(let d=1; d<=diasEnMes; d++){
    const fechaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const tds = tareasDelDia(fechaStr);
    const urgente = tds.some(t=>!t.completada && calcularEstado(t).nivel===1);
    const pendiente = tds.some(t=>!t.completada && calcularEstado(t).nivel!==1);
    const entregada = tds.some(t=>t.completada);

    const celda = document.createElement('div');
    celda.className = 'cal-dia' + (fechaStr===hoyStr?' hoy':'') + (fechaStr===diaSeleccionado?' seleccionado':'');
    celda.onclick = ()=>{ diaSeleccionado = fechaStr; renderizarCalendario(); };
    celda.innerHTML = `<span>${d}</span><span class="dots">
      ${urgente?'<span style="background:var(--u1)"></span>':''}
      ${pendiente?'<span style="background:var(--u2)"></span>':''}
      ${entregada?'<span style="background:var(--u3)"></span>':''}
    </span>`;
    grid.appendChild(celda);
  }
  renderizarDetalleDia();
}
function renderizarDetalleDia(){
  const cont = document.getElementById('calendario-dia-detalle');
  if(!diaSeleccionado){ cont.innerHTML = "<p class='mensaje-vacio'>Toca un día para ver sus tareas.</p>"; return; }
  const tds = tareasDelDia(diaSeleccionado);
  const fechaBonita = new Date(diaSeleccionado+'T12:00').toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  if(tds.length===0){ cont.innerHTML = `<p class='mensaje-vacio'>Sin tareas para ${fechaBonita}.</p>`; return; }
  cont.innerHTML = `<p style="font-size:.82rem;color:var(--ink-dim);margin-bottom:.5rem;text-transform:capitalize">${fechaBonita}</p>`
    + tds.map(t=>`<p style="font-size:.88rem;margin-bottom:.3rem">${t.completada?'✅':'⬜'} <strong>${t.materia}:</strong> ${t.texto}</p>`).join('');
}

// ---------- PROGRESO Y REPORTE SEMANAL ----------
function rangoSemanaActual(){
  const hoy = new Date();
  const diaSemana = (hoy.getDay()+6)%7; // lunes=0
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate()-diaSemana); lunes.setHours(0,0,0,0);
  const domingo = new Date(lunes); domingo.setDate(lunes.getDate()+6); domingo.setHours(23,59,59,999);
  return {lunes, domingo};
}
function renderizarProgreso(){
  const {lunes, domingo} = rangoSemanaActual();
  const tareasSemana = tareas.filter(t => t.fecha && new Date(t.fecha) >= lunes && new Date(t.fecha) <= domingo);
  const completadasSemana = tareasSemana.filter(t=>t.completada);
  const total = tareasSemana.length;
  const pct = total>0 ? Math.round(completadasSemana.length/total*100) : 100;

  document.getElementById('progreso-fill').style.width = pct+'%';
  document.getElementById('progreso-texto').textContent =
    total>0 ? `${completadasSemana.length} de ${total} tareas de esta semana completadas (${pct}%)`
             : 'No tienes tareas con fecha esta semana.';

  const atrasadas = tareas.filter(t=>!t.completada && t.fecha && new Date(t.fecha) < new Date()).length;
  const conteoPorMateria = {};
  tareas.forEach(t=>{
    conteoPorMateria[t.materia] = conteoPorMateria[t.materia] || {pend:0, ok:0};
    if(t.completada) conteoPorMateria[t.materia].ok++; else conteoPorMateria[t.materia].pend++;
  });
  const materias = Object.keys(conteoPorMateria);
  const materiaMasPend = materias.sort((a,b)=>conteoPorMateria[b].pend-conteoPorMateria[a].pend)[0];
  const materiaMasOk = materias.sort((a,b)=>conteoPorMateria[b].ok-conteoPorMateria[a].ok)[0];

  document.getElementById('progreso-stats').innerHTML = `
    <div class="stat-card u1"><div class="n">${atrasadas}</div><div class="l">Tareas atrasadas</div></div>
    <div class="stat-card"><div class="n" style="font-size:1rem">${materiaMasPend||'—'}</div><div class="l">Con más pendientes</div></div>
    <div class="stat-card u3"><div class="n" style="font-size:1rem">${materiaMasOk||'—'}</div><div class="l">Con más entregadas</div></div>`;

  const entregadasTarde = completadasSemana.filter(t => t.completadaEn && new Date(t.completadaEn) > new Date(t.fecha)).length;
  const pendientesRestantes = total - completadasSemana.length;
  document.getElementById('reporte-semanal').innerHTML = `
    <p>Esta semana completaste <strong>${completadasSemana.length}</strong> tarea(s).</p>
    <p><strong>${pendientesRestantes}</strong> siguen pendientes de esta semana.</p>
    <p><strong>${entregadasTarde}</strong> se entregaron después de su fecha límite.</p>`;
}

function guardarYActualizar(){
  localStorage.setItem('tareas_dashboard', JSON.stringify(tareas));
  renderizarTareasGlobales();
  renderizarStats();
  renderizarCalendario();
  renderizarProgreso();
  revisarRecordatorios();
}

// ---------- TABS MÓVIL ----------
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('is-open'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('is-open');
  });
});

// ---------- INIT ----------
cargarClima();
cargarMateriasDeHoy();
renderizarTareasGlobales();
renderizarRecursosGlobales();
renderizarStats();
renderizarCalendario();
renderizarProgreso();
revisarRecordatorios();