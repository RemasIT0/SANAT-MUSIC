# Bienvenida pública (src/pages/Bienvenida.tsx)

Scope: página de bienvenida para quien entra sin sesión a la dirección principal. Mode: persuade.
Audience: músicos de Tucumán y público de la escena. Job: entender qué es SANAT y crear cuenta (o iniciar sesión).
Proof: mascotas reales del código, funciones reales (perfil + mascota, diseño libre, bandas, agenda, chat, demos), próximos eventos reales vía RPC pública `public_upcoming_events`. Sin cifras ni testimonios inventados.
Constraints: voseo; carga lazy; celular primero; respetar prefers-reduced-motion; sin datos personales de usuarios.

## Direction contract

THESIS: SANAT es la pared de la sala de ensayo de Tucumán: cada función es un afiche pegado y las mascotas son stickers vivos. Rechaza el hero centrado sobre fila de tarjetas iguales.

OWN-WORLD: fondo de ladrillo/pared casi negro (#0f0f0f/#141414 con juntas), afiches de papel claro (#f4efe6) y afiches de tinta violeta (#7e22ce) y negra (#111), cinta adhesiva traslúcida lila, títulos en Nirvana (marca) y Anton para titulares de afiche, Permanent Marker para lo escrito a mano. Mascotas reales (componente Mascot) como stickers con borde blanco.

STORY: el visitante ve que SANAT es la escena de Tucumán con personalidad propia (mascotas), recorre los afiches (tu mascota, diseñá tu perfil, bandas, agenda con shows reales, chat y demos), conoce a Darkore como creador, y crea su cuenta.

FIRST VIEWPORT: afiche principal violeta levemente torcido al centro con SANAT enorme, bajada y botón "Crear cuenta" + "Ya tengo cuenta"; dentro, un desfile de mascotas reales. A los lados afiches chicos (BUSCO BAJISTA, JAM) y stickers. En celular: el afiche principal ocupa el ancho, stickers alrededor.

FORM: Pared de afiches, dealt structure 2 of 7 on the ordered list; seed:293f90247a31042f. Signature interaction: los afiches se "pegan" al entrar en pantalla (caen con rotación y la cinta se asienta), los stickers de mascotas se despegan al pasar el mouse/tocar y cambian de disfraz; Darkore tiene su afiche propio que se ilumina con la llama de sus ojos.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
