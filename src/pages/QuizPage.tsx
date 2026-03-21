
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useMenuStore } from '../store/useMenuStore';
import { useToastStore } from '../store/useToastStore';
import { getRankByPoints, ACHIEVEMENTS, Question } from '../constants/gameData';
import { fetchQuizQuestions, QuizCategory } from '../services/quizService';
import { Trophy, CheckCircle2, XCircle, Brain, ArrowRight, RotateCcw, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { GuestBlocker } from '../components/auth/GuestBlocker';

export function QuizPage() {
  const { profile, updateProfile, setQuizInProgress } = useAppStore();
  const { items: menuItems, isLoaded: isMenuLoaded, fetchMenu } = useMenuStore();
  const { userRole } = useAuthStore();
  const { addToast } = useToastStore();
  const [searchParams] = useSearchParams();

  if (userRole === 'guest') {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="ACCESO DENEGADO" 
          description="Para realizar exámenes y ganar puntos, debes iniciar sesión. El entrenamiento imperial es exclusivo para el staff registrado."
        />
      </PageWrapper>
    );
  }
  
  const initialMode = searchParams.get('mode') as 'standard' | 'raw' | null;
  const category = searchParams.get('category') || 'general';

  const [mode, setMode] = useState<'standard' | 'raw' | null>(initialMode);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [rawAnswer, setRawAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeTaken, setTimeTaken] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (category === 'menu' && !isMenuLoaded) {
      fetchMenu();
    }
  }, [category, isMenuLoaded, fetchMenu]);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      
      // Map 'general' or undefined to 'atencion' as default if needed
      // but TrainingPage now sets explicit categories
      const quizCategory = (category as QuizCategory) || 'atencion';
      
      const fetchedQuestions = await fetchQuizQuestions(quizCategory);
      
      // Shuffle and take 5
      const shuffled = [...fetchedQuestions].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, 5));
      setLoading(false);
    };

    loadQuestions();
  }, [category]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (mode && questions.length > 0) {
      setStartTime(Date.now());
      setQuizInProgress(true);
    } else if (!mode) {
      setQuizInProgress(false);
    }
  }, [mode, questions, setQuizInProgress]);

  // Warn before leaving page (browser level)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mode && !quizCompleted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setQuizInProgress(false);
    };
  }, [mode, quizCompleted, setQuizInProgress]);

  const handleOptionSelect = (index: number) => {
    if (showResult) return;
    setSelectedOption(index);
  };

  const handleRawSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (showResult || !rawAnswer.trim()) return;
    handleNext();
  };

  const handleNext = async () => {
    if (mode === 'standard' && selectedOption === null) return;
    if (mode === 'raw' && !rawAnswer.trim()) return;

    let isCorrect = false;
    if (mode === 'standard') {
      isCorrect = selectedOption === currentQuestion.correctAnswer;
    } else {
      const correctText = currentQuestion.options[currentQuestion.correctAnswer].toLowerCase().trim();
      const userText = rawAnswer.toLowerCase().trim();
      // Simple fuzzy match or exact match
      isCorrect = userText === correctText;
    }

    if (isCorrect) {
      setScore(prev => prev + (mode === 'raw' ? currentQuestion.points * 2 : currentQuestion.points));
      setCorrectCount(prev => prev + 1);
      setCurrentStreak(prev => prev + 1);
    } else {
      setCurrentStreak(0);
    }

    setShowResult(true);

    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setRawAnswer('');
        setShowResult(false);
      } else {
        // Quiz completed
        const endTime = Date.now();
        const finalTimeTaken = Math.floor((endTime - startTime) / 1000);
        setTimeTaken(finalTimeTaken);
        setQuizCompleted(true);
        setQuizInProgress(false);
        
        if (profile) {
          const finalCorrectCount = isCorrect ? correctCount + 1 : correctCount;
          const finalScore = score + (isCorrect ? (mode === 'raw' ? currentQuestion.points * 2 : currentQuestion.points) : 0);
          const newPoints = profile.points + finalScore;
          const newRank = getRankByPoints(newPoints).name;
          const isPerfect = finalCorrectCount === questions.length;
          
          // Achievement Logic
          const newAchievements = [...(profile.achievements || [])];
          
          // 1. Maestro del Quiz (First 100%)
          if (isPerfect && !newAchievements.includes('quiz_master')) {
            newAchievements.push('quiz_master');
            addToast('¡Logro desbloqueado: Maestro del Quiz!', 'success');
          }
          
          // 2. Speed Demon (< 30s)
          if (finalTimeTaken < 30 && !newAchievements.includes('speed_demon')) {
            newAchievements.push('speed_demon');
            addToast('¡Logro desbloqueado: Demonio de la Velocidad!', 'success');
          }
          
          // 3. Streak 5
          if (currentStreak >= 5 && !newAchievements.includes('streak_5')) {
            newAchievements.push('streak_5');
            addToast('¡Logro desbloqueado: Racha de Fuego!', 'success');
          }
          
          // 4. Ten in a row (if quiz has 10+ questions, or cumulative?)
          // Let's assume cumulative best streak
          const updatedBestStreak = Math.max(profile.bestStreak || 0, currentStreak);
          if (updatedBestStreak >= 10 && !newAchievements.includes('ten_in_a_row')) {
            newAchievements.push('ten_in_a_row');
            addToast('¡Logro desbloqueado: Imparable!', 'success');
          }
          
          // 5. Perfect Streak 5 (5 perfect exams)
          const updatedPerfectExams = isPerfect ? (profile.perfectExams || 0) + 1 : (profile.perfectExams || 0);
          if (updatedPerfectExams >= 5 && !newAchievements.includes('perfect_streak_5')) {
            newAchievements.push('perfect_streak_5');
            addToast('¡Logro desbloqueado: Perfección Imperial!', 'success');
          }

          const updatedExamsCompleted = (profile.examsCompleted || 0) + 1;
          const updatedBestTime = profile.bestTime === 0 ? finalTimeTaken : Math.min(profile.bestTime || 9999, finalTimeTaken);

          // Update Firestore
          try {
            // 1. Save Quiz History
            await addDoc(collection(db, 'quizzes'), {
              userId: profile.uid,
              score: finalScore,
              totalQuestions: questions.length,
              correctAnswers: finalCorrectCount,
              timeTaken: finalTimeTaken,
              timestamp: new Date().toISOString(),
              mode: mode,
              category: category
            });

            // 2. Update User Profile
            const userRef = doc(db, 'users', profile.uid);
            const profileUpdates = {
              points: newPoints,
              rank: newRank,
              examsCompleted: updatedExamsCompleted,
              achievements: newAchievements,
              bestStreak: updatedBestStreak,
              perfectExams: updatedPerfectExams,
              bestTime: updatedBestTime,
              accuracy: Math.round(((profile.accuracy * profile.examsCompleted + (finalCorrectCount / questions.length * 100)) / updatedExamsCompleted))
            };
            
            await updateDoc(userRef, profileUpdates);
            
            // Update local state
            updateProfile(profileUpdates);
            addToast(`¡Examen guardado en el registro imperial! Ganaste ${finalScore} puntos.`, 'success');
          } catch (error) {
            console.error("Error updating quiz data:", error);
          }
        }
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setQuizInProgress(false);
    setMode(null);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setRawAnswer('');
    setShowResult(false);
    setScore(0);
    setCorrectCount(0);
    setQuizCompleted(false);
    setStartTime(Date.now());
    setCurrentStreak(0);
  };

  if (loading) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-gold-champagne border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-gray-500">Preparando Evaluación Imperial...</p>
        </div>
      </PageWrapper>
    );
  }

  if (questions.length === 0) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold font-heading uppercase tracking-tighter">ARCHIVOS NO ENCONTRADOS</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest max-w-md">
            No se pudieron cargar las preguntas desde los archivos imperiales de GitHub. Por favor, verifica la conexión o intenta más tarde.
          </p>
        </div>
        <Button onClick={() => window.history.back()} variant="outline">VOLVER AL CENTRO</Button>
      </PageWrapper>
    );
  }

  if (!mode) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold font-heading uppercase tracking-tighter">MODOS DE <span className="gold-text">ENTRENAMIENTO</span></h1>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Selecciona tu nivel de desafío imperial</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <PremiumCard 
            className="p-8 flex flex-col items-center text-center space-y-4 cursor-pointer hover:border-gold-champagne/50 transition-all group"
            onClick={() => setMode('standard')}
          >
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-heading">MODO ESTÁNDAR</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Evaluación clásica con selección múltiple. Ideal para aprender y repasar los conceptos básicos.
            </p>
            <div className="pt-4 w-full">
              <Button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30">SELECCIONAR</Button>
            </div>
          </PremiumCard>

          <PremiumCard 
            className="p-8 flex flex-col items-center text-center space-y-4 cursor-pointer hover:border-dragon-red/50 transition-all group border-dragon-red/20"
            onClick={() => setMode('raw')}
          >
            <div className="w-16 h-16 bg-dragon-red/20 rounded-2xl flex items-center justify-center text-dragon-red group-hover:scale-110 transition-transform">
              <Brain className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold font-heading">MODO RAW</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              <span className="text-dragon-red font-bold">Rapid Answer Writing.</span> Sin opciones. Escribe la respuesta directamente. ¡Doble puntaje!
            </p>
            <div className="pt-4 w-full">
              <Button className="w-full bg-dragon-red/20 hover:bg-dragon-red/30 text-dragon-red border-dragon-red/30">SELECCIONAR</Button>
            </div>
          </PremiumCard>
        </div>
      </PageWrapper>
    );
  }

  if (quizCompleted) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-md w-full"
        >
          <div className="w-24 h-24 bg-gold-champagne/20 rounded-full flex items-center justify-center mx-auto border-2 border-gold-champagne animate-bounce">
            <Trophy className="w-12 h-12 text-gold-champagne" />
          </div>
          <h1 className="text-3xl font-bold font-heading uppercase tracking-tighter">¡EXAMEN COMPLETADO!</h1>
          <PremiumCard className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Puntaje</div>
                <div className="text-2xl font-bold font-mono text-gold-champagne">{score}</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Precisión</div>
                <div className="text-2xl font-bold font-mono text-white">{Math.round((correctCount / questions.length) * 100)}%</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-gray-400">
                <span>Progreso</span>
                <span>{correctCount} / {questions.length}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-dragon-red" 
                  style={{ width: `${(correctCount / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <p className="text-gray-500 text-xs leading-relaxed">
              Tus conocimientos imperiales han sido registrados en los archivos del Sol. Sigue entrenando para alcanzar la maestría absoluta.
            </p>
          </PremiumCard>
          <div className="flex space-x-4">
            <Button onClick={resetQuiz} className="flex-1 bg-white/5 hover:bg-white/10 text-white border-none rounded-2xl">
              <RotateCcw className="w-4 h-4 mr-2" /> REINTENTAR
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1 bg-dragon-red hover:bg-dragon-red-dark text-white border-none rounded-2xl">
              VOLVER
            </Button>
          </div>
        </motion.div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <Brain className="w-8 h-8 mr-3 text-gold-champagne" />
            CENTRO DE <span className="gold-text ml-2">EVALUACIÓN</span>
          </h1>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-400 text-[10px] md:text-xs font-mono uppercase tracking-widest">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
            <div className="flex items-center text-gold-champagne/70 text-[10px] font-mono">
              <Timer className="w-3 h-3 mr-1" />
              {Math.floor((Date.now() - startTime) / 1000)}s
            </div>
          </div>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          <span className="text-gold-champagne font-bold font-mono text-lg">{score}</span>
          <span className="text-[10px] text-gray-500 ml-1 uppercase tracking-widest">pts</span>
        </div>
      </div>

      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gold-champagne"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PremiumCard className="p-6 md:p-10 space-y-8">
            <h2 className="text-xl md:text-2xl font-bold text-center leading-relaxed">
              {currentQuestion.text}
            </h2>

            {currentQuestion.explanation && showResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gold-champagne/10 border border-gold-champagne/20 p-4 rounded-xl text-sm italic text-gold-champagne/90"
              >
                {currentQuestion.explanation}
              </motion.div>
            )}

            {mode === 'standard' ? (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOption === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  
                  let bgColor = 'bg-white/5 hover:bg-white/10 border-white/10';
                  if (showResult) {
                    if (isCorrect) bgColor = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500';
                    else if (isSelected) bgColor = 'bg-red-500/20 border-red-500/50 text-red-500';
                    else bgColor = 'bg-white/5 border-white/5 opacity-50';
                  } else if (isSelected) {
                    bgColor = 'bg-gold-champagne/20 border-gold-champagne text-gold-champagne';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleOptionSelect(index)}
                      disabled={showResult}
                      className={`w-full p-4 md:p-6 rounded-2xl border text-left transition-all flex items-center justify-between group ${bgColor}`}
                    >
                      <span className="font-medium">{option}</span>
                      {showResult && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                      {showResult && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <form onSubmit={handleRawSubmit} className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    value={rawAnswer}
                    onChange={(e) => setRawAnswer(e.target.value)}
                    disabled={showResult}
                    autoFocus
                    placeholder="Escribe tu respuesta aquí..."
                    className={`w-full bg-black/40 border-2 rounded-2xl py-6 px-8 text-xl font-bold text-center outline-none transition-all ${
                      showResult 
                        ? (rawAnswer.toLowerCase().trim() === currentQuestion.options[currentQuestion.correctAnswer].toLowerCase().trim()
                            ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                            : 'border-red-500 text-red-500 bg-red-500/10')
                        : 'border-white/10 focus:border-gold-champagne'
                    }`}
                  />
                  {showResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mt-4"
                    >
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Respuesta Correcta:</p>
                      <p className="text-lg font-bold text-gold-champagne uppercase">{currentQuestion.options[currentQuestion.correctAnswer]}</p>
                    </motion.div>
                  )}
                </div>
              </form>
            )}

            <Button 
              onClick={mode === 'standard' ? handleNext : () => handleRawSubmit()}
              disabled={(mode === 'standard' ? selectedOption === null : !rawAnswer.trim()) || showResult}
              className="w-full py-4 bg-dragon-red hover:bg-dragon-red-dark text-white border-none rounded-2xl font-bold text-lg"
            >
              {showResult ? 'PROCESANDO...' : 'CONFIRMAR'} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </PremiumCard>
        </motion.div>
      </AnimatePresence>
    </PageWrapper>
  );
}
