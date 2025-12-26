import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const LiveQuiz = ({ token }) => {
    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');
    const [liveSession, setLiveSession] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const socketRef = useRef(null);

    useEffect(() => {
        fetchQuizzes();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/quizzes');
            setQuizzes(response.data);
        } catch (error) {
            setError('Failed to fetch quizzes');
            console.error('Error fetching quizzes:', error);
        }
    };

    const createLiveQuiz = async () => {
        if (!selectedQuiz) {
            setError('Please select a quiz to make live');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/live-quiz',
                null,
                {
                    params: { quiz_id: selectedQuiz },
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setRoomCode(response.data.room_code);
            setLiveSession(response.data);
            setSuccess(`Live quiz created! Room code: ${response.data.room_code}`);
            setError(null);
            
            // Connect to WebSocket
            connectToWebSocket(response.data.room_code);
            
        } catch (error) {
            setError('Failed to create live quiz');
            console.error('Error creating live quiz:', error);
        }
        setLoading(false);
    };

    const joinLiveQuiz = async () => {
        if (!joinRoomCode) {
            setError('Please enter a room code');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `http://127.0.0.1:8000/live-quiz/${joinRoomCode}/join`,
                {},
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setLiveSession(response.data);
            setRoomCode(joinRoomCode);
            setParticipants(response.data.participants || []);
            setSuccess(`Successfully joined live quiz!`);
            setError(null);
            
            // Connect to WebSocket
            connectToWebSocket(joinRoomCode);
            
        } catch (error) {
            setError('Failed to join live quiz. Check the room code.');
            console.error('Error joining live quiz:', error);
        }
        setLoading(false);
    };

    const connectToWebSocket = (roomCode) => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // For this demo, we'll simulate WebSocket functionality
        // In a real implementation, you'd connect to your WebSocket server
        console.log(`Connecting to WebSocket for room: ${roomCode}`);
        
        // Simulate real-time updates
        const simulateUpdates = () => {
            setMessages(prev => [
                ...prev,
                {
                    type: 'system',
                    message: `Connected to room ${roomCode}`,
                    timestamp: new Date().toLocaleTimeString()
                }
            ]);
        };

        setTimeout(simulateUpdates, 1000);
    };

    const sendMessage = () => {
        if (!currentMessage.trim()) return;

        const message = {
            type: 'user',
            message: currentMessage,
            timestamp: new Date().toLocaleTimeString(),
            sender: 'You'
        };

        setMessages(prev => [...prev, message]);
        setCurrentMessage('');

        // In real implementation, send via WebSocket
        if (socketRef.current) {
            socketRef.current.emit('message', message);
        }
    };

    const leaveLiveQuiz = () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        setLiveSession(null);
        setRoomCode('');
        setJoinRoomCode('');
        setParticipants([]);
        setMessages([]);
        setSuccess(null);
        setError(null);
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode).then(() => {
            setSuccess('Room code copied to clipboard!');
            setTimeout(() => setSuccess(null), 3000);
        });
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>🔴 Live Quiz Sessions</h1>
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

            {!liveSession ? (
                <>
                    {/* Tab Navigation */}
                    <div style={{ 
                        display: 'flex', 
                        marginBottom: '20px', 
                        borderBottom: '1px solid #ddd' 
                    }}>
                        <button
                            onClick={() => setActiveTab('create')}
                            style={{ 
                                padding: '12px 24px', 
                                backgroundColor: activeTab === 'create' ? '#007bff' : 'transparent', 
                                color: activeTab === 'create' ? 'white' : '#007bff',
                                border: 'none',
                                borderBottom: activeTab === 'create' ? '3px solid #007bff' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Create Live Quiz
                        </button>
                        <button
                            onClick={() => setActiveTab('join')}
                            style={{ 
                                padding: '12px 24px', 
                                backgroundColor: activeTab === 'join' ? '#28a745' : 'transparent', 
                                color: activeTab === 'join' ? 'white' : '#28a745',
                                border: 'none',
                                borderBottom: activeTab === 'join' ? '3px solid #28a745' : '3px solid transparent',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            Join Live Quiz
                        </button>
                    </div>

                    {/* Create Live Quiz Tab */}
                    {activeTab === 'create' && (
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '30px', 
                            borderRadius: '8px' 
                        }}>
                            <h3>🎯 Create a Real-Time Quiz Session</h3>
                            <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                                Host a live quiz where participants can join in real-time and compete with each other!
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Select a Quiz to Make Live:
                                </label>
                                <select
                                    value={selectedQuiz}
                                    onChange={(e) => setSelectedQuiz(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        maxWidth: '400px',
                                        padding: '12px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        fontSize: '16px'
                                    }}
                                >
                                    <option value="">Choose a quiz...</option>
                                    {quizzes.map((quiz) => (
                                        <option key={quiz.id} value={quiz.id}>
                                            {quiz.title} ({quiz.questions.length} questions)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedQuiz && (
                                <div style={{ 
                                    marginBottom: '20px', 
                                    padding: '15px', 
                                    backgroundColor: 'white', 
                                    borderRadius: '8px',
                                    border: '1px solid #ddd'
                                }}>
                                    {(() => {
                                        const quiz = quizzes.find(q => q.id === selectedQuiz);
                                        return quiz ? (
                                            <>
                                                <h4 style={{ margin: '0 0 10px 0' }}>{quiz.title}</h4>
                                                <p style={{ margin: '0 0 10px 0', color: '#6c757d' }}>{quiz.description}</p>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                                                    <span><strong>Topic:</strong> {quiz.topic}</span>
                                                    <span><strong>Difficulty:</strong> {quiz.difficulty}</span>
                                                    <span><strong>Questions:</strong> {quiz.questions.length}</span>
                                                </div>
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                            )}

                            <button
                                onClick={createLiveQuiz}
                                disabled={loading || !selectedQuiz}
                                style={{ 
                                    padding: '12px 30px', 
                                    backgroundColor: loading || !selectedQuiz ? '#6c757d' : '#007bff', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: loading || !selectedQuiz ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Creating Live Session...' : 'Create Live Quiz Session'}
                            </button>

                            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
                                <h4>📝 How Live Quiz Works:</h4>
                                <ul style={{ paddingLeft: '20px' }}>
                                    <li>Create a live session from any existing quiz</li>
                                    <li>Share the room code with participants</li>
                                    <li>Participants join in real-time using the room code</li>
                                    <li>Everyone sees questions simultaneously</li>
                                    <li>Live leaderboard updates as answers are submitted</li>
                                    <li>Real-time chat for interaction</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Join Live Quiz Tab */}
                    {activeTab === 'join' && (
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '30px', 
                            borderRadius: '8px' 
                        }}>
                            <h3>🚀 Join a Live Quiz Session</h3>
                            <p style={{ marginBottom: '20px', color: '#6c757d' }}>
                                Enter a room code to join an active live quiz session!
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                    Room Code:
                                </label>
                                <input
                                    type="text"
                                    value={joinRoomCode}
                                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-character room code (e.g., ABC123)"
                                    maxLength="6"
                                    style={{ 
                                        width: '100%', 
                                        maxWidth: '300px',
                                        padding: '12px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        textAlign: 'center',
                                        letterSpacing: '2px'
                                    }}
                                />
                            </div>

                            <button
                                onClick={joinLiveQuiz}
                                disabled={loading || !joinRoomCode || joinRoomCode.length !== 6}
                                style={{ 
                                    padding: '12px 30px', 
                                    backgroundColor: loading || !joinRoomCode || joinRoomCode.length !== 6 ? '#6c757d' : '#28a745', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '4px', 
                                    cursor: loading || !joinRoomCode || joinRoomCode.length !== 6 ? 'not-allowed' : 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? 'Joining Session...' : 'Join Live Quiz'}
                            </button>

                            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
                                <h4>🎮 What to Expect:</h4>
                                <ul style={{ paddingLeft: '20px' }}>
                                    <li>Real-time quiz experience with other participants</li>
                                    <li>See your ranking on the live leaderboard</li>
                                    <li>Chat with other participants during the quiz</li>
                                    <li>Instant feedback on your answers</li>
                                    <li>Compete for the top spot!</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Live Session Interface */
                <div>
                    <div style={{ 
                        backgroundColor: '#e7f3ff', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 10px 0' }}>🔴 Live Session Active</h3>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ 
                                    fontSize: '24px', 
                                    fontWeight: 'bold', 
                                    fontFamily: 'monospace',
                                    padding: '8px 16px',
                                    backgroundColor: 'white',
                                    borderRadius: '4px',
                                    border: '2px dashed #007bff'
                                }}>
                                    {roomCode}
                                </div>
                                <button
                                    onClick={copyRoomCode}
                                    style={{ 
                                        padding: '8px 16px', 
                                        backgroundColor: '#28a745', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '4px', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    Copy Code
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={leaveLiveQuiz}
                            style={{ 
                                padding: '8px 16px', 
                                backgroundColor: '#dc3545', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '4px', 
                                cursor: 'pointer' 
                            }}
                        >
                            Leave Session
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        {/* Main Quiz Area */}
                        <div style={{ 
                            backgroundColor: 'white', 
                            padding: '20px', 
                            borderRadius: '8px',
                            border: '1px solid #ddd'
                        }}>
                            <h4>Quiz Dashboard</h4>
                            <div style={{ 
                                padding: '40px', 
                                textAlign: 'center', 
                                backgroundColor: '#f8f9fa', 
                                borderRadius: '8px' 
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
                                <h3>Waiting for Host to Start</h3>
                                <p>The quiz will begin shortly. Get ready!</p>
                                <div style={{ marginTop: '20px', fontSize: '14px', color: '#6c757d' }}>
                                    Quiz: {liveSession?.quiz_id ? 'Loaded' : 'Loading...'}<br/>
                                    Participants: {participants.length} joined
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Participants List */}
                            <div style={{ 
                                backgroundColor: 'white', 
                                padding: '15px', 
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}>
                                <h4>👥 Participants ({participants.length})</h4>
                                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {participants.length > 0 ? participants.map((participant, index) => (
                                        <div 
                                            key={index}
                                            style={{ 
                                                padding: '8px', 
                                                marginBottom: '5px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <span>{participant}</span>
                                            <span style={{ fontSize: '12px', color: '#28a745' }}>●</span>
                                        </div>
                                    )) : (
                                        <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                                            No participants yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Live Chat */}
                            <div style={{ 
                                backgroundColor: 'white', 
                                padding: '15px', 
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                flex: 1
                            }}>
                                <h4>💬 Live Chat</h4>
                                <div style={{ 
                                    height: '200px', 
                                    overflowY: 'auto', 
                                    backgroundColor: '#f8f9fa',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '10px'
                                }}>
                                    {messages.map((msg, index) => (
                                        <div 
                                            key={index}
                                            style={{ 
                                                marginBottom: '8px',
                                                padding: '6px',
                                                backgroundColor: msg.type === 'system' ? '#e2e3e5' : 'white',
                                                borderRadius: '4px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', color: msg.type === 'system' ? '#6c757d' : '#007bff' }}>
                                                {msg.sender || 'System'} 
                                                <span style={{ fontWeight: 'normal', marginLeft: '5px', color: '#6c757d' }}>
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            <div>{msg.message}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{ display: 'flex' }}>
                                    <input
                                        type="text"
                                        value={currentMessage}
                                        onChange={(e) => setCurrentMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        style={{ 
                                            flex: 1,
                                            padding: '8px', 
                                            border: '1px solid #ddd', 
                                            borderRadius: '4px 0 0 4px',
                                            borderRight: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        style={{ 
                                            padding: '8px 12px', 
                                            backgroundColor: '#007bff', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '0 4px 4px 0', 
                                            cursor: 'pointer' 
                                        }}
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveQuiz;
