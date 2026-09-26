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

const opcionesFecha = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
document.getElementById('fecha-actual').textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);

const fechaHoy = new Date();
const numeroDia = fechaHoy.getDay();
const contenedorHoy = document.getElementById("contenedor-materias-hoy");
const contenedorTareasGlobales = document.getElementById("contenedor-tareas-globales");
const contenedorRecursosGlobales = document.getElementById("contenedor-recursos-globales");
const statsStrip = document.getElementById("stats-strip");

// 2. CLIMA (San Julián, Jalisco: 21.01, -102.16)
async function cargarClima(){
  const climaBox = document.getElementById("widget-clima");
  try{
    const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=21.01&longitude=-102.16&current_weather=true");
    const data = await res.json();
    const temp = Math.round(data.current_weather.temperature);
    const code = data.current_weather.weathercode;
    let estado = "🌤️ Despejado";
    if(code>=51 && code<=67) estado = "🌧️ Lluvia ligera";
    else if(code>=80 && code<=99) estado = "⛈️ Tormenta";
    else if(code>=1 && code<=3) estado = "☁️ Nublado";
    climaBox.innerHTML = `📍 San Julián: <strong>${temp}°C</strong> · ${estado}`;
  }catch(e){
    climaBox.innerHTML = "📍 San Julián: clima no disponible";
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

// 3. MATERIAS DE HOY
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

// 4. TAREAS
function agregarTarea(nombreMateria, materiaId){
  const input = document.getElementById(`input-${materiaId}`);
  const sel = document.getElementById(`urgencia-${materiaId}`);
  const texto = input.value.trim();
  if(!texto) return;
  tareas.push({ id:Date.now(), materia:nombreMateria, texto, urgencia:parseInt(sel.value), completada:false });
  guardarYActualizar();
  input.value = "";
}
function toggleTarea(id){
  tareas = tareas.map(t => t.id===id ? {...t, completada:!t.completada} : t);
  guardarYActualizar();
}
function posponerTarea(id){
  tareas = tareas.map(t => t.id===id ? {...t, urgencia: t.urgencia<3?t.urgencia+1:3, pospuesta:true} : t);
  guardarYActualizar();
}
function eliminarTarea(id){
  tareas = tareas.filter(t => t.id!==id);
  guardarYActualizar();
}

// 5. RECURSOS
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

// 6. RENDER
function renderizarStats(){
  const pendientes = tareas.filter(t=>!t.completada).length;
  const completadas = tareas.filter(t=>t.completada).length;
  const urgentes = tareas.filter(t=>!t.completada && t.urgencia===1).length;
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
  const ordenadas = [...tareas].sort((a,b)=> a.completada-b.completada || a.urgencia-b.urgencia);
  contenedorTareasGlobales.innerHTML = "";
  ordenadas.forEach(t=>{
    const item = document.createElement("div");
    item.className = `tarea-item urgencia-${t.urgencia} ${t.completada?'completada':''}`;
    item.innerHTML = `
      <div class="tarea-header">
        <span class="badge-materia">${t.materia}</span>
        <span>${t.pospuesta ? '⏳ Pospuesta' : ''}</span>
      </div>
      <p class="tarea-texto">${t.texto}</p>
      <div class="tarea-acciones">
        <button class="btn-check" onclick="toggleTarea(${t.id})">${t.completada?'↩️ Deshacer':'✅ Entregada'}</button>
        ${!t.completada?`<button class="btn-posponer" onclick="posponerTarea(${t.id})">⏩ Posponer</button>`:''}
        <button class="btn-eliminar" onclick="eliminarTarea(${t.id})">🗑️</button>
      </div>`;
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

function guardarYActualizar(){
  localStorage.setItem('tareas_dashboard', JSON.stringify(tareas));
  renderizarTareasGlobales();
  renderizarStats();
}

// 7. TABS MÓVIL
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('is-open'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('is-open');
  });
});

// INIT
cargarClima();
cargarMateriasDeHoy();
renderizarTareasGlobales();
renderizarRecursosGlobales();
renderizarStats();