// src/components/asistente/helpTopics.ts
// Temas de ayuda de Sani. Para agregar uno nuevo: sumalo a TOPICS con sus
// palabras clave (sin tildes, en minúscula) y, si querés que aparezca como
// botón, agregalo a una categoría de CATEGORIES.

export interface BotAction {
  label: string
  to?: string
  run?: 'suggestion' | 'song'
  genre?: string
  href?: string
}

export interface Topic {
  question: string
  answer: string
  keywords: string[]
  actions?: BotAction[]
}

export const TOPICS: Record<string, Topic> = {
  publicar: {
    question: '¿Cómo publico algo?',
    answer: 'En el Inicio tocá "Crear mi publicación". Contá qué buscás (banda, músicos, servicios), elegí géneros e intención. Podés tener UNA publicación activa: para cambiarla, editala o eliminala.',
    keywords: ['publicar', 'publicacion', 'post', 'anuncio', 'crear', 'busco banda', 'aviso'],
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  editarPost: {
    question: '¿Cómo edito o borro mi publicación?',
    answer: 'Tu publicación aparece arriba de todo en el Inicio, con los botones "Editar" y "Eliminar". Si la eliminás, podés crear una nueva.',
    keywords: ['editar publicacion', 'borrar publicacion', 'eliminar publicacion', 'cambiar post', 'modificar'],
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  perfil: {
    question: 'Quiero editar mi perfil',
    answer: '"Editar datos" cambia tu foto, nombre, bio, instrumentos, géneros, mascota y audio. "Diseñar perfil" te deja armarlo con módulos, colores y fondo a tu gusto.',
    keywords: ['perfil', 'editar perfil', 'foto', 'nombre', 'bio', 'biografia', 'instrumento', 'datos'],
    actions: [{ label: 'Editar datos', to: '/editar-perfil' }, { label: 'Diseñar perfil', to: '/editar-perfil/diseno' }],
  },
  diseno: {
    question: '¿Cómo personalizo el diseño?',
    answer: 'En "Diseñar perfil" agregás módulos (galería, redes, estadísticas, cajas de texto), los arrastrás para ordenarlos y les cambiás colores, bordes y tamaño. También podés poner un fondo sólido o degradado.',
    keywords: ['diseno', 'disenar', 'personalizar', 'modulo', 'galeria', 'fondo', 'colores', 'redes sociales'],
    actions: [{ label: 'Diseñar perfil', to: '/editar-perfil/diseno' }],
  },
  mascota: {
    question: '¿Cómo cambio mi mascota?',
    answer: 'En "Editar datos" elegí el color y el estilo de tu mascota: hay punk, gaucho, rapero, astronauta, otaku, zombie y muchos más. Tocá "Ver más diseños" para verlos todos.',
    keywords: ['mascota', 'personaje', 'muneco', 'estilo', 'cuadrado'],
    actions: [{ label: 'Editar datos', to: '/editar-perfil' }],
  },
  audio: {
    question: '¿Cómo subo un audio?',
    answer: 'En "Editar datos", abajo de todo, está "Tu audio". Podés subir un audio de hasta 30 segundos y 1 MB (MP3, M4A, OGG o WEBM). Aparece en tu perfil para que escuchen cómo sonás.',
    keywords: ['audio', 'grabacion', 'demo', 'sonido', 'mp3', 'subir audio', 'escuchar mi'],
    actions: [{ label: 'Editar datos', to: '/editar-perfil' }],
  },
  mensajes: {
    question: 'Mensajes y chat',
    answer: 'Escribile a alguien desde su publicación o su perfil con "Enviar mensaje". En Mensajes ves todas tus conversaciones. El punto verde indica que la persona está en línea ahora.',
    keywords: ['mensaje', 'chat', 'hablar', 'escribir', 'conversacion', 'bandeja', 'en linea'],
    actions: [{ label: 'Ir a Mensajes', to: '/bandeja' }],
  },
  amigos: {
    question: '¿Cómo agrego amigos?',
    answer: 'Entrá al perfil de la persona y tocá "Agregar". Tus amigos aparecen en tu Bandeja para escribirles rápido.',
    keywords: ['amigo', 'amistad', 'agregar', 'seguir'],
    actions: [{ label: 'Ir a Mensajes', to: '/bandeja' }],
  },
  buscar: {
    question: '¿Cómo encuentro músicos?',
    answer: 'Arriba en el Inicio está el buscador: escribí un nombre o @usuario. Más abajo, en "Filtros de búsqueda", filtrás publicaciones por departamento, localidad, género e intención.',
    keywords: ['buscar', 'encontrar', 'musicos', 'filtro', 'zona', 'localidad', 'departamento', 'banda'],
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  likes: {
    question: '¿Quién le dio like a mi post?',
    answer: 'En tu publicación (arriba del Inicio) tocá "Ver likes". Si aparece un punto rojo, tenés likes nuevos. Los likes que das vos son privados: solo vos los ves en "Mis likes".',
    keywords: ['like', 'me gusta', 'corazon', 'likes'],
    actions: [{ label: 'Ir al Inicio', to: '/home' }],
  },
  login: {
    question: 'No puedo iniciar sesión',
    answer: 'Revisá que hayas confirmado tu email (mirá en spam y Promociones). Si ya te registraste antes con ese email, no te llega un mail nuevo: iniciá sesión directamente.',
    keywords: ['iniciar sesion', 'login', 'entrar', 'no puedo entrar', 'no me deja', 'verificar', 'confirmar', 'email', 'correo', 'mail'],
  },
  password: {
    question: 'Olvidé mi contraseña',
    answer: 'En la pantalla de inicio de sesión tocá "¿Olvidaste tu contraseña?". Te llega un email con un link para crear una nueva.',
    keywords: ['contrasena', 'clave', 'password', 'olvide'],
  },
  ban: {
    question: 'Mi cuenta fue suspendida',
    answer: 'Las cuentas se suspenden por reportes de la comunidad. Si creés que es un error, escribile al administrador desde la pantalla de cuenta suspendida.',
    keywords: ['suspendida', 'baneado', 'ban', 'bloqueada', 'suspension'],
  },
  seguridad: {
    question: 'Reportar o bloquear a alguien',
    answer: 'En una publicación tocá la banderita para reportarla. En el perfil de una persona podés reportarla o bloquearla: si la bloqueás, no pueden enviarse mensajes ni verse en el feed.',
    keywords: ['reportar', 'denunciar', 'bloquear', 'acoso', 'spam', 'molesta'],
  },
  radio: {
    question: '¿Cómo uso la radio?',
    answer: 'Tocá la pestaña RADIO arriba a la derecha para abrir el reproductor. Sigue sonando mientras navegás y recuerda tu última estación y volumen.',
    keywords: ['radio', 'cassette', 'estacion', 'volumen'],
  },
  contacto: {
    question: 'No encuentro mi respuesta',
    answer: 'Mandanos tu duda o sugerencia y la vamos a leer. ¡Nos ayuda a mejorar SANAT!',
    keywords: ['sugerencia', 'ayuda', 'contacto', 'error', 'bug', 'problema', 'falla'],
    actions: [{ label: 'Escribir sugerencia', run: 'suggestion' }],
  },
}

// Botones agrupados por categoría (más fácil de recorrer que una lista larga)
export const CATEGORIES: { label: string; topics: string[] }[] = [
  { label: '🎵 Música', topics: ['__song', 'audio', 'radio'] },
  { label: '📝 Publicar', topics: ['publicar', 'editarPost', 'likes'] },
  { label: '👤 Mi perfil', topics: ['perfil', 'diseno', 'mascota'] },
  { label: '💬 Gente', topics: ['mensajes', 'amigos', 'buscar', 'seguridad'] },
  { label: '🔑 Cuenta', topics: ['login', 'password', 'ban', 'contacto'] },
]

// ---------------------------------------------------------------------------
// Recomendaciones de canciones por género
// ---------------------------------------------------------------------------
export const SONGS: Record<string, { artist: string; title: string }[]> = {
  Rock: [
    { artist: 'Soda Stereo', title: 'De música ligera' },
    { artist: 'Charly García', title: 'Demoliendo hoteles' },
    { artist: 'Patricio Rey y sus Redonditos de Ricota', title: 'Jijiji' },
    { artist: 'Divididos', title: 'El arriero' },
    { artist: 'Queen', title: 'Bohemian Rhapsody' },
    { artist: 'Led Zeppelin', title: 'Stairway to Heaven' },
    { artist: 'AC/DC', title: 'Back in Black' },
  ],
  Pop: [
    { artist: 'Michael Jackson', title: 'Billie Jean' },
    { artist: 'Tan Biónica', title: 'Ciudad mágica' },
    { artist: 'The Weeknd', title: 'Blinding Lights' },
    { artist: 'Dua Lipa', title: 'Levitating' },
    { artist: 'Miranda!', title: 'Don' },
    { artist: 'Shakira', title: "Hips Don't Lie" },
  ],
  Folklore: [
    { artist: 'Mercedes Sosa', title: 'Alfonsina y el mar' },
    { artist: 'Atahualpa Yupanqui', title: 'Los ejes de mi carreta' },
    { artist: 'Jorge Cafrune', title: 'Zamba de mi esperanza' },
    { artist: 'Soledad', title: 'A Don Ata' },
    { artist: 'Abel Pintos', title: 'Sueño dorado' },
    { artist: 'Los Manseros Santiagueños', title: 'Añoranzas' },
  ],
  Cumbia: [
    { artist: 'Gilda', title: 'No me arrepiento de este amor' },
    { artist: 'Rodrigo', title: 'Lo mejor del amor' },
    { artist: 'Los Palmeras', title: 'El bombón asesino' },
    { artist: 'Ráfaga', title: 'Mentirosa' },
    { artist: 'La Nueva Luna', title: 'Iluminará' },
    { artist: 'Damas Gratis', title: 'Se te ve la tanga' },
  ],
  Jazz: [
    { artist: 'Miles Davis', title: 'So What' },
    { artist: 'Dave Brubeck', title: 'Take Five' },
    { artist: 'John Coltrane', title: 'Giant Steps' },
    { artist: 'Louis Armstrong', title: 'What a Wonderful World' },
    { artist: 'Herbie Hancock', title: 'Cantaloupe Island' },
  ],
  Electrónica: [
    { artist: 'Daft Punk', title: 'One More Time' },
    { artist: 'Avicii', title: 'Levels' },
    { artist: 'Bajofondo', title: "Pa' bailar" },
    { artist: 'Deadmau5', title: 'Strobe' },
    { artist: 'Fatboy Slim', title: 'Right Here, Right Now' },
  ],
  Indie: [
    { artist: 'Arctic Monkeys', title: 'Do I Wanna Know?' },
    { artist: 'Tame Impala', title: 'The Less I Know the Better' },
    { artist: 'Él Mató a un Policía Motorizado', title: 'Mujeres bellas y fuertes' },
    { artist: 'Babasónicos', title: 'Irresponsables' },
    { artist: 'Bandalos Chinos', title: 'Vámonos de viaje' },
    { artist: 'The Strokes', title: 'Last Nite' },
  ],
  Metal: [
    { artist: 'Metallica', title: 'Master of Puppets' },
    { artist: 'Iron Maiden', title: 'The Trooper' },
    { artist: 'Black Sabbath', title: 'Paranoid' },
    { artist: 'Rata Blanca', title: 'Mujer amante' },
    { artist: 'Hermética', title: 'Gil trabajador' },
    { artist: 'Slayer', title: 'Raining Blood' },
  ],
  Grunge: [
    { artist: 'Nirvana', title: 'Smells Like Teen Spirit' },
    { artist: 'Pearl Jam', title: 'Alive' },
    { artist: 'Soundgarden', title: 'Black Hole Sun' },
    { artist: 'Alice in Chains', title: 'Man in the Box' },
    { artist: 'Silverchair', title: 'Tomorrow' },
  ],
}

export const SONG_GENRES = Object.keys(SONGS)
export const SONG_KEYWORDS = ['cancion', 'recomenda', 'recomendame', 'tema', 'escuchar', 'musica', 'temazo', 'playlist']

export const youtubeSearch = (artist: string, title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`

// Texto sin tildes y en minúscula, para comparar con las palabras clave
export const normalize = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

// Busca el tema que mejor coincide con lo que escribió la persona
export const matchTopic = (input: string): string | null => {
  const text = normalize(input)
  let best: { id: string; score: number } | null = null
  for (const [id, topic] of Object.entries(TOPICS)) {
    const score = topic.keywords.reduce((acc, kw) => acc + (text.includes(kw) ? kw.length : 0), 0)
    if (score > 0 && (!best || score > best.score)) best = { id, score }
  }
  return best?.id ?? null
}

// Género mencionado en el texto (ej: "recomendame algo de metal")
export const matchGenre = (input: string): string | null => {
  const text = normalize(input)
  return SONG_GENRES.find(g => text.includes(normalize(g))) ?? null
}
