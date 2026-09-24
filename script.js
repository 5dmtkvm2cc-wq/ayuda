// 1. LISTA DE CANCIONES (Objetos con datos y URLs de audio de muestra)
const canciones = [
    {
        id: 0,
        titulo: "Un Verano Sin Ti",
        artista: "Bad Bunny",
        portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMVhRbjBpwbW4vX7DP41KjspsbFGVeAlGFC9pYfxpSPw&s",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        id: 1,
        titulo: "MICRODOSIS",
        artista: "Mora",
        portada: "https://i.scdn.co/image/ab67616d0000b273e9a9de396bb621a2822fb278",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
        id: 2,
        titulo: "DATA",
        artista: "Tainy",
        portada: "https://i.scdn.co/image/ab67616d0000b273f885fb64a381318a1c9c14e4",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
];

// 2. REFERENCIAS A ELEMENTOS DEL DOM
const songsGrid = document.getElementById('songs-grid');
const audioPlayer = document.getElementById('audio-player');

const btnPlayMain = document.getElementById('btn-play-main');
const playerImg = document.getElementById('player-img');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');

const progressBar = document.getElementById('progress-bar');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const volumeBar = document.getElementById('volume-bar');
const inputBusqueda = document.getElementById('input-busqueda');

// Variables de estado
let indiceCancionActual = 0;
let estaReproduciendo = false;

// 3. RENDERIZAR TARJETAS DINÁMICAMENTE
function cargarTarjetas(lista) {
    songsGrid.innerHTML = ''; // Limpiar grilla

    lista.forEach((cancion) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img src="${cancion.portada}" alt="${cancion.titulo}">
            <h3>${cancion.titulo}</h3>
            <p>${cancion.artista}</p>
            <button class="btn-play-card" onclick="reproducirCancionPorId(${cancion.id})">▶</button>
        `;
        songsGrid.appendChild(card);
    });
}

// 4. CARGAR Y REPRODUCIR CANCIÓN SELECCIONADA
function cargarCancion(cancion) {
    playerTitle.textContent = cancion.titulo;
    playerArtist.textContent = cancion.artista;
    playerImg.src = cancion.portada;
    audioPlayer.src = cancion.audio;
}

function reproducirCancionPorId(id) {
    indiceCancionActual = id;
    cargarCancion(canciones[indiceCancionActual]);
    reproducirAudio();
}

function reproducirAudio() {
    audioPlayer.play();
    estaReproduciendo = true;
    btnPlayMain.textContent = '⏸';
}

function pausarAudio() {
    audioPlayer.pause();
    estaReproduciendo = false;
    btnPlayMain.textContent = '▶';
}

// Alternar entre Play y Pausa
btnPlayMain.addEventListener('click', () => {
    if (estaReproduciendo) {
        pausarAudio();
    } else {
        if (!audioPlayer.src) {
            cargarCancion(canciones[0]);
        }
        reproducirAudio();
    }
});

// 5. BARRA DE TIEMPO Y PROGRESO
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        // Calcular porcentaje transcurrido
        const porcentaje = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = porcentaje;

        // Formatear tiempos en MM:SS
        timeCurrent.textContent = formatearTiempo(audioPlayer.currentTime);
        timeTotal.textContent = formatearTiempo(audioPlayer.duration);
    }
});

// Cambiar punto de reproducción al arrastrar el slider
progressBar.addEventListener('input', () => {
    const nuevoTiempo = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = nuevoTiempo;
});

// Control de Volumen
volumeBar.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});

// Helper para formato 00:00
function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

// 6. BUSCADOR EN TIEMPO REAL
inputBusqueda.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const resultados = canciones.filter(cancion => 
        cancion.titulo.toLowerCase().includes(texto) ||
        cancion.artista.toLowerCase().includes(texto)
    );
    cargarTarjetas(resultados);
});

// Inicializar la vista
cargarTarjetas(canciones);
cargarCancion(canciones[0]);