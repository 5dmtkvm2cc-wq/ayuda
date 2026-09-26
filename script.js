// Mostrar la fecha formateada en el encabezado
const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
document.getElementById('fecha-actual').textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);
// 1. DICCIONARIO DE TU HORARIO
// Usamos los números del 1 (Lunes) al 5 (Viernes) para que coincida con JavaScript.
const horarioSemanal = {
    1: [ // Lunes
        { nombre: "Química del Carbono", horas: "3:00 - 5:00 PM" },
        { nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" },
        { nombre: "Pensamiento Matemático", horas: "7:00 - 8:00 PM" }
    ],
    2: [ // Martes
        { nombre: "Innovación Tecnológica y P.C.", horas: "2:00 - 5:00 PM" },
        { nombre: "El Mundo a través del Arte", horas: "5:00 - 7:00 PM" },
        { nombre: "Comprensión Lectora", horas: "7:00 - 8:00 PM" }
    ],
    3: [ // Miércoles
        { nombre: "Elementos de la Técnica Vocal", horas: "2:00 - 5:00 PM" },
        { nombre: "Química del Carbono", horas: "5:00 - 7:00 PM" },
        { nombre: "Inglés Nivel 3", horas: "7:00 - 8:00 PM" }
    ],
    4: [ // Jueves
        { nombre: "Tutoría de Trayectoria", horas: "2:00 - 4:00 PM" },
        { nombre: "Comprensión Lectora", horas: "4:00 - 6:00 PM" },
        { nombre: "Deporte y Recreación", horas: "6:00 - 8:00 PM" }
    ],
    5: [ // Viernes
        { nombre: "Pensamiento Matemático", horas: "3:00 - 5:00 PM" },
        { nombre: "Inglés Nivel 3", horas: "6:00 - 8:00 PM" }
    ]
};

// 2. OBTENER EL DÍA ACTUAL
const fechaHoy = new Date();
const numeroDia = fechaHoy.getDay(); // Retorna un número (1 = Lunes, etc.)

// 3. REFERENCIA AL HTML
const contenedorHoy = document.getElementById("contenedor-materias-hoy");

// 4. LÓGICA PARA MOSTRAR MATERIAS
function cargarMateriasDeHoy() {
    // Verificamos si es fin de semana (0 = Domingo, 6 = Sábado)
    if (numeroDia === 0 || numeroDia === 6) {
        contenedorHoy.innerHTML = "<p>¡Es fin de semana! No hay clases hoy. 🎉</p>";
        return;
    }

    // Buscamos las materias que tocan el número de día de hoy
    const materiasDeHoy = horarioSemanal[numeroDia];

    // Limpiamos el contenedor (por si acaso)
    contenedorHoy.innerHTML = "";

    // Recorremos las materias de hoy y creamos sus tarjetas
    materiasDeHoy.forEach(materia => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "materia-card";
        tarjeta.innerHTML = `
            <h3>${materia.nombre}</h3>
            <p>🕒 ${materia.horas}</p>
            <!-- Aquí agregaremos más adelante el botón para añadir tareas -->
        `;
        contenedorHoy.appendChild(tarjeta);
    });
}

// Ejecutamos la función al cargar la página
cargarMateriasDeHoy();