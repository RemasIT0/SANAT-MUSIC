# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Músicos de Tucumán (Argentina) que buscan banda, integrantes, lugares para tocar y otros músicos con quienes armar proyectos.
- Público que sigue la escena local: quiere enterarse de shows y jams y seguir bandas, aunque no toque.
- Uso mayormente desde el celular; también en compu.

## Product Purpose
SANAT es la red social de la escena musical de Tucumán. Conecta músicos entre sí y con su público: perfiles, bandas, agenda de eventos, chat y demos. El éxito es que la gente se cree una cuenta, arme su perfil y vuelva a entrar para encontrar banda, shows y otros músicos.

## Positioning
Una comunidad local hecha por y para la escena de Tucumán, con identidad propia: cada persona tiene una mascota (un personaje cuadrado con disfraces y expresiones) y puede diseñar su perfil libremente, como una página propia. Las mascotas son la marca de SANAT.

## Operating Context
- App web (PWA) publicada en Vercel, datos en Supabase.
- Quien entra sin cuenta hoy ve solo el login; la página de bienvenida explica qué es SANAT antes de pedir el registro.
- Las vistas previas al compartir en WhatsApp son una vía importante de llegada.

## Capabilities and Constraints
- Funciones: perfiles con mascota, diseño libre del perfil (lienzo con fondos, animaciones, fuentes, imágenes), bandas, agenda de shows/jams/ensayos, chat entre músicos, demos de audio, reseñas, Tele retro y radios de rock.
- Mascotas: decenas de disfraces (punk, gaucho, metalero, gótico, mago, princesa, etc.); el Dark King es exclusivo del admin.
- Textos en español rioplatense con voseo.
- Pantallas cargadas por separado (lazy) para que la app abra rápido.
- Privacidad: no exponer datos personales de usuarios en páginas públicas.

## Brand Commitments
- Nombre: SANAT.
- Las mascotas son la marca y deben destacar.
- El creador/admin se presenta como **Darkore**, representado por la mascota Dark King.
- Identidad actual: fondo casi negro, violeta como acento, tipografía Nirvana para títulos, guiños musicales (cuerdas de guitarra, ecualizadores).

## Evidence on Hand
- Mascotas reales en código (`src/components/MascotCostumes.tsx`).
- Imagen de vista previa `public/og-image.jpg` y captura del diseñador `public/tour-diseno.jpg`.
- Eventos reales en la base (se pueden mostrar con una función pública que devuelva solo datos de evento).
- No hay testimonios, cifras de usuarios ni prensa: no inventarlos.

## Product Principles
1. La comunidad local primero: todo apunta a conectar gente real de la escena de Tucumán.
2. Personalidad antes que plantilla: mascotas y perfiles diseñables hacen que cada uno se sienta propio.
3. Rápido en el celular: la mayoría entra desde el teléfono.
4. Privacidad cuidada: lo público muestra lo justo.
