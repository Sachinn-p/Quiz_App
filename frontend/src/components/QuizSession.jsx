import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const QuizSession = ({ token }) => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [quiz, setQuiz] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const sessionIdFromUrl = urlParams.get('session');
        
        if (sessionIdFromUrl) {
            setSessionId(sessionIdFromUrl);
            fetchQuiz();
        } else {
            startQuizSession();
        }
    }, [quizId]);

    useEffect(() => {
        if (quiz && quiz.time_limit && !isSubmitted) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [quiz, isSubmitted]);

    const startQuizSession = async () => {
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/quiz-sessions',
                null,
                {
                    params: { quiz_id: quizId },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            
            setSessionId(response.data.session_id);
            fetchQuiz();
        } catch (error) {
            setError('Failed to start quiz session');
            console.error('Error starting quiz session:', error);
        }
    };

    const fetchQuiz = async () => {
        try {
            const response = await axios.get(
                `http://127.0.0.1:8000/quizzes/${quizId}`,
                {
                    params: { include_answers: false },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            
            setQuiz(response.data);
            setStartTime(Date.now());
            
            if (response.data.time_limit) {
                setTimeLeft(response.data.time_limit * 60); // Convert minutes to seconds
            }
            
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch quiz');
            setLoading(false);
            console.error('Error fetching quiz:', error);
        }
    };

    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
    };

    const handleNextQuestion = async () => {
        if (selectedAnswer && sessionId) {
            const currentQuestion = quiz.questions[currentQuestionIndex];
            
            try {
                const response = await axios.post(
                    `http://127.0.0.1:8000/quiz-sessions/${sessionId}/answers`,
                    {
                        question_id: currentQuestion.id,
                        answer: selectedAnswer,
                        time_taken: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0
                    },
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                setAnswers(prev => ({
                    ...prev,
                    [currentQuestion.id]: {
                        answer: selectedAnswer,
                        is_correct: response.data.is_correct,
                        correct_answer: response.data.correct_answer
                    }
                }));

                if (currentQuestionIndex < quiz.questions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setSelectedAnswer('');
                    setStartTime(Date.now());
                } else {
                    handleSubmitQuiz();
                }
            } catch (error) {
                setError('Failed to submit answer');
                console.error('Error submitting answer:', error);
            }
        }
    };

    const handleSubmitQuiz = async () => {
        if (!sessionId) return;

        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/quiz-sessions/${sessionId}/complete`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setResults(response.data);
            setIsSubmitted(true);
        } catch (error) {
            setError('Failed to submit quiz');
            console.error('Error submitting quiz:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#28a745';
        if (score >= 60) return '#ffc107';
        return '#dc3545';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div>Loading quiz...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</div>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (isSubmitted && results) {
        return (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1>Quiz Completed! 🎉</h1>
                    <div style={{ 
                        fontSize: '48px', 
                        fontWeight: 'bold', 
                        color: getScoreColor(results.score),
                        marginBottom: '10px'
                    }}>
                        {Math.round(results.score)}%
                    </div>
                    <p>You scored {results.correct_answers} out of {results.total_questions} questions correctly!</p>
                    <p>Time taken: {formatTime(results.time_taken)}</p>
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <h3>Review Your Answers:</h3>
                    {quiz.questions.map((question, index) => {
                        const userAnswer = answers[question.id];
                        return (
                            <div 
                                key={question.id} 
                                style={{ 
                                    marginBottom: '20px', 
                                    padding: '15px', 
                                    border: '1px solid #ddd', 
                                    borderRadius: '8px',
                                    backgroundColor: userAnswer?.is_correct ? '#d4edda' : '#f8d7da'
                                }}
                            >
                                <h4>Question {index + 1}:</h4>
                                <p>{question.text}</p>
                                
                                {question.options && (
                                    <div style={{ marginLeft: '20px' }}>
                                        {question.options.map((option, optIndex) => (
                                            <div 
                                                key={optIndex}
                                                style={{ 
                                                    padding: '5px',
                                                    backgroundColor: 
                                                        option === userAnswer?.correct_answer ? '#28a745' :
                                                        option === userAnswer?.answer && !userAnswer?.is_correct ? '#dc3545' :
                                                        'transparent',
                                                    color: 
                                                        option === userAnswer?.correct_answer || 
                                                        (option === userAnswer?.answer && !userAnswer?.is_correct) ? 'white' : 'black',
                                                    borderRadius: '4px',
                                                    marginBottom: '2px'
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                    <strong>Your Answer:</strong> {userAnswer?.answer || 'Not answered'}<br/>
                                    <strong>Correct Answer:</strong> {userAnswer?.correct_answer}<br/>
                                    <strong>Result:</strong> {userAnswer?.is_correct ? '✅ Correct' : '❌ Incorrect'}
                                </div>
                                
                                {question.explanation && (
                                    <div style={{ 
                                        marginTop: '10px', 
                                        padding: '10px', 
                                        backgroundColor: '#f8f9fa', 
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}>
                                        <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/progress')}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        View Progress
                    </button>
                </div>
            </div>
        );
    }

    if (!quiz) return null;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
            }}>
                <h2>{quiz.title}</h2>
                <div style={{ textAlign: 'right' }}>
                    {timeLeft !== null && (
                        <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold',
                            color: timeLeft < 300 ? '#dc3545' : '#28a745'
                        }}>
                            Time: {formatTime(timeLeft)}
                        </div>
                    )}
                    <div>Question {currentQuestionIndex + 1} of {quiz.questions.length}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{ 
                width: '100%', 
                backgroundColor: '#e9ecef', 
                borderRadius: '4px', 
                marginBottom: '30px',
                height: '8px'
            }}>
                <div style={{ 
                    width: `${progress}%`, 
                    backgroundColor: '#007bff', 
                    height: '100%', 
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                }}></div>
            </div>

            {/* Question Card */}
            <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '30px', 
                marginBottom: '30px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ marginBottom: '20px', color: '#333' }}>
                    {currentQuestion.text}
                </h3>

                {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                    <div style={{ marginBottom: '20px' }}>
                        {currentQuestion.options.map((option, index) => (
                            <label 
                                key={index}
                                style={{ 
                                    display: 'block', 
                                    padding: '12px', 
                                    margin: '8px 0',
                                    border: `2px solid ${selectedAnswer === option ? '#007bff' : '#ddd'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedAnswer === option ? '#e7f3ff' : 'white',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleAnswerSelect(option)}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option}
                                    checked={selectedAnswer === option}
                                    onChange={() => handleAnswerSelect(option)}
                                    style={{ marginRight: '10px' }}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}

                {currentQuestion.type === 'true_false' && (
                    <div style={{ marginBottom: '20px' }}>
                        {['True', 'False'].map((option) => (
                            <label 
                                key={option}
                                style={{ 
                                    display: 'block', 
                                    padding: '12px', 
                                    margin: '8px 0',
                                    border: `2px solid ${selectedAnswer === option ? '#007bff' : '#ddd'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedAnswer === option ? '#e7f3ff' : 'white',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => handleAnswerSelect(option)}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={option}
                                    checked={selectedAnswer === option}
                                    onChange={() => handleAnswerSelect(option)}
                                    style={{ marginRight: '10px' }}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}

                {currentQuestion.type === 'short_answer' && (
                    <div style={{ marginBottom: '20px' }}>
                        <textarea
                            value={selectedAnswer}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            placeholder="Enter your answer here..."
                            style={{ 
                                width: '100%', 
                                minHeight: '100px',
                                padding: '12px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '16px',
                                resize: 'vertical'
                            }}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#6c757d' }}>
                        Difficulty: {currentQuestion.difficulty} | Topic: {currentQuestion.topic}
                    </div>
                    
                    <button
                        onClick={handleNextQuestion}
                        disabled={!selectedAnswer}
                        style={{ 
                            padding: '12px 24px', 
                            backgroundColor: selectedAnswer ? '#007bff' : '#6c757d', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
                >
                    Exit Quiz
                </button>
            </div>
        </div>
    );
};

export default QuizSession;
