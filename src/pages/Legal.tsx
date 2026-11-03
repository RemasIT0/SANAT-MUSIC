// src/pages/Legal.tsx
// Términos y condiciones, política de privacidad y normas de la comunidad.
// Página pública (se puede leer sin iniciar sesión).
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FaArrowLeft, FaFileContract, FaUserShield, FaUsers, FaEnvelope, FaBroadcastTower } from 'react-icons/fa'

const CONTACT_EMAIL = 'remaslove281@gmail.com'
const LAST_UPDATE = '3 de noviembre de 2026'

function Section({ id, title, icon, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 md:p-8 space-y-4">
      <h2 className="text-2xl text-white flex items-center gap-3">{icon} {title}</h2>
      {children}
    </section>
  )
}

function Item({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-white font-semibold">{n}. {title}</h3>
      <div className="text-gray-300 text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function Legal() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen text-gray-200 px-4 py-6 md:py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/login'))} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <FaArrowLeft /> Volver
        </button>

        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl text-white">Términos, privacidad y normas</h1>
          <p className="text-gray-400 text-sm">Última actualización: {LAST_UPDATE}</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Gracias por usar SANAT. Este documento explica, de forma clara, las reglas de uso de la plataforma, qué datos tratamos y cómo los cuidamos.
            Te pedimos que lo leas con atención: al crear una cuenta o usar SANAT, aceptás lo que se detalla a continuación.
          </p>
          <nav className="flex flex-wrap gap-2 pt-1" aria-label="Secciones">
            {[['terminos', 'Términos y condiciones'], ['privacidad', 'Política de privacidad'], ['normas', 'Normas de la comunidad'], ['radios', 'Radios'], ['contacto', 'Contacto']].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="px-3 py-1.5 rounded-full border border-[#3a3a3a] text-xs text-gray-200 hover:border-purple-500 hover:text-white">{label}</a>
            ))}
          </nav>
        </header>

        {/* ---------------- TÉRMINOS ---------------- */}
        <Section id="terminos" title="Términos y condiciones" icon={<FaFileContract className="text-purple-400" />}>
          <Item n="1" title="Qué es SANAT">
            <p>SANAT es una plataforma comunitaria, gratuita e independiente, pensada para que músicos se conozcan, armen bandas y compartan su música. Es un proyecto personal sin fines de lucro y se encuentra en <b>versión de prueba</b>.</p>
          </Item>
          <Item n="2" title="Aceptación">
            <p>Al registrarte o usar SANAT aceptás estos términos, la política de privacidad y las normas de la comunidad. Si no estás de acuerdo, te pedimos que no utilices la plataforma.</p>
          </Item>
          <Item n="3" title="Edad mínima">
            <p>Para usar SANAT tenés que tener al menos <b>13 años</b>. Si sos menor de 18, necesitás la autorización de tu madre, padre o tutor, quienes son responsables del uso que hagas de la plataforma.</p>
          </Item>
          <Item n="4" title="Tu cuenta">
            <p>Sos responsable de mantener la confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta. Los datos que cargues deben ser verdaderos. Si detectás un uso no autorizado, avisanos de inmediato.</p>
          </Item>
          <Item n="5" title="Tu contenido">
            <p>Todo lo que publicás (textos, fotos, audios, diseños de perfil y mensajes) es de tu exclusiva responsabilidad. Seguís siendo titular de tu contenido; al publicarlo nos otorgás una autorización gratuita y no exclusiva para mostrarlo dentro de SANAT, solo con el fin de que la plataforma funcione.</p>
            <p>Declarás que tenés los derechos necesarios sobre lo que subís. No subas música, imágenes ni otros materiales de terceros sin su permiso (Ley 11.723 de Propiedad Intelectual).</p>
          </Item>
          <Item n="6" title="Usos prohibidos">
            <p>No está permitido: acosar, amenazar o discriminar; publicar contenido sexual, violento o ilegal; suplantar la identidad de otra persona; hacer spam, estafas o publicidad no autorizada; intentar acceder a cuentas o datos ajenos; o interferir con el funcionamiento técnico de la plataforma.</p>
          </Item>
          <Item n="7" title="Moderación">
            <p>Podemos revisar reportes, quitar contenido y suspender o eliminar cuentas que incumplan estas reglas, sin aviso previo cuando la situación lo justifique. Si creés que hubo un error, podés escribirnos.</p>
          </Item>
          <Item n="8" title="Servicio en versión de prueba">
            <p>SANAT se ofrece <b>“tal como está” y “según disponibilidad”</b>. Al ser una versión de prueba, puede tener errores, interrupciones o cambios, y no podemos garantizar que funcione en forma continua ni que los datos se conserven indefinidamente. Te recomendamos guardar una copia de todo contenido que te importe.</p>
          </Item>
          <Item n="9" title="Limitación de responsabilidad">
            <p>SANAT es un espacio de encuentro: <b>no participa ni interviene</b> en los acuerdos que hagan los usuarios entre sí (formación de bandas, clases, ensayos, contrataciones, ventas, pagos u otros). Esos acuerdos son exclusivamente entre las partes.</p>
            <p>En la máxima medida permitida por la ley, SANAT y su administrador no se responsabilizan por: el contenido publicado por los usuarios; los encuentros presenciales que se acuerden a través de la plataforma; daños derivados del uso o la imposibilidad de uso del servicio; pérdidas de información; ni el contenido de sitios, radios o servicios de terceros enlazados desde la plataforma.</p>
            <p>Nada de lo aquí establecido limita los derechos que te otorgan las leyes de defensa del consumidor que resulten aplicables.</p>
          </Item>
          <Item n="10" title="Servicios de terceros">
            <p>La radio de SANAT reproduce transmisiones públicas de emisoras independientes, que son propiedad de sus respectivos titulares; SANAT no las produce ni controla su programación. Las recomendaciones de canciones enlazan a búsquedas en YouTube. Cada servicio externo se rige por sus propias condiciones.</p>
          </Item>
          <Item n="11" title="Donaciones">
            <p>Si en algún momento habilitamos donaciones, serán <b>totalmente voluntarias</b> y se usarán para cubrir los costos de mantenimiento. No otorgan beneficios, derechos ni prioridad dentro de la plataforma, y no constituyen la compra de un producto o servicio.</p>
          </Item>
          <Item n="12" title="Cambios en estos términos">
            <p>Podemos actualizar este documento. Cuando el cambio sea importante, lo vamos a comunicar dentro de la plataforma. Si seguís usando SANAT después de la actualización, entendemos que aceptás la nueva versión.</p>
          </Item>
          <Item n="13" title="Ley aplicable">
            <p>Estos términos se rigen por las leyes de la República Argentina.</p>
          </Item>
        </Section>

        {/* ---------------- PRIVACIDAD ---------------- */}
        <Section id="privacidad" title="Política de privacidad" icon={<FaUserShield className="text-purple-400" />}>
          <p className="text-gray-300 text-sm leading-relaxed">Cuidamos tus datos personales conforme a la <b>Ley 25.326 de Protección de los Datos Personales</b> de la República Argentina.</p>
          <Item n="1" title="Qué datos tratamos">
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Datos de cuenta:</b> email y contraseña. La contraseña se guarda cifrada por nuestro proveedor de autenticación: nadie, ni siquiera el administrador, puede verla.</li>
              <li><b>Datos de perfil:</b> nombre, usuario, foto, biografía, instrumentos, géneros, ubicación (departamento y localidad), mascota, audio y diseño de perfil.</li>
              <li><b>Actividad:</b> publicaciones, likes, amigos, bloqueos, reportes, sugerencias, mensajes privados y la última vez que estuviste activo (para mostrar el estado “en línea”).</li>
              <li><b>Datos técnicos mínimos:</b> los necesarios para que el servicio funcione y sea seguro.</li>
            </ul>
          </Item>
          <Item n="2" title="Para qué los usamos">
            <p>Únicamente para brindar el servicio: mostrar tu perfil, permitir la comunicación entre usuarios, enviarte emails de verificación y recuperación de contraseña, notificaciones que vos activaste, y mantener la seguridad (moderación de reportes y prevención de abusos). <b>No vendemos ni alquilamos tus datos</b>, ni los usamos para publicidad.</p>
          </Item>
          <Item n="3" title="Qué es público y qué es privado">
            <p><b>Visible para otros usuarios:</b> tu perfil, tu publicación, tu audio y tu diseño de perfil.</p>
            <p><b>Privado:</b> tu email, tus mensajes (solo los ven quienes participan de la conversación), los likes que das, tus bloqueos, tus reportes y tus diseños guardados.</p>
          </Item>
          <Item n="4" title="Proveedores que nos ayudan">
            <p>Para funcionar usamos servicios de terceros que tratan datos por cuenta nuestra: <b>Supabase</b> (base de datos, autenticación y almacenamiento de archivos), <b>Vercel</b> (alojamiento de la web) y <b>Google / Gmail</b> (envío de emails). Algunos de estos servidores pueden estar ubicados fuera de la Argentina; al usar SANAT prestás tu consentimiento para esa transferencia, que se realiza con proveedores que aplican medidas de seguridad reconocidas.</p>
          </Item>
          <Item n="5" title="Acceso del administrador">
            <p>El administrador accede a la información estrictamente necesaria para moderar la plataforma (por ejemplo, reportes y sugerencias). Los mensajes privados no se revisan, salvo que resulte necesario para atender una denuncia concreta o un requerimiento de una autoridad competente.</p>
          </Item>
          <Item n="6" title="Cuánto tiempo los guardamos">
            <p>Mientras tu cuenta esté activa. Si pedís la baja, eliminamos tus datos personales en un plazo razonable, salvo aquellos que debamos conservar por obligación legal.</p>
          </Item>
          <Item n="7" title="Tus derechos">
            <p>Podés solicitar en cualquier momento el <b>acceso, la rectificación, la actualización o la supresión</b> de tus datos, escribiendo a <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-300 underline">{CONTACT_EMAIL}</a>. La mayoría de tus datos de perfil también los podés modificar vos mismo desde “Editar datos”.</p>
            <p className="text-gray-400 text-xs">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
          </Item>
          <Item n="8" title="Seguridad">
            <p>Aplicamos medidas razonables para proteger tu información: conexión cifrada (HTTPS), contraseñas cifradas, reglas de acceso en la base de datos que impiden que un usuario lea o modifique datos ajenos, y verificación adicional para la cuenta de administración. Aun así, ningún sistema es completamente infalible.</p>
          </Item>
          <Item n="9" title="Almacenamiento en tu dispositivo">
            <p>Guardamos en tu navegador algunas preferencias (por ejemplo, la última estación de radio o si ya viste tus likes) y la sesión iniciada. No usamos cookies de publicidad ni herramientas de rastreo de terceros.</p>
          </Item>
        </Section>

        {/* ---------------- NORMAS ---------------- */}
        <Section id="normas" title="Normas de la comunidad" icon={<FaUsers className="text-purple-400" />}>
          <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm leading-relaxed">
            <li><b>Respeto ante todo.</b> No se toleran insultos, acoso, discriminación ni discursos de odio.</li>
            <li><b>Sé auténtico.</b> No te hagas pasar por otra persona ni crees cuentas falsas.</li>
            <li><b>Compartí lo tuyo.</b> Subí música, fotos y audios propios o sobre los que tengas permiso.</li>
            <li><b>Nada de spam ni estafas.</b> No envíes mensajes masivos ni pidas dinero con engaños.</li>
            <li><b>Cuidate al encontrarte.</b> Si acordás un ensayo o una reunión, hacelo en un lugar público, avisale a alguien de confianza y nunca compartas datos sensibles o bancarios.</li>
            <li><b>Usá las herramientas.</b> Si algo no está bien, reportalo o bloqueá a la persona. Revisamos cada reporte.</li>
          </ul>
        </Section>

        {/* ---------------- RADIOS ---------------- */}
        <Section id="radios" title="Radios" icon={<FaBroadcastTower className="text-purple-400" />}>
          <p className="text-gray-300 text-sm leading-relaxed">La radio de SANAT reproduce <b>transmisiones públicas</b> que cada emisora ofrece en internet. El audio llega <b>directamente desde los servidores de cada emisora</b> al dispositivo de quien escucha: SANAT no lo aloja, no lo graba ni lo retransmite, y no cobra ni muestra publicidad sobre esas transmisiones.</p>
          <p className="text-gray-300 text-sm leading-relaxed">Los nombres, marcas y contenidos de cada radio pertenecen a sus respectivos dueños. Su inclusión no implica que exista una relación, auspicio o acuerdo con SANAT. Cuando la emisora tiene un sitio oficial verificado, lo mostramos en el reproductor.</p>
          <p className="text-gray-300 text-sm leading-relaxed">Si sos responsable de una emisora y preferís que no aparezca en SANAT, escribinos a <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-300 underline">{CONTACT_EMAIL}</a> y la quitamos a la brevedad.</p>
        </Section>

        {/* ---------------- CONTACTO ---------------- */}
        <Section id="contacto" title="Contacto" icon={<FaEnvelope className="text-purple-400" />}>
          <p className="text-gray-300 text-sm leading-relaxed">Para consultas, reclamos, solicitudes sobre tus datos o pedidos de baja de cuenta, escribinos a <a href={`mailto:${CONTACT_EMAIL}`} className="text-purple-300 underline">{CONTACT_EMAIL}</a>. Respondemos a la brevedad.</p>
        </Section>

        <p className="text-center text-xs text-gray-500 pb-6">SANAT · Hecho con música en Tucumán, Argentina</p>
      </div>
    </div>
  )
}
