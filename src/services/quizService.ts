
import { Question } from '../constants/gameData';

export const QUIZ_URLS = {
  atencion: "https://raw.githubusercontent.com/MisaelErik/Recursos-del-proyecto-chifa/refs/heads/main/examen/Atenci%C3%B3n%20y%20Servicio",
  codigo: "https://raw.githubusercontent.com/MisaelErik/Recursos-del-proyecto-chifa/refs/heads/main/examen/C%C3%B3digos%20de%20Platos",
  ingredientes: "https://raw.githubusercontent.com/MisaelErik/Recursos-del-proyecto-chifa/refs/heads/main/examen/Ingredientes%20de%20Platos"
};

export type QuizCategory = keyof typeof QUIZ_URLS;

interface RawGithubQuestion {
  id: string;
  mode: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export async function fetchQuizQuestions(category: QuizCategory): Promise<Question[]> {
  try {
    const response = await fetch(QUIZ_URLS[category]);
    if (!response.ok) throw new Error(`Failed to fetch ${category} questions`);
    
    const data: RawGithubQuestion[] = await response.json();
    
    return data.map((raw) => {
      // Find the index of the correct answer in the options array
      const correctIndex = raw.options.findIndex(opt => opt === raw.correctAnswer);
      
      return {
        id: raw.id,
        text: raw.question,
        options: raw.options,
        correctAnswer: correctIndex !== -1 ? correctIndex : 0,
        points: category === 'atencion' ? 15 : category === 'codigo' ? 10 : 20,
        explanation: raw.explanation
      };
    });
  } catch (error) {
    console.error(`Error fetching quiz questions for ${category}:`, error);
    return [];
  }
}
