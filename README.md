# 🧠 AI Quiz App

A quiz application powered by FastAPI and ReactJS with intelligent question generation using Groq's LLaMA models.

## ✨ Features

- **🤖 AI-Powered Question Generation**: Automatic question creation using Groq's LLaMA LLM
- **⚡ Real-time Quiz Sessions**: Live multiplayer quizzes with WebSocket support
- **🎯 Multiple Question Types**: Support for multiple choice, true/false, and short answer questions
- **🏆 Live Leaderboards**: Real-time scoring and competitive features

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **Python** (3.8 or higher)
3. **MongoDB** (local installation or cloud instance)
4. **Groq API Key** (sign up at [Groq Console](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sachinn-p/Quiz_App.git
   cd Quiz_App
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file and add your GROQ_API_KEY
   ```

3. **Backend Setup**
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start MongoDB (if running locally)
   sudo systemctl start mongod
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

5. **Start the application**
   ```bash
   # Make the startup script executable
   chmod +x start.sh
   
   # Run the application
   ./start.sh
   ```

   Or start manually:
   ```bash
   # Terminal 1: Backend
   cd backend && python main.py
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required: Groq API Key
GROQ_API_KEY=your_groq_api_key_here

# Optional: MongoDB URL (defaults to local)
MONGODB_URL=mongodb://localhost:27017/
```

### Groq API Setup

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up for an account
3. Generate an API key
4. Add the key to your `.env` file
### 🎨 Modern Frontend
- **Responsive Design**: Mobile-friendly interface
- **Real-Time Updates**: Live notifications and score updates
- **Intuitive UI**: Clean, modern design with smooth interactions
- **Progressive Features**: Enhanced UX with loading states and error handling

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── main.py              # FastAPI application with all endpoints
├── models.py            # Pydantic models for data validation
├── database.py          # MongoDB connection setup
├── services/
│   └── llm_service.py   # LLaMA integration service
└── requirements.txt     # Python dependencies
```

### Frontend (React)
```
frontend/
├── src/
│   ├── App.jsx              # Main application router
│   ├── components/
│   │   ├── QuickQuiz.jsx     # Quick quiz interface
│   │   ├── QuizDashboard.jsx # Main quiz browsing interface
│   │   ├── QuizSession.jsx   # Quiz taking interface
│   │   ├── CreateQuiz.jsx    # Quiz creation form
│   │   ├── ProgressTracker.jsx # Learning analytics
│   │   └── LiveQuiz.jsx      # Real-time quiz sessions
│   └── main.jsx
└── package.json
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 16+**
- **MongoDB** (local or cloud)
- **Ollama** (for LLaMA integration)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update connection string in `database.py` if needed

5. **Set up LLaMA:**
   ```bash
   # Install Ollama (https://ollama.ai)
   ollama pull llama3.2:latest
   ```

6. **Run the backend:**
   ```bash
   python main.py
   ```
   Backend will be available at `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

## 📡 API Endpoints

### Quiz Management
- `POST /quizzes` - Create new quiz
- `GET /quizzes` - Get all public quizzes
- `GET /quizzes/{quiz_id}` - Get specific quiz
- `POST /quizzes/generate` - Generate AI questions

### Quiz Sessions
- `POST /quiz-sessions` - Start quiz session
- `POST /quiz-sessions/{session_id}/answers` - Submit answer
- `POST /quiz-sessions/{session_id}/complete` - Complete quiz

### Live Quiz
- `POST /live-quiz` - Create live quiz session
- `POST /live-quiz/{room_code}/join` - Join live session
- `WebSocket /ws/{room_code}` - Real-time communication

## 🤖 LLaMA Integration

The application uses **LLaMA 3.2** for intelligent question generation:

### Features:
- **Context-Aware Generation**: Questions based on topic and difficulty
- **Multiple Question Types**: Support for MCQ, true/false, and more
- **Customizable Difficulty**: Easy, medium, and hard levels

### Configuration:
```python
# In services/llm_service.py
model_name = "llama3.2:latest"  # Configurable model
temperature = 0.7               # Response creativity
top_p = 0.9                    # Response diversity
```

## 🔄 Real-Time Features

### WebSocket Events:
- **Room Join/Leave**: Participant management
- **Live Scoring**: Real-time score updates
- **Chat Messages**: Live communication
- **Question Sync**: Synchronized question display
- **Leaderboard Updates**: Live ranking changes

### Implementation:
```javascript
// Frontend WebSocket connection
const socket = io('ws://localhost:8000');
socket.emit('join_room', { room_code: 'ABC123' });
socket.on('score_update', (data) => updateLeaderboard(data));
```

## 📊 Data Models

### Core Models:
- **Quiz**: Quiz metadata and questions
- **Question**: Individual quiz questions with options
- **QuizSession**: Quiz attempt tracking
- **LiveQuizSession**: Real-time session management

### Database Collections:
- `quizzes` - Quiz content and metadata
- `quiz_sessions` - Individual quiz attempts
- `live_quiz_sessions` - Real-time session data

## 🎯 Key Features Implementation

### 1. AI Question Generation
```python
# Generate questions
questions = await llm_service.generate_questions(
    topic="JavaScript",
    difficulty="medium",
    question_type="multiple_choice",
    count=5
)
```

### 2. Real-Time Quiz Sessions
```python
# WebSocket connection management
@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    await manager.connect(websocket, room_code)
    # Handle real-time events
```

## 🚀 Deployment

### Backend Deployment (Heroku/Railway):
```bash
# Create Procfile
echo "web: uvicorn main:app --host=0.0.0.0 --port=\$PORT" > Procfile

# Deploy with environment variables
MONGODB_URL=your_mongodb_connection_string
SECRET_KEY=your_jwt_secret_key
```

### Frontend Deployment (Vercel/Netlify):
```bash
npm run build
# Deploy dist/ folder
```

## 🛡️ Security Features

- **CORS Protection**: Configured for specific origins
- **Input Validation**: Pydantic model validation
- **NoSQL Injection Prevention**: MongoDB ODM protection

## 🔧 Configuration

### Environment Variables:
```env
# Backend
MONGODB_URL=mongodb://localhost:27017/

# LLaMA Service
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
```

## 📈 Performance Optimizations

- **Async/Await**: Non-blocking I/O operations
- **Connection Pooling**: MongoDB connection optimization
- **Lazy Loading**: Component-based loading
- **Caching**: Response caching for static data
- **WebSocket Optimization**: Efficient real-time communication

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Modern, fast web framework
- **React** - Frontend library
- **LLaMA** - AI language model by Meta
- **MongoDB** - NoSQL database
- **Socket.IO** - Real-time communication

---

## 📞 Support

For support, email [your-email@domain.com] or create an issue in the repository.

**Built with ❤️ using FastAPI, React, and LLaMA AI**
