import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuizDashboard = ({ token }) => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [topicFilter, setTopicFilter] = useState('');
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [generationLoading, setGenerationLoading] = useState(false);
    const navigate = useNavigate();

    const [questionGenForm, setQuestionGenForm] = useState({
        topic: '',
        difficulty: 'medium',
        question_type: 'multiple_choice',
        count: 5
    });

    useEffect(() => {
        fetchQuizzes();
    }, [topicFilter]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (topicFilter) params.append('topic', topicFilter);
            
            const response = await axios.get(`http://127.0.0.1:8000/quizzes?${params.toString()}`);
            setQuizzes(response.data);
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch quizzes');
            setLoading(false);
            console.error('Error fetching quizzes:', error);
        }
    };

    const generateQuestions = async () => {
        try {
            setGenerationLoading(true);
            setError(null);
            
            const response = await axios.post(
                'http://127.0.0.1:8000/quizzes/generate',
                questionGenForm,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setGeneratedQuestions(response.data);
            setGenerationLoading(false);
        } catch (error) {
            setError('Failed to generate questions using AI');
            setGenerationLoading(false);
            console.error('Error generating questions:', error);
        }
    };

    const startQuiz = async (quizId) => {
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/quiz-sessions',
                null,
                {
                    params: { quiz_id: quizId },
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            const sessionId = response.data.session_id;
            navigate(`/quiz/${quizId}?session=${sessionId}`);
        } catch (error) {
            setError('Failed to start quiz session');
            console.error('Error starting quiz:', error);
        }
    };

    const createQuizFromGenerated = () => {
        // Navigate to create quiz with generated questions
        navigate('/create-quiz', { state: { generatedQuestions } });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div>Loading quizzes...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Quiz Dashboard</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link 
                        to="/user-info" 
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#6c757d', 
                            color: 'white', 
                            textDecoration: 'none', 
                            borderRadius: '4px' 
                        }}
                    >
                        Profile
                    </Link>
                    <Link 
                        to="/create-quiz" 
                        style={{ 
                            padding: '8px 16px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            textDecoration: 'none', 
                            borderRadius: '4px' 
                        }}
                    >
                        Create Quiz
                    </Link>
                </div>
            </div>

            {error && (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8d7da', 
                    color: '#721c24', 
                    borderRadius: '4px', 
                    marginBottom: '20px' 
                }}>
                    {error}
                </div>
            )}

            {/* AI Question Generation Section */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '30px' 
            }}>
                <h3>🤖 AI-Powered Question Generation</h3>
                <p>Generate personalized questions using LLaMA AI based on your learning progress!</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Topic:</label>
                        <input
                            type="text"
                            value={questionGenForm.topic}
                            onChange={(e) => setQuestionGenForm({...questionGenForm, topic: e.target.value})}
                            placeholder="e.g., JavaScript, Python, Mathematics"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Difficulty:</label>
                        <select
                            value={questionGenForm.difficulty}
                            onChange={(e) => setQuestionGenForm({...questionGenForm, difficulty: e.target.value})}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Question Type:</label>
                        <select
                            value={questionGenForm.question_type}
                            onChange={(e) => setQuestionGenForm({...questionGenForm, question_type: e.target.value})}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        >
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="true_false">True/False</option>
                            <option value="short_answer">Short Answer</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Count:</label>
                        <input
                            type="number"
                            min="1"
                            max="20"
                            value={questionGenForm.count}
                            onChange={(e) => setQuestionGenForm({...questionGenForm, count: parseInt(e.target.value)})}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>
                </div>
                
                <button
                    onClick={generateQuestions}
                    disabled={generationLoading || !questionGenForm.topic}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: generationLoading ? '#6c757d' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: generationLoading ? 'not-allowed' : 'pointer' 
                    }}
                >
                    {generationLoading ? 'Generating with AI...' : 'Generate Questions'}
                </button>

                {generatedQuestions.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <h4>Generated Questions:</h4>
                        <div style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px', 
                            padding: '10px' 
                        }}>
                            {generatedQuestions.map((question, index) => (
                                <div key={index} style={{ 
                                    marginBottom: '15px', 
                                    padding: '10px', 
                                    backgroundColor: 'white', 
                                    borderRadius: '4px' 
                                }}>
                                    <p><strong>Q{index + 1}:</strong> {question.text}</p>
                                    {question.options && (
                                        <ul style={{ marginLeft: '20px' }}>
                                            {question.options.map((option, optIndex) => (
                                                <li key={optIndex}>{option}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <p style={{ fontSize: '12px', color: '#6c757d' }}>
                                        Difficulty: {question.difficulty} | Type: {question.type}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={createQuizFromGenerated}
                            style={{ 
                                marginTop: '10px',
                                padding: '8px 16px', 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Create Quiz from These Questions
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Filter by Topic:</label>
                <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder="Enter topic to filter..."
                    style={{ 
                        padding: '8px', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px', 
                        marginRight: '10px' 
                    }}
                />
                <button
                    onClick={() => setTopicFilter('')}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer' 
                    }}
                >
                    Clear Filter
                </button>
            </div>

            {/* Available Quizzes */}
            <h2>Available Quizzes</h2>
            {quizzes.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px' 
                }}>
                    <p>No quizzes found. Be the first to create one!</p>
                    <Link 
                        to="/create-quiz"
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#28a745', 
                            color: 'white', 
                            textDecoration: 'none', 
                            borderRadius: '4px' 
                        }}
                    >
                        Create Your First Quiz
                    </Link>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                    gap: '20px' 
                }}>
                    {quizzes.map((quiz) => (
                        <div 
                            key={quiz.id} 
                            style={{ 
                                border: '1px solid #ddd', 
                                borderRadius: '8px', 
                                padding: '20px', 
                                backgroundColor: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h3 style={{ marginTop: 0, color: '#007bff' }}>{quiz.title}</h3>
                            {quiz.description && (
                                <p style={{ color: '#6c757d', marginBottom: '15px' }}>
                                    {quiz.description}
                                </p>
                            )}
                            
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span><strong>Topic:</strong> {quiz.topic}</span>
                                    <span><strong>Difficulty:</strong> {quiz.difficulty}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span><strong>Questions:</strong> {quiz.questions.length}</span>
                                    <span><strong>Created by:</strong> {quiz.created_by}</span>
                                </div>
                                {quiz.time_limit && (
                                    <div><strong>Time Limit:</strong> {quiz.time_limit} minutes</div>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => startQuiz(quiz.id)}
                                    style={{ 
                                        flex: 1,
                                        padding: '10px', 
                                        backgroundColor: '#007bff', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Start Quiz
                                </button>
                                <Link
                                    to={`/quiz/${quiz.id}`}
                                    style={{ 
                                        flex: 1,
                                        display: 'block',
                                        textAlign: 'center',
                                        padding: '10px', 
                                        backgroundColor: '#28a745', 
                                        color: 'white', 
                                        textDecoration: 'none', 
                                        borderRadius: '4px' 
                                    }}
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizDashboard;
