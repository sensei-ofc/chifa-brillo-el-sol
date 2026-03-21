
export interface Rank {
  name: string;
  minPoints: number;
  color: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { name: 'Aprendiz', minPoints: 0, color: '#94a3b8', icon: '🍳' },
  { name: 'Ayudante de Cocina', minPoints: 100, color: '#fbbf24', icon: '🔪' },
  { name: 'Cocinero de Wok', minPoints: 300, color: '#f59e0b', icon: '🔥' },
  { name: 'Maestro Chifero', minPoints: 600, color: '#ef4444', icon: '🐉' },
  { name: 'Chef Imperial', minPoints: 1000, color: '#d946ef', icon: '👑' },
  { name: 'Gran Maestro del Sol', minPoints: 2000, color: '#D4AF37', icon: '☀️' },
  { name: 'Dragón de Oro', minPoints: 3500, color: '#FFD700', icon: '🐲' },
  { name: 'Leyenda del Brillo', minPoints: 5000, color: '#00FFFF', icon: '✨' },
  { name: 'Emperador Eterno', minPoints: 10000, color: '#FF0000', icon: '💎' },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_login', title: 'Primer Paso', description: 'Iniciaste sesión por primera vez.', icon: '🚀', points: 10 },
  { id: 'quiz_master', title: 'Maestro del Quiz', description: 'Completaste tu primer examen con 100%.', icon: '🧠', points: 50 },
  { id: 'menu_expert', title: 'Experto en la Carta', description: 'Consultaste todos los platos del menú.', icon: '📖', points: 30 },
  { id: 'social_butterfly', title: 'Mariposa Social', description: 'Interactuaste con Marley más de 10 veces.', icon: '🦋', points: 20 },
  { id: 'imperial_chef', title: 'Rango Imperial', description: 'Alcanzaste el rango de Chef Imperial.', icon: '🏰', points: 100 },
  { id: 'speed_demon', title: 'Demonio de la Velocidad', description: 'Completaste un examen en menos de 30 segundos.', icon: '⚡', points: 50 },
  { id: 'streak_5', title: 'Racha de Fuego', description: 'Lograste una racha de 5 respuestas correctas seguidas.', icon: '🔥', points: 40 },
  { id: 'ten_in_a_row', title: 'Imparable', description: 'Lograste una racha de 10 respuestas correctas seguidas.', icon: '⚔️', points: 80 },
  { id: 'perfect_streak_5', title: 'Perfección Imperial', description: 'Completaste 5 exámenes con 100% de precisión.', icon: '💎', points: 150 },
];

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export const getRankByPoints = (points: number): Rank => {
  return [...RANKS].reverse().find(r => points >= r.minPoints) || RANKS[0];
};
