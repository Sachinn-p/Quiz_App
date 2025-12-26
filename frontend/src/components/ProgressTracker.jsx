import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ProgressTracker = ({ token }) => {
    const [progressData, setProgressData] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [topicAnalysis, setTopicAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    useEffect(() => {
        fetchProgress();
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            fetchTopicAnalysis(selectedTopic);
        }
    }, [selectedTopic]);

    const fetchProgress = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/user-progress', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProgressData(response.data);
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch progress data');
            setLoading(false);
            console.error('Error fetching progress:', error);
        }
    };

    const fetchTopicAnalysis = async (topic) => {
        try {
            setAnalysisLoading(true);
            const response = await axios.get(`http://127.0.0.1:8000/user-progress/${topic}/analysis`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setTopicAnalysis(response.data);
            setAnalysisLoading(false);
        } catch (error) {
            console.error('Error fetching topic analysis:', error);
            setAnalysisLoading(false);
        }
    };

    const calculateAccuracy = (correct, total) => {
        return total > 0 ? Math.round((correct / total) * 100) : 0;
    };

    const getPerformanceLevel = (accuracy) => {
        if (accuracy >= 80) return { level: 'Excellent', color: '#28a745', icon: '🏆' };
        if (accuracy >= 70) return { level: 'Good', color: '#17a2b8', icon: '👍' };
        if (accuracy >= 60) return { level: 'Average', color: '#ffc107', icon: '📈' };
        return { level: 'Needs Improvement', color: '#dc3545', icon: '📚' };
    };

    const getProgressBarColor = (accuracy) => {
        if (accuracy >= 80) return '#28a745';
        if (accuracy >= 60) return '#ffc107';
        return '#dc3545';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div>Loading progress data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <div style={{ color: '#dc3545', marginBottom: '20px' }}>{error}</div>
                <Link 
                    to="/dashboard"
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '4px' 
                    }}
                >
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const totalQuestions = progressData.reduce((sum, topic) => sum + topic.total_questions, 0);
    const totalCorrect = progressData.reduce((sum, topic) => sum + topic.correct_answers, 0);
    const overallAccuracy = calculateAccuracy(totalCorrect, totalQuestions);

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Learning Progress Tracker</h1>
                <Link 
                    to="/dashboard"
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#6c757d', 
                        color: 'white', 
                        textDecoration: 'none', 
                        borderRadius: '4px' 
                    }}
                >
                    Back to Dashboard
                </Link>
            </div>

            {/* Overall Statistics */}
            <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '30px' 
            }}>
                <h3>📊 Overall Statistics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>{totalQuestions}</div>
                        <div>Total Questions</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>{totalCorrect}</div>
                        <div>Correct Answers</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: getProgressBarColor(overallAccuracy) }}>
                            {overallAccuracy}%
                        </div>
                        <div>Overall Accuracy</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>{progressData.length}</div>
                        <div>Topics Studied</div>
                    </div>
                </div>
            </div>

            {progressData.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px' 
                }}>
                    <h3>No Progress Data Yet</h3>
                    <p>Start taking quizzes to see your learning progress!</p>
                    <Link 
                        to="/dashboard"
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            textDecoration: 'none', 
                            borderRadius: '4px' 
                        }}
                    >
                        Take Your First Quiz
                    </Link>
                </div>
            ) : (
                <>
                    {/* Topic Progress Cards */}
                    <div style={{ marginBottom: '30px' }}>
                        <h3>📚 Progress by Topic</h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                            gap: '20px' 
                        }}>
                            {progressData.map((topic, index) => {
                                const accuracy = calculateAccuracy(topic.correct_answers, topic.total_questions);
                                const performance = getPerformanceLevel(accuracy);
                                
                                return (
                                    <div 
                                        key={index}
                                        style={{ 
                                            border: '1px solid #ddd', 
                                            borderRadius: '8px', 
                                            padding: '20px', 
                                            backgroundColor: 'white',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onClick={() => setSelectedTopic(selectedTopic === topic.topic ? '' : topic.topic)}
                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h4 style={{ margin: 0, color: '#007bff' }}>{topic.topic}</h4>
                                            <span style={{ fontSize: '24px' }}>{performance.icon}</span>
                                        </div>

                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                <span>Accuracy</span>
                                                <span style={{ fontWeight: 'bold', color: performance.color }}>
                                                    {accuracy}% ({performance.level})
                                                </span>
                                            </div>
                                            <div style={{ 
                                                width: '100%', 
                                                backgroundColor: '#e9ecef', 
                                                borderRadius: '4px', 
                                                height: '8px'
                                            }}>
                                                <div style={{ 
                                                    width: `${accuracy}%`, 
                                                    backgroundColor: getProgressBarColor(accuracy), 
                                                    height: '100%', 
                                                    borderRadius: '4px',
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                                            <div>
                                                <strong>Questions:</strong> {topic.total_questions}
                                            </div>
                                            <div>
                                                <strong>Correct:</strong> {topic.correct_answers}
                                            </div>
                                            <div>
                                                <strong>Wrong:</strong> {topic.wrong_answers}
                                            </div>
                                            <div>
                                                <strong>Avg Score:</strong> {Math.round(topic.average_score)}%
                                            </div>
                                        </div>

                                        {topic.strengths && topic.strengths.length > 0 && (
                                            <div style={{ marginTop: '10px' }}>
                                                <div style={{ fontSize: '12px', color: '#28a745' }}>
                                                    <strong>Strengths:</strong> {topic.strengths.join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        {topic.weaknesses && topic.weaknesses.length > 0 && (
                                            <div style={{ marginTop: '5px' }}>
                                                <div style={{ fontSize: '12px', color: '#dc3545' }}>
                                                    <strong>Areas to improve:</strong> {topic.weaknesses.join(', ')}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
                                            Last activity: {new Date(topic.last_activity).toLocaleDateString()}
                                        </div>

                                        {/* Difficulty Breakdown */}
                                        <div style={{ marginTop: '15px' }}>
                                            <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Difficulty Progress:
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                                                <span style={{ color: '#28a745' }}>Easy: {topic.difficulty_progress.easy}</span>
                                                <span style={{ color: '#ffc107' }}>Medium: {topic.difficulty_progress.medium}</span>
                                                <span style={{ color: '#dc3545' }}>Hard: {topic.difficulty_progress.hard}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {selectedTopic && (
                        <div style={{ 
                            backgroundColor: '#e7f3ff', 
                            padding: '20px', 
                            borderRadius: '8px', 
                            marginBottom: '30px' 
                        }}>
                            <h3>🤖 AI Analysis for {selectedTopic}</h3>
                            
                            {analysisLoading ? (
                                <div>Analyzing your performance with AI...</div>
                            ) : topicAnalysis ? (
                                <div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Performance Level</h4>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {topicAnalysis.performance_level}
                                            </div>
                                        </div>
                                        
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>Recommended Difficulty</h4>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                {topicAnalysis.recommended_difficulty}
                                            </div>
                                        </div>
                                    </div>

                                    {topicAnalysis.focus_areas && topicAnalysis.focus_areas.length > 0 && (
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#dc3545' }}>Focus Areas</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {topicAnalysis.focus_areas.map((area, index) => (
                                                    <li key={index}>{area}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {topicAnalysis.next_topics && topicAnalysis.next_topics.length > 0 && (
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Suggested Next Topics</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {topicAnalysis.next_topics.map((topic, index) => (
                                                    <li key={index}>{topic}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {topicAnalysis.study_suggestions && topicAnalysis.study_suggestions.length > 0 && (
                                        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
                                            <h4 style={{ margin: '0 0 10px 0', color: '#17a2b8' }}>Study Suggestions</h4>
                                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                {topicAnalysis.study_suggestions.map((suggestion, index) => (
                                                    <li key={index}>{suggestion}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>No analysis available for this topic.</div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link 
                                to="/dashboard"
                                style={{ 
                                    padding: '12px 24px', 
                                    backgroundColor: '#007bff', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Take Another Quiz
                            </Link>
                            
                            <Link 
                                to="/create-quiz"
                                style={{ 
                                    padding: '12px 24px', 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Create New Quiz
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProgressTracker;
