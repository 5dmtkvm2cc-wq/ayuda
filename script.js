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

// 2. RECUPERAR FAVORITOS GUARDADOS DE LOCALSTORAGE
let favoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

// REFERENCIAS DEL DOM
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

let indiceCancionActual = 0;
let estaReproduciendo = false;

// 3. RENDERIZAR TARJETAS (Con detección de Me Gusta)
function cargarTarjetas(lista) {
    songsGrid.innerHTML = '';

    if (lista.length === 0) {
        songsGrid.innerHTML = '<p style="color: #b3b3b3;">No se encontraron canciones.</p>';
        return;
    }

    lista.forEach((cancion) => {
        // Verificar si la canción ya está en el arreglo de favoritos
        const esFavorita = favoritos.includes(cancion.id);

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <button class="btn-like" onclick="toggleFavorito(event, ${cancion.id})">
                ${esFavorita ? '💚' : '🤍'}
            </button>
            <img src="${cancion.portada}" alt="${cancion.titulo}">
            <h3>${cancion.titulo}</h3>
            <p>${cancion.artista}</p>
            <button class="btn-play-card" onclick="reproducirCancionPorId(${cancion.id})">▶</button>
        `;
        songsGrid.appendChild(card);
    });
}

// 4. FUNCIÓN PARA AGREGAR O QUITAR FAVORITOS
function toggleFavorito(event, id) {
    event.stopPropagation(); // Evita que se disparen otros eventos de la tarjeta

    if (favoritos.includes(id)) {
        // Si ya estaba, la quitamos
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        // Si no estaba, la agregamos
        favoritos.push(id);
    }

    // Guardar el arreglo actualizado en la memoria del navegador
    localStorage.setItem('mis_favoritos', JSON.stringify(favoritos));

    // Re-renderizar tarjetas para refrescar los corazones
    cargarTarjetas(canciones);
}

// 5. CONTROL DE REPRODUCCIÓN
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

// BARRA DE TIEMPO Y VOLUMEN
audioPlayer.addEventListener('timeupdate', () => {
    if (audioPlayer.duration) {
        const porcentaje = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.value = porcentaje;
        timeCurrent.textContent = formatearTiempo(audioPlayer.currentTime);
        timeTotal.textContent = formatearTiempo(audioPlayer.duration);
    }
});

progressBar.addEventListener('input', () => {
    const nuevoTiempo = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = nuevoTiempo;
});

volumeBar.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});

function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
}

// BUSCADOR EN TIEMPO REAL
inputBusqueda.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const resultados = canciones.filter(cancion => 
        cancion.titulo.toLowerCase().includes(texto) ||
        cancion.artista.toLowerCase().includes(texto)
    );
    cargarTarjetas(resultados);
});

// INICIALIZACIÓN
cargarTarjetas(canciones);
cargarCancion(canciones[0]);