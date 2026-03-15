'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Share2, 
  ArrowRight,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useCommunityPulse, QuizQuestion } from '@/context/CommunityPulseContext';
import { useToast } from '@/components/Toast';
import { Confetti, useConfetti } from '@/components/Confetti';

const CLAUDE_API_KEY = "YOUR_API_KEY_HERE";

const SYSTEM_PROMPT = `You are CommunityPulse Quiz Generator. Generate exactly 5 quiz questions about React, JavaScript, and web development.
Return ONLY valid JSON in this exact format:
{"questions":[{"question":"string","options":["A","B","C","D"],"answer":"A","explanation":"string"}]}

Each question should have 4 options, with the answer being the letter (A, B, C, or D) of the correct option.`;

// Hardcoded demo quiz
const defaultQuiz: QuizQuestion[] = [
  {
    question: "What is the Virtual DOM in React?",
    options: [
      "A direct copy of the actual DOM",
      "A lightweight JavaScript representation of the real DOM",
      "A browser API for DOM manipulation",
      "A CSS styling system"
    ],
    answer: "B",
    explanation: "The Virtual DOM is a lightweight JavaScript representation of the real DOM that React uses to efficiently update the UI by comparing differences."
  },
  {
    question: "Which method is used to update state in a class component?",
    options: [
      "this.updateState()",
      "this.setState()",
      "this.changeState()",
      "this.modifyState()"
    ],
    answer: "B",
    explanation: "this.setState() is the method used to update state in React class components, triggering a re-render with the new state."
  },
  {
    question: "What is the purpose of useEffect hook?",
    options: [
      "To manage component state",
      "To handle side effects in functional components",
      "To create context providers",
      "To define component props"
    ],
    answer: "B",
    explanation: "useEffect is used to handle side effects like API calls, subscriptions, or DOM manipulations in functional components."
  },
  {
    question: "What does JSX stand for?",
    options: [
      "JavaScript XML",
      "Java Syntax Extension",
      "JavaScript Extension",
      "JSON XML"
    ],
    answer: "A",
    explanation: "JSX stands for JavaScript XML. It's a syntax extension that allows writing HTML-like code in JavaScript files."
  },
  {
    question: "Which hook is used to access context in functional components?",
    options: [
      "useState",
      "useEffect",
      "useContext",
      "useReducer"
    ],
    answer: "C",
    explanation: "useContext is the hook used to consume context values in functional components without nesting."
  }
];

type QuizState = 'intro' | 'playing' | 'result';

export default function QuizPage() {
  const [quizState, setQuizState] = useState<QuizState>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>(defaultQuiz);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [answerState, setAnswerState] = useState<'correct' | 'wrong' | null>(null);
  
  const { addScore, addBadge, addActivity, setCurrentQuiz, state } = useCommunityPulse();
  const { showToast } = useToast();
  const { showConfetti, triggerConfetti, handleComplete } = useConfetti();

  // Timer effect
  useEffect(() => {
    if (quizState !== 'playing' || showExplanation) return;
    
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, quizState, showExplanation]);

  const handleTimeUp = () => {
    if (!selectedAnswer) {
      setShowExplanation(true);
      setAnswerState('wrong');
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentQuestion].answer;
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      setScore(prev => prev + 100);
      setCorrectAnswers(prev => prev + 1);
    }
    
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswerState(null);
      setTimeLeft(10);
    } else {
      // Quiz complete
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const totalScore = score + (correctAnswers * 10); // Bonus points
    addScore(totalScore);
    addActivity({
      type: 'quiz',
      description: `Completed quiz with ${correctAnswers}/${questions.length} correct`,
      points: totalScore,
    });
    
    // Check for badges
    if (correctAnswers === questions.length) {
      addBadge('quiz-master');
      showToast('🏆 Badge Unlocked: Quiz Master!', 'badge');
    }
    
    if (!state.earnedBadges.find(b => b.id === 'first-step')?.earned) {
      addBadge('first-step');
      showToast('🎯 Badge Unlocked: First Step!', 'badge');
    }
    
    setQuizState('result');
    triggerConfetti();
  };

  const startQuiz = () => {
    setQuizState('playing');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(10);
    setAnswerState(null);
  };

  const generateNewQuiz = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: 'Generate 5 quiz questions about React, JavaScript, and modern web development.',
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      const content = data.content[0].text;
      const parsed = JSON.parse(content);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        const formattedQuestions: QuizQuestion[] = parsed.questions.map((q: any) => ({
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation,
        }));
        
        setQuestions(formattedQuestions);
        setCurrentQuiz({
          id: `quiz-${Date.now()}`,
          questions: formattedQuestions,
          createdAt: new Date().toISOString(),
        });
        
        showToast('New quiz generated!', 'success');
      }
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      showToast('Using default quiz (API unavailable)', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const shareScore = () => {
    const text = `I scored ${score + correctAnswers * 10} points on CommunityPulse quiz! 🔥 Can you beat my score?`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      showToast('Score copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <Confetti trigger={showConfetti} onComplete={handleComplete} />
      
      <div className="max-w-2xl mx-auto">
        {/* Intro State */}
        {quizState === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Daily Quiz Challenge</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Test your knowledge with 5 questions. Each correct answer earns you 100 points. 
              Answer quickly - you only have 10 seconds per question!
            </p>
            
            <div className="bg-card rounded-xl p-6 border border-border mb-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-400">5</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">10s</p>
                  <p className="text-xs text-muted-foreground">Per Question</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">+100</p>
                  <p className="text-xs text-muted-foreground">Per Correct</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={startQuiz}
                className="px-8 py-4 bg-purple-500 rounded-xl hover:bg-purple-600 transition-all hover:scale-105 flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <Sparkles className="w-5 h-5" />
                Start Quiz
              </button>
              <button
                onClick={generateNewQuiz}
                disabled={isLoading}
                className="px-8 py-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                Generate New Quiz
              </button>
            </div>
          </motion.div>
        )}

        {/* Playing State */}
        {quizState === 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {questions.length}
                </span>
                <span className="text-sm font-semibold text-purple-400">
                  Score: {score}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Timer */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Timer className={`w-4 h-4 ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : ''}`} />
                  <span className={timeLeft <= 3 ? 'text-red-400 font-bold' : ''}>
                    {timeLeft}s
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${timeLeft <= 3 ? 'bg-red-500' : 'bg-purple-500'}`}
                  animate={{ width: `${(timeLeft / 10) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-card rounded-xl p-6 border-2 transition-colors ${
                answerState === 'correct' ? 'border-green-500' :
                answerState === 'wrong' ? 'border-red-500' : 'border-border'
              }`}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                {questions[currentQuestion].question}
              </h2>

              <div className="grid gap-3">
                {questions[currentQuestion].options.map((option, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isSelected = selectedAnswer === letter;
                  const isCorrect = questions[currentQuestion].answer === letter;
                  const showResult = showExplanation;
                  
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleAnswerSelect(letter)}
                      disabled={showExplanation}
                      whileHover={!showExplanation ? { scale: 1.02 } : {}}
                      whileTap={!showExplanation ? { scale: 0.98 } : {}}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showResult
                          ? isCorrect
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : isSelected
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'bg-secondary border-border text-muted-foreground'
                          : isSelected
                            ? 'bg-purple-500/20 border-purple-500'
                            : 'bg-secondary border-border hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          showResult && isCorrect
                            ? 'bg-green-500 text-white'
                            : showResult && isSelected && !isCorrect
                              ? 'bg-red-500 text-white'
                              : 'bg-input'
                        }`}>
                          {showResult && isCorrect ? <CheckCircle className="w-4 h-4" /> :
                           showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                           letter}
                        </span>
                        <span className="flex-1">{option}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6"
                  >
                    <div className={`p-4 rounded-xl ${
                      answerState === 'correct'
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {answerState === 'correct' ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold text-green-400">Correct! +100 points</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400" />
                            <span className="font-semibold text-red-400">Wrong!</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {questions[currentQuestion].explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Next Button */}
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-end"
              >
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Result State */}
        {quizState === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <Trophy className="w-16 h-16 text-white" />
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h1>
            <p className="text-muted-foreground mb-8">Great effort! Here's how you did:</p>

            <div className="bg-card rounded-xl p-6 border border-border mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="text-4xl font-bold gradient-text"
                  >
                    {score + correctAnswers * 10}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
                <div className="text-center">
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.4 }}
                    className="text-4xl font-bold text-green-400"
                  >
                    {correctAnswers}/{questions.length}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">Correct Answers</p>
                </div>
              </div>
            </div>

            {correctAnswers === questions.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-8"
              >
                <p className="text-yellow-400 font-semibold">
                  🎉 Perfect Score! You've earned the Quiz Master badge!
                </p>
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={shareScore}
                className="px-6 py-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Score
              </button>
              <button
                onClick={() => setQuizState('intro')}
                className="px-6 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
