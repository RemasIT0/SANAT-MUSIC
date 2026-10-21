// src/pages/Onboarding.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Mascot from '../components/Mascot'
import Toast from '../components/Toast'
import { FaUser, FaIdCard, FaGuitar, FaMapMarkerAlt, FaPalette, FaSpinner } from 'react-icons/fa'

const tucumanLocations: Record<string, string[]> = {
  "Burruyacú": ["Burruyacú", "El Chañar", "El Naranjo y El Sunchal", "El Puestito", "El Timbó", "Gobernador Garmendia", "Gobernador Piedrabuena", "La Ramada y La Cruz", "Padre Monti", "Siete de Abril", "Villa Benjamín Araoz"],
  "Capital": ["San Miguel de Tucumán"],
  "Chicligasta": ["Concepción", "Alpachiri y El Molino", "Alto Verde y Los Gucheas", "Arcadia", "Gastona y Belicha", "La Trinidad", "Medinas"],
  "Cruz Alta": ["Banda del Río Salí", "Alderetes", "Colombres", "Delfín Gallo", "El Bracho y El Cevilar", "El Naranjito", "La Florida y Luisiana", "Las Cejas", "Los Bulacio y Los Villagra", "Los Pereyra", "Los Pérez", "Los Ralos", "Ranchillos y San Miguel", "San Andrés"],
  "Famaillá": ["Famaillá"],
  "Graneros": ["Graneros", "Lamadrid", "Taco Ralo"],
  "Juan Bautista Alberdi": ["Juan Bautista Alberdi", "Escaba", "Villa Belgrano"],
  "La Cocha": ["La Cocha", "El Sacrificio", "Huasa Pampa", "Rumi Punco", "San Ignacio", "San José de la Cocha", "Yánima"],
  "Leales": ["Bella Vista", "Agua Dulce y La Soledad", "El Mojón", "Esquina y Mancopa", "Estación Araox y Tacanas", "Las Talas", "Los Gómez", "Los Puestos", "Manuel García Fernández", "Quilmes y Los Sueldos", "Río Colorado", "Santa Rosa de Leales", "Villa de Leales"],
  "Lules": ["Lules", "El Manantial", "San Felipe y Santa Bárbara", "San Pablo y Villa Nougués"],
  "Monteros": ["Monteros", "Acheral", "Amberes", "Capitán Cáceres", "El Cercado", "Los Sosas", "Río Seco", "Santa Lucía", "Santa Rosa y Los Rojo", "Sargento Moya", "Soldado Maldonado", "Teniente Berdina", "Villa Quinteros"],
  "Río Chico": ["Aguilares", "El Polear", "Los Sarmientos y La Tipa", "Monte Bello", "Santa Ana"],
  "Simoca": ["Simoca", "Atahona", "Buena Vista", "Ciudacita", "Manuela Pedraza", "Monteagudo", "Pampa Mayo", "Río Chico y Nueva Trinidad", "San Pedro y San Antonio", "Santa Cruz y La Tuna", "Villa Chigligasta", "Yerba Buena"],
  "Tafí del Valle": ["Tafí del Valle", "Amaichá del Valle", "Colalao del Valle", "El Mollar"],
  "Tafí Viejo": ["Tafí Viejo", "Anca Juli", "Choromoro", "El Cadillal", "La Esperanza", "Las Talitas", "Los Nogales", "Raco"],
  "Trancas": ["Trancas", "San Pedro de Colalao", "Tapia"],
  "Yerba Buena": ["Yerba Buena", "Cevil Redondo", "San Javier"]
}

const departamentos = Object.keys(tucumanLocations)

const GENEROS_FIJOS = [
  { name: 'Rock', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { name: 'Pop', color: 'bg-pink-500/20 text-pink-400 border-pink-500/50' },
  { name: 'Folklore', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
  { name: 'Cumbia', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { name: 'Jazz', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  { name: 'Electrónica', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
  { name: 'Metal', color: 'bg-gray-800/40 text-gray-300 border-gray-600' },       
  { name: 'Grunge', color: 'bg-stone-700/40 text-stone-300 border-stone-500' }    
]

// ✅ PALETA COMPLETA DE COLORES (Mascota y Tema)
const PALETA_COMPLETA = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', // Vibrantes
  '#06b6d4', '#84cc16', '#d946ef', // Neón
  '#475569', '#3f3f46', '#1e293b', // Oscuros
  '#e2e8f0', '#f8fafc'  // Claros
]

const coloresMascota = PALETA_COMPLETA
const coloresTema = PALETA_COMPLETA

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  
  // ✅ Estados para los colores (Mascota y Tema separados)
  const [selectedColor, setSelectedColor] = useState(coloresMascota[0])
  const [selectedTheme, setSelectedTheme] = useState('#a855f7') // Morado por defecto para el tema
  
  const [selectedExpression, setSelectedExpression] = useState<'normal' | 'feliz' | 'pensativo' | 'rockero'>('normal')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    instrument: '',
    level: 'Intermedio',
    genres: [] as string[],
    departamento: 'Capital',
    localidad: 'San Miguel de Tucumán'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'departamento') {
      setFormData({ ...formData, departamento: value, localidad: tucumanLocations[value][0] })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const toggleGenre = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) 
        ? prev.genres.filter(g => g !== genre) 
        : [...prev.genres, genre]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    // 🛡️ VALIDACIÓN DE USERNAME ÚNICO (Excluyendo al usuario actual)
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', formData.username)
      .neq('id', user.id) // ✅ ESTA LÍNEA ES LA MAGIA: Ignora si el perfil ya es tuyo
      .maybeSingle()

    if (existingUser) {
      setToast({ message: 'Ese nombre de usuario ya está en uso. Prueba con otro.', type: 'error' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_color: selectedColor,
          theme_color: selectedTheme,
          expression: selectedExpression,
          instruments: [{ name: formData.instrument, level: formData.level }],
          genres: formData.genres,
          departamento: formData.departamento,
          localidad: formData.localidad,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      setToast({ message: '¡Perfil creado con éxito!', type: 'success' })
      await refreshProfile() 
      
      setTimeout(() => {
        navigate('/home') 
      }, 1000)

    } catch (error: any) {
      setToast({ message: 'Error al guardar: ' + error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = 
    formData.username.trim().length > 0 &&
    formData.display_name.trim().length > 0 &&
    formData.instrument.trim().length > 0 &&
    formData.genres.length > 0

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-4 font-sans flex items-start justify-center">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          
          <div className="flex flex-col items-center bg-[#111] p-4 rounded-xl border border-[#2a2a2a] w-full md:w-auto">
            <Mascot color={selectedColor} size={100} expression={selectedExpression} />
            
            {/* ✅ SELECTOR 1: COLOR DE LA MASCOTA */}
            <div className="mt-4 w-full">
              <label className="block text-xs font-medium text-gray-400 mb-2 text-center">Color de tu Mascota</label>
              <div className="flex gap-2 flex-wrap justify-center">
                {coloresMascota.map((color) => (
                  <button
                    key={`mascot-${color}`}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* ✅ SELECTOR 2: COLOR DEL TEMA (BORDES) */}
            <div className="mt-6 w-full">
              <label className="block text-xs font-medium text-gray-400 mb-2 text-center">Color de tu Perfil (Bordes)</label>
              <div className="flex gap-2 flex-wrap justify-center">
                {coloresTema.map((color) => (
                  <button
                    key={`theme-${color}`}
                    type="button"
                    onClick={() => setSelectedTheme(color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      selectedTheme === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <FaPalette className="text-purple-500 mt-3" size={18} />

            <div className="mt-6 w-full">
              <label className="block text-xs font-medium text-gray-400 mb-2 text-center">¿Cómo se siente tu mascota hoy?</label>
              <div className="grid grid-cols-4 gap-2">
                {(['normal', 'feliz', 'pensativo', 'rockero'] as const).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setSelectedExpression(exp)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                      selectedExpression === exp
                        ? 'border-purple-600 bg-purple-900/20'
                        : 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-gray-500'
                    }`}
                  >
                    <Mascot color={selectedColor} size={40} expression={exp} />
                    <span className="text-[10px] text-gray-400 mt-1 capitalize">{exp}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Creá tu Perfil</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Nombre de usuario"
                  className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors text-center md:text-left placeholder:text-gray-600"
                />
              </div>
              <div className="relative">
                <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                  placeholder="Nombre para mostrar"
                  className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors text-center md:text-left placeholder:text-gray-600"
                />
              </div>
            </div>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Contanos algo sobre vos... (Opcional)"
              rows={2}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-center md:text-left placeholder:text-gray-600"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <FaGuitar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                name="instrument"
                value={formData.instrument}
                onChange={handleChange}
                required
                placeholder="Instrumento principal"
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600"
              />
            </div>
            <div>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                <option>Principiante</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
                <option>Profesional</option>
              </select>
            </div>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div>
              <select
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                {tucumanLocations[formData.departamento].map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Elegí tus géneros (mínimo 1)</label>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {GENEROS_FIJOS.map((genero) => {
                const isSelected = formData.genres.includes(genero.name)
                return (
                  <button
                    key={genero.name}
                    type="button"
                    onClick={() => toggleGenre(genero.name)}
                    className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
                      isSelected 
                        ? `${genero.color} scale-105 shadow-lg` 
                        : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {isSelected && '# '}{genero.name}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              loading || !isFormValid
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-purple-700 text-white hover:bg-purple-600 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]'
            }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Guardando...
              </>
            ) : (
              'Crear Perfil y Continuar'
            )}
          </button>
          
          {!isFormValid && !loading && (
            <p className="text-center text-xs text-gray-500 mt-3 animate-pulse">
              * Completa tu nombre, instrumento y elige al menos un género para continuar.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}