export interface Instrument {
  name: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Profesional';
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url?: string;       
  avatar_color?: string;
  mascot_style?: string;
  instruments: Instrument[];
  genres: string[];
  departamento: string;
  localidad: string;
  intention: string;
  created_at: string;
  updated_at: string;
}