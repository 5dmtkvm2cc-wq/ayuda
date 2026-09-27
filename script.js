// --- 1. CONFIGURACIÓN BASE ---
const horarioSemanal = {
    1: [{ id: "quimica_mon", nombre: "Química del Carbono", horas: "3:00 - 5:00 PM" }, { id: "arte_mon", nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" }, { id: "mate_mon", nombre: "Pensamiento Matemático", horas: "7:00 - 8:00 PM" }],
    2: [{ id: "inno_tue", nombre: "Innovación Tecnológica", horas: "2:00 - 5:00 PM" }, { id: "arte_tue", nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" }, { id: "lectura_tue", nombre: "Comprensión Lectora", horas: "7:00 - 8:00 PM" }],
    3: [{ id: "vocal_wed", nombre: "Técnica Vocal", horas: "2:00 - 5:00 PM" }, { id: "quimica_wed", nombre: "Química del Carbono", horas: "5:00 - 7:00 PM" }, { id: "ingles_wed", nombre: "Inglés Nivel 3", horas: "7:00 - 8:00 PM" }],
    4: [{ id: "tutoria_thu", nombre: "Tutoría", horas: "2:00 - 4:00 PM" }, { id: "lectura_thu", nombre: "Comprensión Lectora", horas: "4:00 - 6:00 PM" }, { id: "deporte_thu", nombre: "Deporte y Recreación", horas: "6:00 - 8:00 PM" }],
    5: [{ id: "mate_fri", nombre: "Pensamiento Matemático", horas: "3:00 - 5:00 PM" }, { id: "ingles_fri", nombre: "Inglés Nivel 3", horas: "6:00 - 8:00 PM" }]
};

let tareas = JSON.parse(localStorage.getItem('tareas_dashboard')) || [];
let recursos = JSON.parse(localStorage.getItem('recursos_dashboard')) || [];
let diaReal = new Date().getDay();
let diaSeleccionado = localStorage.getItem('modo_prueba_dia') !== null ? parseInt(localStorage.getItem('modo_prueba_dia')) : diaReal;
let filtroFechaCalendario = null; // Para filtrar al tocar el calendario
let tareaActivaPosponer = null;

// --- 2. INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('fecha-actual').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    cargarClima();
    cargarMateriasDeHoy();
    actualizarDashboard();
    comprobarReporteDominical();
    comprobarRecordatorios();
});

// --- 3. WIDGET CLIMA ---
async function cargarClima() {
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=21.01&longitude=-102.16&current_weather=true");
        const data = await res.json();
        const code = data.current_weather.weathercode;
        let estado = "🌤️";
        if (code >= 51 && code <= 67) estado = "🌧️";
        else if (code >= 80 && code <= 99) estado = "⛈️";
        else if (code >= 1 && code <= 3) estado = "☁️";
        document.getElementById("widget-clima").innerHTML = `📍 San Julián: <strong>${Math.round(data.current_weather.temperature)}°C</strong> | ${estado}`;
    } catch (e) { document.getElementById("widget-clima").innerHTML = "📍 San Julián: Clima no disponible"; }
}

// --- 4. RENDER MATERIAS Y FORMULARIO (CON FECHA) ---
function cargarMateriasDeHoy() {
    const contenedorHoy = document.getElementById("contenedor-materias-hoy");
    contenedorHoy.innerHTML = `
        <div class="selector-dias" style="margin-bottom:1rem;">
            <span style="font-size:0.85rem; color:#94a3b8;">📅 Vista: <strong>${["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][diaSeleccionado]}</strong></span>
            <select onchange="simularDia(this.value)">
                <option value="auto">Automático</option>
                <option value="1">Simular Lunes</option><option value="2">Simular Martes</option><option value="3">Simular Miércoles</option><option value="4">Simular Jueves</option><option value="5">Simular Viernes</option>
            </select>
        </div>`;

    const materias = horarioSemanal[diaSeleccionado] || [];
    if (materias.length === 0) { contenedorHoy.innerHTML += "<p>No hay clases registradas hoy.</p>"; return; }

    materias.forEach(m => {
        contenedorHoy.innerHTML += `
            <div class="materia-card">
                <h3>${m.nombre} <span style="font-size:0.8rem; font-weight:normal;">(🕒 ${m.horas})</span></h3>
                <div class="form-tarea" style="display:flex; gap:5px; margin-top:5px;">
                    <input type="text" id="input-${m.id}" placeholder="Nueva tarea..." style="flex:1;">
                    <input type="datetime-local" id="fecha-${m.id}">
                    <button onclick="agregarTarea('${m.nombre}', '${m.id}')">Guardar</button>
                </div>
            </div>`;
    });
}
function simularDia(v) { 
    if(v==="auto") { localStorage.removeItem('modo_prueba_dia'); diaSeleccionado = diaReal; }
    else { localStorage.setItem('modo_prueba_dia', v); diaSeleccionado = parseInt(v); }
    cargarMateriasDeHoy();
}

// --- 5. LÓGICA DE TAREAS Y SEMÁFORO INTELIGENTE ---
function agregarTarea(materia, id) {
    const texto = document.getElementById(`input-${id}`).value;
    const fechaInput = document.getElementById(`fecha-${id}`).value;
    if (!texto || !fechaInput) return alert("Agrega la tarea y la fecha de entrega.");

    tareas.push({ id: Date.now(), materia, texto, completada: false, fechaEntrega: fechaInput });
    guardarDatos();
    document.getElementById(`input-${id}`).value = "";
}

function calcularEstadoTarea(fechaISO) {
    const ahora = new Date();
    const fechaObj = new Date(fechaISO);
    const diffMs = fechaObj - ahora;
    const diffHoras = diffMs / (1000 * 60 * 60);
    const diffDias = Math.ceil(diffHoras / 24);

    if (diffHoras < 0) return { urgencia: "atrasada", texto: "⚠️ Atrasada", clase: "gris" };
    if (diffHoras <= 24) return { urgencia: 1, texto: "🔥 Vence Hoy / en horas", clase: "rojo" };
    if (diffHoras <= 48) return { urgencia: 1, texto: "⏰ Vence Mañana", clase: "rojo" };
    if (diffDias <= 4) return { urgencia: 2, texto: `⏳ Vence en ${diffDias} días`, clase: "amarillo" };
    return { urgencia: 3, texto: `📅 Vence en ${diffDias} días`, clase: "verde" };
}

function renderizarTareasGlobales() {
    const contenedor = document.getElementById("contenedor-tareas-globales");
    contenedor.innerHTML = "";
    
    // Filtrar por fecha si se hizo clic en el calendario
    let tareasMostrar = tareas;
    if (filtroFechaCalendario) {
        document.getElementById("filtro-fecha").textContent = `(Filtradas: ${filtroFechaCalendario})`;
        tareasMostrar = tareas.filter(t => t.fechaEntrega.startsWith(filtroFechaCalendario));
    } else {
        document.getElementById("filtro-fecha").textContent = "";
    }

    if (tareasMostrar.length === 0) return contenedor.innerHTML = "<p>Todo limpio. ✨</p>";

    // Ordenar: primero las urgentes, luego atrasadas, etc.
    tareasMostrar.sort((a, b) => new Date(a.fechaEntrega) - new Date(b.fechaEntrega));

    tareasMostrar.forEach(t => {
        const estado = calcularEstadoTarea(t.fechaEntrega);
        const formateada = new Date(t.fechaEntrega).toLocaleString('es-ES', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        
        contenedor.innerHTML += `
            <div class="tarea-item urgencia-${t.completada ? '3' : estado.urgencia} ${t.completada ? 'completada' : ''}">
                <div>
                    <span class="badge-materia">${t.materia}</span>
                    ${!t.completada ? `<span class="tiempo-restante ${estado.clase}">${estado.texto} (${formateada})</span>` : '<span class="tiempo-restante verde">✅ Entregada</span>'}
                </div>
                <p class="tarea-texto">${t.texto}</p>
                <div class="tarea-acciones">
                    <button onclick="toggleTarea(${t.id})">${t.completada ? '↩️ Deshacer' : '✅ Entregada'}</button>
                    ${!t.completada ? `<button onclick="abrirPosponer(${t.id}, '${t.texto.replace(/'/g, "\\'")}')">⏩ Posponer</button>` : ''}
                    <button class="btn-eliminar" onclick="eliminarTarea(${t.id})">🗑️</button>
                </div>
            </div>`;
    });
}
function toggleTarea(id) { tareas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t); guardarDatos(); }
function eliminarTarea(id) { tareas = tareas.filter(t => t.id !== id); guardarDatos(); }

// --- 6. POSPONER INTELIGENTE ---
function abrirPosponer(id, texto) {
    tareaActivaPosponer = id;
    document.getElementById("posponer-texto-tarea").textContent = texto;
    document.getElementById("modal-posponer").showModal();
}
function cerrarModalPosponer() { document.getElementById("modal-posponer").close(); }
function ejecutarPosponer(diasExtra) {
    const tarea = tareas.find(t => t.id === tareaActivaPosponer);
    let nuevaFecha;
    
    if (diasExtra === 'custom') {
        const customInput = document.getElementById("posponer-fecha-custom").value;
        if(!customInput) return alert("Selecciona una fecha");
        nuevaFecha = new Date(customInput);
    } else {
        nuevaFecha = new Date(tarea.fechaEntrega);
        nuevaFecha.setDate(nuevaFecha.getDate() + diasExtra);
    }
    
    // Ajustar para formato timezone local (evitar error de horas al convertir a string ISO)
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    tarea.fechaEntrega = new Date(nuevaFecha - tzoffset).toISOString().slice(0, 16);
    
    guardarDatos();
    cerrarModalPosponer();
}

// --- 7. CALENDARIO ESCOLAR ---
function renderizarCalendario() {
    const contenedor = document.getElementById("calendario-contenedor");
    const hoy = new Date();
    const mes = hoy.getMonth();
    const anio = hoy.getFullYear();
    
    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    
    // Ajuste porque JS domingo es 0, queremos que semana empiece en Lunes
    const offset = primerDia === 0 ? 6 : primerDia - 1; 

    let html = `
        <div style="text-align:center; font-weight:bold; margin-bottom:10px;">${hoy.toLocaleDateString('es-ES', {month:'long', year:'numeric'}).toUpperCase()}</div>
        <div class="calendario-header">
            <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>
        <div class="calendario-grid">`;
        
    for (let i = 0; i < offset; i++) html += `<div></div>`; // Espacios vacíos
    
    for (let i = 1; i <= diasEnMes; i++) {
        const fechaIteracion = `${anio}-${String(mes+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Buscar tareas para este día
        const tareasDia = tareas.filter(t => t.fechaEntrega.startsWith(fechaIteracion));
        let dotsHtml = '';
        
        tareasDia.forEach(t => {
            if (t.completada) dotsHtml += '<div class="dot entregada"></div>';
            else {
                const est = calcularEstadoTarea(t.fechaEntrega);
                dotsHtml += `<div class="dot ${est.urgencia === 1 ? 'urgente' : 'pendiente'}"></div>`;
            }
        });

        const esHoy = i === hoy.getDate() ? 'hoy' : '';
        html += `
            <div class="dia-cal ${esHoy}" onclick="filtrarPorCalendario('${fechaIteracion}')">
                <span class="dia-numero">${i}</span>
                <div class="indicadores-cal">${dotsHtml}</div>
            </div>`;
    }
    contenedor.innerHTML = html + "</div>";
}
function filtrarPorCalendario(fechaStr) {
    filtroFechaCalendario = filtroFechaCalendario === fechaStr ? null : fechaStr; // Toggle
    renderizarTareasGlobales();
}

// --- 8. SISTEMA DE PROGRESO Y ESTADÍSTICAS ---
function renderizarProgreso() {
    const statsGrid = document.getElementById("estadisticas-grid");
    
    const tareasPendientes = tareas.filter(t => !t.completada).length;
    const tareasHechas = tareas.filter(t => t.completada).length;
    const total = tareasPendientes + tareasHechas;
    const porcentaje = total === 0 ? 0 : Math.round((tareasHechas / total) * 100);
    
    document.getElementById("barra-progreso").style.width = porcentaje + "%";
    document.getElementById("barra-progreso").textContent = porcentaje + "%";

    const atrasadas = tareas.filter(t => !t.completada && calcularEstadoTarea(t.fechaEntrega).urgencia === "atrasada").length;

    // Materia con más pendientes
    const conteoMaterias = {};
    tareas.filter(t => !t.completada).forEach(t => conteoMaterias[t.materia] = (conteoMaterias[t.materia] || 0) + 1);
    const materiaCritica = Object.keys(conteoMaterias).sort((a,b) => conteoMaterias[b] - conteoMaterias[a])[0] || "Ninguna";

    statsGrid.innerHTML = `
        <div class="stat-box"><h4>${tareasHechas}</h4><p>Completadas</p></div>
        <div class="stat-box"><h4>${tareasPendientes}</h4><p>Pendientes</p></div>
        <div class="stat-box"><h4>${atrasadas}</h4><p>Atrasadas</p></div>
        <div class="stat-box"><h4>📊</h4><p>Top Focos Rojos: <strong>${materiaCritica}</strong></p></div>
    `;
}

// --- 9. REPORTE DOMINICAL Y RECORDATORIOS ---
function comprobarReporteDominical() {
    // Si es domingo y no hemos mostrado el reporte hoy (guardamos fecha en localstorage)
    const hoy = new Date();
    const fechaHoyStr = hoy.toLocaleDateString();
    
    if (hoy.getDay() === 0 && localStorage.getItem('ultimo_reporte') !== fechaHoyStr) {
        const hechas = tareas.filter(t => t.completada).length;
        const pendientes = tareas.filter(t => !t.completada).length;
        
        document.getElementById("reporte-contenido").innerHTML = `
            <p>¡Gran trabajo esta semana!</p>
            <ul>
                <li>✅ <strong>${hechas}</strong> Tareas completadas</li>
                <li>📝 <strong>${pendientes}</strong> Tareas por realizar</li>
            </ul>
            <p>Planifica bien tu lunes y disfruta tu domingo.</p>
        `;
        document.getElementById("modal-reporte").showModal();
        localStorage.setItem('ultimo_reporte', fechaHoyStr);
    }
}

function comprobarRecordatorios() {
    // Avisos simples al cargar para tareas < 24h
    const urgentes = tareas.filter(t => !t.completada && calcularEstadoTarea(t.fechaEntrega).urgencia === 1);
    if(urgentes.length > 0) {
        // Un pequeño timeout para que el usuario alcance a ver la pantalla antes de la alerta
        setTimeout(() => {
            alert(`🔔 RECORDATORIO: Tienes ${urgentes.length} tarea(s) que vencen en menos de 24 horas.`);
        }, 1500);
    }
}

// --- UTILIDADES ---
function guardarDatos() {
    localStorage.setItem('tareas_dashboard', JSON.stringify(tareas));
    actualizarDashboard();
}
function actualizarDashboard() {
    renderizarTareasGlobales();
    renderizarCalendario();
    renderizarProgreso();
}