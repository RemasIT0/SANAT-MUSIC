// src/pages/EditarPerfil.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Mascot from '../components/Mascot'
import { MASCOT_STYLES, type MascotStyleType } from '../components/MascotStyles'
import { FaUser, FaIdCard, FaGuitar, FaMapMarkerAlt, FaBullseye, FaPalette, FaArrowLeft, FaSpinner } from 'react-icons/fa'

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
  { name: 'Indie', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' }
]

const coloresMascota = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function EditarPerfil() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  // Estados inicializados con los datos actuales del perfil
  const [selectedColor, setSelectedColor] = useState(profile?.avatar_color || coloresMascota[0])
  const [selectedStyle, setSelectedStyle] = useState<MascotStyleType>((profile?.mascot_style as MascotStyleType) || 'clasico')

  const [formData, setFormData] = useState({
    username: profile?.username || '',
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    instrument: profile?.instruments?.[0]?.name || '',
    level: profile?.instruments?.[0]?.level || 'Intermedio',
    genres: profile?.genres || [],
    departamento: profile?.departamento || 'Capital',
    localidad: profile?.localidad || 'San Miguel de Tucumán',
    intention: profile?.intention || 'Busco banda'
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

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_color: selectedColor,
          mascot_style: selectedStyle,
          instruments: [{ name: formData.instrument, level: formData.level }],
          genres: formData.genres,
          departamento: formData.departamento,
          localidad: formData.localidad,
          intention: formData.intention,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      
      navigate(`/perfil/${user.id}`) 
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-4 font-sans flex items-start justify-center">
      <div className="w-full max-w-5xl">
        
        {/* Header con botón volver */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
          <FaArrowLeft /> Volver a mi perfil
        </button>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          <div className="flex flex-col items-center bg-[#111] p-4 rounded-xl border border-[#2a2a2a] w-full md:w-auto">
            <Mascot color={selectedColor} size={100} style={selectedStyle} />
            
            <div className="mt-4 flex gap-2 flex-wrap justify-center">
              {coloresMascota.map((color) => (
                <button key={color} type="button" onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
            <FaPalette className="text-purple-500 mt-3" size={18} />

            {/* Selector de ESTILOS */}
            <div className="mt-6 w-full">
              <label className="block text-xs font-medium text-gray-400 mb-2 text-center">Elegí tu estilo</label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(MASCOT_STYLES) as MascotStyleType[]).map((styleKey) => (
                  <button key={styleKey} type="button" onClick={() => setSelectedStyle(styleKey)}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                      selectedStyle === styleKey ? 'border-purple-600 bg-purple-900/20' : 'border-[#2a2a2a] bg-[#0f0f0f] hover:border-gray-500'
                    }`}>
                    <span className="text-2xl mb-1">{MASCOT_STYLES[styleKey].emoji}</span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">{MASCOT_STYLES[styleKey].name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Editar tu Perfil</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input name="username" value={formData.username} onChange={handleChange} required placeholder="Nombre de usuario"
                  className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors text-center md:text-left placeholder:text-gray-600" />
              </div>
              <div className="relative">
                <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input name="display_name" value={formData.display_name} onChange={handleChange} required placeholder="Nombre para mostrar"
                  className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors text-center md:text-left placeholder:text-gray-600" />
              </div>
            </div>
            <textarea name="bio" value={formData.bio} onChange={handleChange} placeholder="Contanos algo sobre vos..." rows={2}
              className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-center md:text-left placeholder:text-gray-600" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <FaGuitar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input name="instrument" value={formData.instrument} onChange={handleChange} required placeholder="Instrumento principal"
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600" />
            </div>
            <div>
              <select name="level" value={formData.level} onChange={handleChange} className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors">
                <option>Principiante</option><option>Intermedio</option><option>Avanzado</option><option>Profesional</option>
              </select>
            </div>
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select name="departamento" value={formData.departamento} onChange={handleChange} className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors">
                {departamentos.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </div>
            <div>
              <select name="localidad" value={formData.localidad} onChange={handleChange} className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors">
                {tucumanLocations[formData.departamento].map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="relative">
              <FaBullseye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select name="intention" value={formData.intention} onChange={handleChange} className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors">
                <option>Busco banda</option><option>Busco músicos para mi proyecto</option>
                <option>Ofrezco mis servicios (session musician)</option><option>Solo quiero conocer gente</option>
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Elegí tus géneros</label>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {GENEROS_FIJOS.map((genero) => {
                const isSelected = formData.genres.includes(genero.name)
                return (
                  <button key={genero.name} type="button" onClick={() => toggleGenre(genero.name)}
                    className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
                      isSelected ? `${genero.color} scale-105 shadow-lg` : 'bg-[#0f0f0f] border-[#2a2a2a] text-gray-500 hover:border-gray-500'
                    }`}>
                    {isSelected && '# '}{genero.name}
                  </button>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><FaSpinner className="animate-spin" /> Guardando cambios...</> : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}