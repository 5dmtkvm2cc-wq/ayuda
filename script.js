// 1. DICCIONARIO DE TU HORARIO
const horarioSemanal = {
    1: [
        { id: "quimica_mon", nombre: "Química del Carbono", horas: "3:00 - 5:00 PM" },
        { id: "arte_mon", nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" },
        { id: "mate_mon", nombre: "Pensamiento Matemático", horas: "7:00 - 8:00 PM" }
    ],
    2: [
        { id: "inno_tue", nombre: "Innovación Tecnológica y P.C.", horas: "2:00 - 5:00 PM" },
        { id: "arte_tue", nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" },
        { id: "lectura_tue", nombre: "Comprensión Lectora", horas: "7:00 - 8:00 PM" }
    ],
    3: [
        { id: "vocal_wed", nombre: "Elementos de la Técnica Vocal", horas: "2:00 - 5:00 PM" },
        { id: "quimica_wed", nombre: "Química del Carbono", horas: "5:00 - 7:00 PM" },
        { id: "ingles_wed", nombre: "Inglés Nivel 3", horas: "7:00 - 8:00 PM" }
    ],
    4: [
        { id: "tutoria_thu", nombre: "Tutoría de Trayectoria", horas: "2:00 - 4:00 PM" },
        { id: "lectura_thu", nombre: "Comprensión Lectora", horas: "4:00 - 6:00 PM" },
        { id: "deporte_thu", nombre: "Deporte y Recreación", horas: "6:00 - 8:00 PM" }
    ],
    5: [
        { id: "mate_fri", nombre: "Pensamiento Matemático", horas: "3:00 - 5:00 PM" },
        { id: "ingles_fri", nombre: "Inglés Nivel 3", horas: "6:00 - 8:00 PM" }
    ]
};

// 2. RECUPERAR DATOS DE LOCALSTORAGE
let tareas = JSON.parse(localStorage.getItem('tareas_dashboard')) || [];
let recursos = JSON.parse(localStorage.getItem('recursos_dashboard')) || [];

// ENCABEZADO Y FECHA
const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('fecha-actual').textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);

const fechaHoy = new Date();
const numeroDia = fechaHoy.getDay();
const contenedorHoy = document.getElementById("contenedor-materias-hoy");
const contenedorTareasGlobales = document.getElementById("contenedor-tareas-globales");
const contenedorRecursosGlobales = document.getElementById("contenedor-recursos-globales");

// 3. WIDGET DE CLIMA EN TIEMPO REAL (SAN JULIÁN, JALISCO: Lat 21.01, Lon -102.16)
async function cargarClima() {
    const climaBox = document.getElementById("widget-clima");
    try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=21.01&longitude=-102.16&current_weather=true");
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;

        // Interpretación rápida del código de clima
        let estado = "🌤️ Despejado / Templado";
        if (code >= 51 && code <= 67) estado = "🌧️ Lluvia ligera";
        else if (code >= 80 && code <= 99) estado = "⛈️ Tormenta / Lluvia fuerte";
        else if (code >= 1 && code <= 3) estado = "☁️ Nublado";

        climaBox.innerHTML = `📍 San Julián: <strong>${temp}°C</strong> | ${estado}`;
    } catch (error) {
        climaBox.innerHTML = "📍 San Julián: 🌤️ Clima no disponible";
    }
}

// 4. RENDERIZAR MATERIAS DE HOY
function cargarMateriasDeHoy() {
    if (numeroDia === 0 || numeroDia === 6) {
        contenedorHoy.innerHTML = "<p class='mensaje-vacio'>¡Es fin de semana! No hay clases hoy. 🎉</p>";
        return;
    }

    const materiasDeHoy = horarioSemanal[numeroDia];
    contenedorHoy.innerHTML = "";

    materiasDeHoy.forEach(materia => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "materia-card";
        tarjeta.innerHTML = `
            <div class="materia-info">
                <h3>${materia.nombre}</h3>
                <p>🕒 ${materia.horas}</p>
            </div>
            
            <div class="form-tarea">
                <input type="text" id="input-${materia.id}" placeholder="Añadir tarea..." />
                <select id="urgencia-${materia.id}">
                    <option value="1">🔴 Urgente (Nivel 1)</option>
                    <option value="2" selected>🟡 Media (Nivel 2)</option>
                    <option value="3">🟢 Baja (Nivel 3)</option>
                </select>
                <button onclick="agregarTarea('${materia.nombre}', '${materia.id}')">Guardar Tarea</button>
            </div>

            <div class="form-recurso">
                <input type="text" id="rec-titulo-${materia.id}" placeholder="Nombre del recurso (ej. Drive)..." />
                <input type="url" id="rec-url-${materia.id}" placeholder="https://..." />
                <button onclick="agregarRecurso('${materia.nombre}', '${materia.id}')">📎 Link</button>
            </div>
        `;
        contenedorHoy.appendChild(tarjeta);
    });
}

// 5. GESTIÓN DE TAREAS
function agregarTarea(nombreMateria, materiaId) {
    const input = document.getElementById(`input-${materiaId}`);
    const selectUrgencia = document.getElementById(`urgencia-${materiaId}`);
    const texto = input.value.trim();

    if (texto === "") return;

    const nuevaTarea = {
        id: Date.now(),
        materia: nombreMateria,
        texto: texto,
        urgencia: parseInt(selectUrgencia.value),
        completada: false
    };

    tareas.push(nuevaTarea);
    guardarYActualizar();
    input.value = "";
}

function toggleTarea(id) {
    tareas = tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t);
    guardarYActualizar();
}

function posponerTarea(id) {
    tareas = tareas.map(t => {
        if (t.id === id) {
            const nuevaUrgencia = t.urgencia < 3 ? t.urgencia + 1 : 3;
            return { ...t, urgencia: nuevaUrgencia, pospuesta: true };
        }
        return t;
    });
    guardarYActualizar();
}

function eliminarTarea(id) {
    tareas = tareas.filter(t => t.id !== id);
    guardarYActualizar();
}

// 6. GESTIÓN DE RECURSOS / ENLACES
function agregarRecurso(nombreMateria, materiaId) {
    const inputTitulo = document.getElementById(`rec-titulo-${materiaId}`);
    const inputUrl = document.getElementById(`rec-url-${materiaId}`);

    const titulo = inputTitulo.value.trim();
    let url = inputUrl.value.trim();

    if (titulo === "" || url === "") return;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    const nuevoRecurso = {
        id: Date.now(),
        materia: nombreMateria,
        titulo: titulo,
        url: url
    };

    recursos.push(nuevoRecurso);
    localStorage.setItem('recursos_dashboard', JSON.stringify(recursos));
    renderizarRecursosGlobales();

    inputTitulo.value = "";
    inputUrl.value = "";
}

function eliminarRecurso(id) {
    recursos = recursos.filter(r => r.id !== id);
    localStorage.setItem('recursos_dashboard', JSON.stringify(recursos));
    renderizarRecursosGlobales();
}

// 7. RENDERIZADO DE PANELES
function renderizarTareasGlobales() {
    contenedorTareasGlobales.innerHTML = "";

    if (tareas.length === 0) {
        contenedorTareasGlobales.innerHTML = "<p class='mensaje-vacio'>No tienes tareas pendientes. ¡Todo al día! ✨</p>";
        return;
    }

    const tareasOrdenadas = [...tareas].sort((a, b) => a.urgencia - b.urgencia);

    tareasOrdenadas.forEach(t => {
        const item = document.createElement("div");
        item.className = `tarea-item urgencia-${t.urgencia} ${t.completada ? 'completada' : ''}`;
        
        item.innerHTML = `
            <div class="tarea-header">
                <span class="badge-materia">${t.materia}</span>
                <span class="badge-urgencia">Nivel ${t.urgencia} ${t.pospuesta ? '⏳ Posponida' : ''}</span>
            </div>
            <p class="tarea-texto">${t.texto}</p>
            <div class="tarea-acciones">
                <button class="btn-check" onclick="toggleTarea(${t.id})">
                    ${t.completada ? '↩️ Deshacer' : '✅ Entregada'}
                </button>
                ${!t.completada ? `<button class="btn-posponer" onclick="posponerTarea(${t.id})">⏩ Posponer</button>` : ''}
                <button class="btn-eliminar" onclick="eliminarTarea(${t.id})">🗑️</button>
            </div>
        `;
        contenedorTareasGlobales.appendChild(item);
    });
}

function renderizarRecursosGlobales() {
    contenedorRecursosGlobales.innerHTML = "";

    if (recursos.length === 0) {
        contenedorRecursosGlobales.innerHTML = "<p class='mensaje-vacio'>No hay enlaces guardados aún.</p>";
        return;
    }

    recursos.forEach(r => {
        const item = document.createElement("div");
        item.className = "recurso-item";
        item.innerHTML = `
            <div>
                <span class="badge-materia">${r.materia}</span>
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="recurso-link">🔗 ${r.titulo}</a>
            </div>
            <button class="btn-eliminar" onclick="eliminarRecurso(${r.id})">🗑️</button>
        `;
        contenedorRecursosGlobales.appendChild(item);
    });
}

function guardarYActualizar() {
    localStorage.setItem('tareas_dashboard', JSON.stringify(tareas));
    renderizarTareasGlobales();
}

// INICIALIZACIÓN
cargarClima();
cargarMateriasDeHoy();
renderizarTareasGlobales();
renderizarRecursosGlobales();