import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const QuickQuiz = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            // Logout failed
        }
    };
    const [step, setStep] = useState('setup'); // setup, generating, quiz, results
    const [formData, setFormData] = useState({
        topic: '',
        questionType: 'multiple_choice',
        count: 5,
        difficulty: 'medium'
    });
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const generateQuiz = async () => {
        if (!formData.topic.trim()) {
            setError('Please enter a topic');
            return;
        }

        setLoading(true);
        setError('');
        setStep('generating');

        try {
            const response = await axios.post(
                `${__API_URL__}/quizzes/generate`,
                {
                    topic: formData.topic,
                    difficulty: formData.difficulty,
                    question_type: formData.questionType,
                    count: parseInt(formData.count)
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setQuestions(response.data);
            setStep('quiz');
            setCurrentQuestionIndex(0);
            setAnswers({});
            setSelectedAnswer('');
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to generate quiz. Please try again.');
            setStep('setup');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = () => {
        if (!selectedAnswer) {
            setError('Please select an answer');
            return;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const newAnswers = {
            ...answers,
            [currentQuestion.id || currentQuestionIndex]: {
                question: currentQuestion.text,
                selectedAnswer: selectedAnswer,
                correctAnswer: currentQuestion.correct_answer,
                isCorrect: selectedAnswer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim(),
                explanation: currentQuestion.explanation
            }
        };

        setAnswers(newAnswers);
        setError('');

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer('');
        } else {
            // Quiz completed, show results
            calculateResults(newAnswers);
        }
    };

    const calculateResults = (finalAnswers) => {
        const totalQuestions = Object.keys(finalAnswers).length;
        const correctAnswers = Object.values(finalAnswers).filter(answer => answer.isCorrect).length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        setResults({
            totalQuestions,
            correctAnswers,
            wrongAnswers: totalQuestions - correctAnswers,
            score,
            answers: finalAnswers
        });
        setStep('results');
    };

    const startNewQuiz = () => {
        setStep('setup');
        setFormData({
            topic: '',
            questionType: 'multiple_choice',
            count: 5,
            difficulty: 'medium'
        });
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSelectedAnswer('');
        setResults(null);
        setError('');
    };

    const renderSetupForm = () => (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-8 md:p-12 border border-gray-200">
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        Create Your Quiz
                    </h1>
                    <p className="text-base text-gray-600">AI-powered question generation tailored to your needs</p>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-semibold text-gray-700">
                            Topic or Subject
                        </label>
                        <input
                            type="text"
                            name="topic"
                            value={formData.topic}
                            onChange={handleInputChange}
                            placeholder="e.g., Python Programming, Machine Learning, History..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">
                                Question Type
                            </label>
                            <select
                                name="questionType"
                                value={formData.questionType}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white cursor-pointer"
                            >
                                <option value="multiple_choice">Multiple Choice</option>
                                <option value="true_false">True or False</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">
                                Questions
                            </label>
                            <select
                                name="count"
                                value={formData.count}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white cursor-pointer"
                            >
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700">
                                Difficulty
                            </label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 bg-white cursor-pointer"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={generateQuiz}
                        disabled={loading}
                        className={`w-full py-4 px-6 rounded-md text-white font-semibold text-base transition-all duration-200 flex items-center justify-center gap-3 ${
                            loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <span>Generate Quiz</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderGenerating = () => (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-12 text-center border border-gray-200">
                <div className="mb-8">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Creating Your Quiz</h2>
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                    Generating <span className="font-semibold text-gray-900">{formData.count}</span> {formData.questionType.replace('_', ' ')} questions on <span className="font-semibold text-gray-900">{formData.topic}</span>
                </p>
                <p className="text-sm text-gray-500">This may take a few moments...</p>
            </div>
        </div>
    );

    const renderQuiz = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return <div className="flex items-center justify-center min-h-screen text-xl">Loading question...</div>;

        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="bg-white px-6 py-2 rounded-md shadow-sm border border-gray-200">
                        <span className="text-gray-900 font-semibold">{formData.topic}</span>
                    </div>
                    <div className="bg-white px-6 py-2 rounded-md shadow-sm border border-gray-200">
                        <span className="text-gray-700 font-medium">
                            Question {currentQuestionIndex + 1} <span className="text-gray-400 mx-2">/</span> {questions.length}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 border border-gray-200">
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
                        {currentQuestion.text}
                    </h2>

                    <div className="space-y-3 mb-8">
                        {currentQuestion.type === 'multiple_choice' ? (
                            currentQuestion.options?.map((option, index) => (
                                <label
                                    key={index}
                                    className={`flex items-center p-4 rounded-md cursor-pointer transition-all duration-200 border ${
                                        selectedAnswer === option
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option}
                                        checked={selectedAnswer === option}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 transition-all ${
                                        selectedAnswer === option
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-gray-400'
                                    }`}>
                                        {selectedAnswer === option && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-base text-gray-900 font-medium flex-1">{option}</span>
                                </label>
                            ))
                        ) : (
                            ['True', 'False'].map((option) => (
                                <label
                                    key={option}
                                    className={`flex items-center p-4 rounded-md cursor-pointer transition-all duration-200 border ${
                                        selectedAnswer === option
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="answer"
                                        value={option}
                                        checked={selectedAnswer === option}
                                        onChange={(e) => setSelectedAnswer(e.target.value)}
                                        className="hidden"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 transition-all ${
                                        selectedAnswer === option
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-gray-400'
                                    }`}>
                                        {selectedAnswer === option && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className="text-base text-gray-900 font-medium flex-1">{option}</span>
                                </label>
                            ))
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md mb-6">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        onClick={handleAnswerSubmit}
                        disabled={!selectedAnswer}
                        className={`w-full py-3 px-6 rounded-md text-white font-semibold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                            !selectedAnswer
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        }`}
                    >
                        {currentQuestionIndex < questions.length - 1 ? (
                            <span>Next Question</span>
                        ) : (
                            <span>Finish Quiz</span>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    const renderResults = () => {
        const getScoreColor = () => {
            if (results.score >= 80) return 'bg-green-600';
            if (results.score >= 60) return 'bg-yellow-500';
            return 'bg-red-600';
        };

        const getScoreMessage = () => {
            if (results.score >= 80) return 'Excellent Work!';
            if (results.score >= 60) return 'Good Job!';
            return 'Keep Practicing!';
        };

        return (
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* Score Card */}
                <div className="bg-white rounded-lg shadow-xl p-8 md:p-12 text-center border border-gray-200">
                    <div className={`w-40 h-40 mx-auto rounded-full ${getScoreColor()} flex flex-col items-center justify-center shadow-lg mb-8`}>
                        <div className="text-4xl md:text-5xl font-bold text-white">{results.score}%</div>
                        <div className="text-xs md:text-sm text-white/90 font-semibold uppercase tracking-wide mt-1">Score</div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{getScoreMessage()}</h2>
                    <p className="text-base text-gray-600">
                        You've completed the quiz on <span className="font-semibold text-gray-900">{formData.topic}</span>
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{results.totalQuestions}</div>
                        <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Total Questions</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
                        <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{results.correctAnswers}</div>
                        <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Correct Answers</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center border border-gray-200">
                        <div className="text-3xl md:text-4xl font-bold text-red-600 mb-2">{results.wrongAnswers}</div>
                        <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">Incorrect Answers</div>
                    </div>
                </div>

                {/* Answer Review */}
                <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 border border-gray-200">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Answer Review</h3>
                    <div className="space-y-4">
                        {Object.values(results.answers).map((answer, index) => (
                            <div 
                                key={index} 
                                className={`p-5 rounded-lg border transition-all ${
                                    answer.isCorrect 
                                        ? 'bg-green-50 border-green-300' 
                                        : 'bg-red-50 border-red-300'
                                }`}
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                                    <span className="font-semibold text-gray-900 text-sm">Question {index + 1}</span>
                                    <span className={`px-3 py-1 rounded-md text-xs font-semibold text-white ${
                                        answer.isCorrect ? 'bg-green-600' : 'bg-red-600'
                                    }`}>
                                        {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                    </span>
                                </div>
                                <div className="text-base font-semibold text-gray-900 mb-3">{answer.question}</div>
                                <div className="text-sm text-gray-700 mb-2">
                                    <strong>Your Answer:</strong> {answer.selectedAnswer}
                                </div>
                                {!answer.isCorrect && (
                                    <div className="text-sm text-gray-700 mb-2">
                                        <strong>Correct Answer:</strong> {answer.correctAnswer}
                                    </div>
                                )}
                                {answer.explanation && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                                        <div className="text-sm text-gray-700 leading-relaxed">
                                            <strong className="text-gray-900">Explanation:</strong> {answer.explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-center pt-4">
                    <button 
                        onClick={startNewQuiz} 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                    >
                        <span>Start New Quiz</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 md:py-5">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                QuizMaster AI
                            </h1>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {currentUser && (
                                <>
                                    <div className="text-sm text-gray-600 hidden md:block">
                                        {currentUser.displayName || currentUser.email}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>
            
            {/* Main Content */}
            <main className="flex-1">
                {step === 'setup' && renderSetupForm()}
                {step === 'generating' && renderGenerating()}
                {step === 'quiz' && renderQuiz()}
                {step === 'results' && renderResults()}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-4 text-center">
                <p className="text-sm text-gray-600">Powered by AI</p>
            </footer>
        </div>
    );
};

export default QuickQuiz;
