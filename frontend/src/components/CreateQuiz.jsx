import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CreateQuiz = ({ token }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [quiz, setQuiz] = useState({
        title: '',
        description: '',
        topic: '',
        difficulty: 'medium',
        time_limit: '',
        is_public: true,
        questions: []
    });
    
    const [currentQuestion, setCurrentQuestion] = useState({
        text: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        difficulty: 'medium',
        topic: '',
        tags: []
    });
    
    const [editingIndex, setEditingIndex] = useState(-1);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if we have generated questions from the dashboard
        if (location.state?.generatedQuestions) {
            const generatedQuestions = location.state.generatedQuestions;
            setQuiz(prev => ({
                ...prev,
                questions: generatedQuestions,
                topic: generatedQuestions[0]?.topic || '',
                difficulty: generatedQuestions[0]?.difficulty || 'medium'
            }));
        }
    }, [location.state]);

    const handleQuizChange = (field, value) => {
        setQuiz(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleQuestionChange = (field, value) => {
        setCurrentQuestion(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    const addOption = () => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const removeOption = (index) => {
        if (currentQuestion.options.length > 2) {
            const newOptions = currentQuestion.options.filter((_, i) => i !== index);
            setCurrentQuestion(prev => ({
                ...prev,
                options: newOptions
            }));
        }
    };

    const addQuestion = () => {
        if (!currentQuestion.text || !currentQuestion.correct_answer) {
            setError('Please fill in the question text and correct answer');
            return;
        }

        if (currentQuestion.type === 'multiple_choice' && 
            (!currentQuestion.options || currentQuestion.options.filter(opt => opt.trim()).length < 2)) {
            setError('Multiple choice questions need at least 2 options');
            return;
        }

        const questionToAdd = {
            ...currentQuestion,
            topic: currentQuestion.topic || quiz.topic,
            difficulty: currentQuestion.difficulty || quiz.difficulty,
            id: Date.now().toString() // Temporary ID
        };

        if (editingIndex >= 0) {
            const updatedQuestions = [...quiz.questions];
            updatedQuestions[editingIndex] = questionToAdd;
            setQuiz(prev => ({
                ...prev,
                questions: updatedQuestions
            }));
            setEditingIndex(-1);
            setSuccess('Question updated successfully');
        } else {
            setQuiz(prev => ({
                ...prev,
                questions: [...prev.questions, questionToAdd]
            }));
            setSuccess('Question added successfully');
        }

        // Reset form
        setCurrentQuestion({
            text: '',
            type: 'multiple_choice',
            options: ['', '', '', ''],
            correct_answer: '',
            explanation: '',
            difficulty: quiz.difficulty,
            topic: quiz.topic,
            tags: []
        });
        setError(null);
    };

    const editQuestion = (index) => {
        setCurrentQuestion(quiz.questions[index]);
        setEditingIndex(index);
    };

    const deleteQuestion = (index) => {
        const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
        setQuiz(prev => ({
            ...prev,
            questions: updatedQuestions
        }));
    };

    const createQuiz = async () => {
        if (!quiz.title || !quiz.topic || quiz.questions.length === 0) {
            setError('Please fill in title, topic, and add at least one question');
            return;
        }

        setLoading(true);
        try {
            const quizData = {
                ...quiz,
                time_limit: quiz.time_limit ? parseInt(quiz.time_limit) : null
            };

            const response = await axios.post(
                'http://127.0.0.1:8000/quizzes',
                quizData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess('Quiz created successfully!');
            setError(null);
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);

        } catch (error) {
            setError('Failed to create quiz. Please try again.');
            console.error('Error creating quiz:', error);
        }
        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Create New Quiz</h1>
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
                    Back to Dashboard
                </button>
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

            {success && (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#d4edda', 
                    color: '#155724', 
                    borderRadius: '4px', 
                    marginBottom: '20px' 
                }}>
                    {success}
                </div>
            )}

            {/* Quiz Information Form */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '30px' 
            }}>
                <h3>Quiz Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title *</label>
                        <input
                            type="text"
                            value={quiz.title}
                            onChange={(e) => handleQuizChange('title', e.target.value)}
                            placeholder="Enter quiz title"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Topic *</label>
                        <input
                            type="text"
                            value={quiz.topic}
                            onChange={(e) => handleQuizChange('topic', e.target.value)}
                            placeholder="e.g., JavaScript, Mathematics"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Difficulty</label>
                        <select
                            value={quiz.difficulty}
                            onChange={(e) => handleQuizChange('difficulty', e.target.value)}
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
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time Limit (minutes)</label>
                        <input
                            type="number"
                            value={quiz.time_limit}
                            onChange={(e) => handleQuizChange('time_limit', e.target.value)}
                            placeholder="Optional"
                            min="1"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    </div>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                    <textarea
                        value={quiz.description}
                        onChange={(e) => handleQuizChange('description', e.target.value)}
                        placeholder="Brief description of the quiz"
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            minHeight: '80px'
                        }}
                    />
                </div>
                
                <div style={{ marginTop: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            checked={quiz.is_public}
                            onChange={(e) => handleQuizChange('is_public', e.target.checked)}
                            style={{ marginRight: '8px' }}
                        />
                        Make this quiz public
                    </label>
                </div>
            </div>

            {/* Add Question Form */}
            <div style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px', 
                marginBottom: '30px' 
            }}>
                <h3>{editingIndex >= 0 ? 'Edit Question' : 'Add New Question'}</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Question Text *</label>
                    <textarea
                        value={currentQuestion.text}
                        onChange={(e) => handleQuestionChange('text', e.target.value)}
                        placeholder="Enter your question here"
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            minHeight: '80px'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Question Type</label>
                        <select
                            value={currentQuestion.type}
                            onChange={(e) => handleQuestionChange('type', e.target.value)}
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
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Difficulty</label>
                        <select
                            value={currentQuestion.difficulty}
                            onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
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
                </div>

                {/* Options for Multiple Choice */}
                {currentQuestion.type === 'multiple_choice' && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Answer Options</label>
                        {currentQuestion.options.map((option, index) => (
                            <div key={index} style={{ display: 'flex', marginBottom: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    style={{ 
                                        flex: 1,
                                        padding: '8px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        marginRight: '8px'
                                    }}
                                />
                                {currentQuestion.options.length > 2 && (
                                    <button
                                        onClick={() => removeOption(index)}
                                        style={{ 
                                            padding: '8px 12px', 
                                            backgroundColor: '#dc3545', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addOption}
                            style={{ 
                                padding: '6px 12px', 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Add Option
                        </button>
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Correct Answer *</label>
                    {currentQuestion.type === 'multiple_choice' ? (
                        <select
                            value={currentQuestion.correct_answer}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        >
                            <option value="">Select correct answer</option>
                            {currentQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                                <option key={index} value={option}>{option}</option>
                            ))}
                        </select>
                    ) : currentQuestion.type === 'true_false' ? (
                        <select
                            value={currentQuestion.correct_answer}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        >
                            <option value="">Select answer</option>
                            <option value="True">True</option>
                            <option value="False">False</option>
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={currentQuestion.correct_answer}
                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                            placeholder="Enter the correct answer"
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ddd', 
                                borderRadius: '4px' 
                            }}
                        />
                    )}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Explanation (Optional)</label>
                    <textarea
                        value={currentQuestion.explanation}
                        onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                        placeholder="Explain why this is the correct answer"
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            minHeight: '60px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={addQuestion}
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        {editingIndex >= 0 ? 'Update Question' : 'Add Question'}
                    </button>
                    
                    {editingIndex >= 0 && (
                        <button
                            onClick={() => {
                                setEditingIndex(-1);
                                setCurrentQuestion({
                                    text: '',
                                    type: 'multiple_choice',
                                    options: ['', '', '', ''],
                                    correct_answer: '',
                                    explanation: '',
                                    difficulty: quiz.difficulty,
                                    topic: quiz.topic,
                                    tags: []
                                });
                            }}
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#6c757d', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </div>

            {/* Questions List */}
            {quiz.questions.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>Questions ({quiz.questions.length})</h3>
                    {quiz.questions.map((question, index) => (
                        <div 
                            key={index}
                            style={{ 
                                border: '1px solid #ddd', 
                                borderRadius: '8px', 
                                padding: '15px', 
                                marginBottom: '15px',
                                backgroundColor: 'white'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h4>Q{index + 1}: {question.text}</h4>
                                    {question.options && (
                                        <ul style={{ marginLeft: '20px' }}>
                                            {question.options.map((option, optIndex) => (
                                                <li 
                                                    key={optIndex}
                                                    style={{ 
                                                        color: option === question.correct_answer ? '#28a745' : 'inherit',
                                                        fontWeight: option === question.correct_answer ? 'bold' : 'normal'
                                                    }}
                                                >
                                                    {option} {option === question.correct_answer && '✓'}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {question.type !== 'multiple_choice' && (
                                        <p><strong>Correct Answer:</strong> {question.correct_answer}</p>
                                    )}
                                    <p style={{ fontSize: '12px', color: '#6c757d' }}>
                                        Type: {question.type} | Difficulty: {question.difficulty}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => editQuestion(index)}
                                        style={{ 
                                            padding: '5px 10px', 
                                            backgroundColor: '#ffc107', 
                                            color: 'black', 
                                            border: 'none', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteQuestion(index)}
                                        style={{ 
                                            padding: '5px 10px', 
                                            backgroundColor: '#dc3545', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '4px', 
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Quiz Button */}
            <div style={{ textAlign: 'center' }}>
                <button
                    onClick={createQuiz}
                    disabled={loading || quiz.questions.length === 0}
                    style={{ 
                        padding: '12px 30px', 
                        backgroundColor: loading || quiz.questions.length === 0 ? '#6c757d' : '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: loading || quiz.questions.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'Creating Quiz...' : `Create Quiz (${quiz.questions.length} questions)`}
                </button>
            </div>
        </div>
    );
};

export default CreateQuiz;
