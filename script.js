// 1. CANCIONES
const canciones = [
    {
        id: 0,
        titulo: "Un Verano Sin Ti",
        artista: "Bad Bunny",
        portada: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        id: 1,
        titulo: "MICRODOSIS",
        artista: "Mora",
        portada: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    },
    {
        id: 2,
        titulo: "DATA",
        artista: "Tainy",
        portada: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    }
];

// 2. PODCASTS
const podcasts = [
    {
        id: 101,
        titulo: "La Cotorrisa",
        artista: "Ricardo Pérez & Slobotzky",
        portada: "https://m.media-amazon.com/images/S/dmp-catalog-images-prod/images/8b38e368-30dd-40a9-baa3-89a167b0ccf9/8b38e368-30dd-40a9-baa3-89a167b0ccf9--62839268.jpeg",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    },
    {
        id: 102,
        titulo: "PODCAST DE GUSGRI",
        artista: "Gusgri",
        portada: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRadrSJjIYHOYh_nIaOOIAQpgcKnaQJiAkYJDgwIRrSaw&s",
        audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
    }
];

let favoritos = JSON.parse(localStorage.getItem('mis_favoritos')) || [];

// REFERENCIAS AL DOM
const songsGrid = document.getElementById('songs-grid');
const podcastsGrid = document.getElementById('podcasts-grid');
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

let estaReproduciendo = false;

// 3. CARGAR TARJETAS DE CANCIONES Y PODCASTS
function cargarTarjetas(lista, contenedor, esPodcast = false) {
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="color: #b3b3b3;">No se encontraron resultados.</p>';
        return;
    }

    lista.forEach((item) => {
        const esFavorito = favoritos.includes(item.id);

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <button class="btn-like" onclick="toggleFavorito(event, ${item.id})">
                ${esFavorito ? '💚' : '🤍'}
            </button>
            <img src="${item.portada}" alt="${item.titulo}">
            <h3>${item.titulo}</h3>
            <p>${item.artista}</p>
            <button class="btn-play-card" onclick="reproducirElemento(${item.id}, ${esPodcast})">▶</button>
        `;
        contenedor.appendChild(card);
    });
}

// 4. REPRODUCCIÓN
function reproducirElemento(id, esPodcast = false) {
    const fuente = esPodcast ? podcasts : canciones;
    const elemento = fuente.find(item => item.id === id);

    if (elemento) {
        cargarEnReproductor(elemento);
        reproducirAudio();
    }
}

function cargarEnReproductor(elemento) {
    playerTitle.textContent = elemento.titulo;
    playerArtist.textContent = elemento.artista;
    playerImg.src = elemento.portada;
    audioPlayer.src = elemento.audio;
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

// CONTROLES DE PLAY/PAUSA
btnPlayMain.addEventListener('click', () => {
    if (estaReproduciendo) {
        pausarAudio();
    } else {
        if (!audioPlayer.src) {
            cargarEnReproductor(canciones[0]);
        }
        reproducirAudio();
    }
});

// FAVORITOS CON LOCALSTORAGE
function toggleFavorito(event, id) {
    event.stopPropagation();

    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }

    localStorage.setItem('mis_favoritos', JSON.stringify(favoritos));
    
    // Refrescar ambas secciones
    cargarTarjetas(canciones, songsGrid, false);
    if (podcastsGrid) cargarTarjetas(podcasts, podcastsGrid, true);
}

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
    
    const cancionesFiltradas = canciones.filter(c => 
        c.titulo.toLowerCase().includes(texto) || c.artista.toLowerCase().includes(texto)
    );
    const podcastsFiltrados = podcasts.filter(p => 
        p.titulo.toLowerCase().includes(texto) || p.artista.toLowerCase().includes(texto)
    );

    cargarTarjetas(cancionesFiltradas, songsGrid, false);
    if (podcastsGrid) cargarTarjetas(podcastsFiltrados, podcastsGrid, true);
});

// INICIALIZACIÓN
cargarTarjetas(canciones, songsGrid, false);
if (podcastsGrid) cargarTarjetas(podcasts, podcastsGrid, true);
cargarEnReproductor(canciones[0]);