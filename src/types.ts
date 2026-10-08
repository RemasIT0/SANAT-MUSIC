export interface Instrument {
  name: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Profesional';
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string;       // (Opcional, por si usamos imágenes después)
  avatar_color?: string;
  instruments: Instrument[];
  genres: string[];
  departamento: string;
  localidad: string;
  intention: string;
  created_at: string;
  updated_at: string;
}