import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { FaSearch, FaMapMarkerAlt, FaMusic, FaGuitar, FaSignOutAlt, FaUser } from 'react-icons/fa'

const mockMusicians = [
  {
    id: '1',
    display_name: 'Martín G.',
    username: 'martin_guitar',
    avatar_color: '#10b981', // Verde
    instrument: 'Guitarra Eléctrica',
    level: 'Avanzado',
    genres: ['Rock', 'Blues', 'Indie'],
    departamento: 'Capital',
    localidad: 'San Miguel de Tucumán',
    intention: 'Busco banda'
  },
  {
    id: '2',
    display_name: 'Lucía P.',
    username: 'lucia_drums',
    avatar_color: '#ec4899', 
    instrument: 'Batería',
    level: 'Intermedio',
    genres: ['Pop', 'Rock', 'Funk'],
    departamento: 'Yerba Buena',
    localidad: 'Yerba Buena',
    intention: 'Busco músicos para mi proyecto'
  },
  {
    id: '3',
    display_name: 'Santiago R.',
    username: 'santi_bass',
    avatar_color: '#f59e0b', 
    instrument: 'Bajo',
    level: 'Profesional',
    genres: ['Jazz', 'Fusión', 'Soul'],
    departamento: 'Tafí Viejo',
    localidad: 'Las Talitas',
    intention: 'Ofrezco mis servicios (session musician)'
  },
  {
    id: '4',
    display_name: 'Valentina M.',
    username: 'vale_voice',
    avatar_color: '#8b5cf6', 
    instrument: 'Voz',
    level: 'Intermedio',
    genres: ['Folklore', 'Pop', 'Acústico'],
    departamento: 'Tafí del Valle',
    localidad: 'El Mollar',
    intention: 'Busco banda'
  }
]

const departamentos = ['Todos', 'Capital', 'Yerba Buena', 'Tafí Viejo', 'Lules', 'Tafí del Valle', 'Monteros', 'Concepción']

export default function Home() {
  const { signOut, profile } = useAuth()
  
  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterInstrument, setFilterInstrument] = useState('')
  const [filterDepartamento, setFilterDepartamento] = useState('Todos')

  // Lógica de filtrado
  const filteredMusicians = mockMusicians.filter(m => {
    const matchesSearch = m.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesInstrument = filterInstrument === '' || m.instrument.toLowerCase().includes(filterInstrument.toLowerCase())
    const matchesDepartamento = filterDepartamento === 'Todos' || m.departamento === filterDepartamento
    
    return matchesSearch && matchesInstrument && matchesDepartamento
  })

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-200 font-sans">
      
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-40 bg-[#1a1a1a]/90 backdrop-blur-md border-b border-[#2a2a2a] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mascota del usuario logueado */}
            <div 
              className="w-10 h-10 rounded-lg border border-[#2a2a2a] flex items-center justify-center"
              style={{ backgroundColor: profile?.avatar_color || '#333' }}
            >
              <FaUser className="text-white/80" size={18} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Hola, {profile?.display_name || profile?.username}</h2>
              <p className="text-gray-500 text-xs">{profile?.localidad}, {profile?.departamento}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <FaSignOutAlt size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* SECCIÓN DE FILTROS */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FaSearch className="text-purple-500" size={18} />
            <h3 className="text-white font-semibold">Buscar Músicos</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600"
              />
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            </div>

            {/* Filtro por Instrumento */}
            <div className="relative">
              <input
                type="text"
                placeholder="Instrumento (Ej: Guitarra)"
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-600"
              />
              <FaGuitar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
            </div>

            {/* Filtro por Departamento */}
            <div className="relative">
              <select
                value={filterDepartamento}
                onChange={(e) => setFilterDepartamento(e.target.value)}
                className="w-full p-3 pl-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:outline-none focus:border-purple-600 transition-colors appearance-none"
              >
                {departamentos.map(dep => (
                  <option key={dep} value={dep}>{dep === 'Todos' ? 'Todos los departamentos' : dep}</option>
                ))}
              </select>
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              {/* Flechita custom para el select */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* GRID DE MÚSICOS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FaMusic className="text-purple-500" />
              Músicos encontrados ({filteredMusicians.length})
            </h3>
          </div>

          {filteredMusicians.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
              <p className="text-gray-500 text-lg">No se encontraron músicos con esos filtros.</p>
              <button 
                onClick={() => { setSearchTerm(''); setFilterInstrument(''); setFilterDepartamento('Todos'); }}
                className="mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMusicians.map((musician) => (
                <div 
                  key={musician.id} 
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-purple-600/50 transition-all duration-300 group cursor-pointer"
                >
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl border border-[#2a2a2a] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: musician.avatar_color }}
                    >
                      <FaUser className="text-white/80" size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-bold text-lg truncate">{musician.display_name}</h4>
                      <p className="text-gray-500 text-sm truncate">@{musician.username}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <FaMapMarkerAlt size={10} />
                        <span>{musician.localidad}, {musician.departamento}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FaGuitar className="text-purple-500 flex-shrink-0" size={14} />
                      <span className="text-gray-300">{musician.instrument}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-400">{musician.level}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {musician.genres.map((genre, idx) => (
                        <span key={idx} className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md text-xs text-gray-400">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Intención / Badge */}
                  <div className="pt-3 border-t border-[#2a2a2a]">
                    <span className="inline-block px-3 py-1.5 bg-purple-900/30 border border-purple-700/50 text-purple-300 text-xs font-medium rounded-full">
                      {musician.intention}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}