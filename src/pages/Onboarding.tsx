// src/pages/Onboarding.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Mascot from '../components/Mascot'
import { 
  FaUser, 
  FaIdCard, 
  FaGuitar, 
  FaMusic, 
  FaMapMarkerAlt, 
  FaBullseye, 
  FaPalette 
} from 'react-icons/fa'

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
  "Tafí del Valle": ["Tafí del Valle", "Amaichá del Valle", "Colalao del Valle", "El Mollar", "Santa maria"],
  "Tafí Viejo": ["Tafí Viejo", "Anca Juli", "Choromoro", "El Cadillal", "La Esperanza", "Las Talitas", "Los Nogales", "Raco"],
  "Trancas": ["Trancas", "San Pedro de Colalao", "Tapia"],
  "Yerba Buena": ["Yerba Buena", "Cevil Redondo", "San Javier"],
  "Catamarca": ["Catamarca"],
}

const departamentos = Object.keys(tucumanLocations)
const coloresMascota = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedColor, setSelectedColor] = useState(coloresMascota[0])

  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    instrument: '',
    level: 'Intermedio',
    genres: '',
    departamento: 'Capital',
    localidad: 'San Miguel de Tucumán',
    intention: 'Busco banda'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'departamento') {
      setFormData({ 
        ...formData, 
        departamento: value, 
        localidad: tucumanLocations[value][0] 
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
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
          instruments: [{ name: formData.instrument, level: formData.level }],
          genres: formData.genres.split(',').map(g => g.trim()).filter(g => g !== ''),
          departamento: formData.departamento,
          localidad: formData.localidad,
          intention: formData.intention,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      
      navigate('/home') 
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 p-4 md:p-6 font-sans flex items-start justify-center">
      <div className="w-full max-w-5xl">
        
        {/* HEADER: Mascota + Identidad */}
        {/* items-center y text-center en móvil, md:items-start y md:text-left en PC */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 md:mb-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          
          {/* Mascota */}
          <div className="flex flex-col items-center bg-[#111] p-4 rounded-xl border border-[#2a2a2a] w-full md:w-auto">
            <Mascot color={selectedColor} size={100} />
            <div className="mt-4 flex gap-2 flex-wrap justify-center">
              {coloresMascota.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Seleccionar color ${color}`}
                />
              ))}
            </div>
            <FaPalette className="text-purple-500 mt-3" size={18} />
          </div>

          {/* Campos de identidad */}
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-4">Creá tu Perfil</h1>
            
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

            <div className="relative">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Contanos algo sobre vos..."
                rows={3}
                className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors resize-none text-center md:text-left placeholder:text-gray-600"
              />
            </div>
          </div>
        </div>

        {/* FORMULARIO: Grid */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 md:p-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            
            {/* Instrumento */}
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

            {/* Nivel */}
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

            {/* Géneros */}
            <div className="relative">
              <FaMusic className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                name="genres"
                value={formData.genres}
                onChange={handleChange}
                placeholder="Géneros (Rock, Indie...)"
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600"
              />
            </div>

            {/* Departamento */}
            <div className="relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                {departamentos.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            {/* Localidad */}
            <div>
              <select
                name="localidad"
                value={formData.localidad}
                onChange={handleChange}
                className="w-full p-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                {tucumanLocations[formData.departamento].map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Intención */}
            <div className="relative">
              <FaBullseye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <select
                name="intention"
                value={formData.intention}
                onChange={handleChange}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-purple-600 transition-colors"
              >
                <option>Busco banda</option>
                <option>Busco músicos para mi proyecto</option>
                <option>Ofrezco mis servicios (session musicial)</option>
                <option>Solo quiero conocer gente</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear Perfil'}
          </button>
        </form>
      </div>
    </div>
  )
}